'use strict';
// ---------------------------------------------------------------------------
// Chapter II art: the northern sea, ice, aurora, snow, puffins, cannery, weir
// ---------------------------------------------------------------------------

SEA_PALS.arctic = { far: '#9cc0d2', near: '#12344c', hi: '#f4fcff', lo: '#0a2436' };

// ---------------- northern lights ----------------
function drawAurora(c, t, horizon, strength) {
  if (strength <= 0.02) return;
  c.globalCompositeOperation = 'lighter';
  for (let x = 0; x < W; x += 2) {
    const n1 = Math.sin(x * 0.012 + t * 0.07) + Math.sin(x * 0.031 - t * 0.11) * 0.6 + Math.sin(x * 0.005 + t * 0.03) * 0.8;
    const a = clamp((n1 + 0.6) / 2.4, 0, 1) * strength;
    if (a < 0.04) continue;
    const top = 18 + Math.sin(x * 0.009 + t * 0.05) * 14 + Math.sin(x * 0.027) * 6;
    const len = 46 + Math.sin(x * 0.017 + t * 0.09) * 18;
    for (let k = 0; k < 4; k++) {
      const y0 = top + k * len / 4;
      const fade = [0.25, 0.55, 0.4, 0.18][k];
      c.globalAlpha = a * fade;
      c.fillStyle = k === 0 ? '#b070e0' : k === 1 ? '#70f0b0' : '#40d8a0';
      c.fillRect(x, Math.round(y0), 2, Math.ceil(len / 4));
    }
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

Weather.flakes = [];
Weather.snow = function (c, t, intensity) {
  const n = Math.floor(120 * intensity);
  while (this.flakes.length < n) this.flakes.push({ x: Math.random() * W, y: Math.random() * H, s: 12 + Math.random() * 22, p: Math.random() * 6 });
  c.fillStyle = 'rgba(245,250,255,0.8)';
  for (let i = 0; i < n; i++) {
    const f = this.flakes[i];
    f.y += f.s / 60;
    f.x += Math.sin(t * 1.3 + f.p) * 0.3 - 0.15;
    if (f.y > H) { f.y = -2; f.x = Math.random() * W; }
    if (f.x < 0) f.x += W;
    c.fillRect(f.x | 0, f.y | 0, f.s > 26 ? 2 : 1, f.s > 26 ? 2 : 1);
  }
};

// ---------------- terrain ----------------
MAT.ice = function (x, d, y) {
  if (d === 0) return hexRgb('#f6fbff');
  if (d < 3) return hexRgb(hash2(x, y) > 0.8 ? '#e2f0f8' : '#eaf5fb');
  const crack = hash2(Math.floor(x / 11), Math.floor(y / 7)) > 0.86 && (x + y) % 5 === 0;
  if (crack) return hexRgb('#8ab8d0');
  const n = hash2(Math.floor(x / 4), Math.floor(y / 3));
  return mixRgb(mixRgb('#cfe6f2', '#a8d0e4', n), '#4a7a9a', Math.min(0.7, d / 50));
};
MAT.snowrock = function (x, d, y) {
  if (d < 3 && hash2(x, 9) > 0.1) return hexRgb(d === 0 ? '#ffffff' : '#e4eef6');
  if (d < 5 && hash2(x, y) > 0.6) return hexRgb('#dce8f0');
  return MAT.rock(x, d, y);
};
MAT.gravel = function (x, d, y) {
  const n = hash2(x, y);
  let col = hexRgb(n > 0.85 ? '#9a948c' : n < 0.15 ? '#5a5650' : '#7a756e');
  if (d < 2 && hash2(x, 4) > 0.6) col = hexRgb('#e8f0f6');
  return mixRgb(col, '#1a1a1a', Math.min(0.5, d / 70));
};

// ---------------- critters ----------------
function drawPuffin(c, x, y, t, seed, left) {
  const bob = Math.floor(t * 2 + seed) % 7 === 0 ? -1 : 0;
  const img = sprite(['.kkk..', 'kwwkoo', 'kwekoo', '.kwk..', 'kkwwk.', 'kkwwk.', '.kwk..', '.o.o..'],
    { k: '#141418', w: '#f4f4f0', o: '#f08a2a', e: '#3a3a40' });
  c.drawImage(left ? flipH(img) : img, Math.round(x - 3), Math.round(y - 8 + bob));
}
function drawFlyingPuffin(c, x, y, t, seed) {
  const f = Math.sin(t * 14 + seed) > 0;
  rect(c, x - 2, y, 5, 2, '#141418'); px(c, x + 3, y, '#f08a2a'); px(c, x + 2, y + 1, '#f4f4f0');
  if (f) { px(c, x - 1, y - 1, '#141418'); px(c, x, y - 2, '#141418'); } else { px(c, x - 1, y + 2, '#141418'); px(c, x, y + 3, '#141418'); }
}
function drawDog(c, x, gy, t, left) {
  const wag = Math.floor(t * 6) % 2;
  const rows = ['..........kk', '.........kgg', (wag ? 'g' : '.') + '.......kggk', (wag ? '.' : 'g') + 'gggggggggggn', '.gggggggggg.', '.gg.....gg..', '.kk.....kk..'];
  const img = sprite(rows, { g: '#8a8580', k: '#4a4540', n: '#141414' });
  c.drawImage(left ? flipH(img) : img, Math.round(x - 6), Math.round(gy - 7));
}
function drawSealPup(c, x, gy, t) {
  const blink = Math.floor(t * 0.7) % 6 === 0;
  const img = sprite(['......wwww....', '....wwwww' + (blink ? 'w' : 'k') + 'ww..', '..wwwwwwwwwwwk', 'wwwwwwwwwwwww.', '.wSwwwwwwwSw..'],
    { w: '#f4f6f8', k: '#141418', S: '#c8d0d8' });
  c.drawImage(img, Math.round(x - 7), Math.round(gy - 5));
}

// A weathered sea stack: irregular sides, ledges, strata, grass on top.
function drawSeaStack(c, x0, base, sw, sh, seed, far) {
  const top = base - sh;
  for (let y = top; y < base; y++) {
    const u = (y - top) / sh;
    const n = hash2(seed, Math.floor(y / 7));
    const ledge = (Math.floor(y / 7) % 3 === 0) ? 2 : 0;
    const half = sw / 2 * (0.75 + 0.25 * u) + (n - 0.5) * 4 + ledge;
    const cx = x0 + sw / 2 + Math.sin(y * 0.05 + seed) * 2;
    for (let x = Math.round(cx - half); x < cx + half; x++) {
      const side = (x - (cx - half)) / (half * 2);
      let col;
      if (far) col = far;
      else {
        col = side < 0.25 ? '#3e3a38' : side > 0.8 ? '#7a756e' : '#5a5550';
        if (y % 7 === 0) col = shade(col, 0.82);
        if (ledge && y % 7 === 1 && hash2(x, y) > 0.55) col = '#e4e2dc';
        if (y < top + 3) col = y === top ? '#7aaa50' : '#5a8a3a';
      }
      px(c, x, y, col);
    }
  }
}

// ---------------- buildings & structures ----------------
function corrugated(c, x, y, w, h, col, dark, rust) {
  for (let i = 0; i < w; i++) {
    const base = i % 3 === 0 ? dark : i % 3 === 1 ? col : shade(col, 1.08);
    for (let j = 0; j < h; j++) {
      let cc = base;
      if (rust && hash2(Math.floor((x + i) / 3), Math.floor((y + j) / 4)) > 0.78) cc = (j + i) % 4 ? '#8a4a2a' : '#6a3a20';
      if (j === 0) cc = dark;
      px(c, x + i, y + j, cc);
    }
  }
}

function drawWreckSign(c, x, y, text, bg, fg) {
  const w = textWidth(text) + 8;
  rect(c, x - 1, y - 1, w + 2, 13, '#2a2420');
  rect(c, x, y, w, 11, bg);
  for (let i = 0; i < w; i += 3) if (hash2(i, x) > 0.7) px(c, x + i, y + 10, '#8a4a2a');
  drawText(c, text, x + 4, y + 2, fg);
}

// The weir: big timber posts across the channel with a gate of planks.
// open: 0 (closed) .. 1 (raised)
function drawWeir(c, x0, x1, waterY, open, t) {
  const posts = [];
  for (let x = x0; x <= x1; x += 34) posts.push(x);
  // gate planks between posts, lifted by `open`
  const lift = Math.round(open * 46);
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i] + 5, b = posts[i + 1];
    for (let j = 0; j < 8; j++) {
      const y = waterY - 26 + j * 5 - lift;
      rect(c, a, y, b - a, 4, j % 2 ? '#4a3626' : '#5a4230');
      rect(c, a, y, b - a, 1, '#6a5038');
    }
  }
  for (const x of posts) {
    rect(c, x, waterY - 74, 6, 90, '#3a2a1e');
    rect(c, x + 1, waterY - 74, 1, 90, '#5a4430');
    rect(c, x - 1, waterY - 76, 8, 3, '#2a1e16');
    for (let k = 0; k < 4; k++) px(c, x + 2 + (k % 2), waterY - 60 + k * 12, '#8a4a2a');
  }
  // chains from the top beam
  rect(c, x0, waterY - 72, x1 - x0 + 6, 4, '#3a2a1e');
  for (let i = 0; i < posts.length - 1; i++) {
    const cx = posts[i] + 20;
    for (let y = waterY - 68; y < waterY - 22 - lift; y += 3) px(c, cx + ((y / 3) % 2 ? 0 : 1), y, '#6a6a70');
  }
}

function drawWinchHouse(c, x, gy, gearAngle) {
  corrugated(c, x, gy - 40, 46, 40, '#6a7a7e', '#4a5458', true);
  for (let i = 0; i < 56; i++) rect(c, x - 5 + i, gy - 46 + Math.abs(i - 28) * 0.2, 1, 6, i % 4 === 0 ? '#5a3a2a' : '#7a4a30');
  rect(c, x + 16, gy - 24, 14, 24, '#2a2420');
  // big gear wheel on the side
  const gx = x + 58, gyy = gy - 20, R = 13;
  for (let k = 0; k < 12; k++) {
    const a = gearAngle + k / 12 * Math.PI * 2;
    rect(c, gx + Math.cos(a) * R - 1, gyy + Math.sin(a) * R - 1, 3, 3, '#5a5a62');
  }
  for (let a = 0; a < Math.PI * 2; a += 0.15) px(c, gx + Math.cos(a) * (R - 2), gyy + Math.sin(a) * (R - 2), '#7a7a82');
  for (let k = 0; k < 4; k++) { const a = gearAngle + k * Math.PI / 2; line(c, gx, gyy, gx + Math.cos(a) * (R - 2), gyy + Math.sin(a) * (R - 2), '#6a6a72'); }
  rect(c, gx - 2, gyy - 2, 4, 4, '#3a3a40');
}

// Crystals for the grotto
function drawCrystal(c, x, y, h, col, lean) {
  for (let j = 0; j < h; j++) {
    const u = j / h;
    const w = Math.max(1, Math.round((1 - u) * 5));
    const cx = x + lean * j;
    rect(c, cx - w / 2, y - j, w, 1, u > 0.85 ? '#ffffff' : j % 4 === 0 ? shade(col, 1.25) : col);
  }
}

// Little Wren: Margaret's boat, with a faded red sail
function drawWren(c, x, gy, frozen) {
  const L = 40;
  c.save(); c.translate(x, gy); c.rotate(-0.12);
  for (let i = 0; i < L; i++) {
    const u = (i - L * 0.5) / (L * 0.5);
    const top = Math.round(u > 0 ? -u * u * 3 : -u * u * 1.5);
    const bot = 9 - Math.round(u > 0 ? Math.pow(u, 2.2) * 8 : Math.pow(-u, 4) * 5);
    for (let y = top; y < bot; y++) px(c, i - L / 2, y - 9, y === top ? '#e8e0d0' : (y - top) % 3 === 2 ? '#3a5a7a' : '#4a6a8a');
  }
  rect(c, -2, -44, 2, 36, '#5a3c22');
  for (let y = -42; y < -12; y++) {
    const w = Math.round((y + 42) / 30 * 16);
    rect(c, -2 - w, y, w, 1, y % 5 === 0 ? '#a84a3a' : '#c8604a');
  }
  c.restore();
  if (frozen) {
    c.globalAlpha = 0.45;
    for (let j = 0; j < 22; j++) rect(c, x - 28 + Math.round(Math.sin(j) * 2), gy - 20 + j, 58, 1, j % 3 ? '#cfeaf6' : '#ffffff');
    c.globalAlpha = 1;
  }
}

// Whale backs breaking the surface (used in harbours and channels)
function drawWhaleBacks(c, x, y, t, calfLit) {
  const hump = (cx, w, h, col, top) => {
    for (let i = 0; i < w; i++) {
      const u = i / w;
      const hh = Math.round(Math.sin(u * Math.PI) * h);
      if (hh > 0) { rect(c, cx + i, y - hh, 1, hh, col); px(c, cx + i, y - hh, top); }
    }
  };
  const b = Math.sin(t * 0.6) * 1.2;
  hump(x, 130, 14 + b, '#3a5470', '#9ac8dc');
  hump(x + 142, 56, 8 - b * 0.5, '#4a6480', '#8ab0c8');
  // dorsal & spout now and then
  rect(c, x + 70, y - 12 - b, 4, 3, '#3a5470');
  const ph = (t * 0.25) % 1;
  if (ph < 0.18) for (let i = 0; i < 10; i++) px(c, x + 92 + Math.sin(i) * 4 * ph * 5, y - 12 - ph * 90 + i * 2, 'rgba(230,245,255,0.7)');
  return [{ x: x + 20, y: y - 6, big: true }, { x: x + 60, y: y - 7, big: true }, { x: x + 100, y: y - 5, big: true }, { x: x + 150, y: y - 3, big: false, calf: true }];
}

// ---------------- silhouettes & chart icons for the north ----------------
const _drawSilhouette1 = drawSilhouette;
drawSilhouette = function (c, kind, x, horizon, col, t) {
  x = Math.round(x);
  if (kind === 'stacks') {
    for (const [dx, w, h] of [[-44, 12, 40], [-20, 16, 56], [6, 10, 32], [28, 18, 48]]) drawSeaStack(c, x + dx, horizon, w, h, dx + 50, col);
  } else if (kind === 'cannery') {
    for (let i = 0; i < 160; i++) { const hh = Math.round(14 + Math.sin(i / 160 * Math.PI) * 30); rect(c, x - 80 + i, horizon - hh, 1, hh, col); }
    rect(c, x - 30, horizon - 58, 40, 20, col); rect(c, x - 10, horizon - 80, 5, 24, col);
  } else if (kind === 'ice') {
    for (const [dx, w, h, sd] of [[-60, 40, 16, 1], [-10, 56, 28, 2], [50, 34, 12, 3]]) for (let i = 0; i < w; i++) {
      const u = i / w;
      const p1 = 1 - Math.abs(u - 0.3) * 2.2, p2 = 1 - Math.abs(u - 0.7) * 3;
      const hh = Math.round(Math.max(0.25, p1, p2 * 0.8) * h + (hash2(i >> 1, sd) - 0.5) * 3);
      rect(c, x + dx + i, horizon - hh, 1, hh, col);
      if (i % 9 === 4) rect(c, x + dx + i, horizon - hh + 2, 1, hh - 2, 'rgba(255,255,255,0.18)');
    }
  } else if (kind === 'narrows') {
    for (let i = 0; i < 70; i++) rect(c, x - 90 + i, horizon - 70 + i * 0.5, 1, 70 - i * 0.5, col);
    for (let i = 0; i < 70; i++) rect(c, x + 20 + i, horizon - 35 - i * 0.5, 1, 35 + i * 0.5, col);
  } else if (kind === 'glacier') {
    for (let i = 0; i < 200; i++) { const hh = Math.round(40 + Math.sin(i * 0.05) * 10 + (i % 7 === 0 ? 3 : 0)); rect(c, x - 100 + i, horizon - hh, 1, hh, col); }
  } else _drawSilhouette1(c, kind, x, horizon, col, t);
};

const _drawChartIcon1 = drawChartIcon;
drawChartIcon = function (c, kind, x, y, t) {
  const ink = '#4a3a2a';
  if (kind === 'stacks') { for (let i = 0; i < 3; i++) rect(c, x - 6 + i * 5, y - 6 + (i % 2) * 2, 3, 8 - (i % 2) * 2, '#7a7a6a'); }
  else if (kind === 'cannery') { rect(c, x - 6, y - 4, 12, 6, ink); rect(c, x + 2, y - 10, 2, 6, ink); }
  else if (kind === 'ice') { ellipse(c, x, y, 9, 3, '#e8f4fa'); line(c, x - 6, y, x + 6, y - 1, '#8ab8d0'); }
  else if (kind === 'narrows') { line(c, x - 6, y - 6, x - 2, y + 6, ink); line(c, x + 6, y - 6, x + 2, y + 6, ink); for (let i = -2; i <= 2; i++) px(c, x + i, y, '#8a5a3a'); }
  else if (kind === 'glacier') { for (let i = 0; i < 12; i++) rect(c, x - 6 + i, y - 3 - (i % 3), 1, 5 + (i % 3), '#d8eef8'); px(c, x, y - 7, Math.floor(t * 2) % 2 ? '#70f0b0' : '#b070e0'); }
  else _drawChartIcon1(c, kind, x, y, t);
};

// ---------------- extra fish ----------------
FISH.haddock = { name: 'Haddock', body: '#9a9aa4', back: '#4a4a56', belly: '#e8e8ee', len: 14, th: 5, price: 7, diff: 0.45 };
FISH.char = { name: 'Arctic Char', body: '#e08a5a', back: '#3a5a6a', belly: '#f8c0a0', len: 14, th: 5, price: 14, diff: 0.6, spots: '#f8e0c0' };
FISH.halibut = { name: 'Halibut', body: '#7a6a5a', back: '#4a3a2e', belly: '#f0ece4', len: 17, th: 6, price: 18, diff: 0.7 };
