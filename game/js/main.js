'use strict';
// ---------------------------------------------------------------------------
// Game loop, scene management, rendering pipeline, walkable places
// ---------------------------------------------------------------------------
const [worldC, wctx] = makeCanvas(W, H);
// glowing windows etc. are drawn on their own layer, with the people cut out of it so they stand in front
const [emC, ectx] = makeCanvas(W, H);
const [actC, actx] = makeCanvas(W, H);

const Game = {
  scenes: {}, scene: null, sceneId: null,
  t: 0, timers: [], fade: 1, fadeAnim: null, lock: 0,
  transitioning: false, hudHidden: false, error: null, flash: 0,

  busy() { return !!(Dlg.active || Menu.active || Fishing.active || Chart.active || this.transitioning || this.lock > 0); },

  fadeTo(v, dur) {
    return new Promise(res => { this.fadeAnim = { from: this.fade, to: v, t: 0, dur: dur || 0.4, res }; });
  },

  async goto(id, params) {
    if (this.transitioning) return;
    this.transitioning = true;
    await this.fadeTo(1, 0.35);
    this.setScene(id, params || {});
    await wait(0.05);
    this.transitioning = false;
    await this.fadeTo(0, 0.4);
  },

  setScene(id, params) {
    const sc = this.scenes[id];
    if (!sc) throw new Error('No scene ' + id);
    if (this.scene && this.scene.exit) this.scene.exit();
    this.scene = sc; this.sceneId = id;
    Fishing.active = null;
    sc.enter(params || {});
  },

  // run an async script while blocking player input
  async run(fn) {
    this.lock++;
    try { return await fn(); }
    catch (e) { console.error(e); this.error = String(e && e.stack || e); }
    finally { this.lock--; Input.consume('act'); }
  },

  update(dt) {
    this.t += dt;
    if (this.fadeAnim) {
      const f = this.fadeAnim;
      f.t += dt;
      this.fade = lerp(f.from, f.to, clamp(f.t / f.dur, 0, 1));
      if (f.t >= f.dur) { this.fadeAnim = null; f.res(); }
    }
    for (const tm of this.timers) tm.t -= dt;
    const due = this.timers.filter(tm => tm.t <= 0);
    this.timers = this.timers.filter(tm => tm.t > 0);
    due.forEach(tm => tm.res());

    if (Input.pressed('mute')) { Sound.setEnabled(!Sound.enabled); Save.saveSettings(); Toast.show('Sound ' + (Sound.enabled ? 'on' : 'off')); }
    if (Input.pressed('fullscreen')) toggleFullscreen();

    Sound.update(dt);
    Toast.update(dt); Banner.update(dt); GoalNote.update(dt);

    if (Dlg.active) Dlg.update(dt);
    else if (Menu.active) Menu.update(dt);
    else if (Chart.active) Chart.update(dt);
    else if (Fishing.active) Fishing.update(dt);
    if (this.flash > 0) this.flash -= dt * 0.8;

    const free = !this.busy();
    if (free && this.scene && this.scene.hud && S) {
      if (Input.pressed('inv')) { this.run(openInventory); }
      else if (Input.pressed('journal')) { this.run(openJournal); }
      else if (Input.pressed('back')) { this.run(openPause); }
    }
    if (this.scene) this.scene.update(dt, !this.busy());
    if (this.scene && this.scene.hud) GoalNote.check();
  },

  draw() {
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (this.scene) this.scene.draw(ctx);
    Fishing.draw(ctx);
    if (this.flash > 0) { ctx.globalAlpha = clamp(this.flash, 0, 1); rect(ctx, 0, 0, W, H, '#fff8e0'); ctx.globalAlpha = 1; }
    if (this.scene && this.scene.hud && !this.hudHidden && !Chart.active) drawHUD(ctx);
    Chart.draw(ctx);
    Banner.draw(ctx);
    GoalNote.draw(ctx);
    Toast.draw(ctx);
    Dlg.draw(ctx);
    Menu.draw(ctx);
    if (this.fade > 0.001) { ctx.globalAlpha = this.fade; rect(ctx, 0, 0, W, H, '#000'); ctx.globalAlpha = 1; }
    if (this.error) {
      rect(ctx, 0, 0, W, 60, '#400');
      wrapText('Error: ' + this.error, W - 10).slice(0, 5).forEach((l, i) => drawText(ctx, l, 5, 4 + i * 10, '#fff'));
    }
    present();
  },
};

window.addEventListener('error', e => { Game.error = (e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno; });
window.addEventListener('unhandledrejection', e => { Game.error = String(e.reason && e.reason.stack || e.reason); });

// ---------------------------------------------------------------------------
// World compositing: draws world layer, applies time-of-day tint, then lights
// ---------------------------------------------------------------------------
function composeWorld(c, drawFn, h, weather, tintScale) {
  wctx.globalCompositeOperation = 'source-over';
  wctx.globalAlpha = 1;
  wctx.clearRect(0, 0, W, H);
  drawFn(wctx);
  const tint = worldTint(h, weather);
  if (tintScale !== undefined) tint.a *= tintScale;
  if (tint.a > 0.005) {
    wctx.globalCompositeOperation = 'source-atop';
    wctx.globalAlpha = tint.a;
    wctx.fillStyle = tint.col;
    wctx.fillRect(0, 0, W, H);
    wctx.globalAlpha = 1;
    wctx.globalCompositeOperation = 'source-over';
  }
  c.drawImage(worldC, 0, 0);
}

function drawLights(c, lights, nf) {
  if (!lights || !lights.length) return;
  c.globalCompositeOperation = 'lighter';
  for (const L of lights) {
    const a = (L.always ? 1 : nf) * (L.a === undefined ? 0.5 : L.a) * (L.flicker ? (0.85 + 0.15 * Math.sin(Game.t * 13 + L.x)) : 1);
    if (a < 0.02) continue;
    c.globalAlpha = Math.min(1, a);
    const g = glowSprite(L.r, L.col || '#ffb860', 4, 0.6);
    c.drawImage(g, Math.round(L.x - L.r), Math.round(L.y - L.r));
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

// ---------------- weather overlays ----------------
const Weather = {
  drops: [],
  rain(c, t, intensity, wind) {
    const n = Math.floor(160 * intensity);
    while (this.drops.length < n) this.drops.push({ x: Math.random() * W, y: Math.random() * H, s: 180 + Math.random() * 120 });
    c.fillStyle = 'rgba(190,210,230,0.45)';
    for (let i = 0; i < n; i++) {
      const d = this.drops[i];
      d.y += d.s / 60; d.x += (wind || -0.4) * d.s / 60;
      if (d.y > H) { d.y = -4; d.x = Math.random() * (W + 60); }
      if (d.x < -10) d.x += W + 20;
      c.fillRect(d.x | 0, d.y | 0, 1, 3);
    }
  },
  fog(c, t, camX, density, col) {
    col = col || '#c4ccd2';
    for (let layer = 0; layer < 3; layer++) {
      const y0 = 40 + layer * 60;
      for (let x = -40; x < W + 40; x += 8) {
        const wx = x + camX * (0.3 + layer * 0.3) + t * (4 + layer * 3);
        const n = Math.sin(wx * 0.013 + layer) * 0.5 + Math.sin(wx * 0.031 + t * 0.2) * 0.5;
        const a = density * (0.18 + n * 0.1);
        if (a <= 0.01) continue;
        c.globalAlpha = a;
        c.fillStyle = col;
        const xx = Math.round(x - ((camX * (0.3 + layer * 0.3) + t * (4 + layer * 3)) % 8));
        c.fillRect(xx, y0 + Math.round(Math.sin(wx * 0.02) * 10), 8, 90);
      }
    }
    c.globalAlpha = density * 0.35;
    c.fillStyle = col;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  },
  flash: 0,
};

// ---------------------------------------------------------------------------
// Walkable place scene
// ---------------------------------------------------------------------------
class Place {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.hud = true;
    this.static = null;
    this.player = { x: 100, facing: 1, walking: false, anim: 0 };
    this.cam = 0;
    this.t = 0;
    this.prompt = null;
  }
  get width() { return this.def.width || W; }
  ground(x) { return this.def.ground ? this.def.ground(x) : 220; }
  weather() { const w = this.def.weather; return typeof w === 'function' ? w(this) : (w || 'clear'); }

  buildStatic() {
    const [c, x] = makeCanvas(this.width, H);
    this.def.build(x, this);
    this.static = c;
  }
  rebuild() { this.buildStatic(); }

  enter(p) {
    if (!this.static || this.def.alwaysRebuild) this.buildStatic();
    this.player.x = p.x !== undefined ? p.x : (S.loc === this.id && S.px ? S.px : (this.def.spawn || 100));
    this.player.facing = p.facing || 1;
    this.player.walking = false;
    S.loc = this.id; S.px = this.player.x;
    this.updateCam(true);
    if (p.banner !== false && this.def.name) Banner.show(this.def.name, this.def.sub);
    Sound.setMood(this.def.music ? (typeof this.def.music === 'function' ? this.def.music(this) : this.def.music) : 'none');
    Sound.setAmbience(Object.assign({ sea: 0.6, wind: 0.1, rain: 0, fire: 0 }, this.def.ambience || {}));
    Save.write();
    if (this.def.onEnter) Game.run(() => this.def.onEnter(this, p));
  }

  updateCam(snap) {
    const target = clamp(this.player.x - W / 2, 0, Math.max(0, this.width - W));
    this.cam = snap ? target : lerp(this.cam, target, 0.12);
    if (Math.abs(this.cam - target) < 0.3) this.cam = target;
  }

  interactables() {
    return (this.def.objects || []).filter(o => !o.when || o.when(this));
  }

  update(dt, free) {
    this.t += dt;
    const p = this.player;
    p.walking = false;
    if (free) {
      Clock.advance(dt / 50);
      let mv = 0;
      if (Input.held('left')) mv -= 1;
      if (Input.held('right')) mv += 1;
      const run = Input.held('run') ? 1.8 : 1;
      if (mv) {
        const nx = clamp(p.x + mv * 56 * run * dt, this.def.minX || 8, this.def.maxX || this.width - 8);
        p.walking = nx !== p.x;
        p.x = nx; p.facing = mv;
      }
      if (p.walking) p.anim += dt * run; else p.anim = 0;
      S.px = p.x;
      // interact
      let best = null, bd = 1e9;
      for (const o of this.interactables()) {
        const d = Math.abs(o.x - p.x);
        if (d <= (o.r || 14) && d < bd) { best = o; bd = d; }
      }
      this.prompt = best;
      if (best && Input.pressed('act')) {
        Input.consume('act');
        this.prompt = null;
        Game.run(() => best.act(this));
      }
    } else {
      this.prompt = null;
    }
    if (this.def.update) this.def.update(this, dt, free);
    this.updateCam(false);
  }

  npcList() { return (this.def.npcs || []).filter(n => !n.when || n.when(this)); }

  draw(c) {
    const h = S.time, wea = this.weather(), t = Game.t;
    const horizon = this.def.horizon || 150;
    Sky.draw(c, h, wea, horizon, t);
    const cam = Math.round(this.cam);
    const people = w => {
      for (const n of this.npcList()) {
        const P = PEOPLE[n.p || n.id];
        const nx = n.x - cam;
        if (nx < -20 || nx > W + 20) continue;
        const left = n.facePlayer !== false && Math.abs(this.player.x - n.x) < 60 ? this.player.x < n.x : !!n.left;
        drawPerson(w, P, nx, this.ground(n.x), { left, sit: n.sit, walking: false });
      }
      if (!this.def.hidePlayer) {
        const p = this.player;
        drawPerson(w, PEOPLE.player, p.x - cam, this.ground(p.x), { left: p.facing < 0, walking: p.walking, anim: p.anim });
      }
    };
    composeWorld(c, w => {
      if (this.def.drawBack) this.def.drawBack(w, this, cam, t);
      w.drawImage(this.static, cam, 0, W, H, 0, 0, W, H);
      if (this.def.drawMid) this.def.drawMid(w, this, cam, t);
      people(w);
      if (this.def.drawFront) this.def.drawFront(w, this, cam, t);
    }, h, wea, this.def.indoor ? 0.55 : 1);
    const nf = nightFactor(h);
    if (this.def.emissive) {
      ectx.clearRect(0, 0, W, H);
      this.def.emissive(ectx, this, cam, t, nf);
      actx.clearRect(0, 0, W, H);
      people(actx);
      ectx.globalCompositeOperation = 'destination-out';
      ectx.drawImage(actC, 0, 0);
      ectx.globalCompositeOperation = 'source-over';
      c.drawImage(emC, 0, 0);
    }
    if (this.def.lights) drawLights(c, this.def.lights(this, cam, t, nf), nf);
    if (this.def.overlay) this.def.overlay(c, this, cam, t, nf);
    if (wea === 'storm') Weather.rain(c, t, 1);
    if (wea === 'fog') Weather.fog(c, t, cam, this.def.fogDensity || 0.8);
    if (wea === 'snow') Weather.snow(c, t, this.def.snowAmount || 0.6);
    // prompt
    if (this.prompt && !Game.busy()) {
      const o = this.prompt;
      const label = typeof o.label === 'function' ? o.label(this) : o.label;
      const s = '[E] ' + label;
      const px_ = clamp(o.x - cam, textWidth(s) / 2 + 4, W - textWidth(s) / 2 - 4);
      const py = (o.y !== undefined ? o.y : this.ground(o.x) - 40);
      drawText(c, s, px_, py, '#fff6dc', { align: 'center', outline: '#14101a' });
    }
  }
}

// ---------------------------------------------------------------------------
// Title & intro scenes
// ---------------------------------------------------------------------------
// Chapter registry: title, intro text and where each chapter begins.
const CHAPTER_INFO = {
  1: {
    label: 'Chapter I: The Lost Fisherman', short: 'Chapter I',
    intro: [
      'Saltmere. Autumn.',
      'A month ago, your grandfather, Ansel Hale, rowed out of the harbour at dusk.',
      'He said he had seen the lights again.',
      'His boat, the Margaret, never came back.',
      'The search boats looked for nine days and found nothing. Not one plank.',
      'Everyone says the sea keeps its secrets.',
      "But you've never been very good at leaving secrets alone.",
    ],
    start: { scene: 'cottage', params: { x: 120, intro: true } },
  },
};

function startChapter(ch, slot) {
  Save.clearSlot(slot);
  S = newState(ch);
  S.slot = slot;
  Game.goto('intro');
}
function continueGame(st) {
  S = st;
  const info = CHAPTER_INFO[S.ch || 1];
  Game.goto(Game.scenes[S.loc] instanceof Place ? S.loc : info.start.scene, { banner: true });
}

function slotSummary(st) {
  if (!st) return 'Empty';
  return CHAPTER_INFO[st.ch || 1].short + (st.f.ended ? '  (complete)' : '  \u00b7  Day ' + st.day);
}
function slotDetail(st) {
  if (!st) return 'An empty save slot.';
  const info = CHAPTER_INFO[st.ch || 1];
  if (st.f.ended) return info.label + '. Finished!';
  const sc = Game.scenes[st.loc];
  const where = sc && sc.def && sc.def.name ? sc.def.name : 'At sea';
  return info.label + '. Day ' + st.day + ', ' + where + '. ' + st.coins + ' coins.';
}
// Shows the three slots; returns the chosen index or -1.
function pickSlot(title, filledOnly) {
  const items = [];
  for (let i = 0; i < SLOTS; i++) {
    const st = Save.slot(i);
    items.push({ label: 'Slot ' + (i + 1), right: slotSummary(st), desc: slotDetail(st), disabled: filledOnly && !st, whyNot: 'This slot is empty.' });
  }
  return Menu.list({ title, items, w: 300, sel: Save.data.last || 0 });
}
// Asks which unlocked chapter to start from (skipped when only one is open).
async function pickChapter() {
  const chs = Object.keys(CHAPTER_INFO).map(Number);
  const open = chs.filter(ch => Save.isUnlocked(ch));
  if (open.length === 1) return open[0];
  const items = chs.map(ch => ({
    label: CHAPTER_INFO[ch].label, disabled: !Save.isUnlocked(ch),
    whyNot: 'Finish ' + (CHAPTER_INFO[ch - 1] || {}).short + ' to unlock this chapter.',
    desc: Save.isUnlocked(ch) ? 'Begin ' + CHAPTER_INFO[ch].short + '.' : 'Locked. Finish ' + (CHAPTER_INFO[ch - 1] || {}).short + ' first.',
  }));
  const i = await Menu.list({ title: 'Start from which chapter?', items, w: 300 });
  return i < 0 ? -1 : chs[i];
}

async function titleContinue() {
  const i = await pickSlot('Continue', true);
  if (i < 0) return;
  const st = Save.slot(i);
  if (st.f.ended) {
    const next = (st.ch || 1) + 1;
    // a finished chapter has nothing left to continue, so go straight on to the next one
    if (CHAPTER_INFO[next] && Save.isUnlocked(next)) startChapter(next, i);
    else await Dlg.narrate('This story is complete. Choose New Game to play it again.');
    return;
  }
  continueGame(st);
}

async function titleNewGame() {
  const i = await pickSlot('New Game', false);
  if (i < 0) return;
  if (Save.data.slots[i]) {
    const r = await Dlg.ask(null, 'This will delete your progress in this slot. Are you sure?', ['Clear', 'Cancel']);
    if (r !== 0) return;
  }
  const ch = await pickChapter();
  if (ch < 0) return;
  startChapter(ch, i);
}

const TitleScene = {
  hud: false,
  enter() {
    this.t = 0;
    this.sel = 0;
    Save.load();
    this.items = [];
    if (Save.anyGame()) this.items.push({ label: 'Continue', act: () => Game.run(titleContinue) });
    this.items.push({ label: 'New Game', act: () => Game.run(titleNewGame) });
    this.items.push({ label: 'Sound', act: () => Game.run(openSettings) });
    this.items.push({ label: 'Controls', act: () => Game.run(showControls) });
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.quit) this.items.push({ label: 'Quit', act: () => window.webkit.messageHandlers.quit.postMessage(1) });
    this.clouds = this.clouds || new CloudLayer(5, 7, 30, 100, 0.2, 'fair');
    Sound.setMood('night');
    Sound.setAmbience({ sea: 0.6, wind: 0.15, rain: 0, fire: 0 });
    if (!S) { S = newState(); S.placeholder = true; }
  },
  update(dt, free) {
    this.t += dt;
    if (!free) return;
    const n = this.items.length;
    if (Input.pressed('up')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('blip'); }
    if (Input.pressed('down')) { this.sel = (this.sel + 1) % n; Sound.sfx('blip'); }
    if (Input.pressed('act')) {
      Sound.sfx('select');
      this.items[this.sel].act();
    }
  },
  draw(c) {
    const h = 19.6, t = this.t;
    const horizon = 168;
    Sky.draw(c, h, 'clear', horizon, t);
    composeWorld(c, w => {
      this.clouds.draw(w, 0, t * 2);
      // distant island & lighthouse
      for (let i = 0; i < 70; i++) { const hh = Math.round(Math.sin(i / 70 * Math.PI) * 9 + hash1(i) * 2); rect(w, 360 + i, horizon - hh, 1, hh, '#1c2436'); }
      rect(w, 392, horizon - 30, 4, 22, '#2a3044'); rect(w, 391, horizon - 33, 6, 3, '#1a1e2a');
      Sea.draw(w, horizon, H, t * 3, t, 'night', h);
      drawBoat(w, { type: 'row' }, 150, 214, t, { riders: [] });
      waterFront(w, 128, 175, 214, t, 'night', 0.6);
    }, h, 'clear');
    // lighthouse blink (dark here: it's the mystery) - faint green lights under the sea instead
    const nf = 1;
    const lx = 300 + Math.sin(t * 0.3) * 40;
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const a = 0.25 + 0.2 * Math.sin(t * 1.3 + i * 1.7);
      c.globalAlpha = Math.max(0, a);
      c.drawImage(glowSprite(10, i % 2 ? '#7ff7e8' : '#9cffb0', 3, 0.8), Math.round(lx + i * 22 - 10), Math.round(196 + Math.sin(t + i) * 3 + i * 4 - 10));
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // title
    const title = 'THE LOST FISHERMAN';
    // big title: draw scaled 2x via temp canvas
    const tw = textWidth(title);
    if (!this.titleImg) {
      const [tc, tx] = makeCanvas(tw + 2, 11);
      drawText(tx, title, 1, 1, '#2a1a10');
      drawText(tx, title, 0, 0, '#ffe6a8');
      this.titleImg = tc;
    }
    c.drawImage(this.titleImg, Math.round(W / 2 - this.titleImg.width), 40, this.titleImg.width * 2, this.titleImg.height * 2);
    drawText(c, 'One night, a fisherman went out to sea and never came back.', W / 2, 70, '#c8d0e0', { align: 'center', shadow: '#000' });
    if (!Menu.active) this.items.forEach((it, i) => {
      const sel = i === this.sel;
      const y = 106 + i * 14;
      if (sel) drawText(c, '→', W / 2 - textWidth(it.label) / 2 - 12, y, UIC.hi, { shadow: '#000' });
      drawText(c, it.label, W / 2, y, it.locked ? '#7a8090' : sel ? UIC.hi : '#e8e4d8', { align: 'center', shadow: '#000' });
    });
    drawText(c, 'Arrow keys + E / Enter   Shift to run', W / 2, H - 12, '#8a94a8', { align: 'center', shadow: '#000' });
  },
};

const IntroScene = {
  hud: false,
  enter() {
    this.done = false;
    this.t = 0; this.i = 0; this.lt = 0;
    this.info = CHAPTER_INFO[S.ch || 1];
    this.lines = this.info.intro;
    Sound.setMood('night'); Sound.setAmbience({ sea: 0.4, wind: 0.2, rain: 0 });
  },
  finish() { if (this.done) return; this.done = true; const st = this.info.start; Game.goto(st.scene, Object.assign({}, st.params)); },
  update(dt, free) {
    this.t += dt; this.lt += dt;
    if (!free) return;
    if ((Input.pressed('act') && this.lt > 0.5) || this.lt > 5.5) {
      this.i++; this.lt = 0;
      if (this.i >= this.lines.length) this.finish();
    }
    if (Input.pressed('back')) this.finish();
  },
  draw(c) {
    rect(c, 0, 0, W, H, '#05070c');
    drawText(c, this.info.label.toUpperCase(), W / 2, 22, '#8a7a5a', { align: 'center' });
    for (let j = 0; j <= Math.min(this.i, this.lines.length - 1); j++) {
      if (this.lines.length > 7 && j < this.i - 6) continue;
      const a = j === this.i ? clamp(this.lt / 1.2, 0, 1) : 0.55;
      c.globalAlpha = a;
      const lines = wrapText(this.lines[j], 400);
      lines.forEach((l, k) => drawText(c, l, W / 2, 50 + j * 24 + k * 10, '#e8e0cc', { align: 'center' }));
    }
    c.globalAlpha = 1;
    drawText(c, '[E] continue   [Esc] skip', W / 2, H - 14, '#5a6070', { align: 'center' });
  },
};

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
function boot() {
  initPeople();
  initIcons();
  Save.load();
  const set = Save.data.settings || {};
  Sound.enabled = set.sound !== false;
  Sound.setVolumes(set.music !== undefined ? set.music : 6, set.sfx !== undefined ? set.sfx : 8);
  S = newState(); S.placeholder = true;
  Game.scenes.title = TitleScene;
  Game.scenes.intro = IntroScene;
  registerPlaces();
  if (typeof registerChapter2 === 'function') registerChapter2();
  if (typeof registerChapter3 === 'function') registerChapter3();
  registerSeaScenes();
  Game.scenes.whale = WhaleScene;
  Game.scenes.epilogue = EpilogueScene;
  Game.setScene('title');
  Game.fadeTo(0, 0.8);
  let last = performance.now(), acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    let n = 0;
    while (acc >= STEP && n < 8) {
      try { Game.update(STEP); } catch (e) { console.error(e); Game.error = String(e && e.stack || e); }
      Input.endFrame();
      acc -= STEP; n++;
    }
    try { Game.draw(); } catch (e) { console.error(e); Game.error = String(e && e.stack || e); present(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // autosave periodically
  setInterval(() => { if (S && Game.scene && Game.scene.hud) Save.write(); }, 20000);
}
window.addEventListener('load', boot);
