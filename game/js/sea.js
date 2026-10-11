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
// Each chapter supplies its own sea: places, routes, travel rules, chart art and voyage style.
const CHAPTERS = {};
function chap() { return CHAPTERS[(S && S.ch) || 1]; }
function locs() { return chap().locs; }
function routeCost(a, b) { const R = chap().routes; return R[a + '-' + b] || R[b + '-' + a] || null; }
function locKnown(id) { return chap().locKnown(id); }
function routeBlock(from, to) {
  if (to === from) return 'You are here.';
  const cost = routeCost(from, to);
  const why = chap().routeBlock(from, to, cost);
  if (why) return why;
  if (cost === null) return 'Too far from here.';
  if (to !== chap().home && Inv.food() < cost) return 'You need ' + cost + ' food for this trip. You have ' + Inv.food() + '.';
  return null;
}

CHAPTERS[1] = {
  home: 'saltmere', locs: LOCS, routes: ROUTES,
  locKnown: id => id !== 'hollow' || flag('hollowSeen'),
  routeBlock(from, to, cost) {
    if (cost === null) return to === 'hollow' ? 'The only way in is from Kettle Point, through the Teeth.' : 'Too far from here. Sail via Kettle Point.';
    if (to === 'coconut' && S.boat === 'row') return 'Too far to row. You need a sail (Bo, the shipwright).';
    if (to === 'lighthouse' && S.boat !== 'big') return 'The currents round Kettle Point are too strong for ' + (S.boat === 'row' ? 'a rowboat.' : 'a small sail.');
    if (to === 'hollow') {
      if (!flag('ironHull')) return 'The Teeth would rip your hull open. Have Bo reinforce it first.';
      if (!flag('lantern')) return "You'd be lost in that fog without a storm lantern.";
    }
    return null;
  },
  chartDeco(c, t, x0, y0, w, h) {
    for (let j = 0; j < h; j++) {
      const cx = 38 + Math.sin(j * 0.07) * 8 + Math.sin(j * 0.21) * 3;
      rect(c, x0, y0 + j, cx, 1, '#a8b07a');
      rect(c, x0 + cx, y0 + j, 1, 1, '#5a4a30');
    }
    for (let i = 0; i < 9; i++) {
      const tx = 360 + i * 7 + (i % 2) * 3, ty = 80 + Math.sin(i * 1.7) * 14;
      line(c, tx, ty, tx + 2, ty - 5, '#4a3a2a'); line(c, tx + 2, ty - 5, tx + 4, ty, '#4a3a2a');
    }
    drawText(c, 'The Teeth', 372, 104, '#6a4a30');
    for (let j = 0; j < h - 20; j += 3) for (let i = 0; i < 70; i += 3) {
      if (hash2(i, j) > 0.55) rect(c, 395 + i + Math.sin(j * 0.1 + t) * 2, y0 + 10 + j, 2, 2, 'rgba(120,120,130,0.35)');
    }
  },
  // how a voyage between two places looks and behaves
  voyageStyle(from, to, escort) {
    const teeth = [from, to].sort().join('-') === 'hollow-lighthouse';
    const rough = teeth ? 2.2 : (to === 'lighthouse' || from === 'lighthouse') ? 1.5 : 1;
    const tropic = to === 'coconut' || from === 'coconut' || to === 'pearl';
    return {
      rough, clouds: teeth ? 'storm' : 'fair', wind: teeth ? 0.8 : 0.3,
      mood: escort ? 'wonder' : teeth ? 'eerie' : null,
      weather: u => escort ? (u < 0.35 ? 'fog' : 'clear') : teeth ? (u < 0.6 ? 'storm' : 'fog') : rough > 1.2 ? 'cloudy' : 'clear',
      pal: wea => wea === 'fog' ? 'fog' : wea === 'storm' ? 'storm' : tropic ? 'tropic' : 'north',
      rocks: L => teeth ? { n: Math.floor(L / 75), until: 0.62, big: 0.4 } : { n: Math.floor(L / 550 * rough), until: 1, big: 0 },
      ice: 0,
      bottles: true,
      glow: teeth ? 'fog' : 'night',
      fishSpot: teeth || to === 'lighthouse' || to === 'hollow' ? 'deep' : 'sea',
      intro: teeth && !escort ? 'Ahead, black rocks break the water like the teeth of some huge sleeping animal. Steer carefully!' : null,
      escort: escort ? 'lead' : null,
      escortRiders: [PEOPLE.player.top, PEOPLE.anselRagged.top],
      onEscortArrive() { setFlag('homecoming'); Game.goto('village', { x: 1112, facing: -1, ending: true, banner: false }); },
    };
  },
};

const Chart = {
  active: null,
  open(from) {
    return new Promise(res => {
      const ids = Object.keys(locs()).filter(locKnown);
      let sel = ids.indexOf(from);
      if (sel < 0) sel = Math.max(0, ids.indexOf(chap().home));
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
    const cur = locs()[a.ids[a.sel]];
    const pick = (dx, dy) => {
      let best = -1, bs = 1e9;
      a.ids.forEach((id, i) => {
        if (i === a.sel) return;
        const L = locs()[id];
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
    chap().chartDeco(c, a.t, x0, y0, w, h);
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
      const A = locs()[a.from], B = locs()[id];
      const steps = Math.floor(Math.hypot(B.x - A.x, B.y - A.y) / 5);
      const sel = id === a.ids[a.sel];
      for (let i = 1; i < steps; i += 2) {
        const u = i / steps;
        px(c, lerp(A.x, B.x, u), lerp(A.y, B.y, u), sel ? '#a03020' : '#8a7a60');
      }
    }
    // locations
    a.ids.forEach((id, i) => {
      const L = locs()[id];
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
    let info = locs()[id].name;
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
    const st = this.style = chap().voyageStyle(p.from, p.to, this.escort);
    const cost = p.cost || routeCost(p.from, p.to) || 1;
    this.cost = cost;
    this.L = p.length || (this.escort ? 2600 : cost * 1100);
    this.d = 0; this.t = 0;
    this.lane = 1; this.ly = LANES[1];
    this.hull = maxHull();
    this.inv = 0; this.shake = 0;
    this.speedMul = 1;
    this.hoursTotal = cost * 1.5;
    this.done = false;
    this.notice = null;
    this.flash = 0;
    this.base = S.vessel === 'wren' ? 104 : { row: 46, sail: 70, big: 92 }[S.boat || 'row'];
    // towing another boat home on a line (Chapter III)
    this.tow = p.tow ? { lane: 1, ly: LANES[1], history: [], hp: 3, hit: 0 } : null;
    if (this.tow) this.base *= 0.8;
    // a race against other boats (Chapter III regatta)
    this.race = p.race ? { rivals: (st.rivals || []).map((r, i) => Object.assign({ d: 0, lane: i % 3, ly: LANES[i % 3], boost: 0 }, r)), boost: 0, place: 0 } : null;
    this.chatT = 6;
    this.rough = st.rough;
    this.clouds = new CloudLayer(17 + cost, 9, 18, 90, 0.08, st.clouds, 2200);
    this.spawn();
    const L = locs();
    this.originSil = L[p.from].sil;
    this.destSil = L[p.to].sil;
    Sound.setMood(st.mood || (nightFactor(S.time) > 0.5 ? 'night' : 'sea'));
    Sound.setAmbience({ sea: 0.9, wind: st.wind, rain: 0, fire: 0 });
    S.loc = L[p.from].scene; S.px = L[p.from].dock;
    if (this.escort && st.escort === 'lead') this.hoursTotal = ((6.8 - S.time) % 24 + 24) % 24;
    if (this.escort && st.escort === 'follow') this.hoursTotal = 1.5;
    // the calf trails behind when we lead the whales
    this.calf = { lane: 1, ly: LANES[1], lag: 0, scared: 0, history: [] };
    this.tutorial = !flag('voyageTut');
    if (this.tutorial) { setFlag('voyageTut'); this.notice = { text: 'Up/Down: steer between lanes.  Right: faster.  Left: slow down.', t: 0, dur: 7 }; }
    if (st.intro) Game.run(async () => { await wait(0.6); await Dlg.narrate(st.intro); });
  },
  spawn() {
    const r = RNG(Math.floor(Math.random() * 1e9));
    const E = this.ents = [];
    const L = this.L, st = this.style;
    const rk = st.rocks(L);
    for (let i = 0; i < rk.n; i++) {
      const x = 300 + r() * (L - 500);
      if (x > L * rk.until) continue;
      E.push({ k: 'rock', x, lane: Math.floor(r() * 3), big: r() < rk.big });
    }
    const nIce = Math.floor(L / 1100 * (st.ice || 0));
    for (let i = 0; i < nIce; i++) {
      const lane = Math.floor(r() * 3);
      E.push({ k: 'ice', x: 320 + r() * (L - 520), lane, laneF: lane, drift: (r() - 0.5) * 0.35, big: r() > 0.6, seed: Math.floor(r() * 1000) });
    }
    // keep every stretch passable: never all three lanes blocked at once
    E.sort((a, b) => a.x - b.x);
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length && E[j].x - E[i].x < 70; j++) {
      if (E[j].lane === E[i].lane) E[j].x += 40;
    }
    for (let i = 0; i < E.length; i++) {
      const near = E.filter(o => (o.k === 'rock' || o.k === 'ice') && Math.abs(o.x - E[i].x) < 40);
      if (new Set(near.map(o => o.lane)).size >= 3) E[i].x += 60;
    }
    if (this.race) {
      for (let i = 0; i < Math.floor(L / 260); i++) E.push({ k: 'gust', x: 400 + r() * (L - 700), lane: Math.floor(r() * 3), w: 50 });
      return;
    }
    const nKelp = Math.floor(L / 1100 * (st.kelp || 0));
    for (let i = 0; i < nKelp; i++) E.push({ k: 'kelp', x: 400 + r() * (L - 700), lane: Math.floor(r() * 3), w: 50 + r() * 40 });
    if (this.escort || this.tow) return;
    const nCrates = Math.max(1, Math.floor(L / 700));
    for (let i = 0; i < nCrates; i++) E.push({ k: 'crate', x: 250 + r() * (L - 400), lane: Math.floor(r() * 3) });
    const nSchools = Math.max(1, Math.floor(L / 900));
    for (let i = 0; i < nSchools; i++) E.push({ k: 'school', x: 350 + r() * (L - 600), lane: 1, w: 150 });
    if (r() < 0.6) E.push({ k: st.ice ? 'seals' : 'dolphins', x: 400 + r() * (L - 700), lane: 0 });
    if (st.bottles) {
      const nextLetter = [0, 1, 2, 3].find(i => !S.bottles.includes(i));
      if (nextLetter !== undefined && flag('gullClue') && (r() < 0.65 || !flag('anyBottle'))) {
        E.push({ k: 'bottle', x: 300 + r() * (L - 500), lane: Math.floor(r() * 3), letter: nextLetter });
      }
    }
    if (st.glow === 'fog') for (let i = 0; i < 6; i++) E.push({ k: 'glow', x: L * 0.62 + r() * L * 0.35, lane: Math.floor(r() * 3) });
    else if (st.glow === 'night' && flag('gullClue') && nightFactor(S.time) > 0.5 && r() < 0.5) E.push({ k: 'glow', x: L * (0.3 + r() * 0.5), lane: 0 });
  },
  weather() { return this.style.weather(this.d / this.L); },
  boatX() { return this.escort && this.style.escort === 'follow' ? 380 : 150; },
  update(dt, free) {
    this.t += dt;
    if (this.notice) { this.notice.t += dt; if (this.notice.t > this.notice.dur) this.notice = null; }
    if (this.shake > 0) this.shake -= dt;
    if (this.inv > 0) this.inv -= dt;
    if (this.flash > 0) this.flash -= dt * 2;
    for (const e of this.ents) if (e.k === 'ice' && !e.gone) {
      e.laneF = clamp(e.laneF + e.drift * dt, 0, 2);
      if (e.laneF <= 0 || e.laneF >= 2) e.drift = -e.drift;
      e.lane = Math.round(e.laneF);
    }
    if (!free || this.done) return;
    if (Input.pressed('up') && this.lane > 0) { this.lane--; Sound.sfx('blip'); }
    if (Input.pressed('down') && this.lane < 2) { this.lane++; Sound.sfx('blip'); }
    let target = 1;
    if (Input.held('right')) target = 1.6;
    if (Input.held('left')) target = 0.15;
    const follow = this.escort && this.style.escort === 'follow';
    if (follow && this.calf.lag > 140) target = Math.min(target, 0.25); // wait for the calf
    if (this.inKelp) target = Math.min(target, 0.45);
    if (this.race && this.race.boost > 0) { this.race.boost -= dt; target = Math.max(target, 2.1); }
    this.speedMul = lerp(this.speedMul, target, dt * 2);
    this.ly = lerp(this.ly, LANES[this.lane], dt * 6);
    const wea = this.weather();
    const fogSlow = wea === 'fog' && !flag('lantern') ? 0.6 : 1;
    const v = this.base * this.speedMul * fogSlow;
    const prev = this.d;
    this.d += v * dt;
    Clock.advance((this.d - prev) / this.L * this.hoursTotal);
    if (wea === 'storm' && Math.random() < dt * 0.15) { this.flash = 1; setTimeout(() => Sound.sfx('thunder'), 300); }
    if ((wea === 'fog' || this.escort) && Math.random() < dt * (this.escort ? 0.25 : 0.08)) Sound.whale(this.escort ? 0.22 : 0.12);
    if (Math.random() < dt * 0.05) Sound.sfx('gull');
    Sound.setAmbience({ rain: wea === 'storm' ? 1 : 0, wind: wea === 'storm' ? 0.9 : wea === 'snow' ? 0.6 : this.style.wind });
    const bx = this.d + this.boatX();
    const laneNow = Math.round((this.ly - LANES[0]) / (LANES[1] - LANES[0]));
    this.prompt = null;
    this.inKelp = false;
    for (const e of this.ents) {
      if (e.gone) continue;
      const dx = e.x - bx;
      const hazard = e.k === 'rock' || e.k === 'ice';
      if (hazard && Math.abs(dx) < (e.big ? 16 : 12) && e.lane === laneNow && this.inv <= 0) {
        this.inv = 1.6; this.shake = 0.5; e.hit = true; Sound.sfx('bump');
        if (this.race) { this.speedMul = 0.2; this.notice = { text: 'Bump! You lost speed on the rocks.', t: 0, dur: 2 }; continue; }
        this.hull--;
        if (this.hull <= 0) { this.sink(); return; }
        Toast.show((e.k === 'ice' ? 'You hit the ice!' : 'Your hull scraped a rock!') + ' (' + this.hull + ' left)', 'heart');
      }
      if ((e.k === 'crate' || e.k === 'bottle') && Math.abs(dx) < 14 && e.lane === laneNow) {
        e.gone = true;
        if (e.k === 'crate') this.salvage();
        else Game.run(() => this.foundBottle(e.letter));
      }
      if (e.k === 'kelp' && e.lane === laneNow && dx < e.w / 2 && dx > -e.w / 2) {
        this.inKelp = true;
        if (!this.kelpHint) { this.kelpHint = true; this.notice = { text: 'Kelp! It tangles round the rudder. Steer into clear water.', t: 0, dur: 3.5 }; }
      }
      if (e.k === 'gust' && !e.gone && e.lane === laneNow && Math.abs(dx) < e.w / 2) {
        e.gone = true; this.race.boost = 1.6; Sound.sfx('whoosh');
        if (!this.gustHint) { this.gustHint = true; this.notice = { text: 'A gust of wind fills the sail! Catch the sparkles to speed up.', t: 0, dur: 3.5 }; }
      }
      if (e.k === 'school' && dx < e.w / 2 && dx > -e.w / 2) {
        if (this.speedMul < 0.5) this.prompt = e;
        else if (!this.schoolHint) { this.schoolHint = true; this.notice = { text: 'Birds diving! Slow down (hold Left) to fish here.', t: 0, dur: 4 }; }
      }
    }
    if (follow) this.updateCalf(dt);
    if (this.tow) { this.updateTow(dt); if (this.done) return; }
    if (this.race) this.updateRace(dt);
    if (this.style.chatter && !this.notice) {
      this.chatT -= dt;
      if (this.chatT <= 0) {
        this.chatT = 14 + Math.random() * 8;
        const line = this.style.chatter(this);
        if (line) this.notice = { text: line, t: 0, dur: 5 };
      }
    }
    if (this.prompt && Input.pressed('act')) {
      Input.consume('act');
      Game.run(() => goFishing({ rodX: this.boatX() + 6, rodY: this.ly - 14, waterY: this.ly + 2, dir: 1, spot: this.style.fishSpot }));
    }
    if (this.d >= this.L) this.arrive();
  },
  // the calf copies your lane a moment later, and bumps into ice you steer it into
  updateCalf(dt) {
    const c = this.calf;
    c.history.push(this.lane);
    if (c.history.length > 50) c.lane = c.history.shift();
    c.ly = lerp(c.ly, LANES[c.lane], dt * 4);
    if (c.scared > 0) { c.scared -= dt; c.lag += this.base * this.speedMul * dt; }
    else c.lag = Math.max(0, c.lag - 40 * dt);
    const cx = this.d + this.boatX() - 52 - 60 - c.lag;
    const cl = Math.round((c.ly - LANES[0]) / (LANES[1] - LANES[0]));
    for (const e of this.ents) {
      if (e.k !== 'ice' || e.gone || e.calfHit) continue;
      if (Math.abs(e.x - cx) < 14 && e.lane === cl) {
        e.calfHit = true; c.scared = 1.6; Sound.sfx('bump'); Sound.whale(0.1);
        this.notice = { text: 'The calf bumped the ice and got scared! Slow down and let it catch up.', t: 0, dur: 3.5 };
      }
    }
  },
  towX() { return this.d + this.boatX() - 66; },
  // the towed boat copies your lane a moment later, and takes knocks from anything you steer it into
  updateTow(dt) {
    const tw = this.tow;
    tw.history.push(this.lane);
    if (tw.history.length > 40) tw.lane = tw.history.shift();
    tw.ly = lerp(tw.ly, LANES[tw.lane], dt * 4);
    if (tw.hit > 0) tw.hit -= dt;
    const tx = this.towX();
    const tl = Math.round((tw.ly - LANES[0]) / (LANES[1] - LANES[0]));
    for (const e of this.ents) {
      if ((e.k !== 'ice' && e.k !== 'rock') || e.gone || e.towHit) continue;
      if (Math.abs(e.x - tx) < (e.big ? 16 : 12) && e.lane === tl && tw.hit <= 0) {
        e.towHit = true; tw.hp--; tw.hit = 1.2; Sound.sfx('bump');
        if (tw.hp <= 0) { this.towSank(); return; }
        this.notice = { text: 'Crunch! The Wren hit ' + (e.k === 'ice' ? 'the ice' : 'a rock') + '. She follows your path, so steer for both of you! (' + tw.hp + ' left)', t: 0, dur: 4 };
      }
    }
  },
  towSank() {
    this.done = true;
    Game.run(async () => {
      await Dlg.narrate("The Wren is taking on water! Grandpa bails like mad while you turn back to " + locs()[this.from].name + ', towing her slowly through the calm.');
      Clock.advance(2);
      const L = locs()[this.from];
      Game.goto(L.scene, { x: L.dock });
    });
  },
  updateRace(dt) {
    const R = this.race;
    for (const rv of R.rivals) {
      if (rv.fin) continue;
      // rivals sail steadily, dodge rocks, and ease off or push to keep the race close
      const gap = rv.d - this.d;
      const band = gap > 220 ? 0.82 : gap < -260 ? 1.12 : 1;
      const v = this.base * rv.speed * band * (rv.boost > 0 ? 1.4 : 1);
      if (rv.boost > 0) rv.boost -= dt;
      rv.d += v * dt;
      const rx = rv.d + this.boatX();
      const ahead = this.ents.find(e => e.k === 'rock' && e.lane === rv.lane && e.x - rx > 0 && e.x - rx < 90);
      if (ahead) rv.lane = rv.lane === 1 ? (ahead.x % 2 < 1 ? 0 : 2) : 1;
      const g = this.ents.find(e => e.k === 'gust' && !e.gone && Math.abs(e.x - rx) < 20 && e.lane === rv.lane);
      if (g && Math.random() < 0.3) { g.gone = true; rv.boost = 1.2; }
      rv.ly = lerp(rv.ly, LANES[rv.lane], dt * 3);
      if (rv.d >= this.L) { rv.fin = true; R.place++; }
    }
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
      await Dlg.narrate('Water is pouring in through the cracked planks! You bail as fast as you can and turn back toward ' + locs()[this.from].name + '.');
      Clock.advance(2);
      const L = locs()[this.from];
      Game.goto(L.scene, { x: L.dock });
    });
  },
  arrive() {
    this.done = true;
    if (this.escort) { this.style.onEscortArrive(); return; }
    if (this.race) { this.style.onRaceEnd(this.race.place + 1); return; }
    if (this.style.onArrive && this.style.onArrive(this.to, this)) return;
    const L = locs()[this.to];
    Game.goto(L.scene, { x: L.dock });
  },
  draw(c) {
    const h = S.time, wea = this.weather(), t = this.t, st = this.style;
    const horizon = 150;
    const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
    Sky.draw(c, h, wea, horizon, Game.t);
    const pal = st.pal(wea);
    const lights = [];
    let boatInfo = null;
    const follow = this.escort && st.escort === 'follow';
    composeWorld(c, w => {
      w.save();
      w.translate(sx, 0);
      this.clouds.draw(w, this.d, t * 3, wea === 'fog' ? 0.4 : 1);
      const silCol = rgbStr(mixRgb(skyColors(h, wea)[2], '#2a3a4a', 0.45));
      if (st.bergs) for (let i = 0; i < 4; i++) {
        const bx = ((i * 260 - this.d * 0.05) % 1040 + 1040) % 1040 - 140;
        drawSilhouette(w, 'ice', bx, horizon, rgbStr(mixRgb(skyColors(h, wea)[2], '#e8f4fa', 0.35)), t);
      }
      const ox = 120 - this.d * 0.12;
      if (ox > -120) drawSilhouette(w, this.originSil, ox, horizon, silCol, t);
      const dx = W + 120 - (this.d - (this.L - 1600)) * 0.12;
      if (dx < W + 100) drawSilhouette(w, this.destSil, dx, horizon, silCol, t);
      Sea.draw(w, horizon, H, this.d, t, pal, h, { rough: this.rough, flow: 0 });
      const items = [];
      for (const e of this.ents) {
        if (e.gone) continue;
        const ex = e.x - this.d;
        if (ex < -60 || ex > W + 60) continue;
        const ey = e.k === 'ice' ? lerp(LANES[0], LANES[2], e.laneF / 2) : LANES[e.lane];
        items.push({ y: ey, f: () => this.drawEnt(w, e, ex, t, lights, pal, ey) });
      }
      items.push({
        y: this.ly + 0.5, f: () => {
          const riders = this.escort ? st.escortRiders : st.riders ? st.riders() : [PEOPLE.player.top];
          const blink = this.inv > 0 && Math.floor(this.inv * 10) % 2 === 0;
          if (!blink) boatInfo = drawBoat(w, boatCfg(), this.boatX(), this.ly, t, { riders, rowing: this.speedMul > 0.3, rough: this.rough, phase: this.d });
          else boatInfo = { lantern: null };
          waterFront(w, this.boatX() - 30, this.boatX() + 32, this.ly + 1, t + this.d * 0.02, pal, 0.55);
          if (this.speedMul > 0.4) for (let i = 0; i < 6; i++) {
            const wx = this.boatX() - 28 - i * 7 - ((t * 30) % 7);
            px(w, wx, this.ly + 1 + (i % 2), SEA_PALS[pal].hi);
          }
        },
      });
      if (this.escort && st.escort === 'lead') {
        const wx = this.boatX() + 90 + Math.sin(t * 0.4) * 16;
        items.push({ y: LANES[0] - 1, f: () => { drawWhale(w, wx, LANES[0] - 44 + Math.sin(t * 0.8) * 2, t, 1); frontWater(w, LANES[0] - 6, t, pal, wx, wx + 280, 0); } });
        this.whaleX = wx; this.whaleY = LANES[0] - 44 + Math.sin(t * 0.8) * 2;
      }
      if (follow) {
        const wx = this.boatX() - 480 + Math.sin(t * 0.4) * 10;
        this.whaleX = wx; this.whaleY = LANES[0] - 48 + Math.sin(t * 0.8) * 2;
        items.push({ y: LANES[0] - 1, f: () => { drawWhale(w, wx, this.whaleY, t, 1); frontWater(w, LANES[0] - 8, t, pal, wx, wx + 280, 0); } });
        const cw = whaleSprite(0.42);
        this.calfX = this.boatX() - 52 - this.calf.lag - cw.L + Math.sin(t * 1.3) * 3;
        this.calfY = this.calf.ly - cw.cy - 3 + Math.sin(t * 1.6) * 1.5;
        items.push({ y: this.calf.ly - 0.2, f: () => { drawWhale(w, this.calfX, this.calfY, t, 0, { s: 0.42 }); waterFront(w, this.calfX, this.calfX + cw.L, this.calf.ly - 1, t, pal, 0.7); } });
      }
      if (this.tow) {
        const tw = this.tow, tx = this.boatX() - 66;
        const blink = tw.hit > 0 && Math.floor(tw.hit * 10) % 2 === 0;
        items.push({
          y: tw.ly + 0.4, f: () => {
            const bob = waveY(tx + this.d, t, this.rough) * 0.6;
            line(w, this.boatX() - 40, this.ly - 2, tx + 22, tw.ly - 3 + bob, '#c8b890');
            if (!blink) drawBoat(w, { type: 'wren', sail: 'none' }, tx, tw.ly, t, { rough: this.rough, phase: this.d - 66 });
            waterFront(w, tx - 24, tx + 26, tw.ly + 1, t + this.d * 0.02, pal, 0.55);
          },
        });
      }
      if (this.race) for (const rv of this.race.rivals) {
        const rx = this.boatX() + rv.d - this.d;
        if (rx < -80 || rx > W + 80) continue;
        items.push({ y: rv.ly + 0.3, f: () => { drawBoat(w, rv.cfg, rx, rv.ly, t, { riders: rv.riders ? rv.riders() : [], rough: this.rough, phase: rv.d }); waterFront(w, rx - 30, rx + 32, rv.ly + 1, t + rv.d * 0.02, pal, 0.55); } });
      }
      if (this.race && st.finishDraw) { const fx = this.boatX() + this.L - this.d; if (fx > -80 && fx < W + 200) items.push({ y: LANES[0] - 2, f: () => st.finishDraw(w, fx, t, pal) }); }
      items.sort((a, b) => a.y - b.y).forEach(i => i.f());
      w.restore();
    }, h, wea);
    const nf = nightFactor(h);
    if (this.escort) whaleSpots(c, this.whaleX, this.whaleY, t, 1);
    if (boatInfo && boatInfo.lantern) lights.push({ x: boatInfo.lantern.x, y: boatInfo.lantern.y, r: wea === 'fog' || follow ? 44 : 28, col: '#ffcf7a', a: wea === 'fog' ? 0.6 : 0.5, flicker: true, always: wea === 'fog' || wea === 'storm' || follow });
    drawLights(c, lights, nf);
    if (wea === 'storm') Weather.rain(c, t, 1, -1.2);
    if (wea === 'snow') Weather.snow(c, t, 0.8);
    if (wea === 'fog') {
      const dens = flag('lantern') ? 0.7 : 0.95;
      Weather.fog(c, t, this.d, this.escort ? Math.max(0, 0.8 - this.d / this.L * 2.2) : dens, nf > 0.5 ? '#4a5664' : '#c4ccd2');
      if (boatInfo && boatInfo.lantern && !this.escort) drawLights(c, [{ x: boatInfo.lantern.x, y: boatInfo.lantern.y, r: 40, col: '#fff0c0', a: 0.35, always: true }], 1);
    }
    if (this.escort && st.escort === 'lead') whaleSpots(c, this.whaleX, this.whaleY, t, 0.6);
    if (this.flash > 0) { c.globalAlpha = this.flash * 0.6; rect(c, 0, 0, W, H, '#e8f0ff'); c.globalAlpha = 1; }
    const px0 = 150, pw = 180, py = 22;
    c.globalAlpha = 0.85; rect(c, px0 - 6, py - 4, pw + 12, 20, '#0e1220'); c.globalAlpha = 1;
    rect(c, px0, py + 4, pw, 1, '#6a7488');
    const u = clamp(this.d / this.L, 0, 1);
    rect(c, px0, py + 4, pw * u, 1, '#e8dcc0');
    rect(c, px0 + pw * u - 1, py + 1, 3, 6, '#ffd25a');
    drawText(c, this.race ? 'Start' : locs()[this.from].name, px0, py + 7, '#8a94a8');
    drawText(c, this.race ? 'Finish' : locs()[this.to].name, px0 + pw, py + 7, '#dfe6f2', { align: 'right' });
    if (this.race) for (const rv of this.race.rivals) rect(c, px0 + pw * clamp(rv.d / this.L, 0, 1) - 1, py + 2, 2, 4, rv.mark || '#c8c8c8');
    if (this.tow) {
      drawText(c, 'Wren', 6, 31, '#dfe6f2');
      for (let i = 0; i < 3; i++) { c.drawImage(ICONS.heart, 30 + i * 9, 30); if (i >= this.tow.hp) { c.globalAlpha = 0.75; rect(c, 30 + i * 9, 30, 8, 8, '#0e1220'); c.globalAlpha = 1; } }
    }
    if ((!this.escort || follow) && !this.race) {
      for (let i = 0; i < maxHull(); i++) c.drawImage(ICONS.heart, 6 + i * 9, 20);
      for (let i = this.hull; i < maxHull(); i++) { c.globalAlpha = 0.75; rect(c, 6 + i * 9, 20, 8, 8, '#0e1220'); c.globalAlpha = 1; }
    }
    if (this.prompt && !Game.busy()) drawText(c, '[E] Fish here', this.boatX(), this.ly - 40, '#fff6dc', { align: 'center', outline: '#14101a' });
    if (this.notice) drawText(c, this.notice.text, W / 2, 60, '#fff6dc', { align: 'center', outline: '#14101a' });
  },
  drawEnt(w, e, x, t, lights, pal, ey) {
    const y = ey !== undefined ? ey : LANES[e.lane];
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
    } else if (e.k === 'ice') {
      const wid = e.big ? 28 : 18, hgt = e.big ? 7 : 4;
      const b = waveY(e.x, t) * 0.5;
      for (let i = 0; i < wid; i++) {
        const top = Math.round(hgt - (hash2(i >> 2, e.seed) * 2) - (i < 3 || i > wid - 4 ? 2 : 0));
        for (let j = 0; j < top; j++) px(w, x - wid / 2 + i, y + 2 + b - j, j === top - 1 ? '#ffffff' : i < wid * 0.3 ? '#b8d8ea' : '#dcedf6');
        px(w, x - wid / 2 + i, y + 3 + b, '#7aa8c4');
      }
      waterFront(w, x - wid / 2 - 3, x + wid / 2 + 3, y + 2 + b, t + e.x, pal, 0.5);
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
        if (this.style.ice) drawFlyingPuffin(w, gx, gy, t, i); else drawGull(w, gx, gy, t, { seed: i * 1.7 });
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
    } else if (e.k === 'seals') {
      for (let i = 0; i < 3; i++) {
        const sx = x + i * 16, sy = y + 1 + Math.sin(t * 1.4 + i) * 1;
        rect(w, sx - 3, sy - 3, 7, 3, '#5a5f66'); rect(w, sx + 3, sy - 5, 3, 3, '#5a5f66'); px(w, sx + 5, sy - 4, '#101014');
      }
    } else if (e.k === 'kelp') {
      for (let i = 0; i < e.w; i += 3) {
        const kx = x - e.w / 2 + i, sway = Math.sin(t * 1.5 + i * 0.4) * 1.5;
        const hh = 2 + Math.round(hash2(i, Math.floor(e.x)) * 3);
        for (let j = 0; j < hh; j++) px(w, kx + (j === hh - 1 ? sway : 0), y + 3 - j, j === hh - 1 ? '#8a9a3a' : '#5a6a2a');
        if (i % 9 === 0) ellipse(w, kx + 1, y + 2, 2, 1, '#6a5a24');
      }
    } else if (e.k === 'gust') {
      for (let i = 0; i < 6; i++) {
        const ph = (t * 1.8 + i / 6) % 1;
        const gx = x + e.w / 2 - ph * e.w, gy = y - 6 - (i % 3) * 4 + Math.sin(t * 3 + i) * 1;
        w.globalAlpha = Math.sin(ph * Math.PI) * 0.9;
        rect(w, gx, gy, 5 + (i % 2) * 3, 1, '#ffffff');
        w.globalAlpha = 1;
      }
      if (Math.floor(t * 6 + e.x) % 4 === 0) px(w, x, y - 12, '#fff6c0');
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
  const dep = chap().departure ? chap().departure(from, dest) : null;
  const cost = routeCost(from, dest);
  const short = Inv.eat(cost);
  if (short > 0) await Dlg.narrate("You don't have enough food, so you set off hungry. It's going to be a long trip home.");
  else Toast.show('-' + cost + ' food', 'food');
  if (dep && dep.night && nightFactor(S.time) < 0.6) {
    await Dlg.narrate('You wait for nightfall. The sky darkens, and then, slowly, the northern lights begin to ripple overhead. Time to go.');
    S.time = 21.5;
  }
  Game.goto('voyage', Object.assign({ from, to: dest, cost }, dep || {}));
}
