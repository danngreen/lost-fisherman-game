'use strict';
// ---------------------------------------------------------------------------
// Sea chart (destination picker) and the side-scrolling voyage scene
// ---------------------------------------------------------------------------
const LOCS = {
  saltmere: { name: 'Saltmere', x: 62, y: 150, scene: 'village', dock: 1150, sil: 'town' },
  gull: { name: 'Gull Rock', x: 150, y: 92, scene: 'gull', dock: 62, sil: 'gull' },
  pearl: { name: 'Pearl Shoal', x: 168, y: 206, scene: 'pearl', dock: 46, sil: 'shoal' },
  coconut: { name: 'Coconut Isle', x: 272, y: 168, scene: 'coconut', dock: 60, sil: 'palm' },
  lighthouse: { name: 'Kettle Point', x: 326, y: 72, scene: 'lighthouse', dock: 52, sil: 'lighthouse' },
  hollow: { name: 'Island in the Fog', x: 432, y: 118, scene: 'hollow', dock: 64, sil: 'fog' },
};
const ROUTES = {
  'saltmere-gull': 1, 'saltmere-pearl': 1, 'gull-pearl': 1, 'saltmere-coconut': 2, 'gull-coconut': 2,
  'pearl-coconut': 1, 'saltmere-lighthouse': 3, 'gull-lighthouse': 2, 'coconut-lighthouse': 2,
  'pearl-lighthouse': 3, 'lighthouse-hollow': 2,
};
function routeCost(a, b) { return ROUTES[a + '-' + b] || ROUTES[b + '-' + a] || null; }
function locKnown(id) { return id !== 'hollow' || flag('hollowSeen'); }
function routeBlock(from, to) {
  if (to === from) return 'You are here.';
  const cost = routeCost(from, to);
  if (cost === null) return to === 'hollow' ? 'The only way in is from Kettle Point, through the Teeth.' : 'Too far from here. Sail via Kettle Point.';
  if (to === 'coconut' && S.boat === 'row') return 'Too far to row. You need a sail (Bo, the shipwright).';
  if (to === 'lighthouse' && S.boat !== 'big') return 'The currents round Kettle Point are too strong for ' + (S.boat === 'row' ? 'a rowboat.' : 'a small sail.');
  if (to === 'hollow') {
    if (!flag('ironHull')) return 'The Teeth would rip your hull open. Have Bo reinforce it first.';
    if (!flag('lantern')) return "You'd be lost in that fog without a storm lantern.";
  }
  if (to !== 'saltmere' && Inv.food() < cost) return 'You need ' + cost + ' food for this trip. You have ' + Inv.food() + '.';
  return null;
}

const Chart = {
  active: null,
  open(from) {
    return new Promise(res => {
      const ids = Object.keys(LOCS).filter(locKnown);
      let sel = ids.indexOf(from === 'saltmere' ? 'gull' : 'saltmere');
      if (sel < 0) sel = 0;
      this.active = { from, ids, sel, res, t: 0 };
      Input.consume('act');
      Sound.sfx('select');
    });
  },
  close(v) { const a = this.active; this.active = null; Input.consume('act'); Input.consume('back'); a.res(v); },
  update(dt) {
    const a = this.active;
    if (!a) return;
    a.t += dt;
    const cur = LOCS[a.ids[a.sel]];
    const pick = (dx, dy) => {
      let best = -1, bs = 1e9;
      a.ids.forEach((id, i) => {
        if (i === a.sel) return;
        const L = LOCS[id];
        const vx = L.x - cur.x, vy = L.y - cur.y;
        const along = vx * dx + vy * dy;
        if (along <= 0) return;
        const side = Math.abs(vx * dy - vy * dx);
        const score = along + side * 2;
        if (score < bs) { bs = score; best = i; }
      });
      if (best >= 0) { a.sel = best; Sound.sfx('blip'); }
    };
    if (Input.pressed('left')) pick(-1, 0);
    if (Input.pressed('right')) pick(1, 0);
    if (Input.pressed('up')) pick(0, -1);
    if (Input.pressed('down')) pick(0, 1);
    if (Input.pressed('back')) { Sound.sfx('back'); this.close(null); return; }
    if (Input.pressed('act')) {
      const id = a.ids[a.sel];
      const why = routeBlock(a.from, id);
      if (why) { Sound.sfx('back'); a.err = why; a.errT = 3; }
      else { Sound.sfx('select'); this.close(id); }
    }
    if (a.errT > 0) a.errT -= dt;
  },
  draw(c) {
    const a = this.active;
    if (!a) return;
    // parchment
    const x0 = 16, y0 = 14, w = W - 32, h = H - 40;
    rect(c, x0 - 2, y0 - 2, w + 4, h + 4, '#3a2a1a');
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i += 4) {
      const n = hash2((i / 4) | 0, j);
      const edge = Math.min(i, w - i, j * 2, (h - j) * 2) < 10;
      c.fillStyle = edge ? (n > 0.5 ? '#c8a878' : '#b89868') : (n > 0.97 ? '#d8c09a' : n < 0.03 ? '#c8ac80' : '#e4d0a8');
      c.fillRect(x0 + i, y0 + j, 4, 1);
    }
    // sea hatching
    for (let j = 30; j < h - 10; j += 9) for (let i = 20 + (j % 18); i < w - 20; i += 26) {
      rect(c, x0 + i, y0 + j, 5, 1, '#b8c4b8');
    }
    // mainland coast on the left
    for (let j = 0; j < h; j++) {
      const cx = 38 + Math.sin(j * 0.07) * 8 + Math.sin(j * 0.21) * 3;
      rect(c, x0, y0 + j, cx, 1, '#a8b07a');
      rect(c, x0 + cx, y0 + j, 1, 1, '#5a4a30');
    }
    // the Teeth
    for (let i = 0; i < 9; i++) {
      const tx = 360 + i * 7 + (i % 2) * 3, ty = 80 + Math.sin(i * 1.7) * 14;
      line(c, tx, ty, tx + 2, ty - 5, '#4a3a2a'); line(c, tx + 2, ty - 5, tx + 4, ty, '#4a3a2a');
    }
    drawText(c, 'The Teeth', 372, 104, '#6a4a30');
    // fog wall
    for (let j = 0; j < h - 20; j += 3) for (let i = 0; i < 70; i += 3) {
      if (hash2(i, j) > 0.55) rect(c, 395 + i + Math.sin(j * 0.1 + a.t) * 2, y0 + 10 + j, 2, 2, 'rgba(120,120,130,0.35)');
    }
    // compass rose
    const cx = 420, cy = 205;
    line(c, cx, cy - 14, cx, cy + 14, '#6a4a30'); line(c, cx - 14, cy, cx + 14, cy, '#6a4a30');
    line(c, cx - 7, cy - 7, cx + 7, cy + 7, '#9a7a50'); line(c, cx - 7, cy + 7, cx + 7, cy - 7, '#9a7a50');
    drawText(c, 'N', cx - 1, cy - 25, '#6a4a30');
    // routes from current location
    for (const id of a.ids) {
      if (id === a.from) continue;
      const cost = routeCost(a.from, id);
      if (cost === null) continue;
      const A = LOCS[a.from], B = LOCS[id];
      const steps = Math.floor(Math.hypot(B.x - A.x, B.y - A.y) / 5);
      const sel = id === a.ids[a.sel];
      for (let i = 1; i < steps; i += 2) {
        const u = i / steps;
        px(c, lerp(A.x, B.x, u), lerp(A.y, B.y, u), sel ? '#a03020' : '#8a7a60');
      }
    }
    // locations
    a.ids.forEach((id, i) => {
      const L = LOCS[id];
      const sel = i === a.sel;
      const blocked = routeBlock(a.from, id);
      drawChartIcon(c, L.sil, L.x, L.y, a.t);
      if (id === a.from) { drawText(c, 'You', L.x - 6, L.y + 7, '#a03020'); }
      drawText(c, L.name, L.x, L.y - 18, sel ? '#a03020' : '#4a3a2a', { align: 'center' });
      if (sel) {
        const bob = Math.floor(a.t * 4) % 2;
        drawText(c, '↓', L.x - 2, L.y - 28 - bob, '#a03020');
      }
    });
    // info panel
    const id = a.ids[a.sel];
    const cost = routeCost(a.from, id);
    const why = routeBlock(a.from, id);
    panel(c, 16, H - 30, W - 32, 26);
    let info = LOCS[id].name;
    if (id !== a.from && cost !== null) info += '   Food needed: ' + cost + '   You have: ' + Inv.food();
    drawText(c, info, 24, H - 25, UIC.hi);
    const msg = a.errT > 0 ? a.err : (why ? why : '[E] Set sail    [Esc] Stay');
    drawText(c, msg, 24, H - 14, a.errT > 0 || why ? '#f0a890' : UIC.text);
  },
};

function drawChartIcon(c, kind, x, y, t) {
  const ink = '#4a3a2a';
  if (kind === 'town') { for (let i = 0; i < 3; i++) { rect(c, x - 8 + i * 6, y - 4, 5, 5, ink); px(c, x - 6 + i * 6, y - 5, ink); } }
  else if (kind === 'gull') { ellipse(c, x, y, 7, 4, '#8a8a7a'); px(c, x, y - 6, ink); line(c, x - 3, y - 8, x, y - 6, ink); line(c, x, y - 6, x + 3, y - 8, ink); }
  else if (kind === 'shoal') { for (let i = 0; i < 4; i++) ellipse(c, x - 6 + i * 4, y + (i % 2), 2, 1, '#d8c890'); }
  else if (kind === 'palm') { ellipse(c, x, y + 1, 9, 4, '#c8b878'); rect(c, x, y - 7, 1, 7, ink); line(c, x, y - 7, x - 4, y - 5, '#4a7a3a'); line(c, x, y - 7, x + 4, y - 5, '#4a7a3a'); }
  else if (kind === 'lighthouse') {
    ellipse(c, x, y + 2, 7, 3, '#8a8a7a'); rect(c, x - 1, y - 8, 3, 9, '#e8e0d0'); rect(c, x - 1, y - 5, 3, 1, '#c84a3a');
    if (flag('lighthouseLit')) px(c, x, y - 9, Math.floor(t * 2) % 2 ? '#ffd040' : '#e8a020'); else px(c, x, y - 9, ink);
  }
  else if (kind === 'fog') { ellipse(c, x, y, 7, 4, '#6a6a6a'); drawText(c, '?', x - 2, y - 4, '#e4d0a8'); }
  else rect(c, x - 2, y - 2, 4, 4, ink);
}

// ---------------- silhouettes on the horizon ----------------
function drawSilhouette(c, kind, x, horizon, col, t) {
  x = Math.round(x);
  const hump = (w, hgt, cx) => { for (let i = 0; i < w; i++) { const u = i / w; const hh = Math.round(Math.pow(Math.sin(u * Math.PI), 0.7) * hgt + (hash1(i + w * 7) - 0.5) * 2); rect(c, cx + i - w / 2, horizon - hh, 1, hh, col); } };
  if (kind === 'town') {
    hump(160, 18, x);
    for (let i = 0; i < 9; i++) { const hx = x - 50 + i * 11, hh = 6 + (i * 7) % 5; rect(c, hx, horizon - 18 - hh + Math.abs(i - 4), 8, hh, col); }
  } else if (kind === 'gull') {
    for (let i = 0; i < 60; i++) { const u = i / 60; const hh = Math.round(Math.pow(Math.sin(u * Math.PI), 1.6) * 34); rect(c, x - 30 + i, horizon - hh, 1, hh, col); }
  } else if (kind === 'shoal') {
    hump(70, 3, x);
  } else if (kind === 'palm') {
    hump(110, 12, x);
    for (let k = 0; k < 3; k++) {
      const px0 = x - 20 + k * 18 + (k === 1 ? 3 : 0), top = horizon - 26 - (k % 2) * 4;
      for (let j = 0; j < horizon - 10 - top; j++) px(c, px0 + Math.round(j * j * 0.004 * (k - 1)), top + j, col);
      for (const dx of [-1, 1]) for (let i = 0; i < 7; i++) {
        px(c, px0 + dx * i, top + Math.round(i * i * 0.12), col);
        px(c, px0 + dx * i, top + 1 + Math.round(i * i * 0.12), col);
      }
      rect(c, px0 - 1, top - 1, 3, 2, col);
    }
  } else if (kind === 'lighthouse') {
    hump(90, 16, x);
    rect(c, x + 8, horizon - 56, 7, 42, col); rect(c, x + 6, horizon - 60, 11, 4, col); rect(c, x + 10, horizon - 64, 3, 4, col);
  } else if (kind === 'fog') {
    hump(130, 22, x);
  }
}

// ---------------------------------------------------------------------------
// Voyage scene
// ---------------------------------------------------------------------------
const LANES = [207, 222, 238];
const VoyageScene = {
  hud: true,
  enter(p) {
    this.p = p;
    this.from = p.from; this.to = p.to;
    this.escort = !!p.escort;
    const cost = p.cost || routeCost(p.from, p.to) || 1;
    this.cost = cost;
    this.L = this.escort ? 2600 : cost * 1100;
    this.d = 0; this.t = 0;
    this.lane = 1; this.ly = LANES[1];
    this.hull = maxHull();
    this.inv = 0; this.shake = 0;
    this.speedMul = 1;
    this.hoursTotal = cost * 1.5;
    this.done = false;
    this.fishing = false;
    this.notice = null;
    this.flash = 0;
    const base = { row: 46, sail: 70, big: 92 }[S.boat || 'row'];
    this.base = base;
    const key = [p.from, p.to].sort().join('-');
    this.teeth = key === 'hollow-lighthouse';
    this.rough = this.teeth ? 2.2 : (p.to === 'lighthouse' || p.from === 'lighthouse') ? 1.5 : 1;
    this.clouds = new CloudLayer(17 + cost, 9, 18, 90, 0.08, this.teeth ? 'storm' : 'fair', 2200);
    this.spawn();
    this.originSil = LOCS[p.from].sil;
    this.destSil = LOCS[p.to].sil;
    Sound.setMood(this.escort ? 'wonder' : this.teeth ? 'eerie' : nightFactor(S.time) > 0.5 ? 'night' : 'sea');
    Sound.setAmbience({ sea: 0.9, wind: this.teeth ? 0.8 : 0.3, rain: 0, fire: 0 });
    S.loc = LOCS[p.from].scene; S.px = LOCS[p.from].dock;
    if (this.escort) this.hoursTotal = ((6.8 - S.time) % 24 + 24) % 24;
    this.tutorial = !flag('voyageTut');
    if (this.tutorial) { setFlag('voyageTut'); this.notice = { text: 'Up/Down: steer between lanes.  Right: faster.  Left: slow down.', t: 0, dur: 7 }; }
    if (this.teeth && !this.escort) Game.run(async () => { await wait(0.6); await Dlg.narrate('Ahead, black rocks break the water like the teeth of some huge sleeping animal. Steer carefully!'); });
  },
  spawn() {
    const r = RNG(Math.floor(Math.random() * 1e9));
    const E = this.ents = [];
    const L = this.L;
    if (this.escort) {
      return;
    }
    const nRocks = this.teeth ? Math.floor(L / 75) : Math.floor(L / 550 * this.rough);
    for (let i = 0; i < nRocks; i++) {
      const x = 300 + r() * (L - 500);
      if (this.teeth && x > L * 0.62) continue; // fog part is calm
      E.push({ k: 'rock', x, lane: Math.floor(r() * 3), big: this.teeth && r() > 0.4 });
    }
    // make sure the teeth are passable: no column with all three lanes blocked
    E.sort((a, b) => a.x - b.x);
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length && E[j].x - E[i].x < 70; j++) {
      if (E[j].lane === E[i].lane) E[j].x += 40;
    }
    for (let i = 0; i < E.length; i++) {
      const near = E.filter(o => o.k === 'rock' && Math.abs(o.x - E[i].x) < 40);
      if (new Set(near.map(o => o.lane)).size >= 3) E[i].x += 60;
    }
    const nCrates = Math.max(1, Math.floor(L / 700));
    for (let i = 0; i < nCrates; i++) E.push({ k: 'crate', x: 250 + r() * (L - 400), lane: Math.floor(r() * 3) });
    const nSchools = Math.max(1, Math.floor(L / 900));
    for (let i = 0; i < nSchools; i++) E.push({ k: 'school', x: 350 + r() * (L - 600), lane: 1, w: 150 });
    if (r() < 0.6) E.push({ k: 'dolphins', x: 400 + r() * (L - 700), lane: 0 });
    // message in a bottle
    const nextLetter = [0, 1, 2, 3].find(i => !S.bottles.includes(i));
    if (nextLetter !== undefined && flag('gullClue') && (r() < 0.65 || !flag('anyBottle'))) {
      E.push({ k: 'bottle', x: 300 + r() * (L - 500), lane: Math.floor(r() * 3), letter: nextLetter });
    }
    if (this.teeth) for (let i = 0; i < 6; i++) E.push({ k: 'glow', x: L * 0.62 + r() * L * 0.35, lane: Math.floor(r() * 3) });
    else if (flag('gullClue') && nightFactor(S.time) > 0.5 && r() < 0.5) E.push({ k: 'glow', x: L * (0.3 + r() * 0.5), lane: 0 });
  },
  weather() {
    if (this.escort) return this.d / this.L < 0.35 ? 'fog' : 'clear';
    if (this.teeth) return this.d / this.L < 0.6 ? 'storm' : 'fog';
    if (this.rough > 1.2) return 'cloudy';
    return 'clear';
  },
  boatX() { return 150; },
  update(dt, free) {
    this.t += dt;
    if (this.notice) { this.notice.t += dt; if (this.notice.t > this.notice.dur) this.notice = null; }
    if (this.shake > 0) this.shake -= dt;
    if (this.inv > 0) this.inv -= dt;
    if (this.flash > 0) this.flash -= dt * 2;
    if (!free || this.done) return;
    // controls
    if (Input.pressed('up') && this.lane > 0) { this.lane--; Sound.sfx('blip'); }
    if (Input.pressed('down') && this.lane < 2) { this.lane++; Sound.sfx('blip'); }
    let target = 1;
    if (Input.held('right')) target = 1.6;
    if (Input.held('left')) target = 0.15;
    this.speedMul = lerp(this.speedMul, target, dt * 2);
    this.ly = lerp(this.ly, LANES[this.lane], dt * 6);
    const fogSlow = this.weather() === 'fog' && !flag('lantern') ? 0.6 : 1;
    const v = this.base * this.speedMul * fogSlow;
    const prev = this.d;
    this.d += v * dt;
    // time passes
    Clock.advance((this.d - prev) / this.L * this.hoursTotal);
    // storm lightning
    if (this.weather() === 'storm' && Math.random() < dt * 0.15) { this.flash = 1; setTimeout(() => Sound.sfx('thunder'), 300); }
    // whale song in fog
    if ((this.weather() === 'fog' || this.escort) && Math.random() < dt * (this.escort ? 0.25 : 0.08)) Sound.whale(this.escort ? 0.22 : 0.12);
    if (Math.random() < dt * 0.05) Sound.sfx('gull');
    Sound.setAmbience({ rain: this.weather() === 'storm' ? 1 : 0, wind: this.weather() === 'storm' ? 0.9 : 0.3 });
    // collisions
    const bx = this.d + this.boatX();
    const laneNow = Math.round((this.ly - LANES[0]) / (LANES[1] - LANES[0]));
    this.prompt = null;
    for (const e of this.ents) {
      if (e.gone) continue;
      const dx = e.x - bx;
      if (e.k === 'rock' && Math.abs(dx) < (e.big ? 16 : 12) && e.lane === laneNow && this.inv <= 0) {
        this.hull--; this.inv = 1.6; this.shake = 0.5; e.hit = true; Sound.sfx('bump');
        if (this.hull <= 0) { this.sink(); return; }
        Toast.show('Your hull scraped a rock! (' + this.hull + ' left)', 'heart');
      }
      if ((e.k === 'crate' || e.k === 'bottle') && Math.abs(dx) < 14 && e.lane === laneNow) {
        e.gone = true;
        if (e.k === 'crate') this.salvage();
        else Game.run(() => this.foundBottle(e.letter));
      }
      if (e.k === 'school' && dx < e.w / 2 && dx > -e.w / 2) {
        if (this.speedMul < 0.5) this.prompt = e;
        else if (!this.schoolHint) { this.schoolHint = true; this.notice = { text: 'Birds diving! Slow down (hold Left) to fish here.', t: 0, dur: 4 }; }
      }
    }
    if (this.prompt && Input.pressed('act')) {
      Input.consume('act');
      const spot = this.teeth || this.to === 'lighthouse' || this.to === 'hollow' ? 'deep' : 'sea';
      Game.run(() => goFishing({ rodX: this.boatX() + 6, rodY: this.ly - 14, waterY: this.ly + 2, dir: 1, spot }));
    }
    if (this.d >= this.L) this.arrive();
  },
  salvage() {
    const r = Math.random();
    if (r < 0.5) Inv.addCoins(3 + Math.floor(Math.random() * 6));
    else if (r < 0.7) Inv.add('rope');
    else if (r < 0.88) Inv.add('buckle');
    else Inv.add('spoon');
    Sound.sfx('pickup');
  },
  async foundBottle(i) {
    if (S.bottles.includes(i)) return;
    S.bottles.push(i);
    setFlag('anyBottle');
    Sound.sfx('pickup');
    await Dlg.narrate('A bottle, bobbing in the waves, sealed with wax. There is a rolled-up note inside...');
    await Dlg.narrate(LETTERS[i].body);
    if (i === 0) await Dlg.say('you', "That's Grandpa's handwriting! But... how long ago did he write this?");
    Toast.show('Message saved to your Journal', 'bottle');
  },
  sink() {
    this.done = true;
    Game.run(async () => {
      await Dlg.narrate('Water is pouring in through the cracked planks! You bail as fast as you can and turn back toward ' + LOCS[this.from].name + '.');
      Clock.advance(2);
      const L = LOCS[this.from];
      Game.goto(L.scene, { x: L.dock });
    });
  },
  arrive() {
    this.done = true;
    if (this.escort) { setFlag('homecoming'); Game.goto('village', { x: 1112, facing: -1, ending: true, banner: false }); return; }
    if (this.to === 'saltmere' && Inv.food() <= 0 && this.cost > 0 && this.hungry) {
      // nothing special
    }
    const L = LOCS[this.to];
    Game.goto(L.scene, { x: L.dock });
  },
  draw(c) {
    const h = S.time, wea = this.weather(), t = this.t;
    const horizon = 150;
    const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
    Sky.draw(c, h, wea, horizon, Game.t);
    const pal = wea === 'fog' ? 'fog' : wea === 'storm' ? 'storm' : (this.to === 'coconut' || this.from === 'coconut' || this.to === 'pearl') ? 'tropic' : 'north';
    const lights = [];
    let boatInfo = null;
    composeWorld(c, w => {
      w.save();
      w.translate(sx, 0);
      this.clouds.draw(w, this.d, t * 3, wea === 'fog' ? 0.4 : 1);
      // silhouettes
      const silCol = rgbStr(mixRgb(skyColors(h, wea)[2], '#2a3a4a', 0.45));
      const ox = 120 - this.d * 0.12;
      if (ox > -120) drawSilhouette(w, this.originSil, ox, horizon, silCol, t);
      const dx = W + 120 - (this.d - (this.L - 1600)) * 0.12;
      if (dx < W + 100) drawSilhouette(w, this.destSil, dx, horizon, silCol, t);
      Sea.draw(w, horizon, H, this.d, t, pal, h, { rough: this.rough, flow: 0 });
      // entities & boat sorted by lane
      const bx = this.d + this.boatX();
      const items = [];
      for (const e of this.ents) {
        if (e.gone) continue;
        const ex = e.x - this.d;
        if (ex < -60 || ex > W + 60) continue;
        items.push({ y: LANES[e.lane], f: () => this.drawEnt(w, e, ex, t, lights, pal) });
      }
      items.push({
        y: this.ly + 0.5, f: () => {
          const riders = this.escort ? [PEOPLE.player.top, PEOPLE.anselRagged.top] : [PEOPLE.player.top];
          const blink = this.inv > 0 && Math.floor(this.inv * 10) % 2 === 0;
          if (!blink) boatInfo = drawBoat(w, boatCfg(), this.boatX(), this.ly, t, { riders, rowing: this.speedMul > 0.3, rough: this.rough, phase: this.d });
          else boatInfo = { lantern: null };
          waterFront(w, this.boatX() - 30, this.boatX() + 32, this.ly + 1, t + this.d * 0.02, pal, 0.55);
          // wake
          if (this.speedMul > 0.4) for (let i = 0; i < 6; i++) {
            const wx = this.boatX() - 28 - i * 7 - ((t * 30) % 7);
            px(w, wx, this.ly + 1 + (i % 2), SEA_PALS[pal].hi);
          }
        }
      });
      if (this.escort) {
        const wx = this.boatX() + 90 + Math.sin(t * 0.4) * 16;
        items.push({ y: LANES[0] - 1, f: () => { drawWhale(w, wx, LANES[0] - 44 + Math.sin(t * 0.8) * 2, t, 1); frontWater(w, LANES[0] - 6, t, pal, wx, wx + 280, 0); } });
        this.whaleX = wx;
      }
      items.sort((a, b) => a.y - b.y).forEach(i => i.f());
      w.restore();
    }, h, wea);
    const nf = nightFactor(h);
    if (this.escort) {
      whaleSpots(c, this.whaleX, LANES[0] - 44 + Math.sin(t * 0.8) * 2, t, 1);
    }
    if (boatInfo && boatInfo.lantern) lights.push({ x: boatInfo.lantern.x, y: boatInfo.lantern.y, r: wea === 'fog' ? 44 : 28, col: '#ffcf7a', a: wea === 'fog' ? 0.6 : 0.5, flicker: true, always: wea === 'fog' || wea === 'storm' });
    drawLights(c, lights, nf);
    if (wea === 'storm') Weather.rain(c, t, 1, -1.2);
    if (wea === 'fog') {
      const dens = flag('lantern') ? 0.7 : 0.95;
      Weather.fog(c, t, this.d, this.escort ? Math.max(0, 0.8 - this.d / this.L * 2.2) : dens, nf > 0.5 ? '#4a5664' : '#c4ccd2');
      if (boatInfo && boatInfo.lantern && !this.escort) drawLights(c, [{ x: boatInfo.lantern.x, y: boatInfo.lantern.y, r: 40, col: '#fff0c0', a: 0.35, always: true }], 1);
    }
    if (this.escort) whaleSpots(c, this.whaleX, LANES[0] - 44 + Math.sin(t * 0.8) * 2, t, 0.6);
    if (this.flash > 0) { c.globalAlpha = this.flash * 0.6; rect(c, 0, 0, W, H, '#e8f0ff'); c.globalAlpha = 1; }
    // progress HUD
    const px0 = 150, pw = 180, py = 22;
    c.globalAlpha = 0.85; rect(c, px0 - 6, py - 4, pw + 12, 20, '#0e1220'); c.globalAlpha = 1;
    rect(c, px0, py + 4, pw, 1, '#6a7488');
    const u = clamp(this.d / this.L, 0, 1);
    rect(c, px0, py + 4, pw * u, 1, '#e8dcc0');
    rect(c, px0 + pw * u - 1, py + 1, 3, 6, '#ffd25a');
    drawText(c, LOCS[this.from].name, px0, py + 7, '#8a94a8');
    drawText(c, LOCS[this.to].name, px0 + pw, py + 7, '#dfe6f2', { align: 'right' });
    if (!this.escort) {
      for (let i = 0; i < maxHull(); i++) c.drawImage(ICONS.heart, 6 + i * 9, 20);
      for (let i = this.hull; i < maxHull(); i++) { c.globalAlpha = 0.75; rect(c, 6 + i * 9, 20, 8, 8, '#0e1220'); c.globalAlpha = 1; }
    }
    if (this.prompt && !Game.busy()) drawText(c, '[E] Fish here', this.boatX(), this.ly - 40, '#fff6dc', { align: 'center', outline: '#14101a' });
    if (this.notice) drawText(c, this.notice.text, W / 2, 60, '#fff6dc', { align: 'center', outline: '#14101a' });
  },
  drawEnt(w, e, x, t, lights, pal) {
    const y = LANES[e.lane];
    if (e.k === 'rock') {
      const s = e.big ? 1.5 : 1;
      const r = RNG(Math.floor(e.x));
      const hgt = Math.round((9 + r() * 6) * s), wid = Math.round((14 + r() * 6) * s);
      for (let i = 0; i < wid; i++) {
        const u = i / wid;
        const hh = Math.round(Math.pow(Math.sin(u * Math.PI), 0.8) * hgt + (hash2(i, Math.floor(e.x)) - 0.5) * 3);
        for (let j = 0; j < hh; j++) px(w, x - wid / 2 + i, y + 2 - j, j > hh - 2 ? '#7a7672' : (i < wid * 0.4 ? '#3a3836' : '#4e4a46'));
      }
      waterFront(w, x - wid / 2 - 4, x + wid / 2 + 4, y + 2, t + e.x, pal, 0.8);
      for (let i = 0; i < 4; i++) if (Math.sin(t * 4 + i * 2 + e.x) > 0.3) px(w, x - wid / 2 - 2 + i * wid / 3, y + 1, '#ffffff');
    } else if (e.k === 'crate') {
      const b = waveY(e.x, t) * 0.7;
      drawCrate(w, x - 5, y + b + 3, 9);
      waterFront(w, x - 8, x + 8, y + 1 + b, t, pal, 0.6);
    } else if (e.k === 'bottle') {
      const b = waveY(e.x, t) * 0.8;
      const bt = sprite(['.k.', '.g.', 'ggg', 'gwg', 'ggg'], { k: '#5a3a1a', g: '#5aa86a', w: '#d8f8e0' });
      w.save(); w.translate(Math.round(x), Math.round(y + b)); w.rotate(0.9 + Math.sin(t * 2) * 0.2); w.drawImage(bt, -1, -3); w.restore();
      if (Math.floor(t * 3) % 3 === 0) px(w, x + 2, y - 4 + b, '#ffffff');
      lights.push({ x, y: y + b, r: 8, col: '#c8ffd8', a: 0.4, always: true });
    } else if (e.k === 'school') {
      for (let i = 0; i < 10; i++) {
        const fx = x - e.w / 2 + hash1(i + e.x) * e.w + Math.sin(t * 2 + i) * 4;
        const fy = y + 4 + hash2(i, 3) * 10;
        w.globalAlpha = 0.5; rect(w, fx, fy, 4, 1, '#0a2238'); w.globalAlpha = 1;
        if (Math.sin(t * 5 + i * 3) > 0.85) px(w, fx, y - 1, '#ffffff');
      }
      for (let i = 0; i < 4; i++) {
        const ph = (t * 0.6 + i * 0.27) % 1;
        const gx = x - 40 + i * 25 + Math.sin(t + i) * 8;
        const gy = ph < 0.7 ? 150 + Math.sin(t * 1.5 + i) * 5 + 20 : 170 + (ph - 0.7) / 0.3 * 40;
        drawGull(w, gx, gy, t, { seed: i * 1.7 });
      }
    } else if (e.k === 'dolphins') {
      for (let i = 0; i < 3; i++) {
        const ph = ((t * 0.5 + i * 0.3) % 1.4);
        if (ph > 1) continue;
        const dx = x + i * 18 + ph * 30, dy = y - Math.sin(ph * Math.PI) * 14;
        w.save(); w.translate(Math.round(dx), Math.round(dy)); w.rotate(-Math.cos(ph * Math.PI) * 0.8);
        rect(w, -6, -2, 12, 4, '#5a6a7a'); rect(w, -5, 1, 10, 1, '#b8c4cc'); rect(w, 6, -1, 3, 2, '#5a6a7a'); rect(w, -1, -4, 3, 2, '#4a5a6a'); rect(w, -9, -2, 3, 1, '#4a5a6a'); rect(w, -9, 1, 3, 1, '#4a5a6a');
        w.restore();
      }
    } else if (e.k === 'glow') {
      const a = 0.4 + 0.3 * Math.sin(t * 1.2 + e.x);
      lights.push({ x, y: y + 8, r: 16, col: '#7ff7e8', a, always: true });
      lights.push({ x: x + 20, y: y + 12, r: 10, col: '#9cffb0', a: a * 0.8, always: true });
    }
  },
};

function registerSeaScenes() {
  Game.scenes.voyage = VoyageScene;
}

async function setSail(from) {
  const dest = await Chart.open(from);
  if (!dest) return;
  const cost = routeCost(from, dest);
  const short = Inv.eat(cost);
  if (short > 0) await Dlg.narrate("You don't have enough food, so you set off hungry. It's going to be a long trip home.");
  else Toast.show('-' + cost + ' food', 'food');
  Game.goto('voyage', { from, to: dest, cost });
}
