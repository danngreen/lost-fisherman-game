'use strict';
// ---------------------------------------------------------------------------
// Chapter III: The Red Sail
// Summer. Greta lifts Grandpa's sea ban, the Glass Floe thaws, and Maggie's
// boat the Wren drifts free. Bring her home, restore her, and follow Maggie's
// sketchbook to the brother she left behind.
// (Places in the Skerries, Toby, the regatta and the ending are in chapter3b.js)
// ---------------------------------------------------------------------------

Object.assign(ITEMS, {
  postcard: { name: "Ylva's Postcard", type: 'key', desc: 'A puffin on the front. On the back: "The Glass Floe has melted! There is a little boat with a red sail drifting loose in it. Come quick! Y."' },
  towline: { name: 'Tow Line', type: 'key', desc: "Forty fathoms of Bo's best rope. Strong enough to tow a boat home." },
  hkey: { name: 'Hartley House Key', type: 'key', desc: "A big iron key on a loop of string. Oskar kept it for fifty years." },
  sketchbook: { name: "Maggie's Sketchbook", type: 'key', desc: 'Pencil drawings of places in the north, with notes on the back. Find where each one was drawn. (See your Journal.)' },
  famphoto: { name: 'Family Photograph', type: 'key', desc: 'A stern man, a scowling girl, and a little boy holding her hand. On the back: "John, Margaret and Tobias. 1972."' },
  tar: { name: 'Bucket of Tar', type: 'key', desc: 'Thick, sticky pine tar from the Hookness net shed, for sealing the seams of a boat.' },
  spar: { name: 'Spruce Spar', type: 'key', desc: 'A long, straight spruce pole. It would make a fine mast for a small boat.' },
  sailcloth: { name: 'Bolt of Sailcloth', type: 'key', desc: 'Stiff white canvas, for a new sail.' },
  pollock: { name: 'Pollock', type: 'fish', price: 6 },
  seatrout: { name: 'Sea Trout', type: 'fish', price: 11 },
  lumpfish: { name: 'Lumpfish', type: 'fish', price: 9, desc: 'A round, knobbly little fish that looks very surprised.' },
});

FISH_TABLES.summer = [['mackerel', 38], ['pollock', 30], ['herring', 20], ['seatrout', 12], ['boot', 3]];
FISH_TABLES.north3 = [['herring', 24], ['haddock', 28], ['char', 24], ['halibut', 12], ['pollock', 10]];
FISH_TABLES.skerry = [['lumpfish', 30], ['seatrout', 30], ['pollock', 25], ['cod', 15]];

CHAPTER_SETUP[3] = st => {
  st.coins = 25;
  st.boat = 'big';
  st.vessel = 'pip';
  st.f = { ironHull: 1, lantern: 1, lighthouseLit: 1, voyageTut: 1, iceBow: 1, northChart: 1 };
  st.inv = { rod: 1, knife: 1, sweater: 1, bread: 2 };
  st.time = 9;
  st.loc = 'c3_village'; st.px = 1150;
};

// ---------------- Maggie's sketchbook ----------------
// Each drawing was made from one spot. Stand there and hold it up.
const SKETCHES = [
  {
    t: 'The cannery', todo: 'A long tin shed with a tall chimney', scene: 'c3_cannery', x: 104,
    hint: 'A long tin shed with a smoking chimney, drawn from out on the water. Hookness, from the end of its pier?',
    body: "Father's cannery, from the end of the pier. Toby caught his first fish here today. Well. His first boot. He was so proud of it that he slept with it. M.",
  },
  {
    t: 'The stacks', todo: 'Tall rocks and a little hut', scene: 'c3_puffin', x: 318,
    hint: 'Tall rock towers covered in birds, and a little hut on the lowest one. Drawn from up near the hut.',
    body: "Sigrid let us count her puffins. I got to 3,002. Toby got to eleven, then said every puffin was called Kevin and counted them all as one. Sigrid laughed so hard she had to sit down. M.",
  },
  {
    t: 'The lighthouse', todo: 'A lighthouse on a cliff', scene: 'c3_lighthouse', x: 556,
    hint: 'A lighthouse on a cliff, drawn from the edge of the cliff beside it.',
    body: "Kettle Point. The farthest south I have ever sailed the Wren. The keeper gave me soup and told me to go home. One day I'll keep going, all the way to where the sea is warm. M.",
  },
  {
    t: 'The floe', todo: 'Wide ice and a seal pup', scene: 'c3_floe', x: 214,
    hint: 'Wide flat ice, and a seal pup looking up at the artist. Drawn standing on the ice.',
    body: "The Glass Floe. Toby wanted to take the seal pup home in his coat. I told him its mother would miss it. He said, \"Would you miss me?\" I said, \"Every single minute.\" M.",
  },
  {
    t: 'The sleeping dog', todo: 'A rock like a sleeping dog, with seals', scene: 'seal', x: 300,
    hint: 'A rock shaped like a big sleeping dog, covered in seals. Nowhere you have been yet.',
    body: "Seal Skerry. Toby has named every single seal. That one is Duchess. That one is Mr Puddle. That one is ALSO Duchess. M.",
  },
  {
    t: 'The last rock', todo: 'A white tower on a lonely rock', scene: 'nessend', x: 196,
    hint: 'A white tower with a red band on a lonely rock. Nowhere you have been yet.',
    body: "Ness End. The last rock in the world. When I am grown up I will live here, at the end of everything, and nobody will tell me what to do. Toby can visit if he brings biscuits. M.",
  },
];

JOURNAL_COLLECTIONS[3] = { title: "Maggie's sketchbook", hint: 'Find the spot where each drawing was made and hold it up.', icon: 'sketchbook', list: SKETCHES, showAll: true, when: () => Inv.has('sketchbook') };

// a "hold up the sketch" spot for each scene that has a drawing
function sketchSpots(sceneId) {
  return SKETCHES.map((s, i) => s.scene !== sceneId ? null : {
    x: s.x, r: 14, label: "Hold up Maggie's sketch", when: () => Inv.has('sketchbook') && !S.bottles.includes(i), act: sc => matchSketch(sc, i),
  }).filter(Boolean);
}

async function matchSketch(sc, i) {
  const s = SKETCHES[i];
  sc.player.x = s.x; sc.player.facing = 1;
  await Dlg.narrate('You flip through the sketchbook and hold a drawing up against the view...');
  Game.hudHidden = true;
  GoalNote.cur = null;
  await wait(0.2);
  Sketch.start('M.H.');
  Sound.sfx('lamp');
  await wait(1.8);
  await Dlg.narrate("It's a perfect match. She stood right here.");
  await Dlg.narrate('On the back, in small neat writing: "' + s.body + '"');
  Sketch.stop();
  Game.hudHidden = false;
  S.bottles.push(i);
  Toast.show('Sketch ' + S.bottles.length + ' of ' + SKETCHES.length + ' found', 'sketchbook');
  if (flag('anselCrew')) await Dlg.say('ansel', ANSEL_SKETCH[i]);
}
const ANSEL_SKETCH = [
  "Her little brother and a boot. Ha! She never once told me she had a brother, you know. Not once.",
  "Every puffin was called Kevin... Oh, I'd have liked that boy.",
  "Kettle Point! She sailed all the way to Kettle Point, alone, in that little thing? At fifteen? ...Of course she did.",
  "'Every single minute.' ...She must have missed him terribly, all those years.",
  "Duchess and Mr Puddle. He sounds like a funny little lad. I wonder what happened to him.",
  "The end of everything. She ended up at the other end instead. With me. I hope it was a fair swap.",
];

// ---------------- the summer sea ----------------
const LOCS3 = {
  saltmere: { name: 'Saltmere', x: 66, y: 214, scene: 'c3_village', dock: 1150, sil: 'town' },
  lighthouse: { name: 'Kettle Point', x: 150, y: 172, scene: 'c3_lighthouse', dock: 52, sil: 'lighthouse' },
  puffin: { name: 'Puffin Stacks', x: 262, y: 142, scene: 'c3_puffin', dock: 52, sil: 'stacks' },
  cannery: { name: 'Hookness', x: 112, y: 78, scene: 'c3_cannery', dock: 60, sil: 'cannery' },
  floe: { name: 'The Glass Floe', x: 268, y: 60, scene: 'c3_floe', dock: 56, sil: 'ice' },
  seal: { name: 'Seal Skerry', x: 330, y: 190, scene: 'seal', dock: 56, sil: 'skerry' },
  eider: { name: 'Eider Holm', x: 370, y: 158, scene: 'eider', dock: 56, sil: 'holm' },
  nessend: { name: 'Ness End', x: 420, y: 124, scene: 'nessend', dock: 56, sil: 'tower' },
};
const ROUTES3 = {
  'saltmere-lighthouse': 2, 'lighthouse-puffin': 1, 'saltmere-puffin': 3, 'lighthouse-cannery': 2, 'puffin-cannery': 1,
  'puffin-floe': 2, 'cannery-floe': 1, 'saltmere-cannery': 3, 'saltmere-floe': 4, 'lighthouse-floe': 3,
  'puffin-seal': 1, 'puffin-eider': 2, 'seal-eider': 1, 'eider-nessend': 1, 'seal-nessend': 2,
};
const SOUTH3 = ['saltmere', 'lighthouse'];
const SKERRIES = ['seal', 'eider', 'nessend'];

CHAPTERS[3] = {
  home: 'saltmere', locs: LOCS3, routes: ROUTES3,
  locKnown(id) { return SKERRIES.includes(id) ? flag('skerriesChart') : true; },
  routeBlock(from, to, cost) {
    if (cost === null) return SKERRIES.includes(to) ? 'The Skerries are a maze. The only way in is past the Puffin Stacks.' : 'Too far from here.';
    if (SKERRIES.includes(to) && S.vessel !== 'wren') return "The channels in the Skerries are too shallow for Pip. You'd need a much smaller boat.";
    return null;
  },
  chartDeco(c, t, x0, y0, w, h) {
    // mainland along the west and north
    for (let j = 0; j < h; j++) {
      const cx = 30 + Math.sin(j * 0.06) * 8 + Math.sin(j * 0.19) * 3 + (j < 90 ? (90 - j) * 0.5 : 0);
      rect(c, x0, y0 + j, cx, 1, '#a8b07a');
      rect(c, x0 + cx, y0 + j, 1, 1, '#5a4a30');
    }
    for (let i = 0; i < w; i++) {
      const cy = 14 + Math.sin(i * 0.05) * 4 + Math.sin(i * 0.17) * 2;
      rect(c, x0 + i, y0, 1, cy, '#d8e8ee');
      px(c, x0 + i, y0 + cy, '#8aa8b8');
    }
    // the summer ice is mostly gone: a few floes left in the north
    for (let i = 0; i < 30; i++) { const ix = 220 + hash1(i) * 200, iy = 30 + hash2(i, 2) * 40; ellipse(c, ix, iy, 2, 1, '#e8f4f8'); }
    drawText(c, 'Open water!', 300, 22, '#6a8a9a');
    // the Skerries: a scatter of islets, mostly unknown
    const known = flag('skerriesChart');
    for (let i = 0; i < (known ? 46 : 18); i++) {
      const ix = 300 + hash1(i + 50) * 140, iy = 110 + hash2(i, 9) * 96;
      if (Math.hypot(ix - 420, iy - 205) < 26) continue;
      ellipse(c, ix, iy, 1 + Math.floor(hash1(i) * 2), 1, '#9a9a7a');
    }
    if (known) drawText(c, 'The Skerries', 340, 98, '#6a5a40');
    else drawText(c, '?', 380, 160, '#8a7a60');
  },
  departure() { return null; },
  voyageStyle(from, to) {
    const north = !(SOUTH3.includes(from) && SOUTH3.includes(to));
    const sk = SKERRIES.includes(from) || SKERRIES.includes(to);
    const icy = from === 'floe' || to === 'floe';
    return {
      rough: north ? 1.1 : 1, clouds: 'fair', wind: 0.4, mood: null,
      weather: () => S.day % 3 === 0 && north ? 'cloudy' : 'clear',
      pal: () => north ? 'arctic' : 'north',
      rocks: L => sk ? { n: Math.floor(L / (flag('pimMap') ? 320 : 170)), until: 1, big: 0.3 } : { n: Math.floor(L / 650), until: 1, big: 0 },
      ice: icy ? 2.5 : 0, kelp: sk ? 3 : 0,
      bottles: false, glow: null, bergs: icy,
      fishSpot: sk ? 'skerry' : north ? 'north3' : 'summer',
      intro: sk && !flag('skerryTip') ? (setFlag('skerryTip'), 'The Skerries: rocks everywhere, and kelp that grabs at the rudder. Slow and steady!') : null,
      riders: c3Riders,
      chatter: () => flag('anselCrew') ? c3Chatter() : null,
      onArrive(dest, v) {
        if (!v.tow) return false;
        Game.goto('c3_village', { x: 1150, towHome: true, banner: false });
        return true;
      },
    };
  },
};

function c3Riders() {
  const r = [PEOPLE.player.top];
  if (flag('anselCrew')) r.push(PEOPLE.ansel.top);
  if (flag('tobyAboard')) r.push(PEOPLE.toby.top);
  return r;
}

const ANSEL_CHATTER = [
  "Grandpa: Fifty years since I sailed north. The sea hasn't changed a bit. I have.",
  "Grandpa: Your grandmother could smell a storm a day away. I can smell Tam's chip pan from here.",
  "Grandpa: Mind the swell, little gull. Gently does it.",
  "Grandpa: Did I ever tell you about the time I caught a halibut as big as a door?",
  "Grandpa: Greta would have a fit if she saw me now. Ha!",
  "Grandpa: Look at you steer. Like you were born on a boat.",
];
function c3Chatter() {
  if (Math.random() < 0.4) return null;
  S.f.chat3 = ((S.f.chat3 || 0) + 1) % ANSEL_CHATTER.length;
  return ANSEL_CHATTER[S.f.chat3];
}

// ---------------- objectives ----------------
CHAPTER_OBJECTIVES[3] = () => {
  const o = [];
  if (flag('ended')) return ['Maggie came home.'];
  if (!flag('openingDone')) return ['Meet Grandpa and Greta at the end of the pier.'];
  if (!flag('wrenHome')) {
    if (!Inv.has('towline')) o.push('Ask Bo for a tow line, to bring the Wren home.');
    if (!Inv.has('hkey') && !flag('hartleyIn')) o.push('Ask Oskar about the old Hartley house at Hookness.');
    if (Inv.has('towline')) o.push('Sail to the Glass Floe and tow the Wren home. Pack food: it is a long way.');
  }
  if (Inv.has('hkey') && !flag('hartleyIn')) o.push("Visit the Hartley house at Hookness. Maggie's room is in the attic.");
  if (Inv.has('famphoto') && !flag('oskarToby')) o.push('Ask Oskar in Saltmere about the little boy in the photograph.');
  if (flag('wrenHome') && !flag('wrenReady')) {
    if (!flag('wrenFixed')) {
      if (!flag('boList')) o.push('Ask Bo what the Wren needs.');
      else {
        if (!Inv.has('spar')) o.push('Find a spar for a new mast. Bram at Kettle Point might have one.');
        if (!Inv.has('tar')) o.push('Fetch tar from the net shed at Hookness.');
        if (!Inv.has('sailcloth')) o.push('Buy sailcloth from Hollis (20 coins).');
        if (Inv.has('spar') && Inv.has('tar') && Inv.has('sailcloth')) o.push('Bring everything to Bo.');
      }
    } else if (!flag('wrenNamed')) o.push('The Wren needs her name painted back on. Nell would love to help.');
    else o.push('Sleep. Bo says the paint will be dry by morning.');
  }
  if (Inv.has('sketchbook') && !flag('skerriesChart')) o.push('Two sketches show places you don\'t know. Ylva at the Puffin Stacks knows these waters.');
  if (flag('skerriesChart') && !flag('tobyMet')) {
    if (!flag('wrenReady')) o.push('The Skerries are too shallow for Pip. Get the Wren ready to sail.');
    else if (!flag('seal3') && !flag('eider3') && !flag('ness3')) o.push('Sail the Wren into the Skerries, east of the Puffin Stacks.');
    else o.push('Find the white tower at Ness End, the last rock of the Skerries.');
  }
  if (typeof c3LateObjectives === 'function') c3LateObjectives(o);
  if (Inv.has('sketchbook') && S.bottles.length < SKETCHES.length && o.length < 2) o.push("Find the places in Maggie's sketchbook (" + S.bottles.length + '/' + SKETCHES.length + ').');
  if (!o.length) o.push('Enjoy the summer.');
  return o;
};

// ---------------- extra people ----------------
function addAnsel(npcs, x) { return npcs.concat([{ id: 'ansel', x, when: () => flag('anselCrew') }]); }
function anselObject(x, place) { return { x, r: 12, label: 'Talk to Grandpa', when: () => flag('anselCrew'), act: () => c3AnselAt(place) }; }

async function c3AnselAt(place) {
  const L = {
    puffin: ["Look at them all, bowing to each other like little waiters. Nell was right.", "Maggie said once she missed the sound of puffins in the morning. I thought she was joking. Rosa did too."],
    cannery: ["So this is Hookness. Fifty years ago I'd have been chased off this pier with a herring fork.", "She grew up here. In that big grey house. It's so quiet."],
    floe: ["This is where I found her. Right about... there. Half frozen, and still scowling.", "It's strange, seeing the floe melted. Like an old friend with a new haircut."],
    lighthouse: ["Bram's light, burning bright. Your doing, that.", "Kettle Point. I came round this headland a thousand times and never knew she'd been here first."],
    attic: ["Her room. Her actual room. I feel like I should take my boots off.", "Look at the view from that window. You can see the whole bay. She'd have watched the whales from up here."],
    default: ["Lead on, Captain.", "I'm right behind you, little gull."],
  }[place] || ["Lead on, Captain."];
  await Dlg.say('ansel', L[(S.f['ansel_' + place] = (S.f['ansel_' + place] || 0) + 1) % L.length]);
}

// ---------------- Saltmere in summer ----------------
const C3_VILLAGE = Object.assign({}, VILLAGE, {
  id: 'c3_village', name: 'Saltmere', sub: 'Summer',
  build(c, sc) {
    VILLAGE.build.call(this, c, sc);
    // window boxes full of flowers
    for (const wi of sc.wins) {
      if (wi.y < 160) continue;
      rect(c, wi.x - 2, wi.y + wi.h + 2, wi.w + 4, 3, '#6a4428');
      for (let i = 0; i < wi.w + 4; i += 2) px(c, wi.x - 2 + i, wi.y + wi.h + 1 - (i % 4 ? 0 : 1), ['#e85a7a', '#f2c94c', '#ffffff', '#c86ad8'][(i / 2) % 4]);
    }
    // the boat on Bo's trestles is gone: they're waiting for the Wren
    const old = makeBoat({ type: 'sail' });
    c.clearRect(716, 186, old.c.width + 4, 20);
    rect(c, 722, 206, 4, 16, '#5a4028'); rect(c, 760, 206, 4, 16, '#5a4028'); rect(c, 718, 206, 50, 2, '#6a4a30');
    drawLampPost(c, 780, 222);
    // maypole-style bunting posts along the front
    for (const x of [140, 460, 700, 1000]) { rect(c, x, 150, 2, 72, '#7a5a3a'); px(c, x, 149, '#f2c94c'); }
  },
  drawMid(w, sc, cam, t) {
    VILLAGE.drawMid.call(this, w, sc, cam, t);
    drawBunting(w, 141 - cam, 152, 461 - cam, 152, t, 0);
    drawBunting(w, 461 - cam, 152, 701 - cam, 152, t, 2);
    drawBunting(w, 701 - cam, 152, 1001 - cam, 152, t, 4);
    // the Wren on the trestles at Bo's, or moored at the pier
    if (flag('wrenHome') && !flag('wrenReady')) {
      const b = makeBoat({ type: 'wren', sail: flag('wrenFixed') ? 'white' : 'none' });
      w.drawImage(b.c, Math.round(743 - cam - b.c.width / 2), 207 - b.wl - 2);
      if (flag('wrenNamed')) drawText(w, 'WREN', 748 - cam, 199, '#e8e0d0');
    }
    if (flag('tobyArrived') && typeof c3RegattaMid === 'function') c3RegattaMid(w, sc, cam, t);
  },
  drawFront(w, sc, cam, t) {
    const px0 = 1036 - cam;
    if (px0 < W) {
      // Pip, and the Wren once she's ready
      if (S.boat) drawBoat(w, { type: S.boat, iron: flag('ironHull'), lantern: flag('lantern'), iceBow: flag('iceBow') }, 1150 - cam, 241, t, {});
      if (flag('wrenReady')) drawBoat(w, { type: 'wren', sail: flag('redSail') ? 'red' : 'white' }, 1092 - cam, 241, t, { phase: 30 });
      frontWater(w, 240, t, 'north', px0, W, cam);
    }
    // the whales come into the harbour for the bonfire
    sc.backs = flag('bonfire') ? drawWhaleBacks(w, 1080 - cam, 258, t, true) : null;
  },
  npcs: [
    { id: 'rosa', x: 214 }, { id: 'hollis', x: 326 }, { id: 'finn', x: 418, sit: true, facePlayer: false },
    { id: 'oskar', x: 432, sit: true, facePlayer: false, when: () => !flag('regattaDay') },
    { id: 'tam', x: 512 }, { id: 'bo', x: 690 }, { id: 'greta', x: 856 }, { id: 'nell', x: 968 },
    { id: 'ansel', x: 1180, when: () => !flag('openingDone') },
    { id: 'greta', x: 1200, when: () => !flag('openingDone') },
    { id: 'ansel', x: 1122, when: () => flag('openingDone') },
  ],
  objects: [
    { x: 75, r: 10, label: "Enter Grandpa's cottage", act: () => { Sound.sfx('door'); Game.goto('c3_cottage', { x: 440, facing: -1 }); } },
    { x: 214, label: 'Talk to Rosa', act: () => c3Rosa() },
    { x: 326, label: 'Talk to Hollis', act: () => c3Hollis() },
    { x: 418, r: 6, label: 'Talk to Old Finn', act: () => c3Finn() },
    { x: 432, r: 6, label: 'Talk to Oskar', when: () => !flag('regattaDay'), act: () => c3Oskar() },
    { x: 512, label: 'Talk to Tam', act: () => c3Tam() },
    { x: 690, label: 'Talk to Bo', act: () => c3Bo() },
    { x: 744, r: 16, label: 'Look at the Wren', when: () => flag('wrenHome') && !flag('wrenReady'), act: () => c3LookWren() },
    { x: 856, label: 'Talk to Greta', when: () => !flag('regattaDay'), act: () => c3Greta() },
    { x: 968, label: 'Talk to Nell', act: () => c3Nell() },
    { x: 1190, r: 14, label: 'Talk to Grandpa and Greta', when: () => !flag('openingDone'), act: () => c3Opening() },
    { x: 1122, r: 8, label: 'Talk to Grandpa', when: () => flag('openingDone'), act: () => c3AnselHome() },
    { x: 1092, r: 12, label: 'Board the Wren', when: () => flag('wrenReady') && !flag('regattaDay'), act: async () => { S.vessel = 'wren'; await setSail('saltmere'); } },
    { x: 1150, r: 16, label: 'Board Pip', when: () => flag('openingDone') && !flag('regattaDay'), act: async () => { S.vessel = 'pip'; await setSail('saltmere'); } },
    { x: 1228, r: 10, label: 'Fish off the pier', when: () => flag('openingDone'), act: sc => fishHere(sc, 1230, 246, 1) },
  ],
  async onEnter(sc, p) {
    if (p.towHome) await c3TowHome();
    else if (p.opening) {
      Game.hudHidden = true;
      await wait(0.8);
      await Dlg.narrate('Summer in Saltmere. Bunting flaps between the lamp posts, and everyone is talking about the Midsummer Regatta.');
      await Dlg.narrate('At the end of the pier, Grandpa is standing very straight, like a schoolboy, while Greta reads from an official-looking piece of paper.');
      Game.hudHidden = false;
    }
    if (typeof c3VillageEnter === 'function') await c3VillageEnter(sc, p);
  },
});

async function c3Opening() {
  Game.hudHidden = true;
  await Dlg.say('greta', "Ahem. 'By order of the Harbourmaster of Saltmere: Ansel Hale is hereby permitted to go back to sea.'");
  await Dlg.say('greta', "'On the condition that he is SUPERVISED.' ...She looks straight at you. 'Very supervised.'");
  await Dlg.say('ansel', "Ha! Did you hear that, little gull? I'm a free man!");
  await Dlg.say('greta', "A SUPERVISED free man. Oh, and this came for you on the post boat. From up north.");
  Inv.add('postcard'); Sound.sfx('pickup');
  await Dlg.narrate('A postcard with a puffin on the front. On the back, in big excited letters:');
  await Dlg.narrate('"The Glass Floe has melted for the first time in fifty years! There is a little boat with a red sail drifting loose in it. Come quick! Ylva. P.S. 4,231 puffins."');
  await Dlg.say('ansel', "...The Wren. Maggie's boat. Floating free, after all this time.");
  await Dlg.say('ansel', "Little gull. Let's go and get her. Let's bring her home where she belongs. You and me.");
  await Dlg.say('greta', "You'll need a good long rope to tow a boat that far. Bo has the best rope in Saltmere.");
  await Dlg.say('ansel', "And while we're up there... I'd like to see where she grew up. Hookness. Oskar might know a way in to the old Hartley house.");
  setFlag('openingDone'); setFlag('anselCrew');
  Sound.sfx('quest');
  Toast.show('Grandpa joined your crew!', 'cap');
  Game.hudHidden = false;
}

async function c3AnselHome() {
  if (flag('tobyStory') && !Inv.has('letters') && !flag('lettersGiven')) { await Dlg.say('ansel', "Her trunk, little gull. Up in our attic. All those old letters I never read, because they weren't mine to read. I think... I think they were never meant for me."); return; }
  const lines = [
    !flag('wrenHome') ? "The Glass Floe is four legs of food from here. Catch plenty and cook it, or buy bread from Rosa." : "Look at her up on Bo's trestles. Just like the day I first saw her, stuck in the ice.",
    "Greta keeps waving at me. I keep waving back. I don't think she's waving.",
    "Board whichever boat you like, little gull. I'm crew. Crew goes where the captain goes.",
  ];
  await Dlg.say('ansel', lines[(S.f.ansel3 = (S.f.ansel3 || 0) + 1) % lines.length]);
}

async function c3TowHome() {
  Game.hudHidden = true;
  await wait(0.6);
  setFlag('wrenHome');
  Inv.remove('towline');
  await Dlg.narrate('Word travels fast. By the time Pip rounds the harbour wall with the Wren bobbing behind her on the tow line, half of Saltmere is out on the pier.');
  await Dlg.narrate('Bo and Tam haul the little boat up the slipway and set her on the trestles outside the boatyard. Her paint is gone, her mast is cracked, and her sail is rotten through.');
  await Dlg.say('ansel', "Fifty years in the ice. And she's still in one piece. Just like your grandmother.");
  await Dlg.say('bo', "She's a tough little thing. Hookness-built. Give me a good look at her and I'll tell you what she needs.");
  Game.hudHidden = false;
}

async function c3LookWren() {
  if (flag('wrenFixed')) { await Dlg.narrate(flag('wrenNamed') ? 'The Wren, freshly painted, with WREN in neat white letters on her bow. The paint is still tacky.' : 'The Wren has a new mast, a new sail, and new tar in every seam. But her bow is bare. She needs her name back.'); return; }
  await Dlg.narrate('The Wren up on the trestles: a little blue boat, no longer than a rowboat, with a cracked mast and the rags of a red sail. On her bow, a ghost of letters: W . E N.');
}

async function c3Rosa() {
  let sel = 0;
  while (true) {
    const items = [{ label: 'Buy bread', right: '4c', id: 'bread', desc: 'Food for one leg of a voyage.', disabled: S.coins < 4, whyNot: 'Not enough coins.' }];
    if (typeof c3RosaExtra === 'function') c3RosaExtra(items);
    items.push({ label: 'Chat', id: 'chat' }, { label: 'Leave', id: 'leave' });
    const i = await Menu.list({ title: "Rosa's Bakery", subtitle: S.coins + ' coins', items, w: 240, sel: Math.min(sel, items.length - 1) });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'bread') { S.coins -= 4; Inv.add('bread'); Sound.sfx('coin'); }
    else if (id === 'chat') await Dlg.say('rosa', flag('wrenHome') ? "Margaret's own little boat, here in Saltmere! I keep walking past the boatyard just to look at her." : "Midsummer buns! Saffron and raisins. I've been baking since four. Your grandfather has eaten six.");
    else if (items[i].buy) await items[i].buy();
  }
}

async function c3Hollis() {
  let sel = 0;
  while (true) {
    const items = [];
    if (flag('boList') && !flag('wrenFixed')) items.push({ label: 'Bolt of sailcloth', right: '20c', id: 'sailcloth', desc: 'Good stiff canvas for a small sail.', disabled: S.coins < 20 || Inv.has('sailcloth'), whyNot: Inv.has('sailcloth') ? 'One bolt is plenty.' : 'Not enough coins.' });
    items.push({ label: 'Lucky lure', right: '25c', id: 'lure', desc: 'Fish bite faster and are easier to keep on the line.', disabled: S.coins < 25 || Inv.has('lure'), whyNot: Inv.has('lure') ? 'You already have one.' : 'Not enough coins.' });
    items.push({ label: 'Chat', id: 'chat' }, { label: 'Leave', id: 'leave' });
    const i = await Menu.list({ title: 'Hollis & Co.', subtitle: S.coins + ' coins', items, w: 240, sel: Math.min(sel, items.length - 1) });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'sailcloth') { S.coins -= 20; Inv.add('sailcloth'); Sound.sfx('coin'); await Dlg.say('hollis', 'Sailcloth. For the little Hookness boat? I shall give you the good bolt. Not the bolt the mice got at.'); }
    if (id === 'lure') { S.coins -= 25; Inv.add('lure'); Sound.sfx('coin'); }
    if (id === 'chat') await Dlg.say('hollis', ["Regatta entries close on Midsummer Day. Not that I sail. I prefer my water in a cup.", "Summer fish are worth a pretty penny. Sea trout especially. Tam will tell you the same, louder."][(S.f.hollis3 = (S.f.hollis3 || 0) + 1) % 2]);
  }
}

async function c3Tam() {
  if (!flag('tam3')) {
    setFlag('tam3');
    await Dlg.say('tam', "Summer fishing! Mackerel by the bucket, pollock, sea trout if you're lucky. And up in those Skerries, so they say, little lumpfish that look like they've just been told a joke.");
  }
  if (typeof c3TamLate === 'function' && await c3TamLate()) return;
  await talkTam();
}

async function c3Finn() {
  const lines = [
    "Oskar says Hookness herring are the best herring. I say Saltmere herring. We have been saying it since breakfast.",
    flag('wrenHome') ? "Hookness boats are built short and deep, for short steep seas. That little Wren will go anywhere a duck can." : "The ice melted at the Glass Floe? In my day that ice was as old as the hills. Well. So am I.",
    "Midsummer Regatta! Ansel and I raced it every year. He won once. I let him.",
  ];
  await Dlg.say('finn', lines[(S.f.finn3 = (S.f.finn3 || 0) + 1) % lines.length]);
}

async function c3Oskar() {
  if (!flag('oskar3')) {
    setFlag('oskar3');
    await Dlg.say('oskar', "Hmph. You again. Finn says his herring are better than Hookness herring. Finn is wrong.");
    await Dlg.narrate('Bjorn wags at you from under the bench, thumping his tail on the cobbles.');
    await Dlg.say('oskar', "Ansel says you're going north for the Wren. ...Good. She shouldn't be stuck up there on her own.");
    await Dlg.say('oskar', "Here. The key to the Hartley house. Maggie's room is right at the top, in the attic. Fifty years I've had that key, and I never once had the heart to go in.");
    Inv.add('hkey'); Sound.sfx('quest');
    await Dlg.say('oskar', "You go. Take Ansel. He should see it.");
    return;
  }
  if (Inv.has('famphoto') && !flag('oskarToby')) {
    setFlag('oskarToby');
    await Dlg.narrate('You show Oskar the family photograph.');
    await Dlg.say('oskar', "...Old John Hartley. Maggie. And little Toby. Tobias. Her baby brother.");
    await Dlg.say('ansel', "A brother. She had a little brother, and she never told me.");
    await Dlg.say('you', "But the sign on the cannery says HARTLEY & SONS. Who was the other son?");
    await Dlg.say('oskar', "Ha! That sign's older than me. Maggie's grandfather painted it when he built the cannery, for his two boys: John, and John's big brother Will.");
    await Dlg.say('oskar', "Will ran off to sea at sixteen and never came back. Old Hartley never changed the sign. Hartleys never change anything.");
    await Dlg.say('oskar', "Except Maggie. When she was ten she scratched '& DAUGHTER' underneath it with a nail. Her father was furious for a week.");
    await Dlg.say('oskar', "He followed her everywhere, like a duckling. After she left, he stopped talking. Not a word, for a whole year.");
    await Dlg.say('oskar', "Then one morning his rowboat was gone. Rowed off east, into the Skerries, and never came back.");
    await Dlg.say('oskar', "Folk say there's a man living out there still, on the last rock. With a goat. But folk say all sorts.");
    Sound.sfx('quest');
    return;
  }
  if (typeof c3OskarLate === 'function' && await c3OskarLate()) return;
  const lines = [
    "Bjorn has eaten Finn's sandwich. Bjorn is a hero.",
    flag('hartleyIn') ? "You went in her room? ...Was the curtain still red? Good. Good." : "The Hartley house key. Don't lose it. It's the only one.",
    "Hookness herring. Best in the world. Finn is wrong.",
  ];
  await Dlg.say('oskar', lines[(S.f.oskar3 = (S.f.oskar3 || 0) + 1) % lines.length]);
}

async function c3Bo() {
  let sel = 0;
  while (true) {
    const items = [];
    if (!Inv.has('towline') && !flag('wrenHome')) items.push({ label: 'Ask about towing the Wren', id: 'tow' });
    if (flag('wrenHome') && !flag('boList')) items.push({ label: 'Ask what the Wren needs', id: 'list' });
    if (flag('boList') && !flag('wrenFixed')) {
      const have = ['spar', 'tar', 'sailcloth'].filter(k => Inv.has(k)).length;
      items.push({ label: 'Restore the Wren', id: 'fix', desc: 'Bo needs a spar for a mast, tar for the seams, and sailcloth (' + have + '/3).', disabled: have < 3, whyNot: 'Bo needs a spar, tar and sailcloth first.' });
    }
    items.push({ label: 'Chat', id: 'chat' }, { label: 'Leave', id: 'leave' });
    const i = await Menu.list({ title: "Bo's Boatyard", subtitle: S.coins + ' coins', items, w: 270, sel: Math.min(sel, items.length - 1) });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'tow') {
      await Dlg.say('bo', "Tow Maggie's boat all the way from the Glass Floe? Ha! I like it.");
      await Dlg.say('bo', "Here. Forty fathoms of my best rope. Tie it to her stem, not her mast, or you'll pull the mast clean out.");
      Inv.add('towline'); Sound.sfx('pickup');
      await Dlg.say('bo', "And steer gently. She'll follow your wake a few seconds behind you, so whatever you dodge, she has to dodge too.");
    }
    if (id === 'list') {
      setFlag('boList');
      await Dlg.narrate('Bo walks round the Wren three times, knocking on her planks and humming.');
      await Dlg.say('bo', "Good news: her hull is sound. Hookness spruce, built to last. Bad news: everything else.");
      await Dlg.say('bo', "She needs three things. A new mast: a long straight spruce spar. Bram out at Kettle Point had one off the old supply boat.");
      await Dlg.say('bo', "Tar for her seams: the Hookness folk always kept pine tar in their net sheds. And sailcloth for a new sail. Hollis sells it.");
      Sound.sfx('quest');
    }
    if (id === 'fix') {
      ['spar', 'tar', 'sailcloth'].forEach(k => Inv.remove(k));
      Sound.sfx('chop');
      await Dlg.narrate('All afternoon the boatyard rings with hammering and sawing. Grandpa holds things. Bo tells him to stop holding things. Grandpa holds different things.');
      Clock.advance(4);
      setFlag('wrenFixed'); Sound.sfx('quest');
      await Dlg.say('bo', "There. New mast, new sail, every seam tarred. She'll float like a duck.");
      await Dlg.say('bo', "But she's got no name on her bow. Bad luck, a boat with no name. Nell's been hanging round the yard all week asking if she can paint it.");
    }
    if (id === 'chat') {
      if (flag('wrenReady')) await Dlg.say('bo', "The Wren draws hardly any water. You could sail her over a wet lawn. Pip's tougher, mind. Take Pip for rough water and ice.");
      else if (flag('wrenHome')) await Dlg.say('bo', "Hookness boats. Short, deep and stubborn. Like Hookness folk.");
      else await Dlg.say('bo', "The Regatta's on Midsummer Day. Every boat in Saltmere, out round Gull Rock and back. You should enter!");
    }
  }
}

async function c3Greta() {
  if (typeof c3GretaLate === 'function' && await c3GretaLate()) return;
  const lines = [
    "Supervised, mind. If he so much as LOOKS at a storm, you bring him straight home.",
    "Midsummer Regatta is on Midsummer Day, as always. Out round Gull Rock and back. I always win. I am the Harbourmaster.",
    "The Glass Floe melted? In fifty years on this harbour I've never heard the like.",
  ];
  await Dlg.say('greta', lines[(S.f.greta3 = (S.f.greta3 || 0) + 1) % lines.length]);
}

async function c3Nell() {
  if (flag('wrenFixed') && !flag('wrenNamed')) {
    await Dlg.say('nell', "Is the Wren finished? Can I paint her name? PLEASE? I've been practising my letters on Pickles. ...Not ON Pickles. Near Pickles.");
    const r = await Dlg.ask('nell', 'Let Nell paint the name?', ['Yes, please!', 'Not yet']);
    if (r !== 0) return;
    setFlag('wrenNamed');
    await Dlg.narrate('Nell paints W-R-E-N on the bow in careful white letters, with her tongue sticking out the whole time. She adds a very small puffin underneath.');
    await Dlg.say('nell', "The puffin is for luck. And because puffins are the best.");
    await Dlg.say('bo', "The paint wants a night to dry. She'll be ready to sail in the morning.");
    Sound.sfx('quest');
    return;
  }
  if (typeof c3NellLate === 'function' && await c3NellLate()) return;
  const lines = [
    "Are you racing in the Regatta? I'm going to cheer SO loud. Pickles is going to cheer too. Quietly. She's a cat.",
    flag('wrenHome') ? "The Wren is the prettiest boat in the whole harbour. Don't tell Pip." : "A boat that was frozen in ice for FIFTY years? Like a fish finger!",
  ];
  await Dlg.say('nell', lines[(S.f.nell3 = (S.f.nell3 || 0) + 1) % lines.length]);
}

// ---------------- the cottage ----------------
const C3_COTTAGE = Object.assign({}, C2_COTTAGE, {
  id: 'c3_cottage', name: 'The Cottage',
  npcs: [],
  objects: [
    {
      x: 49, r: 24, label: 'Sleep', act: async () => {
        await sleepHere('Your old bed in the corner. The window is open, and you can hear the sea.');
        if (flag('wrenNamed') && !flag('wrenReady')) {
          setFlag('wrenReady');
          await Dlg.narrate('In the morning, the Wren is waiting at the end of the pier beside Pip, her new white sail furled and her name shining on her bow.');
          await Dlg.say('ansel', "Look at her, little gull. Maggie's Wren, back on the water. Shall we take her out?");
          Sound.sfx('quest');
        }
      },
    },
    { x: 100, r: 8, label: 'Look at photo', act: () => Dlg.narrate('Grandma Margaret, laughing on the pier. Far behind her, a little boat with a red sail.') },
    { x: 173, r: 12, label: 'Look out the window', act: () => Dlg.narrate('Midsummer light. Even at night the sky up north never quite goes dark, and here it stays pale green until nearly midnight.') },
    { x: 291, r: 9, label: 'Climb the ladder to the attic', act: () => c3Trunk() },
    { x: 330, r: 10, label: 'Cook fish on the stove', act: cookFish },
    { x: 386, r: 10, label: 'Open drawer', act: () => Dlg.narrate('String, candle stubs, and that same very old biscuit. It has outlived three cats.') },
    { x: 446, r: 12, label: 'Go outside', act: () => { Sound.sfx('door'); Game.goto('c3_village', { x: 77 }); } },
  ],
  onEnter: null,
});

async function c3Trunk() {
  if (typeof c3TrunkLate === 'function' && await c3TrunkLate()) return;
  await Dlg.narrate('You climb up to the attic. The old sea trunk is full of letters, a wedding veil and a pair of very small boots. You close it gently.');
}

// ---------------- Kettle Point ----------------
const C3_LIGHTHOUSE = Object.assign({}, LIGHTHOUSE, {
  id: 'c3_lighthouse', sub: 'Summer', music: 'sea', weather: () => 'clear',
  drawMid(w, sc, cam, t) { drawBoat(w, boatCfg(), 42 - cam, 239, t, { rough: 1.2 }); },
  npcs: addAnsel([{ id: 'bram', x: 280 }], 96),
  objects: [
    boatObject(42, 'lighthouse'),
    anselObject(96, 'lighthouse'),
    { x: 280, label: 'Talk to Bram', act: () => c3Bram() },
    { x: 334, r: 8, label: "Read the keeper's log", act: () => Dlg.narrate('"Summer. Lamp burning well. Ansel Hale went past heading north, with his grandchild at the helm. He waved like a madman. I waved back. I think it was him."') },
    { x: LH_X, r: 10, label: 'The lighthouse', act: () => Dlg.narrate('The lamp is burning. In summer it hardly needs to, but Bram lights it every night anyway, just in case.') },
    ...sketchSpots('c3_lighthouse'),
    { x: 570, r: 10, label: 'Fish from the cliff', act: sc => fishHere(sc, 574, 240, 1) },
  ],
  onEnter: null,
});

async function c3Bram() {
  if (flag('boList') && !Inv.has('spar') && !flag('wrenFixed')) {
    await Dlg.say('bram', "A spar? For Maggie Hartley's boat? Ha! I've had a spruce spar in the shed for twenty years, waiting for a boat good enough.");
    await Dlg.narrate('Bram disappears into the shed, there is a tremendous crash, and he comes out with a long, straight, pale spruce pole and only a small cut on his nose.');
    Inv.add('spar'); Sound.sfx('pickup');
    await Dlg.say('bram', "Take it. And tell Bo if he paints it, I'll come round and haunt him.");
    return;
  }
  const lines = [
    "Ansel! Is that you? Your voice sounds happier. Summer suits you.",
    "Midsummer, and the sun hardly sets. My lamp feels quite useless. I light it anyway. It likes to be lit.",
    "A girl came by here once in a little red-sailed boat, long before my time. The old keeper told me. Fierce little thing, he said. Ate three bowls of soup.",
  ];
  await Dlg.say('bram', lines[(S.f.bram3 = (S.f.bram3 || 0) + 1) % lines.length]);
}

// ---------------- the Puffin Stacks in summer ----------------
const summerWeather = () => S.day % 3 === 0 ? 'cloudy' : 'clear';
const C3_PUFFIN = Object.assign({}, PUFFIN, {
  id: 'c3_puffin', sub: 'Summer, and pufflings everywhere', weather: summerWeather,
  build(c, sc) {
    PUFFIN.build.call(this, c, sc);
    const g = roughen(this.ground, 2);
    paintTerrain(c, 82, 640, g, (x, d, y) => (x > 200 && x < 380) || (x > 420 && x < 590) ? MAT.grass(x, d, y) : MAT.mossrock(x, d, y));
    for (const bx of [440, 470, 505, 540, 568]) ellipse(c, bx, this.ground(bx) + 4, 4, 2, '#1a1612');
  },
  drawMid(w, sc, cam, t) {
    drawBoat(w, boatCfg(), 42 - cam, 239, t, {});
    for (const [x, l] of PUFFIN_SPOTS) drawPuffin(w, x - cam, this.ground(x), t, x, !!l);
    // fluffy grey pufflings peeping out of the burrows
    for (const bx of [470, 540]) { const gy = this.ground(bx); rect(w, bx - 2 - cam, gy - 3, 4, 3, '#5a5a5e'); px(w, bx - cam, gy - 3, '#e8e4dc'); }
  },
  npcs: addAnsel([{ id: 'ylva', x: 300 }], 110),
  objects: [
    boatObject(42, 'puffin'),
    anselObject(110, 'puffin'),
    { x: 300, label: 'Talk to Ylva', act: () => c3Ylva() },
    {
      x: 342, r: 8, label: 'Look through the telescope', act: () => Dlg.narrate(flag('skerriesChart')
        ? 'To the east, a scatter of low rocks and islets fades into the haze: the Skerries. On the farthest one, a tiny white tower.'
        : 'Far to the north-west, the rusty roofs of Hookness. To the east, a haze of low rocks and white water, too far to make out.'),
    },
    ...sketchSpots('c3_puffin'),
    { x: 500, r: 30, label: 'Watch the puffins', act: () => Dlg.narrate('Puffins fly in with beaks full of little silver fish, all lined up neatly like a moustache. A fluffy grey puffling pokes its head out of a burrow and squeaks.') },
    { x: 604, r: 8, label: 'Fish', act: sc => fishHere(sc, 604, 240, 1) },
  ],
  async onEnter() {
    if (!flag('puffin3')) {
      setFlag('puffin3');
      await wait(0.5);
      await Dlg.narrate('The Puffin Stacks in summer: no snow, just green turf, a roar of seabirds, and Ylva waving both arms at you from the hut.');
    }
  },
});

async function c3Ylva() {
  if (!flag('ylva3')) {
    setFlag('ylva3');
    await Dlg.say('ylva', "You came! You got my postcard! And you brought... is that ANSEL HALE? The Ansel Hale? Of the whale story?");
    await Dlg.say('ansel', "The very same. Though the whale did most of the work.");
    await Dlg.say('ylva', "The Wren is still there in the floe, bobbing about in the melt water like a little duck. I've been watching her through the telescope every day so nobody nicks her.");
    if (!Inv.has('towline') && !flag('wrenHome')) await Dlg.say('ylva', "You'll need a rope to tow her, though. A long one.");
    return;
  }
  if (Inv.has('sketchbook') && !flag('skerriesChart')) {
    setFlag('skerriesChart');
    await Dlg.narrate("You show Ylva the two sketches you couldn't place: a rock like a sleeping dog, and a white tower on a lonely rock.");
    await Dlg.say('ylva', "Oh! That's Seal Skerry. Everyone knows that one. And the tower... that's Ness End. The old foghorn station, on the very last rock of the Skerries.");
    await Dlg.say('ylva', "The Skerries are just east of here. Hundreds of little islands, and the water between them is so shallow you can see crabs walking about on the bottom.");
    await Dlg.say('ylva', "Pip would scrape her bottom off. You'd need a little boat. A really little one.");
    await Dlg.say('ansel', "...A boat like the Wren.");
    Sound.sfx('quest');
    await Dlg.narrate('The Skerries have appeared on your sea chart.');
    return;
  }
  if (S.bottles.includes(1) && !flag('ylvaSigrid')) {
    setFlag('ylvaSigrid');
    await Dlg.say('ylva', "Sigrid? SIGRID? That's my grandmother! Maggie Hartley counted puffins with my grandmother?! And every puffin was called KEVIN?");
    await Dlg.say('ylva', "...I'm going to call them all Kevin from now on. Four thousand Kevins.");
    return;
  }
  if (typeof c3YlvaLate === 'function' && await c3YlvaLate()) return;
  const lines = [
    'Four thousand, two hundred and thirty-one puffins! And this year, so many pufflings. Look at them. Little grey pom-poms with beaks.',
    flag('wrenHome') ? 'You got the Wren home! I watched you go past with her on the tow line. I waved so hard I nearly fell off the rock.' : 'The Glass Floe is two legs of food north of here. The ice is almost all gone now. Just slush, and the Wren.',
  ];
  await Dlg.say('ylva', lines[(S.f.ylva3n = (S.f.ylva3n || 0) + 1) % lines.length]);
}

// ---------------- Hookness in summer ----------------
const C3_CANNERY = Object.assign({}, CANNERY, {
  id: 'c3_cannery', sub: 'Summer', weather: summerWeather, music: 'sea',
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(91, 8, 15, 80, 0.1, 'fair', 1800);
    sc.clouds.draw(w, cam, t * 3);
    // green summer hills behind
    for (let x = 0; x < W; x++) {
      const hx = x + cam * 0.3;
      const hh = 60 + Math.sin(hx * 0.008) * 24 + Math.sin(hx * 0.031) * 6;
      rect(w, x, 150 - hh * 0.4, 1, hh * 0.4 + 2, '#7a9a6a');
      rect(w, x, 150 - hh * 0.4 + 6 + Math.sin(hx * 0.05) * 3, 1, 3, '#5a7a50');
    }
    Sea.draw(w, 150, H, cam, t, 'arctic', S.time);
  },
  drawMid(w, sc, cam, t) {
    drawBoat(w, boatCfg(), 50 - cam, 239, t, {});
    for (let i = 0; i < 3; i++) drawGull(w, ((t * 10 + i * 210) % 900) - 120, 50 + i * 16 + Math.sin(t * 0.6 + i) * 5, t + i, { seed: i * 3.1 });
  },
  emissive: null, lights: null,
  npcs: addAnsel([], 120),
  objects: [
    boatObject(50, 'cannery'),
    anselObject(120, 'cannery'),
    ...sketchSpots('c3_cannery'),
    { x: 356, r: 10, label: 'Read the sign', act: () => Dlg.narrate('HARTLEY & SONS. Underneath it, scratched into the paint with a nail, in small wobbly capitals: & DAUGHTER.' + (flag('oskarToby') ? ' Maggie, aged ten.' : '')) },
    { x: 411, r: 16, label: 'Peer through the cannery doors', act: () => Dlg.narrate('Rows of silent machines under a blanket of dust, and a calendar on the wall still showing April, 1974.') },
    { x: 626, r: 10, label: 'Read the notice board', act: () => Dlg.narrate('"BY ORDER OF J. HARTLEY. THE WEIR AT THE NARROWS IS CLOSED. FOR GOOD." Somebody has crossed out FOR GOOD and written, in big new letters: NOT ANY MORE.') },
    { x: 740, r: 12, label: "Oskar's cottage", act: () => Dlg.narrate("Oskar's cottage is shut up for the summer. A note on the door says: GONE SOUTH. FEED YOURSELVES. It is addressed to the gulls.") },
    {
      x: 803, r: 12, label: () => flag('boList') && !Inv.has('tar') && !flag('wrenFixed') ? 'Search the net shed for tar' : 'The old smokehouse', act: async () => {
        if (flag('boList') && !Inv.has('tar') && !flag('wrenFixed')) {
          await Dlg.narrate('Behind the smokehouse is a net shed, stacked with old cork floats and rope. In the corner: three wooden buckets of thick black pine tar, still good.');
          Inv.add('tar'); Sound.sfx('pickup');
          await Dlg.say('ansel', "Hookness tar. It smells exactly like her boots used to. I'd forgotten that.");
          return;
        }
        await cookFish();
      },
    },
    { x: 892, r: 16, label: () => Inv.has('hkey') || flag('hartleyIn') ? 'Enter the Hartley house' : 'The big boarded-up house', act: () => c3HartleyDoor() },
  ],
  async onEnter() {
    if (!flag('cannery3')) {
      setFlag('cannery3');
      await wait(0.5);
      await Dlg.narrate('Hookness in summer. The cannery is as rusty as ever, but the hills behind are green, and the only sound is the gulls.');
      await Dlg.say('ansel', "So this is where she came from. Maggie Hartley of Hookness.");
    }
  },
});

async function c3HartleyDoor() {
  if (!Inv.has('hkey') && !flag('hartleyIn')) { await Dlg.narrate("The Hartley house. The door is locked, and the windows are boarded up. Oskar must have a key."); return; }
  if (!flag('hartleyIn')) {
    await Dlg.narrate("Oskar's key turns stiffly in the lock. Inside: dust sheets over the furniture, a stopped clock, and a portrait of a stern man with a stern moustache.");
    await Dlg.narrate('At the top of three flights of creaking stairs, a little door with a brass handle.');
  }
  Sound.sfx('door');
  Game.goto('hartley', { x: 40 });
}

// ---------------- the Hartley house attic ----------------
const HARTLEY = {
  id: 'hartley', name: "Maggie's Room", width: 480, horizon: 162, indoor: true, spawn: 40, minX: 24, maxX: 456,
  music: 'night', ambience: { sea: 0.15, wind: 0.2 },
  ground: () => 228,
  build(c, sc) {
    // sloping attic ceiling, plank walls
    plankWall(c, 0, 40, 480, 188, '#8a7058', '#5a4634', 5);
    for (let y = 0; y < 150; y++) {
      const edge = Math.max(0, 120 - y * 1.1);
      rect(c, 0, y, edge, 1, '#3a2a1e'); rect(c, 480 - edge, y, edge, 1, '#3a2a1e');
      if (y % 6 === 0) { rect(c, 0, y, edge, 1, '#2a1e14'); rect(c, 480 - edge, y, edge, 1, '#2a1e14'); }
    }
    rect(c, 0, 0, 480, 40, '#2a1e14');
    for (let x = 30; x < 480; x += 70) rect(c, x, 0, 4, 40, '#4a3424');
    paintTerrain(c, 0, 480, () => 228, MAT.planks);
    rect(c, 0, 224, 480, 4, '#4a3020'); rect(c, 0, 224, 480, 1, '#6a4a30');
    // a crossbeam under the roof, with a little model of the Wren hanging from it
    rect(c, 0, 118, 480, 5, '#4a3424'); rect(c, 0, 118, 480, 1, '#6a4c34'); rect(c, 0, 122, 480, 1, '#2a1e14');
    line(c, 160, 123, 160, 146, '#c8c0b0');
    for (let i = 0; i < 18; i++) { const u = (i - 9) / 9; rect(c, 151 + i, 152 - Math.round(u * u * 2), 1, 4 - Math.round(Math.abs(u) * 2), i % 3 ? '#4a6a8a' : '#3a5a7a'); }
    rect(c, 160, 138, 1, 12, '#5a3c22');
    for (let y = 140; y < 149; y++) rect(c, 160 - Math.round((y - 140) * 0.8), y, Math.round((y - 140) * 0.8), 1, '#c8604a');
    for (const hx of [330, 342, 354]) { line(c, hx, 123, hx, 130, '#8a7a5a'); rect(c, hx - 2, 130, 5, 6, hx === 342 ? '#7a8a4a' : '#8a9a5a'); }
    // the window with the red curtain, looking out over the bay
    c.clearRect(222, 178, 36, 28);
    rect(c, 219, 175, 42, 3, '#3a2616'); rect(c, 218, 206, 44, 3, '#c8b898');
    rect(c, 219, 175, 3, 34, '#3a2616'); rect(c, 258, 175, 3, 34, '#3a2616'); rect(c, 239, 178, 2, 28, '#3a2616');
    for (let j = 0; j < 38; j++) { const sw = 7 - (j > 24 ? (j - 24) / 3 : 0); rect(c, 212, 172 + j, sw, 1, j % 3 ? '#b83a2a' : '#8a2a20'); rect(c, 268 - sw, 172 + j, sw, 1, j % 3 ? '#b83a2a' : '#8a2a20'); }
    rect(c, 208, 170, 64, 2, '#2a1a10');
    // Maggie's bed with a patchwork quilt
    rect(c, 46, 204, 4, 24, '#4a2a16'); rect(c, 110, 212, 4, 16, '#4a2a16');
    rect(c, 50, 220, 60, 5, '#6a3e22');
    for (let i = 0; i < 56; i += 6) for (let j = 0; j < 6; j += 3) rect(c, 52 + i, 214 + j, 6, 3, ['#c84a3a', '#e8d8b0', '#3a6a9a', '#7aa84a'][(i / 6 + j / 3) % 4]);
    rect(c, 50, 211, 12, 4, '#ece4d4');
    // desk with a lamp and books
    rect(c, 130, 212, 54, 3, '#7a5232'); rect(c, 132, 215, 3, 13, '#5a3a20'); rect(c, 178, 215, 3, 13, '#5a3a20');
    rect(c, 140, 207, 16, 5, '#3a5a3a'); rect(c, 140, 207, 16, 1, '#5a7a5a'); px(c, 150, 209, '#e8e0d0');
    rect(c, 166, 202, 2, 10, '#4a4a50'); rect(c, 161, 198, 12, 5, '#3a6a4a');
    // shelf: books, a carved whale, a jar of shells
    rect(c, 300, 192, 70, 2, '#5a3a20');
    [[302, '#8a3a2a'], [306, '#3a5a8a'], [310, '#c8a040'], [314, '#4a6a3a'], [318, '#6a4a6a']].forEach(([x, col]) => rect(c, x, 183, 3, 9, col));
    rect(c, 330, 187, 14, 5, '#7a6a5a'); rect(c, 342, 186, 3, 2, '#7a6a5a'); px(c, 333, 188, '#2a2a2a');
    rect(c, 354, 184, 8, 8, '#a8c8d0'); rect(c, 355, 188, 6, 3, '#e8c8b8');
    // Toby's crayon drawing pinned to the wall
    rect(c, 384, 174, 26, 20, '#f4f0e4');
    for (let i = 0; i < 16; i++) px(c, 389 + i, 188 + Math.round(Math.sin(i * 0.5)), '#3a6ac8');
    rect(c, 392, 182, 10, 3, '#8a5a3a'); line(c, 397, 176, 397, 182, '#5a3a2a'); rect(c, 398, 176, 4, 5, '#d83a2a');
    px(c, 394, 180, '#e8a040'); px(c, 400, 179, '#e8a040');
    px(c, 397, 174, '#c8a040');
    // dresser with the photograph
    rect(c, 420, 210, 34, 18, '#6a4428'); rect(c, 418, 208, 38, 3, '#5a3a20');
    rect(c, 423, 213, 28, 5, '#7a5232'); rect(c, 423, 220, 28, 5, '#7a5232');
    rect(c, 430, 198, 12, 10, '#c8a040'); rect(c, 431, 199, 10, 8, '#d8cdb8'); rect(c, 432, 201, 2, 5, '#4a4a4a'); rect(c, 435, 202, 2, 4, '#6a5a5a'); rect(c, 438, 204, 2, 2, '#6a5a5a');
    // little door to the stairs
    rect(c, 6, 190, 22, 38, '#3a2616'); for (let j = 0; j < 36; j++) rect(c, 8, 192 + j, 18, 1, j % 6 === 5 ? '#4a3018' : '#6a4426');
    rect(c, 22, 210, 2, 2, '#d8b860');
    // rag rug
    for (let i = 0; i < 80; i++) for (let j = 0; j < 3; j++) px(c, 200 + i, 225 + j, (i + j) % 6 < 3 ? '#8a3a2a' : '#c8a060');
  },
  drawBack(w, sc, cam, t) {
    Sea.draw(w, 194, 208, cam * 0.1, t, 'arctic', S.time);
    for (let i = 0; i < 18; i++) rect(w, 226 + i, 194 - Math.round(Math.sin(i / 18 * Math.PI) * 5), 1, 5, '#4a5a4a');
  },
  lights(sc, cam, t, nf) { return [{ x: 240, y: 192, r: 60, col: '#fff0d0', a: 0.3, always: true }]; },
  npcs: [{ id: 'ansel', x: 280, left: true, facePlayer: false, when: () => flag('anselCrew') }],
  objects: [
    { x: 17, r: 12, label: 'Go back downstairs', act: () => { Sound.sfx('door'); Game.goto('c3_cannery', { x: 880, facing: -1 }); } },
    { x: 80, r: 24, label: "Maggie's bed", act: () => Dlg.narrate('A narrow bed under a patchwork quilt, red and blue and green. Tucked under the pillow: a very old, very flat, very small toy seal.') },
    { x: 156, r: 18, label: () => Inv.has('sketchbook') ? 'The desk' : 'A green book on the desk', act: () => c3Desk() },
    { x: 280, r: 10, label: 'Talk to Grandpa', when: () => flag('anselCrew'), act: () => c3AnselAt('attic') },
    { x: 240, r: 12, label: 'Look out of the window', act: () => Dlg.narrate('The whole bay of Hookness, the cannery chimney, and far out, the Puffin Stacks. She could see the whales coming from up here.') },
    { x: 160, r: 8, label: 'A model boat', act: () => Dlg.narrate('A little wooden model of a boat with a red paper sail, hanging from the beam on a thread. Somebody has painted WREN on the side, very small.') },
    { x: 334, r: 30, label: 'The bookshelf', act: () => Dlg.narrate('"Birds of the North." "Knots for Sailors." "How to Build a Small Boat." Between the books, a little wooden whale, carved with a penknife, and a jar of shells.') },
    { x: 397, r: 12, label: 'A drawing on the wall', act: () => c3Crayon() },
    { x: 436, r: 14, label: () => Inv.has('famphoto') ? 'The dresser' : 'A photograph on the dresser', act: () => c3FamPhoto() },
  ],
  async onEnter() {
    if (!flag('hartleyIn')) {
      setFlag('hartleyIn');
      Inv.remove('hkey');
      await wait(0.5);
      await Dlg.narrate("Maggie's room. Low and narrow, right under the roof, with one window that looks out over the whole bay. The red curtain is faded almost pink.");
      await Dlg.narrate('Everything is exactly where she left it, fifty years ago. Even the dust looks careful.');
      if (flag('anselCrew')) await Dlg.say('ansel', "...Oh, Maggie.");
    }
  },
};

async function c3Desk() {
  if (Inv.has('sketchbook')) { await Dlg.narrate('Pencils worn down to stubs, a rubber shaped like a fish, and a ruler with T.H. scratched on it.'); return; }
  await Dlg.narrate('On the desk, under a layer of dust: a green cloth sketchbook. On the cover, in pencil: M. HARTLEY. PRIVATE. KEEP OUT. THIS MEANS YOU, TOBY.');
  await Dlg.narrate('Inside are six pencil drawings of places in the north, each with a little note written on the back. They are really good.');
  Inv.add('sketchbook'); Sound.sfx('pickup');
  await Dlg.say('ansel', "She drew? She never drew. Not once, in all our years. ...Or maybe she just never let me see.");
  await Dlg.narrate("Tip: Maggie's sketchbook is in your Journal. Find the spot where each drawing was made, and hold it up to the view.");
}

async function c3Crayon() {
  await Dlg.narrate('A crayon drawing, pinned up with a rusty tack. Two stick people in a little boat with a big red sail, on a very blue sea. Across the top, in wobbly capitals:');
  await Dlg.narrate('"ME AND MAGGIE IN THE WREN. BY TOBY AGE 6."');
  if (!flag('crayon')) { setFlag('crayon'); if (flag('anselCrew')) await Dlg.say('ansel', "Toby? Who's Toby?"); }
}

async function c3FamPhoto() {
  if (Inv.has('famphoto') || flag('oskarToby')) { await Dlg.narrate('The dresser drawers are full of folded jumpers that smell of mothballs.'); return; }
  await Dlg.narrate('A photograph in a brass frame. A tall, stern man in a good coat. A scowling girl of about fifteen. And between them, holding her hand, a little boy grinning with no front teeth.');
  await Dlg.narrate('On the back: "John, Margaret and Tobias. 1972."');
  Inv.add('famphoto'); Sound.sfx('pickup');
  if (flag('anselCrew')) {
    await Dlg.say('ansel', "Tobias. ...She had a little brother. Fifty years, and she never said a word.");
    await Dlg.say('ansel', "Oskar would know what happened to him. Let's ask him when we're home.");
  }
}

// ---------------- the Glass Floe, thawed ----------------
const C3_FLOE = {
  id: 'c3_floe', name: 'The Glass Floe', sub: 'Melting, for the first time in fifty years', width: 640, horizon: 150, spawn: 56, minX: 30, maxX: 430,
  music: 'wonder', ambience: { sea: 0.6, wind: 0.4 },
  fishSpot: 'ice', weather: summerWeather,
  ground: makeGround([[0, 232], [40, 222], [150, 220], [200, 216], [260, 220], [380, 218], [420, 222], [440, 236], [460, 250]]),
  build(c, sc) {
    paintTerrain(c, 30, 450, roughen(this.ground, 1), MAT.ice);
    // melt pools on the floe
    for (const [mx, mw] of [[120, 10], [300, 14]]) { ellipse(c, mx, this.ground(mx) + 3, mw, 2, '#5a9ab8'); ellipse(c, mx, this.ground(mx) + 3, mw - 3, 1, '#7ab8d0'); }
    for (const rx of [100, 280]) for (let i = 0; i < 12; i++) { const hgt = Math.round(3 - Math.abs(i - 6) * 0.5); if (hgt > 0) rect(c, rx + i, this.ground(rx + i) - hgt, 1, hgt, i % 3 ? '#e8f4fa' : '#ffffff'); }
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(101, 7, 15, 80, 0.1, 'fair', 1600);
    sc.clouds.draw(w, cam, t * 3);
    for (let i = 0; i < 4; i++) drawSilhouette(w, 'ice', i * 220 - cam * 0.2, 150, rgbStr(mixRgb(skyColors(S.time, 'clear')[2], '#f0f8fc', 0.5)), t);
    Sea.draw(w, 150, H, cam, t, 'arctic', S.time);
    // little floes drifting in the melt water
    for (let i = 0; i < 7; i++) {
      const fx = ((i * 97 + t * (2 + i % 3)) % 760) - 60 - cam * 0.6, fy = 168 + (i % 4) * 9;
      rect(w, fx, fy, 14 + (i % 3) * 6, 2, '#e8f4fa'); rect(w, fx, fy + 2, 14 + (i % 3) * 6, 1, '#9ac0d4');
    }
  },
  drawMid(w, sc, cam, t) {
    drawBoat(w, boatCfg(), 20 - cam, 238, t, {});
    if (!flag('wrenHome')) {
      const b = drawBoat(w, { type: 'wren', sail: 'none' }, 500 - cam, 240, t, { phase: 100, tilt: -0.05 });
      // rags of the old red sail on the mast
      const mx = b.x + b.b.mastX, mt = b.y + b.b.mastTop;
      for (let j = 4; j < 22; j += 2) rect(w, mx - 4 + Math.round(Math.sin(t * 2 + j) * 1), mt + j, 3 + (j % 4), 1, j % 4 ? '#b8705a' : '#a85a48');
    }
    for (const [sx, sd] of [[180, 3], [360, 7]]) drawSeal(w, sx - cam, this.ground(sx), t, sd, sd > 4);
  },
  drawFront(w, sc, cam, t) { frontWater(w, 236, t, 'arctic', 0, 34 - cam, cam); frontWater(w, 236, t, 'arctic', 440 - cam, W, cam); },
  npcs: addAnsel([], 100),
  objects: [
    boatObject(40, 'floe'),
    anselObject(100, 'floe'),
    ...sketchSpots('c3_floe'),
    { x: 270, r: 16, label: 'Watch the seals', act: () => Dlg.narrate('Two big grey seals are hauled out on the ice, snoozing. One of them opens an eye, looks at you, and decides you are not worth waking up for.') },
    { x: 426, r: 14, label: () => flag('wrenHome') ? 'The edge of the floe' : 'The Wren', act: sc => c3FloeWren(sc) },
    { x: 400, r: 8, label: 'Fish off the edge', act: sc => fishHere(sc, 396, 240, 1) },
  ],
  async onEnter() {
    if (!flag('floe3')) {
      setFlag('floe3');
      await wait(0.5);
      await Dlg.narrate('The Glass Floe has shrunk to a long white island in a sea of slush and sparkling melt water.');
      await Dlg.narrate('And there, bobbing gently against the edge of the ice, her old mast tilted and the rags of a red sail fluttering: the Wren.');
      await Dlg.say('ansel', "...Hello, old girl.");
    }
  },
};

async function c3FloeWren(sc) {
  if (flag('wrenHome')) { await Dlg.narrate('Just slush and sparkling water where the Wren used to be. The floe is a little smaller every day.'); return; }
  if (!Inv.has('towline')) {
    await Dlg.narrate('The Wren nudges against the ice, as if she wants to go somewhere. You could tow her home, if you had a long enough rope.');
    await Dlg.say('ansel', 'Bo has the best rope in Saltmere. Let\'s come back with a tow line.');
    return;
  }
  await Dlg.narrate('You kneel at the edge of the ice, lean out, and tie the end of the tow line round her stem, just as Bo said. Not the mast.');
  await Dlg.say('ansel', "Fifty years she's waited. Let's take her home, little gull.");
  const cost = routeCost('floe', 'saltmere');
  const r = await Dlg.ask(null, 'Tow the Wren all the way home to Saltmere? It takes ' + cost + ' food. You have ' + Inv.food() + '.', ['Tow her home', 'Not yet']);
  if (r !== 0) return;
  const short = Inv.eat(cost);
  if (short > 0) await Dlg.narrate("You don't have enough food, so you set off hungry. It's going to be a long, grumbly trip.");
  else Toast.show('-' + cost + ' food', 'food');
  S.vessel = 'pip';
  Game.goto('voyage', { from: 'floe', to: 'saltmere', cost, tow: true });
}

// ---------------- registration ----------------
function registerChapter3() {
  initChapter3Art();
  CHAPTER_INFO[3] = {
    label: 'Chapter III: The Red Sail', short: 'Chapter III',
    intro: [
      'Saltmere. Summer.',
      'Grandpa has been home for a whole year now, and he has behaved himself. Mostly.',
      'Up north, for the first time in fifty years, the Glass Floe is melting.',
      "And something that has been frozen in it all that time is finally coming loose.",
    ],
    start: { scene: 'c3_village', params: { x: 1100, opening: true } },
  };
  EPILOGUE2.final = ['The story continues...', 'Chapter III: The Red Sail is now unlocked', '', 'Choose Continue on the title screen to begin it in this save slot.'];
  for (const def of [C3_VILLAGE, C3_COTTAGE, C3_LIGHTHOUSE, C3_PUFFIN, C3_CANNERY, HARTLEY, C3_FLOE]) {
    const sk = def.overlay;
    def.overlay = function (c, sc, cam, t, nf) { if (sk) sk.call(this, c, sc, cam, t, nf); Sketch.draw(c); };
    Game.scenes[def.id] = new Place(def);
  }
  if (typeof registerChapter3b === 'function') registerChapter3b();
}
