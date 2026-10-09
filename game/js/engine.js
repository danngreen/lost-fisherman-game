'use strict';
// ---------------------------------------------------------------------------
// Core engine: screen, scaling, input, utilities, bitmap font, sprite helpers
// ---------------------------------------------------------------------------

const W = 480, H = 270;

const view = document.getElementById('view');
const vctx = view.getContext('2d');
const screenCanvas = document.createElement('canvas');
screenCanvas.width = W; screenCanvas.height = H;
const ctx = screenCanvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const viewFit = { s: 1, ox: 0, oy: 0 };
function fitView() {
  const dpr = window.devicePixelRatio || 1;
  const cw = Math.floor(window.innerWidth * dpr), ch = Math.floor(window.innerHeight * dpr);
  view.width = cw; view.height = ch;
  view.style.width = window.innerWidth + 'px';
  view.style.height = window.innerHeight + 'px';
  let s = Math.min(cw / W, ch / H);
  if (s >= 1) s = Math.floor(s);
  viewFit.s = s;
  viewFit.ox = Math.floor((cw - W * s) / 2);
  viewFit.oy = Math.floor((ch - H * s) / 2);
  vctx.imageSmoothingEnabled = false;
  vctx.fillStyle = '#000';
  vctx.fillRect(0, 0, cw, ch);
}
window.addEventListener('resize', fitView);
fitView();

function present() {
  vctx.imageSmoothingEnabled = false;
  vctx.drawImage(screenCanvas, viewFit.ox, viewFit.oy, W * viewFit.s, H * viewFit.s);
}

// ---------------------------------------------------------------------------
// Math / colour utilities
// ---------------------------------------------------------------------------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function hash1(x) { return hash2(x, 7919); }

function RNG(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const _hexCache = {};
function hexRgb(h) {
  if (Array.isArray(h)) return h;
  let c = _hexCache[h];
  if (c) return c;
  const s = h.replace('#', '');
  c = [parseInt(s.substr(0, 2), 16), parseInt(s.substr(2, 2), 16), parseInt(s.substr(4, 2), 16)];
  _hexCache[h] = c;
  return c;
}
function mixRgb(a, b, t) {
  a = hexRgb(a); b = hexRgb(b);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function rgbStr(c, a) {
  if (a === undefined) return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
}
function mix(a, b, t) { return rgbStr(mixRgb(a, b, t)); }
function shade(h, f) { // f<1 darker, f>1 lighter
  const c = hexRgb(h);
  if (f < 1) return rgbStr([c[0] * f, c[1] * f, c[2] * f]);
  return rgbStr(mixRgb(c, [255, 255, 255], f - 1));
}

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map(r => r.map(v => (v + 0.5) / 16));

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return [c, x];
}

// Sprite from rows of characters; '.' or ' ' are transparent
const _spriteMemo = new Map();
function sprite(rows, pal) {
  const key = rows.join('/') + JSON.stringify(pal);
  const hit = _spriteMemo.get(key);
  if (hit) return hit;
  const c = buildSprite(rows, pal);
  if (_spriteMemo.size < 400) _spriteMemo.set(key, c);
  return c;
}
function buildSprite(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const [c, x] = makeCanvas(w, h);
  for (let j = 0; j < h; j++) {
    const r = rows[j];
    for (let i = 0; i < r.length; i++) {
      const ch = r[i];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch];
      if (!col) continue;
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    }
  }
  return c;
}

function flipH(c) {
  if (c._flip) return c._flip;
  const [f, x] = makeCanvas(c.width, c.height);
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(c, 0, 0);
  c._flip = f;
  f._flip = c;
  return f;
}

// Stepped (pixel-banded) glow sprite, cached
const _glowCache = {};
function glowSprite(r, color, steps, strength) {
  steps = steps || 4; strength = strength || 1;
  const key = r + color + steps + strength;
  if (_glowCache[key]) return _glowCache[key];
  const size = r * 2 + 1;
  const [c, x] = makeCanvas(size, size);
  const img = x.createImageData(size, size);
  const col = hexRgb(color);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const d = Math.hypot(i - r, j - r) / r;
      if (d >= 1) continue;
      const band = Math.floor((1 - d) * steps + BAYER4[j & 3][i & 3] * 0.9) / steps;
      const a = Math.min(1, band * band * strength);
      const k = (j * size + i) * 4;
      img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2];
      img.data[k + 3] = a * 255;
    }
  }
  x.putImageData(img, 0, 0);
  _glowCache[key] = c;
  return c;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyE: 'act', Space: 'act', Enter: 'act', NumpadEnter: 'act', KeyZ: 'act',
  Escape: 'back', KeyX: 'back', Backspace: 'back', KeyQ: 'back',
  KeyI: 'inv', Tab: 'inv',
  KeyJ: 'journal',
  KeyM: 'mute',
  KeyF: 'fullscreen',
};
const Input = {
  down: {}, hit: {}, any: false,
  pressed(a) { return !!this.hit[a]; },
  held(a) { return !!this.down[a]; },
  endFrame() { this.hit = {}; this.any = false; },
  clear() { this.hit = {}; this.down = {}; },
  consume(a) { this.hit[a] = false; },
};
window.addEventListener('keydown', e => {
  const a = KEYMAP[e.code];
  if (e.metaKey) return; // let Cmd+Q etc through to the app
  if (a) {
    e.preventDefault();
    if (!e.repeat) { Input.hit[a] = true; Input.any = true; }
    Input.down[a] = true;
  } else {
    e.preventDefault();
    if (!e.repeat) Input.any = true;
  }
  if (typeof Sound !== 'undefined') Sound.unlock();
});
window.addEventListener('keyup', e => {
  const a = KEYMAP[e.code];
  if (a) { e.preventDefault(); Input.down[a] = false; }
});
window.addEventListener('blur', () => Input.clear());
window.addEventListener('mousedown', () => { if (typeof Sound !== 'undefined') Sound.unlock(); });

// ---------------------------------------------------------------------------
// Bitmap font (proportional, 7px cap height, 2px descenders)
// ---------------------------------------------------------------------------
const FONT_SRC = {
  'A': '.##./#..#/#..#/####/#..#/#..#/#..#',
  'B': '###./#..#/#..#/###./#..#/#..#/###.',
  'C': '.##./#..#/#.../#.../#.../#..#/.##.',
  'D': '###./#..#/#..#/#..#/#..#/#..#/###.',
  'E': '####/#.../#.../###./#.../#.../####',
  'F': '####/#.../#.../###./#.../#.../#...',
  'G': '.##./#..#/#.../#.##/#..#/#..#/.###',
  'H': '#..#/#..#/#..#/####/#..#/#..#/#..#',
  'I': '###/.#./.#./.#./.#./.#./###',
  'J': '..##/...#/...#/...#/#..#/#..#/.##.',
  'K': '#..#/#..#/#.#./##../#.#./#..#/#..#',
  'L': '#.../#.../#.../#.../#.../#.../####',
  'M': '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
  'N': '#..#/##.#/##.#/#.##/#.##/#..#/#..#',
  'O': '.##./#..#/#..#/#..#/#..#/#..#/.##.',
  'P': '###./#..#/#..#/###./#.../#.../#...',
  'Q': '.##./#..#/#..#/#..#/#..#/#.#./.#.#',
  'R': '###./#..#/#..#/###./#.#./#..#/#..#',
  'S': '.###/#.../#.../.##./...#/...#/###.',
  'T': '#####/..#../..#../..#../..#../..#../..#..',
  'U': '#..#/#..#/#..#/#..#/#..#/#..#/.##.',
  'V': '#...#/#...#/#...#/#...#/.#.#./.#.#./..#..',
  'W': '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
  'X': '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  'Y': '#...#/#...#/.#.#./..#../..#../..#../..#..',
  'Z': '####/...#/..#./.#../#.../#.../####',
  'a': '..../..../.##./...#/.###/#..#/.###',
  'b': '#.../#.../###./#..#/#..#/#..#/###.',
  'c': '.../.../.##/#../#../#../.##',
  'd': '...#/...#/.###/#..#/#..#/#..#/.###',
  'e': '..../..../.##./#..#/####/#.../.###',
  'f': '.##/#../###/#../#../#../#..',
  'g': '..../..../.###/#..#/#..#/#..#/.###/...#/.##.',
  'h': '#.../#.../###./#..#/#..#/#..#/#..#',
  'i': '#/./#/#/#/#/#',
  'j': '..#/.../..#/..#/..#/..#/..#/#.#/.#.',
  'k': '#.../#.../#..#/#.#./##../#.#./#..#',
  'l': '#./#./#./#./#./#./.#',
  'm': '...../...../##.#./#.#.#/#.#.#/#.#.#/#.#.#',
  'n': '..../..../###./#..#/#..#/#..#/#..#',
  'o': '..../..../.##./#..#/#..#/#..#/.##.',
  'p': '..../..../###./#..#/#..#/#..#/###./#.../#...',
  'q': '..../..../.###/#..#/#..#/#..#/.###/...#/...#',
  'r': '.../.../#.#/##./#../#../#..',
  's': '.../.../.##/#../.#./..#/##.',
  't': '.#./.#./###/.#./.#./.#./..#',
  'u': '..../..../#..#/#..#/#..#/#..#/.###',
  'v': '.../.../#.#/#.#/#.#/#.#/.#.',
  'w': '...../...../#...#/#...#/#.#.#/#.#.#/.#.#.',
  'x': '.../.../#.#/#.#/.#./#.#/#.#',
  'y': '..../..../#..#/#..#/#..#/#..#/.###/...#/.##.',
  'z': '..../..../####/...#/.##./#.../####',
  '0': '.##./#..#/#.##/#..#/##.#/#..#/.##.',
  '1': '.#./##./.#./.#./.#./.#./###',
  '2': '.##./#..#/...#/..#./.#../#.../####',
  '3': '###./...#/...#/.##./...#/...#/###.',
  '4': '#..#/#..#/#..#/####/...#/...#/...#',
  '5': '####/#.../###./...#/...#/#..#/.##.',
  '6': '.##./#.../#.../###./#..#/#..#/.##.',
  '7': '####/...#/..#./..#./.#../.#../.#..',
  '8': '.##./#..#/#..#/.##./#..#/#..#/.##.',
  '9': '.##./#..#/#..#/.###/...#/...#/.##.',
  '.': '././././././#',
  ',': '././././././#/#',
  '!': '#/#/#/#/#/./#',
  '?': '.##./#..#/...#/..#./.#../..../.#..',
  "'": '#/#',
  '"': '#.#/#.#',
  ':': './././#/././#',
  ';': './././#/././#/#',
  '-': '.../.../.../###',
  '+': '.../.../.#./###/.#.',
  '=': '.../.../###/.../###',
  '(': '.#/#./#./#./#./#./.#',
  ')': '#./.#/.#/.#/.#/.#/#.',
  '[': '##/#./#./#./#./#./##',
  ']': '##/.#/.#/.#/.#/.#/##',
  '/': '..#/..#/.#./.#./.#./#../#..',
  '*': '.../#.#/.#./#.#',
  '<': '.../..#/.#./#../.#./..#',
  '>': '.../#../.#./..#/.#./#..',
  '&': '.#../#.#./#.#./.#../#.##/#..#/.##.',
  '%': '#..#/...#/..#./.#../#.../#..#',
  '#': '.#.#./#####/.#.#./.#.#./#####/.#.#.',
  '_': '..../..../..../..../..../..../####',
  '—': '...../...../...../#####',
  '←': '...../..#../.#.../#####/.#.../..#../.....',
  '→': '...../..#../...#./#####/...#./..#../.....',
  '↑': '..#../.###./#.#.#/..#../..#../..#../.....',
  '↓': '...../..#../..#../..#../#.#.#/.###./..#..',
  '♥': '...../.#.#./#####/#####/.###./..#../.....',
  '·': './././#',
};
const FONT_H = 9, LINE_H = 10;

const Font = { glyphs: {}, atlases: {}, order: [] };
(function buildFont() {
  let x = 0;
  for (const ch in FONT_SRC) {
    const rows = FONT_SRC[ch].split('/');
    const w = Math.max(...rows.map(r => r.length));
    Font.glyphs[ch] = { rows, w, ax: x };
    x += w + 1;
  }
  Font.atlasW = x;
})();

function fontAtlas(color) {
  let a = Font.atlases[color];
  if (a) return a;
  const [c, x] = makeCanvas(Font.atlasW, FONT_H);
  x.fillStyle = color;
  for (const ch in Font.glyphs) {
    const g = Font.glyphs[ch];
    for (let j = 0; j < g.rows.length; j++) {
      const r = g.rows[j];
      for (let i = 0; i < r.length; i++) if (r[i] === '#') x.fillRect(g.ax + i, j, 1, 1);
    }
  }
  Font.atlases[color] = c;
  return c;
}

function glyphFor(ch) {
  if (ch === ' ') return null;
  return Font.glyphs[ch] || Font.glyphs['?'];
}

function textWidth(s) {
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === ' ') { w += 3; continue; }
    const g = glyphFor(ch);
    w += g.w + 1;
  }
  return w > 0 ? w - 1 : 0;
}

// draw text; opts: {shadow:color, align:'left'|'center'|'right'}
function drawText(c, s, x, y, color, opts) {
  s = String(s);
  color = color || '#fff';
  opts = opts || {};
  if (opts.align === 'center') x = Math.round(x - textWidth(s) / 2);
  else if (opts.align === 'right') x = Math.round(x - textWidth(s));
  x = Math.round(x); y = Math.round(y);
  if (opts.shadow) drawText(c, s, x + 1, y + 1, opts.shadow);
  if (opts.outline) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawText(c, s, x + dx, y + dy, opts.outline);
  }
  const atlas = fontAtlas(color);
  let cx = x;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === ' ') { cx += 3; continue; }
    const g = glyphFor(ch);
    c.drawImage(atlas, g.ax, 0, g.w, FONT_H, cx, y, g.w, FONT_H);
    cx += g.w + 1;
  }
  return cx - x;
}

function wrapText(s, maxW) {
  const out = [];
  for (const para of String(s).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (textWidth(t) > maxW && line) { out.push(line); line = w; }
      else line = t;
    }
    out.push(line);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Small helpers for pixel drawing
// ---------------------------------------------------------------------------
function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function px(c, x, y, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); }

// Pixel-ish filled ellipse
function ellipse(c, cx, cy, rx, ry, col) {
  c.fillStyle = col;
  for (let j = -ry; j <= ry; j++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.0001))));
    c.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1);
  }
}

// Line with 1px rects (Bresenham)
function line(c, x0, y0, x1, y1, col) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  c.fillStyle = col;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  while (n++ < 2000) {
    c.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function wait(sec) {
  return new Promise(res => Game.timers.push({ t: sec, res }));
}
