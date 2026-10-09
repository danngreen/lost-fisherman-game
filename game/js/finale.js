'use strict';
// ---------------------------------------------------------------------------
// Finale: freeing the whale, homecoming, epilogue
// ---------------------------------------------------------------------------
const KNOTS = [[30, 30], [48, 52], [70, 34], [92, 24], [116, 20], [146, 18], [176, 20], [204, 24]];
const ARROWS = { up: '↑', down: '↓', left: '←', right: '→' };

const WhaleScene = {
  hud: false,
  enter() {
    this.t = 0;
    S.time = 22.6;
    this.wy = 260; this.wyTarget = 260;
    this.glow = 0.25;
    this.fog = 0.45;
    this.cut = 0;
    this.knot = -1;
    this.need = null;
    this.miss = 0;
    this.shake = 0;
    this.parts = [];
    this.spout = 0;
    this.clouds = new CloudLayer(71, 6, 20, 90, 0.1, 'fair', 1400);
    Sound.setMood('eerie');
    Sound.setAmbience({ sea: 0.6, wind: 0.1, rain: 0, fire: 0 });
    Game.hudHidden = true;
    Game.run(() => this.script());
  },
  exit() { Game.hudHidden = false; },
  async script() {
    await wait(1.2);
    await Dlg.narrate('You row Pip out into the middle of the cove. Grandpa sits in the bow, very still. The moon is a pale smudge behind the fog.');
    await Dlg.say('anselR', 'Shh. Listen.');
    Sound.whale(0.2);
    await wait(2);
    Sound.whale(0.25);
    this.wyTarget = 164;
    await wait(1.5);
    await Dlg.narrate('Deep below the boat, a light appears. Then another. Then dozens, green and blue, rising slowly out of the dark like lanterns floating up a well.');
    await wait(1.5);
    this.glow = 1;
    Sound.sfx('whoosh');
    await Dlg.narrate('And then the sea itself seems to lift, and she is there.');
    await Dlg.narrate('A whale. Longer than the whole Saltmere pier. Ancient and barnacled and glowing, every spot along her back pulsing softly, like breathing.');
    Sound.whale(0.3);
    await Dlg.say('anselR', "There she is. Hello, old girl. Easy now. Easy. We've come to help, like I promised.");
    await Dlg.narrate('Wrapped around her tail and over her back is a tangle of old grey net, thick as rope, biting into her skin.');
    await Dlg.say('anselR', "Here, take my knife. I'll keep the boat steady. When a knot lights up, press the arrow key it shows, and cut. Cut her free, little gull!");
    this.next();
    await new Promise(res => { this.onDone = res; });
    this.need = null;
    await wait(0.6);
    Sound.sfx('quest');
    await Dlg.narrate('The last strand of net parts and slides away into the dark water.');
    await wait(0.5);
    this.glow = 1.8; this.fog = 0;
    S.time = 23.2;
    Sound.setMood('wonder');
    Sound.whale(0.32); setTimeout(() => Sound.whale(0.28), 1400); setTimeout(() => Sound.whale(0.3), 2900);
    this.wyTarget = 152;
    this.spout = 3;
    await wait(1.5);
    await Dlg.narrate('She rises, and sighs a great misty breath into the sky, and every light along her body blazes at once.');
    await Dlg.narrate('The fog peels back from the cove like a curtain. For the first time, you can see the stars.');
    await Dlg.say('anselR', 'Look at her. Just look at her.');
    await Dlg.say('anselR', '...Thank you, little gull.');
    await wait(0.8);
    await Dlg.narrate('The whale turns, slowly, and swims toward the mouth of the cove. Then she stops, and waits, and looks back at you with one enormous, patient eye.');
    await Dlg.say('anselR', 'She wants us to follow her.');
    await Dlg.say('you', 'What about the Teeth? And the fog?');
    await Dlg.say('anselR', "With her leading the way? Ha! Take us home, Captain.");
    setFlag('whaleFreed');
    Game.goto('voyage', { from: 'hollow', to: 'saltmere', escort: true, cost: 2 });
  },
  next() {
    this.knot++;
    if (this.knot >= KNOTS.length) { this.need = null; if (this.onDone) this.onDone(); return; }
    const keys = Object.keys(ARROWS);
    let k;
    do { k = keys[Math.floor(Math.random() * 4)]; } while (k === this.need);
    this.need = k;
    this.kt = 0;
  },
  update(dt) {
    this.t += dt;
    this.wy = lerp(this.wy, this.wyTarget, dt * 0.8);
    if (this.shake > 0) this.shake -= dt;
    if (this.miss > 0) this.miss -= dt;
    this.parts = this.parts.filter(p => (p.t += dt) < p.life);
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; }
    if (this.spout > 0) {
      this.spout -= dt;
      for (let i = 0; i < 3; i++) this.parts.push({ x: this.wx() + 214 + Math.random() * 4, y: this.wy + 6, vx: (Math.random() - 0.5) * 20, vy: -60 - Math.random() * 40, t: 0, life: 1.2, col: '#d8f0ff' });
    }
    if (this.need && !Dlg.active) {
      this.kt += dt;
      for (const k of Object.keys(ARROWS)) {
        if (Input.pressed(k)) {
          if (k === this.need) {
            Sound.sfx('cut');
            const [kx, ky] = KNOTS[this.knot];
            for (let i = 0; i < 10; i++) this.parts.push({ x: this.wx() + kx, y: this.wy + ky, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 40, t: 0, life: 0.6, col: '#8a9a7a' });
            this.cut++;
            if (this.cut % 3 === 0) Sound.whale(0.15);
            this.next();
          } else {
            Sound.sfx('back'); this.miss = 0.8; this.shake = 0.3;
          }
          break;
        }
      }
    }
  },
  wx() { return 160 + Math.sin(this.t * 0.3) * 3; },
  draw(c) {
    const h = S.time, t = this.t;
    const wea = this.fog > 0.3 ? 'fog' : 'clear';
    Sky.draw(c, h, wea, 150, Game.t);
    const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0;
    const wx = this.wx() + sx, wy = this.wy;
    let boat;
    composeWorld(c, w => {
      if (this.fog < 0.3) this.clouds.draw(w, 0, t * 2);
      // cove cliffs
      for (let x = 0; x < W; x++) {
        const hh = x < 120 ? 70 - x * 0.4 + Math.sin(x * 0.2) * 4 : x > 380 ? 30 + (x - 380) * 0.6 + Math.sin(x * 0.15) * 4 : 0;
        if (hh > 0) rect(w, x, 150 - hh, 1, hh, '#1e2228');
      }
      Sea.draw(w, 150, H, 0, t, 'night', h);
      drawWhale(w, wx, wy, t, this.glow);
      frontWater(w, 204, t, 'night', wx - 10, wx + 290, 0);
      boat = drawBoat(w, { type: S.boat || 'big', iron: true, lantern: true }, 74, 224, t, { riders: [PEOPLE.player.top, PEOPLE.anselRagged.top] });
      waterFront(w, 30, 120, 225, t, 'night', 0.6);
    }, h, wea);
    whaleSpots(c, wx, wy, t, this.glow);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = Math.min(1, this.glow * 0.4);
    c.drawImage(glowSprite(110, '#4ac8b8', 5, 0.5), Math.round(wx + 140 - 110), Math.round(wy + 40 - 110));
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (boat && boat.lantern) drawLights(c, [{ x: boat.lantern.x, y: boat.lantern.y, r: 30, col: '#ffcf7a', a: 0.5, always: true, flicker: true }], 1);
    // net
    if (this.glow > 0.5) {
      for (let i = 0; i < KNOTS.length; i++) {
        if (i < this.knot) continue;
        const [ax, ay] = KNOTS[i];
        const x0 = wx + ax, y0 = wy + ay;
        c.globalAlpha = 0.9;
        line(c, x0, y0, x0 - 6, y0 + 22, '#7a8a6a');
        line(c, x0, y0, x0 + 8, y0 + 20, '#7a8a6a');
        if (i + 1 < KNOTS.length) line(c, x0, y0, wx + KNOTS[i + 1][0], wy + KNOTS[i + 1][1], '#8a9a7a');
        c.globalAlpha = 1;
        rect(c, x0 - 1, y0 - 1, 3, 3, '#5a6a4a');
      }
    }
    for (const p of this.parts) { c.globalAlpha = 1 - p.t / p.life; px(c, p.x, p.y, p.col); }
    c.globalAlpha = 1;
    if (this.fog > 0) Weather.fog(c, t, 0, this.fog, '#3a4654');
    // prompt
    if (this.need && !Dlg.active) {
      const [kx, ky] = KNOTS[this.knot];
      const x0 = wx + kx, y0 = wy + ky;
      const pulse = 4 + Math.sin(t * 8) * 2;
      c.globalAlpha = 0.8;
      for (let a = 0; a < 16; a++) px(c, x0 + Math.cos(a / 16 * 6.28) * pulse, y0 + Math.sin(a / 16 * 6.28) * pulse, '#fff6a0');
      c.globalAlpha = 1;
      panel(c, x0 - 10, y0 - 34, 21, 19, 1);
      drawText(c, ARROWS[this.need], x0 - 2, y0 - 29, this.miss > 0 ? '#ff8a6a' : UIC.hi);
      drawText(c, 'Knot ' + (this.knot + 1) + ' of ' + KNOTS.length + ':  press the arrow key shown', W / 2, 20, '#fff6dc', { align: 'center', outline: '#14101a' });
      if (this.miss > 0) drawText(c, 'The knife slips! Try again.', W / 2, 32, '#ffb0a0', { align: 'center', outline: '#14101a' });
    }
  },
};

// homecoming is played in the village with everyone on the pier
async function homecoming(sc) {
  Game.hudHidden = true;
  S.time = 6.4;
  await wait(1);
  await Dlg.narrate('Dawn. The whole of Saltmere is on the pier, wrapped in blankets, pointing out to sea, where a great green-blue glow is slowly sinking back into the deep.');
  Sound.whale(0.2);
  await Dlg.say('greta', 'ANSEL HALE. You old fool! You had the whole coast worried sick!');
  await Dlg.say('ansel', "Told you I'd be back by morning, Greta. I just didn't say which morning.");
  await Dlg.narrate("You pull something from your bag: a blue knitted cap. Grandpa stares at it for a long moment. Then he puts it on, and he looks like himself again.");
  await Dlg.say('rosa', "I saved your loaf, Ansel! Every week! It's a bit... crunchy now.");
  await Dlg.say('finn', 'Well? WELL? Was it her? The Lantern Whale?');
  await Dlg.say('ansel', 'Every word of it true, Finn.');
  await Dlg.say('finn', 'HA! Forty years! Forty years I have been telling you lot!');
  await Dlg.say('bo', "And what did you do to my boat, kid? ...Never mind. Never mind. Come here. Both of you.");
  await Dlg.say('nell', 'Pickles says welcome home. And so do I.');
  await Dlg.say('ansel', "You know, little gull... your grandmother always said the lights were the sea's way of saying thank you.");
  await Dlg.say('ansel', "I think she was right. But I think this time, they were saying thank you to you.");
  await wait(0.5);
  setFlag('ended');
  S.stats.days = S.day;
  Save.write();
  await Game.fadeTo(1, 1.5);
  Game.hudHidden = false;
  Game.setScene('epilogue');
  await Game.fadeTo(0, 1);
}

const EpilogueScene = {
  hud: false,
  cards: [
    'Grandpa bought his pocket watch back from Mira the very next week. She charged him one jar of honey and one very long story.',
    'Old Bram never let the Kettle Point light go dark again. Saltmere made sure the supply boat sailed every single month.',
    'And every autumn after that, on the first clear night, the whole village gathers on the pier.',
    'Far out past Gull Rock, the sea lights up, green and blue, like lanterns rising.',
    "Grandpa says she's just saying hello.",
  ],
  enter() { this.t = 0; this.i = 0; this.ct = 0; Sound.setMood('wonder'); },
  update(dt, free) {
    this.t += dt; this.ct += dt;
    if (!free) return;
    if ((Input.pressed('act') && this.ct > 0.8) || this.ct > 7) {
      this.i++; this.ct = 0;
      if (this.i > this.cards.length + 1) Game.goto('title');
    }
  },
  draw(c) {
    const t = this.t;
    Sky.draw(c, 21.5, 'clear', 180, Game.t);
    composeWorld(c, w => {
      Sea.draw(w, 180, H, t * 2, t, 'night', 21.5);
      for (let i = 0; i < 70; i++) { const hh = Math.round(Math.sin(i / 70 * Math.PI) * 30); rect(w, 60 + i, 180 - hh, 1, hh, '#14181e'); }
    }, 21.5, 'clear');
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const a = 0.25 + 0.2 * Math.sin(t * 1.1 + i * 1.3);
      c.globalAlpha = Math.max(0, a);
      c.drawImage(glowSprite(12, i % 2 ? '#7ff7e8' : '#9cffb0', 3, 0.8), Math.round(220 + i * 24 + Math.sin(t * 0.3 + i) * 6 - 12), Math.round(205 + (i % 3) * 10 - 12));
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    const a = clamp(this.ct / 1, 0, 1);
    c.globalAlpha = a;
    if (this.i < this.cards.length) {
      wrapText(this.cards[this.i], 380).forEach((l, k) => drawText(c, l, W / 2, 60 + k * 12, '#f4ecd8', { align: 'center', shadow: '#000' }));
    } else if (this.i === this.cards.length) {
      drawText(c, 'THE END', W / 2, 52, UIC.hi, { align: 'center', shadow: '#000' });
      const caught = S.stats.fish || 0;
      const lines = [
        'You found Grandpa in ' + (S.stats.days || S.day) + ((S.stats.days || S.day) === 1 ? ' day.' : ' days.'),
        'Fish caught: ' + caught,
        'Messages in bottles found: ' + S.bottles.length + ' / 5',
      ];
      lines.forEach((l, k) => drawText(c, l, W / 2, 76 + k * 12, '#dfe6f2', { align: 'center', shadow: '#000' }));
    } else {
      drawText(c, 'Thank you for playing', W / 2, 60, '#f4ecd8', { align: 'center', shadow: '#000' });
      drawText(c, 'The Lost Fisherman', W / 2, 74, UIC.hi, { align: 'center', shadow: '#000' });
    }
    c.globalAlpha = 1;
    drawText(c, '[E]', W - 20, H - 14, '#5a6070');
  },
};

