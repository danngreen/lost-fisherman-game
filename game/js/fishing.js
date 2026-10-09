'use strict';
// ---------------------------------------------------------------------------
// Fishing minigame: cast -> wait -> bite -> reel (keep fish inside the bar)
// ---------------------------------------------------------------------------
const FISH_TABLES = {
  pier: [['sardine', 40], ['herring', 40], ['mackerel', 16], ['boot', 6]],
  gull: [['herring', 30], ['mackerel', 38], ['cod', 30], ['boot', 4]],
  pearl: [['mackerel', 30], ['snapper', 45], ['cod', 20], ['boot', 3]],
  coconut: [['parrotfish', 45], ['snapper', 35], ['mackerel', 20]],
  sea: [['herring', 34], ['mackerel', 40], ['cod', 25]],
  deep: [['cod', 40], ['snapper', 30], ['mackerel', 30]],
  lighthouse: [['cod', 45], ['mackerel', 35], ['herring', 20]],
  hollow: [['cod', 50], ['moonfish', 30], ['snapper', 20]],
};

function pickFish(spot) {
  const tbl = (FISH_TABLES[spot] || FISH_TABLES.sea).slice();
  if (nightFactor(S.time) > 0.6) tbl.push(['moonfish', spot === 'pier' ? 4 : 9]);
  const total = tbl.reduce((a, e) => a + e[1], 0);
  let r = Math.random() * total;
  for (const [id, w] of tbl) { r -= w; if (r <= 0) return id; }
  return tbl[0][0];
}

const Fishing = {
  active: null,
  // a: {rodX, rodY, waterY, dir, spot}
  start(a) {
    return new Promise(res => {
      const lure = Inv.has('lure');
      this.active = Object.assign({
        phase: 'cast', t: 0, res, lure, msg: '', msgT: 0,
        castDist: 46 + Math.random() * 22,
      }, a);
      Sound.sfx('whoosh');
      Input.consume('act');
    });
  },
  done(v) {
    const a = this.active;
    this.active = null;
    Input.consume('act'); Input.consume('back');
    a.res(v);
  },
  bobPos() {
    const a = this.active;
    const bx = a.rodX + a.dir * a.castDist;
    return { x: bx, y: a.waterY };
  },
  update(dt) {
    const a = this.active;
    if (!a) return;
    a.t += dt;
    if (a.msgT > 0) a.msgT -= dt;
    if (Input.pressed('back') && a.phase !== 'result') { Sound.sfx('back'); this.done(null); return; }
    switch (a.phase) {
      case 'cast':
        if (a.t > 0.55) { a.phase = 'wait'; a.t = 0; a.waitFor = (1.4 + Math.random() * 3.2) * (a.lure ? 0.8 : 1); Sound.sfx('plop'); a.nibbles = [Math.random() * a.waitFor * 0.8]; }
        break;
      case 'wait':
        if (Input.pressed('act')) { a.msg = 'Too early... wait for the bite!'; a.msgT = 1.4; a.t = 0; a.waitFor = 1 + Math.random() * 2.5; Sound.sfx('back'); }
        if (a.t > a.waitFor) { a.phase = 'bite'; a.t = 0; a.fish = pickFish(a.spot); Sound.sfx('bite'); }
        break;
      case 'bite':
        if (Input.pressed('act')) {
          a.phase = 'reel'; a.t = 0;
          const f = FISH[a.fish];
          a.diff = f.diff;
          a.f = 0.3; a.fv = 0; a.target = 0.5; a.retarget = 0;
          a.size = clamp(0.32 - a.diff * 0.1 + (a.lure ? 0.07 : 0), 0.18, 0.45);
          a.b = 0.15; a.bv = 0;
          a.p = 0.3;
          Input.consume('act');
        } else if (a.t > (a.lure ? 1.25 : 1.0)) {
          a.phase = 'wait'; a.t = 0; a.waitFor = 1.2 + Math.random() * 2.5;
          a.msg = 'It got away! Press E as soon as you see "!"'; a.msgT = 1.8; Sound.sfx('lose');
        }
        break;
      case 'reel': {
        a.retarget -= dt;
        if (a.retarget <= 0) {
          const jump = 0.25 + a.diff * 0.6;
          a.target = clamp(a.f + (Math.random() - 0.5) * 2 * jump, 0.03, 0.97);
          a.retarget = lerp(1.1, 0.35, a.diff) * (0.6 + Math.random() * 0.8);
        }
        const k = 6 + a.diff * 10;
        a.fv += (a.target - a.f) * k * dt - a.fv * 3.5 * dt;
        a.f = clamp(a.f + a.fv * dt, 0, 1);
        if (Input.held('act')) a.bv += 2.8 * dt; else a.bv -= 2.4 * dt;
        a.bv = clamp(a.bv, -1.4, 1.4);
        a.b += a.bv * dt;
        if (a.b < 0) { a.b = 0; a.bv = Math.max(0, a.bv) * 0; }
        if (a.b > 1 - a.size) { a.b = 1 - a.size; a.bv = Math.min(0, a.bv) * 0.3; }
        const inZone = a.f >= a.b && a.f <= a.b + a.size;
        a.p += (inZone ? 0.34 : -(0.16 + a.diff * 0.1)) * dt;
        if (inZone && Math.random() < 0.3) Sound.sfx('reel');
        if (a.p >= 1) { a.phase = 'result'; a.t = 0; a.caught = true; Sound.sfx('catch'); }
        if (a.p <= 0) { a.phase = 'result'; a.t = 0; a.caught = false; Sound.sfx('lose'); }
        break;
      }
      case 'result':
        if (a.t > 0.5 && (Input.pressed('act') || Input.pressed('back') || a.t > 2.6)) this.done(a.caught ? a.fish : null);
        break;
    }
  },
  draw(c) {
    const a = this.active;
    if (!a) return;
    // line & bobber
    const tip = { x: a.rodX + a.dir * 8, y: a.rodY - 10 };
    rect(c, Math.min(a.rodX, tip.x), Math.min(a.rodY, tip.y), 1, 1, '#6a4a2a');
    line(c, a.rodX, a.rodY, tip.x, tip.y, '#7a5a34');
    let bx, by;
    if (a.phase === 'cast') {
      const u = clamp(a.t / 0.55, 0, 1);
      const bp = this.bobPos();
      bx = lerp(tip.x, bp.x, u); by = lerp(tip.y, bp.y, u) - Math.sin(u * Math.PI) * 26;
    } else if (a.phase === 'result' && a.caught) {
      bx = tip.x; by = tip.y + 6;
    } else {
      const bp = this.bobPos();
      bx = bp.x; by = bp.y + Math.sin(a.t * 3) * 0.8;
      if (a.phase === 'wait' && a.nibbles && a.nibbles.some(n => Math.abs(a.t - n) < 0.15)) by += 1;
      if (a.phase === 'bite') by += 2 + Math.sin(a.t * 30);
      if (a.phase === 'reel') { bx += Math.sin(a.t * 9) * 2; by += 1; }
    }
    c.globalAlpha = 0.8;
    // sagging line
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const lx = lerp(tip.x, bx, u), ly = lerp(tip.y, by, u) + Math.sin(u * Math.PI) * (a.phase === 'reel' ? 1 : 5);
      px(c, lx, ly, '#e8e8e0');
    }
    c.globalAlpha = 1;
    if (a.phase === 'result' && a.caught) {
      const fs = fishSprite(a.fish);
      c.drawImage(fs, Math.round(bx - fs.width / 2), Math.round(by));
    } else {
      rect(c, bx - 1, by - 3, 3, 2, '#e83a2a');
      rect(c, bx - 1, by - 1, 3, 2, '#f4f4f4');
      if (a.phase === 'bite' || a.phase === 'reel') {
        c.globalAlpha = 0.6;
        rect(c, bx - 4, by + 1, 9, 1, '#d8f0ff');
        c.globalAlpha = 1;
      }
    }
    if (a.phase === 'bite') {
      const flash = Math.floor(a.t * 10) % 2;
      drawText(c, '!', a.rodX - 1, a.rodY - 34, flash ? '#ffe040' : '#ff8030', { outline: '#000' });
    }
    if (a.msgT > 0) drawText(c, a.msg, W / 2, 70, '#fff', { align: 'center', outline: '#000' });
    if (a.phase === 'wait' || a.phase === 'cast') drawText(c, 'Waiting for a bite...   [Esc] stop', W / 2, H - 14, '#dfe6f2', { align: 'center', outline: '#000' });

    if (a.phase === 'reel') {
      const x = a.rodX > W / 2 ? 40 : W - 64, y = 40, h = 150, w = 18;
      panel(c, x - 10, y - 12, w + 40, h + 36);
      drawText(c, 'REEL!', x + 9, y - 7, UIC.hi, { align: 'center' });
      rect(c, x, y, w, h, '#0c2a46');
      for (let j = 0; j < h; j += 6) rect(c, x + 2, y + j, w - 4, 1, '#123a5e');
      // catch bar
      const by0 = y + h - (a.b + a.size) * h, bh = a.size * h;
      const inZone = a.f >= a.b && a.f <= a.b + a.size;
      rect(c, x + 1, by0, w - 2, bh, inZone ? '#6ad06a' : '#4a9a4a');
      rect(c, x + 1, by0, w - 2, 1, '#b0f0b0'); rect(c, x + 1, by0 + bh - 1, w - 2, 1, '#2a6a2a');
      // fish marker
      const fy = y + h - a.f * h;
      const fs = fishSprite(a.fish);
      c.drawImage(fs, Math.round(x + w / 2 - fs.width / 2), Math.round(fy - fs.height / 2));
      // progress
      const pxx = x + w + 6;
      rect(c, pxx, y, 6, h, '#2a2a34');
      const ph = clamp(a.p, 0, 1) * h;
      rect(c, pxx, y + h - ph, 6, ph, a.p > 0.66 ? '#8ad08a' : a.p > 0.33 ? '#e8c84a' : '#e87a5a');
      drawText(c, 'Hold E', x + 9, y + h + 6, UIC.dim, { align: 'center' });
    }
    if (a.phase === 'result') {
      const msg = a.caught ? 'You caught: ' + FISH[a.fish].name + '!' : 'The line went slack. It got away...';
      const w = textWidth(msg) + 24;
      panel(c, (W - w) / 2, 60, w, 20);
      drawText(c, msg, W / 2, 66, a.caught ? UIC.hi : UIC.text, { align: 'center' });
    }
  },
};

async function goFishing(anchor) {
  if (!Inv.has('rod')) { await Dlg.narrate("You'll need a fishing rod. Grandpa kept his on the cottage wall."); return; }
  const id = await Fishing.start(anchor);
  Clock.advance(0.25);
  if (id) {
    S.stats.fish++;
    S.stats.caught[id] = (S.stats.caught[id] || 0) + 1;
    Inv.add(id);
    if (id === 'moonfish' && !flag('moonfishSeen')) {
      setFlag('moonfishSeen');
      await Dlg.narrate('It glows in your hands, pale blue, like a little piece of moonlight. Old Finn would have a story about this one.');
    }
  }
  return id;
}
