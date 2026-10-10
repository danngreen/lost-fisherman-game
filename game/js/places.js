'use strict';
// ---------------------------------------------------------------------------
// Places: layouts, art, characters, dialogue and quests
// ---------------------------------------------------------------------------

function makeGround(pts) {
  return x => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (x <= b[0]) { const u = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * (1 - Math.cos(u * Math.PI)) / 2; }
    }
    return pts[pts.length - 1][1];
  };
}
const roughen = (g, amt) => x => g(x) + Math.round((hash1(Math.floor(x / 3)) - 0.5) * amt);

// semi-transparent near water in front of shores
function frontWater(c, wy, t, pal, x0, x1, cam) {
  x0 = Math.max(0, x0 === undefined ? 0 : x0); x1 = Math.min(W, x1 === undefined ? W : x1);
  if (x1 <= x0) return;
  const P = SEA_PALS[pal] || SEA_PALS.north;
  c.globalAlpha = 0.5;
  c.fillStyle = P.near;
  c.fillRect(x0, wy + 2, x1 - x0, H - wy);
  c.globalAlpha = 0.25;
  c.fillRect(x0, wy + 8, x1 - x0, H - wy);
  c.globalAlpha = 1;
  for (let y = wy + 4; y < H; y += 3) {
    for (let k = 0; k < 10; k++) {
      const xx = Math.round(x0 + ((hash2(k, y) * (x1 - x0) + t * 6 + (cam || 0)) % (x1 - x0)));
      if (hash2(k + Math.floor(t * 1.5), y) > 0.5) { c.globalAlpha = 0.35; rect(c, xx, y, 2 + (y - wy) / 10, 1, P.hi); }
    }
  }
  c.globalAlpha = 1;
  waterFront(c, x0, x1, wy, t, pal, 0.6);
}

async function sleepHere(text) {
  const r = await Dlg.ask(null, text + ' Sleep until morning?', ['Sleep', 'Not yet']);
  if (r !== 0) return;
  await Game.fadeTo(1, 0.7);
  Clock.sleepUntilMorning();
  Save.write();
  await wait(0.8);
  await Game.fadeTo(0, 0.7);
  Toast.show('Day ' + S.day + ', morning');
}

// Pick which fish to cook, one at a time, so a precious Moonfish never goes in the pan by accident.
async function cookFish() {
  if (!Inv.fishList().length) { await Dlg.narrate('You have no raw fish to cook. Cooked fish makes good food for voyages.'); return; }
  let sel = 0, cooked = 0;
  while (true) {
    const fish = Inv.fishList().sort((a, b) => ITEMS[a].price - ITEMS[b].price);
    if (!fish.length) break;
    const items = fish.map(k => ({
      label: ITEMS[k].name + '  x' + S.inv[k], right: ITEMS[k].price + 'c', icon: k, id: k,
      desc: 'Cook one ' + ITEMS[k].name + ' into food for one leg of a voyage. (Tam would pay ' + ITEMS[k].price + ' coins for it raw.)',
    }));
    items.push({ label: 'Done', id: 'done' });
    const i = await Menu.list({ title: 'Cook Fish', subtitle: 'Cooked: ' + Inv.count('cooked'), items, w: 280, sel: Math.min(sel, items.length - 1) });
    if (i < 0 || items[i].id === 'done') break;
    sel = i;
    Inv.remove(items[i].id);
    S.inv.cooked = (S.inv.cooked || 0) + 1;
    cooked++;
    Sound.sfx('pickup');
    Clock.advance(0.1);
  }
  if (cooked) Toast.show('+' + cooked + ' Cooked Fish', 'cooked');
}

function fishAnchor(sc, x, waterY, dir) {
  return { rodX: x - sc.cam + dir * 4, rodY: sc.ground(x) - 12, waterY, dir, spot: sc.def.fishSpot };
}
async function fishHere(sc, x, waterY, dir) {
  sc.player.x = x; sc.player.facing = dir;
  await goFishing(fishAnchor(sc, x, waterY, dir));
}

function boatObject(x, from) {
  return {
    x, r: 22, label: 'Board boat', when: () => !!S.boat,
    act: async () => { await setSail(from); },
  };
}

// ===========================================================================
// COTTAGE
// ===========================================================================
const COTTAGE = {
  id: 'cottage', name: "Grandpa's Cottage", width: 480, horizon: 162, indoor: true, spawn: 120, minX: 16, maxX: 466,
  music: 'village', ambience: { sea: 0.15, wind: 0.05, fire: 0.5 },
  ground: () => 228,
  build(c, sc) {
    // attic (cross-section under the roof)
    for (let y = 30; y < 118; y++) {
      const half = (y - 36) / (116 - 36) * 250;
      if (half <= 0) continue;
      const x0 = Math.max(0, Math.round(240 - half)), x1 = Math.min(480, Math.round(240 + half));
      for (let x = x0; x < x1; x++) {
        let col = (y % 6 === 5) ? '#24180e' : ((x + Math.floor(y / 6) * 17) % 40 < 2 ? '#24180e' : '#33231a');
        if ((x - 20) % 70 < 4) col = '#4a3220';
        px(c, x, y, col);
      }
      // roof shingles along the slope
      for (let k = 0; k < 9; k++) {
        const col = k > 6 ? '#5a2a1e' : (k % 3 === 2 ? '#6a2e22' : '#8a3e2c');
        px(c, Math.round(240 - half) - k, y, col); px(c, Math.round(240 + half) + k, y, col);
      }
    }
    // attic clutter
    line(c, 120, 112, 160, 92, '#8a6a3a'); line(c, 124, 112, 168, 94, '#7a5a30'); rect(c, 158, 90, 10, 3, '#8a6a3a');
    drawLobsterPot(c, 182, 116); drawLobsterPot(c, 196, 116);
    rect(c, 290, 100, 26, 16, '#5a3a22'); rect(c, 290, 100, 26, 2, '#7a5232'); rect(c, 301, 106, 4, 3, '#c8a040');
    drawNet(c, 350, 94, 18, 20);
    for (let i = 0; i < 6; i++) px(c, 214 + i * 3, 74 + (i % 2), '#8a8a8a');
    // ceiling beam
    rect(c, 0, 116, 480, 6, '#4a3020'); rect(c, 0, 116, 480, 1, '#6a4a30'); rect(c, 0, 121, 480, 1, '#2a1a10');
    // walls
    plankWall(c, 0, 122, 480, 106, '#7a5638', '#563a24', 3);
    for (let i = 0; i < 480; i += 60) rect(c, i, 122, 2, 104, '#4e3420');
    paintTerrain(c, 0, 480, () => 228, MAT.planks);
    rect(c, 0, 224, 480, 4, '#4a3020'); rect(c, 0, 224, 480, 1, '#6a4a30');
    // window with view
    c.clearRect(158, 146, 30, 26);
    rect(c, 155, 143, 36, 3, '#3a2616'); rect(c, 154, 172, 38, 3, '#c8b898');
    rect(c, 155, 143, 3, 31, '#3a2616'); rect(c, 188, 143, 3, 31, '#3a2616');
    rect(c, 172, 146, 2, 26, '#3a2616'); rect(c, 158, 158, 30, 2, '#3a2616');
    for (let j = 0; j < 34; j++) { const sw = 6 - (j > 22 ? (j - 22) / 3 : 0); rect(c, 150, 141 + j, sw, 1, j % 3 ? '#a8443a' : '#8a3430'); rect(c, 196 - sw, 141 + j, sw, 1, j % 3 ? '#a8443a' : '#8a3430'); }
    rect(c, 146, 140, 54, 2, '#2a1a10');
    // bed
    rect(c, 22, 196, 4, 32, '#4a2a16'); rect(c, 72, 204, 4, 24, '#4a2a16');
    rect(c, 26, 214, 46, 8, '#6a3e22'); rect(c, 26, 222, 46, 2, '#3e2414');
    for (let i = 0; i < 40; i += 5) for (let j = 0; j < 6; j += 3) rect(c, 32 + i, 208 + j, 5, 3, ['#3a6a9a', '#c8b060', '#a84a3a', '#5a8a5a'][(i / 5 + j / 3) % 4]);
    rect(c, 32, 207, 40, 1, '#2a4a6a');
    rect(c, 26, 205, 9, 5, '#ece4d4'); rect(c, 26, 209, 9, 1, '#c8c0b0');
    // photo
    rect(c, 95, 166, 11, 13, '#c8a040'); rect(c, 96, 167, 9, 11, '#d8cdb8');
    rect(c, 99, 169, 3, 3, '#e0b898'); rect(c, 98, 168, 5, 2, '#7a5a40'); rect(c, 98, 172, 5, 5, '#5a7a9a');
    // shelf & jars
    rect(c, 218, 186, 48, 2, '#4a3020');
    [[221, '#7aa0b8'], [229, '#c89040'], [237, '#8ab060'], [246, '#b05a40'], [256, '#d8d0b8']].forEach(([x, col]) => { rect(c, x, 180, 5, 6, col); rect(c, x + 1, 179, 3, 1, '#5a4030'); px(c, x + 1, 181, '#ffffff'); });
    // table & chairs
    rect(c, 222, 210, 42, 3, '#8a5a34'); rect(c, 222, 213, 42, 1, '#5a3a20');
    rect(c, 225, 214, 3, 14, '#5a3a20'); rect(c, 258, 214, 3, 14, '#5a3a20');
    rect(c, 212, 200, 2, 28, '#5a3a20'); rect(c, 212, 214, 8, 2, '#6a4428'); rect(c, 218, 216, 2, 12, '#5a3a20');
    rect(c, 272, 200, 2, 28, '#5a3a20'); rect(c, 266, 214, 8, 2, '#6a4428'); rect(c, 266, 216, 2, 12, '#5a3a20');
    rect(c, 234, 207, 12, 3, '#5a2a1e'); rect(c, 235, 206, 10, 1, '#e8e0cc'); px(c, 240, 206, '#5a2a1e');
    rect(c, 253, 204, 2, 6, '#efe6d0'); rect(c, 251, 209, 6, 1, '#a08060');
    // rod hooks
    rect(c, 284, 176, 2, 3, '#2a2a2a'); rect(c, 310, 176, 2, 3, '#2a2a2a');
    // stove
    rect(c, 318, 204, 24, 24, '#2a2a2e'); rect(c, 316, 202, 28, 3, '#3a3a40');
    rect(c, 322, 212, 16, 10, '#141418'); rect(c, 322, 212, 16, 1, '#4a4a50');
    rect(c, 327, 116, 6, 86, '#2a2a2e'); rect(c, 326, 160, 8, 2, '#3a3a40');
    rect(c, 327, 30, 6, 60, '#2a2a2e');
    rect(c, 320, 196, 8, 6, '#5a5a62'); rect(c, 320, 195, 8, 1, '#6a6a72'); rect(c, 328, 197, 2, 1, '#5a5a62');
    for (let i = 0; i < 4; i++) rect(c, 346 + (i % 2) * 2, 224 - i * 3, 11, 3, i % 2 ? '#7a5230' : '#6a4426');
    // cabinet with drawer
    rect(c, 372, 204, 28, 24, '#6a4428'); rect(c, 370, 202, 32, 3, '#5a3a20');
    rect(c, 375, 207, 22, 7, '#7a5232'); rect(c, 385, 210, 3, 1, '#d8b860');
    rect(c, 375, 216, 22, 10, '#7a5232'); rect(c, 385, 220, 3, 1, '#d8b860');
    rect(c, 376, 195, 5, 7, '#3a6a8a'); rect(c, 386, 197, 8, 5, '#c8b088');
    // oilskin on a hook
    rect(c, 410, 168, 2, 3, '#2a2a2a'); rect(c, 405, 171, 12, 24, '#d8b030'); rect(c, 404, 170, 14, 3, '#c09020');
    // door
    rect(c, 434, 190, 24, 38, '#3a2616');
    for (let j = 0; j < 35; j++) rect(c, 436, 192 + j, 20, 1, j % 6 === 5 ? '#4a3018' : '#6a4426');
    rect(c, 445, 192, 1, 35, '#4a3018'); rect(c, 452, 210, 2, 2, '#d8b860');
    // rug
    for (let i = 0; i < 70; i++) for (let j = 0; j < 3; j++) px(c, 208 + i, 225 + j, (i + j) % 6 < 3 ? '#8a3a2a' : '#a8603a');
  },
  drawBack(w, sc, cam, t) {
    Sea.draw(w, 162, 180, 0, t, 'north', S.time);
    const col = rgbStr(mixRgb(skyColors(S.time, 'clear')[2], '#2a3a4a', 0.4));
    for (let i = 0; i < 12; i++) rect(w, 176 + i, 162 - Math.round(Math.sin(i / 12 * Math.PI) * 4), 1, 4, col);
  },
  drawMid(w, sc, cam, t) {
    if (!Inv.has('rod')) {
      line(w, 282, 178, 314, 177, '#8a6a3a'); rect(w, 282, 177, 7, 2, '#c8a878');
      line(w, 288, 179, 300, 188, '#d8d8d0');
    }
    const f = Math.floor(t * 8) % 3;
    px(w, 253, 202 - (f === 1 ? 1 : 0), '#ffe080'); px(w, 253, 203, '#ff9a30');
    for (let i = 0; i < 5; i++) {
      const hh = 2 + Math.round(3 * Math.abs(Math.sin(t * 7 + i * 1.3)));
      rect(w, 324 + i * 3, 221 - hh, 2, hh, i % 2 ? '#ff9a30' : '#ffd060');
    }
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.6 + i / 3) % 1;
      w.globalAlpha = 0.4 * (1 - ph);
      rect(w, 329 + Math.sin(ph * 6 + i) * 2, 194 - ph * 18, 2, 2, '#e8e8e8');
    }
    // chimney smoke above roof
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.25 + i / 5) % 1;
      w.globalAlpha = 0.35 * (1 - ph);
      ellipse(w, 330 + ph * 16 + Math.sin(ph * 5 + i) * 2, 26 - ph * 30, 2 + ph * 4, 2 + ph * 3, '#d8dce4');
    }
    w.globalAlpha = 1;
  },
  lights(sc, cam, t, nf) {
    return [
      { x: 253, y: 203, r: 40, col: '#ffb860', a: 0.35, flicker: true, always: true },
      { x: 330, y: 216, r: 48, col: '#ff8a40', a: 0.38, flicker: true, always: true },
    ];
  },
  objects: [
    { x: 49, r: 24, label: 'Sleep', act: () => sleepHere("Grandpa's bed is too big for you, and it still smells of pipe smoke.") },
    { x: 100, r: 8, label: 'Look at photo', act: () => Dlg.narrate('A faded photograph of Grandma Margaret, laughing on the pier with her hair whipping in the wind. Grandpa named his boat after her.') },
    {
      x: 173, r: 14, label: 'Look out the window', act: async () => {
        if (nightFactor(S.time) > 0.6) {
          await Dlg.narrate('Night has settled over the harbour. Beyond Gull Rock the sea is black...');
          await Dlg.narrate('...and for a moment, far out, you think you see a faint green glow under the water. Then it is gone.');
        } else await Dlg.narrate('The harbour, the pier, and beyond them the grey-blue sea. Gull Rock is a dark smudge on the horizon.');
      },
    },
    {
      x: 242, r: 12, label: () => flag('readLog') ? 'Read logbook again' : 'Read logbook', act: async () => {
        await Dlg.narrate("Grandpa's logbook. His handwriting leans like a boat in the wind.");
        await Dlg.narrate('"Oct 2. Herring running thin. Mended the nets. Rain."');
        await Dlg.narrate('"Oct 9. Saw the lights again tonight, out past Gull Rock. Green and blue, deep under the water, like lanterns sinking. Margaret saw them too, the summer we married. Nobody believed her either."');
        await Dlg.narrate('"Oct 11. Closer tonight. And a sound... like somebody humming, low, through the floorboards of the world. I am going to follow them. Just a little way. Back by morning."');
        await Dlg.narrate('That is the last entry.');
        if (!flag('readLog')) {
          setFlag('readLog');
          await Dlg.say('you', 'Back by morning... That was a month ago.');
          await Dlg.say('you', "If I'm going to find out what happened to him, I need a boat. Grandpa's old fishing rod is still on the wall. Maybe I can catch enough to sell.");
        }
      },
    },
    {
      x: 298, r: 12, label: 'Take fishing rod', when: () => !Inv.has('rod'), act: async () => {
        Inv.add('rod'); Sound.sfx('pickup');
        await Dlg.narrate("Grandpa's old bamboo rod. The cork handle is worn smooth where his thumb used to rest.");
        await Dlg.narrate('Tip: the best place to fish in Saltmere is the end of the pier.');
      },
    },
    { x: 330, r: 10, label: 'Cook fish on the stove', act: cookFish },
    {
      x: 386, r: 12, label: 'Open drawer', act: async () => {
        if (!flag('drawer')) {
          setFlag('drawer');
          await Dlg.narrate("In the drawer, wrapped in oilcloth: Grandpa's knife. Underneath it, his old tobacco tin, rattling with coins.");
          Inv.add('knife'); S.coins += 15; Toast.show('+15 coins', 'coin'); Sound.sfx('coin');
          await Dlg.say('you', "Sorry, Grandpa. I'll pay you back when I find you.");
        } else await Dlg.narrate('Just string, candle stubs, and a very old biscuit.');
      },
    },
    { x: 446, r: 12, label: 'Go outside', act: () => { Sound.sfx('door'); Game.goto('village', { x: 77 }); } },
  ],
  async onEnter(sc, p) {
    if (p.intro) {
      await wait(0.8);
      await Dlg.narrate("You've been staying in Grandpa's cottage since he disappeared. Everything is just as he left it.");
      await Dlg.narrate('Use the Left and Right arrow keys to walk. Press E (or Space) to look at things and talk to people.');
    }
  },
};

// ===========================================================================
// VILLAGE (Saltmere)
// ===========================================================================
const VILLAGE = {
  id: 'village', name: 'Saltmere', sub: 'A small fishing village', width: 1300, horizon: 160, spawn: 78, minX: 10, maxX: 1236,
  music: 'village', ambience: { sea: 0.55, wind: 0.15 },
  fishSpot: 'pier',
  ground: () => 222,
  build(c, sc) {
    sc.wins = [];
    paintTerrain(c, 0, 1036, () => 222, MAT.cobble);
    paintTerrain(c, 1026, 1040, () => 222, MAT.rock);
    // pier deck & posts
    for (let x = 1036; x < 1236; x += 22) {
      rect(c, x, 226, 5, 50, '#3e2a1a'); rect(c, x + 1, 226, 1, 50, '#5a3e26');
      line(c, x + 5, 230, x + 22, 246, '#3e2a1a');
    }
    paintTerrain(c, 1036, 1242, () => 222, MAT.planks, 228);
    rect(c, 1036, 227, 206, 1, '#3a2616'); rect(c, 1238, 222, 4, 50, '#3e2a1a');
    // bollards
    for (const x of [1090, 1180, 1232]) { rect(c, x, 214, 5, 8, '#2a2a2e'); rect(c, x - 1, 213, 7, 2, '#3a3a40'); }
    const H_ = (x, o) => { const r = drawHouse(c, x, 222, o); sc.wins.push(...r.wins); return r; };
    // Ansel's cottage
    H_(40, { w: 76, h: 64, wall: '#6a8aa0', wallDark: '#4a6680', trim: '#e8e0d0', roof: 'gable', roofCol: '#8a3e2c', roofH: 26, roofDark: '#5a2a1e', door: 30, doorCol: '#8a3a2a', windows: [[8, 22, 12, 12], [52, 22, 12, 12]], chimney: 56, seed: 3 });
    // set roof colour (drawHouse uses o.roof as colour unless 'gable'); re-shingle gable in red
    drawNet(c, 6, 170, 28, 36);
    drawLobsterPot(c, 14, 222); drawLobsterPot(c, 120, 222); drawBarrel(c, 132, 222);
    // Bakery
    H_(150, { w: 92, h: 72, wall: '#e8d8b0', wallDark: '#c8b490', trim: '#f4ecd8', roof: '#a04a3a', roofDark: '#7a3228', roofH: 16, door: 66, doorCol: '#6a4a2a', windows: [[10, 26, 30, 18], [62, 12, 10, 8]], chimney: 70, sign: { x: 14, y: 6, text: 'ROSA\'S BAKERY', bg: '#f8f0e0', fg: '#8a3228' }, awning: { x: 2, y: 20, w: 50, a: '#c84a3a', b: '#f4ecd8' }, seed: 5 });
    // bread in window
    for (let i = 0; i < 4; i++) { ellipse(c, 166 + i * 7, 238 - 22 - 24 + 22, 2, 1, '#c8884a'); }
    // General store
    H_(268, { w: 104, h: 80, wall: '#7a9064', wallDark: '#5c7048', trim: '#e8e0d0', roof: 'gable', roofCol: '#4e4e58', roofH: 30, roofDark: '#33333a', door: 46, doorCol: '#3a4a5a', windows: [[10, 30, 22, 18], [72, 30, 22, 18]], sign: { x: 16, y: 10, text: 'HOLLIS & CO.', bg: '#2a3a2a', fg: '#e8d890' }, atticWin: true, seed: 7 });
    // crates outside store
    drawCrate(c, 378, 222, 9); drawCrate(c, 382, 213, 8);
    // bench
    rect(c, 404, 210, 40, 3, '#7a5432'); rect(c, 404, 202, 40, 2, '#6a4428'); rect(c, 406, 213, 3, 9, '#4a3020'); rect(c, 439, 213, 3, 9, '#4a3020'); rect(c, 406, 202, 2, 8, '#4a3020'); rect(c, 440, 202, 2, 8, '#4a3020');
    drawLampPost(c, 392, 222);
    // Fishmonger stall
    H_(468, { w: 86, h: 66, wall: '#d4dce4', wallDark: '#aab4c0', trim: '#f4f4f4', roof: '#3a5a8a', roofDark: '#28406a', roofH: 12, windows: [[60, 10, 14, 10]], sign: { x: 6, y: 4, text: 'TAM\'S FISH', bg: '#2a4a7a', fg: '#ffffff' }, awning: { x: -4, y: 18, w: 94, a: '#3a6aa8', b: '#f4f4f4' }, seed: 9 });
    rect(c, 470, 198, 82, 20, '#6a5040'); rect(c, 470, 196, 82, 3, '#8a6a50'); rect(c, 472, 199, 78, 4, '#dfeef4');
    for (let i = 0; i < 9; i++) { const ids = ['herring', 'mackerel', 'cod', 'sardine', 'snapper']; const f = fishSprite(ids[i % 5]); c.drawImage(f, 474 + i * 8, 196 - f.height + 3); }
    for (let i = 0; i < 4; i++) { line(c, 482 + i * 18, 182, 482 + i * 18, 186, '#3a3a3a'); c.drawImage(fishSprite(['cod', 'mackerel', 'herring', 'cod'][i]), 476 + i * 18, 186); }
    // Boatyard
    H_(580, { w: 132, h: 84, wall: '#7a5a3a', wallDark: '#5a4028', trim: '#c8b088', roof: 'gable', roofCol: '#5a4434', roofH: 36, roofDark: '#3a2a20', windows: [[8, 28, 14, 14]], sign: { x: 30, y: 8, text: "BO'S BOATYARD", bg: '#e8dcc0', fg: '#5a3a20' }, seed: 11 });
    // big barn doors (open, dark interior)
    rect(c, 612, 168, 56, 50, '#1e140c'); rect(c, 610, 166, 60, 2, '#c8b088');
    rect(c, 612, 168, 4, 50, '#5a4028'); rect(c, 664, 168, 4, 50, '#5a4028');
    for (let i = 0; i < 6; i++) rect(c, 622 + i * 7, 196 + (i % 2) * 6, 5, 2, '#5a4030');
    // boat on trestles
    const hull = makeBoat({ type: 'sail' });
    rect(c, 722, 206, 4, 16, '#5a4028'); rect(c, 760, 206, 4, 16, '#5a4028'); rect(c, 718, 206, 50, 2, '#6a4a30');
    c.drawImage(hull.c, 0, hull.oy - 2, hull.c.width, hull.c.height - hull.oy + 2, 718, 192, hull.c.width, hull.c.height - hull.oy + 2);
    // lamp, harbour office
    drawLampPost(c, 780, 222);
    H_(800, { w: 94, h: 86, wall: '#eeeae2', wallDark: '#c8c4bc', trim: '#b8402e', roof: 'gable', roofCol: '#2e4e72', roofH: 30, roofDark: '#1e3450', door: 42, doorCol: '#1e3450', windows: [[10, 26, 16, 16], [68, 26, 16, 16]], sign: { x: 10, y: 8, text: 'HARBOUR OFFICE', bg: '#1e3450', fg: '#ffffff' }, atticWin: true, seed: 13 });
    // flag pole
    rect(c, 910, 140, 2, 82, '#d8d8d8'); px(c, 910, 139, '#e8c040'); px(c, 911, 139, '#e8c040');
    // dock clutter
    drawBarrel(c, 935, 222); drawBarrel(c, 946, 222); drawCrate(c, 1004, 222, 10); drawCrate(c, 1008, 212, 8);
    for (let i = 0; i < 4; i++) ellipse(c, 1022, 219 - i * 2, 6 - i, 1, i % 2 ? '#a88a5a' : '#8a6a40');
    drawLampPost(c, 1060, 222);
    // gable roofs: overpaint in their colours
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(3, 8, 20, 100, 0.1, 'fair', 1600);
    sc.clouds.draw(w, cam, t * 2);
    const sil = rgbStr(mixRgb(skyColors(S.time, 'clear')[2], '#2a3a4a', 0.45));
    drawSilhouette(w, 'gull', 470 - cam * 0.25, 160, sil, t);
    drawSilhouette(w, 'lighthouse', 610 - cam * 0.25, 160, sil, t);
    Sea.draw(w, 160, H, cam * 0.6, t, 'north', S.time);
    // hills behind the village
    const hc1 = '#5a7a6a', hc2 = '#4a6a4e';
    for (let x = 0; x < W; x++) {
      const hx = x + cam * 0.35;
      const edge = clamp((760 - hx) / 120, 0, 1);
      const hh = (40 + Math.sin(hx * 0.012) * 14 + Math.sin(hx * 0.041) * 5) * edge;
      if (hh > 1) rect(w, x, 222 - 40 - hh, 1, hh + 40, hc1);
      const hx2 = x + cam * 0.55;
      const edge2 = clamp((900 - hx2) / 100, 0, 1);
      const hh2 = (24 + Math.sin(hx2 * 0.02 + 1) * 10 + Math.sin(hx2 * 0.07) * 3) * edge2;
      if (hh2 > 1) {
        rect(w, x, 222 - 30 - hh2, 1, hh2 + 30, hc2);
        if (hash2(Math.floor(hx2), 1) > 0.97) rect(w, x, 222 - 32 - hh2, 2, 3, '#3a5a3e');
      }
    }
  },
  drawMid(w, sc, cam, t) {
    // waving flag
    for (let i = 0; i < 16; i++) for (let j = 0; j < 9; j++) {
      const wv = Math.round(Math.sin(t * 5 - i * 0.5) * (i / 16) * 2);
      px(w, 912 + i - cam, 141 + j + wv, j < 3 ? '#1e3a7a' : j < 6 ? '#f4f4f4' : '#c8402e');
    }
    // chimney smoke
    for (const [cx, cy] of [[99, 128], [223, 140]]) {
      for (let i = 0; i < 5; i++) {
        const ph = (t * 0.25 + i / 5) % 1;
        w.globalAlpha = 0.35 * (1 - ph);
        const r = 2 + ph * 4;
        ellipse(w, cx - cam + ph * 18 + Math.sin(ph * 5 + i) * 2, cy - ph * 40, r, r * 0.8, '#d8dce4');
      }
    }
    w.globalAlpha = 1;
    // Nell's cat
    const cx = 990 + Math.sin(t * 0.3) * 18;
    const left = Math.cos(t * 0.3) < 0;
    const cat = sprite(['k.....k.', 'kk...kk.', 'kkkkkkkk', '.kkkkk..', '.k.k.k.k'].map(r => left ? r.split('').reverse().join('') : r), { k: '#e8a040' });
    w.drawImage(cat, Math.round(cx - cam), 217);
    // gulls
    for (let i = 0; i < 3; i++) drawGull(w, ((t * 12 + i * 160) % 700) - 100 + Math.sin(t + i) * 10, 70 + i * 14 + Math.sin(t * 0.7 + i) * 6, t + i);
    drawGull(w, 1180 - cam, 213, t, { standing: true });
  },
  drawFront(w, sc, cam, t) {
    const px0 = 1036 - cam;
    if (px0 < W) {
      if (S.boat) {
        const riders = [];
        drawBoat(w, boatCfg(), 1150 - cam, 241, t, { riders });
      }
      frontWater(w, 240, t, 'north', px0, W, cam);
    }
  },
  emissive(c, sc, cam, t, nf) {
    if (nf > 0.25) {
      for (const wi of sc.wins) {
        const x = wi.x - cam;
        if (x > W || x + wi.w < 0) continue;
        c.globalAlpha = Math.min(1, (nf - 0.25) * 1.6) * 0.9;
        rect(c, x, wi.y, wi.w, wi.h, '#f6c870');
        rect(c, x + Math.floor(wi.w / 2), wi.y, 1, wi.h, '#7a5030');
        rect(c, x, wi.y + Math.floor(wi.h / 2), wi.w, 1, '#7a5030');
        c.globalAlpha = 1;
      }
      for (const lx of [392, 780, 1060]) { c.globalAlpha = nf; rect(c, lx - 1 - cam, 187, 4, 4, '#fff2c0'); c.globalAlpha = 1; }
    }
    if (flag('lighthouseLit') && nf > 0.3) {
      const x = 610 - cam * 0.25 + 11;
      const a = Math.max(0, Math.sin(Game.t * 1.6));
      c.globalAlpha = a * nf;
      c.drawImage(glowSprite(10, '#fff0a0', 3, 1), Math.round(x - 10), 160 - 62 - 10);
      c.globalAlpha = 1;
    }
  },
  async onEnter(sc, p) {
    if (p.ending) await homecoming(sc);
  },
  lights(sc, cam, t, nf) {
    const L = [];
    for (const lx of [392, 780, 1060]) L.push({ x: lx + 1 - cam, y: 189, r: 34, col: '#ffcf80', a: 0.45 });
    for (const wi of sc.wins) L.push({ x: wi.x + wi.w / 2 - cam, y: wi.y + wi.h / 2, r: 16, col: '#ffb860', a: 0.3 });
    return L;
  },
  npcs: [
    ...[{ id: 'rosa', x: 214 }, { id: 'hollis', x: 326 }, { id: 'finn', x: 426, sit: true, facePlayer: false },
      { id: 'tam', x: 512 }, { id: 'bo', x: 690 }, { id: 'greta', x: 856 }, { id: 'nell', x: 968 }].map(n => Object.assign(n, { when: () => !flag('homecoming') })),
    ...[{ id: 'hollis', x: 938 }, { id: 'finn', x: 958 }, { id: 'bo', x: 980 }, { id: 'greta', x: 1004 }, { id: 'rosa', x: 1026 },
      { id: 'tam', x: 1048 }, { id: 'nell', x: 1068 }, { id: 'ansel', x: 1092, left: true, facePlayer: false }].map(n => Object.assign(n, { when: () => flag('homecoming') })),
  ],
  objects: [
    { x: 75, r: 10, label: "Enter Grandpa's cottage", act: () => { Sound.sfx('door'); Game.goto('cottage', { x: 440, facing: -1 }); } },
    { x: 214, label: 'Talk to Rosa', when: () => !flag('homecoming'), act: () => talkRosa() },
    { x: 326, label: 'Talk to Hollis', when: () => !flag('homecoming'), act: () => talkHollis() },
    { x: 426, label: 'Talk to Old Finn', when: () => !flag('homecoming'), act: () => talkFinn() },
    { x: 512, label: 'Talk to Tam', when: () => !flag('homecoming'), act: () => talkTam() },
    { x: 690, label: 'Talk to Bo', when: () => !flag('homecoming'), act: () => talkBo() },
    { x: 856, label: 'Talk to Greta', when: () => !flag('homecoming'), act: () => talkGreta() },
    { x: 968, label: 'Talk to Nell', when: () => !flag('homecoming'), act: () => talkNell() },
    boatObject(1150, 'saltmere'),
    { x: 1228, r: 12, label: 'Fish off the pier', act: sc => fishHere(sc, 1230, 246, 1) },
  ],
};

// ---------------- village dialogue ----------------
async function talkRosa() {
  if (!flag('rosaMet')) {
    setFlag('rosaMet');
    await Dlg.say('rosa', 'Oh! It\'s you, sweetheart. Come here, let me look at you.');
    await Dlg.say('rosa', 'Your grandpa bought a loaf from me every Tuesday for thirty years. I still set one aside for him, every week. Silly, isn\'t it?');
    await Dlg.say('rosa', "Here. Take it. You'll need feeding if you're going to go running about after him. And you are, aren't you? I can see it in your face.");
    Inv.add('bread');
    await Dlg.narrate('Bread is food for one leg of a voyage. Every trip between two places costs food.');
  }
  let sel = 0;
  while (true) {
    const items = [
      { label: 'Buy bread', right: '4c', id: 'bread', desc: 'Food for one leg of a voyage.', disabled: S.coins < 4, whyNot: 'Not enough coins.' },
      { label: 'Buy a jar of honey', right: '15c', id: 'honey', desc: 'Wildflower honey. Someone out at sea might want this.', disabled: S.coins < 15 || Inv.has('honey') || flag('bigSail'), whyNot: Inv.has('honey') || flag('bigSail') ? 'You only need one jar.' : 'Not enough coins.' },
      { label: 'Chat', id: 'chat' },
      { label: 'Leave', id: 'leave' },
    ];
    const i = await Menu.list({ title: "Rosa's Bakery", subtitle: S.coins + ' coins', items, w: 240, sel });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'bread') { S.coins -= 4; Inv.add('bread'); Sound.sfx('coin'); }
    if (id === 'honey') { S.coins -= 15; Inv.add('honey'); Sound.sfx('coin'); await Dlg.say('rosa', 'My best jar. Wildflower, from the hills behind the village. Who\'s it for? ...Mira? Ha! Of course it is. Tell her Rosa says hello.'); }
    if (id === 'chat') {
      if (flag('lighthouseLit')) await Dlg.say('rosa', 'Kettle Point is burning again! My mother used to say that lamp kept more sailors alive than every prayer in Saltmere put together.');
      else if (flag('miraMet')) await Dlg.say('rosa', 'Mira, out on Coconut Isle? Bless her. She used to trade me coconuts for honey before the supply boat stopped. That woman has a sweet tooth like a bear.');
      else if (S.boat) await Dlg.say('rosa', "A boat of your own! Just promise me you'll take food. Your grandpa always took two loaves. 'One for me, one for the sea,' he'd say.");
      else await Dlg.say('rosa', 'Tam pays fair for fish. Your grandpa used to say the herring at the end of the pier were the cheekiest on the coast.');
    }
  }
}

async function talkHollis() {
  if (!flag('hollisMet')) {
    setFlag('hollisMet');
    await Dlg.say('hollis', "Ah. The Hale kid. I'm sorry about your grandfather. Truly. He owed me for a tin of pipe tobacco, but I suppose that can wait.");
    await Dlg.say('hollis', "If you need supplies, I have them. Nothing's cheap since the supply boat stopped running, mind.");
  }
  let sel = 0;
  while (true) {
    const items = [
      { label: 'Lamp oil', right: '20c', id: 'oil', desc: 'A big can of lighthouse oil. Heavy stuff.', disabled: S.coins < 20 || Inv.has('oil') || flag('lighthouseLit'), whyNot: Inv.has('oil') || flag('lighthouseLit') ? "You don't need more." : 'Not enough coins.' },
      { label: 'Lucky lure', right: '25c', id: 'lure', desc: 'A shiny red lure. Fish bite faster and are easier to keep on the line.', disabled: S.coins < 25 || Inv.has('lure'), whyNot: Inv.has('lure') ? 'You already have one.' : 'Not enough coins.' },
      { label: 'Chat', id: 'chat' },
      { label: 'Leave', id: 'leave' },
    ];
    const i = await Menu.list({ title: 'Hollis & Co.', subtitle: S.coins + ' coins', items, w: 240, sel });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'oil') {
      S.coins -= 20; Inv.add('oil'); Sound.sfx('coin');
      if (flag('bramMet')) await Dlg.say('hollis', "For Kettle Point? About time somebody did something. Here, I'll throw in a funnel. Don't tell anyone I'm generous.");
      else await Dlg.say('hollis', 'Lighthouse oil? Odd thing for a kid to want. Still, coin is coin.');
    }
    if (id === 'lure') { S.coins -= 25; Inv.add('lure'); Sound.sfx('coin'); await Dlg.say('hollis', 'Your grandfather swore by those. Said the fish could never resist a bit of red.'); }
    if (id === 'chat') {
      if (flag('bramMet') && !flag('lighthouseLit')) await Dlg.say('hollis', "Old Bram's out of oil? The supply boat was meant to take him a barrel weeks ago. Nobody wanted to sail out there after Ansel went missing. Superstitious lot.");
      else if (flag('lighthouseLit')) await Dlg.say('hollis', "Seen the light at Kettle Point? Whole village is talking about it. I'm not saying it was you. I'm not saying it wasn't.");
      else await Dlg.say('hollis', "People keep talking about lights out at sea. Lights, humming, ghost ships. I sell lamps. You want lights? I've got lights.");
    }
  }
}

async function talkFinn() {
  const n = S.f.finn || 0;
  if (Inv.has('moonfish') && !flag('finnMoon')) {
    setFlag('finnMoon');
    await Dlg.say('finn', 'Is that a MOONFISH? Ha! Let me see it, let me see it!');
    await Dlg.say('finn', "My father said moonfish only rise when the lights are near. They follow her, like ducklings. Keep your eyes open, kid. Keep 'em open.");
    return;
  }
  if (n === 0) {
    await Dlg.say('finn', 'Sit, sit. Your grandpa and I used to argue on this very bench. Forty years of arguing. About the lights, mostly.');
    await Dlg.say('finn', 'He first saw them when he was a boy. Green and blue, deep under the water, moving slow, like a procession of lanterns.');
    await Dlg.say('finn', 'Everybody laughed at him. Then Margaret saw them too, the night they married, and nobody laughed at her. Nobody dared!');
  } else if (n === 1) {
    await Dlg.say('finn', "There's an old story. Older than me, and that's saying something. The Lantern Whale.");
    await Dlg.say('finn', 'A whale so old she glows, like she swallowed the moon once and never quite digested it. They say she sings to sailors lost in the fog.');
    await Dlg.say('finn', 'Some say she leads them home. Some say she leads them away. I say... depends who\'s listening.');
  } else if (n === 2 && flag('gullClue')) {
    await Dlg.say('finn', "Kettle Point, eh? Strange that the light there went dark. Bram's never once let that lamp go out in forty years. Never once.");
  } else if (flag('lighthouseLit') && !flag('foundAnsel')) {
    await Dlg.say('finn', "Light's burning at Kettle Point again. I watched it from this bench last night, and I'll tell you something: I heard humming. Out past Gull Rock. Low, like a cello.");
  } else {
    const lines = [
      "The sea gives back what it takes, sometimes. Not often. But sometimes.",
      "Mind the Teeth, past Kettle Point. That reef has eaten more boats than I've had hot dinners.",
      "Fish bite best at dawn and dusk. And at night, if you're lucky, something else might bite. Heh.",
    ];
    await Dlg.say('finn', lines[n % lines.length]);
  }
  S.f.finn = n + 1;
}

async function talkTam() {
  if (!flag('tamMet')) {
    setFlag('tamMet');
    await Dlg.say('tam', "Ansel's grandkid! Your grandpa brought me the best cod on this coast, rain or shine. Terrible singer, mind. Scared the gulls off.");
    await Dlg.say('tam', "You fishing now? Bring 'em here. I pay fair. Fairer than Hollis, anyway. And if you find any odds and ends floating about at sea, I'll buy those too.");
  }
  let sel = 0;
  while (true) {
    const keys = Object.keys(S.inv).filter(k => ITEMS[k] && ITEMS[k].price && S.inv[k] > 0 && ['fish', 'junk', 'trade'].includes(ITEMS[k].type) && k !== 'shell');
    const fishTotal = Inv.fishList().reduce((a, k) => a + ITEMS[k].price * S.inv[k], 0);
    const items = [];
    if (fishTotal > 0) items.push({ label: 'Sell all raw fish', right: fishTotal + 'c', act: 'all', desc: 'Sell every raw fish in your bag.' });
    keys.forEach(k => items.push({ label: ITEMS[k].name + '  x' + S.inv[k], right: ITEMS[k].price + 'c', icon: k, id: k, desc: 'Sell one ' + ITEMS[k].name + '.' }));
    items.push({ label: 'Done', act: 'done' });
    if (items.length === 1) { await Dlg.say('tam', "Nothing to sell? Pier end's the place. Wait for the bobber to dip, then strike!"); return; }
    const i = await Menu.list({ title: "Tam's Fish Stall", subtitle: S.coins + ' coins', items, w: 280, sel: Math.min(sel, items.length - 1) });
    if (i < 0 || items[i].act === 'done') return;
    sel = i;
    const it = items[i];
    if (it.act === 'all') {
      let sum = 0;
      Inv.fishList().forEach(k => { sum += ITEMS[k].price * S.inv[k]; Inv.remove(k, S.inv[k]); });
      Inv.addCoins(sum);
      continue;
    }
    if (it.id === 'pearl' && !flag('bigSail') && Inv.count('pearl') <= 1) {
      const r = await Dlg.ask('tam', "A pearl! I'll give you 25 for that. ...You sure, though? Looks like the kind of thing somebody out there might want.", ['Keep it', 'Sell it']);
      if (r !== 1) continue;
    }
    Inv.remove(it.id); Inv.addCoins(ITEMS[it.id].price);
  }
}

async function talkBo() {
  if (!flag('boMet')) {
    setFlag('boMet');
    await Dlg.say('bo', "You'll be wanting a boat. Don't look at me like that, it's written all over your face. Same face Ansel had at your age.");
    await Dlg.say('bo', "I've got Pip. An old rowboat, patched her myself. Thirty coins and she's yours. Fine for Gull Rock and Pearl Shoal. Don't take her any further than that.");
  }
  let sel = 0;
  while (true) {
    const items = [];
    if (!S.boat) items.push({ label: 'Buy rowboat "Pip"', right: '30c', id: 'row', desc: 'A patched little rowboat. Can reach Gull Rock and Pearl Shoal.', disabled: S.coins < 30, whyNot: 'You need 30 coins. Sell fish to Tam.' });
    if (S.boat === 'row') items.push({ label: 'Fit Pip with a mast and sail', right: '50c', id: 'sail', desc: 'Turns Pip into a little sailboat. Faster, and can reach Coconut Isle.', disabled: S.coins < 50, whyNot: 'You need 50 coins.' });
    if (S.boat === 'sail') items.push({ label: 'Ask about a bigger sail', id: 'bigq', desc: 'The currents near Kettle Point need something stronger.' });
    if (flag('bramMet') && !flag('ironHull')) {
      if (!flag('askedHull')) items.push({ label: 'Ask about the Teeth', id: 'askHull', desc: 'Bram said the reef would rip a wooden hull open.' });
      else items.push({ label: 'Reinforce hull', right: '40c', id: 'hull', desc: 'Needs 3 ironwood logs (' + Inv.count('ironwood') + '/3) and 40 coins.', disabled: Inv.count('ironwood') < 3 || S.coins < 40, whyNot: Inv.count('ironwood') < 3 ? 'You need 3 ironwood logs from Coconut Isle.' : 'You need 40 coins.' });
    }
    items.push({ label: 'Chat', id: 'chat' });
    items.push({ label: 'Leave', id: 'leave' });
    const i = await Menu.list({ title: "Bo's Boatyard", subtitle: S.coins + ' coins', items, w: 270, sel: Math.min(sel, items.length - 1) });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'row') {
      S.coins -= 30; S.boat = 'row'; Sound.sfx('quest');
      await Dlg.say('bo', "Pip is yours. She's tied up at the end of the pier. Treat her kindly and she'll treat you kindly.");
      await Dlg.say('bo', "And listen: take food. Every leg of a trip, you'll eat a meal. Bread from Rosa, fish you've cooked on a stove, coconuts, whatever you've got. Out there, an empty belly means you're not going far.");
      await Dlg.narrate('Each trip between two places needs food (shown on the sea chart). You can always sail home to Saltmere, even hungry.');
    }
    if (id === 'sail') {
      S.coins -= 50; S.boat = 'sail'; Sound.sfx('quest');
      await Dlg.narrate('Bo and Nell (mostly Bo) step a mast into Pip and rig a crisp white sail. She looks like a real sailboat now.');
      await Dlg.say('bo', 'There. She\'ll get you to Coconut Isle and back. Say hello to Mira for me. And don\'t let her talk you into buying anything.');
    }
    if (id === 'bigq') await Dlg.say('bo', "A storm sail? Not me. Mira, out on Coconut Isle, stitches the finest sails on this coast. Don't tell her I said so. She'll put her prices up.");
    if (id === 'askHull') {
      setFlag('askedHull');
      await Dlg.say('bo', "Through the Teeth? You're as mad as your grandfather. ...Alright. Alright. If you're going to do it, you'll do it properly.");
      await Dlg.say('bo', "Ironwood. It grows on Coconut Isle, past Mira's hut. Hardest wood there is. Bring me three logs and forty coins for the iron fittings, and I'll make Pip tougher than a turtle.");
      await Dlg.say('bo', "Take my hatchet. I want it back.");
      Inv.add('hatchet');
    }
    if (id === 'hull') {
      Inv.remove('ironwood', 3); S.coins -= 40; setFlag('ironHull'); Inv.remove('hatchet'); Sound.sfx('quest');
      await Dlg.narrate('Bo works all afternoon, bolting ironwood planks and iron bands along the hull. Sparks fly. Nell watches with her mouth open.');
      Clock.advance(3);
      await Dlg.say('bo', "Done. She'll take a knock or six now. Bring her back in one piece, and bring yourself back in one piece too. ...And my hatchet. Thanks.");
    }
    if (id === 'chat') {
      if (flag('ironHull')) await Dlg.say('bo', 'Best work I\'ve done in years, that hull. If anything can get through the Teeth, Pip can.');
      else if (S.boat === 'big') await Dlg.say('bo', "That's one of Mira's storm sails! You traded for it? Huh. I've been trying to get one off her for ten years.");
      else await Dlg.say('bo', "Ansel built the Margaret right here in this shed, forty-odd years back. I was his apprentice. He hit his thumb with a hammer every single day.");
    }
  }
}

async function talkGreta() {
  if (!flag('gretaMet')) {
    setFlag('gretaMet');
    await Dlg.say('greta', "Oh, love. I'm so sorry. We searched for nine days. Every boat in the harbour. We didn't find a thing. Not even an oar.");
    await Dlg.say('greta', "And you mean to go looking yourself, don't you? I can't stop you. You're a Hale. Hales don't listen.");
    await Dlg.say('greta', 'The last anyone saw of Ansel, he was rowing out toward Gull Rock at dusk. If I were you, that\'s where I\'d start.');
    await Dlg.say('greta', 'And promise me you\'ll be careful. The sea is kind until it isn\'t.');
    return;
  }
  if (flag('lighthouseLit') && !flag('gretaLight')) {
    setFlag('gretaLight');
    await Dlg.say('greta', 'Did you see? Kettle Point light is burning again! I nearly fell out of my chair. Was that... was that you?');
    await Dlg.say('greta', "Ha! Of course it was. Your grandfather would be so proud of you. Wherever he is.");
    return;
  }
  if (flag('gullClue') && !flag('gretaGull')) {
    setFlag('gretaGull');
    await Dlg.say('greta', "Kettle Point? That's where the old lighthouse is. Funny thing: Bram's light went dark about the same week Ansel disappeared.");
    await Dlg.say('greta', "The supply boat hasn't been out there in weeks. Nobody wants to sail west since... well. I've been meaning to do something about it.");
    return;
  }
  const lines = [];
  if (!S.boat) lines.push("You'll need a boat first. Bo has an old rowboat he'd let go cheap.");
  if (S.boat === 'big') lines.push("That's a storm sail on your boat! You're braver than half my sailors. Mind the currents round Kettle Point.");
  lines.push("A tip from an old harbourmaster: it's darker at sea than you think. Head home before nightfall, unless you've a good lantern.");
  lines.push('Watch out for rocks when you sail: steer around them with Up and Down. Every scrape weakens your hull.');
  await Dlg.say('greta', lines[(S.f.greta = (S.f.greta || 0) + 1) % lines.length]);
}

async function talkNell() {
  if (!flag('nellMet')) {
    setFlag('nellMet');
    await Dlg.say('nell', 'Are you going to find your grandpa? Pickles says you are. Pickles is my cat. She won\'t go near the water since the lights came.');
    await Dlg.say('nell', 'Cats know things.');
    await Dlg.say('nell', "Oh! If you find a really pretty shell out there, I'll trade you for it. I have... um... fifteen coins! I've been saving them.");
    return;
  }
  if (Inv.has('shell') && !flag('nellShell')) {
    setFlag('nellShell');
    Inv.remove('shell');
    await Dlg.say('nell', "A pink spiral one! It's PERFECT. Pickles, look! ...She's not looking. But she likes it, I can tell.");
    Inv.addCoins(15);
    await Dlg.say('nell', "Fifteen coins, like I promised. Don't spend it all on bread.");
    return;
  }
  const lines = [
    "Pickles sat on the pier all night last night, staring out to sea. Cats know things.",
    "Mum says your grandpa is gone. But Mum says lots of things.",
    "I'm going to be a harbourmaster when I grow up. Or a pirate. Or a harbourmaster for pirates.",
  ];
  if (flag('lighthouseLit')) lines.push("I saw the lighthouse blinking last night, all the way out there! Pickles saw it too. She purred.");
  await Dlg.say('nell', lines[(S.f.nell = (S.f.nell || 0) + 1) % lines.length]);
}

// ===========================================================================
// GULL ROCK
// ===========================================================================
const GULL = {
  id: 'gull', name: 'Gull Rock', width: 520, horizon: 170, spawn: 62, minX: 30, maxX: 500,
  music: 'sea', ambience: { sea: 0.9, wind: 0.4 },
  fishSpot: 'gull',
  ground: makeGround([[0, 246], [18, 240], [32, 230], [92, 229], [140, 214], [190, 180], [235, 145], [262, 128], [300, 126], [330, 140], [370, 175], [410, 196], [440, 199], [490, 200], [506, 214], [520, 246]]),
  build(c, sc) {
    const g = roughen(this.ground, 3);
    paintTerrain(c, 0, 520, g, (x, d, y) => x < 110 ? (d < 3 ? hexRgb(hash2(x, y) > 0.5 ? '#9a948a' : '#7a756e') : MAT.rock(x, d, y)) : MAT.gullrock(x, d, y));
    // nest
    const nx = 295, ny = this.ground(nx);
    for (let i = 0; i < 18; i++) line(c, nx - 9 + i, ny - 2 - (i % 3), nx - 8 + i + (i % 2 ? 3 : -3), ny - (i % 2), i % 2 ? '#8a6a40' : '#6a4a2a');
    ellipse(c, nx, ny - 3, 3, 1, '#e8e4dc');
    // scratches on the rock face
    const sx = 352, sy = this.ground(352) + 8;
    for (let i = 0; i < 6; i++) line(c, sx + i * 5, sy + (i % 2), sx + i * 5 + 3, sy + 6, '#c8c4bc');
    line(c, sx, sy + 9, sx + 26, sy + 10, '#c8c4bc');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(11, 7, 20, 100, 0.1, 'fair', 1400);
    sc.clouds.draw(w, cam, t * 2);
    const sil = rgbStr(mixRgb(skyColors(S.time, 'clear')[2], '#2a3a4a', 0.45));
    drawSilhouette(w, 'town', 60 - cam * 0.2, 170, sil, t);
    Sea.draw(w, 170, H, cam, t, 'north', S.time);
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 50 - cam, 237, t, {});
    for (const gx of [150, 214, 330, 470]) drawGull(w, gx - cam + Math.round(Math.sin(t * 0.5 + gx) * 2), this.ground(gx), t, { standing: true });
    for (let i = 0; i < 6; i++) {
      const a = t * (0.4 + i * 0.05) + i;
      drawGull(w, 280 - cam + Math.cos(a) * (60 + i * 15), 70 + Math.sin(a) * 18 + i * 6, t + i, { seed: i * 2.1 });
    }
    if (Math.random() < 0.004) Sound.sfx('gull');
  },
  drawFront(w, sc, cam, t) { frontWater(w, 236, t, 'north', 0, W, cam); },
  lights(sc, cam, t, nf) {
    if (nf < 0.6 || !flag('gullClue')) return [];
    const a = 0.3 + 0.2 * Math.sin(t * 0.8);
    return [{ x: 420 - cam + Math.sin(t * 0.2) * 30, y: 198, r: 14, col: '#7ff7e8', a, always: true }];
  },
  objects: [
    boatObject(50, 'gull'),
    {
      x: 250, r: 10, label: 'Look out to sea', act: async () => {
        if (nightFactor(S.time) > 0.6) {
          await Dlg.narrate('Far out to the west, under the water: soft green and blue lights, drifting slowly, like lanterns sinking into the deep.');
          Sound.whale(0.12);
          await Dlg.narrate('A low hum rolls across the waves, so deep you feel it in your teeth more than hear it. Then the lights fade, and the sea is dark again.');
          if (!flag('sawLights')) { setFlag('sawLights'); await Dlg.say('you', "The lights... Grandpa wasn't imagining them."); }
        } else await Dlg.narrate('From the top of Gull Rock you can see for miles. Saltmere to the east. Open sea to the west, and a speck that might be the old lighthouse at Kettle Point. (The lights Grandpa wrote about only show at night.)');
      },
    },
    {
      x: 296, r: 10, label: 'Look in the nest', act: async () => {
        if (!Inv.has('cap')) {
          await Dlg.narrate('Tucked into a gull\'s nest, among feathers and fishbones: a blue knitted cap.');
          Inv.add('cap'); Sound.sfx('pickup');
          await Dlg.say('you', "Grandpa's cap! Grandma knitted it for him. He never, ever went to sea without it.");
          await Dlg.say('you', 'So he was here. The wind must have taken it... or the gulls did.');
        } else await Dlg.narrate('A cross-looking gull is sitting in the nest now. It does not want to talk to you.');
      },
    },
    {
      x: 362, r: 12, label: 'Examine scratches on the rock', act: async () => {
        await Dlg.narrate('Scratched into the rock with a knife, pale against the old lichen:');
        await Dlg.narrate('"A.H. Lights moving west toward Kettle Point. Following. The lighthouse is dark?? Strange."');
        if (!flag('gullClue')) {
          setFlag('gullClue');
          Sound.sfx('quest');
          await Dlg.say('you', "That's Grandpa's writing! I'd know those crooked A's anywhere.");
          await Dlg.say('you', "Kettle Point... the old lighthouse. That's much too far to row. I'll need a sail.");
          if (S.boat === 'row') await Dlg.say('you', 'Bo can fit Pip with a mast and sail. And maybe someone on Coconut Isle saw which way he went. It\'s on the way.');
        }
      },
    },
    { x: 482, r: 14, label: 'Fish from the ledge', act: sc => fishHere(sc, 482, 240, 1) },
  ],
  async onEnter(sc) {
    if (!flag('gullVisit')) {
      setFlag('gullVisit');
      await wait(0.5);
      await Dlg.narrate('Gull Rock. Hundreds of gulls scream at you from every ledge. The rock is white with... well. With gull.');
    }
  },
};

// ===========================================================================
// PEARL SHOAL
// ===========================================================================
const OYSTER_X = [120, 205, 300];
const PEARL = {
  id: 'pearl', name: 'Pearl Shoal', sub: 'A sandbar that appears at low tide', width: 480, horizon: 168, spawn: 46, minX: 30, maxX: 452,
  music: 'island', ambience: { sea: 0.7, wind: 0.2 },
  fishSpot: 'pearl',
  ground: makeGround([[0, 250], [30, 244], [46, 231], [70, 228], [130, 230], [170, 227], [230, 229], [290, 226], [350, 229], [410, 228], [440, 232], [460, 244], [480, 250]]),
  build(c, sc) {
    const g = roughen(this.ground, 1);
    paintTerrain(c, 0, 480, g, (x, d, y) => (x < 60 || x > 425 || d > 4) ? MAT.wetsand(x, d, y) : MAT.sand(x, d, y));
    for (const ox of OYSTER_X) {
      const gy = this.ground(ox);
      ellipse(c, ox, gy + 2, 16, 3, '#5a8aa0');
      ellipse(c, ox, gy + 2, 13, 2, '#7ab0c0');
      for (let i = 0; i < 5; i++) { ellipse(c, ox - 8 + i * 4, gy - 1 + (i % 2), 2, 2, '#5a5a5a'); px(c, ox - 8 + i * 4, gy - 2 + (i % 2), '#b8b8b8'); }
    }
    // starfish & seaweed
    for (const sx of [160, 340, 395]) { const gy = this.ground(sx); px(c, sx, gy - 2, '#e86a3a'); rect(c, sx - 2, gy - 1, 5, 1, '#e86a3a'); px(c, sx - 1, gy, '#e86a3a'); px(c, sx + 1, gy, '#e86a3a'); }
    for (const sx of [90, 250, 420]) { const gy = this.ground(sx); for (let i = 0; i < 5; i++) line(c, sx + i * 2, gy, sx + i * 2 + (i % 2 ? 2 : -2), gy - 4 - i % 3, '#3a6a3a'); }
    // marker pole
    rect(c, 380, this.ground(380) - 44, 3, 44, '#6a5a44');
    for (let j = 0; j < 12; j++) if (hash2(j, 380) > 0.4) px(c, 380 + (j % 3), this.ground(380) - 12 + j, '#d8d8c8');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(21, 6, 20, 90, 0.1, 'fair', 1400);
    sc.clouds.draw(w, cam, t * 2);
    const sil = rgbStr(mixRgb(skyColors(S.time, 'clear')[2], '#2a3a4a', 0.45));
    drawSilhouette(w, 'palm', 420 - cam * 0.2, 168, sil, t);
    Sea.draw(w, 168, H, cam, t, 'tropic', S.time);
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 36 - cam, 239, t, {});
    // red cloth on marker
    for (let i = 0; i < 7; i++) px(w, 383 + i - cam, this.ground(380) - 42 + Math.round(Math.sin(t * 6 - i * 0.7) * (i / 4)), '#c83a2a');
    for (let i = 0; i < 6; i++) px(w, 383 + i - cam, this.ground(380) - 41 + Math.round(Math.sin(t * 6 - i * 0.7) * (i / 4)), '#a82a1e');
    if (!flag('shellFound')) {
      const gy = this.ground(256);
      rect(w, 254 - cam, gy - 3, 4, 3, '#f0a8b8'); px(w, 255 - cam, gy - 4, '#f8d0d8'); px(w, 257 - cam, gy - 2, '#c87888');
      if (Math.floor(t * 2) % 4 === 0) px(w, 256 - cam, gy - 5, '#ffffff');
    }
    // shimmer on pools
    for (const ox of OYSTER_X) if (Math.floor(t * 2 + ox) % 3 === 0) px(w, ox - cam + Math.sin(t + ox) * 8, this.ground(ox) + 2, '#e8ffff');
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'tropic', 0, W, cam); },
  objects: [
    boatObject(36, 'pearl'),
    ...OYSTER_X.map((ox, i) => ({
      x: ox, r: 14, label: 'Open oysters', act: async () => {
        if (!Inv.has('knife')) { await Dlg.narrate("The oysters are clamped shut tight. You'd need a knife to open them. Didn't Grandpa keep one in his drawer?"); return; }
        if (!S.daily.oysters[i]) { await Dlg.narrate("You've already opened the oysters here today. Come back tomorrow, when the tide has turned over a few more."); return; }
        S.daily.oysters[i] = 0;
        S.f.oysters = (S.f.oysters || 0) + 1;
        Sound.sfx('chop');
        await Dlg.narrate('You wade into the warm pool and work the knife into a crusty oyster shell...');
        const lucky = Math.random() < 0.3 || (S.f.oysters >= 3 && !flag('pearlFound'));
        if (lucky) {
          setFlag('pearlFound');
          Inv.add('pearl'); Sound.sfx('quest');
          await Dlg.narrate('Inside, nestled in the oyster like an egg in a nest, is a small, perfect pearl!');
        } else await Dlg.narrate('Nothing but oyster. You put it back gently. Maybe the next bed will be luckier.');
      },
    })),
    {
      x: 256, r: 8, label: 'Pick up shell', when: () => !flag('shellFound'), act: async () => {
        setFlag('shellFound'); Inv.add('shell'); Sound.sfx('pickup');
        await Dlg.narrate('A pink spiral shell, perfect and unbroken. Nell would love this.');
      },
    },
    { x: 382, r: 10, label: 'Look at marker pole', act: () => Dlg.narrate('An old marker pole, crusted with barnacles. Someone has tied a strip of red cloth to the top. Grandpa always tied red cloth to his markers. "So Margaret can find me," he used to say.') },
    { x: 446, r: 10, label: 'Fish', act: sc => fishHere(sc, 446, 242, 1) },
  ],
  async onEnter() {
    if (!flag('pearlVisit')) {
      setFlag('pearlVisit');
      await wait(0.5);
      await Dlg.narrate('Pearl Shoal: a long tongue of sand that only shows at low tide. The water in the pools is warm and clear. Oysters cling to the rocks.');
    }
  },
};

// ===========================================================================
// COCONUT ISLE
// ===========================================================================
const PALM_X = [150, 232, 318];
const IRON_X = [660, 742, 824];
function drawHut(c, x, gy) {
  for (const sx of [x + 4, x + 30, x + 60, x + 86]) rect(c, sx, gy - 22, 3, 22, '#6a4a2a');
  rect(c, x - 2, gy - 24, 96, 4, '#8a6a40'); rect(c, x - 2, gy - 21, 96, 1, '#5a4024');
  for (let i = 0; i < 90; i++) rect(c, x + i, gy - 54, 1, 30, i % 4 === 0 ? '#7a5a2e' : (i % 4 === 1 ? '#c8a86a' : '#b8985a'));
  for (let j = 0; j < 30; j += 6) rect(c, x, gy - 54 + j, 90, 1, '#8a6a3a');
  rect(c, x + 40, gy - 48, 12, 24, '#2a1e14');
  rect(c, x + 12, gy - 46, 14, 10, '#2a1e14'); rect(c, x + 64, gy - 46, 14, 10, '#2a1e14');
  for (let j = 0; j < 30; j++) {
    const half = Math.round(8 + j * 1.9);
    const cx = x + 45;
    for (let i = -half; i <= half; i++) {
      const col = (i + j * 2) % 5 === 0 ? '#8a6a2a' : (j % 4 === 3 ? '#a88038' : '#c8a050');
      px(c, cx + i, gy - 84 + j, col);
    }
  }
  for (let i = 0; i < 100; i += 3) line(c, x - 12 + i, gy - 55, x - 12 + i + 1, gy - 51 + (i % 2), '#a88038');
  for (let j = 0; j < 24; j += 4) rect(c, x + 44, gy - 24 + j, 6, 1, '#6a4a2a');
  rect(c, x + 44, gy - 24, 1, 24, '#6a4a2a'); rect(c, x + 49, gy - 24, 1, 24, '#6a4a2a');
  // perch
  rect(c, x + 92, gy - 44, 10, 2, '#6a4a2a'); rect(c, x + 92, gy - 44, 2, 20, '#6a4a2a');
}
const COCONUT = {
  id: 'coconut', name: 'Coconut Isle', sub: "Mira's island", width: 1000, horizon: 160, spawn: 60, minX: 16, maxX: 980,
  music: 'island', ambience: { sea: 0.6, wind: 0.2 },
  fishSpot: 'coconut',
  ground: makeGround([[0, 224], [90, 224], [100, 228], [150, 230], [250, 228], [350, 224], [420, 222], [560, 220], [640, 214], [760, 208], [860, 200], [905, 182], [940, 164], [1000, 160]]),
  build(c, sc) {
    const g = roughen(this.ground, 1);
    paintTerrain(c, 90, 1000, g, (x, d, y) => x < 570 ? MAT.sand(x, d, y) : x < 880 ? MAT.jungle(x, d, y) : MAT.mossrock(x, d, y));
    // dock
    for (let x = 0; x < 92; x += 20) { rect(c, x + 4, 228, 4, 42, '#3e2a1a'); }
    paintTerrain(c, 0, 92, () => 224, MAT.planks, 229);
    drawHut(c, 420, this.ground(470));
    // fire stones
    const fx = 552, fy = this.ground(552);
    for (let i = 0; i < 5; i++) ellipse(c, fx - 8 + i * 4, fy - 1, 2, 1, '#6a6460');
    // hammock posts
    rect(c, 584, this.ground(584) - 26, 3, 26, '#6a4a2a'); rect(c, 622, this.ground(622) - 26, 3, 26, '#6a4a2a');
    for (let i = 0; i < 36; i++) { const u = i / 36; px(c, 586 + i, this.ground(600) - 24 + Math.sin(u * Math.PI) * 8, '#d8c8a0'); px(c, 586 + i, this.ground(600) - 23 + Math.sin(u * Math.PI) * 8, '#b8a070'); }
    // jungle bushes
    for (let i = 0; i < 18; i++) { const bx = 570 + i * 18 + hash1(i) * 10; ellipse(c, bx, this.ground(bx) - 3, 8, 5, i % 2 ? '#2f5a2a' : '#3a6a30'); ellipse(c, bx - 2, this.ground(bx) - 5, 4, 2, '#4f8a40'); }
    // cairn at lookout
    for (let i = 0; i < 4; i++) ellipse(c, 962, this.ground(962) - 2 - i * 4, 6 - i, 2, i % 2 ? '#8a8680' : '#6a6660');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(31, 8, 18, 90, 0.1, 'fair', 1600);
    sc.clouds.draw(w, cam, t * 2);
    const sil = rgbStr(mixRgb(skyColors(S.time, 'clear')[2], '#2a3a4a', 0.45));
    drawSilhouette(w, 'lighthouse', 560 - cam * 0.25, 160, sil, t);
    Sea.draw(w, 160, H, cam, t, 'tropic', S.time);
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 50 - cam, 239, t, {});
    PALM_X.forEach((x, i) => drawPalm(w, x - cam, this.ground(x), 54 + (i % 2) * 10, t, { coconuts: S.daily.palms[i] ? 3 : 0, lean: i === 1 ? -0.2 : 0.25, seed: x }));
    IRON_X.forEach((x, i) => {
      const gy = this.ground(x);
      drawTree(w, x - cam, gy, 62, t * 0.3, { trunk: '#2a1e18', leaf: ['#1e3a24', '#2a4a2e', '#3a5e3a'], seed: x });
      const bx = x + 2 - cam, by = gy - 26;
      if (flag('iw' + i)) { rect(w, bx, by, 3, 2, '#2a1e18'); rect(w, bx + 3, by, 1, 2, '#c8a878'); }
      else {
        line(w, bx, by, bx + 13, by - 7, '#2a1e18'); line(w, bx, by + 1, bx + 13, by - 6, '#2a1e18');
        ellipse(w, bx + 15, by - 9, 5, 3, '#1e3a24'); ellipse(w, bx + 14, by - 10, 3, 2, '#3a5e3a');
      }
    });
    // fire
    const fx = 552 - cam, fy = this.ground(552);
    for (let i = 0; i < 5; i++) {
      const hh = 3 + Math.round(4 * Math.abs(Math.sin(t * 7 + i * 1.7)));
      rect(w, fx - 5 + i * 2, fy - 2 - hh, 2, hh, i % 2 ? '#ff9a30' : '#ffd060');
    }
    for (let i = 0; i < 4; i++) { const ph = (t * 0.4 + i / 4) % 1; w.globalAlpha = 0.3 * (1 - ph); rect(w, fx + Math.sin(ph * 4 + i) * 3, fy - 10 - ph * 30, 2, 2, '#c8c8c8'); }
    w.globalAlpha = 1;
    // parrot
    const bob = Math.floor(t * 2) % 2;
    const parrot = sprite(['.rr.', 'rrwk', 'rrr.', 'ggr.', 'gg..', '.y..'], { r: '#d8302a', w: '#ffffff', k: '#1a1a1a', g: '#2a8a3a', y: '#e8c030' });
    w.drawImage(parrot, 514 - cam, this.ground(470) - 50 - bob);
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'tropic', 0, 130 - cam, cam); },
  lights(sc, cam, t, nf) { return [{ x: 552 - cam, y: this.ground(552) - 6, r: 40, col: '#ff9a40', a: 0.5, flicker: true }]; },
  npcs: [{ id: 'mira', x: 470 }],
  objects: [
    boatObject(50, 'coconut'),
    ...PALM_X.map((x, i) => ({
      x, r: 12, label: 'Shake the palm tree', act: async () => {
        if (!S.daily.palms[i]) { await Dlg.narrate('No coconuts left on this one today. They grow back overnight.'); return; }
        S.daily.palms[i] = 0;
        Sound.sfx('thud');
        Inv.add('coconut', 2);
        if (!flag('coconutTip')) { setFlag('coconutTip'); await Dlg.narrate('Thunk! Thunk! Two coconuts drop onto the sand. Coconuts are food for voyages.'); }
      },
    })),
    { x: 470, label: 'Talk to Mira', act: () => talkMira() },
    { x: 552, r: 10, label: 'Cook fish on the fire', act: cookFish },
    { x: 604, r: 14, label: 'Rest in the hammock', act: () => sleepHere('The hammock sways gently in the sea breeze.') },
    ...IRON_X.map((x, i) => ({
      x, r: 12, label: () => Inv.has('hatchet') ? 'Cut an ironwood branch' : 'Ironwood tree', when: () => !flag('iw' + i), act: async () => {
        if (!Inv.has('hatchet')) { await Dlg.narrate('A dark, twisted ironwood tree. Its bark is as hard as stone. ' + (flag('bramMet') ? 'Bo the shipwright might know what to do with this wood.' : '')); return; }
        await Dlg.narrate("You pick one thick, low branch and swing Bo's hatchet. Clunk. Clunk. CLUNK. It takes forever, but eventually the branch comes down. The tree will grow another.");
        Sound.sfx('chop'); await wait(0.25); Sound.sfx('chop'); await wait(0.25); Sound.sfx('thud');
        setFlag('iw' + i); Inv.add('ironwood'); Clock.advance(0.5);
      },
    })),
    {
      x: 962, r: 14, label: 'Look out from the cliff', act: async () => {
        if (flag('lighthouseLit')) await Dlg.narrate('From the clifftop you can see Kettle Point lighthouse to the north-west, its great beam sweeping the sea. Beyond it, a wall of fog sits on the water like a sleeping animal.');
        else await Dlg.narrate('From the clifftop you can see the old lighthouse at Kettle Point, far to the north-west. It is dark. No light at all. Beyond it, a grey wall of fog sits on the sea.');
      },
    },
  ],
  async onEnter() {
    if (!flag('coconutVisit')) {
      setFlag('coconutVisit');
      await wait(0.5);
      await Dlg.narrate('Coconut Isle. Warm sand, swaying palms, and smoke rising from a little hut on stilts.');
    }
  },
};

async function talkMira() {
  if (!flag('miraMet')) {
    setFlag('miraMet');
    await Dlg.say('mira', 'A visitor! Biscuit, we have a visitor!');
    await Dlg.say('biscuit', 'SQUAWK! VISITOR! HIDE THE BISCUITS!');
    await Dlg.say('mira', "Hush, you. Now then, let me look at you... wait. You've got his eyes. You're Ansel's grandchild, aren't you?");
    await Dlg.say('mira', 'He came by about a month back. In a terrible hurry, with that look he gets when he\'s chasing something.');
    await Dlg.say('mira', "He traded me his pocket watch for a coil of rope and a sack of coconuts. Said he'd be back to buy it back. I'm keeping it safe for him.");
    await Dlg.say('mira', "Then he sailed west. Toward Kettle Point and the lighthouse. That was the last I saw of him.");
    await Dlg.say('you', "Then that's where I'm going.");
    await Dlg.say('mira', "In that little boat? Ha! The currents round Kettle Point would spin you like a top. You need a proper storm sail.");
    await Dlg.say('mira', "I happen to have one. The finest storm sail on this coast, if I say so myself. And I do say so.");
    await Dlg.say('mira', "But nothing's free on Coconut Isle. Bring me a pearl, I've been wanting one for my necklace. And a jar of Rosa's honey. I haven't tasted honey in a year.");
    await Dlg.say('biscuit', 'HONEY! HONEY! SQUAWK!');
    await Dlg.say('mira', 'Pearls grow in the oyster beds on Pearl Shoal. And shake my palm trees if you need coconuts for the trip. They grow back overnight.');
    return;
  }
  let sel = 0;
  while (true) {
    const items = [];
    if (!flag('bigSail')) items.push({ label: 'Trade for the storm sail', id: 'sail', desc: 'Mira wants a pearl and a jar of honey.', disabled: !(Inv.has('pearl') && Inv.has('honey')), whyNot: 'You need ' + [!Inv.has('pearl') ? 'a pearl' : null, !Inv.has('honey') ? 'a jar of honey' : null].filter(Boolean).join(' and ') + '.' });
    if (flag('bramMet') && !Inv.has('wick') && !flag('lighthouseLit')) items.push({ label: 'Ask for a lamp wick', id: 'wick', desc: "Bram's lighthouse needs a new wick." });
    items.push({ label: 'Ask about Grandpa', id: 'ansel' });
    items.push({ label: 'Chat', id: 'chat' });
    items.push({ label: 'Leave', id: 'leave' });
    const i = await Menu.list({ title: 'Mira', items, w: 240, sel: Math.min(sel, items.length - 1) });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'sail') {
      Inv.remove('pearl'); Inv.remove('honey');
      await Dlg.say('mira', "Oh! Look at it. Look at it shine! And honey... real honey. Rosa's wildflower. You wonderful child.");
      await Dlg.say('mira', "A deal's a deal. Help me carry it down to your boat.");
      await Dlg.narrate('Together you rig the storm sail on Pip: a great cream-coloured sail with a red band, patched and tough and beautiful. Pip suddenly looks twice her size.');
      S.boat = 'big'; setFlag('bigSail'); Sound.sfx('quest');
      await Dlg.say('mira', "There. She'll catch any wind you point her at. Kettle Point is north-west. Go and find him.");
    }
    if (id === 'wick') {
      await Dlg.say('mira', "A wick for Bram's lamp? Old Bram! Is he alright? I always wondered why the light went out...");
      await Dlg.narrate('Mira pulls a handful of coconut fibre from a basket and twists it between her palms, fast and tight, humming under her breath.');
      Inv.add('wick'); Sound.sfx('pickup');
      await Dlg.say('mira', "There. Coconut fibre burns slow and bright. Tell Bram he still owes me a game of cards.");
    }
    if (id === 'ansel') {
      if (flag('lighthouseLit')) await Dlg.say('mira', "Bram's light is burning again. I watched it from the cliff last night and cried like a baby. If Ansel's out there, he'll see it. Now go and bring him home.");
      else if (flag('bigSail')) await Dlg.say('mira', "I'm still keeping his watch. It ticks every night on my shelf. He'll come back for it. Won't he?");
      else await Dlg.say('mira', 'He kept talking about "her". "She\'s calling, Mira. Can\'t you hear her?" I thought he meant his Margaret. Now I\'m not so sure.');
    }
    if (id === 'chat') {
      const lines = [
        "The dark trees past my hut are ironwood. Hard as iron, and it never rots. Bo would give his left boot for some.",
        "Biscuit says hello. Biscuit also says some words I won't repeat. Sailors taught him.",
        "If you get hungry, shake the palms. And the hammock is yours if you need a sleep.",
      ];
      await Dlg.say('mira', lines[(S.f.mira = (S.f.mira || 0) + 1) % lines.length]);
    }
  }
}

// ===========================================================================
// KETTLE POINT (lighthouse)
// ===========================================================================
function drawTower(c, cx, gy, topY) {
  const hgt = gy - topY;
  for (let y = topY; y < gy; y++) {
    const u = (y - topY) / hgt;
    const half = Math.round(lerp(15, 24, u));
    const band = (u > 0.18 && u < 0.3) || (u > 0.55 && u < 0.67);
    for (let i = -half; i <= half; i++) {
      const s = i / half;
      let col = band ? '#b8402e' : '#ece6da';
      if (s > 0.45) col = band ? '#8a2e22' : '#c8c2b6';
      if (s < -0.7) col = band ? '#d05a46' : '#fffaf0';
      if (!band && hash2(i, y) > 0.97) col = '#d8d2c6';
      px(c, cx + i, y, col);
    }
  }
  // slit windows
  for (const u of [0.4, 0.8]) rect(c, cx - 2, topY + hgt * u, 4, 7, '#2a2a30');
  // door
  rect(c, cx - 6, gy - 20, 12, 20, '#2a3a4a'); rect(c, cx - 7, gy - 21, 14, 1, '#2a2a30'); px(c, cx + 3, gy - 10, '#d8b860');
  // gallery & lantern room
  rect(c, cx - 26, topY - 3, 53, 3, '#2a2a30');
  for (let i = -25; i <= 25; i += 5) rect(c, cx + i, topY - 9, 1, 6, '#2a2a30');
  rect(c, cx - 26, topY - 10, 53, 1, '#2a2a30');
  rect(c, cx - 13, topY - 30, 27, 27, '#2a2a30');
  for (let i = 0; i < 3; i++) rect(c, cx - 11 + i * 8, topY - 28, 7, 23, '#5a7a8a');
  for (let j = 0; j < 12; j++) { const hw = Math.round(14 * Math.sqrt(1 - (j / 12) * (j / 12))); rect(c, cx - hw, topY - 31 - j, hw * 2 + 1, 1, j % 3 ? '#3a3a42' : '#2a2a30'); }
  rect(c, cx, topY - 47, 1, 4, '#2a2a30');
}
const LH_X = 482, LH_TOP = 58;
const LIGHTHOUSE = {
  id: 'lighthouse', name: 'Kettle Point', sub: 'The old lighthouse', width: 640, horizon: 165, spawn: 52, minX: 16, maxX: 588,
  music: () => flag('lighthouseLit') ? 'sea' : 'eerie', ambience: { sea: 0.9, wind: 0.6 },
  fishSpot: 'lighthouse',
  weather: () => 'cloudy',
  ground: makeGround([[0, 224], [80, 224], [100, 226], [140, 220], [190, 210], [230, 206], [330, 204], [400, 200], [440, 196], [540, 196], [580, 200], [600, 230], [640, 250]]),
  build(c, sc) {
    const g = roughen(this.ground, 2);
    paintTerrain(c, 80, 640, g, (x, d, y) => x > 200 && x < 560 ? MAT.grass(x, d, y) : MAT.mossrock(x, d, y));
    for (let x = 0; x < 82; x += 20) rect(c, x + 4, 228, 4, 42, '#3e2a1a');
    paintTerrain(c, 0, 82, () => 224, MAT.planks, 229);
    // keeper's cottage: stone
    const kx = 214, kg = this.ground(260);
    for (let j = 0; j < 46; j++) for (let i = 0; i < 90; i++) {
      const row = Math.floor(j / 5), off = (row % 2) * 6;
      const mortar = j % 5 === 4 || (i + off) % 12 === 0;
      px(c, kx + i, kg - 46 + j, mortar ? '#5a5650' : rgbStr(mixRgb('#9a958c', '#7a766e', hash2(Math.floor((i + off) / 12), row))));
    }
    shingleBand(c, kx - 4, kg - 60, 98, 14, '#4a4e58', '#33363e');
    rect(c, kx - 5, kg - 47, 100, 2, '#33363e');
    drawWindow(c, kx + 12, kg - 36, 14, 12); drawWindow(c, kx + 64, kg - 36, 14, 12);
    sc.wins = [{ x: kx + 12, y: kg - 36, w: 14, h: 12 }, { x: kx + 64, y: kg - 36, w: 14, h: 12 }];
    rect(c, kx + 38, kg - 24, 12, 24, '#3a2a1e'); rect(c, kx + 37, kg - 25, 14, 1, '#2a2a2a');
    rect(c, kx + 70, kg - 66, 7, 8, '#6a625a');
    // barrel table with log
    drawBarrel(c, 334, this.ground(334)); rect(c, 329, this.ground(334) - 11, 10, 2, '#5a2a1e');
    drawTower(c, LH_X, this.ground(LH_X), LH_TOP);
    // fence
    for (let x = 540; x < 590; x += 8) rect(c, x, this.ground(x) - 9, 2, 9, '#c8c0b0');
    rect(c, 540, this.ground(560) - 7, 50, 1, '#c8c0b0');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(41, 9, 15, 95, 0.1, 'fair', 1600);
    sc.clouds.draw(w, cam, t * 4);
    const sil = rgbStr(mixRgb(skyColors(S.time, 'cloudy')[2], '#2a3a4a', 0.4));
    drawSilhouette(w, 'fog', 600 - cam * 0.2, 165, rgbStr(mixRgb(skyColors(S.time, 'cloudy')[2], '#c0c8d0', 0.5)), t);
    Sea.draw(w, 165, H, cam, t, 'north', S.time, { rough: 1.5 });
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 42 - cam, 239, t, { rough: 1.5 });
    if (flag('lighthouseLit') && !S.bottles.includes(4)) {
      const gy = this.ground(150);
      w.save(); w.translate(150 - cam, gy - 1); w.rotate(1.2);
      w.drawImage(sprite(['.k.', '.g.', 'ggg', 'gwg', 'ggg'], { k: '#5a3a1a', g: '#5aa86a', w: '#d8f8e0' }), -1, -3);
      w.restore();
      if (Math.floor(t * 3) % 3 === 0) px(w, 152 - cam, gy - 4, '#ffffff');
    }
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'north', 0, 140 - cam, cam); frontWater(w, 238, t, 'north', 590 - cam, W, cam); },
  emissive(c, sc, cam, t, nf) {
    if (!flag('lighthouseLit')) return;
    const lx = LH_X - cam, ly = LH_TOP - 17;
    c.globalAlpha = 0.9; rect(c, lx - 11, LH_TOP - 28, 23, 23, '#fff0b0'); c.globalAlpha = 1;
    if (nf > 0.2) {
      // sweeping beam
      const ang = Game.t * 0.9;
      const dir = Math.cos(ang);
      const len = 420 * Math.abs(dir);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.18 * nf;
      c.fillStyle = '#fff2c0';
      c.beginPath();
      c.moveTo(lx, ly);
      c.lineTo(lx + dir * len, ly - 30 * Math.sin(ang * 0.5) - 18);
      c.lineTo(lx + dir * len, ly + 30);
      c.closePath(); c.fill();
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
  },
  lights(sc, cam, t, nf) {
    const L = [];
    if (flag('lighthouseLit')) L.push({ x: LH_X - cam, y: LH_TOP - 17, r: 50, col: '#fff0a0', a: 0.7, always: true });
    if (sc.wins) for (const wi of sc.wins) L.push({ x: wi.x + 7 - cam, y: wi.y + 6, r: 16, col: '#ffb860', a: 0.35 });
    return L;
  },
  npcs: [{ id: 'bram', x: 280 }],
  objects: [
    boatObject(42, 'lighthouse'),
    {
      x: 150, r: 10, label: 'Pick up the bottle', when: () => flag('lighthouseLit') && !S.bottles.includes(4), act: async () => {
        S.bottles.push(4); setFlag('anyBottle'); Sound.sfx('pickup');
        await Dlg.narrate('A bottle, wedged between the rocks, sealed with candle wax. The note inside is written in pencil, in a hand you know very well.');
        await Dlg.narrate(LETTERS[4].body);
        await Dlg.say('you', "He's alive! Grandpa is ALIVE!");
        await Dlg.say('you', "An island inside the fog, west of the Teeth... I'm coming, Grandpa. Hold on.");
        Toast.show('Message saved to your Journal', 'bottle');
      },
    },
    { x: 280, label: 'Talk to Bram', act: () => talkBram() },
    {
      x: 334, r: 8, label: "Read the keeper's log", act: async () => {
        await Dlg.narrate('The keeper\'s log, written in big, shaky letters:');
        await Dlg.narrate('"Oct 11. A.H. passed west at dusk in the Margaret. Strange lights on the water, north-west. The lamp glass hummed all night."');
        await Dlg.narrate('"Oct 19. Oil low. Supply boat late."');
        await Dlg.narrate('"Oct 22. Lamp out. God help anyone at sea."');
        if (flag('lighthouseLit')) await Dlg.narrate('Below, a new entry, in even shakier letters: "LAMP LIT AGAIN. Thanks to the Hale child."');
      },
    },
    {
      x: LH_X, r: 10, label: 'Enter the lighthouse', act: async () => {
        if (!flag('bramMet')) { await Dlg.narrate('The door is unlocked. But someone is watching you from the cottage. Maybe you should say hello first.'); return; }
        Sound.sfx('door');
        Game.goto('lamproom', { x: 70 });
      },
    },
    { x: 560, r: 10, label: 'Fish from the cliff', act: sc => fishHere(sc, 568, 240, 1) },
  ],
  async onEnter() {
    if (!flag('lhVisit')) {
      setFlag('lhVisit');
      await wait(0.5);
      await Dlg.narrate('Kettle Point. The wind never stops here. The tall lighthouse stands dark and silent over the rocks.');
    }
  },
};

async function talkBram() {
  if (!flag('bramMet')) {
    setFlag('bramMet');
    await Dlg.say('bram', "Who's that? Speak up. My eyes aren't what they were. Nor my ears. Nor my knees, come to that.");
    await Dlg.say('you', "I'm Ansel Hale's grandchild. I'm looking for him.");
    await Dlg.say('bram', "Ansel's... Come here, let me see you. Oh. Oh, yes. You have the look of him.");
    await Dlg.say('bram', 'He was here. A month ago. Moored right where your boat is now. Said he was following the lights, out past the Teeth, into the fog wall.');
    await Dlg.say('bram', "I told him he was an old fool. He laughed and said, 'Keep the lamp lit for me, Bram. So I can find my way home.'");
    await Dlg.say('bram', 'And I did. For a week. Then the oil ran out, and the supply boat never came, and the lamp went dark.');
    await Dlg.say('bram', "Three weeks it's been dark. If he was trying to come home through that fog... he'd have had nothing to steer by.");
    await Dlg.say('bram', "I'm sorry, child. I'm so sorry.");
    await Dlg.say('you', "Then we light it again.");
    await Dlg.say('bram', "...With what? I've no oil, and the old wick has burned to nothing.");
    await Dlg.say('bram', "Hollis's store in Saltmere sells lamp oil. And a good wick... Mira on Coconut Isle twists the best rope and wick there is.");
    await Dlg.say('bram', "And if you mean to go through the Teeth, that reef will rip open a wooden hull like a letter. You'd need it made stronger. Bo the shipwright could do it, if anyone could.");
    Sound.sfx('quest');
    return;
  }
  if (flag('lighthouseLit')) {
    if (!flag('lantern')) {
      await Dlg.say('bram', 'I can feel it on my face, warm as the sun. The light! Thank you, child. Thank you.');
      await Dlg.say('bram', "Here. Take my storm lantern. I won't need it now that the big light is burning. It'll see you through that fog.");
      Inv.add('lantern'); setFlag('lantern'); Sound.sfx('quest');
      await Dlg.narrate("You hang the storm lantern on Pip's bow.");
      await Dlg.say('bram', 'Oh, and something washed up on the rocks by the dock this morning. A bottle. My eyes can\'t read whatever is in it. Maybe yours can.');
      return;
    }
    await Dlg.say('bram', flag('ironHull') ? "Through the Teeth, then into the fog. Keep the light behind you and you'll always find your way back. Go on. Bring him home." : "You'll want that hull of yours made stronger before you go anywhere near the Teeth. Bo will know what to do.");
    return;
  }
  if (Inv.has('oil') && Inv.has('wick')) { await Dlg.say('bram', "You found oil AND a wick? Bless you. Go on up. My legs can't manage those stairs any more. Pour in the oil, fit the wick, and light her up."); return; }
  await Dlg.say('bram', 'Lamp oil from Hollis in Saltmere. A wick from Mira on Coconut Isle. ' + (Inv.has('oil') ? "You've got the oil, good. Now the wick." : Inv.has('wick') ? "You've got the wick, good. Now the oil." : "Then we'll have light again."));
}

// ===========================================================================
// LAMP ROOM (top of the lighthouse)
// ===========================================================================
const LAMPROOM = {
  id: 'lamproom', name: 'The Lamp Room', width: 480, horizon: 196, indoor: true, spawn: 70, minX: 40, maxX: 440,
  music: () => flag('lighthouseLit') ? 'wonder' : 'eerie', ambience: { sea: 0.3, wind: 0.8 },
  weather: () => 'cloudy',
  ground: () => 226,
  build(c, sc) {
    rect(c, 0, 0, 480, 58, '#22242a');
    for (let i = 0; i < 480; i += 40) { line(c, 240, -20, i, 58, '#2e3038'); }
    rect(c, 0, 56, 480, 4, '#3a3c44');
    rect(c, 0, 176, 480, 50, '#4a3e30');
    for (let i = 0; i < 480; i += 40) { rect(c, i, 176, 1, 50, '#3a3026'); rect(c, i + 3, 180, 34, 1, '#5a4c3a'); }
    rect(c, 0, 176, 480, 3, '#6a5a44');
    for (let i = 0; i < 480; i += 60) rect(c, i, 60, 4, 116, '#2a2c32');
    rect(c, 0, 118, 480, 2, '#2a2c32');
    paintTerrain(c, 0, 480, () => 226, (x, d, y) => ((x + y) % 4 === 0 || d === 0) ? hexRgb('#3a3c44') : hexRgb(d < 2 ? '#5a5c64' : '#4a4c54'));
    // hatch
    rect(c, 34, 222, 32, 6, '#141418'); rect(c, 34, 220, 32, 2, '#6a5a44');
    for (let i = 0; i < 4; i++) rect(c, 40 + i * 6, 223 + i, 4, 1, '#5a4a38');
    // pedestal
    rect(c, 224, 188, 32, 38, '#6a5a44'); rect(c, 220, 186, 40, 3, '#8a7458'); rect(c, 220, 222, 40, 4, '#5a4a38');
    rect(c, 230, 196, 20, 2, '#d8b860');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(51, 10, 64, 150, 0.05, 'fair', 1600);
    sc.clouds.draw(w, 0, t * 5);
    drawSilhouette(w, 'fog', 380, 196, rgbStr(mixRgb(skyColors(S.time, 'cloudy')[2], '#c0c8d0', 0.4)), t);
    for (let i = 0; i < 10; i++) { const tx = 300 + i * 9; rect(w, tx, 192 - (i % 3), 3, 4 + (i % 3), '#2a2a2a'); }
    Sea.draw(w, 196, H, 0, t, 'north', S.time, { rough: 1.4 });
  },
  drawMid(w, sc, cam, t) {
    // Fresnel lens
    const cx = 240, top = 96;
    for (let j = 0; j < 90; j++) {
      const u = j / 90;
      const half = Math.round(26 * Math.sin(Math.PI * (0.15 + u * 0.75)) + 6);
      const ring = j % 6;
      const lit = flag('lighthouseLit');
      const col = ring === 0 ? '#c8a040' : lit ? (ring < 3 ? '#fff4c8' : '#f0d890') : (ring < 3 ? '#a8c8d0' : '#7a9aa8');
      w.globalAlpha = ring === 0 ? 1 : 0.85;
      rect(w, cx - half, top + j, half * 2, 1, col);
    }
    w.globalAlpha = 1;
    if (flag('lighthouseLit')) {
      const f = Math.floor(t * 9) % 3;
      ellipse(w, cx, 150, 4, 6 + f, '#ffffff');
    }
  },
  lights(sc, cam, t, nf) {
    if (!flag('lighthouseLit')) return [];
    return [{ x: 240, y: 145, r: 110, col: '#ffe8a0', a: 0.55, always: true, flicker: true }];
  },
  objects: [
    { x: 50, r: 14, label: 'Go back down', act: () => { Sound.sfx('door'); Game.goto('lighthouse', { x: LH_X }); } },
    {
      x: 240, r: 18, label: () => flag('lighthouseLit') ? 'Look at the lamp' : 'The great lamp', act: async () => {
        if (flag('lighthouseLit')) { await Dlg.narrate('The great lens hums with light. It is almost too bright to look at.'); return; }
        if (!(Inv.has('oil') && Inv.has('wick'))) {
          await Dlg.narrate('The great lens is cold and dusty. Inside, the burner is dry, and the old wick has burned down to a black stub.');
          await Dlg.narrate('You need ' + [!Inv.has('oil') ? 'lamp oil' : null, !Inv.has('wick') ? 'a new wick' : null].filter(Boolean).join(' and ') + '.');
          return;
        }
        await Dlg.narrate("You pour the lamp oil into the reservoir. You fit Mira's coconut-fibre wick into the burner and trim it neat.");
        await Dlg.narrate('Then you strike a match.');
        Inv.remove('oil'); Inv.remove('wick');
        setFlag('lighthouseLit');
        Sound.sfx('lamp');
        await Game.fadeTo(0.0, 0.01);
        Game.flash = 1;
        await wait(1.2);
        Sound.setMood('wonder');
        await Dlg.narrate('The flame catches. The great lens takes it, and doubles it, and doubles it again, and throws it out across the sea in a beam as wide as a road.');
        await Dlg.narrate('Kettle Point light is burning again.');
        await wait(0.4);
        await Dlg.narrate('The beam swings west, over the black rocks of the Teeth, and touches the wall of fog beyond...');
        Sound.whale(0.2);
        await Dlg.narrate("...and for one moment, inside the fog, you see it. The dark shape of an island. An island that isn't on any chart.");
        setFlag('hollowSeen');
        await Dlg.narrate('Far, far away, so faint you might have imagined it, a tiny orange light blinks back. Once. Twice. Three times.');
        await Dlg.say('you', 'Someone is out there.');
        Sound.sfx('quest');
      },
    },
    {
      x: 410, r: 16, label: 'Look west', act: async () => {
        if (flag('hollowSeen')) await Dlg.narrate('West, past the jagged Teeth, the fog sits on the sea. Every time the beam sweeps across it, you catch a glimpse of the hidden island.');
        else await Dlg.narrate('West, past a reef of jagged black rocks, a wall of fog sits on the sea. It never seems to move, no matter how the wind blows.');
      },
    },
  ],
};

// ===========================================================================
// HOLLOW ISLE (the island in the fog)
// ===========================================================================
const HOLLOW = {
  id: 'hollow', name: 'The Island in the Fog', width: 960, horizon: 165, spawn: 64, minX: 26, maxX: 935,
  music: () => flag('foundAnsel') ? 'night' : 'eerie', ambience: { sea: 0.5, wind: 0.2, fire: 0.2 },
  fishSpot: 'hollow',
  weather: () => flag('whaleFreed') ? 'clear' : 'fog',
  fogDensity: 0.55,
  ground: makeGround([[0, 250], [25, 238], [40, 229], [150, 228], [260, 226], [420, 224], [470, 214], [540, 200], [600, 198], [700, 198], [760, 204], [820, 222], [880, 229], [930, 232], [960, 250]]),
  build(c, sc) {
    const g = roughen(this.ground, 2);
    paintTerrain(c, 0, 960, g, (x, d, y) => x < 455 || x > 790 ? MAT.sand(x, d, y) : MAT.mossrock(x, d, y));
    // cave outcrop
    for (let x = 560; x < 760; x++) {
      const u = (x - 560) / 200;
      const top = 198 - Math.sin(u * Math.PI) * 78 - hash1(Math.floor(x / 4)) * 4;
      for (let y = Math.round(top); y < this.ground(x); y++) {
        const inCave = x > 620 && x < 712 && y > 150 + Math.pow((x - 666) / 46, 2) * 40;
        px(c, x, y, inCave ? (y > 190 ? '#141210' : '#1a1816') : rgbStr(MAT.rock(x, y - top, y)));
      }
    }
    // wreck of the Margaret
    const m = makeBoat({ type: 'margaret' });
    c.save(); c.translate(200, 226); c.rotate(0.22);
    c.drawImage(m.c, -m.c.width / 2, -m.wl - 2);
    c.restore();
    rect(c, 190, 214, 10, 6, '#1a1410');
    for (let i = 0; i < 5; i++) rect(c, 240 + i * 14, this.ground(240 + i * 14) - 2, 8, 2, '#5a4030');
    // footprints
    for (let x = 250; x < 460; x += 9) { px(c, x, this.ground(x) + 1, '#b09868'); px(c, x + 4, this.ground(x) + 2, '#b09868'); }
    // standing stones
    for (const [sx, sh] of [[332, 46], [380, 38]]) {
      const gy = this.ground(sx);
      for (let j = 0; j < sh; j++) { const hw = Math.round(5 + Math.sin(j / sh * Math.PI) * 2); rect(c, sx - hw, gy - j, hw * 2, 1, j > sh - 3 ? '#3a3a40' : (j % 7 === 0 ? '#22222a' : '#2a2a32')); }
      for (let k = 0; k < 4; k++) { line(c, sx - 6 + k * 4, gy - sh + 10, sx - 6 + k * 4, gy - sh + 18, '#8a7a5a'); px(c, sx - 6 + k * 4, gy - sh + 19, '#e8d8d0'); }
    }
    // rock pools
    for (const px_ of [290, 420]) ellipse(c, px_, this.ground(px_) + 2, 12, 2, '#1e3a40');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(61, 8, 20, 100, 0.1, 'fair', 1600);
    if (flag('whaleFreed')) sc.clouds.draw(w, cam, t * 2);
    Sea.draw(w, 165, H, cam, t, flag('whaleFreed') ? 'night' : 'fog', S.time, { noGlint: !flag('whaleFreed') });
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 44 - cam, 239, t, {});
    // fire in cave
    const fx = 676 - cam, fy = this.ground(676);
    for (let i = 0; i < 6; i++) {
      const hh = 3 + Math.round(5 * Math.abs(Math.sin(t * 7 + i * 1.3)));
      rect(w, fx - 6 + i * 2, fy - 2 - hh, 2, hh, i % 2 ? '#ff9a30' : '#ffd060');
    }
    for (let i = 0; i < 5; i++) { const ph = (t * 0.35 + i / 5) % 1; w.globalAlpha = 0.3 * (1 - ph); rect(w, fx + Math.sin(ph * 4 + i) * 3, fy - 12 - ph * 40, 3, 3, '#b8b8b8'); }
    w.globalAlpha = 1;
    // drying fish on a line
    line(w, 640 - cam, fy - 26, 704 - cam, fy - 24, '#8a7a5a');
    for (let i = 0; i < 4; i++) w.drawImage(fishSprite('cod'), 646 + i * 14 - cam, fy - 25);
  },
  drawFront(w, sc, cam, t) {
    frontWater(w, 238, t, flag('whaleFreed') ? 'night' : 'fog', 0, 40 - cam, cam);
    frontWater(w, 238, t, flag('whaleFreed') ? 'night' : 'fog', 935 - cam, W, cam);
  },
  emissive(c, sc, cam, t, nf) {
    for (const px_ of [290, 420]) {
      for (let i = 0; i < 5; i++) {
        const a = 0.5 + 0.5 * Math.sin(t * 2 + i + px_);
        c.globalAlpha = a; px(c, px_ - 9 + i * 4 - cam, this.ground(px_) + 2, i % 2 ? '#7ff7e8' : '#9cffb0'); c.globalAlpha = 1;
      }
    }
  },
  lights(sc, cam, t, nf) {
    return [
      { x: 676 - cam, y: this.ground(676) - 6, r: 56, col: '#ff9a40', a: 0.6, flicker: true, always: true },
      { x: 290 - cam, y: this.ground(290), r: 18, col: '#7ff7e8', a: 0.35, always: true },
      { x: 420 - cam, y: this.ground(420), r: 18, col: '#9cffb0', a: 0.35, always: true },
    ];
  },
  npcs: [{ id: 'ansel', p: 'anselRagged', x: 700, sit: true, when: () => !flag('foundAnsel'), left: true, facePlayer: false }, { id: 'ansel', p: 'anselRagged', x: 700, when: () => flag('foundAnsel') && !flag('whaleFreed') }],
  objects: [
    boatObject(44, 'hollow'),
    {
      x: 200, r: 22, label: 'Examine the wreck', act: async () => {
        await Dlg.narrate("A boat lies on its side, its hull split open on the rocks, half buried in sand. On the bow, in faded blue paint: MARGARET.");
        if (!flag('foundWreck')) {
          setFlag('foundWreck');
          await Dlg.say('you', "Grandpa's boat...");
          await Dlg.narrate('But there is no one aboard. And in the sand, leading away along the beach, there are footprints. Big boot prints, walking, not stumbling.');
        }
      },
    },
    { x: 356, r: 26, label: 'Look at the standing stones', act: () => Dlg.narrate('Tall black stones, smooth as glass. Someone has hung shells and twists of rope from them, like wind chimes. They clink softly in the fog.') },
    { x: 420, r: 10, label: 'Touch the glowing pool', act: async () => { Sound.sfx('hum'); await Dlg.narrate('You dip your fingers in. Tiny lights swirl around them, green and blue, like a galaxy in a puddle. Your fingers tingle.'); } },
    { x: 676, r: 8, label: 'Cook fish on the fire', when: () => flag('foundAnsel'), act: cookFish },
    { x: 700, r: 16, label: () => flag('foundAnsel') ? 'Talk to Grandpa' : 'Someone by the fire...', when: () => !flag('whaleFreed'), act: () => talkAnsel() },
    {
      x: 922, r: 14, label: 'Go to the cove', when: () => flag('foundAnsel') && !flag('whaleFreed'), act: async () => {
        const r = await Dlg.ask('anselR', "Ready, little gull? We'll take your boat out into the cove and wait for her. She comes when the moon is up.", ["Let's go", 'Not yet']);
        if (r !== 0) return;
        Game.goto('whale');
      },
    },
  ],
  async onEnter() {
    if (!flag('hollowVisit')) {
      setFlag('hollowVisit');
      await wait(0.6);
      await Dlg.narrate('The fog closes around you like a held breath. The waves are quiet here. Too quiet.');
      Sound.whale(0.18);
      await Dlg.narrate('Somewhere out in the grey, something enormous is breathing. Slow. Patient.');
      await Dlg.narrate('And somewhere on the island, a little way inland, you can smell woodsmoke.');
    }
  },
};

async function talkAnsel() {
  if (!flag('foundAnsel')) {
    await Dlg.say('anselR', "...Who's there? If you're another crab after my supper, I'm warning you, I've got a stick.");
    await Dlg.narrate('The figure by the fire turns around. A thin old man, with a wild white beard and a coat patched with sailcloth.');
    await Dlg.say('anselR', '...Little gull?');
    await Dlg.say('anselR', 'Is that... is that really you?');
    await Dlg.say('you', 'GRANDPA!');
    setFlag('foundAnsel');
    Sound.setMood('wonder');
    await Dlg.narrate("You don't remember crossing the sand. You only remember the scratch of his beard, and the smell of woodsmoke, and that he is laughing and crying at the same time.");
    await Dlg.say('anselR', 'Look at you. LOOK at you! You came through the Teeth? Through the fog? Your grandmother would have skinned me alive.');
    await Dlg.say('anselR', 'How in the world did you find me?');
    await Dlg.say('you', 'I followed your scratches on Gull Rock. And Mira told me you went west. And we lit Bram\'s lighthouse again, and I saw a light blink back.');
    await Dlg.say('anselR', "That was you? One night the fog turned gold, and I thought I was dreaming. I lit every bit of driftwood I had, just in case.");
    await Dlg.say('anselR', "Well. I suppose you want to know what happened to your silly old grandpa.");
    await Dlg.say('anselR', "The lights, little gull. The lights I've been chasing my whole life. I finally caught up with them.");
    await Dlg.say('anselR', "She's a whale. The oldest, biggest whale you ever saw in your life. And she glows, all over, like lanterns. Old Finn's Lantern Whale. Every word of that story was true.");
    await Dlg.say('anselR', 'She was caught in a ghost net. Miles of old drift net, wrapped round her tail. Every night she was calling for help. That humming we heard? That was her.');
    await Dlg.say('anselR', 'I followed her out here and cut away what I could. But then the fog came down, and the Teeth took the Margaret, and I washed up on this beach with a sore head and no boat.');
    await Dlg.say('anselR', "And she's been looking after me ever since. A fish on the sand every morning. Can you imagine?");
    await Dlg.say('anselR', "But there's still net wrapped round her tail. She can't dive deep. I couldn't reach it from the shore, and I couldn't leave her like that.");
    await Dlg.say('anselR', 'With your boat, though... we could reach her. Tonight, when she comes into the cove. Will you help me, little gull?');
    const r = await Dlg.ask('anselR', 'Will you help me free her?', ['Of course!', '...Will she eat us?'], { cancel: false });
    if (r === 1) await Dlg.say('anselR', "Ha! She eats krill, not grandchildren. Mostly krill. Almost entirely krill.");
    await Dlg.say('anselR', "That's my brave gull. When you're ready, go along the beach to the cove on the east side. I'll meet you there.");
    await Dlg.say('anselR', "Oh, and take some fish. She brings me far more than one old man can eat.");
    Inv.add('cooked', 3);
    return;
  }
  const lines = [
    "She comes into the cove when the moon is up. When you're ready, go east along the beach.",
    "I kept a list of every fish she brought me. Two hundred and six. I named them all.",
    "Your grandmother saw her too, you know. The summer we married. She said the lights were the sea's way of saying thank you.",
  ];
  await Dlg.say('anselR', lines[(S.f.ansel = (S.f.ansel || 0) + 1) % lines.length]);
}

function registerPlaces() {
  for (const def of [COTTAGE, VILLAGE, GULL, PEARL, COCONUT, LIGHTHOUSE, LAMPROOM, HOLLOW]) Game.scenes[def.id] = new Place(def);
}
