'use strict';
// ---------------------------------------------------------------------------
// Chapter III, second half: the Skerries, Toby Hartley, Maggie's letters, the
// red sail, the Midsummer Regatta and the bonfire.
// ---------------------------------------------------------------------------

Object.assign(ITEMS, {
  coffee: { name: 'Bag of Coffee', type: 'key', desc: "Ingrid's dark roasted coffee, for Toby. It smells wonderful." },
  letters: { name: "Maggie's Letters", type: 'key', desc: 'Fifty letters tied with a red ribbon, every one addressed "Toby", none of them ever posted.' },
  redsail: { name: 'The Red Sail', type: 'key', desc: 'A small sail of red canvas, sewn by hand fifty years ago. Folded so carefully it still has sharp creases.' },
  pimmap: { name: "Pim's Map", type: 'key', desc: 'A crayon map of the Skerries, showing the safe channels between the rocks. Fewer rocks on Skerries voyages.' },
  efeather: { name: 'Eider Feather', type: 'trade', desc: 'A soft, curly grey feather. Nell would love this.' },
  smoked: { name: 'Smoked Fish', type: 'food', food: 1, desc: "Ingrid's smoked fish. Food for one leg of a voyage." },
  countbook: { name: "Sigrid's Puffin Book", type: 'key', desc: 'Fifty years of puffin counts. Near the back, in small neat writing: "3,002 puffins. Counted by M. Hartley, aged 12."' },
  cup: { name: 'Regatta Cup', type: 'key', desc: 'A small silver cup engraved MIDSUMMER REGATTA. Somebody has scratched "& ADMIRAL" on the bottom.' },
});
FOOD_ORDER.push('smoked');

const LETTERS3 = [
  "Dear Toby. It was never your fault. You were nine, and Father asked you a question, and you told the truth. That is what I always told you to do. I am the one who ran. I'm sorry I didn't say goodbye. Happy birthday. Your sister, Maggie.",
  "Dear Toby. You are fifteen today. I have a baby girl now, and she scowls exactly the way you used to when I wouldn't let you hold the tiller. I wonder if you have a boat yet. I hope it is a good one. Happy birthday. M.",
  "Dear Toby. I'm getting old, and my knees creak like the Wren's old mast. Ansel says I should post these. Perhaps next year. I still think of you every single day. Every single minute. Your sister, Maggie.",
];

// ---------------- objectives for the second half ----------------
function c3LateObjectives(o) {
  if (pflActive()) o.unshift('Find the lost pufflings and launch them out to sea (' + pflSaved().length + '/' + PUFFLINGS.length + ').');
  else if (flag('pflAsk') && !flag('pflDone')) o.push('Help Ylva on puffling night, at the Puffin Stacks after dark.');
  if (!flag('skerriesChart')) return;
  if (flag('tobyMet') && !flag('tobyCoffee')) {
    if (!flag('ingridToby')) o.push('Ask around the Skerries about the grumpy man at Ness End.');
    else o.push("Take Ingrid's bag of coffee to Ness End.");
  }
  if (flag('tobyCoffee') && !flag('tobyStory')) o.push('Talk to the man at Ness End.');
  if (flag('tobyStory') && !Inv.has('letters') && !flag('lettersGiven')) o.push("Look in Maggie's trunk, in the attic of Grandpa's cottage.");
  if (Inv.has('letters')) o.push("Take Maggie's letters to Toby at Ness End.");
  if (flag('tobySouth') && !flag('tobyArrived')) o.push('Sail home to Saltmere with Toby, in time for Midsummer.');
  if (flag('tobyArrived') && !flag('regattaDay')) o.push('Sleep. The Midsummer Regatta is tomorrow evening.');
  if (flag('regattaDay') && !flag('raced')) o.push('Talk to Greta at the end of the pier to start the Regatta.');
  if (flag('pimAsk') && !flag('pimMap')) o.push('Pim on Seal Skerry wants to see a lumpfish. Catch one in the Skerries.');
}

// ---------------- Saltmere hooks ----------------
async function c3TamLate() {
  if (!flag('tamFeast')) {
    if (Inv.has('halibut')) {
      setFlag('tamFeast'); Inv.remove('halibut');
      await Dlg.say('tam', "A HALIBUT! For the Midsummer feast! Look at the size of her! I'll give you thirty coins, and you're invited to the feast. Bring Ansel. Not his singing.");
      Inv.addCoins(30);
      return true;
    }
    if (!flag('tamAsk')) {
      setFlag('tamAsk');
      await Dlg.say('tam', "Midsummer feast's coming, and I've promised the village a halibut. Haven't caught one. If you land one up north, I'll pay thirty coins for it.");
    }
  }
  return false;
}

async function c3OskarLate() {
  if (flag('tobyArrived') && !flag('oskarBench')) {
    setFlag('oskarBench');
    await Dlg.say('oskar', "Tobias Hartley. Sitting on Finn's bench. Fifty years I thought that boy was at the bottom of the sea. ...He still can't sit still. Look at him.");
    return true;
  }
  if (flag('tobyStory') && !flag('tobyArrived')) {
    await Dlg.say('oskar', "You found him? Little Toby? ALIVE? ...Bring him home, child. Bring him home and I'll make him eat his own weight in Hookness herring.");
    return true;
  }
  return false;
}

async function c3GretaLate() {
  if (flag('regattaDay') && !flag('raced')) { await Dlg.say('greta', 'The start line is at the end of the pier. I will be there with my whistle. Do not be late.'); return true; }
  if (flag('tobyArrived') && !flag('regattaDay')) { await Dlg.say('greta', "Regatta's tomorrow evening! Get some sleep. And tell that goat to stay away from my hat."); return true; }
  return false;
}

async function c3NellLate() {
  if (Inv.has('efeather') && !flag('nellEider')) {
    setFlag('nellEider'); Inv.remove('efeather');
    await Dlg.say('nell', "An EIDER feather! It's so soft! It's like holding a cloud that's been in a tumble dryer!");
    Inv.addCoins(15);
    return true;
  }
  if (flag('tobyArrived')) {
    await Dlg.say('nell', ["There's a GOAT in Saltmere! His name is Admiral and he ate my hair ribbon. I love him.", "Is Toby your great-uncle? Can I have a great-uncle? Can I borrow yours?"][(S.f.nell3b = (S.f.nell3b || 0) + 1) % 2]);
    return true;
  }
  if (!flag('nellEiderAsk') && flag('skerriesChart')) {
    setFlag('nellEiderAsk');
    await Dlg.say('nell', "Are you going to the Skerries? Gran says there's an island there with ducks so soft they make pillows out of them. If you find a feather, I'll give you fifteen coins!");
    return true;
  }
  return false;
}

async function c3YlvaLate() {
  if (!flag('pflDone') && !pflActive()) { await c3PflAsk(Game.scenes.c3_puffin); return true; }
  if (pflActive()) { await Dlg.say('ylva', ["Listen for the peeping! They hide in the funniest places.", "Three to a box, then off the cliff they go. Gently!"][(S.f.ylvaP = (S.f.ylvaP || 0) + 1) % 2]); return true; }
  if (flag('tobyStory')) {
    await Dlg.say('ylva', flag('tobyArrived') ? "I saw the Wren go past with THREE people in her! And a goat on the bow! I nearly dropped my telescope!" : "Maggie's little brother, living out at Ness End all this time? With a GOAT? This is the best summer ever.");
    return true;
  }
  return false;
}

async function c3TrunkLate() {
  if (!flag('tobyStory') || flag('lettersFound')) return false;
  setFlag('lettersFound');
  await Dlg.narrate('You climb up to the attic and open the old sea trunk. Under the wedding veil and the very small boots is a thick bundle of envelopes, tied with a faded red ribbon.');
  await Dlg.narrate('Every envelope says the same thing, in Grandma\'s neat handwriting: "Toby." Not one of them has a stamp.');
  await Dlg.say('ansel', "...Fifty of them. One for every birthday. She wrote to him every single year, and she never posted a single one.");
  await Dlg.narrate('You open the first one. It is dated the summer of 1974.');
  await Dlg.narrate('"' + LETTERS3[0] + '"');
  await Dlg.narrate('You open one from the middle of the bundle.');
  await Dlg.narrate('"' + LETTERS3[1] + '"');
  await Dlg.narrate('And the very last one, in shaky handwriting.');
  await Dlg.narrate('"' + LETTERS3[2] + '"');
  Inv.add('letters'); Sound.sfx('quest');
  await Dlg.say('ansel', "'Ansel says I should post these.' I did say that. I never knew who they were for. I thought... I thought they were private. Oh, Maggie.");
  await Dlg.say('ansel', "Let's take them to him, little gull. All fifty. It's time somebody posted them.");
  return true;
}

// ---------------- the Skerries: shared bits ----------------
const skerrySea = (w, sc, cam, t, horizon) => {
  if (!sc.clouds) sc.clouds = new CloudLayer(131, 7, 15, 80, 0.1, 'fair', 1600);
  sc.clouds.draw(w, cam, t * 3);
  const sil = rgbStr(mixRgb(skyColors(S.time, summerWeather())[2], '#3a4a5a', 0.35));
  for (let i = 0; i < 5; i++) drawSilhouette(w, 'skerry', i * 230 + 60 - cam * 0.15, horizon, sil, t);
  Sea.draw(w, horizon, H, cam, t, 'arctic', S.time);
};
// the shallows: pale sandy patches in the water, with crabs
function drawShallows(w, cam, t, x0, x1, y) {
  for (let x = x0; x < x1; x += 2) {
    const sx = x - cam;
    if (sx < -2 || sx > W) continue;
    if (hash2(Math.floor(x / 14), 3) > 0.45) { w.globalAlpha = 0.25; rect(w, sx, y + 6 + Math.round(hash2(x, 1) * 8), 2, 1, '#e8dca0'); w.globalAlpha = 1; }
  }
  const cx = x0 + ((t * 6) % (x1 - x0));
  px(w, cx - cam, y + 14, '#c84a3a'); px(w, cx - cam + 1, y + 14, '#c84a3a');
}

// ---------------- Seal Skerry ----------------
const SEAL = {
  id: 'seal', name: 'Seal Skerry', sub: 'A rock like a sleeping dog', width: 560, horizon: 158, spawn: 56, minX: 24, maxX: 530,
  music: 'island', ambience: { sea: 0.7, wind: 0.3 },
  fishSpot: 'skerry', weather: summerWeather,
  ground: makeGround([[0, 226], [60, 224], [110, 214], [200, 208], [320, 206], [420, 210], [480, 218], [520, 228], [560, 250]]),
  build(c, sc) {
    for (let x = 0; x < 62; x += 20) rect(c, x + 4, 228, 4, 42, '#3e2a1a');
    paintTerrain(c, 0, 62, () => 224, MAT.planks, 229);
    const g = roughen(this.ground, 3);
    paintTerrain(c, 60, 560, g, (x, d, y) => d < 3 && hash2(x, 9) > 0.7 ? hexRgb('#6a7a3a') : MAT.mossrock(x, d, y));
    // tide pools with anemones
    for (const tx of [170, 360]) { ellipse(c, tx, this.ground(tx) + 4, 9, 2, '#3a6a7a'); px(c, tx - 3, this.ground(tx) + 4, '#e85a7a'); px(c, tx + 4, this.ground(tx) + 3, '#f2a040'); }
    // Pim's raft, half built
    const rx = 440, ry = this.ground(440);
    for (let i = 0; i < 5; i++) rect(c, rx - 14 + i * 6, ry - 4, 5, 3, i % 2 ? '#8a6a4a' : '#a07a52');
    drawBarrel(c, rx - 18, ry); drawBarrel(c, rx + 18, ry);
    rect(c, rx - 1, ry - 22, 2, 18, '#7a5a3a'); rect(c, rx + 1, ry - 22, 8, 6, '#e8e0d0');
  },
  drawBack(w, sc, cam, t) {
    skerrySea(w, sc, cam, t, 158);
    // the Sleeping Dog: a long low rock with a curled tail, a big head resting
    // on its paws, and two ears, with seals snoozing all along its back
    const dx = Math.round(330 - cam * 0.5), base = 184;
    const dog = i => {
      if (i < 8) return 3 + i * 0.6;                          // tail
      if (i < 120) return 7 + Math.sin((i - 8) / 112 * Math.PI) * 9; // back
      if (i < 128) return 8 - (i - 120) * 0.3;                // neck dip
      if (i < 152) return 6 + Math.sin((i - 128) / 24 * Math.PI) * 9 + (i > 132 && i < 137 ? 5 : 0) + (i > 139 && i < 143 ? 4 : 0); // head & ears
      if (i < 162) return 5 - (i - 152) * 0.3;                // snout on paws
      return 0;
    };
    for (let i = 0; i < 162; i++) {
      const hh = Math.round(dog(i));
      if (hh <= 0) continue;
      const x = dx - 80 + i;
      rect(w, x, base - hh, 1, hh, '#6a6a60');
      rect(w, x, base - hh, 1, 1, '#8a8a7e');
      if (i % 11 === 0) rect(w, x, base - hh + 2, 1, hh - 2, '#5a5a52');
    }
    px(w, dx + 64, base - 9, '#2a2a28');
    for (let i = 14; i < 116; i += 13) { const hh = Math.round(dog(i)); rect(w, dx - 80 + i, base - hh - 2, 6, 2, '#9a9ea4'); px(w, dx - 74 + i, base - hh - 3, '#9a9ea4'); }
    for (let i = 0; i < 170; i += 3) px(w, dx - 84 + i, base + (i % 2), Math.sin(t * 2 + i) > 0.2 ? '#e8f4f8' : '#9cc0d2');
  },
  drawMid(w, sc, cam, t) {
    drawBoat(w, boatCfg(), 36 - cam, 239, t, {});
    drawSeal(w, 140 - cam, this.ground(140), t, 2, true);
    drawSeal(w, 500 - cam, this.ground(500), t, 6, false);
    drawShallows(w, cam, t, 60, 560, 226);
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'arctic', 0, 100 - cam, cam); frontWater(w, 238, t, 'arctic', 520 - cam, W, cam); },
  npcs: [...addAnsel([], 92), { id: 'pim', x: 412 }],
  objects: [
    boatObject(36, 'seal'),
    anselObject(92, 'seal'),
    ...sketchSpots('seal'),
    { x: 160, r: 14, label: 'Look at the seals', act: () => Dlg.narrate('A big grey seal lifts its head, looks at you with enormous wet eyes, and sneezes. Toby would probably have called this one Duchess.') },
    { x: 412, label: 'Talk to Pim', act: () => c3Pim() },
    { x: 440, r: 10, label: "Pim's raft", act: () => Dlg.narrate('Five planks, two barrels, a broom handle for a mast and a pillowcase for a sail. It is the most dangerous boat you have ever seen. You love it.') },
    { x: 520, r: 10, label: 'Fish', act: sc => fishHere(sc, 520, 240, 1) },
  ],
  async onEnter() {
    if (!flag('seal3')) {
      setFlag('seal3');
      await wait(0.5);
      await Dlg.narrate('Seal Skerry. Across the shallow water lies a long grey rock with a head and two ears, exactly like a big dog asleep in the sun. It is covered in seals.');
    }
  },
};

async function c3Pim() {
  if (!flag('pimMet')) {
    setFlag('pimMet'); setFlag('pimAsk');
    await Dlg.say('pim', "Whoa. Is that a REAL boat? Mine's a raft. It's nearly finished. It's going to sail all the way to Ness End.");
    await Dlg.say('pim', "There's a man there with a GOAT. Gran says he's grumpy. I just want to see the goat.");
    await Dlg.say('pim', "I'm Pim. I live on Eider Holm with Gran. I know every rock in the Skerries. I drew a map! I'll give it to you if you show me a lumpfish. A real one. They look SURPRISED.");
    return;
  }
  if (!flag('pimMap')) {
    if (Inv.has('lumpfish')) {
      setFlag('pimMap'); Inv.remove('lumpfish');
      await Dlg.narrate('You show Pim the lumpfish. It looks very surprised. So does Pim.');
      await Dlg.say('pim', "IT'S SO ROUND! It looks like a potato that heard a rumour! Okay, okay, a deal is a deal.");
      Inv.add('pimmap'); Sound.sfx('quest');
      await Dlg.say('pim', "The safe channels are in blue. The rocks are in black. The sea monster is in green. ...There isn't really a sea monster. Probably.");
      await Dlg.narrate("With Pim's map, you'll meet far fewer rocks sailing in the Skerries.");
      return;
    }
    await Dlg.say('pim', 'A lumpfish! You catch them out here in the Skerries. Then my map is yours. It has a sea monster on it.');
    return;
  }
  const lines = [
    flag('tobyMet') ? "You saw the goat? What's his name? ADMIRAL? That's the best name I've ever heard." : 'Have you been to Ness End yet? Did you see the goat?',
    "When my raft is finished I'm going to sail it round the whole world. Or to Eider Holm. One of those.",
  ];
  await Dlg.say('pim', lines[(S.f.pim = (S.f.pim || 0) + 1) % lines.length]);
}

// ---------------- Eider Holm ----------------
const EIDER_SPOTS = [[120, 1], [150, 3], [178, 2], [330, 4], [372, 6], [402, 5], [440, 7], [470, 9]];
const EIDER = {
  id: 'eider', name: 'Eider Holm', sub: "Ingrid's island", width: 560, horizon: 156, spawn: 56, minX: 24, maxX: 530,
  music: 'island', ambience: { sea: 0.6, wind: 0.3 },
  fishSpot: 'skerry', weather: summerWeather,
  ground: makeGround([[0, 226], [60, 224], [100, 216], [180, 208], [300, 204], [420, 206], [490, 214], [530, 228], [560, 250]]),
  build(c, sc) {
    for (let x = 0; x < 62; x += 20) rect(c, x + 4, 228, 4, 42, '#3e2a1a');
    paintTerrain(c, 0, 62, () => 224, MAT.planks, 229);
    const g = roughen(this.ground, 2);
    paintTerrain(c, 60, 560, g, (x, d, y) => x > 90 && x < 510 ? MAT.grass(x, d, y) : MAT.mossrock(x, d, y));
    drawTurfHouse(c, 230, this.ground(255), 50, 34);
    sc.wins = [{ x: 236, y: this.ground(255) - 26, w: 10, h: 8 }, { x: 264, y: this.ground(255) - 26, w: 10, h: 8 }];
    // drying racks hung with grey eider down
    for (const rx of [300, 330]) {
      const gy = this.ground(rx);
      rect(c, rx, gy - 18, 2, 18, '#6a4a30'); rect(c, rx + 22, gy - 18, 2, 18, '#6a4a30'); rect(c, rx, gy - 18, 24, 1, '#6a4a30');
      for (let i = 0; i < 6; i++) ellipse(c, rx + 3 + i * 4, gy - 14 + (i % 2), 2, 2, i % 2 ? '#a8a49c' : '#bab6ae');
    }
    // little stone walls round the nests
    for (const nx of [140, 390, 456]) for (let i = 0; i < 14; i++) rect(c, nx - 7 + i, this.ground(nx - 7 + i) - 2 - (i % 3 === 0 ? 1 : 0), 1, 2 + (i % 3 === 0 ? 1 : 0), '#8a8680');
  },
  drawBack(w, sc, cam, t) { skerrySea(w, sc, cam, t, 156); },
  drawMid(w, sc, cam, t) {
    drawBoat(w, boatCfg(), 36 - cam, 239, t, {});
    for (const [x, s] of EIDER_SPOTS) drawEider(w, x - cam, this.ground(x), t, s, s % 2 === 0);
    if (!flag('efeatherGot')) { const gy = this.ground(486); line(w, 484 - cam, gy - 1, 488 - cam, gy - 3, '#b8b4ac'); px(w, 489 - cam, gy - 4, '#d8d4cc'); }
    // smoke from the turf house
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.25 + i / 4) % 1;
      w.globalAlpha = 0.3 * (1 - ph);
      ellipse(w, 270 - cam + ph * 12, this.ground(255) - 46 - ph * 30, 2 + ph * 3, 2 + ph * 2, '#d8dce4');
    }
    w.globalAlpha = 1;
    drawShallows(w, cam, t, 60, 120, 226);
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'arctic', 0, 100 - cam, cam); frontWater(w, 238, t, 'arctic', 526 - cam, W, cam); },
  emissive(c, sc, cam, t, nf) {
    if (nf < 0.3 || !sc.wins) return;
    for (const wi of sc.wins) { c.globalAlpha = nf * 0.9; rect(c, wi.x - cam, wi.y, wi.w, wi.h, '#f6c870'); c.globalAlpha = 1; }
  },
  npcs: [...addAnsel([], 92), { id: 'ingrid', x: 212 }],
  objects: [
    boatObject(36, 'eider'),
    anselObject(92, 'eider'),
    { x: 212, label: 'Talk to Ingrid', act: () => c3Ingrid() },
    { x: 255, r: 10, label: 'The turf house', act: () => Dlg.narrate("A little house with grass growing on its roof. A duck is sitting on the roof, on a nest, looking extremely pleased with itself.") },
    { x: 400, r: 30, label: 'Watch the eider ducks', act: () => Dlg.narrate('The eider ducks say "ah-OOO, ah-OOO," like old ladies hearing some very interesting gossip. The drakes are smart black and white, with pale green necks.') },
    { x: 486, r: 8, label: 'Pick up a feather', when: () => !flag('efeatherGot'), act: async () => { setFlag('efeatherGot'); Inv.add('efeather'); Sound.sfx('pickup'); await Dlg.narrate('A curly grey eider feather, so soft you can barely feel it. Nell would love this.'); } },
    { x: 520, r: 10, label: 'Fish', act: sc => fishHere(sc, 520, 240, 1) },
  ],
  async onEnter() {
    if (!flag('eider3')) {
      setFlag('eider3');
      await wait(0.5);
      await Dlg.narrate('Eider Holm: a green island with a little turf-roofed house, and ducks. Ducks everywhere. Ducks on the rocks, ducks in the grass, a duck on the roof.');
    }
  },
};

async function c3Ingrid() {
  if (!flag('ingridMet')) {
    setFlag('ingridMet');
    await Dlg.say('ingrid', "Visitors! In a boat that floats on a puddle. You must be very good sailors, or very silly ones.");
    await Dlg.say('ingrid', "I'm Ingrid. I keep the eider ducks. They give me their down, and I give them a nice quiet island and tell the gulls off.");
    if (flag('pimMet')) await Dlg.say('ingrid', "You've met my grandson? Then you've heard about the raft. Please don't encourage him.");
  }
  if (flag('tobyMet') && !flag('ingridToby')) {
    setFlag('ingridToby');
    await Dlg.say('you', 'There is a man at Ness End with a goat. He shouted at us.');
    await Dlg.say('ingrid', "Toby? Ha! He shouts at everybody. He shouts at the weather. Don't take it personally.");
    await Dlg.say('ingrid', "He rows over once a month to swap fish for coffee. But his boat sprang a leak in the spring, and he hasn't been since. He'll have run out of coffee weeks ago.");
    await Dlg.say('ingrid', "A grumpy man with no coffee is a very grumpy man. I'd row it over myself, but I can't leave my ducks while they're nesting.");
    await Dlg.narrate('Ingrid goes into the turf house and comes back with a big paper bag.');
    await Dlg.say('ingrid', "Here. His usual. Take it to him, and I promise you he'll at least open his door.");
    Inv.add('coffee'); Sound.sfx('quest');
    return;
  }
  let sel = 0;
  while (true) {
    const items = [
      { label: 'Buy smoked fish', right: '3c', id: 'smoked', desc: 'Food for one leg of a voyage.', disabled: S.coins < 3, whyNot: 'Not enough coins.' },
      { label: 'Chat', id: 'chat' },
      { label: 'Leave', id: 'leave' },
    ];
    const i = await Menu.list({ title: "Ingrid's Smokehouse", subtitle: S.coins + ' coins', items, w: 240, sel });
    if (i < 0 || items[i].id === 'leave') return;
    sel = i;
    if (items[i].id === 'smoked') { S.coins -= 3; Inv.add('smoked'); Sound.sfx('coin'); }
    if (items[i].id === 'chat') {
      const lines = [
        flag('tobyStory') ? "Toby Hartley has a SISTER? Had. Oh, the poor old goat. The man, I mean. Well. Both." : "The Skerries are kind to small boats and cruel to big ones. That's why we like it here.",
        "Ducks are wiser than people. They mind their own business, and they always come home.",
        flag('pimMap') ? "Pim gave you his map? He must like you. He wouldn't even give it to me." : "Pim draws maps of everything. The island. The house. My face. He's not kind about my face.",
      ];
      await Dlg.say('ingrid', lines[(S.f.ingrid = (S.f.ingrid || 0) + 1) % lines.length]);
    }
  }
}

// ---------------- Ness End ----------------
// after the first meeting Toby shuts himself (and Admiral) in the boat shed until the coffee
const tobyShut = () => flag('tobyMet') && !flag('tobyCoffee');

const NESSEND = {
  id: 'nessend', name: 'Ness End', sub: 'The last rock in the world', width: 560, horizon: 152, spawn: 56, minX: 24, maxX: 520,
  music: () => flag('tobyStory') ? 'wonder' : 'sea', ambience: { sea: 0.8, wind: 0.5 },
  fishSpot: 'skerry', weather: summerWeather,
  ground: makeGround([[0, 226], [60, 224], [100, 214], [160, 206], [260, 200], [360, 202], [440, 208], [500, 218], [530, 230], [560, 250]]),
  build(c, sc) {
    for (let x = 0; x < 62; x += 20) rect(c, x + 4, 228, 4, 42, '#3e2a1a');
    paintTerrain(c, 0, 62, () => 224, MAT.planks, 229);
    const g = roughen(this.ground, 3);
    paintTerrain(c, 60, 560, g, (x, d, y) => x > 150 && x < 400 && d < 4 && hash2(x, 2) > 0.3 ? MAT.grass(x, d, y) : MAT.gullrock(x, d, y));
    // Toby's stone hut
    const hx = 130, hg = this.ground(150);
    for (let j = 0; j < 30; j++) for (let i = 0; i < 40; i++) {
      const row = Math.floor(j / 4), off = (row % 2) * 4;
      const mortar = j % 4 === 3 || (i + off) % 9 === 0;
      px(c, hx + i, hg - 30 + j, mortar ? '#5a5650' : rgbStr(mixRgb('#9a958c', '#7a766e', hash2(Math.floor((i + off) / 9), row))));
    }
    for (let i = 0; i < 48; i++) rect(c, hx - 4 + i, hg - 38 + Math.abs(i - 24) * 0.25, 1, 8, i % 4 === 0 ? '#3a3a40' : '#4a4e58');
    rect(c, hx + 15, hg - 18, 10, 18, '#3a2a1e');
    drawWindow(c, hx + 4, hg - 24, 7, 7);
    sc.wins = [{ x: hx + 4, y: hg - 24, w: 7, h: 7 }];
    // the fog tower
    drawFogTower(c, 300, this.ground(300));
    // the bench outside the hut
    const bx = 228, bg = this.ground(236);
    rect(c, bx, bg - 8, 22, 2, '#7a5432'); rect(c, bx + 1, bg - 6, 2, 6, '#4a3020'); rect(c, bx + 19, bg - 6, 2, 6, '#4a3020');
    // the boat shed, with Toby's unfinished boat
    const sx = 400, sg = this.ground(430);
    for (let i = 0; i < 64; i++) rect(c, sx - 2 + i, sg - 40 + Math.abs(i - 32) * 0.3, 1, 4, i % 4 === 0 ? '#4a3424' : '#5a4430');
    rect(c, sx, sg - 36, 2, 36, '#5a4430'); rect(c, sx + 58, sg - 36, 2, 36, '#5a4430');
    rect(c, sx + 6, sg - 4, 48, 2, '#6a4a30');
    for (let i = 0; i < 8; i++) { const rx = sx + 10 + i * 5, rh = 10 - Math.abs(i - 3.5) * 1.6; for (let j = 0; j < rh; j++) px(c, rx + Math.round(Math.sin(j / rh * 1.6) * 2), sg - 6 - j, '#a07a52'); }
    rect(c, sx + 8, sg - 7, 42, 2, '#8a6a42');
  },
  drawBack(w, sc, cam, t) { skerrySea(w, sc, cam, t, 152); },
  drawMid(w, sc, cam, t) {
    drawBoat(w, boatCfg(), 36 - cam, 239, t, {});
    if (tobyShut()) {
      // the shed doors, shut tight
      const sx = 400, sg = this.ground(430);
      for (let i = 0; i < 56; i++) {
        const top = Math.floor(sg - 40 + Math.abs(i + 4 - 32) * 0.3) + 3, bot = this.ground(sx + 2 + i);
        rect(w, sx + 2 + i - cam, top, 1, bot - top, i === 27 ? '#2a1c12' : i % 7 === 0 ? '#4a3424' : '#6a4c34');
      }
      for (const dx of [2, 30]) { rect(w, sx + dx - cam, sg - 28, 28, 2, '#4a3424'); rect(w, sx + dx - cam, sg - 9, 28, 2, '#4a3424'); }
      rect(w, sx + 24 - cam, sg - 19, 2, 3, '#2a2a2a'); rect(w, sx + 34 - cam, sg - 19, 2, 3, '#2a2a2a');
    }
    if (!flag('tobySouth') && !tobyShut()) {
      const gx = 200 + Math.sin(t * 0.3) * 30;
      drawGoat(w, gx - cam, this.ground(gx), t, Math.cos(t * 0.3) < 0, Math.sin(t * 0.3) > 0.8);
    }
    drawShallows(w, cam, t, 60, 110, 226);
    for (let i = 0; i < 3; i++) drawGull(w, ((t * 9 + i * 190) % 760) - 120, 40 + i * 14 + Math.sin(t * 0.6 + i) * 5, t + i, { seed: i * 2.3 });
  },
  drawFront(w, sc, cam, t) { frontWater(w, 238, t, 'arctic', 0, 90 - cam, cam); frontWater(w, 238, t, 'arctic', 520 - cam, W, cam); },
  emissive(c, sc, cam, t, nf) {
    if (nf < 0.3 || !sc.wins) return;
    for (const wi of sc.wins) { c.globalAlpha = nf * 0.9; rect(c, wi.x - cam, wi.y, wi.w, wi.h, '#f6c870'); c.globalAlpha = 1; }
  },
  npcs: [
    ...addAnsel([], 92),
    { id: 'toby', x: 430, when: () => !flag('tobyMet') },
    { id: 'toby', x: 240, sit: true, facePlayer: false, when: () => flag('tobyCoffee') && !flag('tobySouth') },
  ],
  objects: [
    boatObject(36, 'nessend'),
    anselObject(92, 'nessend'),
    ...sketchSpots('nessend'),
    { x: 150, r: 14, label: 'The stone hut', act: () => Dlg.narrate(flag('tobyStory') ? 'Through the window: a narrow bed, a stove, a shelf of books about boats, and, pinned to the wall, a crayon drawing of a little boat with a red sail.' : 'A tiny stone hut with one window. A sign on the door says: GO AWAY. Underneath, smaller: THIS MEANS YOU, GOAT.') },
    { x: 300, r: 14, label: 'The fog tower', act: () => Dlg.narrate('The old foghorn station. Its horn has been silent for years. Somebody has planted potatoes in a bathtub at the bottom of the tower.') },
    { x: 430, r: 14, label: () => flag('tobyCoffee') ? 'The boat shed' : flag('tobyMet') ? 'Knock on the shed door' : 'Talk to the man', when: () => !flag('tobyCoffee') || flag('tobyStory'), act: () => flag('tobyCoffee') ? c3BoatShed() : c3Toby() },
    { x: 240, r: 12, label: () => flag('tobyStory') ? 'Talk to Toby' : 'Talk to the man', when: () => flag('tobyCoffee') && !flag('tobySouth'), act: () => c3Toby() },
    { x: 500, r: 10, label: 'Fish', act: sc => fishHere(sc, 504, 240, 1) },
  ],
  async onEnter() {
    if (!flag('ness3')) {
      setFlag('ness3');
      await wait(0.5);
      await Dlg.narrate('Ness End. The very last rock of the Skerries, with nothing beyond it but open sea. A white tower with a red band. A stone hut. A boat shed. And a goat.');
      await Dlg.say('ansel', "It's the tower from her sketchbook. 'The last rock in the world.'");
    }
  },
};

async function c3BoatShed() {
  await Dlg.narrate("Inside the shed is a little boat, half built. Her ribs are smooth and her keel is perfect, but there's no mast, and she's never been planked. Tools hang neatly on the wall. A calendar shows a year long ago.");
  if (flag('tobyStory')) await Dlg.say('toby', "Fifty years I've been building her. I always find something to do over again. ...I think I didn't want to finish her. Then I'd have to sail somewhere.");
}

async function c3Toby() {
  if (!flag('tobyMet')) {
    await Dlg.narrate('A man with a grey beard puts down his hammer and comes stamping over from the boat shed.');
    await Dlg.say('tobyQ', "Oi! This is a PRIVATE rock! Can't you read? It says GO AWAY. On the door. In capitals.");
    await Dlg.say('tobyQ', 'Admiral! See them off!');
    await Dlg.narrate('The goat trots over, looks at you, and starts eating your sleeve.');
    await Dlg.say('tobyQ', "...Terrible goat.");
    await Dlg.say('ansel', "We're looking for a man called Tobias Hartley. From Hookness.");
    await Dlg.narrate('The man goes very still.');
    await Dlg.say('tobyQ', "Never heard of him. Go away.");
    setFlag('tobyMet'); Sound.sfx('door');
    await Dlg.narrate('He stamps back into the boat shed and slams the door. A moment later, it creaks open again, so he can pull the goat inside, and slams again.');
    await Dlg.say('ansel', "...That's him, little gull. He has her scowl.");
    Sound.sfx('quest');
    return;
  }
  if (!flag('tobyCoffee')) {
    if (!Inv.has('coffee')) {
      Sound.sfx('thud');
      await Dlg.narrate('You knock on the shed door. Hammering stops. A muffled voice comes from inside.');
      await Dlg.say('tobyQ', ["Still here? GO AWAY.", "I'm busy. I've been busy for fifty years. Go away.", "No, I don't want to buy anything. No, I don't want to talk about boats. GO. AWAY."][(S.f.toby0 = (S.f.toby0 || 0) + 1) % 3]);
      await Dlg.narrate(['A goat bleats, agreeing with him.', 'The hammering starts again, louder.', 'Something inside the shed is chewing.'][S.f.toby0 % 3]);
      return;
    }
    Sound.sfx('thud');
    await Dlg.narrate('You knock on the shed door.');
    await Dlg.say('tobyQ', "GO A...");
    await Dlg.narrate('The door opens a crack. A nose sniffs the air. Then the door flies open.');
    Inv.remove('coffee'); setFlag('tobyCoffee'); Sound.sfx('door');
    await Dlg.say('tobyQ', "Is that COFFEE?");
    await Dlg.narrate("He snatches the bag, sniffs it, and closes his eyes like a man hearing his favourite song. Admiral the goat trots out after him.");
    await Dlg.say('tobyQ', "...Fine. ONE cup. Sit on the bench. Don't touch anything. Don't let the goat eat the bench.");
    await Dlg.narrate('Ten minutes later you are all sitting outside the hut in the sun, holding chipped mugs. The coffee is so strong your eyebrows tingle.');
    await Dlg.say('tobyQ', "So. What do you want?");
    return;
  }
  if (!flag('tobyStory')) {
    setFlag('tobyStory');
    await Dlg.narrate("You take out Maggie's sketchbook and open it at the drawing of Ness End.");
    await Dlg.narrate('"When I am grown up I will live here, at the end of everything... Toby can visit if he brings biscuits."');
    await Dlg.narrate('Toby stares at it for a long, long time. His mug is shaking.');
    await Dlg.say('toby', "...Where did you get this?");
    await Dlg.say('you', 'From her room, in the Hartley house. Maggie Hartley was my grandmother.');
    await Dlg.say('toby', '"Was."');
    await Dlg.say('ansel', "She was my wife, for nearly fifty years. I'm sorry, Toby. We lost her a few winters ago.");
    await Dlg.narrate('Toby puts his mug down very carefully on the bench. The goat leans against his legs.');
    await Dlg.say('toby', "I was nine. The night she took the gear out of the winch, I saw her creep home with it under her coat. I followed her up to the attic in my pyjamas.");
    await Dlg.say('toby', "In the morning Father stood in the kitchen and asked me where it was. He was so angry. And I... I told him. I told the truth, like she always said to.");
    await Dlg.say('toby', "He shut the weir by hand, with ropes and twenty men. And that night she sailed away in the Wren. She looked back at me from the boat, just once. And I never saw her again.");
    await Dlg.say('toby', "She never wrote. Not a single letter, in fifty years. Why would she? I was the one who told.");
    await Dlg.say('toby', "So I came out here. To the place she always said she'd live. I thought... if she ever came back, she'd come here.");
    await Dlg.narrate('Nobody says anything for a while. The sea goes in and out.');
    await Dlg.say('ansel', "...Little gull. The trunk. All those old letters in her trunk, that I never read because they weren't addressed to me...");
    await Dlg.say('ansel', "Toby, don't go anywhere. We'll be back.");
    await Dlg.say('toby', "Go anywhere? Where would I go? I live on a rock.");
    Sound.sfx('quest');
    return;
  }
  if (Inv.has('letters')) { await c3GiveLetters(); return; }
  if (flag('lettersGiven')) return;
  await Dlg.say('toby', ["Admiral likes you. Admiral likes everybody who has a sleeve.", "More coffee? ...No. You'll never sleep again. I haven't slept since 1974."][(S.f.toby1 = (S.f.toby1 || 0) + 1) % 2]);
}

async function c3GiveLetters() {
  Inv.remove('letters'); setFlag('lettersGiven');
  Game.hudHidden = true;
  await Dlg.narrate('You hold out the bundle of letters, tied with the faded red ribbon.');
  await Dlg.say('ansel', "She wrote to you, Toby. Every birthday. Fifty years of them. She just never could post them.");
  await Dlg.narrate('Toby unties the ribbon with big clumsy fingers, and opens the first letter.');
  await Dlg.narrate('"Dear Toby. It was never your fault..."');
  await Dlg.narrate('He reads it twice. Then he opens the next one. And the next. Nobody hurries him. The sun goes down a little way, and comes back up, the way it does at midsummer.');
  await Dlg.narrate('When he gets to the very last letter, he reads one line out loud.');
  await Dlg.say('toby', '"I still think of you every single day. Every single minute."');
  await Dlg.say('toby', "...She used to say that. On the floe, when I was little. 'Every single minute.'");
  await wait(0.5);
  await Dlg.say('toby', "Wait here.");
  await Dlg.narrate('He goes into the boat shed and comes back with something folded in his arms: a small sail of red canvas, hand sewn, with sharp, careful creases.');
  await Dlg.say('toby', "She sewed two. One for the Wren. And one for me, 'for when Toby's big enough for his own boat.' She gave it to me the night before she left.");
  await Dlg.say('toby', "I've been building that boat for fifty years. I never could finish her. But the Wren is finished, isn't she? I saw her sail in.");
  await Dlg.say('toby', "Put it on the Wren. Maggie would want her red sail back.");
  Inv.add('redsail'); Sound.sfx('quest');
  await Dlg.say('ansel', "Toby. It's Midsummer in two days. There's a regatta in Saltmere, and a bench by the harbour with room for one more grumpy old man. Come home with us.");
  await Dlg.say('toby', "...Saltmere. I've never been south of Kettle Point.");
  await Dlg.say('toby', "Admiral comes too. He's never been anywhere either.");
  setFlag('tobySouth'); setFlag('tobyAboard');
  Game.hudHidden = false;
  Toast.show('Toby joined your crew!', 'cap');
}

// ---------------- Saltmere: Toby arrives, the regatta, the bonfire ----------------
async function c3TobyArrives() {
  Game.hudHidden = true;
  S.f.tobyAboard = 0;
  setFlag('tobyArrived');
  await wait(0.6);
  await Dlg.narrate('The Wren sails into Saltmere harbour with three people aboard, and a goat standing on the bow like a figurehead.');
  await Dlg.narrate('On the bench by the harbour, an old man in a red hat stands up so fast he drops his sandwich. Bjorn eats it.');
  await Dlg.say('oskar', "...Toby? Little TOBY? You're OLD!");
  await Dlg.say('toby', "So are you, Oskar. You look like a walrus.");
  await Dlg.say('oskar', "I've ALWAYS looked like a walrus.");
  await Dlg.narrate('They hug. It goes on for quite a long time. Finn pretends to be very interested in a seagull.');
  await Dlg.say('bo', "Is that a red sail? Give it here. Let's see her dressed properly.");
  Inv.remove('redsail'); setFlag('redSail');
  await Dlg.narrate('Bo bends the red sail onto the Wren\'s new mast, and the whole harbour goes quiet for a moment as it fills with wind. Red, against the blue sea. Just like the old photograph.');
  await Dlg.say('ansel', "There she is. That's my Maggie's boat.");
  await Dlg.say('greta', "Well, don't just stand there. The Regatta is tomorrow evening. Is the Wren entered or not?");
  await Dlg.say('toby', "She's entered. And she's going to win.");
  Sound.sfx('quest');
  Game.hudHidden = false;
}

async function c3VillageEnter(sc, p) {
  if (flag('tobyAboard') && flag('tobySouth') && !flag('tobyArrived')) await c3TobyArrives();
  if (p.raceEnd) await c3RaceEnd(p.raceEnd);
}

// the regatta starts at the end of the pier
const RIVALS = () => [
  { name: 'Greta', cfg: { type: 'big', color: '#22355e' }, speed: 1.3, mark: '#6a8ad8', riders: () => [PEOPLE.greta.top] },
  { name: 'Bo', cfg: { type: 'sail', color: '#8a6a4a' }, speed: 1.24, mark: '#c8a070', riders: () => [PEOPLE.bo.top] },
  { name: 'Tam', cfg: { type: 'sail', color: '#d8dee8' }, speed: 1.17, mark: '#e8e8e8', riders: () => [PEOPLE.tam.top] },
];

async function c3StartRace() {
  if (S.f.raceTries) await Dlg.say('greta', 'Again? Very well. Back to the start line, all of you!');
  else {
    await Dlg.say('greta', "The Midsummer Regatta! Out round Gull Rock and back to the pier. First boat home wins the cup.");
    await Dlg.say('greta', "No pushing, no shouting, and NO GOATS ON THE COURSE.");
    await Dlg.narrate('Tip: hold Right to sail as fast as you can. Steer through the sparkling gusts of wind for a burst of speed, and keep clear of the rocks.');
  }
  const r = await Dlg.ask(null, 'Ready to race?', ['Ready!', 'Not yet']);
  if (r !== 0) return;
  S.f.raceTries = (S.f.raceTries || 0) + 1;
  S.vessel = 'wren'; setFlag('tobyAboard');
  S.time = Math.max(S.time, 18.5);
  Sound.sfx('whoosh');
  Game.goto('voyage', { from: 'saltmere', to: 'saltmere', cost: 1, race: true, length: 4800 });
}

async function c3RaceEnd(place) {
  S.f.tobyAboard = 0;
  S.vessel = 'pip';
  Game.hudHidden = true;
  await wait(0.5);
  if (place === 1) {
    await Dlg.narrate('The Wren shoots across the finish line first, her red sail full, with the whole village roaring on the pier.');
    await Dlg.say('toby', "WE WON! Admiral, we WON!");
    await Dlg.say('greta', "Well. I suppose the Harbourmaster can't win EVERY year. ...Congratulations, Captain.");
    Inv.add('cup'); Sound.sfx('quest');
    S.f.racePlace = 1;
  } else {
    await Dlg.narrate('The Wren crosses the line ' + ['', 'first', 'second', 'third', 'last'][place] + ', her red sail full, with the whole village cheering anyway.');
    await Dlg.say('toby', place === 2 ? "Second! Not bad for a boat that was frozen in the ice last spring!" : "We didn't win. I don't care. That was the best afternoon I've had in fifty years.");
    S.f.racePlace = Math.min(S.f.racePlace || 9, place);
    const r = await Dlg.ask('greta', 'Greta blows her whistle. "One more race before the light goes? Anyone?"', ['Race again!', "No, that was perfect"]);
    if (r === 0) { Game.hudHidden = false; await c3StartRace(); return; }
  }
  setFlag('raced');
  await c3Bonfire();
}

async function c3Bonfire() {
  await Game.fadeTo(1, 1);
  S.time = 22.5;
  setFlag('bonfire');
  Game.scenes.c3_village.player.x = 1112;
  Game.scenes.c3_village.updateCam(true);
  await Game.fadeTo(0, 1);
  Sound.setMood('wonder');
  await Dlg.narrate("That night, there's a bonfire on the harbour. Rosa brings saffron buns, Tam brings his halibut, and the whole village sits round the fire as the sky turns pale green and never quite gets dark.");
  await Dlg.narrate('Then, out past the harbour wall, the sea begins to glow.');
  Sound.whale(0.25);
  await wait(1);
  await Dlg.narrate("Two shapes rise in the water. One very big, glowing green and blue. And one small, glowing gold.");
  await Dlg.say('nell', "The whales! THE WHALES! The baby one GLOWS now! Pickles, LOOK!");
  await Dlg.say('ansel', "They came for Midsummer. Or for Toby. Or for the buns, maybe.");
  await Dlg.narrate('Toby sits on the bench between Oskar and Grandpa, with the bundle of letters in his lap and Admiral asleep on his feet.');
  await Dlg.say('toby', "Read me one, Ansel. My eyes are no good in the firelight. Any one. Pick one.");
  await Dlg.narrate('Grandpa unties the ribbon, and picks a letter, and begins to read out loud. Slowly. And everybody listens.');
  await wait(1);
  await c3Ending();
}

async function c3Ending() {
  setFlag('ended');
  S.stats.days = S.day;
  Save.write();
  await Game.fadeTo(1, 1.5);
  Game.hudHidden = false;
  Game.setScene('epilogue');
  await Game.fadeTo(0, 1);
}

function c3RegattaMid(w, sc, cam, t) {
  if (flag('bonfire')) drawBonfire(w, 980 - cam, 222, t);
  // Admiral wanders the harbour, and settles at Toby's feet for the bonfire
  if (flag('bonfire')) { drawGoat(w, 1040 - cam, 222, t, true, false); return; }
  const gx = 470 + Math.sin(t * 0.25) * 30;
  drawGoat(w, gx - cam, 222, t, Math.cos(t * 0.25) < 0, Math.sin(t * 0.25) > 0.7);
}

// ---------------- puffling night (side quest at the Puffin Stacks) ----------------
// After dark the young puffins leave their burrows for the sea, but they fly
// toward the brightest light they can see and land in all the wrong places.
// Find them, carry them three at a time, and launch them off the cliff.
const PUFFLINGS = [
  { x: 128, where: 'between the rocks by the jetty' },
  { x: 186, where: 'on the steps' },
  { x: 248, y: 137, where: "on Ylva's roof" },
  { x: 352, where: 'under the telescope' },
  { x: 404, where: 'in a crack in the rock' },
  { x: 455, where: 'in the wrong burrow' },
  { x: 520, where: 'in a clump of sea pinks' },
  { x: 572, where: 'behind a stone' },
];
const PFL_BOX = 3, PFL_EDGE = 600;
const pflActive = () => flag('pflActive') && !flag('pflDone');
const pflSaved = () => S.f.pflSaved || [];

function drawPuffling(c, x, y, t, i, flap) {
  const f = flap && Math.floor(t * 10 + i) % 2;
  const img = sprite(['.ggg.', 'gwwkg', 'gwwgo', (f ? 'G' : '.') + 'ggg' + (f ? 'G' : '.'), '.ggg.', '.o.o.'], { g: '#5a5a60', G: '#4a4a50', w: '#e8e4dc', k: '#141418', o: '#3a3a40' });
  c.drawImage(img, Math.round(x - 2), Math.round(y - 6));
}

async function c3PflAsk(sc) {
  if (!flag('pflAsk')) {
    setFlag('pflAsk');
    await Dlg.say('ylva', "It's fledging week! Every night the pufflings creep out of their burrows and flutter down to the sea, all on their own, for the very first time.");
    await Dlg.say('ylva', "But they fly towards the brightest light they can see. They think it's the moon on the sea. Last night half of them landed on my roof, and one landed in my porridge.");
    await Dlg.say('ylva', "So every night I go round with a box, pick up the lost ones, and launch them off the cliff out to sea. Will you help me? It's the best job in the world.");
  }
  if (nightFactor(S.time) < 0.5) {
    const r = await Dlg.ask('ylva', "They only come out after dark. Stay for supper and wait?", ['Wait for dark', 'Not tonight']);
    if (r !== 0) return;
    await Game.fadeTo(1, 0.7);
    S.time = 22.5;
    await wait(0.5);
    await Game.fadeTo(0, 0.7);
    await Dlg.narrate('Supper is fish soup and very strong tea. Then the light fades to a deep summer blue, and from all over the island comes a tiny, anxious peeping.');
  }
  setFlag('pflActive');
  sc.pf = { carry: [], launches: [], peepT: 0 };
  await Dlg.say('ylva', "Here's a box. It holds three pufflings. Carry them to the edge of the cliff, at the far end of the island, and give them a gentle toss out over the water. They'll do the rest.");
  await Dlg.say('ylva', "I've put my lamp out so no more fly at the window. Take this lantern, and listen for the peeping!");
  if (flag('anselCrew')) await Dlg.say('ansel', "Puffin rescue! Your grandmother would have been first off the boat.");
}

async function c3PflPick(sc, i) {
  const p = sc.pf;
  if (p.carry.length >= PFL_BOX) { await Dlg.narrate('Your box is full! Take these three to the cliff edge first.'); return; }
  p.carry.push(i);
  Sound.sfx('peep');
  const lines = ['A fluffy grey puffling, ' + PUFFLINGS[i].where + '. It glares at you, then lets you pick it up.', 'You scoop up the puffling ' + PUFFLINGS[i].where + '. It is mostly fluff and indignation.', 'Found one ' + PUFFLINGS[i].where + '! It goes into the box with a small offended peep.'];
  Toast.show('Puffling in the box (' + p.carry.length + '/' + PFL_BOX + ')', 'feather');
  if (!S.f.pflTip) { S.f.pflTip = 1; await Dlg.narrate(lines[i % lines.length]); }
}

async function c3PflLaunch(sc) {
  const p = sc.pf;
  sc.player.x = PFL_EDGE; sc.player.facing = 1;
  for (const i of p.carry) {
    S.f.pflSaved = pflSaved().concat([i]);
    p.launches.push({ i, t0: Game.t + p.launches.length * 0 });
    Sound.sfx('whoosh');
    await wait(0.6);
  }
  const n = p.carry.length;
  p.carry = [];
  if (!S.f.pflLaunchTip) {
    S.f.pflLaunchTip = 1;
    await Dlg.narrate('You hold the box over the edge and tip it gently. The pufflings tumble out, whirr their stubby wings like mad, and flop down onto the dark water, one, two' + (n > 2 ? ', three.' : '.'));
    await Dlg.narrate('They bob up, shake their heads, and paddle away out to sea without a single look back.');
  }
  if (pflSaved().length >= PUFFLINGS.length) await c3PflDone(sc);
}

async function c3PflDone(sc) {
  await wait(1.5);
  setFlag('pflDone'); S.f.pflActive = 0;
  await Dlg.say('ylva', "That's ALL of them! Eight pufflings, out to sea, safe and sound! Oh, you were brilliant. Even the one on the roof!");
  await Dlg.say('ylva', "I want you to have something. It was my grandmother Sigrid's. Her puffin counting book. Fifty years of counts.");
  await Dlg.narrate('A battered red notebook, every page full of numbers. Near the back, in a different hand, neat and small:');
  await Dlg.narrate('"3,002 puffins. Counted by M. Hartley, aged 12. (Toby counted 11. They were all called Kevin.)"');
  Inv.add('countbook'); Sound.sfx('quest');
  Inv.addCoins(20);
  if (flag('anselCrew')) await Dlg.say('ansel', "Her handwriting. At twelve years old. ...Every time I think I've found the last bit of her, there's another one.");
  sc.pf = null;
}

function c3PflDraw(w, sc, cam, t) {
  if (!pflActive() || !sc.pf) return;
  const saved = pflSaved(), p = sc.pf;
  PUFFLINGS.forEach((pf, i) => {
    if (saved.includes(i) || p.carry.includes(i)) return;
    const near = Math.abs(sc.player.x - pf.x) < 40;
    drawPuffling(w, pf.x - cam + Math.sin(t * 1.3 + i) * 1, pf.y || sc.ground(pf.x), t, i, near);
  });
}

function c3PflFront(w, sc, cam, t) {
  if (!sc.pf) return;
  for (const L of sc.pf.launches) {
    const u = (Game.t - L.t0) / 3;
    if (u > 1) continue;
    let x, y;
    // a whirring flutter out and down to the water, then a paddle off out to sea
    const gy = sc.ground(PFL_EDGE) - 14;
    if (u < 0.3) { const k = u / 0.3; x = PFL_EDGE + 6 + k * 16; y = gy - Math.sin(k * Math.PI) * 10 + k * (246 - gy); }
    else { const k = (u - 0.3) / 0.7; x = PFL_EDGE + 22 + k * 40; y = 246 + Math.sin(t * 4 + L.i) * 0.5; }
    drawPuffling(w, x - cam, y, t, L.i, u < 0.3);
  }
}

// their pale little faces catch the starlight, so you can just make them out in the dark
function c3PflGlint(c, sc, cam, t) {
  if (!sc.pf) return;
  const saved = pflSaved();
  PUFFLINGS.forEach((pf, i) => {
    if (saved.includes(i) || sc.pf.carry.includes(i)) return;
    c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 2 + i * 1.7);
    rect(c, Math.round(pf.x - cam + Math.sin(t * 1.3 + i)), (pf.y || sc.ground(pf.x)) - 5, 2, 1, '#f4f0e4');
    c.globalAlpha = 1;
  });
}

function c3PflOverlay(c, sc) {
  if (!pflActive() || !sc.pf || Game.hudHidden) return;
  const s = 'Pufflings saved: ' + pflSaved().length + ' / ' + PUFFLINGS.length + '     In your box: ' + sc.pf.carry.length + ' / ' + PFL_BOX;
  c.globalAlpha = 0.85; rect(c, W / 2 - 110, H - 20, 220, 14, '#0e1220'); c.globalAlpha = 1;
  drawText(c, s, W / 2, H - 17, '#fff6dc', { align: 'center' });
}

function c3PflUpdate(sc, dt) {
  if (!pflActive()) return;
  if (!sc.pf) sc.pf = { carry: [], launches: [], peepT: 0 };
  // lost pufflings peep when you're close
  sc.pf.peepT -= dt;
  const saved = pflSaved();
  const near = PUFFLINGS.some((pf, i) => !saved.includes(i) && !sc.pf.carry.includes(i) && Math.abs(sc.player.x - pf.x) < 50);
  if (near && sc.pf.peepT <= 0) { Sound.sfx('peep'); sc.pf.peepT = 1.2 + Math.random(); }
}

// ---------------- epilogue ----------------
const EPILOGUE3 = {
  get cards() { return flag('pflDone') ? this.cardList.slice(0, 2).concat([PFL_CARD], this.cardList.slice(2)) : this.cardList; },
  cardList: [
    'Toby stayed in Saltmere all summer. On his first day, Admiral ate Greta\'s hat. On his second day, he ate her other hat.',
    'In the autumn, Bo helped Toby finish his boat at last. Fifty years in the building, and she floats like a duck. He named her Maggie.',
    'The Wren sails out of Saltmere harbour most evenings now, under her red sail. Sometimes Grandpa is at the tiller, and sometimes Toby is, and they argue about it the whole way out and the whole way back.',
    'And on the first clear night of every summer, two old men sit on the bench by the harbour and read a letter out loud, very slowly, to anyone who will listen.',
    'Everyone listens.',
  ],
  endTitle: 'THE END OF CHAPTER III',
  sky: 'clear',
  stats: () => [
    'Days of summer: ' + (S.stats.days || S.day),
    'Fish caught: ' + (S.stats.fish || 0),
    "Maggie's sketches found: " + S.bottles.length + ' / ' + SKETCHES.length,
    'Midsummer Regatta: ' + (S.f.racePlace === 1 ? 'Winner!' : S.f.racePlace ? ['', '', 'Second', 'Third', 'Fourth'][S.f.racePlace] + ' place' : 'Took part'),
  ],
  final: ['Thank you for playing', 'Chapter III: The Red Sail', '', 'Maggie came home.'],
};

const PFL_CARD = "Up at the Puffin Stacks, Ylva's count that summer came to four thousand, two hundred and thirty-one puffins, and eight pufflings who went to sea in a cardboard box. She called every one of them Kevin.";

// ---------------- registration ----------------
// puffling night at the Puffin Stacks: hooks into the summer Puffin Stacks scene
function registerPufflings() {
  const P = C3_PUFFIN;
  const dm = P.drawMid, df = P.drawFront, ov = P.overlay, li = P.lights;
  // during the rescue the grown-ups are tucked up in their burrows, so only the lost pufflings are out
  P.drawMid = function (w, sc, cam, t) {
    if (pflActive()) drawBoat(w, boatCfg(), 42 - cam, 239, t, {});
    else dm.call(this, w, sc, cam, t);
    c3PflDraw(w, sc, cam, t);
  };
  P.drawFront = function (w, sc, cam, t) { df.call(this, w, sc, cam, t); c3PflFront(w, sc, cam, t); };
  P.overlay = function (c, sc, cam, t, nf) { ov.call(this, c, sc, cam, t, nf); c3PflOverlay(c, sc); };
  P.lights = function (sc, cam, t, nf) {
    const L = li.call(this, sc, cam, t, nf).filter(() => !pflActive());
    if (pflActive()) L.push({ x: sc.player.x - cam + 6, y: sc.ground(sc.player.x) - 16, r: 46, col: '#ffcf7a', a: 0.55, flicker: true, always: true });
    return L;
  };
  P.update = (sc, dt) => c3PflUpdate(sc, dt);
  const em = P.emissive;
  P.emissive = function (c, sc, cam, t, nf) { if (!pflActive()) em.call(this, c, sc, cam, t, nf); else c3PflGlint(c, sc, cam, t); };
  const fish = P.objects.find(o => o.label === 'Fish');
  fish.when = () => !pflActive();
  P.objects.push(
    ...PUFFLINGS.map((pf, i) => ({ x: pf.x, r: 8, label: 'Pick up the puffling', when: () => pflActive() && !pflSaved().includes(i) && !(Game.scenes.c3_puffin.pf && Game.scenes.c3_puffin.pf.carry.includes(i)), act: sc => c3PflPick(sc, i) })),
    { x: PFL_EDGE, r: 10, label: 'Launch the pufflings out to sea', when: () => pflActive() && Game.scenes.c3_puffin.pf && Game.scenes.c3_puffin.pf.carry.length > 0, act: sc => c3PflLaunch(sc) },
  );
  // if you sail away mid-rescue, the pufflings in your box go back where you found them
  const en = P.onEnter;
  P.onEnter = async function (sc, p) { if (sc.pf) sc.pf.carry = []; await en.call(this, sc, p); };
}

function registerChapter3b() {
  registerPufflings();
  EPILOGUES[3] = EPILOGUE3;
  // the race: rivals, the finish line, and what happens when you cross it
  const vs = CHAPTERS[3].voyageStyle;
  CHAPTERS[3].voyageStyle = function (from, to) {
    const st = vs.call(this, from, to);
    st.rivals = RIVALS();
    st.onRaceEnd = place => Game.goto('c3_village', { x: 1150, raceEnd: place, banner: false });
    st.finishDraw = (w, fx, t) => {
      for (const dy of [0, 44]) { rect(w, fx, LANES[0] - 30 + dy, 2, 30, '#e8e0d0'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) rect(w, fx + 2 + i * 3, LANES[0] - 30 + dy + j * 3, 3, 3, (i + j) % 2 ? '#1a1a1e' : '#f4f4f0'); }
    };
    return st;
  };
  // Saltmere on regatta day and bonfire night
  for (const n of C3_VILLAGE.npcs) { const w0 = n.when; n.when = () => !flag('bonfire') && (!w0 || w0()); }
  C3_VILLAGE.npcs.push(
    { id: 'toby', x: 446, when: () => flag('tobyArrived') && !flag('bonfire') },
    { id: 'greta', x: 1204, left: true, when: () => flag('regattaDay') && !flag('raced') },
    ...[['rosa', 930], ['hollis', 946], ['finn', 1018, true], ['toby', 1032, true], ['oskar', 1046, true], ['tam', 960], ['bo', 1000], ['greta', 1062], ['nell', 1076], ['ansel', 1092]].map(([id, x, sit]) => ({ id, x, sit, facePlayer: false, left: x > 980, when: () => flag('bonfire') })),
  );
  for (const o of C3_VILLAGE.objects) { const w0 = o.when; o.when = () => !flag('bonfire') && (!w0 || w0()); }
  C3_VILLAGE.objects.push(
    { x: 446, r: 8, label: 'Talk to Toby', when: () => flag('tobyArrived') && !flag('bonfire'), act: () => c3TobySaltmere() },
    { x: 1204, r: 12, label: 'Start the Regatta', when: () => flag('regattaDay') && !flag('raced'), act: () => c3StartRace() },
  );
  // Greta at the start line takes over from Greta at the harbour office on regatta day
  const greta = C3_VILLAGE.npcs.find(n => n.id === 'greta' && n.x === 856);
  const gw = greta.when; greta.when = () => gw() && !flag('regattaDay');
  // sleeping after Toby arrives brings Midsummer Day
  const sleep = C3_COTTAGE.objects.find(o => o.label === 'Sleep');
  const sleepAct = sleep.act;
  sleep.act = async () => {
    const day = S.day;
    await sleepAct();
    if (flag('tobyArrived') && !flag('regattaDay') && S.day !== day) {
      setFlag('regattaDay');
      await Dlg.narrate("Midsummer Day! The whole of Saltmere smells of saffron buns. The Regatta starts this evening, from the end of the pier.");
    }
  };
  // the whales' lights at the bonfire: the mother green and blue, the calf gold
  const em = C3_VILLAGE.emissive;
  C3_VILLAGE.emissive = function (c, sc, cam, t, nf) {
    em.call(this, c, sc, cam, t, nf);
    if (!flag('bonfire') || !sc.backs) return;
    for (const s of sc.backs) {
      c.globalAlpha = 0.45 + 0.3 * Math.sin(t * 1.5 + s.x);
      c.drawImage(glowSprite(s.calf ? 7 : 5, s.calf ? '#ffd870' : '#7ff7e8', 3, 0.9), Math.round(s.x - (s.calf ? 7 : 5)), Math.round(s.y - (s.calf ? 7 : 5)));
      c.globalAlpha = 1;
    }
  };
  const li = C3_VILLAGE.lights;
  C3_VILLAGE.lights = function (sc, cam, t, nf) {
    const L = li.call(this, sc, cam, t, nf);
    if (flag('bonfire')) L.push({ x: 980 - cam, y: 212, r: 60, col: '#ff9a40', a: 0.55, flicker: true, always: true });
    return L;
  };
  for (const def of [SEAL, EIDER, NESSEND]) {
    def.overlay = function (c) { Sketch.draw(c); };
    Game.scenes[def.id] = new Place(def);
  }
}

async function c3TobySaltmere() {
  const lines = [
    "Saltmere! It's so... GREEN. Are all the people here this cheerful? It's exhausting.",
    "Oskar says Hookness herring are the best herring. Finn says Saltmere herring. I've told them they're both wrong. Ness End herring. They've stopped speaking to me. It's wonderful.",
    "Uncle Will ran away to sea. Then Maggie ran away to sea. Then I ran away to a rock. Hartleys are very bad at staying put.",
    flag('regattaDay') ? "Today we race. Maggie raced the Wren round Hookness bay every summer. She never lost. Not once." : "Your grandmother used to say the south was where the sea was warm. It's not warm. She lied. Ha!",
  ];
  await Dlg.say('toby', lines[(S.f.toby3 = (S.f.toby3 || 0) + 1) % lines.length]);
}
