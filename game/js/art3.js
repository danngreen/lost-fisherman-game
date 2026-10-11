'use strict';
// ---------------------------------------------------------------------------
// Chapter III art: summer bunting, goats, eider ducks, seals, the Skerries,
// the tower at Ness End, regatta boats, bonfires, and Maggie's pencil sketches
// ---------------------------------------------------------------------------

// ---------------- extra fish ----------------
FISH.pollock = { name: 'Pollock', body: '#8a9a6a', back: '#4a5a3a', belly: '#e8ecd8', len: 14, th: 5, price: 6, diff: 0.4 };
FISH.seatrout = { name: 'Sea Trout', body: '#c0c8cc', back: '#5a6a72', belly: '#f4f4f0', len: 14, th: 4, price: 11, diff: 0.55, spots: '#3a3a40' };
FISH.lumpfish = { name: 'Lumpfish', body: '#7aa060', back: '#4a6a3a', belly: '#e8a050', len: 11, th: 6, price: 9, diff: 0.35 };

// ---------------- critters ----------------
function drawGoat(c, x, gy, t, left, chew) {
  const jaw = chew && Math.floor(t * 5) % 2;
  const rows = [
    '.........k.k',
    '........kwwk',
    '.........wwwe',
    '........ww' + (jaw ? 'ww.' : 'wwk'),
    'wwwwwwwwwww.',
    'wSwwwwwwwww.',
    '.wwwwwwwwww.',
    '.ww......ww.',
    '.kk......kk.',
  ];
  const img = sprite(rows, { w: '#e8e2d4', S: '#c8c0b0', k: '#3a3430', e: '#1a1410' });
  c.drawImage(left ? flipH(img) : img, Math.round(x - 6), Math.round(gy - 9));
}

// eider ducks: the drakes are black and white with a green neck, the ducks brown
function drawEider(c, x, gy, t, seed, left) {
  const drake = seed % 3 !== 0;
  const bob = Math.floor(t * 1.5 + seed) % 6 === 0 ? -1 : 0;
  const rows = drake
    ? ['..kkk.', '.kwwgw', '.kwwgy', 'wwwwww.', 'kkkwww', '.kkkk.']
    : ['..bbb.', '.bbbbb', '.bbbby', 'bbBbbb.', 'BbbBbb', '.BBBB.'];
  const img = sprite(rows, { k: '#1a1a1e', w: '#f4f2ec', g: '#8ad0a0', y: '#a8a060', b: '#8a6a4a', B: '#6a4a30' });
  c.drawImage(left ? flipH(img) : img, Math.round(x - 3), Math.round(gy - 6 + bob));
}

// a big gray seal hauled out on a rock
function drawSeal(c, x, gy, t, seed, left) {
  const head = Math.sin(t * 0.6 + seed) > 0.6 ? 1 : 0;
  const rows = [
    '..........' + (head ? '..gg.' : '.....'),
    '......gggg' + (head ? 'ggggk' : 'gg...'),
    '...ggggggggggg' + (head ? 'g' : 'k'),
    '.ggSggggggSgggg',
    'gggggggggggggg.',
    '.SSSSSSSSSSSS..',
  ];
  const img = sprite(rows, { g: '#6a6e74', S: '#8a8e94', k: '#141418' });
  c.drawImage(left ? flipH(img) : img, Math.round(x - 7), Math.round(gy - 6));
}

// ---------------- summer decorations ----------------
// a string of little triangular flags hanging between two points
function drawBunting(c, x0, y0, x1, y1, t, seed) {
  const cols = ['#c84a3a', '#f2c94c', '#3a7ac8', '#f4f0e8', '#4aa06a'];
  const n = Math.floor((x1 - x0) / 7);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = lerp(x0, x1, u), y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * 10;
    px(c, x, y, '#5a4a3a');
    if (i % 2 === 0 && i < n) {
      const col = cols[(i / 2 + (seed || 0)) % cols.length];
      const flap = Math.round(Math.sin(t * 3 + i + (seed || 0)) * 0.6);
      for (let j = 0; j < 4; j++) rect(c, x + 1 + Math.floor(j / 2) + flap * (j > 1 ? 1 : 0), y + 1 + j, 4 - j, 1, col);
    } else px(c, x + 1, y, '#5a4a3a');
  }
}

function drawBonfire(c, x, gy, t) {
  for (let i = 0; i < 5; i++) { rect(c, x - 9 + i * 4, gy - 3 - (i % 2), 6, 2, '#5a3a22'); }
  for (let i = 0; i < 9; i++) {
    const hh = 6 + Math.round(8 * Math.abs(Math.sin(t * 6 + i * 1.7))) - Math.abs(i - 4) * 1.4;
    if (hh <= 0) continue;
    rect(c, x - 9 + i * 2, gy - 4 - hh, 2, hh, i % 3 === 0 ? '#ffe080' : i % 2 ? '#ff9a30' : '#f06a20');
  }
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.8 + i / 4) % 1;
    c.globalAlpha = 1 - ph;
    px(c, x - 3 + Math.sin(ph * 9 + i) * 4, gy - 16 - ph * 26, '#ffd060');
    c.globalAlpha = 1;
  }
}

// ---------------- buildings ----------------
// Ness End: an old foghorn tower on the last rock, white with a red band
function drawFogTower(c, x, gy) {
  const h = 70;
  for (let y = 0; y < h; y++) {
    const half = 8 - y * 0.03;
    for (let i = -half; i < half; i++) {
      let col = i < -half * 0.4 ? '#c8c4bc' : '#ece8e0';
      if (y > 44 && y < 52) col = i < -half * 0.4 ? '#8a3428' : '#b8463a';
      if (hash2(Math.floor(i + x), y) > 0.97) col = '#a8a49c';
      px(c, x + i, gy - y, col);
    }
  }
  // gallery & the horn
  rect(c, x - 10, gy - h - 2, 20, 2, '#3a3a40');
  rect(c, x - 6, gy - h - 12, 12, 10, '#4a4e58'); rect(c, x - 6, gy - h - 12, 12, 1, '#6a6e78');
  for (let i = 0; i < 9; i++) rect(c, x + 6 + i, gy - h - 9 - Math.floor(i / 2), 1, 4 + i, i % 3 ? '#8a7a5a' : '#6a5a3a');
  // door & window
  rect(c, x - 3, gy - 14, 7, 14, '#3a2a20'); rect(c, x - 3, gy - 15, 7, 1, '#2a1a10');
  rect(c, x - 2, gy - 36, 4, 6, '#2a3440');
}

// a little turf-roofed house, grass growing on top
function drawTurfHouse(c, x, gy, w, h) {
  plankWall(c, x, gy - h, w, h, '#8a6a4a', '#5a4430', 77);
  rect(c, x + w / 2 - 5, gy - 22, 11, 22, '#3a2618');
  rect(c, x + 6, gy - h + 8, 10, 8, '#2a3440'); rect(c, x + w - 16, gy - h + 8, 10, 8, '#2a3440');
  for (let i = -4; i < w + 4; i++) {
    const r = 10 - Math.abs(i - w / 2) * 0.35;
    for (let j = 0; j < r; j++) px(c, x + i, gy - h - j, j > r - 2 ? (hash2(i, 3) > 0.4 ? '#7aa84a' : '#5f8f3a') : j > r - 4 ? '#4f7d30' : '#5e4630');
  }
}

// ---------------- chart & horizon ----------------
const _drawChartIcon2 = drawChartIcon;
drawChartIcon = function (c, kind, x, y, t) {
  const ink = '#4a3a2a';
  if (kind === 'skerry') { for (const [dx, dy, r] of [[-5, 1, 3], [1, -1, 4], [6, 2, 2]]) ellipse(c, x + dx, y + dy, r, 2, '#9a9a7a'); }
  else if (kind === 'holm') { ellipse(c, x, y + 1, 8, 3, '#8aa060'); rect(c, x - 2, y - 4, 5, 4, ink); }
  else if (kind === 'tower') { ellipse(c, x, y + 2, 6, 3, '#8a8a7a'); rect(c, x - 1, y - 9, 3, 10, '#e8e0d0'); rect(c, x - 1, y - 4, 3, 2, '#c84a3a'); }
  else _drawChartIcon2(c, kind, x, y, t);
};

const _drawSilhouette2 = drawSilhouette;
drawSilhouette = function (c, kind, x, horizon, col, t) {
  x = Math.round(x);
  const hump = (w, hgt, cx) => { for (let i = 0; i < w; i++) { const hh = Math.round(Math.pow(Math.sin(i / w * Math.PI), 0.8) * hgt); rect(c, cx + i - w / 2, horizon - hh, 1, hh, col); } };
  if (kind === 'skerry') { hump(40, 7, x - 50); hump(70, 12, x); hump(30, 5, x + 60); }
  else if (kind === 'holm') { hump(110, 14, x); rect(c, x - 6, horizon - 22, 14, 8, col); }
  else if (kind === 'tower') { hump(60, 18, x); rect(c, x - 4, horizon - 60, 8, 44, col); rect(c, x - 6, horizon - 64, 12, 4, col); }
  else _drawSilhouette2(c, kind, x, horizon, col, t);
};

// ---------------- Maggie's sketches ----------------
// Turns the current frame into a pencil drawing on old paper, then fades it in
// over the real view: "she drew it from right here".
const Sketch = {
  active: null,
  make(src) {
    const d = src.getContext('2d').getImageData(0, 0, W, H).data;
    const lum = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) lum[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255;
    const [c, x] = makeCanvas(W, H);
    const img = x.createImageData(W, H), o = img.data;
    const paper = hexRgb('#efe4cc'), lead = hexRgb('#4a4238');
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const k = y * W + i;
      const L = lum[k];
      const gx = i < W - 1 ? Math.abs(lum[k + 1] - L) : 0, gy = y < H - 1 ? Math.abs(lum[k + W] - L) : 0;
      let ink = Math.min(1, (gx + gy) * 4);
      if (L < 0.5 && (i + y) % 4 === 0) ink = Math.max(ink, 0.45);
      if (L < 0.32 && (i - y + 400) % 3 === 0) ink = Math.max(ink, 0.6);
      if (L < 0.18) ink = Math.max(ink, 0.5);
      const grain = hash2(i, y) * 0.08;
      const col = mixRgb(paper, lead, Math.max(0, ink - grain));
      const edge = Math.min(i, W - 1 - i, y, H - 1 - y);
      const age = edge < 14 ? (14 - edge) / 14 * 0.25 : 0;
      const fin = mixRgb(col, '#b89868', age);
      o[k * 4] = fin[0]; o[k * 4 + 1] = fin[1]; o[k * 4 + 2] = fin[2]; o[k * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  },
  // snap the frame on the next draw, then hold the sketch until stop()
  start(caption) { this.active = { img: null, t0: null, caption }; },
  stop() { this.active = null; },
  draw(c) {
    const a = this.active;
    if (!a) return;
    if (!a.img) { a.img = this.make(c.canvas); a.t0 = Game.t; }
    c.globalAlpha = clamp((Game.t - a.t0) / 1.5, 0, 1);
    c.drawImage(a.img, 0, 0);
    if (a.caption) drawText(c, a.caption, W - 20, H - 22, '#5a4a3a', { align: 'right' });
    c.globalAlpha = 1;
  },
};

// ---------------- icons & people ----------------
function initChapter3Art() {
  const P = { k: '#1a1410', y: '#f2c94c', Y: '#c8962a', w: '#ffffff', s: '#e8e4dc', S: '#b8b0a4', r: '#c84a3a', R: '#8a3a2a', g: '#7a7a82', G: '#4a4a52', b: '#8a6a4a', B: '#5a4030', t: '#c8a878', l: '#5a8ac8', n: '#2a2a2e', o: '#e89a3a' };
  const defs = {
    postcard: ['kkkkkkkk', 'ksssskSk', 'kslsskrk', 'kssssSSk', 'kSSSSSSk', 'kssssssk', 'kkkkkkkk', '........'],
    towline: ['..kkkk..', '.kttttk.', 'ktkkkktk', 'ktk..ktk', 'ktk..ktk', 'ktkkkktk', '.kttttk.', '..kkkk..'],
    hkey: ['.kkk....', 'kyyyk...', 'ky.yk...', 'kyyykkkk', '.kkkyyyk', '....kyk.', '....kk..', '........'],
    sketchbook: ['.kkkkkk.', 'kbsssssk', 'kbsgsssk', 'kbsgGssk', 'kbssGgsk', 'kbsssssk', 'kbsssssk', '.kkkkkk.'],
    famphoto: ['kkkkkkkk', 'ksssssSk', 'ksgsgsgk', 'ksGsGgGk', 'ksGsGsGk', 'kSSSSSSk', 'kkkkkkkk', '........'],
    tar: ['.kkkkk..', 'kbbbbbk.', 'kkkkkkk.', 'kbnnnbk.', 'kbnnnbk.', 'kbbbbbk.', '.kkkkk..', '........'],
    spar: ['......kk', '.....kbk', '....kbk.', '...kbk..', '..kbk...', '.kbk....', 'kbk.....', 'kk......'],
    sailcloth: ['........', '.kkkkkk.', 'ksssssSk', 'kSSSSSSk', 'ksssssSk', 'kSSSSSSk', '.kkkkkk.', '........'],
    coffee: ['..kkkk..', '.kbbbbk.', 'kBBBBBBk', 'kBokkoBk', 'kBkoBkBk', 'kBBBBBBk', '.kBBBBk.', '..kkkk..'],
    letters: ['kkkkkkk.', 'ksskssk.', 'kskkkskk', 'kssrsssk', 'kkkrkkkk', '.ksssssk', '.kkkkkkk', '........'],
    redsail: ['...k....', '...kr...', '...krr..', '...krRr.', '...krrRr', '...krrrr', 'kkkkkkkk', '........'],
    pimmap: ['kkkkkkkk', 'ksslsssk', 'kslllssk', 'ksslnssk', 'kssslllk', 'ksnsslsk', 'kkkkkkkk', '........'],
    efeather: ['......kk', '.....kSk', '....kSSk', '...kSSk.', '..kSSk..', '.kSkk...', 'k.......', '........'],
    smoked: ['........', '..kkkk..', '.kooook.', 'koBoooBk', 'kooooook', '.kBBBBk.', '..kkkk..', '........'],
    cup: ['kk....kk', 'ksk..ksk', '.kssssk.', '.ksssSk.', '..kssk..', '...kk...', '..kSSk..', '.kkkkkk.'],
    countbook: ['.kkkkkk.', 'kRrrrrrk', 'kRrwwrrk', 'kRrwkwrk', 'kRrwwrrk', 'kRrrrrrk', 'kRrrrrrk', '.kkkkkk.'],
    paint: ['..kk....', '..kk....', '.kkkk...', 'krrrrk..', 'krrrrk..', 'kRRRRk..', '.kkkk...', '........'],
  };
  for (const k in defs) ICONS[k] = sprite(defs[k], P);
  PEOPLE.toby = makePerson({ hat: 'cap', hatCol: '#3a4a5a', hair: '#a8a8a8', beard: 'full', beardCol: '#c0c0c0', coat: '#8a6a3a', coatDark: '#6a4e28', pants: '#3a3a42', boots: '#2a2018', skin: '#d8a07a' });
  PEOPLE.ingrid = makePerson({ hat: 'scarf', hatCol: '#4a6aa8', hair: '#e0d8c8', coat: '#a8503a', dress: true, boots: '#3a2a20', skin: '#eab89a' });
  PEOPLE.pim = makePerson({ kid: true, hair: '#e8c060', hairStyle: 'curly', coat: '#3a6aa8', pants: '#4a4a3a', boots: '#2a2018', skin: '#f0c4a0' });
  SPEAKERS.toby = { name: 'Toby Hartley', p: 'toby' };
  SPEAKERS.tobyQ = { name: 'The Man at Ness End', p: 'toby' };
  SPEAKERS.ingrid = { name: 'Ingrid, Eider Keeper', p: 'ingrid' };
  SPEAKERS.pim = { name: 'Pim', p: 'pim' };
}
