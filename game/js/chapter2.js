'use strict';
// ---------------------------------------------------------------------------
// Chapter II: The Compass
// Spring. The whale returns with a calf that has no light, and leaves
// Grandma Margaret's old compass on the pier. It doesn't point north.
// ---------------------------------------------------------------------------

Object.assign(ITEMS, {
  compass: { name: "Grandma's Compass", type: 'key', desc: 'Brass, green with age, engraved M.H. The needle points north-north-west, never north.' },
  sweater: { name: "Grandma's Sweater", type: 'key', desc: 'Thick oiled wool that smells of lavender. Warm enough for the far north.' },
  photo: { name: 'Old Photograph', type: 'key', desc: 'A scowling girl in front of a long tin building: HOOKNESS CANNERY, HARTLEY & SONS.' },
  scrap: { name: 'Scrap Iron', type: 'trade', desc: 'Heavy, rusty iron from the Hookness scrap heap. Good forging iron.' },
  winchKey: { name: 'Winch House Key', type: 'key', desc: "Oskar's big iron key to the winch house at the Narrows." },
  crank: { name: 'Iron Crank Handle', type: 'key', desc: "The weir winch's crank handle. Ylva used it as a doorstop." },
  gear: { name: 'Brass Drive Gear', type: 'key', desc: 'The winch gear Maggie hid aboard the Wren fifty years ago.' },
  grease: { name: 'Tin of Grease', type: 'key', desc: 'Thick black grease, for machinery that has not moved in fifty years.' },
  feather: { name: 'Puffin Feather', type: 'trade', desc: 'A small black-and-white feather. Nell would love this.' },
  drawing: { name: 'Pencil Drawing', type: 'key', desc: 'A girl in a red-sailed boat, and a tiny glowing calf beside her. "The night I met her. M."' },
});

CHAPTER_SETUP[2] = st => {
  st.coins = 20;
  st.boat = 'big';
  st.f = { ironHull: 1, lantern: 1, lighthouseLit: 1, voyageTut: 1 };
  st.inv = { rod: 1, knife: 1, bread: 2 };
  st.time = 6.3;
  st.loc = 'c2_village'; st.px = 1150;
};

const SPRING = [
  { t: 'The Wren, page 1', body: "Spring, 1974. Father has ordered the weir shut for good. He says whales are bad for herring, and herring are good for Hartleys. I told him the whales were here first. He laughed. I am seventeen years old and I am done being laughed at." },
  { t: 'The Wren, page 2', body: "I took the drive gear out of the winch so they could never close the weir. They closed it anyway, by hand, with ropes and twenty men. Now it can never be opened again, and it's my fault. I'm going south. The ice is closing round the Wren and the gear is too heavy to carry, so I'm leaving it here with her. Oskar, if you ever find this: I'm sorry. Look after Freya." },
  { t: "Maggie's letter", body: "To whoever follows my compass. I found this cave when I was fifteen, following a little whale calf with no light in her. I watched the sky pour itself down through the roof and into her, and she lit up like a lantern. I promised her I would keep this place secret, and I have. Tomorrow I leave the north for ever. I've rubbed my compass on the lodestone here, so it will always point back to this cave. However far I go, I'll know where home is. If you're reading this, you found it too. Look after her. Maggie Hartley, aged 17." },
];

// ---------------- the northern sea ----------------
const LOCS2 = {
  saltmere: { name: 'Saltmere', x: 66, y: 214, scene: 'c2_village', dock: 1150, sil: 'town' },
  lighthouse: { name: 'Kettle Point', x: 150, y: 172, scene: 'c2_lighthouse', dock: 52, sil: 'lighthouse' },
  puffin: { name: 'Puffin Stacks', x: 262, y: 142, scene: 'puffin', dock: 52, sil: 'stacks' },
  cannery: { name: 'Hookness', x: 112, y: 78, scene: 'cannery', dock: 60, sil: 'cannery' },
  floe: { name: 'The Glass Floe', x: 268, y: 60, scene: 'floe', dock: 56, sil: 'ice' },
  narrows: { name: 'The Narrows', x: 384, y: 108, scene: 'narrows', dock: 56, sil: 'narrows' },
  grotto: { name: 'Aurora Grotto', x: 424, y: 42, scene: 'grotto', dock: 60, sil: 'glacier' },
};
const ROUTES2 = {
  'saltmere-lighthouse': 2, 'lighthouse-puffin': 1, 'saltmere-puffin': 3, 'lighthouse-cannery': 2, 'puffin-cannery': 1,
  'puffin-floe': 2, 'cannery-floe': 1, 'floe-narrows': 1, 'puffin-narrows': 2, 'narrows-grotto': 1,
  'saltmere-cannery': 3, 'saltmere-floe': 4, 'saltmere-narrows': 4, 'lighthouse-floe': 3, 'lighthouse-narrows': 3,
};
const SOUTH2 = ['saltmere', 'lighthouse'];
const ICY2 = ['floe', 'narrows', 'grotto'];

CHAPTERS[2] = {
  home: 'saltmere', locs: LOCS2, routes: ROUTES2,
  locKnown(id) {
    if (SOUTH2.includes(id)) return true;
    if (id === 'grotto') return flag('weirOpen');
    return flag('northChart');
  },
  routeBlock(from, to, cost) {
    if (cost === null) return to === 'grotto' ? 'The only way in is through the Narrows.' : 'Too far from here.';
    if (!SOUTH2.includes(to) && !Inv.has('sweater')) return "It's bitterly cold up north. You'd freeze in your raincoat. Find something warm.";
    if (ICY2.includes(to) && !flag('iceBow')) return "Pack ice would crush Pip's bow. Bo could fit an ice-breaking bow.";
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
    // pack ice dots
    for (let i = 0; i < 80; i++) { const ix = 200 + hash1(i) * 240, iy = 30 + hash2(i, 2) * 50; ellipse(c, ix, iy, 2, 1, '#e8f4f8'); }
    // the Narrows cliffs
    for (let k = 0; k < 2; k++) for (let j = 0; j < 24; j++) rect(c, 372 + k * 26 + (k ? j * 0.3 : -j * 0.3), 96 + j, 5, 1, '#7a6a52');
    drawText(c, 'Pack ice', 300, 22, '#6a8a9a');
    if (!flag('weirOpen')) { for (let i = 0; i < 5; i++) px(c, 379 + i * 4, 108, '#8a3020'); drawText(c, 'weir', 376, 124, '#8a3020'); }
    // aurora squiggle
    for (let i = 0; i < 60; i++) px(c, 380 + i, 24 + Math.sin(i * 0.3 + t) * 3, i % 2 ? '#5ab890' : '#a070c0');
  },
  departure(from, to) {
    if (from === 'narrows' && to === 'grotto' && !flag('grottoReached')) return { escort: true, length: 2300, cost: 1, night: true };
    return null;
  },
  voyageStyle(from, to, escort) {
    const north = !(SOUTH2.includes(from) && SOUTH2.includes(to));
    const icy = ICY2.includes(to) || ICY2.includes(from);
    const snowDay = S.day % 2 === 1;
    return {
      rough: north ? 1.2 : 1.3, clouds: 'fair', wind: north ? 0.5 : 0.4,
      mood: escort ? 'wonder' : null,
      weather: () => escort ? 'aurora' : !north ? 'cloudy' : nightFactor(S.time) > 0.5 ? 'aurora' : snowDay ? 'snow' : 'cloudy',
      pal: () => north ? 'arctic' : 'north',
      rocks: L => ({ n: Math.floor(L / 700), until: 1, big: 0 }),
      ice: escort ? 8 : icy ? 6 : north ? 2.5 : 0,
      bottles: false, glow: null, bergs: north,
      fishSpot: north ? 'north' : 'sea',
      intro: escort ? null : (icy && !flag('iceTip')) ? (setFlag('iceTip'), 'Ice floes drift across the water up here. Watch them move between lanes, and steer around them!') : null,
      escort: escort ? 'follow' : null,
      escortRiders: [PEOPLE.player.top],
      onEscortArrive() { setFlag('grottoReached'); Game.goto('grotto', { x: 70, finale: true }); },
    };
  },
};

JOURNAL_COLLECTIONS[2] = { title: "Maggie's pages", hint: 'Pages in Grandma Margaret\'s handwriting, from fifty years ago.', icon: 'letter', list: SPRING };

CHAPTER_OBJECTIVES[2] = () => {
  const o = [];
  if (flag('ended')) return ['You brought the calf home to the light.'];
  if (!flag('compassFound')) { o.push('Something is glinting at the end of the pier.'); return o; }
  if (!Inv.has('sweater')) o.push("Fetch Grandma's wool sweater from the attic trunk in the cottage.");
  if (!flag('northChart')) o.push('Ask Bram at Kettle Point for his old charts of the north.');
  if (flag('northChart') && Inv.has('sweater') && !flag('ylvaMet') && !flag('oskarMet')) o.push('Follow the compass north. The Puffin Stacks are the nearest island.');
  if (flag('ylvaMet') && !flag('oskarMet')) o.push('Find Oskar, the old caretaker at Hookness Cannery.');
  if (flag('ylvaMet') && !Inv.has('crank') && !flag('weirOpen') && !flag('winching')) o.push('Catch 3 herring for Ylva\'s puffin chicks (' + Math.min(3, Inv.count('herring')) + '/3).');
  if (flag('oskarMet') && !flag('weirOpen') && !flag('winching')) {
    if (!flag('iceBow')) o.push(Inv.has('scrap') ? 'Ask Bo in Saltmere to forge an ice-bow (scrap iron + 30 coins).' : 'Take scrap iron from the heap at Hookness, for an ice-bow.');
    if (!Inv.has('gear')) o.push("Find Maggie's boat, the Wren, frozen in the Glass Floe. The brass gear is aboard.");
    if (!Inv.has('grease')) o.push('Buy a tin of grease from Hollis in Saltmere.');
    if (Inv.has('crank') && Inv.has('gear') && Inv.has('grease')) o.push('Open the weir! Use the winch house at the Narrows.');
  }
  if (flag('winching') && !flag('weirOpen')) o.push('Crank the winch!');
  if (flag('weirOpen') && !flag('grottoReached')) o.push('Lead the whales to the Aurora Grotto. Board your boat at the Narrows.');
  if (flag('grottoReached') && !flag('readLetter')) o.push('Explore the grotto.');
  if (flag('readLetter')) o.push('Head home and tell Grandpa everything.');
  if (!o.length) o.push('Follow the compass.');
  return o;
};

const EPILOGUE2 = {
  cards: [
    "Oskar sailed south that summer, for the first time in fifty years. Bjorn came too. Now Oskar and Grandpa argue about herring on Old Finn's bench, and Finn says it is his bench.",
    'The weir at the Narrows stayed open. That spring Ylva counted four thousand, one hundred and twelve puffins. And two whales: one very large, and one very small and very bright.',
    "On Grandpa's mantelpiece there is a brass compass now. It points true north.",
    'And some evenings, by the stove, Grandpa takes out a pencil drawing of a girl in a red-sailed boat, and looks at it for a long, long time.',
  ],
  endTitle: 'THE END OF CHAPTER II',
  sky: 'aurora',
  stats: () => [
    'Days in the north: ' + (S.stats.days || S.day),
    'Fish caught: ' + (S.stats.fish || 0),
    "Maggie's pages found: " + S.bottles.length + ' / 3',
  ],
  final: ['Thank you for playing', 'Chapter II: The Compass', '', 'Maggie\'s story is still waiting to be told...'],
};

CHAPTER_INFO[2] = {
  label: 'Chapter II: The Compass', short: 'Chapter II',
  intro: [
    'Saltmere. Spring.',
    'Grandpa Ansel has been home for half a year. He mends nets, and tells his whale story to anyone who stands still long enough.',
    'Every clear night, the whole village watches the sea for the lights.',
    'But one morning, the lights came to us.',
  ],
  start: { scene: 'c2_village', params: { x: 1120, opening: true } },
};

// ---------------- extra icons & people ----------------
function initChapter2Art() {
  const P = { k: '#1a1410', y: '#f2c94c', Y: '#c8962a', w: '#ffffff', s: '#e8e4dc', S: '#b8b0a4', r: '#c84a3a', g: '#7a7a82', G: '#4a4a52', b: '#8a6a4a', l: '#d8c8f0', p: '#5a7aa8', t: '#6a4a2a' };
  const defs = {
    compass: ['..kkkk..', '.kYyyYk.', 'kYwwswYk', 'kywrwsyk', 'kyswwsyk', 'kYwswwYk', '.kYyyYk.', '..kkkk..'],
    sweater: ['.kk..kk.', 'kppkkppk', 'kpppppppk'.slice(0, 8), 'kplpplpk', 'kpppppppk'.slice(0, 8), '.kpppppk', '.kplplpk', '.kkkkkk.'],
    photo: ['kkkkkkkk', 'ksssssSk', 'ksgsSSSk', 'ksggSSSk', 'kssgSssk', 'ksSSSSsk', 'kkkkkkkk', '........'],
    scrap: ['........', '..kkk...', '.kgGgk..', 'kgGgGgkk', 'kGgGgGgk', '.kkGgGk.', '...kkk..', '........'],
    winchKey: ['.kkk....', 'kgggk...', 'kg.gk...', 'kgggkkkk', '.kkkgggk', '....kgk.', '....kk..', '........'],
    crank: ['kkk.....', 'kgk.....', 'kgkkkkk.', 'kggggggk', '.kkkkkgk', '.....kgk', '.....kbk', '.....kk.'],
    gear: ['..k.k...', '.kYkYk..', 'kYyyyYk.', '.kykyk..', 'kYyyyYk.', '.kYkYk..', '..k.k...', '........'],
    grease: ['.kkkkk..', 'kgggggk.', 'kkkkkkk.', 'kGGGGGk.', 'kGkkkGk.', 'kGGGGGk.', '.kkkkk..', '........'],
    feather: ['......kk', '.....kwk', '....kwkk', '...kkkk.', '..kwkk..', '.kkk....', 'k.......', '........'],
    drawing: ['kkkkkkkk', 'kssssssk', 'ksrsssks', 'ksrrssSk', 'ksSSSkSk', 'kssllssk', 'kkkkkkkk', '........'],
  };
  for (const k in defs) ICONS[k] = sprite(defs[k], P);
  PEOPLE.ylva = makePerson({ hat: 'knit', hatCol: '#c8403a', hair: '#e8cf78', hairStyle: 'pony', coat: '#4a7a5a', pants: '#3a3a48', boots: '#5a3a2a', skin: '#f2c8a8' });
  PEOPLE.oskar = makePerson({ hat: 'knit', hatCol: '#a83a2a', hair: '#bdbdbd', beard: 'full', beardCol: '#d0d0d0', coat: '#6a5038', coatDark: '#4a3826', pants: '#34302c', boots: '#2a2018', skin: '#d8a07a' });
  SPEAKERS.ylva = { name: 'Ylva, Puffin Counter', p: 'ylva' };
  SPEAKERS.oskar = { name: 'Oskar, Caretaker', p: 'oskar' };
}

// ===========================================================================
// SALTMERE IN SPRING
// ===========================================================================
const C2_VILLAGE = Object.assign({}, VILLAGE, {
  id: 'c2_village', name: 'Saltmere', sub: 'Spring',
  build(c, sc) {
    VILLAGE.build.call(this, c, sc);
    // window boxes full of flowers
    for (const wi of sc.wins) {
      if (wi.y < 160) continue;
      rect(c, wi.x - 2, wi.y + wi.h + 2, wi.w + 4, 3, '#6a4428');
      for (let i = 0; i < wi.w + 4; i += 2) px(c, wi.x - 2 + i, wi.y + wi.h + 1 - (i % 4 ? 0 : 1), ['#e85a7a', '#f2c94c', '#ffffff', '#c86ad8'][(i / 2) % 4]);
    }
  },
  drawMid(w, sc, cam, t) {
    VILLAGE.drawMid.call(this, w, sc, cam, t);
    // drifting blossom
    for (let i = 0; i < 24; i++) {
      const x = ((hash1(i) * 1400 + t * (8 + hash1(i + 5) * 10)) % 1400) - cam * 0.9;
      const y = ((hash1(i + 9) * 200 + t * (6 + hash1(i + 3) * 6)) % 200) + 20 + Math.sin(t * 2 + i) * 4;
      if (x > -2 && x < W) px(w, x, y, i % 3 ? '#f4b8c8' : '#ffffff');
    }
  },
  drawFront(w, sc, cam, t) {
    VILLAGE.drawFront.call(this, w, sc, cam, t);
    if (!flag('wentNorth')) {
      sc.backs = drawWhaleBacks(w, 1060 - cam, 258, t, false);
      sc.backsX = 1070 - cam;
    } else sc.backs = null;
  },
  emissive(c, sc, cam, t, nf) {
    VILLAGE.emissive.call(this, c, sc, cam, t, nf);
    if (sc.backs) for (const s of sc.backs) {
      if (s.calf) continue;
      const a = 0.4 + 0.3 * Math.sin(t * 1.5 + s.x);
      c.globalAlpha = a; c.drawImage(glowSprite(5, '#7ff7e8', 3, 0.9), Math.round(s.x - 5), Math.round(s.y - 5)); c.globalAlpha = 1;
    }
  },
  npcs: [
    ...[{ id: 'rosa', x: 214 }, { id: 'hollis', x: 326 }, { id: 'finn', x: 426, sit: true, facePlayer: false },
      { id: 'tam', x: 512 }, { id: 'bo', x: 690 }, { id: 'greta', x: 856 }, { id: 'nell', x: 968 }],
    { id: 'ansel', x: 1180, when: () => !flag('openingDone') },
  ],
  objects: [
    { x: 75, r: 10, label: "Enter Grandpa's cottage", act: () => { Sound.sfx('door'); Game.goto('c2_cottage', { x: 440, facing: -1 }); } },
    { x: 214, label: 'Talk to Rosa', act: () => c2Rosa() },
    { x: 326, label: 'Talk to Hollis', act: () => c2Hollis() },
    { x: 426, label: 'Talk to Old Finn', act: () => c2Finn() },
    { x: 512, label: 'Talk to Tam', act: () => talkTam() },
    { x: 690, label: 'Talk to Bo', act: () => c2Bo() },
    { x: 856, label: 'Talk to Greta', act: () => c2Greta() },
    { x: 968, label: 'Talk to Nell', act: () => c2Nell() },
    { x: 1180, r: 12, label: 'Talk to Grandpa', when: () => !flag('openingDone'), act: () => Dlg.say('ansel', 'Go on. Something is shining at the end of the pier.') },
    { x: 1228, r: 12, label: 'Pick up the shiny thing', when: () => !flag('compassFound'), act: () => c2FindCompass() },
    Object.assign(boatObject(1150, 'saltmere'), { when: () => flag('openingDone') }),
    { x: 1228, r: 12, label: 'Fish off the pier', when: () => flag('compassFound'), act: sc => fishHere(sc, 1230, 246, 1) },
  ],
  async onEnter(sc, p) {
    if (!p.opening) return;
    Game.hudHidden = true;
    await wait(0.8);
    await Dlg.narrate('Dawn. Half of Saltmere is out on the pier in dressing gowns and slippers, pointing at the harbour.');
    Sound.whale(0.2);
    await Dlg.narrate('There, between the moored boats, two shapes rest in the still water. One is enormous, and glows softly green and blue. The other is small, and completely dark.');
    await Dlg.say('ansel', "She came back, little gull. And look! She's brought her baby.");
    await Dlg.say('ansel', "But there's something odd about the little one. A lantern calf with no lantern. Not one spark.");
    await Dlg.narrate("At the very end of the pier, something glints on the wet planks. It wasn't there last night.");
    await Dlg.say('ansel', 'Go on. Have a look.');
    Game.hudHidden = false;
  },
});

async function c2FindCompass() {
  await Dlg.narrate('A brass compass, green with age, wrapped in a ribbon of kelp. Wet, as if it has only just come out of the sea.');
  await Dlg.narrate('Engraved on the lid, in worn little letters: M.H.');
  Inv.add('compass'); Sound.sfx('pickup');
  setFlag('compassFound');
  await Dlg.say('ansel', '...Let me see that.');
  await Dlg.say('ansel', "M.H. Margaret... This is your grandmother's compass. She lost it the spring I met her. Fifty years ago.");
  await Dlg.say('ansel', "She told me she dropped it over the side. I never quite believed her. She loved that compass.");
  await Dlg.narrate('You open the lid. The needle shivers... and settles. Not north. North-north-west, toward the open sea.');
  await Dlg.say('you', "Grandpa, it's broken. It doesn't point north.");
  await Dlg.say('ansel', 'No... it points somewhere. Your grandmother used to stand on this pier every spring and look out that way.');
  await Dlg.say('ansel', "I found her on the ice up north, you know. The spring I went up for the herring. Half frozen, at the edge of the Glass Floe, with a little red sail stuck in the ice behind her.");
  await Dlg.say('ansel', "She never told me where she'd come from. And I never asked.");
  await Dlg.say('ansel', "And that calf... Finn always said lantern calves are born dark, and get their light somewhere far in the north. If it never gets there...");
  await Dlg.say('you', 'Then we follow the compass.');
  await Dlg.say('ansel', "We? Ha! Greta has banned me from the sea until summer, after last time. But you can. You've got Pip.");
  await Dlg.say('ansel', "You'll need two things. Old Bram at Kettle Point keeps the northern charts, so ask him. And it's bitter cold up there. Your grandmother's wool sweater is in the trunk in our attic. She'd want you to have it.");
  setFlag('openingDone');
  Sound.sfx('quest');
}

async function c2Rosa() {
  let sel = 0;
  while (true) {
    const items = [
      { label: 'Buy bread', right: '4c', id: 'bread', desc: 'Food for one leg of a voyage.', disabled: S.coins < 4, whyNot: 'Not enough coins.' },
      { label: 'Chat', id: 'chat' },
      { label: 'Leave', id: 'leave' },
    ];
    const i = await Menu.list({ title: "Rosa's Bakery", subtitle: S.coins + ' coins', items, w: 240, sel });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    if (items[i].id === 'bread') { S.coins -= 4; Inv.add('bread'); Sound.sfx('coin'); }
    if (items[i].id === 'chat') {
      if (flag('oskarMet')) await Dlg.say('rosa', "Hookness? Margaret came from HOOKNESS? Well. That explains the way she gutted a herring. Fastest hands I ever saw.");
      else if (flag('compassFound')) await Dlg.say('rosa', "Margaret never once talked about where she came from. Only one time, she told me she missed the sound of puffins in the morning. I thought she was joking.");
      else await Dlg.say('rosa', 'A whale and her baby in the harbour! I sold out of buns by seven o\'clock.');
    }
  }
}

async function c2Hollis() {
  let sel = 0;
  while (true) {
    const items = [
      { label: 'Tin of grease', right: '15c', id: 'grease', desc: 'Thick black grease for old machinery.', disabled: S.coins < 15 || Inv.has('grease') || flag('weirOpen'), whyNot: Inv.has('grease') || flag('weirOpen') ? 'You only need one tin.' : 'Not enough coins.' },
      { label: 'Lucky lure', right: '25c', id: 'lure', desc: 'Fish bite faster and are easier to keep on the line.', disabled: S.coins < 25 || Inv.has('lure'), whyNot: Inv.has('lure') ? 'You already have one.' : 'Not enough coins.' },
      { label: 'Chat', id: 'chat' },
      { label: 'Leave', id: 'leave' },
    ];
    const i = await Menu.list({ title: 'Hollis & Co.', subtitle: S.coins + ' coins', items, w: 240, sel });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'grease') { S.coins -= 15; Inv.add('grease'); Sound.sfx('coin'); await Dlg.say('hollis', 'Grease? For a fifty-year-old winch? You will need the whole tin. Possibly a miracle as well. I do not sell miracles.'); }
    if (id === 'lure') { S.coins -= 25; Inv.add('lure'); Sound.sfx('coin'); }
    if (id === 'chat') await Dlg.say('hollis', flag('oskarMet') ? 'The Hartleys of Hookness? Rich as kings, once. Then the herring ran out, and the money did too.' : 'Going north? Fish up there are bigger and worth more. Arctic char, halibut... Tam pays well for them.');
  }
}

async function c2Finn() {
  const n = S.f.finn2 || 0;
  const lines = [
    "Lantern calves are born dark as coal, my granny said. In spring their mothers take them north, to where the sky comes down to touch the sea. And the sky lights them up.",
    flag('oskarMet') ? "Oskar? Old Oskar of Hookness? I sailed with his brother, sixty years back! Tell him Finn says his brother still owes me a boot." : "The north is no place for a little boat. Ice that moves like it has somewhere to be. Mind it.",
    'Up north the sky dances at night. Green and purple, like curtains. The northern lights. Prettiest thing you will ever see.',
  ];
  await Dlg.say('finn', lines[n % lines.length]);
  S.f.finn2 = n + 1;
}

async function c2Bo() {
  let sel = 0;
  while (true) {
    const items = [];
    if (!flag('iceBow')) items.push({ label: 'Forge an ice-breaking bow', right: '30c', id: 'bow', desc: 'Needs scrap iron (' + Inv.count('scrap') + '/1) and 30 coins. Lets Pip push through pack ice.', disabled: !Inv.has('scrap') || S.coins < 30, whyNot: !Inv.has('scrap') ? 'Bo needs good iron to forge with.' : 'You need 30 coins.' });
    items.push({ label: 'Chat', id: 'chat' });
    items.push({ label: 'Leave', id: 'leave' });
    const i = await Menu.list({ title: "Bo's Boatyard", subtitle: S.coins + ' coins', items, w: 270, sel: Math.min(sel, items.length - 1) });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    const id = items[i].id;
    if (id === 'bow') {
      Inv.remove('scrap'); S.coins -= 30; setFlag('iceBow'); Sound.sfx('quest');
      await Dlg.narrate('Bo fires up the forge. All afternoon the boatyard rings with hammering, and by evening Pip has a gleaming steel nose, shaped like the prow of an icebreaker.');
      Clock.advance(3);
      await Dlg.say('bo', 'There. She will crack ice like a breakfast egg now. Hookness iron, eh? They built things properly up there.');
    }
    if (id === 'chat') {
      if (flag('iceBow')) await Dlg.say('bo', 'Mind you keep that bow pointed AT the ice. Not sideways. Never sideways.');
      else if (flag('oskarMet')) await Dlg.say('bo', "Old cannery iron? Bring me a good lump and thirty coins and I will forge you a bow that laughs at ice.");
      else await Dlg.say('bo', "North? Pack ice would crush Pip's bow like a biscuit. You'd want a steel ice-bow. I'd need good iron, though, and there's none to spare in Saltmere.");
    }
  }
}

async function c2Greta() {
  const lines = [
    "A whale AND a calf in my harbour! I've had to close the east moorings. Nobody's complaining, mind. Half the village has been out there since dawn.",
    'Going north? The sea up there changes its mind about every five minutes. Take plenty of food, and steer clear of the ice.',
    "Your grandfather is driving me mad. 'Just a little sail, Greta.' No. Not until summer.",
  ];
  await Dlg.say('greta', lines[(S.f.greta2 = (S.f.greta2 || 0) + 1) % lines.length]);
}

async function c2Nell() {
  if (!flag('nellAsk')) {
    setFlag('nellAsk');
    await Dlg.say('nell', "Are you going north? Up where the puffins live? Puffins are my favourite bird. They look like tiny waiters.");
    await Dlg.say('nell', "If you find a puffin feather, I'll give you fifteen coins! I've been saving again.");
    return;
  }
  if (Inv.has('feather') && !flag('nellFeather')) {
    setFlag('nellFeather'); Inv.remove('feather');
    await Dlg.say('nell', "A REAL puffin feather! Pickles, look! ...She's trying to eat it. Pickles, NO.");
    Inv.addCoins(15);
    return;
  }
  await Dlg.say('nell', ['Pickles has been watching the baby whale all day. I think she wants to be friends.', "The baby whale doesn't glow. Do you think it's sad?"][(S.f.nell2 = (S.f.nell2 || 0) + 1) % 2]);
}

// ===========================================================================
// THE COTTAGE IN SPRING
// ===========================================================================
const C2_COTTAGE = Object.assign({}, COTTAGE, {
  id: 'c2_cottage', name: 'The Cottage',
  npcs: [{ id: 'ansel', x: 272 }],
  objects: [
    { x: 49, r: 24, label: 'Sleep', act: () => sleepHere('Your old bed in the corner. Grandpa snores like a foghorn next door.') },
    { x: 100, r: 8, label: 'Look at photo', act: () => Dlg.narrate(flag('oskarMet') ? "Grandma Margaret, laughing on the pier. Maggie Hartley of Hookness, who sailed away from everything she knew." : 'Grandma Margaret, laughing on the pier. For the first time you notice, far behind her, a little boat with a red sail.') },
    { x: 173, r: 12, label: 'Look out the window', act: () => Dlg.narrate(flag('wentNorth') ? 'The harbour is empty now. The whales have gone north, and the compass on your belt points after them.' : 'The two whales rest in the harbour. The big one glows. The little one is a dark shape beside her, like a shadow.') },
    { x: 272, r: 12, label: 'Talk to Grandpa', act: () => c2Ansel() },
    { x: 304, r: 10, label: 'Climb up to the attic trunk', act: () => c2Trunk() },
    { x: 330, r: 10, label: 'Cook fish on the stove', act: cookFish },
    { x: 386, r: 10, label: 'Open drawer', act: () => Dlg.narrate('String, candle stubs, and that same very old biscuit. Grandpa refuses to throw it away.') },
    { x: 446, r: 12, label: 'Go outside', act: () => { Sound.sfx('door'); Game.goto('c2_village', { x: 77 }); } },
  ],
  async onEnter(sc, p) { if (p.ending) await c2Ending(); },
});

async function c2Trunk() {
  if (!flag('compassFound')) { await Dlg.narrate("Grandpa's old sea trunk. He doesn't like anyone opening it."); return; }
  if (Inv.has('sweater')) { await Dlg.narrate('The trunk is full of old letters, a wedding veil and a pair of very small boots. You close it gently.'); return; }
  await Dlg.narrate('You climb the ladder into the attic and kneel by the old sea trunk. The lid creaks. Inside, it smells of lavender.');
  await Dlg.narrate("On top, folded neatly: a thick, oily, cream-coloured wool sweater. It's enormous. You pull it on over your raincoat, and it comes down to your knees.");
  Inv.add('sweater'); Sound.sfx('pickup');
  await Dlg.narrate('Underneath the sweater is a photograph you have never seen before.');
  await Dlg.narrate('A girl of about your age, scowling at the camera, in front of a long tin building. Painted on the wall behind her: HOOKNESS CANNERY. HARTLEY & SONS.');
  Inv.add('photo');
  await Dlg.say('you', 'Hookness? Where is that? And who are the Hartleys?');
}

async function c2Ansel() {
  if (!flag('compassFound')) { await Dlg.say('ansel', 'Go and look at the pier, little gull.'); return; }
  if (Inv.has('photo') && !flag('anselPhoto')) {
    setFlag('anselPhoto');
    await Dlg.say('ansel', "Let me see that photo... That's her. That's my Maggie, scowling like that. But Hookness? That old cannery, way up north?");
    await Dlg.say('ansel', "I worked the herring up that way the year I met her, but I never set foot in Hookness. They didn't like Saltmere boys.");
    return;
  }
  if (flag('oskarMet') && !flag('anselHartley')) {
    setFlag('anselHartley');
    await Dlg.say('ansel', "Hartley. Margaret HARTLEY. She told me her name was Margaret, and that was all. When we married she took my name, and never once mentioned another one.");
    await Dlg.say('ansel', "She ran away from her own father, at seventeen, across the ice. Oh, Maggie. Why didn't you tell me?");
    return;
  }
  if (S.bottles.includes(1) && !flag('anselWren')) {
    setFlag('anselWren');
    await Dlg.say('ansel', "'The gear is too heavy to carry, so I'm leaving it here with her.' The Wren. That little red sail in the ice. I saw it, the morning I found her. I saw it, and I never asked.");
    return;
  }
  const lines = [
    !flag('northChart') ? "Bram's charts first. Kettle Point is two legs of food away, so pack well." : 'Follow the compass, little gull. And keep that sweater on.',
    "That calf... I keep thinking about it. Your grandmother would have been out there already, in a rowboat if she had to.",
    'Catch something big up north and bring it home. Halibut. I have not had halibut in thirty years.',
  ];
  await Dlg.say('ansel', lines[(S.f.ansel2 = (S.f.ansel2 || 0) + 1) % lines.length]);
}

// ===========================================================================
// KETTLE POINT IN SPRING
// ===========================================================================
const C2_LIGHTHOUSE = Object.assign({}, LIGHTHOUSE, {
  id: 'c2_lighthouse', sub: 'Spring', music: 'sea',
  drawMid(w, sc, cam, t) { if (S.boat) drawBoat(w, boatCfg(), 42 - cam, 239, t, { rough: 1.5 }); },
  npcs: [{ id: 'bram', x: 280 }],
  objects: [
    boatObject(42, 'lighthouse'),
    { x: 280, label: 'Talk to Bram', act: () => c2Bram() },
    { x: 334, r: 8, label: "Read the keeper's log", act: () => Dlg.narrate('"Spring. Lamp burning well. Saw two lights in the water going north, one big, one so small I nearly missed it. Didn\'t miss it."') },
    { x: LH_X, r: 10, label: 'The lighthouse', act: () => Dlg.narrate('The lamp is burning, and Bram climbs those stairs every evening now, slowly, singing all the way up.') },
    { x: 560, r: 10, label: 'Fish from the cliff', act: sc => fishHere(sc, 568, 240, 1) },
  ],
  onEnter: null,
});

async function c2Bram() {
  if (!flag('northChart')) {
    await Dlg.say('bram', "Is that Ansel's grandchild? Back so soon! Come here, let me hear you. My eyes are no better, but my ears are excellent.");
    await Dlg.say('you', "I need to go north, Bram. Grandma's compass points that way, and there's a whale calf that needs to get there too.");
    await Dlg.say('bram', "North. Hm. The old keeper before me charted every rock and floe up there. Hold on.");
    await Dlg.narrate('Bram rummages in a sea chest and pulls out a stiff, yellowed chart covered in tiny handwriting.');
    await Dlg.say('bram', 'Puffin Stacks. Hookness, with its old cannery. The Glass Floe, where the ice never melts. And the Narrows, a channel through the cliffs. Beyond that... nobody charted.');
    setFlag('northChart'); Sound.sfx('quest');
    await Dlg.narrate('New places have appeared on your sea chart.');
    if (!Inv.has('sweater')) await Dlg.say('bram', "And for goodness' sake, wrap up warm. That yellow coat won't keep out the cold up there.");
    return;
  }
  const lines = [
    "The ice up north moves with the tide. It drifts from lane to lane. Watch where it is going, not where it is.",
    "Saw two whale-lights go past last night, heading north. Or I dreamed it. At my age they feel the same.",
  ];
  await Dlg.say('bram', lines[(S.f.bram2 = (S.f.bram2 || 0) + 1) % lines.length]);
}

// ===========================================================================
// PUFFIN STACKS
// ===========================================================================
const northWeather = () => nightFactor(S.time) > 0.5 ? 'aurora' : (S.day % 2 === 1 ? 'snow' : 'cloudy');
const PUFFIN_SPOTS = [[150, 0], [176, 1], [432, 0], [458, 1], [476, 0], [500, 1], [524, 0], [556, 1]];
const PUFFIN = {
  id: 'puffin', name: 'Puffin Stacks', sub: 'Thousands of puffins, and one human', width: 640, horizon: 160, spawn: 52, minX: 16, maxX: 610,
  music: 'island', ambience: { sea: 0.8, wind: 0.5 },
  fishSpot: 'north', weather: northWeather, snowAmount: 0.4,
  ground: makeGround([[0, 224], [70, 224], [90, 224], [150, 218], [190, 206], [220, 200], [360, 200], [390, 208], [420, 212], [580, 212], [610, 226], [640, 250]]),
  build(c, sc) {
    const g = roughen(this.ground, 2);
    paintTerrain(c, 80, 640, g, (x, d, y) => (x > 200 && x < 380 && d < 3) ? MAT.grass(x, d, y) : (x > 200 && x < 380) ? MAT.rock(x, d, y) : MAT.snowrock(x, d, y));
    for (let x = 0; x < 82; x += 20) rect(c, x + 4, 228, 4, 42, '#3e2a1a');
    paintTerrain(c, 0, 82, () => 224, MAT.planks, 229);
    // steps up to the hut
    for (let i = 0; i < 6; i++) rect(c, 168 + i * 8, this.ground(172 + i * 8) - 1, 9, 2, '#7a5a3a');
    const r = drawHouse(c, 236, 200, { w: 74, h: 56, wall: '#a83a2a', wallDark: '#7a2a20', trim: '#f4f0e8', roof: 'gable', roofCol: '#3a3a42', roofH: 24, roofDark: '#2a2a30', door: 30, doorCol: '#2a3a4a', windows: [[8, 20, 12, 10], [54, 20, 12, 10]], chimney: 56, seed: 21 });
    sc.wins = r.wins;
    // telescope on a tripod
    line(c, 336, 200, 342, 186, '#3a3a40'); line(c, 348, 200, 342, 186, '#3a3a40'); line(c, 342, 200, 342, 186, '#3a3a40');
    rect(c, 336, 182, 14, 4, '#c8a040'); rect(c, 349, 181, 3, 6, '#8a7030');
    // burrows
    for (const bx of [440, 470, 505, 540, 568]) ellipse(c, bx, this.ground(bx) + 4, 4, 2, '#1a1612');
    // counting board
    rect(c, 378, 182, 2, 26, '#5a4030'); rect(c, 368, 178, 22, 12, '#e8dcc0'); drawText(c, '4108', 370, 180, '#5a3a20');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(81, 8, 15, 90, 0.1, 'fair', 1600);
    sc.clouds.draw(w, cam, t * 3);
    const sil = rgbStr(mixRgb(skyColors(S.time, 'cloudy')[2], '#2a3a4a', 0.4));
    drawSilhouette(w, 'cannery', 540 - cam * 0.2, 160, sil, t);
    Sea.draw(w, 160, H, cam, t, 'arctic', S.time, { rough: 1.2 });
    // tall sea stacks in the middle distance
    const stacks = [[40, 26, 120], [130, 34, 150], [300, 22, 104], [470, 40, 140], [600, 28, 118]];
    for (const [sx, sw, sh] of stacks) {
      const x0 = Math.round(sx - cam * 0.55);
      if (x0 > W + 40 || x0 + sw < -40) continue;
      drawSeaStack(w, x0, 200, sw, sh, sx);
    }
    for (let i = 0; i < 9; i++) {
      const a = t * (0.5 + i * 0.07) + i * 1.3;
      drawFlyingPuffin(w, (((i * 90 + t * 20 * (i % 2 ? 1 : -1) - cam * 0.6) % 760) + 760) % 760 - 60, 60 + i * 9 + Math.sin(a) * 8, t, i);
    }
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 42 - cam, 239, t, {});
    for (const [x, l] of PUFFIN_SPOTS) drawPuffin(w, x - cam, this.ground(x), t, x, !!l);
    if (!flag('feather')) { const gy = this.ground(588); line(w, 586 - cam, gy - 1, 591 - cam, gy - 4, '#1a1a1e'); px(w, 591 - cam, gy - 4, '#ffffff'); }
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'arctic', 0, 120 - cam, cam); frontWater(w, 238, t, 'arctic', 606 - cam, W, cam); },
  emissive(c, sc, cam, t, nf) {
    if (nf < 0.3 || !sc.wins) return;
    for (const wi of sc.wins) { c.globalAlpha = nf * 0.9; rect(c, wi.x - cam, wi.y, wi.w, wi.h, '#f6c870'); c.globalAlpha = 1; }
  },
  lights(sc, cam, t, nf) { return (sc.wins || []).map(wi => ({ x: wi.x + wi.w / 2 - cam, y: wi.y + wi.h / 2, r: 18, col: '#ffb860', a: 0.35 })); },
  npcs: [{ id: 'ylva', x: 300 }],
  objects: [
    boatObject(42, 'puffin'),
    { x: 300, label: 'Talk to Ylva', act: () => c2Ylva() },
    {
      x: 342, r: 8, label: 'Look through the telescope', act: () => Dlg.narrate(nightFactor(S.time) > 0.5
        ? 'The northern lights fill the eyepiece, rippling green and violet over the sea. Far to the north-east, the black cliffs of the Narrows.'
        : 'Through the telescope: chimneys and rusty roofs on a far-off shore to the north-west. Hookness. And north-east, two black cliffs with a gap between them: the Narrows.'),
    },
    { x: 500, r: 30, label: 'Watch the puffins', act: () => Dlg.narrate('Puffins pop in and out of their burrows, bowing to each other and shuffling about like tiny waiters in black coats. One of them stares at you, deeply unimpressed.') },
    { x: 588, r: 8, label: 'Pick up a feather', when: () => !flag('feather'), act: async () => { setFlag('feather'); Inv.add('feather'); Sound.sfx('pickup'); await Dlg.narrate('A small black-and-white puffin feather. Nell would love this.'); } },
    { x: 604, r: 8, label: 'Fish', act: sc => fishHere(sc, 604, 240, 1) },
  ],
  async onEnter() {
    if (!flag('wentNorth')) setFlag('wentNorth');
    if (!flag('puffinVisit')) {
      setFlag('puffinVisit');
      await wait(0.5);
      await Dlg.narrate('The Puffin Stacks: towers of rock rising out of the cold sea, every ledge crowded with puffins. On the lowest stack sits a little red hut, with smoke curling from the chimney.');
    }
  },
};

async function c2Ylva() {
  if (!flag('ylvaMet')) {
    setFlag('ylvaMet');
    await Dlg.say('ylva', "Oh! A BOAT! Nobody comes out here except storms and puffins. Hello! I'm Ylva. I count puffins. Four thousand and something, at the last count. They keep moving.");
    await Dlg.narrate('You show her the compass.');
    await Dlg.say('ylva', "North-north-west from Saltmere? From here that points straight at the Narrows. And beyond the Narrows... the Aurora Grotto. If the old stories are true.");
    await Dlg.say('ylva', "My grandmother told me lantern whales used to pass these stacks every spring, heading north through the Narrows to a cave where the northern lights come right down to the sea. That's where the calves get their glow.");
    await Dlg.say('ylva', 'Then, fifty years ago, the old cannery at Hookness closed its weir across the Narrows for good. And the whales stopped coming.');
    await Dlg.say('you', "There's a lantern calf in Saltmere harbour with no light at all.");
    await Dlg.say('ylva', "Then it HAS to get through the Narrows. But that weir is shut tight. Only the old caretaker at Hookness would know how to open it. Oskar. He's grumpy. Very grumpy. Bring biscuits.");
    await Dlg.say('ylva', "Oh, and could you do me a favour? A storm washed out the sand eels and my puffin chicks are starving. If you catch me three herring, I'll find something to trade you.");
    Sound.sfx('quest');
    return;
  }
  if (!Inv.has('crank') && !flag('weirOpen')) {
    if (Inv.count('herring') >= 3) {
      Inv.remove('herring', 3);
      await Dlg.say('ylva', "Three lovely herring! The chicks will go mad for these. Thank you, thank you!");
      await Dlg.say('ylva', "Now, something to trade... I don't have much. Hmm. How about this?");
      await Dlg.narrate('Ylva pulls a heavy iron handle out from under her door, where it was holding the door open.');
      await Dlg.say('ylva', "Oskar gave it to me years ago. He said it belonged to 'the gate that should never have been shut.' I've been using it as a doorstop.");
      Inv.add('crank'); Sound.sfx('quest');
      if (flag('oskarMet')) await Dlg.say('you', "That's the crank handle for the weir winch!");
      return;
    }
    await Dlg.say('ylva', 'Three herring for my chicks, if you can! Herring like cold, open water. You have ' + Inv.count('herring') + ' so far.');
    return;
  }
  const lines = [
    flag('weirOpen') ? "You opened the weir?! I saw the whales go through from my telescope! I cried. A lot. The puffins were very confused." : "Have you been to Hookness yet? Oskar will growl at you. Don't let him. Underneath, he's a big soft walrus.",
    'Four thousand, one hundred and eight. Four thousand, one hundred and nine. Hold still, you!',
  ];
  await Dlg.say('ylva', lines[(S.f.ylva = (S.f.ylva || 0) + 1) % lines.length]);
}

// ===========================================================================
// HOOKNESS CANNERY
// ===========================================================================
const CANNERY = {
  id: 'cannery', name: 'Hookness', sub: 'The old cannery', width: 960, horizon: 150, spawn: 60, minX: 16, maxX: 940,
  music: () => flag('oskarMet') ? 'sea' : 'eerie', ambience: { sea: 0.6, wind: 0.6, fire: 0.1 },
  fishSpot: 'north', weather: northWeather, snowAmount: 0.7,
  ground: makeGround([[0, 224], [140, 224], [170, 222], [260, 218], [300, 214], [700, 214], [740, 210], [940, 210], [960, 230]]),
  build(c, sc) {
    const g = roughen(this.ground, 1);
    for (let x = 0; x < 142; x += 22) rect(c, x + 4, 228, 5, 42, '#3a281a');
    paintTerrain(c, 0, 142, () => 224, MAT.planks, 229);
    paintTerrain(c, 140, 960, g, MAT.gravel);
    // the cannery shed
    corrugated(c, 300, 134, 230, 80, '#7a8a8e', '#525e62', true);
    for (let i = 0; i < 246; i++) rect(c, 292 + i, 122 + Math.abs(i - 123) * 0.08, 1, 14, i % 5 === 0 ? '#5a3a2a' : '#8a4e32');
    drawWreckSign(c, 342, 142, 'HOOKNESS CANNERY', '#e8dcc0', '#3a2a1a');
    drawWreckSign(c, 362, 158, 'HARTLEY & SONS', '#2a3a4a', '#e8dcc0');
    rect(c, 386, 176, 50, 38, '#2a2420');
    for (let j = 0; j < 38; j += 4) rect(c, 386, 176 + j, 50, 1, '#4a3a30');
    rect(c, 400, 180, 22, 6, '#1a1612');
    for (const wx of [314, 456, 500]) { rect(c, wx, 172, 16, 12, '#2a3034'); line(c, wx, 172, wx + 16, 184, '#5a6a70'); }
    // smokestack
    for (let y = 40; y < 134; y++) rect(c, 318, y, 12, 1, y % 6 === 0 ? '#5a3a2a' : '#7a4a34');
    rect(c, 316, 38, 16, 3, '#4a2a20');
    // conveyor to the pier
    for (let i = 0; i < 120; i++) { const x = 180 + i, y = 196 - i * 0.18; px(c, x, y, '#4a4a50'); if (i % 10 === 0) rect(c, x, y, 1, 222 - y, '#3a3a40'); }
    // can pile & scrap heap
    for (let i = 0; i < 30; i++) ellipse(c, 545 + (i % 6) * 4, 210 - Math.floor(i / 6) * 3, 2, 1, i % 3 ? '#9a8a7a' : '#8a4a2a');
    for (let i = 0; i < 40; i++) { const x = 560 + hash1(i) * 34, y = 214 - hash2(i, 3) * 14; rect(c, x, y, 3 + hash1(i + 1) * 6, 2, ['#6a3a20', '#5a5a62', '#8a4a2a', '#4a4a50'][i % 4]); }
    // notice board
    rect(c, 618, 186, 2, 28, '#4a3020'); rect(c, 632, 186, 2, 28, '#4a3020'); rect(c, 612, 176, 28, 16, '#6a5038');
    rect(c, 615, 179, 10, 9, '#e8e0d0'); rect(c, 627, 180, 10, 7, '#d8d0b8');
    // Oskar's cottage
    const r = drawHouse(c, 690, 210, { w: 76, h: 60, wall: '#3e5a4a', wallDark: '#2a4034', trim: '#e8e0d0', roof: 'gable', roofCol: '#4a3a32', roofH: 26, roofDark: '#2e2420', door: 32, doorCol: '#6a3a2a', windows: [[8, 22, 12, 10], [56, 22, 12, 10]], chimney: 60, seed: 33 });
    sc.wins = r.wins.slice();
    // smokehouse
    for (let j = 0; j < 30; j++) rect(c, 790, 180 + j, 26, 1, j % 3 === 2 ? '#3a2818' : '#5a3e28');
    for (let i = 0; i < 34; i++) rect(c, 786 + i, 174 + Math.abs(i - 17) * 0.4, 1, 6, '#3a2a20');
    // the Hartley house, boarded up
    const r2 = drawHouse(c, 846, 210, { w: 92, h: 78, wall: '#c8c0b0', wallDark: '#9a9284', trim: '#6a6258', roof: 'gable', roofCol: '#4a4e58', roofH: 32, roofDark: '#33363e', door: 40, doorCol: '#3a3a3a', windows: [[10, 26, 14, 14], [66, 26, 14, 14]], atticWin: true, seed: 35 });
    for (const wi of r2.wins.slice(0, 2)) { line(c, wi.x - 1, wi.y, wi.x + wi.w, wi.y + wi.h, '#6a5038'); line(c, wi.x - 1, wi.y + wi.h, wi.x + wi.w, wi.y, '#6a5038'); }
    rect(c, r2.wins[2].x + 1, r2.wins[2].y + 1, 4, 4, '#b83a2a');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(91, 8, 15, 80, 0.1, 'fair', 1800);
    sc.clouds.draw(w, cam, t * 3);
    // snowy hills behind
    for (let x = 0; x < W; x++) {
      const hx = x + cam * 0.3;
      const hh = 60 + Math.sin(hx * 0.008) * 24 + Math.sin(hx * 0.031) * 6;
      rect(w, x, 150 - hh * 0.4, 1, hh * 0.4 + 2, '#dfe8ee');
      rect(w, x, 150 - hh * 0.4 + 6 + Math.sin(hx * 0.05) * 3, 1, 3, '#b8c8d4');
    }
    Sea.draw(w, 150, H, cam, t, 'arctic', S.time);
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 50 - cam, 239, t, {});
    // smoke from Oskar's chimney and the smokehouse
    for (const [cx, cy] of [[753, 118], [803, 168]]) for (let i = 0; i < 5; i++) {
      const ph = (t * 0.25 + i / 5) % 1;
      w.globalAlpha = 0.3 * (1 - ph);
      ellipse(w, cx - cam - ph * 14 + Math.sin(ph * 5 + i) * 2, cy - ph * 40, 2 + ph * 4, 2 + ph * 3, '#d8dce4');
    }
    w.globalAlpha = 1;
    const dx = 728 + Math.sin(t * 0.4) * 14;
    drawDog(w, dx - cam, this.ground(dx), t, Math.cos(t * 0.4) < 0);
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'arctic', 0, 150 - cam, cam); },
  emissive(c, sc, cam, t, nf) {
    if (nf < 0.3 || !sc.wins) return;
    for (const wi of sc.wins) { c.globalAlpha = nf * 0.9; rect(c, wi.x - cam, wi.y, wi.w, wi.h, '#f6c870'); c.globalAlpha = 1; }
  },
  lights(sc, cam, t, nf) { return (sc.wins || []).map(wi => ({ x: wi.x + wi.w / 2 - cam, y: wi.y + wi.h / 2, r: 18, col: '#ffb860', a: 0.35 })); },
  npcs: [{ id: 'oskar', x: 770 }],
  objects: [
    boatObject(50, 'cannery'),
    { x: 411, r: 16, label: 'Peer through the cannery doors', act: () => Dlg.narrate('Through a gap in the boards: rows of silent machines under a blanket of dust, and a calendar on the wall still showing April, 1974.') },
    {
      x: 576, r: 16, label: 'Search the scrap heap', act: async () => {
        if (!flag('oskarMet')) { await Dlg.narrate('A heap of rusty iron, old cans and broken machine parts. Better ask before taking anything.'); return; }
        if (Inv.has('scrap') || flag('iceBow')) { await Dlg.narrate('Plenty more rust where that came from. You have what you need.'); return; }
        await Dlg.narrate('You dig through the heap and haul out a great slab of good, heavy iron. It weighs a ton.');
        Inv.add('scrap'); Sound.sfx('thud');
      },
    },
    { x: 626, r: 10, label: 'Read the notice board', act: () => Dlg.narrate('Old notices, curled and yellow. One says: "BY ORDER OF J. HARTLEY. THE WEIR AT THE NARROWS IS CLOSED. FOR GOOD." Someone has drawn a very rude whale on it in pencil.') },
    { x: 740, r: 10, label: 'Pat the dog', act: () => Dlg.narrate('The big grey dog leans its whole weight against your legs and sighs happily. Its tag says BJORN.') },
    { x: 770, label: 'Talk to Oskar', act: () => c2Oskar() },
    { x: 803, r: 10, label: 'Cook fish in the smokehouse', act: cookFish },
    { x: 892, r: 16, label: 'The big boarded-up house', act: () => Dlg.narrate(flag('oskarMet') ? 'The Hartley house. Up in the attic window hangs a faded red curtain. Maggie\'s room.' : 'A big house, its windows boarded up. In the little attic window, a scrap of faded red curtain.') },
  ],
  async onEnter() {
    if (!flag('canneryVisit')) {
      setFlag('canneryVisit');
      await wait(0.5);
      await Dlg.narrate('Hookness. A rusting cannery, a cold grey shore, and silence. Only one chimney in the whole place is smoking.');
    }
  },
};

async function c2Oskar() {
  if (!flag('oskarMet')) {
    await Dlg.say('oskar', "Who's that? Boat people. Bah. Bjorn, don't you DARE wag at them.");
    await Dlg.narrate('The big grey dog wags at you anyway.');
    await Dlg.say('oskar', 'Nothing to see here. Cannery has been shut for fifty years. Go home.');
    await Dlg.narrate('You hold out the compass.');
    await Dlg.say('oskar', '...Where did you get that?');
    await Dlg.say('oskar', "I'd know that compass anywhere. I scratched those letters on it myself, with a nail, when we were eleven. M.H. Maggie Hartley.");
    await Dlg.say('you', 'Margaret Hale. She was my grandmother.');
    await Dlg.say('oskar', "Hale. So she married that Saltmere fisher boy after all. The one who pulled her off the ice. ...Was your grandmother. I'm sorry, child.");
    await Dlg.say('oskar', "Maggie grew up here. Her father, old John Hartley, owned all of this. The cannery, the boats... and the weir across the Narrows.");
    await Dlg.say('oskar', "The weir caught herring. But every spring it blocked the whales. Maggie hated it. She'd sneak out at night and wind the gate open so the lantern whales could pass. Her father would close it in the morning. Back and forth, every year.");
    await Dlg.say('oskar', "Then one spring he said: no more. Shut it for good. And Maggie took the drive gear out of the winch, so nobody could ever close it again.");
    await Dlg.say('oskar', "So they closed it by hand. Twenty men and ropes. And without that gear, nobody could ever open it again. Not even her.");
    await Dlg.say('oskar', "She ran away that same night in her little boat, the Wren. Fifty years, and not one letter.");
    await Dlg.say('you', "There's a lantern calf in Saltmere with no light. It needs to get through the Narrows.");
    await Dlg.say('oskar', '...Then the weir has to open. Fine. FINE. For Maggie.');
    await Dlg.say('oskar', "Here's the key to the winch house. But that winch needs three things it hasn't had in fifty years. Its crank handle, which I gave to that puffin girl. A good tin of grease. And Maggie's brass gear.");
    await Dlg.say('oskar', "The gear went down with the Wren, in the ice at the Glass Floe. You'll need an ice-bow to get near it. Take iron from the scrap heap. Any shipwright worth his salt can forge you one.");
    Inv.add('winchKey');
    setFlag('oskarMet'); Sound.sfx('quest');
    return;
  }
  if (S.bottles.includes(1) && !flag('oskarWren')) {
    setFlag('oskarWren');
    await Dlg.narrate('You show Oskar the pages from the Wren.');
    await Dlg.say('oskar', "'Oskar, if you ever find this: I'm sorry. Look after Freya.' ...Freya was my old dog. Bjorn's great-great-grandmother.");
    await Dlg.say('oskar', "Fifty years I've been angry with her for leaving. And she was saying sorry the whole time. Under the ice.");
    return;
  }
  const lines = [
    flag('weirOpen') ? "You did it. The gate is open. I heard the chains from here, rattling all night like old bones dancing. Best sound I ever heard." : "Key, crank, grease and gear. Then crank that winch like your life depends on it. It's been asleep a long time.",
    "Bjorn likes you. Bjorn likes everybody. Bjorn is a terrible guard dog.",
    "Smokehouse still works, if you want to cook your fish. Use it. Nobody else does.",
  ];
  await Dlg.say('oskar', lines[(S.f.oskar = (S.f.oskar || 0) + 1) % lines.length]);
}

// ===========================================================================
// THE GLASS FLOE
// ===========================================================================
const FLOE = {
  id: 'floe', name: 'The Glass Floe', sub: 'Ice that never melts', width: 700, horizon: 150, spawn: 56, minX: 30, maxX: 660,
  music: 'eerie', ambience: { sea: 0.4, wind: 0.8 },
  fishSpot: 'ice', weather: northWeather, snowAmount: 0.6,
  ground: makeGround([[0, 232], [40, 222], [150, 220], [200, 216], [240, 220], [400, 218], [470, 214], [520, 220], [640, 220], [670, 232], [700, 250]]),
  build(c, sc) {
    paintTerrain(c, 30, 680, roughen(this.ground, 1), MAT.ice);
    // pressure ridges
    for (const rx of [120, 300, 470, 610]) for (let i = 0; i < 16; i++) { const hgt = Math.round(5 - Math.abs(i - 8) * 0.6); rect(c, rx + i, this.ground(rx + i) - hgt, 1, hgt, i % 3 ? '#e8f4fa' : '#ffffff'); }
    // ice fishing hole
    ellipse(c, 560, this.ground(560) + 3, 7, 2, '#123a52'); ellipse(c, 560, this.ground(560) + 3, 5, 1, '#1e4e6a');
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(101, 7, 15, 80, 0.1, 'fair', 1600);
    sc.clouds.draw(w, cam, t * 3);
    for (let i = 0; i < 5; i++) drawSilhouette(w, 'ice', i * 180 - cam * 0.2, 150, rgbStr(mixRgb(skyColors(S.time, 'cloudy')[2], '#f0f8fc', 0.5)), t);
    Sea.draw(w, 150, H, cam, t, 'arctic', S.time);
    // distant flat ice sheet
    rect(w, 0, 176, W, 6, '#d8eaf2'); rect(w, 0, 176, W, 1, '#f4fbff');
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 20 - cam, 238, t, {});
    drawWren(w, 380 - cam, this.ground(380) + 6, !flag('wrenFound'));
    if (!flag('sealFreed')) {
      const gy = this.ground(206);
      rect(w, 196 - cam, gy - 1, 22, 3, '#5a8aa8');
      drawSealPup(w, 206 - cam, gy + 1, t);
    }
  },
  drawFront(w, sc, cam, t) { frontWater(w, 236, t, 'arctic', 0, 34 - cam, cam); frontWater(w, 236, t, 'arctic', 676 - cam, W, cam); },
  npcs: [],
  objects: [
    boatObject(40, 'floe'),
    {
      x: 206, r: 12, label: 'The seal pup', when: () => !flag('sealFreed'), act: async () => {
        await Dlg.narrate('A fluffy white seal pup is stuck in a crack in the ice, crying for its mother. The sides are too steep for it to climb out.');
        const r = await Dlg.ask(null, 'Help it?', ['Chip the ice with your knife', 'Leave it']);
        if (r !== 0) return;
        Sound.sfx('chop'); await wait(0.3); Sound.sfx('chop');
        await Dlg.narrate('You chip a little ramp into the ice. The pup wriggles up it, flops across the ice, and slides into the sea with a happy splash.');
        Sound.sfx('splash');
        await Dlg.narrate('A moment later, a big grey head pops up out of the water beside it. Its mother. She looks at you for a long moment, then they both dive.');
        setFlag('sealFreed');
      },
    },
    {
      x: 380, r: 20, label: () => flag('wrenFound') ? 'The Wren' : 'A boat frozen in the ice', act: async () => {
        if (flag('wrenFound')) { await Dlg.narrate("The Wren sits in her ice, little red sail and all. Fifty years she waited here. You pat her hull."); return; }
        await Dlg.narrate('A small boat, frozen into the floe up to her gunwales, as if the ice swallowed her in one gulp. Her faded red sail still hangs from the mast. On the bow: WREN.');
        await Dlg.say('you', "Maggie's boat...");
        await Dlg.narrate('You chip away the ice around the hatch with your knife. It takes a long time. Inside, wrapped in oilcloth, is a heavy brass gear.');
        Sound.sfx('chop'); await wait(0.3); Sound.sfx('chop');
        Inv.add('gear'); Sound.sfx('pickup');
        await Dlg.narrate('Tucked beside it, a little tin box. Inside are two folded pages, in handwriting you know from a hundred birthday cards.');
        S.bottles.push(0, 1);
        await Dlg.narrate(SPRING[0].body);
        await Dlg.narrate(SPRING[1].body);
        setFlag('wrenFound');
        Toast.show("Maggie's pages saved to your Journal", 'letter');
      },
    },
    { x: 560, r: 10, label: 'Fish through the ice hole', act: sc => { sc.player.x = 546; sc.player.facing = 1; return goFishing({ rodX: 546 - sc.cam + 4, rodY: sc.ground(546) - 12, waterY: sc.ground(560) + 2, dir: 1, spot: 'ice', castDist: 12 }); } },
  ],
  async onEnter() {
    if (!flag('floeVisit')) {
      setFlag('floeVisit');
      await wait(0.5);
      await Dlg.narrate('The Glass Floe: a wide white plain of ice, so clear in places you can see the dark water moving underneath your boots.');
    }
  },
};

// ===========================================================================
// THE NARROWS
// ===========================================================================
const NARROWS = {
  id: 'narrows', name: 'The Narrows', sub: 'The weir', width: 720, horizon: 150, spawn: 56, minX: 20, maxX: 640,
  music: () => flag('weirOpen') ? 'wonder' : 'eerie', ambience: { sea: 0.6, wind: 0.7 },
  fishSpot: 'north', weather: northWeather, snowAmount: 0.5,
  ground: makeGround([[0, 224], [70, 224], [100, 220], [200, 216], [300, 212], [460, 208], [520, 206], [600, 206], [640, 214], [690, 230], [720, 250]]),
  build(c, sc) {
    for (let x = 0; x < 72; x += 20) rect(c, x + 4, 228, 4, 42, '#3e2a1a');
    paintTerrain(c, 0, 72, () => 224, MAT.planks, 229);
    paintTerrain(c, 70, 720, roughen(this.ground, 3), MAT.snowrock);
  },
  drawBack(w, sc, cam, t) {
    if (!sc.clouds) sc.clouds = new CloudLayer(111, 6, 15, 70, 0.1, 'fair', 1600);
    sc.clouds.draw(w, cam, t * 3);
    Sea.draw(w, 150, H, cam * 0.7, t, 'arctic', S.time);
    // towering cliffs either side of the channel
    const cx = -cam * 0.7;
    for (let x = 0; x < W; x++) {
      const wx = x - cx;
      let top = null;
      if (wx < 150) top = 30 + wx * 0.25 + Math.sin(wx * 0.1) * 6;
      else if (wx > 560) top = 30 + (760 - wx) * 0.22 + Math.sin(wx * 0.13) * 6;
      if (top === null) continue;
      for (let y = Math.round(top); y < 200; y++) {
        const d = y - top;
        let col = d < 3 ? '#f4f8fb' : (y % 17 === 0 && hash2(Math.floor(wx / 9), y) > 0.7) ? '#dce8f0' : (hash2(Math.floor(wx / 7), y >> 3) > 0.5 ? '#3e3c3a' : '#4a4744');
        if (col !== '#f4f8fb' && hash2(wx, y) > 0.985) col = '#6a6662';
        px(w, x, y, col);
      }
    }
    // the weir across the channel
    const open = sc.weirOpenAnim !== undefined ? sc.weirOpenAnim : (flag('weirOpen') ? 1 : 0);
    const beyond = flag('weirOpen') && !sc.swimming;
    sc.backs = null;
    if (sc.whalesHere && beyond) { w.globalAlpha = 0.7; sc.backs = drawWhaleBacks(w, 300 + cx, 182, t, false); w.globalAlpha = 1; }
    drawWeir(w, Math.round(150 + cx), Math.round(560 + cx), 192, open, t);
    if (sc.whalesHere && !beyond) sc.backs = drawWhaleBacks(w, 210 + cx + (sc.whaleSwim || 0), 200, t, false);
  },
  drawMid(w, sc, cam, t) {
    if (S.boat) drawBoat(w, boatCfg(), 36 - cam, 239, t, {});
    drawWinchHouse(w, 520 - cam, this.ground(540), sc.gear || 0);
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'arctic', 0, 90 - cam, cam); frontWater(w, 238, t, 'arctic', 670 - cam, W, cam); },
  emissive(c, sc, cam, t, nf) {
    if (!sc.backs) return;
    for (const s of sc.backs) {
      if (s.calf) continue;
      const a = 0.4 + 0.3 * Math.sin(t * 1.5 + s.x);
      c.globalAlpha = a; c.drawImage(glowSprite(5, '#7ff7e8', 3, 0.9), Math.round(s.x - 5), Math.round(s.y - 5)); c.globalAlpha = 1;
    }
  },
  update(sc, dt) {
    sc.whalesHere = flag('wentNorth') && !flag('grottoReached');
    if (sc.crank) {
      const k = sc.crank;
      for (const key of ['left', 'right']) if (Input.pressed(key)) {
        k.p += key !== k.last ? 0.045 : 0.012;
        k.last = key;
        sc.gear = (sc.gear || 0) + 0.25;
        Sound.sfx(Math.random() < 0.5 ? 'reel' : 'blip');
      }
      if (Input.pressed('act')) { k.p += 0.02; sc.gear = (sc.gear || 0) + 0.1; Sound.sfx('reel'); }
      k.p = Math.max(0, k.p - dt * 0.05);
      sc.weirOpenAnim = Math.min(1, k.p);
      if (k.p >= 1) { const done = k.done; sc.crank = null; done(); }
    }
    if (sc.whaleSwim !== undefined && sc.swimming) sc.whaleSwim += dt * 30;
  },
  overlay(c, sc, cam, t) {
    if (!sc.crank) return;
    const k = sc.crank;
    panel(c, W / 2 - 110, 40, 220, 46);
    drawText(c, 'CRANK THE WINCH!', W / 2, 46, UIC.hi, { align: 'center' });
    drawText(c, 'Press ← and → one after the other, fast!', W / 2, 58, UIC.text, { align: 'center' });
    rect(c, W / 2 - 96, 72, 192, 6, '#2a2a34');
    rect(c, W / 2 - 96, 72, 192 * clamp(k.p, 0, 1), 6, k.p > 0.7 ? '#8ad08a' : '#e8c84a');
  },
  npcs: [],
  objects: [
    boatObject(36, 'narrows'),
    { x: 250, r: 30, label: 'Look at the weir', act: () => Dlg.narrate(flag('weirOpen') ? 'The great gate hangs high on its chains, dripping. The channel beyond is open to the north.' : 'A wall of black timber and rusted chain stretches right across the channel, from cliff to cliff. Nothing bigger than a herring could get through.') },
    {
      x: 330, r: 26, label: 'The whales', when: () => flag('wentNorth') && !flag('grottoReached'), act: () => Dlg.narrate(flag('weirOpen')
        ? 'The whales wait on the far side of the weir, close together. The calf keeps looking back at you, and at the dark passage ahead.'
        : 'The two whales wait in front of the weir. The mother bumps it gently with her head, again and again. The calf hides behind her.'),
    },
    { x: 540, r: 16, label: () => flag('weirOpen') ? 'The winch house' : 'Open the winch house', act: sc => c2Winch(sc) },
  ],
  async onEnter(sc) {
    if (!flag('narrowsVisit')) {
      setFlag('narrowsVisit');
      await wait(0.5);
      await Dlg.narrate('The Narrows. Two black cliffs, so close together they almost touch, and between them, right across the water, an enormous old wooden gate.');
      await Dlg.narrate('In front of the gate, two familiar shapes rest in the water. The whales got here before you.');
      Sound.whale(0.2);
    }
  },
};

async function c2Winch(sc) {
  if (flag('weirOpen')) { await Dlg.narrate('The old winch is quiet again, but its gear is greased and its handle is in place. It will turn whenever the whales need it.'); return; }
  if (!Inv.has('winchKey')) { await Dlg.narrate('The winch house is locked with a huge rusted padlock. Somebody at Hookness must have the key.'); return; }
  const missing = [!Inv.has('crank') ? 'a crank handle' : null, !Inv.has('gear') ? 'its drive gear' : null, !Inv.has('grease') ? 'grease' : null].filter(Boolean);
  if (missing.length) {
    await Dlg.narrate("Oskar's key turns, with a shriek. Inside, a huge iron winch sits frozen with rust, chains running out through the wall to the weir.");
    await Dlg.narrate('It needs ' + missing.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.');
    return;
  }
  await Dlg.narrate("You slot Maggie's brass gear into place. It fits perfectly, as if it had only been gone a day.");
  await Dlg.narrate('You smear grease over every cog and chain until your hands are black. Then you fit the iron crank handle.');
  setFlag('winching');
  ['gear', 'grease', 'crank', 'winchKey'].forEach(k => Inv.remove(k));
  await new Promise(res => { sc.crank = { p: 0, last: null, done: res }; });
  Sound.sfx('thunder');
  await Dlg.narrate('With a groan like a waking giant, the gate begins to rise. Chains rattle. Fifty years of ice and weed pour off the timbers.');
  setFlag('weirOpen'); Sound.sfx('quest');
  Sound.whale(0.3);
  await wait(0.5);
  await Dlg.narrate('The great whale sings and glides under the raised gate, and the calf scoots after her. On the far side they stop, and wait.');
  sc.whaleSwim = 0; sc.swimming = true;
  await wait(2.5);
  sc.swimming = false;
  await Dlg.narrate("Beyond the gate, the channel runs on into the dark between the cliffs. The calf hangs back, trembling. It won't swim into the darkness.");
  await Dlg.say('you', "It's scared of the dark. It needs a light to follow...");
  await Dlg.say('you', 'My lantern! When night falls, I can lead them through.');
  await Dlg.narrate('The Aurora Grotto has appeared on your sea chart. Sail there from the Narrows, and the whales will follow your lantern.');
}

// ===========================================================================
// THE AURORA GROTTO (finale)
// ===========================================================================
const GROTTO = {
  id: 'grotto', name: 'The Aurora Grotto', width: 640, horizon: 196, spawn: 70, minX: 30, maxX: 610, indoor: true,
  music: 'wonder', ambience: { sea: 0.3, wind: 0.2 },
  weather: () => 'aurora',
  ground: makeGround([[0, 226], [640, 226]]),
  build(c, sc) {
    // cave rock everywhere, with a skylight in the roof and the pool behind the ledge
    const img = c.getImageData(0, 0, 640, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < 640; x++) {
      const sky = ((x - 330) / 150) ** 2 + ((y - 10) / 70) ** 2 < 1;
      const pool = y >= 190 && y < 226 && x > 40 && x < 610;
      const mouth = x < 40 && y > 140 && y < 226;
      if (sky || pool || mouth) continue;
      const n = hash2(x >> 2, y >> 2), n2 = hash2(x, y);
      let col = n > 0.5 ? [64, 70, 96] : [54, 58, 84];
      if (n2 > 0.96) col = [100, 110, 150];
      if (hash2(x >> 4, y >> 3) > 0.85) col = [col[0] + 10, col[1] + 16, col[2] + 22];
      if (y >= 226) col = y === 226 ? [150, 170, 200] : y < 229 ? [100, 110, 140] : n > 0.5 ? [70, 76, 100] : [60, 66, 90];
      const k = (y * 640 + x) * 4;
      d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    // crystals
    const r = RNG(7);
    sc.crystals = [];
    for (let i = 0; i < 26; i++) {
      const x = 20 + r() * 600, onRoof = r() < 0.4;
      const y = onRoof ? 60 + r() * 60 : 186 + r() * 6;
      if (((x - 330) / 150) ** 2 + ((y - 10) / 70) ** 2 < 1.2) continue;
      const col = r() < 0.5 ? '#7ae8e0' : '#b890f0';
      if (onRoof) { c.save(); c.translate(x, y); c.scale(1, -1); drawCrystal(c, 0, 0, 6 + r() * 10, col, (r() - 0.5) * 0.4); c.restore(); }
      else drawCrystal(c, x, y, 8 + r() * 16, col, (r() - 0.5) * 0.4);
      sc.crystals.push({ x, y: onRoof ? y + 6 : y - 8, col });
    }
    for (const x of [26, 70, 600, 620]) drawCrystal(c, x, 226, 10 + (x % 7), '#7ae8e0', 0.1);
    // Maggie's carving & tin box ledge
    for (let i = 0; i < 18; i++) px(c, 292 + i, 206 + Math.round(Math.sin(i * 0.4) * 2), '#9aa6c0');
    ellipse(c, 330, 204, 6, 3, '#9aa6c0'); px(c, 333, 203, '#e0e8f8');
    drawText(c, 'M.H.', 318, 192, '#9aa6c0');
    rect(c, 470, 220, 10, 6, '#8a6a3a'); rect(c, 470, 220, 10, 1, '#b8945a');
  },
  drawBack(w, sc, cam, t) {
    Sea.draw(w, 190, H, cam, t, 'night', S.time, { noGlint: true });
    const wy = 158 + Math.sin(t * 0.5) * 2;
    drawWhale(w, 372 - cam, wy, t, 1);
    sc.whalePos = { x: 372 - cam, y: wy };
    const cw = whaleSprite(0.42);
    const cx = (sc.calfX !== undefined ? sc.calfX : (flag('calfLit') ? 172 : 40)) - cam;
    const cy = 182 + Math.sin(t * 1.1) * 1.5;
    drawWhale(w, cx, cy, t, 0, { s: 0.42 });
    sc.calfPos = { x: cx, y: cy, L: cw.L };
    frontWater(w, 198, t, 'night', 40 - cam, 610 - cam, cam);
  },
  emissive(c, sc, cam, t, nf) {
    // light falling through the roof
    const beam = sc.beam !== undefined ? sc.beam : (flag('calfLit') ? 1 : 0.4);
    c.globalCompositeOperation = 'lighter';
    for (let y = 70; y < 200; y += 2) {
      const u = (y - 70) / 130;
      const half = 50 + u * 30;
      const mid = lerp(310, 232, u) - cam;
      for (let x = -half; x < half; x += 4) {
        const a = beam * 0.16 * (1 - Math.abs(x) / half) * (0.7 + 0.3 * Math.sin(t * 0.8 + x * 0.05 + y * 0.02));
        c.globalAlpha = a; c.fillStyle = (x + y) % 8 < 4 ? '#70f0b0' : '#b070e0';
        c.fillRect(Math.round(mid + x), y, 4, 2);
      }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (sc.whalePos) whaleSpots(c, sc.whalePos.x, sc.whalePos.y, t, 1);
    if (sc.calfPos) whaleSpots(c, sc.calfPos.x, sc.calfPos.y, t, 1, { s: 0.42, lit: flag('calfLit') ? 99 : (sc.calfLit || 0) });
    for (const cr of sc.crystals || []) {
      c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 1.3 + cr.x);
      c.drawImage(glowSprite(14, cr.col, 3, 0.8), Math.round(cr.x - cam - 14), Math.round(cr.y - 14));
    }
    c.globalAlpha = 1;
  },
  npcs: [],
  objects: [
    { x: 50, r: 16, label: 'Head home', when: () => flag('readLetter'), act: () => c2HeadHome() },
    { x: 318, r: 18, label: 'Look at the carving', when: () => flag('calfLit'), act: () => Dlg.narrate("Scratched into the cave wall, small and careful: a little whale, and the letters M.H. Underneath, in a child's hand: 'Here is where the lights are born.'") },
    {
      x: 475, r: 12, label: () => flag('readLetter') ? 'The tin box' : 'A little tin box on the ledge', when: () => flag('calfLit'), act: async () => {
        if (flag('readLetter')) { await Dlg.narrate(SPRING[2].body); return; }
        await Dlg.narrate('A small tin box, rusted shut. It opens with a pop. Inside is a letter, folded small.');
        if (!S.bottles.includes(2)) S.bottles.push(2);
        await Dlg.narrate(SPRING[2].body);
        await Dlg.narrate('Under the letter there is a pencil drawing: a girl in a little red-sailed boat, and beside her, a tiny glowing whale calf. On the back: "The night I met her. M."');
        Inv.add('drawing');
        setFlag('readLetter');
        await Dlg.narrate('You open the compass. The needle swings round, slowly, once... and settles. Pointing true north. As if its job is finally done.');
        Sound.sfx('lamp');
        await Dlg.say('you', "We found it, Grandma. We brought her baby home.");
      },
    },
  ],
  async onEnter(sc, p) {
    S.time = Math.max(S.time, 22);
    if (!p.finale || flag('calfLit')) return;
    Game.hudHidden = true;
    sc.calfX = 40; sc.beam = 0.35; sc.calfLit = 0;
    await wait(1);
    await Dlg.narrate("The passage opens into a cave so huge your lantern can't find the walls. Crystals glitter everywhere, green and violet. Then you look up.");
    await Dlg.narrate('High above, the roof of the cave is open to the sky, and the northern lights are pouring down through it like water, all the way to the pool.');
    await Dlg.narrate('The calf hesitates at the edge of the light. Its mother sings to it, low and slow.');
    Sound.whale(0.25);
    for (let i = 0; i < 60; i++) { sc.calfX += 2.2; await wait(0.05); }
    sc.beam = 1;
    Sound.sfx('lamp');
    await Dlg.narrate('The calf drifts into the falling light...');
    const n = whaleSprite(0.42).spots.length;
    for (let i = 0; i <= n; i++) { sc.calfLit = i; if (i % 3 === 0) Sound.sfx('blip'); await wait(0.25); }
    setFlag('calfLit');
    Sound.whale(0.3); setTimeout(() => Sound.whale(0.26), 1500);
    await Dlg.narrate('...and one by one, little lights wake up along its back. Green. Blue. Gold.');
    await Dlg.narrate('The calf glows.');
    await Dlg.say('you', 'Grandma... you were here.');
    await Dlg.narrate('On the cave wall beside the pool, someone has carved something, long ago. And on a ledge further along sits a little tin box.');
    Game.hudHidden = false;
  },
};

async function c2HeadHome() {
  await Dlg.narrate('The whale and her glowing calf swim with you to the mouth of the grotto. Then the calf turns, and bumps Pip gently with its nose. Once.');
  await Dlg.narrate('You sail home under the northern lights.');
  setFlag('homeward');
  Game.goto('c2_cottage', { x: 240, ending: true, banner: false });
}

async function c2Ending() {
  Game.hudHidden = true;
  S.time = 20.5;
  await wait(1);
  await Dlg.narrate('Three days later. Saltmere. The stove crackles, and the kettle sings, and Grandpa reads the letter for the fifth time.');
  await Dlg.say('ansel', 'Maggie Hartley. Fifteen years old, following a whale calf into the ice. Of course she did. Of COURSE she did.');
  await Dlg.say('ansel', "She told me she dropped that compass overboard, the week after I found her. I think now... she gave it to the whale. So it would always know where home was.");
  await Dlg.say('ansel', 'And fifty years later, that whale brought it back to us. So we would bring her baby home.');
  await Dlg.narrate('You show him the pencil drawing. He holds it very carefully, with both hands.');
  await Dlg.say('ansel', "The night she met her... Look at that scowl. That's my Maggie.");
  await Dlg.say('ansel', "Your grandmother had a whole life before me, little gull. A whole world up there. I'd give anything to have seen it.");
  await Dlg.say('ansel', 'Anything at all.');
  await wait(0.5);
  setFlag('ended');
  S.stats.days = S.day;
  Save.write();
  await Game.fadeTo(1, 1.5);
  Game.hudHidden = false;
  Game.setScene('epilogue');
  await Game.fadeTo(0, 1);
}

// ---------------- registration ----------------
function registerChapter2() {
  initChapter2Art();
  EPILOGUES[2] = EPILOGUE2;
  for (const def of [C2_VILLAGE, C2_COTTAGE, C2_LIGHTHOUSE, PUFFIN, CANNERY, FLOE, NARROWS, GROTTO]) Game.scenes[def.id] = new Place(def);
}
