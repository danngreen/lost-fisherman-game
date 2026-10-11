'use strict';
// ---------------------------------------------------------------------------
// UI: dialog, menus, toasts, HUD, inventory/journal/pause screens
// ---------------------------------------------------------------------------
const UIC = {
  bg: '#121828', bg2: '#1c2438', edge: '#e8dcc0', edge2: '#6a6050', text: '#f4ecd8', dim: '#9aa4b8',
  hi: '#ffd25a', name: '#ffd25a', bad: '#e87a6a', good: '#8ad08a',
};

function panel(c, x, y, w, h, alpha) {
  c.globalAlpha = alpha === undefined ? 0.94 : alpha;
  rect(c, x, y, w, h, UIC.bg);
  c.globalAlpha = 1;
  rect(c, x, y, w, 1, UIC.edge); rect(c, x, y + h - 1, w, 1, UIC.edge);
  rect(c, x, y, 1, h, UIC.edge); rect(c, x + w - 1, y, 1, h, UIC.edge);
  rect(c, x + 2, y + 2, w - 4, 1, UIC.edge2); rect(c, x + 2, y + h - 3, w - 4, 1, UIC.edge2);
  rect(c, x + 2, y + 2, 1, h - 4, UIC.edge2); rect(c, x + w - 3, y + 2, 1, h - 4, UIC.edge2);
  // corner studs
  for (const [cx, cy] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]) px(c, cx, cy, UIC.bg);
}

const SPEAKERS = {
  you: { name: 'You', p: 'player' },
  ansel: { name: 'Grandpa Ansel', p: 'ansel' },
  anselR: { name: 'Grandpa Ansel', p: 'anselRagged' },
  greta: { name: 'Greta, Harbormaster', p: 'greta' },
  bo: { name: 'Bo, Shipwright', p: 'bo' },
  tam: { name: 'Tam, Fishmonger', p: 'tam' },
  rosa: { name: 'Rosa, Baker', p: 'rosa' },
  hollis: { name: 'Hollis, Shopkeeper', p: 'hollis' },
  finn: { name: 'Old Finn', p: 'finn' },
  nell: { name: 'Nell', p: 'nell' },
  mira: { name: 'Mira', p: 'mira' },
  biscuit: { name: 'Biscuit the Parrot', p: null },
  bram: { name: 'Bram, Lighthouse Keeper', p: 'bram' },
};

// ---------------- dialog ----------------
const Dlg = {
  active: null,
  say(speaker, text, opts) {
    opts = opts || {};
    const sp = speaker ? (SPEAKERS[speaker] || { name: speaker }) : null;
    const textW = sp && sp.p ? 404 : 448;
    const pages = [];
    for (const chunk of String(text).split('|')) {
      const lines = wrapText(chunk.trim(), textW);
      for (let i = 0; i < lines.length; i += 4) pages.push(lines.slice(i, i + 4));
    }
    return new Promise(res => {
      this.active = { sp, pages, page: 0, shown: 0, res, choices: opts.choices || null, sel: 0, cancel: opts.cancel, textW, t: 0 };
      Input.consume('act');
    });
  },
  ask(speaker, text, choices, opts) {
    opts = opts || {};
    return this.say(speaker, text, { choices, cancel: opts.cancel !== false });
  },
  // narration helper
  narrate(text) { return this.say(null, text); },
  update(dt) {
    const a = this.active;
    if (!a) return;
    a.t += dt;
    const pg = a.pages[a.page];
    const total = pg.join(' ').length;
    if (a.shown < total) {
      const before = Math.floor(a.shown);
      a.shown += dt * 70;
      if (Math.floor(a.shown) !== before && before % 3 === 0) Sound.sfx('type');
      if (Input.pressed('act') || Input.pressed('back')) { a.shown = total; Input.consume('act'); Input.consume('back'); }
      return;
    }
    const last = a.page === a.pages.length - 1;
    if (last && a.choices) {
      if (Input.pressed('up')) { a.sel = (a.sel + a.choices.length - 1) % a.choices.length; Sound.sfx('blip'); }
      if (Input.pressed('down')) { a.sel = (a.sel + 1) % a.choices.length; Sound.sfx('blip'); }
      if (Input.pressed('act')) { Sound.sfx('select'); this.finish(a.sel); }
      else if (Input.pressed('back') && a.cancel) { Sound.sfx('back'); this.finish(-1); }
      return;
    }
    if (Input.pressed('act') || Input.pressed('back')) {
      if (last) this.finish(0);
      else { a.page++; a.shown = 0; Sound.sfx('blip'); }
    }
  },
  finish(v) {
    const a = this.active;
    this.active = null;
    Input.consume('act'); Input.consume('back');
    a.res(v);
  },
  draw(c) {
    const a = this.active;
    if (!a) return;
    const x = 8, y = 200, w = 464, h = 62;
    panel(c, x, y, w, h);
    let tx = x + 10;
    if (a.sp && a.sp.p && PEOPLE[a.sp.p]) {
      rect(c, x + 6, y + 6, 32, 50, UIC.bg2);
      rect(c, x + 6, y + 6, 32, 1, UIC.edge2);
      const p = PEOPLE[a.sp.p];
      c.save(); c.beginPath(); c.rect(x + 6, y + 6, 32, 50); c.clip();
      c.drawImage(p.idle, 0, 0, 12, 22, x + 10, y + 7, 24, 44);
      c.restore();
      tx = x + 46;
    }
    if (a.sp) {
      const nw = textWidth(a.sp.name) + 12;
      panel(c, x + 6, y - 11, nw, 13, 1);
      drawText(c, a.sp.name, x + 12, y - 8, UIC.name);
    }
    const pg = a.pages[a.page];
    let left = Math.floor(a.shown);
    const col = a.sp ? UIC.text : '#d8e2f0';
    pg.forEach((ln, i) => {
      if (left <= 0) return;
      const s = ln.substr(0, left);
      left -= ln.length + 1;
      drawText(c, s, tx, y + 9 + i * 11, col, { shadow: '#000' });
    });
    const total = pg.join(' ').length;
    const last = a.page === a.pages.length - 1;
    if (a.shown >= total && !(last && a.choices)) {
      if (Math.floor(a.t * 3) % 2) drawText(c, '↓', x + w - 14, y + h - 13, UIC.hi);
    }
    if (last && a.choices && a.shown >= total) {
      const cw = Math.max(...a.choices.map(s => textWidth(s))) + 26;
      const ch = a.choices.length * 12 + 8;
      const cx = x + w - cw, cy = y - ch - 4;
      panel(c, cx, cy, cw, ch);
      a.choices.forEach((s, i) => {
        const sel = i === a.sel;
        if (sel) { rect(c, cx + 4, cy + 4 + i * 12, cw - 8, 11, '#2c3654'); drawText(c, '→', cx + 7, cy + 5 + i * 12, UIC.hi); }
        drawText(c, s, cx + 17, cy + 5 + i * 12, sel ? UIC.hi : UIC.text);
      });
    }
  },
};

// ---------------- generic list menu ----------------
const Menu = {
  active: null,
  // items: [{label, right, disabled, desc, icon}]
  list(o) {
    return new Promise(res => {
      this.active = Object.assign({ sel: 0, scroll: 0, res, w: 260, rows: 9 }, o);
      if (o.sel) this.active.sel = o.sel;
      Input.consume('act');
    });
  },
  update() {
    const m = this.active;
    if (!m) return;
    const n = m.items.length;
    if (Input.pressed('up')) { m.sel = (m.sel + n - 1) % n; Sound.sfx('blip'); }
    if (Input.pressed('down')) { m.sel = (m.sel + 1) % n; Sound.sfx('blip'); }
    if (m.sel < m.scroll) m.scroll = m.sel;
    if (m.sel >= m.scroll + m.rows) m.scroll = m.sel - m.rows + 1;
    const cur = m.items[m.sel];
    if (cur && cur.adjust) {
      if (Input.pressed('left')) { cur.adjust(-1); return; }
      if (Input.pressed('right')) { cur.adjust(1); return; }
      if (Input.pressed('act')) { cur.adjust(0); return; }
    }
    if (Input.pressed('act')) {
      const it = m.items[m.sel];
      if (it && it.disabled) { Sound.sfx('back'); if (it.whyNot) Toast.show(it.whyNot); return; }
      Sound.sfx('select');
      this.active = null; Input.consume('act'); m.res(m.sel);
    } else if (Input.pressed('back')) {
      Sound.sfx('back');
      this.active = null; Input.consume('back'); m.res(-1);
    }
  },
  draw(c) {
    const m = this.active;
    if (!m) return;
    const rows = Math.min(m.rows, m.items.length);
    const w = m.w, hh = 26 + rows * 13 + (m.footer !== false ? 26 : 4);
    const x = Math.round((W - w) / 2), y = Math.round(Math.max(8, (H - hh) / 2 - 10));
    panel(c, x, y, w, hh);
    drawText(c, m.title || '', x + w / 2, y + 7, UIC.hi, { align: 'center' });
    if (m.subtitle) drawText(c, m.subtitle, x + w - 10, y + 7, UIC.dim, { align: 'right' });
    rect(c, x + 8, y + 18, w - 16, 1, UIC.edge2);
    for (let i = 0; i < rows; i++) {
      const idx = m.scroll + i;
      const it = m.items[idx];
      if (!it) break;
      const ry = y + 23 + i * 13;
      const sel = idx === m.sel;
      if (sel) rect(c, x + 6, ry - 1, w - 12, 12, '#2c3654');
      let lx = x + 10;
      if (sel) drawText(c, '→', lx, ry + 1, UIC.hi);
      lx += 9;
      if (it.icon) { drawItemIcon(c, it.icon, lx, ry + 1); lx += 11; }
      const col = it.disabled ? '#6a7080' : sel ? UIC.hi : UIC.text;
      drawText(c, typeof it.label === 'function' ? it.label() : it.label, lx, ry + 1, col);
      if (it.level !== undefined) {
        const v = it.level(), bx = x + w - 12 - VOL_STEPS * 6;
        if (sel) { drawText(c, '\u2190', bx - 10, ry + 1, UIC.hi); drawText(c, '\u2192', bx + VOL_STEPS * 6 + 1, ry + 1, UIC.hi); }
        for (let k = 0; k < VOL_STEPS; k++) rect(c, bx + k * 6, ry + 2 + (k < v ? 0 : 3), 5, k < v ? 7 : 2, k < v ? (sel ? UIC.hi : UIC.text) : '#4a5268');
      } else if (it.right !== undefined) drawText(c, String(it.right), x + w - 12, ry + 1, it.disabled ? '#6a7080' : UIC.dim, { align: 'right' });
    }
    if (m.scroll > 0) drawText(c, '↑', x + w - 12, y + 8, UIC.dim);
    if (m.scroll + rows < m.items.length) drawText(c, '↓', x + w - 12, y + hh - 34, UIC.dim);
    if (m.footer !== false) {
      const it = m.items[m.sel];
      rect(c, x + 8, y + hh - 26, w - 16, 1, UIC.edge2);
      const desc = (it && it.desc) || m.hint || '';
      wrapText(desc, w - 20).slice(0, 2).forEach((l, i) => drawText(c, l, x + 10, y + hh - 22 + i * 10, UIC.dim));
    }
  },
};

// ---------------- toasts ----------------
const Toast = {
  list: [],
  show(text, icon) {
    this.list.push({ text, icon, t: 0 });
    if (this.list.length > 5) this.list.shift();
  },
  update(dt) {
    for (const t of this.list) t.t += dt;
    this.list = this.list.filter(t => t.t < 3);
  },
  draw(c) {
    let y = 22;
    for (const t of this.list) {
      const a = t.t < 0.2 ? t.t / 0.2 : t.t > 2.5 ? (3 - t.t) / 0.5 : 1;
      const w = textWidth(t.text) + (t.icon ? 22 : 12);
      const x = W - w - 6;
      c.globalAlpha = a;
      panel(c, x, y, w, 15, 0.9);
      if (t.icon) drawItemIcon(c, t.icon, x + 5, y + 4);
      drawText(c, t.text, x + (t.icon ? 16 : 6), y + 4, UIC.text);
      c.globalAlpha = 1;
      y += 17;
    }
  },
};

// ---------------- banner (location names / goals) ----------------
const Banner = {
  cur: null,
  show(title, sub, dur) { this.cur = { title, sub, t: 0, dur: dur || 3.2 }; },
  update(dt) { if (this.cur) { this.cur.t += dt; if (this.cur.t > this.cur.dur) this.cur = null; } },
  draw(c) {
    const b = this.cur;
    if (!b) return;
    const a = b.t < 0.4 ? b.t / 0.4 : b.t > b.dur - 0.6 ? (b.dur - b.t) / 0.6 : 1;
    c.globalAlpha = Math.max(0, a);
    drawText(c, b.title, W / 2, 40, '#fff6dc', { align: 'center', outline: '#1a1410' });
    if (b.sub) drawText(c, b.sub, W / 2, 52, '#d8dce8', { align: 'center', outline: '#1a1410' });
    c.globalAlpha = 1;
  },
};

const GoalNote = {
  last: null, cur: null,
  check() {
    if (!S || Game.hudHidden) return;
    const o = objectives()[0];
    if (o !== this.last) {
      if (this.last !== null) { this.cur = { text: o, t: 0 }; }
      this.last = o;
    }
  },
  update(dt) { if (this.cur) { this.cur.t += dt; if (this.cur.t > 6) this.cur = null; } },
  draw(c) {
    const g = this.cur;
    if (!g) return;
    const a = g.t < 0.3 ? g.t / 0.3 : g.t > 5.4 ? (6 - g.t) / 0.6 : 1;
    const lines = wrapText(g.text, 300);
    const w = 320, h = 16 + lines.length * 10;
    const x = (W - w) / 2, y = 22;
    c.globalAlpha = Math.max(0, a);
    panel(c, x, y, w, h, 0.9);
    drawText(c, 'NEW GOAL', x + 8, y + 4, UIC.hi);
    lines.forEach((l, i) => drawText(c, l, x + 10, y + 14 + i * 10, UIC.text));
    c.globalAlpha = 1;
  },
};

// ---------------- HUD ----------------
function drawHUD(c) {
  if (!S) return;
  c.globalAlpha = 0.85;
  const hint = '[I] Bag  [J] Journal  [Esc] Menu';
  rect(c, 4, 4, 74 + textWidth(hint) + 6 - 4, 14, '#0e1220');
  c.globalAlpha = 1;
  c.drawImage(ICONS.coin, 7, 7);
  drawText(c, String(S.coins), 18, 7, '#ffe08a');
  c.drawImage(ICONS.food, 46, 7);
  drawText(c, String(Inv.food()), 57, 7, '#f0d0a0');
  const tstr = 'Day ' + S.day + '  ' + Clock.str();
  const tw = textWidth(tstr);
  c.globalAlpha = 0.85;
  rect(c, W - tw - 14, 4, tw + 10, 14, '#0e1220');
  c.globalAlpha = 1;
  drawText(c, tstr, W - 9, 7, '#dfe6f2', { align: 'right' });
  drawText(c, hint, 74, 7, '#7a8498');
}

// ---------------- full screens: inventory, journal, pause ----------------
async function openInventory() {
  const keys = Object.keys(S.inv).filter(k => S.inv[k] > 0);
  const order = { key: 0, food: 1, trade: 2, fish: 3, junk: 4 };
  keys.sort((a, b) => (order[(ITEMS[a] || {}).type] || 5) - (order[(ITEMS[b] || {}).type] || 5));
  if (!keys.length) { await Dlg.narrate('Your bag is empty.'); return; }
  const items = keys.map(k => {
    const it = ITEMS[k] || { name: k };
    let desc = it.desc || '';
    if (it.type === 'fish') desc = 'A fresh ' + it.name.toLowerCase() + '. Sell to Tam, or cook it on a stove or fire for voyage food.';
    if (it.price && it.type !== 'fish') desc += ' (worth ' + it.price + ')';
    return { label: it.name, right: 'x' + S.inv[k], icon: k, desc };
  });
  await Menu.list({ title: 'Your Bag', subtitle: S.coins + ' coins', items, w: 300, hint: '' });
}

const LETTERS = [
  { t: 'Day 3', body: "Day 3. The fog is as thick as wool. The Margaret is lost on the rocks. I've found a cave with fresh water. I'm cold but in one piece. Something big circles the island at night. It glows." },
  { t: 'Day 9', body: "Day 9. There was a fish on the sand this morning. A whole cod, laid out neat as a gift. I did not catch it. I lay awake listening and heard breathing out in the dark water. Big, slow breathing." },
  { t: 'Day 15', body: 'Day 15. She sings when the moon is up. I hum back to her. I think she likes the old sea shanties best. Margaret would have laughed at me. Margaret would have hummed along.' },
  { t: 'Day 22', body: "Day 22. Kettle Point is dark. Bram must have run out of oil. Without that light nobody will ever find the way in here. Little gull, if you ever read this, don't do anything foolish. (You will, though. You're my grandchild.)" },
  { t: 'The last one', body: "To whoever finds this: my name is Ansel Hale of Saltmere. I am on an island inside the fog, west of the Teeth. I'm alright, mostly. My boat is gone. She is hurt and I won't leave her. If the light at Kettle Point ever shines again, I'll know someone is coming." },
];

// collectible writings shown in the journal, per chapter
const JOURNAL_COLLECTIONS = {};
function journalCollection() {
  return JOURNAL_COLLECTIONS[S.ch || 1] || { title: 'Messages in bottles', hint: 'Bottles drift on the currents. Keep an eye out while sailing.', icon: 'bottle', list: LETTERS };
}

async function openJournal() {
  while (true) {
    const obj = objectives();
    const items = [];
    obj.forEach(o => items.push({ label: (o.length > 46 ? o.substr(0, 44) + '...' : o), desc: o, goal: true }));
    const col = journalCollection();
    if (!col.when || col.when()) {
      items.push({ label: '- ' + col.title + ': ' + S.bottles.length + ' / ' + col.list.length + ' -', disabled: false, desc: col.hint, sep: true });
      // some collections list every entry, with a hint for the ones still to find
      if (col.showAll) col.list.forEach((e, i) => items.push(S.bottles.includes(i) ? { label: e.t, icon: col.icon, desc: 'Read this.', letter: i } : { label: '? ' + e.todo, desc: e.hint, goal: true }));
      else S.bottles.slice().sort().forEach(i => items.push({ label: col.list[i].t, icon: col.icon, desc: 'Read this.', letter: i }));
    }
    const i = await Menu.list({ title: 'Journal', subtitle: 'Day ' + S.day, items, w: 330, rows: 10 });
    if (i < 0) return;
    const it = items[i];
    if (it.letter !== undefined) await Dlg.say(null, col.list[it.letter].body);
    else if (it.goal) await Dlg.say(null, it.desc);
  }
}

async function openPause() {
  while (true) {
    const items = [
      { label: 'Resume' },
      { label: 'Bag' },
      { label: 'Journal' },
      { label: 'Sound settings', desc: 'Music and sound effect volume. Press M at any time to mute.' },
      { label: 'Toggle Fullscreen', desc: 'Or press F.' },
      { label: 'Controls', desc: 'Show the controls.' },
      { label: 'Save & return to title' },
    ];
    const i = await Menu.list({ title: 'Paused', items, w: 200, footer: true });
    if (i <= 0) return;
    if (i === 1) await openInventory();
    if (i === 2) await openJournal();
    if (i === 3) await openSettings();
    if (i === 4) toggleFullscreen();
    if (i === 5) await showControls();
    if (i === 6) { Save.write(); Game.goto('title'); return; }
  }
}

async function openSettings() {
  const store = () => Save.saveSettings();
  const items = [
    {
      label: 'Music', level: () => Sound.musicVol, desc: 'Left / Right to change the music volume.',
      adjust: d => { Sound.setVolumes(d === 0 ? (Sound.musicVol + 1) % (VOL_STEPS + 1) : Sound.musicVol + d, undefined); store(); },
    },
    {
      label: 'Sound effects', level: () => Sound.sfxVol, desc: 'Left / Right to change the volume of the sea, wind and effects.',
      adjust: d => { Sound.setVolumes(undefined, d === 0 ? (Sound.sfxVol + 1) % (VOL_STEPS + 1) : Sound.sfxVol + d); Sound.sfx('coin'); store(); },
    },
    {
      label: () => 'Mute everything: ' + (Sound.enabled ? 'Off' : 'On'), desc: 'Press M at any time to mute or unmute.',
      adjust: () => { Sound.setEnabled(!Sound.enabled); store(); },
    },
    { label: 'Done' },
  ];
  await Menu.list({ title: 'Sound', items, w: 240, footer: true });
}

async function showControls() {
  await Dlg.say(null, 'Walk: Left / Right arrows (or A / D).\nTalk, use, confirm: E, Space or Enter.\nBack / cancel: Esc or X.  Bag: I.  Journal: J.  Sound: M.  Fullscreen: F.|At sea: Right to sail faster, Left to slow down, Up / Down to steer between lanes. Stop near diving birds to fish.|Fishing: wait for the "!" and press E. Then hold E to lift the green bar and keep the fish inside it until the line is reeled in.');
}

function toggleFullscreen() {
  try {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.fullscreen) { window.webkit.messageHandlers.fullscreen.postMessage(1); return; }
  } catch (e) { }
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  } catch (e) { }
}
