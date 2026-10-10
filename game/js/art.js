'use strict';
// ---------------------------------------------------------------------------
// Procedural pixel art: sky, sea, clouds, people, boats, props, fish, icons
// ---------------------------------------------------------------------------

// ---------------- time of day ----------------
const SKY_KEYS = [
  [0, '#05070f', '#0b1226', '#1a2340'],
  [4.5, '#070a18', '#121a36', '#26304e'],
  [5.8, '#1b2350', '#4a3d6e', '#a0607a'],
  [6.8, '#3b5aa0', '#d08a8a', '#ffc080'],
  [8.5, '#3d78c8', '#7fb0e6', '#cfe5f5'],
  [16.5, '#3a72c4', '#80acdf', '#e3e0cc'],
  [18.3, '#2c3a80', '#c06a7a', '#ff9a50'],
  [19.4, '#141b44', '#3d2f5e', '#7a4a60'],
  [20.6, '#070a18', '#0e1630', '#1e2846'],
  [24, '#05070f', '#0b1226', '#1a2340'],
];
const TINT_KEYS = [
  [0, '#0a1238', 0.62], [4.5, '#0a1238', 0.6], [6, '#4a3a70', 0.36], [7, '#ff9a60', 0.12],
  [8.5, '#ff9a60', 0], [17, '#ff7a40', 0], [18.3, '#ff7a40', 0.16], [19.4, '#3a2a60', 0.42],
  [20.6, '#0a1238', 0.6], [24, '#0a1238', 0.62],
];

function keyAt(keys, h) {
  h = ((h % 24) + 24) % 24;
  for (let i = 0; i < keys.length - 1; i++) {
    if (h >= keys[i][0] && h <= keys[i + 1][0]) {
      const t = (h - keys[i][0]) / (keys[i + 1][0] - keys[i][0] || 1);
      return [keys[i], keys[i + 1], t];
    }
  }
  return [keys[0], keys[0], 0];
}

function nightFactor(h) {
  h = ((h % 24) + 24) % 24;
  if (h < 4.5 || h >= 21) return 1;
  if (h < 7) return 1 - (h - 4.5) / 2.5;
  if (h < 18) return 0;
  return (h - 18) / 3;
}

function skyColors(h, weather) {
  const [a, b, t] = keyAt(SKY_KEYS, h);
  let cols = [1, 2, 3].map(i => mixRgb(a[i], b[i], t));
  const nf = nightFactor(h);
  let wc = null, wt = 0;
  if (weather === 'fog') { wc = mixRgb('#8e979f', '#161b22', nf); wt = 0.78; }
  else if (weather === 'storm') { wc = mixRgb('#4d5866', '#0b0e15', nf); wt = 0.72; }
  else if (weather === 'cloudy') { wc = mixRgb('#a3adb8', '#141922', nf); wt = 0.35; }
  else if (weather === 'snow') { wc = mixRgb('#c4ced8', '#161c26', nf); wt = 0.55; }
  if (wc) cols = cols.map(c => mixRgb(c, wc, wt));
  return cols;
}

function worldTint(h, weather) {
  const [a, b, t] = keyAt(TINT_KEYS, h);
  let col = mixRgb(a[1], b[1], t), al = lerp(a[2], b[2], t);
  const wt = weather === 'fog' ? ['#9aa3ab', 0.22] : weather === 'storm' ? ['#1e2a3a', 0.36] : weather === 'cloudy' ? ['#8a96a4', 0.1] : weather === 'snow' ? ['#c8d6e4', 0.14] : null;
  if (wt) { col = mixRgb(wt[0], col, clamp(al / 0.6, 0, 1)); al = Math.max(al, wt[1]); }
  return { col: rgbStr(col), a: al };
}

// Moon phase for the night that hour h belongs to: 0 = new, 0.5 = full.
// It moves on by one eighth each night (a quick, game-sized lunar month).
function moonPhase(h) {
  const day = (S && S.day) || 1;
  const night = ((h % 24) + 24) % 24 < 12 ? day - 1 : day;
  return (((night - 1) % 8 + 8) % 8 + 3) / 8 % 1;
}
function moonLight(ph) { return (1 - Math.cos(ph * Math.PI * 2)) / 2; }
const _moonCache = {};
function moonSprite(ph) {
  const key = Math.round(ph * 8);
  if (_moonCache[key]) return _moonCache[key];
  const R = 6, size = R * 2 + 1;
  const [c, x] = makeCanvas(size, size);
  const k = Math.cos(key / 8 * Math.PI * 2);
  const craters = [[-2, -1], [1, 2], [2, -2], [-1, 2], [0, 0]];
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const dx = (i - R) / R, dy = (j - R) / R;
    if (dx * dx + dy * dy > 1.05) continue;
    const w = Math.sqrt(Math.max(0, 1 - dy * dy));
    const lit = key < 4 ? dx > k * w : dx < -k * w;
    if (lit) {
      const crater = craters.some(([cx, cy]) => i - R === cx && j - R === cy);
      px(x, i, j, crater ? '#c6cfdf' : '#e9eef8');
    } else {
      x.globalAlpha = 0.35; px(x, i, j, '#3a4460'); x.globalAlpha = 1;
    }
  }
  _moonCache[key] = c;
  return c;
}

const Sky = {
  cache: null, key: '',
  stars: (() => {
    const r = RNG(99), s = [];
    for (let i = 0; i < 150; i++) s.push({ x: r() * W, y: r() * 150, b: r(), p: r() * 6.28, sp: 0.5 + r() * 2 });
    return s;
  })(),
  render(h, weather, horizon) {
    const key = Math.floor(h * 8) + '|' + weather + '|' + horizon;
    if (key === this.key) return this.cache;
    this.key = key;
    if (!this.cache) this.cache = makeCanvas(W, H)[0];
    const c = this.cache, x = c.getContext('2d');
    const [top, mid, hor] = skyColors(h, weather);
    const img = x.createImageData(W, H), d = img.data;
    const step = 7;
    for (let y = 0; y < H; y++) {
      const t = clamp(y / horizon, 0, 1);
      const col = t < 0.55 ? mixRgb(top, mid, t / 0.55) : mixRgb(mid, hor, (t - 0.55) / 0.45);
      const br = BAYER4[y & 3];
      for (let i = 0; i < W; i++) {
        const b = br[i & 3];
        const k = (y * W + i) * 4;
        d[k] = Math.floor(col[0] / step + b) * step;
        d[k + 1] = Math.floor(col[1] / step + b) * step;
        d[k + 2] = Math.floor(col[2] / step + b) * step;
        d[k + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  },
  draw(c, h, weather, horizon, t) {
    c.drawImage(this.render(h, weather, horizon), 0, 0);
    const nf = nightFactor(h);
    const vis = weather === 'fog' ? 0.05 : weather === 'storm' ? 0 : weather === 'cloudy' || weather === 'snow' ? 0.4 : 1;
    if (nf > 0.05 && vis > 0) {
      for (const s of this.stars) {
        if (s.y > horizon - 6) continue;
        const a = nf * vis * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp + s.p))) * (0.4 + s.b * 0.6);
        if (a < 0.08) continue;
        c.fillStyle = 'rgba(255,250,235,' + a.toFixed(2) + ')';
        c.fillRect(s.x | 0, s.y | 0, 1, 1);
        if (s.b > 0.92) { c.fillRect((s.x | 0) - 1, s.y | 0, 3, 1); c.fillRect(s.x | 0, (s.y | 0) - 1, 1, 3); }
      }
    }
    if (weather === 'aurora' && typeof drawAurora === 'function') drawAurora(c, t, horizon, Math.max(0.25, nf) * (0.6 + 0.4 * Math.sin(t * 0.13)));
    if (weather === 'storm') return;
    // sun
    const st = (h - 5.8) / 13.4;
    if (st > 0 && st < 1) {
      const sx = lerp(30, W - 30, st), sy = horizon - Math.sin(st * Math.PI) * (horizon - 22) + 4;
      const low = 1 - Math.sin(st * Math.PI);
      const col = rgbStr(mixRgb('#fff6d0', '#ff8a40', low * low));
      const fa = weather === 'fog' ? 0.35 : 1;
      c.globalAlpha = fa;
      const g = glowSprite(24, '#ffe9b0', 4, 0.5);
      c.drawImage(g, Math.round(sx - 24), Math.round(sy - 24));
      ellipse(c, sx, sy, 6, 6, col);
      c.globalAlpha = 1;
    }
    // moon
    let mt = -1;
    if (h >= 18.8) mt = (h - 18.8) / 11; else if (h < 6.5) mt = (h + 5.2) / 11;
    if (mt > 0 && mt < 1) {
      const mx = lerp(40, W - 40, mt), my = horizon - Math.sin(mt * Math.PI) * (horizon - 26) + 4;
      const ph = moonPhase(h), lit = moonLight(ph);
      const fa = weather === 'fog' ? 0.3 : 1;
      c.globalAlpha = fa * (0.1 + 0.9 * lit);
      c.drawImage(glowSprite(18, '#a8c0ff', 4, 0.35), Math.round(mx - 18), Math.round(my - 18));
      c.globalAlpha = fa;
      c.drawImage(moonSprite(ph), Math.round(mx - 6), Math.round(my - 6));
      c.globalAlpha = 1;
    }
  },
  celestialX(h) {
    const st = (h - 5.8) / 13.4;
    if (st > 0 && st < 1) return { x: lerp(30, W - 30, st), col: '#fff0c0', a: 1 - nightFactor(h) * 0.5 };
    let mt = -1;
    if (h >= 18.8) mt = (h - 18.8) / 11; else if (h < 6.5) mt = (h + 5.2) / 11;
    if (mt > 0 && mt < 1) return { x: lerp(40, W - 40, mt), col: '#cfdcff', a: 0.6 * moonLight(moonPhase(h)) };
    return null;
  },
};

// ---------------- clouds ----------------
function makeCloud(seed, w, h, kind) {
  const r = RNG(seed);
  const [c, x] = makeCanvas(w, h);
  const blobs = [];
  const n = 4 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    blobs.push({ x: w * (0.12 + 0.76 * u) + (r() - 0.5) * 6, y: h * (0.55 + (r() - 0.5) * 0.25), r: h * (0.22 + r() * 0.3) * (1 - Math.abs(u - 0.5) * 0.9) });
  }
  const inside = (i, j) => {
    if (j > h * 0.86) return false;
    for (const b of blobs) { const dx = (i - b.x) / 1.25, dy = j - b.y; if (dx * dx + dy * dy < b.r * b.r) return true; }
    return false;
  };
  const pal = kind === 'storm'
    ? ['#5c6672', '#46505c', '#353d48', '#2a3039']
    : ['#ffffff', '#eef2f7', '#d4dbe5', '#b3bdcb'];
  const img = x.createImageData(w, h), d = img.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!inside(i, j)) continue;
    let ci;
    if (!inside(i, j - 2)) ci = 0;
    else if (!inside(i, j - 4)) ci = 1;
    else ci = j > h * 0.62 ? 3 : 2;
    if (ci === 2 && BAYER4[j & 3][i & 3] > 0.7 && j > h * 0.55) ci = 3;
    if (ci === 1 && BAYER4[j & 3][i & 3] > 0.75) ci = 2;
    const col = hexRgb(pal[ci]);
    const k = (j * w + i) * 4;
    d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

class CloudLayer {
  constructor(seed, count, y0, y1, par, kind, spanW) {
    const r = RNG(seed);
    this.par = par; this.span = spanW || 1400;
    this.clouds = [];
    for (let i = 0; i < count; i++) {
      const w = 40 + Math.floor(r() * 70), h = 14 + Math.floor(r() * 14);
      this.clouds.push({ img: makeCloud(seed * 31 + i, w, h, kind), x: r() * this.span, y: lerp(y0, y1, r()), sp: 1 + r() * 2 });
    }
  }
  draw(c, camX, t, alpha) {
    if (alpha !== undefined) c.globalAlpha = alpha;
    for (const cl of this.clouds) {
      let x = (cl.x + t * cl.sp - camX * this.par) % this.span;
      if (x < 0) x += this.span;
      x -= 120;
      if (x > W || x + cl.img.width < 0) continue;
      c.drawImage(cl.img, Math.round(x), Math.round(cl.y));
    }
    c.globalAlpha = 1;
  }
}

// ---------------- sea ----------------
const SEA_PALS = {
  north: { far: '#6a9cc2', near: '#123a5e', hi: '#d8f0ff', lo: '#0c2a46' },
  tropic: { far: '#6cc4cf', near: '#0f5a74', hi: '#e8fffb', lo: '#0a4258' },
  fog: { far: '#8a98a2', near: '#22343f', hi: '#d0dade', lo: '#16252e' },
  storm: { far: '#4c5c6a', near: '#0f1d29', hi: '#b8c8d4', lo: '#0a141d' },
  night: { far: '#2a3e5e', near: '#081a2c', hi: '#7fa6d6', lo: '#05101c' },
};
const Sea = {
  cache: {},
  base(top, bottom, palName) {
    const key = top + '|' + bottom + '|' + palName;
    if (this.cache[key]) return this.cache[key];
    const pal = SEA_PALS[palName] || SEA_PALS.north;
    const hgt = Math.max(1, bottom - top);
    const [c, x] = makeCanvas(W, hgt);
    const img = x.createImageData(W, hgt), d = img.data;
    const bands = 10;
    for (let j = 0; j < hgt; j++) {
      const k = Math.pow(j / hgt, 0.6) * (bands - 1);
      for (let i = 0; i < W; i++) {
        const b = Math.min(bands - 1, Math.floor(k + BAYER4[j & 3][i & 3] * 0.999));
        const col = mixRgb(pal.far, pal.near, b / (bands - 1));
        const q = (j * W + i) * 4;
        d[q] = col[0]; d[q + 1] = col[1]; d[q + 2] = col[2]; d[q + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    this.cache[key] = c;
    return c;
  },
  // draws a sea band from `top` (horizon) to `bottom`; camX gives parallax
  draw(c, top, bottom, camX, t, palName, h, opts) {
    opts = opts || {};
    const pal = SEA_PALS[palName] || SEA_PALS.north;
    c.drawImage(this.base(top, bottom, palName), 0, top);
    const hgt = bottom - top;
    const cel = opts.noGlint ? null : Sky.celestialX(h);
    const rough = opts.rough || 1;
    const hiC = pal.hi, loC = pal.lo;
    let y = top + 1, row = 0;
    while (y < bottom) {
      const d = (y - top) / hgt;
      const gap = 1 + Math.floor(d * 4);
      const spacing = 12 + d * 44;
      const len = 1 + Math.floor(d * 6 * Math.min(1.6, rough));
      const par = 0.15 + d * 0.85;
      const sway = Math.sin(t * 1.3 + row * 0.9) * (1 + d * 3) * rough;
      const off = camX * par + sway + t * (2 + d * 6) * (opts.flow || 0);
      const k0 = Math.floor((off - 20) / spacing);
      const k1 = Math.ceil((off + W + 20) / spacing);
      for (let k = k0; k <= k1; k++) {
        const hv = hash2(k, row * 13 + 7);
        const blink = hash2(k + Math.floor(t * (0.8 + hv)), row) > 0.25;
        if (!blink) continue;
        const xx = Math.round(k * spacing + hv * spacing - off);
        let col = hv > 0.5 ? hiC : loC;
        let a = hv > 0.5 ? 0.25 + d * 0.35 : 0.5;
        if (cel && hv > 0.3) {
          const dist = Math.abs(xx - cel.x);
          if (dist < 8 + d * 50) { col = cel.col; a = cel.a * (1 - dist / (8 + d * 50)) + 0.2; }
        }
        c.globalAlpha = Math.min(1, a);
        c.fillStyle = col;
        c.fillRect(xx, y, len, 1);
      }
      y += gap; row++;
    }
    c.globalAlpha = 1;
  },
};
function waveY(x, t, amp) {
  amp = amp || 1;
  return (Math.sin(x * 0.045 + t * 1.6) * 1.4 + Math.sin(x * 0.12 - t * 2.3) * 0.7) * amp;
}

// near-water strip: covers bottom of objects sitting in water, with foam
function waterFront(c, x0, x1, wy, t, palName, alpha) {
  const pal = SEA_PALS[palName] || SEA_PALS.north;
  for (let x = Math.floor(x0); x < x1; x += 2) {
    const y = Math.round(wy + waveY(x, t, 0.6));
    c.globalAlpha = alpha === undefined ? 0.85 : alpha;
    c.fillStyle = pal.near;
    c.fillRect(x, y + 1, 2, 6);
    c.globalAlpha = 1;
    if (hash2(x, Math.floor(t * 3)) > 0.45) { c.fillStyle = pal.hi; c.fillRect(x, y, 2, 1); }
  }
  c.globalAlpha = 1;
}

// ---------------- people (12 x 28, facing right) ----------------
const PW = 12, PH = 28;
const PEOPLE_LEGS = {
  idle: ['....pppppp..', '....pppppp..', '....pppPpp..', '....ppp.pp..', '....ppp.pp..', '....ppp.pp..', '....ppp.pp..', '....PPP.PP..', '....BBB.BBB.', '....BBB.BBBB'],
  walkA: ['....pppppp..', '...ppppppp..', '...pppP.ppp.', '..ppp...ppp.', '..pp.....pp.', '.ppP.....pp.', '.pp......ppp', '.PP.......PP', 'BBB.......BB', 'BB........BB'],
  walkB: ['....pppppp..', '....pppppp..', '.....ppppp..', '.....pppp...', '.....pppp...', '.....ppp....', '.....ppp....', '.....PPP....', '.....BBBB...', '.....BBBBB..'],
  sit: ['....pppppppp', '....pppppppp', '.........ppp', '.........pp.', '.........pp.', '.........pp.', '.........pp.', '.........PP.', '.........BBB', '.........BBB'],
};
const DRESS_LEGS = {
  idle: ['...cccccccc.', '...cccccccc.', '..Cccccccccl', '..Cccccccccl', '..Cccccccccl', '..CCCCCCCCCC', '....ss..ss..', '....ss..ss..', '....BB..BBB.', '....BBB.BBBB'],
  walkA: ['...cccccccc.', '...cccccccc.', '..Cccccccccl', '..Cccccccccl', '..Cccccccccl', '..CCCCCCCCCC', '...ss....ss.', '..ss.....ss.', '..BB.....BBB', '.BBB.....BBB'],
  walkB: ['...cccccccc.', '...cccccccc.', '..Cccccccccl', '..Cccccccccl', '..Cccccccccl', '..CCCCCCCCCC', '.....sss....', '.....ss.....', '.....BBB....', '.....BBBB...'],
  sit: ['....cccccccc', '....cccccccc', '...Ccccccccc', '...CCCCCCCCC', '.........ss.', '.........ss.', '.........ss.', '.........ss.', '.........BBB', '.........BBB'],
};

function makePerson(o) {
  const coat = o.coat || '#3a5a8a';
  const pal = {
    h: o.hair || '#4a3020', H: o.hatCol || '#c33', G: o.hatDark || shade(o.hatCol || '#c33', 0.7),
    s: o.skin || '#e8b896', S: shade(o.skin || '#e8b896', 0.82), e: '#1b1820',
    c: coat, C: o.coatDark || shade(coat, 0.72), l: shade(coat, 1.12), A: shade(o.coatDark || shade(coat, 0.72), 1.05),
    b: o.beardCol || o.hair || '#ccc', a: o.apron || '#ddd', p: o.pants || '#2e3440', P: shade(o.pants || '#2e3440', 0.75), B: o.boots || '#1e1e24',
    g: '#d8e4ee', y: '#e2b84a', w: o.trim || '#e8e0d0',
  };
  const build = (legKey) => {
    const g = [];
    for (let i = 0; i < PH; i++) g.push('.'.repeat(PW).split(''));
    const set = (x, y, ch) => { if (x >= 0 && x < PW && y >= 0 && y < PH) g[y][x] = ch === '_' ? '.' : ch; };
    const put = (y, s) => { for (let i = 0; i < s.length; i++) if (s[i] !== '.') set(i, y, s[i]); };
    // head
    put(0, '....hhhh....'); put(1, '...hhhhhhh..'); put(2, '..hhhhhssss.'); put(3, '..hhhhssess.');
    put(4, '..hhhsssssss'); put(5, '...hhsssss..'); put(6, '....hsSss...'); put(7, '.....sss....');
    // torso
    put(8, '....cccccc..'); put(9, '...Ccccccccl'); put(10, '...CccAAcccl'); put(11, '...CccAAcccl'); put(12, '...CccAAcccl');
    put(13, '...CccAAcccl'); put(14, '...CcccAAccl'); put(15, '...CcccAAccl'); put(16, '...Cccccsscl'); put(17, '...CCCCCCCC.');
    if (o.trimRow) for (let y = 9; y <= 16; y += 2) set(10, y, 'w');
    // hair styles
    if (o.hairStyle === 'bald') { put(0, '____ssss____'); put(1, '...sssssss..'); put(2, '..hsssssss s'.replace(' ', 's')); set(2, 3, 'h'); set(3, 3, 's'); }
    if (o.hairStyle === 'long') { for (let y = 2; y <= 12; y++) set(2, y, 'h'); for (let y = 4; y <= 10; y++) set(3, y, 'h'); }
    if (o.hairStyle === 'bun') { put(0, '..hhhhhh....'); set(1, 1, 'h'); set(2, 1, 'h'); set(1, 0, 'h'); }
    if (o.hairStyle === 'curly') { put(0, '...h.hh.h...'); put(1, '..hhhhhhhh..'); set(1, 2, 'h'); set(1, 3, 'h'); set(1, 4, 'h'); set(2, 5, 'h'); set(2, 6, 'h'); }
    if (o.hairStyle === 'pony') { set(1, 2, 'h'); set(0, 3, 'h'); set(0, 4, 'h'); set(1, 3, 'h'); set(0, 5, 'h'); }
    // hats
    if (o.hat === 'souwester') { put(0, '....HHHH....'); put(1, '...HHHHHHH..'); put(2, '.GGGGGGGGGGG'); set(2, 3, 'H'); set(2, 4, 'H'); set(2, 5, 'H'); set(3, 3, 'H'); }
    if (o.hat === 'knit') { put(0, '....HHHH....'); put(1, '...HHHHHHH..'); put(2, '..GGGGGGGG..'); }
    if (o.hat === 'cap') { put(0, '............'); put(1, '...HHHHHH...'); put(2, '..HHHHHHHGGG'); }
    if (o.hat === 'captain') { put(0, '...HHHHHH...'); put(1, '...HyHHHHH..'); put(2, '..GGGGGGGGGG'); }
    if (o.hat === 'scarf') { put(0, '....HHHH....'); put(1, '...HHHHHHH..'); put(2, '..HHHHHssss.'); set(2, 3, 'H'); set(1, 3, 'G'); set(1, 4, 'G'); set(0, 5, 'G'); set(1, 6, 'G'); }
    // beard
    if (o.beard === 'full') { put(5, '...hhbbbbb..'); put(6, '....bbbbbb..'); put(7, '.....bbbb...'); put(8, '.....bbb....'); }
    if (o.beard === 'short') { put(5, '...hhsbbbb..'); put(6, '....bbbbb...'); }
    if (o.beard === 'mustache') { put(5, '........bb..'); }
    if (o.glasses) { set(9, 3, 'g'); set(7, 3, 'g'); }
    if (o.apron) { for (let y = 9; y <= 17; y++) for (let x = 8; x <= 10; x++) if (g[y][x] !== '.' && g[y][x] !== 's') set(x, y, 'a'); set(8, 8, 'a'); }
    const legs = (o.dress ? DRESS_LEGS : PEOPLE_LEGS)[legKey];
    for (let i = 0; i < 10; i++) put(18 + i, legs[i]);
    let rows = g.map(r => r.join(''));
    if (o.kid) rows = rows.filter((r, i) => ![9, 11, 13, 20, 22, 24].includes(i));
    return sprite(rows, pal);
  };
  const p = { idle: build('idle'), walk: [build('walkA'), build('walkB')], sit: build('sit') };
  p.h = p.idle.height; p.w = PW;
  // upper body for sitting in boats (head + torso)
  const [top, tx] = makeCanvas(PW, 17);
  tx.drawImage(p.idle, 0, 0, PW, 17, 0, 0, PW, 17);
  p.top = top;
  return p;
}

const PEOPLE = {};
function initPeople() {
  PEOPLE.player = makePerson({ hat: 'souwester', hatCol: '#f2c230', hatDark: '#c9971c', hair: '#6b3a1e', coat: '#f2c230', coatDark: '#c58f18', pants: '#2b3346', boots: '#2a1e18', skin: '#f0c4a0' });
  PEOPLE.ansel = makePerson({ hat: 'knit', hatCol: '#3466a8', hair: '#c8c8c8', beard: 'full', beardCol: '#e2e2e2', coat: '#3f4f3a', pants: '#3a3a42', boots: '#2b211a', skin: '#e0a882' });
  PEOPLE.anselRagged = makePerson({ hair: '#d6d6d6', beard: 'full', beardCol: '#eeeeee', coat: '#566048', coatDark: '#3e4634', pants: '#4a4a50', boots: '#2b211a', skin: '#d79c74' });
  PEOPLE.greta = makePerson({ hat: 'captain', hatCol: '#1f2f52', hair: '#9aa0a8', hairStyle: 'bun', coat: '#22355e', coatDark: '#16233f', trimRow: true, trim: '#e0b84a', pants: '#1e2433', skin: '#eab89a' });
  PEOPLE.bo = makePerson({ hairStyle: 'bald', hair: '#3a2416', beard: 'full', beardCol: '#7a3e1e', coat: '#8a6a4a', apron: '#5a3a24', pants: '#3a3226', boots: '#2b2016', skin: '#c98a62' });
  PEOPLE.tam = makePerson({ hat: 'cap', hatCol: '#5a6a52', hair: '#2a2a2a', beard: 'mustache', beardCol: '#2a2a2a', coat: '#d8dee8', coatDark: '#9aa4b4', apron: '#e2a83a', pants: '#2b3a4a', boots: '#e8c040', skin: '#e8b896' });
  PEOPLE.rosa = makePerson({ hairStyle: 'curly', hair: '#2a1a14', coat: '#b8423a', apron: '#f2ece0', dress: true, boots: '#3a2a20', skin: '#b87a52' });
  PEOPLE.hollis = makePerson({ hair: '#7a6a5a', glasses: true, coat: '#6a4a6a', coatDark: '#4a3048', pants: '#2c2a30', skin: '#efc6a6' });
  PEOPLE.finn = makePerson({ hat: 'captain', hatCol: '#2a2a3a', beard: 'full', beardCol: '#f4f4f4', hair: '#f4f4f4', coat: '#2b3b5a', pants: '#26262e', skin: '#e6b090' });
  PEOPLE.nell = makePerson({ kid: true, hairStyle: 'pony', hair: '#d07a2a', coat: '#4aa06a', dress: true, boots: '#7a2a2a', skin: '#f2c8a8' });
  PEOPLE.mira = makePerson({ hat: 'scarf', hatCol: '#d8642a', hair: '#1a1210', coat: '#2a8a8a', dress: true, boots: '#6a4a2a', skin: '#a8683e' });
  PEOPLE.bram = makePerson({ hair: '#e8e8e8', hairStyle: 'long', beard: 'short', beardCol: '#e8e8e8', coat: '#5a4a3a', coatDark: '#3e3226', pants: '#2e2a26', skin: '#e6b496' });
}

function drawPerson(c, p, x, gy, o) {
  o = o || {};
  const fr = Math.floor(o.anim * 9) % 4;
  const frame = o.sit ? p.sit : o.walking ? p.walk[fr % 2] : p.idle;
  const img = o.left ? flipH(frame) : frame;
  const bob = o.walking && fr % 2 === 1 ? -1 : 0;
  if (!o.noShadow) { c.globalAlpha = 0.25; rect(c, x - 7, gy - 1, 14, 2, '#000'); c.globalAlpha = 1; }
  c.drawImage(img, Math.round(x - PW / 2), Math.round(gy - p.h + bob));
}

// ---------------- boats ----------------
const _boatCache = {};
function boatKey(cfg) { return [cfg.type, cfg.iron ? 1 : 0, cfg.lantern ? 1 : 0, cfg.iceBow ? 1 : 0, cfg.color || '', cfg.sail || ''].join('|'); }

// returns {c, wl (waterline y in canvas), bowX, len, mastTop, lanternPos, seat}
function makeBoat(cfg) {
  const key = boatKey(cfg);
  if (_boatCache[key]) return _boatCache[key];
  const type = cfg.type;
  let spec = {
    row: { len: 46, hh: 10, mast: 0, colA: '#8a5a34', colB: '#7a4e2c', trim: '#4e321c', stripe: null },
    sail: { len: 62, hh: 12, mast: 52, colA: '#d8d2c2', colB: '#cbc4b2', trim: '#6a4a2c', stripe: '#2c5a8a' },
    big: { len: 80, hh: 14, mast: 72, colA: '#2f5a4a', colB: '#284f41', trim: '#e0d6b8', stripe: '#b5523b' },
    margaret: { len: 70, hh: 13, mast: 0, colA: '#3e6a96', colB: '#365e86', trim: '#e8e2d0', stripe: '#c84a3a' },
    wren: { len: 44, hh: 9, mast: 44, colA: '#4a6a8a', colB: '#3a5a7a', trim: '#e8e0d0', stripe: null },
  }[type];
  if (cfg.color) spec = Object.assign({}, spec, { colA: cfg.color, colB: shade(cfg.color, 0.9) });
  const padTop = spec.mast + 10, padX = 8;
  const cw = spec.len + padX * 2, ch = padTop + spec.hh + 4;
  const [c, x] = makeCanvas(cw, ch);
  const ox = padX, oy = padTop; // gunwale baseline
  const L = spec.len, HH = spec.hh;
  // hull, column by column
  for (let i = 0; i < L; i++) {
    const u = (i - L * 0.5) / (L * 0.5); // -1 stern(left) .. 1 bow(right)
    const sheer = Math.round(u > 0 ? -u * u * 3 : -u * u * 1.5);
    const bottomInset = Math.round(u > 0 ? Math.pow(u, 2.2) * (HH - 1) : Math.pow(-u, 4) * (HH * 0.55));
    const top = oy + sheer, bot = oy + HH - bottomInset;
    for (let y = top; y < bot; y++) {
      const r = y - top;
      let col = (Math.floor(r / 2) % 2) ? spec.colB : spec.colA;
      if (r === 0) col = spec.trim;
      else if (r % 2 === 0) col = shade(col, 0.82);
      if (spec.stripe && r === 2) col = spec.stripe;
      if (cfg.iron && (i % 8 === 3) && r > 0) col = '#5c636c';
      if (cfg.iron && (i % 8 === 3) && r > 0 && r % 3 === 1) col = '#9aa2ac';
      if (y === bot - 1) col = shade(col, 0.6);
      x.fillStyle = col; x.fillRect(ox + i, y, 1, 1);
    }
  }
  // bow & stern posts
  rect(x, ox + L - 1, oy - 4, 1, 3, spec.trim);
  rect(x, ox, oy - 2, 1, 2, spec.trim);
  const info = { c, wl: oy + HH - 3, len: L, ox, oy, mastX: 0, mastTop: 0, lantern: null, seatX: ox + Math.round(L * 0.42), seatY: oy };
  if (type === 'sail') {
    const mx = ox + Math.round(L * 0.48), mt = oy - spec.mast;
    rect(x, mx, mt, 1, spec.mast + 1, '#5a3c22');
    // boom
    rect(x, ox + 4, oy - 4, mx - ox - 3, 1, '#6a4a2c');
    // triangular sail
    for (let y = mt + 1; y < oy - 4; y++) {
      const t = (y - mt) / (oy - 4 - mt);
      const x0 = Math.round(mx - 1 - t * (mx - ox - 6));
      for (let xx = x0; xx < mx; xx++) {
        const edge = xx === x0;
        const col = edge ? '#bfb6a0' : (xx - x0 < 3 ? '#dcd4be' : '#efe9d8');
        px(x, xx, y, col);
      }
      if (y % 7 === 0) rect(x, x0 + 1, y, mx - x0 - 1, 1, '#d6ceb8');
    }
    // jib
    for (let y = mt + 6; y < oy - 2; y++) {
      const t = (y - mt - 6) / (oy - 2 - mt - 6);
      const w = Math.round(t * (L * 0.36));
      rect(x, mx + 1, y, w, 1, y % 6 === 0 ? '#d8d0bc' : '#e9e2cf');
    }
    px(x, mx + 1, mt, '#c8402a'); px(x, mx + 2, mt, '#c8402a'); px(x, mx + 1, mt + 1, '#c8402a');
    info.mastX = mx; info.mastTop = mt;
    info.seatX = ox + 8;
  }
  if (type === 'big') {
    const mx = ox + Math.round(L * 0.46), mt = oy - spec.mast;
    rect(x, mx, mt, 2, spec.mast + 1, '#4a3018');
    rect(x, ox + 3, oy - 5, mx - ox - 2, 1, '#5a3c22');
    // gaff sail: quad from (mx, mt+2)-(mx, oy-6) to (ox+6, mt+10)-(ox+4, oy-6)
    for (let y = mt + 2; y < oy - 5; y++) {
      const tTop = clamp((y - (mt + 2)) / 8, 0, 1);
      const x0 = Math.round(lerp(mx - 2, ox + 6, tTop));
      const xl = y < mt + 10 ? x0 : Math.round(lerp(ox + 6, ox + 4, (y - mt - 10) / (oy - mt - 16)));
      for (let xx = xl; xx < mx; xx++) {
        const band = y > mt + spec.mast * 0.3 && y < mt + spec.mast * 0.3 + 5;
        let col = band ? '#b5523b' : '#efe4c6';
        if (xx === xl) col = band ? '#8a3a28' : '#c9bc9a';
        else if ((y - mt) % 8 === 0) col = band ? '#a04830' : '#ddd0ae';
        px(x, xx, y, col);
      }
    }
    line(x, mx, mt + 2, ox + 6, mt + 10, '#5a3c22');
    // jib to bow
    for (let y = mt + 4; y < oy - 2; y++) {
      const t = (y - mt - 4) / (oy - 2 - mt - 4);
      const w = Math.round(t * (L * 0.5 - 2));
      rect(x, mx + 2, y, w, 1, y % 7 === 0 ? '#d8ccaa' : '#ebe0c2');
    }
    line(x, mx + 1, mt, ox + L - 1, oy - 4, '#6a5038');
    rect(x, mx, mt - 4, 1, 4, '#4a3018');
    rect(x, mx + 1, mt - 4, 4, 2, '#d03a2a');
    info.mastX = mx; info.mastTop = mt;
    info.seatX = ox + 10;
  }
  if (type === 'wren') {
    // Maggie's little boat: one mast and a lug sail (red, plain sailcloth, or none at all)
    const mx = ox + Math.round(L * 0.52), mt = oy - spec.mast;
    rect(x, mx, mt, 1, spec.mast + 1, '#5a3c22');
    if (cfg.sail && cfg.sail !== 'none') {
      const red = cfg.sail === 'red';
      for (let y = mt + 2; y < oy - 3; y++) {
        const t = (y - mt - 2) / (oy - 5 - mt);
        const x0 = Math.round(mx - 1 - t * (mx - ox - 5));
        for (let xx = x0; xx < mx; xx++) {
          let col = red ? (y % 5 === 0 ? '#a84a3a' : '#c8604a') : (y % 7 === 0 ? '#d6ceb8' : '#efe9d8');
          if (xx === x0) col = red ? '#8a3a2a' : '#bfb6a0';
          px(x, xx, y, col);
        }
      }
      rect(x, ox + 4, oy - 3, mx - ox - 3, 1, '#6a4a2c');
    }
    info.mastX = mx; info.mastTop = mt;
    info.seatX = ox + 6;
  }
  if (type === 'margaret') {
    // broken mast stub
    rect(x, ox + Math.round(L * 0.45), oy - 9, 2, 9, '#5a3c22');
    px(x, ox + Math.round(L * 0.45) + 1, oy - 10, '#5a3c22');
  }
  if (cfg.iceBow) {
    // steel-shod ice-breaking stem
    for (let i = L - 12; i < L; i++) {
      const u = (i - L * 0.5) / (L * 0.5);
      const top = oy + Math.round(-u * u * 3) + 2;
      const bot = oy + HH - Math.round(Math.pow(u, 2.2) * (HH - 1));
      for (let y = top; y < bot; y++) { x.fillStyle = (y + i) % 5 === 0 ? '#c8d0d8' : '#8a949e'; x.fillRect(ox + i, y, 1, 1); }
    }
  }
  if (cfg.lantern) {
    const lx = ox + L - 4, ly = oy - 10;
    rect(x, lx + 1, ly + 3, 1, 6, '#3a2a1a');
    rect(x, lx, ly, 3, 3, '#ffd27a'); rect(x, lx, ly - 1, 3, 1, '#2a2018'); px(x, lx + 1, ly - 2, '#2a2018');
    info.lantern = { x: lx + 1, y: ly + 1 };
  }
  _boatCache[key] = info;
  return info;
}

// Draw a boat with bobbing. cx = horizontal centre, wy = water line y.
function drawBoat(c, cfg, cx, wy, t, o) {
  o = o || {};
  const b = makeBoat(cfg);
  const bob = waveY(cx + (o.phase || 0), t, o.rough || 1) * 0.6;
  const tilt = (waveY(cx + 10, t, o.rough || 1) - waveY(cx - 10, t, o.rough || 1)) * 0.02 + (o.tilt || 0);
  const flip = !!o.left;
  const bx = Math.round(cx - b.c.width / 2), by = Math.round(wy - b.wl + bob);
  c.save();
  c.translate(Math.round(cx), Math.round(wy + bob));
  c.rotate(flip ? -tilt : tilt);
  if (flip) c.scale(-1, 1);
  const lx = -b.c.width / 2, ly = -b.wl;
  c.drawImage(b.c, Math.round(lx), Math.round(ly));
  // passengers sit in front of the sail, cut off at the gunwale
  if (o.riders) {
    o.riders.forEach((p, i) => {
      const sx = lx + b.seatX + i * 16 - 6;
      c.drawImage(p, 0, 0, p.width, 14, Math.round(sx), Math.round(ly + b.seatY - 14), p.width, 14);
    });
  }
  // oars for rowboat
  if (cfg.type === 'row') {
    const ph = o.rowing ? Math.sin(t * 6) : 0.3;
    const ax = lx + b.seatX + 2, ay = ly + b.oy - 1;
    line(c, ax, ay, ax - 9 - ph * 7, ay + 15, '#6a4628');
    rect(c, ax - 12 - ph * 7, ay + 14, 5, 2, '#7a5430');
  }
  c.restore();
  return { x: bx, y: by, b, bob, lantern: b.lantern ? { x: Math.round(cx - b.c.width / 2 + b.lantern.x), y: by + b.lantern.y } : null };
}

// ---------------- fish ----------------
const FISH = {
  sardine: { name: 'Sardine', body: '#9ab0c4', back: '#4a6a8a', belly: '#e8eef4', len: 10, th: 3, price: 2, diff: 0.18 },
  herring: { name: 'Herring', body: '#a8bccc', back: '#3c5a7a', belly: '#eef2f6', len: 12, th: 4, price: 3, diff: 0.28 },
  mackerel: { name: 'Mackerel', body: '#7ab0a0', back: '#1e4a52', belly: '#e4eee8', len: 13, th: 4, price: 5, diff: 0.42, stripes: '#123438' },
  cod: { name: 'Cod', body: '#a8986a', back: '#6a5a3a', belly: '#e8e0c8', len: 15, th: 5, price: 8, diff: 0.5, spots: '#5a4a2e' },
  snapper: { name: 'Red Snapper', body: '#e0624a', back: '#b03a2a', belly: '#f8c8b8', len: 14, th: 5, price: 12, diff: 0.6 },
  parrotfish: { name: 'Parrotfish', body: '#3ac0a0', back: '#2a7aa8', belly: '#f0d060', len: 13, th: 5, price: 10, diff: 0.5 },
  moonfish: { name: 'Moonfish', body: '#a8f0f0', back: '#4aa8c8', belly: '#f0ffff', len: 13, th: 6, price: 25, diff: 0.75, glow: true },
  boot: { name: 'Old Boot', junk: true, price: 1, diff: 0.1 },
};
const _fishCache = {};
function fishSprite(id) {
  if (_fishCache[id]) return _fishCache[id];
  const f = FISH[id];
  let c;
  if (f.junk) {
    c = sprite([
      '..####....',
      '..#bb#....',
      '..#bb#....',
      '..#bbb###.',
      '.#bbbbbbb#',
      '.#########',
    ], { '#': '#3a2a1e', b: '#6a4a30' });
  } else {
    const L = f.len, T = f.th;
    const [cc, x] = makeCanvas(L + 4, T * 2 + 3);
    const cy = T + 1;
    for (let i = 0; i < L; i++) {
      const u = i / (L - 1);
      const th = Math.max(1, Math.round(T * Math.sin(Math.PI * clamp(0.12 + u * 0.95, 0, 1)) * (u > 0.85 ? 0.9 : 1)));
      for (let j = -th; j <= th; j++) {
        let col = j < -th / 3 ? f.back : j > th / 3 ? f.belly : f.body;
        if (f.stripes && j < 0 && (i % 3 === 0)) col = f.stripes;
        if (f.spots && hash2(i, j) > 0.8 && j < th / 2) col = f.spots;
        px(x, i + 3, cy + j, col);
      }
    }
    // tail
    px(x, 2, cy, f.back); px(x, 1, cy - 1, f.back); px(x, 1, cy + 1, f.back); px(x, 0, cy - 2, f.back); px(x, 0, cy + 2, f.back);
    // eye & fin
    px(x, L, cy - 1, '#101014');
    px(x, Math.round(L * 0.55) + 3, cy - T - 0, f.back);
    c = cc;
  }
  _fishCache[id] = c;
  return c;
}

// ---------------- icons (8x8) ----------------
const ICONS = {};
function initIcons() {
  const P = {
    k: '#1a1410', y: '#f2c94c', Y: '#c8962a', w: '#ffffff', b: '#c8884a', B: '#8a5a2a', g: '#7a7a82', G: '#4a4a52',
    r: '#c84a3a', o: '#e89a3a', t: '#6a4a2a', T: '#4a3018', s: '#e8e4dc', S: '#b8b0a4', c: '#7ad0e0', p: '#f4eef4', P: '#c8c0d8',
    l: '#8ad06a', L: '#4a8a3a', n: '#2a5a9a', h: '#e8a830', a: '#3466a8',
  };
  const defs = {
    coin: ['..kkkk..', '.kyyyyk.', 'kyywyyYk', 'kyywyyYk', 'kyyyyyYk', 'kyyyyYYk', '.kYYYYk.', '..kkkk..'],
    food: ['........', '..kkkk..', '.kbbbbk.', 'kbwbbwbk', 'kbbbbbbk', 'kBBBBBBk', '.kkkkkk.', '........'],
    bread: ['........', '..kkkk..', '.kbbbbk.', 'kbwbbwbk', 'kbbbbbbk', 'kBBBBBBk', '.kkkkkk.', '........'],
    cooked: ['........', '...kkk..', '.kkbbbk.', 'kbbbbBbk', 'kBbbbbBk', '.kkBBBk.', '...kkk..', '........'],
    coconut: ['..kkkk..', '.kTtttk.', 'kTtkktTk', 'kttttttk', 'kTttttTk', 'kTTttTTk', '.kTTTTk.', '..kkkk..'],
    pearl: ['........', '..kkkk..', '.kpppPk.', 'kpwppPPk', 'kppppPPk', '.kPPPPk.', '..kkkk..', '........'],
    honey: ['..kkkk..', '..krrk..', '.kkkkkk.', 'kohhhhok', 'kohwhhok', 'kohhhhok', 'kooooook', '.kkkkkk.'],
    shell: ['........', '...kk...', '..kssk..', '.kssSsk.', 'ksSsSsSk', 'ksSsSsSk', '.kkkkkk.', '........'],
    ironwood: ['........', '.kkkkkk.', 'kTttttTk', 'kTtkktTk', 'kTttttTk', '.kkkkkk.', '........', '........'],
    rod: ['.......k', '......k.', '.....k..', '....k...', '...k....', '..b.....', '.bB.....', 'bB......'],
    knife: ['......kk', '.....kSk', '....kSk.', '...kSk..', '..kSk...', '.kTk....', 'kTk.....', '.k......'],
    hatchet: ['..kkk...', '.kSSSk..', 'kSSSSTk.', '.kkkTk..', '...kTk..', '...kTk..', '...kTk..', '....k...'],
    oil: ['..kkk...', '..kgk...', '.kkkkkk.', 'kggggrgk', 'kgrrrrgk', 'kggggggk', 'kGGGGGGk', '.kkkkkk.'],
    wick: ['........', '.....kk.', '....kbk.', '...kbk..', '..kbk...', '.kbk....', 'kbk.....', '.k......'],
    cap: ['...kk...', '..kaak..', '.kaaaak.', 'kaaaaaak', 'knnnnnnk', '.kkkkkk.', '........', '........'],
    lure: ['....kk..', '...krrk.', '..krwrk.', '.krrrk..', 'kyyyk...', 'kyyk....', '.kk.....', '........'],
    watch: ['...kk...', '..kyyk..', '.kkkkkk.', 'kyswssyk', 'kysswsyk', 'kysssyk.', '.kkkkkk.', '........'],
    bottle: ['...kk...', '...kk...', '..klLk..', '.klllLk.', '.kwllLk.', '.klllLk.', '.kLLLLk.', '..kkkk..'],
    lantern: ['...kk...', '..kkkk..', '.kyyyyk.', '.kywyyk.', '.kyyyyk.', '.kkkkkk.', '..kkkk..', '........'],
    junk: ['........', '..kkkk..', '.kgggGk.', 'kgSggGGk', 'kgggGGGk', '.kGGGGk.', '..kkkk..', '........'],
    heart: ['........', '.kk.kk..', 'krrkrrk.', 'krwrrrk.', '.krrrk..', '..krk...', '...k....', '........'],
    letter: ['........', 'kkkkkkkk', 'kswssssk', 'kskssksk', 'ksskkssk', 'kssssssk', 'kkkkkkkk', '........'],
  };
  for (const k in defs) ICONS[k] = sprite(defs[k], P);
}
function itemIcon(id) {
  if (ICONS[id]) return ICONS[id];
  if (FISH[id] && !FISH[id].junk) {
    const f = FISH[id];
    ICONS[id] = sprite(['........', '.....kk.', 'k..kbbbk', 'kkkbbbek', 'kkbllllk', 'k..kllk.', '....k...', '........'],
      { k: shade(f.back, 0.8), b: f.back, l: f.belly, e: '#101014' });
    return ICONS[id];
  }
  if (id === 'boot') return ICONS.junk;
  return ICONS.junk;
}
function drawItemIcon(c, id, x, y) {
  const ic = itemIcon(id);
  if (ic) { c.drawImage(ic, Math.round(x), Math.round(y)); return; }
  const f = fishSprite(id);
  const s = Math.min(1, 10 / f.width);
  c.drawImage(f, Math.round(x - 1), Math.round(y + 4 - f.height / 2));
}

// ---------------- terrain ----------------
// paints ground below groundFn(x) into ctx, using material(wx, depth, y) -> [r,g,b]|null
function paintTerrain(c, x0, x1, groundFn, mat, bottom) {
  bottom = bottom || H;
  const w = x1 - x0;
  const img = c.getImageData(x0, 0, w, bottom), d = img.data;
  for (let i = 0; i < w; i++) {
    const wx = x0 + i;
    const gy = Math.round(groundFn(wx));
    if (gy >= bottom) continue;
    for (let y = Math.max(0, gy); y < bottom; y++) {
      const col = mat(wx, y - gy, y);
      if (!col) continue;
      const k = (y * w + i) * 4;
      d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
    }
  }
  c.putImageData(img, x0, 0);
}
const MAT = {
  cobble(x, d, y) {
    if (d === 0) return hexRgb('#8a857a');
    if (d === 1) return hexRgb('#6c675e');
    const row = Math.floor((d - 2) / 4), off = (row % 2) * 4;
    const cx = (x + off) % 8, cy = (d - 2) % 4;
    if (cx === 0 || cy === 3) return hexRgb('#3e3a36');
    const n = hash2(Math.floor((x + off) / 8), row);
    const base = mixRgb('#7a7468', '#5a554e', n);
    if (cy === 0) return mixRgb(base, '#ffffff', 0.12);
    return mixRgb(base, '#000000', Math.min(0.5, d / 60));
  },
  sand(x, d, y) {
    const n = hash2(x, y);
    let c = d < 2 ? '#ecd8a4' : '#d9bf85';
    if (d > 10) c = '#c8aa72';
    let col = hexRgb(c);
    if (n > 0.93) col = mixRgb(col, '#ffffff', 0.4);
    else if (n < 0.06) col = mixRgb(col, '#8a6a40', 0.4);
    return mixRgb(col, '#5a4020', Math.min(0.45, d / 70));
  },
  wetsand(x, d, y) {
    const n = hash2(x, y);
    let col = hexRgb(d < 1 ? '#b8a072' : '#9a845a');
    if (n > 0.9) col = mixRgb(col, '#e0d0a8', 0.5);
    return mixRgb(col, '#3a2a18', Math.min(0.5, d / 50));
  },
  rock(x, d, y) {
    const n = hash2(Math.floor(x / 3), Math.floor(y / 2));
    const n2 = hash2(x, y);
    let col = mixRgb('#6e6a66', '#4a4744', n);
    if (n2 > 0.9) col = mixRgb(col, '#8e8a84', 0.6);
    if (hash2(Math.floor(x / 9), Math.floor(y / 5)) > 0.82 && n2 > 0.5) col = hexRgb('#34312e');
    if (d < 2) col = mixRgb(col, '#9a968e', 0.5);
    return mixRgb(col, '#141414', Math.min(0.55, d / 90));
  },
  mossrock(x, d, y) {
    if (d < 2 && hash2(x, 3) > 0.25) return hexRgb(d === 0 ? '#6a8a4a' : '#4a6a36');
    return MAT.rock(x, d, y);
  },
  gullrock(x, d, y) {
    const c = MAT.rock(x, d, y);
    if (hash2(x, y) > 0.985 && d < 30) return hexRgb('#d8d6ce');
    if (d < 2 && hash2(x, 5) > 0.6) return hexRgb('#d8d6ce');
    return c;
  },
  grass(x, d, y) {
    if (d === 0) return hash2(x, 1) > 0.3 ? hexRgb('#7aa84a') : null;
    if (d < 3) return hexRgb(hash2(x, y) > 0.5 ? '#5f8f3a' : '#4f7d30');
    if (d < 5) return hexRgb(hash2(x, y) > 0.6 ? '#4f7d30' : '#6b4f34');
    const n = hash2(x, y);
    let col = hexRgb(n > 0.92 ? '#8a6a4a' : '#5e4630');
    return mixRgb(col, '#1e140c', Math.min(0.55, d / 70));
  },
  jungle(x, d, y) {
    if (d === 0) return hash2(x, 1) > 0.2 ? hexRgb('#4f8a3a') : null;
    if (d < 3) return hexRgb(hash2(x, y) > 0.5 ? '#3f7a30' : '#2f6626');
    const n = hash2(x, y);
    return mixRgb(n > 0.9 ? '#7a5a3a' : '#5a3e28', '#1a1008', Math.min(0.6, d / 60));
  },
  planks(x, d, y) {
    if (d === 0) return hexRgb('#a87e52');
    const seam = x % 12 === 0;
    let col = hexRgb(seam ? '#4a3220' : (Math.floor(x / 12) % 2 ? '#8a6440' : '#7e5a38'));
    if (d === 1) col = mixRgb(col, '#d0a878', 0.3);
    return col;
  },
};

// ---------------- props ----------------
function plankWall(c, x, y, w, h, col, dark, seed) {
  for (let j = 0; j < h; j++) {
    const row = Math.floor(j / 3);
    const n = hash2(row, seed || 1);
    let cc = mixRgb(col, dark, n * 0.4);
    if (j % 3 === 2) cc = hexRgb(dark);
    c.fillStyle = rgbStr(cc);
    c.fillRect(x, y + j, w, 1);
    // knots/grain
    for (let i = 0; i < w; i += 1) {
      if (hash2(x + i, y + j) > 0.985) px(c, x + i, y + j, rgbStr(mixRgb(dark, '#000', 0.2)));
    }
  }
}

function shingleBand(c, x, y, w, h, col, dark) {
  for (let j = 0; j < h; j++) {
    const off = (Math.floor(j / 3) % 2) * 3;
    for (let i = 0; i < w; i++) {
      let cc = col;
      if (j % 3 === 2) cc = dark;
      else if ((i + off) % 6 === 0) cc = dark;
      else if (hash2(x + i, y + j) > 0.9) cc = shade(col, 1.12);
      px(c, x + i, y + j, cc);
    }
  }
}

function drawWindow(c, x, y, w, h, frame) {
  rect(c, x - 1, y - 1, w + 2, h + 2, frame || '#3a2a1e');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const g = (i + j * 0.6) / (w + h);
    px(c, x + i, y + j, rgbStr(mixRgb('#9ec4d8', '#3e5a70', clamp(j / h + (hash2(i, j) > 0.85 ? -0.3 : 0), 0, 1))));
  }
  rect(c, x + Math.floor(w / 2), y, 1, h, frame || '#3a2a1e');
  rect(c, x, y + Math.floor(h / 2), w, 1, frame || '#3a2a1e');
  px(c, x + 1, y + 1, '#e8f4fa');
  rect(c, x - 2, y + h + 1, w + 4, 1, '#d8ccb8');
}

// Facade house. gy = ground y. Returns list of window rects (for night glow) and door x.
function drawHouse(c, x, gy, o) {
  const w = o.w, h = o.h;
  const top = gy - h;
  // foundation
  rect(c, x - 1, gy - 4, w + 2, 4, '#5a5650');
  for (let i = 0; i < w + 2; i += 5) px(c, x - 1 + i, gy - 3, '#3e3a36');
  plankWall(c, x, top, w, h - 4, o.wall, o.wallDark, o.seed || x);
  // corner posts
  rect(c, x, top, 2, h - 4, o.trim || '#e8e0d0');
  rect(c, x + w - 2, top, 2, h - 4, o.trim || '#e8e0d0');
  const wins = [];
  for (const wi of (o.windows || [])) { drawWindow(c, x + wi[0], top + wi[1], wi[2], wi[3], o.frame); wins.push({ x: x + wi[0], y: top + wi[1], w: wi[2], h: wi[3] }); }
  // door
  let doorX = null;
  if (o.door !== undefined) {
    const dx = x + o.door, dw = 13, dh = 30;
    rect(c, dx - 1, gy - 4 - dh - 1, dw + 2, dh + 1, o.trim || '#e8e0d0');
    for (let j = 0; j < dh; j++) rect(c, dx, gy - 4 - dh + j, dw, 1, j % 4 === 3 ? shade(o.doorCol || '#5a3a24', 0.75) : (o.doorCol || '#5a3a24'));
    rect(c, dx + 4, gy - 4 - dh, 1, dh, shade(o.doorCol || '#5a3a24', 0.7));
    px(c, dx + dw - 2, gy - 4 - dh / 2, '#e2c060');
    rect(c, dx - 1, gy - 4, dw + 2, 1, '#4a4440');
    rect(c, dx - 2, gy - 3, dw + 4, 3, '#6a645c');
    doorX = dx + dw / 2;
  }
  // roof
  if (o.roof === 'gable') {
    const rh = o.roofH || Math.round(w * 0.45);
    for (let j = 0; j < rh; j++) {
      const half = Math.round((j + 1) / rh * (w / 2 + 4));
      const cx = x + w / 2;
      for (let i = -half; i <= half; i++) {
        const edge = Math.abs(i) >= half - 1;
        let col = edge ? o.roofDark : (o.roofCol || shade(o.roofDark, 1.3));
        if (!edge && j % 3 === 2) col = o.roofDark;
        else if (!edge && (i + (Math.floor(j / 3) % 2) * 3) % 6 === 0) col = o.roofDark;
        px(c, cx + i, top - rh + j, col);
      }
    }
    // gable window
    if (o.atticWin) drawWindow(c, x + w / 2 - 3, top - rh * 0.55, 6, 6, o.frame);
    if (o.atticWin) wins.push({ x: x + w / 2 - 3, y: top - rh * 0.55, w: 6, h: 6 });
  } else {
    const rh = o.roofH || 14;
    shingleBand(c, x - 4, top - rh, w + 8, rh, o.roof, o.roofDark);
    rect(c, x - 5, top - 1, w + 10, 2, o.roofDark);
  }
  if (o.chimney) {
    const chx = x + o.chimney, rh = o.roof === 'gable' ? (o.roofH || Math.round(w * 0.45)) : (o.roofH || 14);
    const chTop = top - rh - 6;
    for (let j = 0; j < rh + 2; j++) for (let i = 0; i < 7; i++) px(c, chx + i, chTop + j, (j % 3 === 2 || (i + (Math.floor(j / 3) % 2) * 2) % 4 === 0) ? '#5a3a30' : '#8a5040');
    rect(c, chx - 1, chTop - 1, 9, 2, '#4a3a34');
  }
  if (o.sign) {
    const sx = x + o.sign.x, sy = top + o.sign.y, sw = o.sign.w || textWidth(o.sign.text) + 8;
    rect(c, sx, sy, sw, 11, '#3a2a1a');
    rect(c, sx + 1, sy + 1, sw - 2, 9, o.sign.bg || '#e8dcc0');
    drawText(c, o.sign.text, sx + sw / 2, sy + 1, o.sign.fg || '#3a2a1a', { align: 'center' });
  }
  if (o.awning) {
    const ay = top + o.awning.y, aw = o.awning.w, ax = x + o.awning.x;
    for (let i = 0; i < aw; i++) {
      const col = Math.floor(i / 5) % 2 ? o.awning.a : o.awning.b;
      rect(c, ax + i, ay, 1, 6, col);
      if (i % 5 === 2) px(c, ax + i, ay + 6, col);
    }
    rect(c, ax, ay, aw, 1, shade(o.awning.a, 0.7));
  }
  return { wins, doorX };
}

function drawPalm(c, x, gy, h, t, o) {
  o = o || {};
  const lean = o.lean || 0.25;
  const seed = o.seed !== undefined ? o.seed : 0;
  const sway = Math.sin(t * 0.9 + seed * 0.1) * 1.2;
  let tx = x, ty = gy;
  const segs = Math.floor(h / 3);
  for (let i = 0; i < segs; i++) {
    const u = i / segs;
    tx = x + Math.pow(u, 1.6) * h * lean + u * u * sway;
    ty = gy - i * 3;
    const wdt = Math.max(2, Math.round(4 - u * 2));
    rect(c, tx - wdt / 2, ty - 3, wdt, 3, i % 2 ? '#8a6a44' : '#a07e52');
    px(c, tx - wdt / 2, ty - 1, '#5e4630');
  }
  const cx = tx, cy = ty - 3;
  // fronds
  const fr = o.fronds || 7;
  for (let f = 0; f < fr; f++) {
    const a = -Math.PI / 2 + (f / (fr - 1) - 0.5) * 2.9 + Math.sin(t * 1.3 + f + seed) * 0.06;
    const len = 18 + (f % 2) * 5;
    for (let s = 0; s < len; s++) {
      const u = s / len;
      const fx = cx + Math.cos(a) * s;
      const fy = cy + Math.sin(a) * s + u * u * 12;
      px(c, fx, fy, '#2f6a2a');
      if (s > 2 && s % 2 === 0) {
        const lx = fx + Math.cos(a + 1.4) * 1, ly = fy + 2 + u * 2;
        line(c, fx, fy + 1, lx, ly, u > 0.6 ? '#4a8a36' : '#3a7a30');
        line(c, fx, fy + 1, fx - Math.cos(a + 1.4), ly, '#2a5a24');
      }
    }
  }
  if (o.coconuts) {
    for (let i = 0; i < o.coconuts; i++) ellipse(c, cx - 2 + i * 3, cy + 2 + (i % 2), 1, 1, '#5a3a1e');
  }
  return { x: cx, y: cy };
}

function drawTree(c, x, gy, h, t, o) {
  o = o || {};
  const trunk = o.trunk || '#4a3424';
  rect(c, x - 2, gy - h * 0.55, 4, h * 0.55, trunk);
  rect(c, x - 1, gy - h * 0.55, 1, h * 0.55, shade(trunk, 1.2));
  rect(c, x - 3, gy - 2, 6, 2, trunk);
  const r = RNG(Math.floor(o.seed !== undefined ? o.seed : 1) + 1);
  const leaf = o.leaf || ['#2a5a2a', '#3a7034', '#4f8a40'];
  for (let i = 0; i < 9; i++) {
    const bx = x + (r() - 0.5) * h * 0.6 + Math.sin(t + i) * 0.5, by = gy - h * 0.6 - r() * h * 0.35;
    const br = 5 + r() * h * 0.18;
    ellipse(c, bx, by, br, br * 0.8, leaf[0]);
    ellipse(c, bx - 1, by - 1, br * 0.75, br * 0.55, leaf[1]);
    ellipse(c, bx - 2, by - 2, br * 0.4, br * 0.3, leaf[2]);
  }
}

function drawGull(c, x, y, t, o) {
  o = o || {};
  if (o.standing) {
    rect(c, x - 2, y - 4, 5, 3, '#f4f4f4'); rect(c, x - 3, y - 3, 2, 2, '#8a8e96');
    rect(c, x + 2, y - 6, 2, 2, '#f4f4f4'); px(c, x + 4, y - 5, '#e8a830'); px(c, x + 3, y - 6, '#111');
    px(c, x - 1, y - 1, '#e8a830'); px(c, x + 1, y - 1, '#e8a830');
    return;
  }
  const f = Math.sin(t * 8 + (o.seed || 0)) > 0;
  const col = o.col || '#f0f0f0';
  if (f) { px(c, x - 2, y - 1, col); px(c, x - 1, y, col); px(c, x, y, col); px(c, x + 1, y, col); px(c, x + 2, y - 1, col); }
  else { px(c, x - 2, y + 1, col); px(c, x - 1, y, col); px(c, x, y, col); px(c, x + 1, y, col); px(c, x + 2, y + 1, col); }
}

function drawLampPost(c, x, gy) {
  rect(c, x, gy - 30, 2, 30, '#2a2a30');
  rect(c, x - 2, gy - 2, 6, 2, '#2a2a30');
  rect(c, x - 2, gy - 36, 6, 6, '#2a2a30');
  rect(c, x - 1, gy - 35, 4, 4, '#f6d890');
  rect(c, x - 3, gy - 37, 8, 1, '#2a2a30');
}

function drawBarrel(c, x, gy) {
  for (let j = 0; j < 10; j++) {
    const w = 8 + (j > 1 && j < 8 ? 1 : 0);
    rect(c, x - w / 2, gy - 10 + j, w, 1, j === 2 || j === 7 ? '#4a4a50' : (j % 2 ? '#7a5434' : '#8a603c'));
  }
}
function drawCrate(c, x, gy, s) {
  s = s || 9;
  rect(c, x, gy - s, s, s, '#9a7448');
  rect(c, x, gy - s, s, 1, '#5a4024'); rect(c, x, gy - 1, s, 1, '#5a4024');
  rect(c, x, gy - s, 1, s, '#5a4024'); rect(c, x + s - 1, gy - s, 1, s, '#5a4024');
  line(c, x + 1, gy - 2, x + s - 2, gy - s + 1, '#6a4a2a');
}
function drawLobsterPot(c, x, gy) {
  for (let j = 0; j < 7; j++) for (let i = 0; i < 10; i++) {
    if (j === 0 || j === 6 || i % 3 === 0) px(c, x + i, gy - 7 + j, '#7a5a34');
  }
  rect(c, x + 2, gy - 9, 6, 2, '#7a5a34');
}
function drawNet(c, x, y, w, h) {
  for (let j = 0; j <= h; j += 3) line(c, x, y + j, x + w, y + j + Math.sin(j) * 1, '#6a7a5a');
  for (let i = 0; i <= w; i += 3) line(c, x + i, y, x + i + 1, y + h, '#6a7a5a');
}

// ---------------- whale ----------------
const _whales = {};
// s = size (1 = the great whale, ~0.42 = her calf)
function whaleSprite(s) {
  s = s || 1;
  if (_whales[s]) return _whales[s];
  const L = Math.round(280 * s), HH = Math.round(84 * s) + 4;
  const [c, x] = makeCanvas(L, HH);
  const cy = Math.round(40 * s) + 2;
  const spots = [];
  for (let i = Math.round(18 * s); i < L - 2; i++) {
    const u = i / L;
    let th;
    if (u < 0.3) th = lerp(4, 28, Math.pow(Math.max(0, (u - 0.06) / 0.24), 1.2));
    else if (u < 0.85) th = lerp(28, 32, (u - 0.3) / 0.55);
    else th = 32 * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.85) / 0.155, 2)));
    th = Math.max(2, th * s * (s < 1 ? 1.12 : 1));
    const top = cy - th * 0.62, bot = cy + th * 0.5 + (u > 0.55 ? (u - 0.55) * 12 * s : 0);
    for (let y = Math.floor(top); y <= bot; y++) {
      const v = (y - top) / (bot - top);
      let col;
      if (s < 1 && v >= 0.05 && v < 0.58) col = hash2(i, y) > 0.9 ? '#7a9ab8' : '#5a7896';
      else if (v < 0.05) col = '#8ab8cc';
      else if (v < 0.12) col = '#4a6a86';
      else if (v < 0.58) col = hash2(i, y) > 0.96 ? '#5a7a98' : '#3a5470';
      else if (v < 0.66) col = '#58708a';
      else col = (u > 0.45 && (y % 3 === 0)) ? '#8aa2b2' : '#a8bccb';
      if (v < 0.5 && v > 0.05 && hash2(Math.floor(i / 3), Math.floor(y / 2)) > 0.93) col = '#7a94aa';
      px(x, i, y, col);
    }
    if (i % Math.max(4, Math.round(9 * s)) === 0 && u > 0.15 && u < 0.88) spots.push({ x: i, y: Math.round(top + th * 0.35 + (hash1(i) - 0.5) * 6 * s), p: hash1(i) * 6.28 });
  }
  // tail fluke
  const F = Math.round(22 * s);
  for (let j = -F; j <= F; j++) {
    const w = Math.round(20 * s * (1 - Math.abs(j) / (F + 1)) + (Math.abs(j) > F * 0.65 ? -3 * s : 0));
    rect(x, 4 * s + (F - Math.abs(j)) * 0.4, cy + j - 5 * s, Math.max(1, w), 1, Math.abs(j) < 3 ? '#2c4058' : '#3a5470');
  }
  rect(x, 18 * s, cy - 5 * s, 12 * s, 8 * s, '#3a5470');
  // pectoral fin
  const FK = Math.round(56 * s);
  for (let k = 0; k < FK; k++) {
    const fx = Math.round(L * 0.66 - k * 0.9), fy = Math.round(cy + 14 * s + k * 0.45);
    rect(x, fx, fy, Math.max(2, Math.round((7 - Math.floor(k / 12)) * s)), 2, k % 6 === 0 ? '#9ab0bc' : '#7a92a2');
  }
  // eye
  const es = s < 1 ? 2 : 3;
  rect(x, Math.round(L * 0.86), cy + 3 * s, es, es, '#0a0e14');
  px(x, Math.round(L * 0.86), cy + 3 * s, '#a8e8ff');
  for (let i = Math.round(L * 0.78); i < L - 6 * s; i++) px(x, i, cy + 8 * s + Math.round((i - L * 0.78) * 0.08), '#14202e');
  _whales[s] = { c, spots, L, HH, cy };
  return _whales[s];
}
function drawWhale(c, x, y, t, glow, o) {
  o = o || {};
  const w = whaleSprite(o.s);
  const img = o.left ? flipH(w.c) : w.c;
  c.drawImage(img, Math.round(x), Math.round(y));
  return w;
}
function whaleSpots(c, x, y, t, glow, o) {
  o = o || {};
  const w = whaleSprite(o.s);
  const r = o.s && o.s < 1 ? 5 : 7;
  w.spots.forEach((s, i) => {
    if (o.lit !== undefined && i >= o.lit) return;
    const sx = o.left ? x + w.L - s.x : x + s.x;
    const a = glow * (0.55 + 0.45 * Math.sin(t * 1.7 + s.p));
    if (a < 0.05) return;
    c.globalAlpha = a;
    c.drawImage(glowSprite(r, s.p > 3 ? '#7ff7e8' : '#9cffb0', 3, 0.9), Math.round(sx - r), Math.round(y + s.y - r));
    c.globalAlpha = Math.min(1, a + 0.3);
    rect(c, sx - 1, y + s.y - 1, 2, 2, '#e8fff8');
  });
  c.globalAlpha = 1;
}
