'use strict';
// ---------------------------------------------------------------------------
// Game state, items, saving, objectives
// ---------------------------------------------------------------------------

const ITEMS = {
  rod: { name: "Grandpa's Rod", type: 'key', desc: 'An old bamboo rod. The cork handle is worn smooth where his thumb went.' },
  knife: { name: "Grandpa's Knife", type: 'key', desc: 'A short, sturdy knife for shucking oysters and cutting line.' },
  lure: { name: 'Lucky Lure', type: 'key', desc: 'A shiny red lure. Fish are easier to keep on the line.' },
  hatchet: { name: "Bo's Hatchet", type: 'key', desc: 'Borrowed from Bo the shipwright. Sharp enough for ironwood.' },
  oil: { name: 'Lamp Oil', type: 'key', desc: 'A heavy can of lighthouse oil.' },
  wick: { name: 'Coconut Wick', type: 'key', desc: 'A thick wick twisted from coconut fibre by Mira.' },
  cap: { name: "Grandpa's Cap", type: 'key', desc: 'His blue knitted cap. Grandma Margaret made it. It smells of salt and pipe smoke.' },
  lantern: { name: 'Storm Lantern', type: 'key', desc: "Bram's storm lantern. Its light cuts through fog." },
  letter: { name: 'Message in a Bottle', type: 'key', desc: 'Read them in your Journal.' },
  sardine: { name: 'Sardine', type: 'fish', price: 2 },
  herring: { name: 'Herring', type: 'fish', price: 3 },
  mackerel: { name: 'Mackerel', type: 'fish', price: 5 },
  cod: { name: 'Cod', type: 'fish', price: 8 },
  snapper: { name: 'Red Snapper', type: 'fish', price: 12 },
  parrotfish: { name: 'Parrotfish', type: 'fish', price: 10 },
  moonfish: { name: 'Moonfish', type: 'fish', price: 25, desc: 'It glows faintly, like moonlight under water.' },
  boot: { name: 'Old Boot', type: 'junk', price: 1, desc: 'Not much of a catch.' },
  haddock: { name: 'Haddock', type: 'fish', price: 7 },
  char: { name: 'Arctic Char', type: 'fish', price: 14 },
  halibut: { name: 'Halibut', type: 'fish', price: 18 },
  bread: { name: 'Bread', type: 'food', food: 1, desc: 'A crusty loaf from Rosa. Food for one leg of a voyage.' },
  cooked: { name: 'Cooked Fish', type: 'food', food: 1, desc: 'Food for one leg of a voyage.' },
  coconut: { name: 'Coconut', type: 'food', food: 1, price: 2, desc: 'Food and drink. Good for one leg of a voyage.' },
  pearl: { name: 'Pearl', type: 'trade', price: 25, desc: 'A small, perfect pearl.' },
  honey: { name: 'Jar of Honey', type: 'trade', desc: "Rosa's wildflower honey." },
  shell: { name: 'Pretty Shell', type: 'trade', price: 2, desc: 'A pink spiral shell. Somebody would love this.' },
  ironwood: { name: 'Ironwood Log', type: 'trade', desc: 'Dense, heavy wood that never rots.' },
  buckle: { name: 'Brass Buckle', type: 'junk', price: 6, desc: 'Salvage. Tam might buy it.' },
  spoon: { name: 'Silver Spoon', type: 'junk', price: 10, desc: 'Salvage. Tam might buy it.' },
  rope: { name: 'Coil of Rope', type: 'junk', price: 4, desc: 'Salvage. Tam might buy it.' },
};
const FOOD_ORDER = ['cooked', 'bread', 'coconut'];

let S = null; // the live state

function newState(ch) {
  ch = ch || 1;
  const st = {
    v: 1, ch,
    day: 1, time: 7.25,
    coins: 12,
    inv: {},
    f: {},
    boat: null, // 'row' | 'sail' | 'big'
    loc: 'cottage', px: 200, facing: 1,
    bottles: [],
    stats: { fish: 0, caught: {}, startedAt: Date.now() },
    daily: { day: 1, palms: [1, 1, 1], oysters: [1, 1, 1] },
    hull: 3,
  };
  if (CHAPTER_SETUP[ch]) CHAPTER_SETUP[ch](st);
  return st;
}
// per-chapter starting conditions (filled in by chapter scripts)
const CHAPTER_SETUP = {};

const Inv = {
  count(id) { return S.inv[id] || 0; },
  has(id) { return (S.inv[id] || 0) > 0; },
  add(id, n) {
    n = n || 1;
    S.inv[id] = (S.inv[id] || 0) + n;
    const name = ITEMS[id] ? ITEMS[id].name : id;
    Toast.show('+' + (n > 1 ? n + ' ' : '') + name, id);
  },
  remove(id, n) {
    n = n || 1;
    S.inv[id] = Math.max(0, (S.inv[id] || 0) - n);
    if (!S.inv[id]) delete S.inv[id];
  },
  food() { return FOOD_ORDER.reduce((a, k) => a + (S.inv[k] || 0), 0); },
  eat(n) {
    for (const k of FOOD_ORDER) {
      while (n > 0 && S.inv[k] > 0) { this.remove(k, 1); n--; }
    }
    return n; // shortfall
  },
  addCoins(n) { S.coins += n; Toast.show((n >= 0 ? '+' : '') + n + ' coins', 'coin'); Sound.sfx('coin'); },
  fishList() { return Object.keys(S.inv).filter(k => ITEMS[k] && ITEMS[k].type === 'fish'); },
};

function flag(k) { return !!S.f[k]; }
function setFlag(k, v) { S.f[k] = v === undefined ? true : v; }

function boatCfg() {
  return { type: S.boat || 'row', iron: flag('ironHull'), lantern: flag('lantern'), iceBow: flag('iceBow') };
}
function maxHull() { return flag('ironHull') ? 6 : 3; }

// ---------------- time ----------------
const Clock = {
  advance(hours) {
    S.time += hours;
    while (S.time >= 24) { S.time -= 24; S.day++; }
    this.dailyReset();
  },
  dailyReset() {
    if (S.daily.day !== S.day) {
      S.daily.day = S.day;
      S.daily.palms = [1, 1, 1];
      S.daily.oysters = [1, 1, 1];
    }
  },
  sleepUntilMorning() {
    if (S.time >= 7) S.day++;
    S.time = 7;
    this.dailyReset();
  },
  str() {
    const h = Math.floor(S.time), m = Math.floor((S.time - h) * 60 / 10) * 10;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },
};

// ---------------- saving ----------------
// One save file holds every chapter: { v: 2, slots: {1: state, 2: state}, unlocked, last, settings }.
const Save = {
  key: 'lostfisherman.save.v1',
  data: null,
  hasNative() { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.save); },
  load() {
    let json = null;
    if (typeof window.__SAVE_DATA__ === 'string' && window.__SAVE_DATA__.length > 2) json = window.__SAVE_DATA__;
    if (!json) { try { json = localStorage.getItem(this.key); } catch (e) { } }
    let d = null;
    try { d = json ? JSON.parse(json) : null; } catch (e) { d = null; }
    if (d && d.v === 1 && d.day) {
      // a Chapter I save from before chapters existed
      d.ch = 1;
      d = { v: 2, slots: { 1: d }, unlocked: { 2: !!(d.f && d.f.ended) }, last: 1, settings: { music: d.musicVol, sfx: d.sfxVol, sound: d.sound } };
    }
    if (!d || d.v !== 2) d = { v: 2, slots: {}, unlocked: {}, last: 1, settings: {} };
    this.data = d;
    return d;
  },
  slot(ch) {
    if (!this.data) this.load();
    const st = this.data.slots[ch];
    if (!st) return null;
    return Object.assign(newState(ch), st, { ch });
  },
  lastSlot() { return this.data ? this.slot(this.data.last) : null; },
  write() {
    if (!S || S.placeholder) return;
    if (!this.data) this.load();
    this.data.slots[S.ch || 1] = S;
    this.data.last = S.ch || 1;
    this.flush();
  },
  saveSettings() {
    if (!this.data) this.load();
    this.data.settings = { music: Sound.musicVol, sfx: Sound.sfxVol, sound: Sound.enabled };
    this.flush();
  },
  unlock(ch) { if (!this.data) this.load(); this.data.unlocked[ch] = true; this.flush(); },
  isUnlocked(ch) { if (!this.data) this.load(); return ch === 1 || !!this.data.unlocked[ch]; },
  clearSlot(ch) { if (!this.data) this.load(); delete this.data.slots[ch]; this.flush(); },
  flush() {
    const json = JSON.stringify(this.data);
    try { if (this.hasNative()) window.webkit.messageHandlers.save.postMessage(json); } catch (e) { }
    try { localStorage.setItem(this.key, json); } catch (e) { }
    window.__SAVE_DATA__ = json;
  },
};

// ---------------- objectives ----------------
const CHAPTER_OBJECTIVES = {};
function objectives() {
  if (S.ch && S.ch !== 1 && CHAPTER_OBJECTIVES[S.ch]) return CHAPTER_OBJECTIVES[S.ch]();
  const o = [];
  const f = S.f;
  if (f.ended) { o.push('You found him. Enjoy the sea!'); return o; }
  if (!f.readLog) o.push("Look around Grandpa's cottage. His logbook is on the table.");
  if (f.readLog && !Inv.has('rod')) o.push("Take Grandpa's fishing rod from the cottage wall.");
  if (f.readLog && !S.boat) {
    o.push('Buy a rowboat from Bo the shipwright (30 coins). Catch fish off the pier and sell them to Tam.');
  }
  if (S.boat && !f.gullClue) o.push('Row out to Gull Rock, where Grandpa saw the lights.');
  if (f.gullClue && S.boat === 'row') o.push('Buy a sail from Bo (50 coins). Coconut Isle is too far to row.');
  if (f.gullClue && S.boat && S.boat !== 'row' && !f.miraMet) o.push('Sail to Coconut Isle and ask about Grandpa.');
  if (f.miraMet && S.boat !== 'big') {
    const need = [];
    if (!Inv.has('pearl') && !f.bigSail) need.push('a pearl (oyster beds at Pearl Shoal)');
    if (!Inv.has('honey') && !f.bigSail) need.push("a jar of honey (Rosa's bakery)");
    o.push('Trade with Mira for her big storm sail.' + (need.length ? ' She wants ' + need.join(' and ') + '.' : ' Bring her the pearl and honey!'));
  }
  if (S.boat === 'big' && !f.bramMet) o.push('Sail to the dark lighthouse at Kettle Point.');
  if (f.bramMet && !f.lighthouseLit) {
    const need = [];
    if (!Inv.has('oil')) need.push("lamp oil (Hollis's store)");
    if (!Inv.has('wick')) need.push('a new wick (ask Mira on Coconut Isle)');
    o.push('Relight the lighthouse.' + (need.length ? ' You need ' + need.join(' and ') + '.' : ' Climb the tower and light the lamp!'));
  }
  if (f.bramMet && !f.ironHull) {
    if (!f.askedHull) o.push('The reef past the lighthouse would tear a hull apart. Ask Bo about making yours stronger.');
    else o.push('Bring Bo 3 ironwood logs (' + Inv.count('ironwood') + '/3, from Coconut Isle) and 40 coins to reinforce your hull.');
  }
  if (f.lighthouseLit && !f.lantern) o.push('Go back down the tower and talk to Bram.');
  if (f.lighthouseLit && f.lantern && f.ironHull && !f.foundAnsel) o.push('Sail from Kettle Point through the reef and into the fog.');
  if (f.foundAnsel && !f.whaleFreed) o.push('Go with Grandpa to the cove on the east side of the island.');
  if (!o.length) o.push('Explore. Fish. Listen to the sea.');
  return o;
}
