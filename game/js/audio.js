'use strict';
// ---------------------------------------------------------------------------
// Procedural audio: ambience (sea, wind, rain), sound effects, gentle music
// ---------------------------------------------------------------------------

// Music moods. Melodies stay between lo..hi (MIDI) so nothing gets shrill on
// small laptop speakers. chords are semitone offsets from root; each chord
// lasts one bar of four beats.
const MOODS = {
  village: {
    root: 60, scale: [0, 2, 4, 5, 7, 9, 11], beat: 0.5, lo: 55, hi: 69,
    chords: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [-5, -1, 2], [0, 4, 7], [-7, -3, 0], [-5, -1, 2], [0, 4, 7]],
    lead: 'triangle', leadVol: 0.05, density: 0.55, pluck: true, bassVol: 0.05, padVol: 0.012,
  },
  sea: {
    root: 57, scale: [0, 2, 3, 5, 7, 9, 10], beat: 0.62, lo: 52, hi: 67,
    chords: [[0, 3, 7], [5, 9, 12], [-2, 2, 5], [0, 3, 7], [3, 7, 10], [-2, 2, 5], [5, 9, 12], [0, 3, 7]],
    lead: 'sine', leadVol: 0.055, density: 0.42, bassVol: 0.05, padVol: 0.016,
  },
  island: {
    root: 62, scale: [0, 2, 4, 7, 9], beat: 0.44, lo: 57, hi: 71,
    chords: [[0, 4, 7], [7, 11, 14], [-3, 0, 4], [5, 9, 12]],
    lead: 'triangle', leadVol: 0.045, density: 0.6, pluck: true, bassVol: 0.05, padVol: 0.01,
  },
  night: {
    root: 55, scale: [0, 3, 5, 7, 10], beat: 0.75, lo: 50, hi: 65,
    chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [0, 3, 7], [5, 8, 12], [3, 7, 10], [-2, 2, 5], [0, 3, 7]],
    lead: 'sine', leadVol: 0.05, density: 0.32, bassVol: 0.04, padVol: 0.016,
  },
  eerie: {
    root: 50, scale: [0, 1, 5, 7, 8], beat: 0.9, lo: 50, hi: 64,
    chords: [[0, 3, 7], [1, 5, 8], [0, 3, 7], [-2, 1, 5]],
    lead: 'sine', leadVol: 0.045, density: 0.2, bassVol: 0.045, padVol: 0.02, drone: true,
  },
  wonder: {
    root: 52, scale: [0, 2, 4, 6, 7, 9, 11], beat: 0.55, lo: 56, hi: 71,
    chords: [[0, 4, 7], [2, 6, 9], [-3, 0, 4], [2, 6, 9], [5, 9, 12], [7, 11, 14], [-3, 0, 4], [0, 4, 7]],
    lead: 'sine', leadVol: 0.055, density: 0.5, bassVol: 0.05, padVol: 0.018,
  },
};
const VOL_STEPS = 10;

const Sound = {
  ac: null, master: null, sfxBus: null, musicBus: null, ambBus: null,
  enabled: true, unlocked: false,
  musicVol: 6, sfxVol: 8,
  amb: {}, ambTarget: { sea: 0, wind: 0, rain: 0, fire: 0 },
  music: { mood: 'none' },

  unlock() {
    if (!this.ac) this.init();
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
    this.unlocked = true;
  },

  // feedback delay used as a cheap reverb
  echo(input, output, time, feedback, wet) {
    const ac = this.ac;
    const d = ac.createDelay(1.0); d.delayTime.value = time;
    const fb = ac.createGain(); fb.gain.value = feedback;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const w = ac.createGain(); w.gain.value = wet;
    input.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(w); w.connect(output);
  },

  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ac = new AC(); } catch (e) { return; }
    const ac = this.ac;
    this.master = ac.createGain();
    this.master.gain.value = this.enabled ? 0.8 : 0;
    // gentle limiter so stacked sounds never clip on small speakers
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(ac.destination);

    // effects + ambience share the "Sound Effects" level
    this.sfxVolNode = ac.createGain(); this.sfxVolNode.connect(this.master);
    this.sfxBus = ac.createGain(); this.sfxBus.gain.value = 0.55; this.sfxBus.connect(this.sfxVolNode);
    this.ambBus = ac.createGain(); this.ambBus.gain.value = 0.6; this.ambBus.connect(this.sfxVolNode);
    this.whaleBus = ac.createGain(); this.whaleBus.gain.value = 0.8; this.whaleBus.connect(this.sfxVolNode);
    this.echo(this.whaleBus, this.sfxVolNode, 0.42, 0.42, 0.5);

    // music: soft low-pass to tame the top end, then the "Music" level
    this.musicVolNode = ac.createGain(); this.musicVolNode.connect(this.master);
    const tame = ac.createBiquadFilter(); tame.type = 'lowpass'; tame.frequency.value = 1900; tame.Q.value = 0.4;
    const shelf = ac.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 900; shelf.gain.value = -5;
    tame.connect(shelf); shelf.connect(this.musicVolNode);
    this.musicBus = ac.createGain(); this.musicBus.gain.value = 1; this.musicBus.connect(tame);
    this.echo(this.musicBus, tame, 0.36, 0.3, 0.22);
    this.applyVolumes();

    // noise buffer
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = w * 0.5 + b * 3; }
    this.noise = buf;

    const mk = (type, freq, q) => {
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      src.playbackRate.value = 0.7 + Math.random() * 0.3;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
      const g = ac.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(this.ambBus);
      src.start();
      return { src, f, g };
    };
    this.amb.sea = mk('lowpass', 420);
    this.amb.sea2 = mk('bandpass', 900, 0.7);
    this.amb.wind = mk('bandpass', 600, 1.4);
    this.amb.rain = mk('highpass', 2500);
    this.amb.fire = mk('bandpass', 1800, 2);
  },

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.8 : 0, this.ac.currentTime, 0.05);
  },

  // 0..10 levels from the settings menu
  setVolumes(music, sfx) {
    if (music !== undefined) this.musicVol = clamp(music, 0, VOL_STEPS);
    if (sfx !== undefined) this.sfxVol = clamp(sfx, 0, VOL_STEPS);
    this.applyVolumes();
  },
  applyVolumes() {
    if (!this.ac) return;
    const curve = v => Math.pow(v / VOL_STEPS, 1.6);
    const t = this.ac.currentTime;
    this.musicVolNode.gain.setTargetAtTime(curve(this.musicVol) * 1.4, t, 0.05);
    this.sfxVolNode.gain.setTargetAtTime(curve(this.sfxVol) * 1.15, t, 0.05);
  },

  setAmbience(o) { Object.assign(this.ambTarget, o); },

  update(dt) {
    if (!this.ac || this.ac.state !== 'running') return;
    const t = this.ac.currentTime;
    const at = this.ambTarget;
    const swell = 0.55 + 0.45 * Math.sin(t * 0.55) * Math.sin(t * 0.23 + 1);
    this.amb.sea.g.gain.setTargetAtTime(at.sea * (0.35 + 0.35 * swell), t, 0.3);
    this.amb.sea2.g.gain.setTargetAtTime(at.sea * 0.12 * swell, t, 0.3);
    this.amb.wind.g.gain.setTargetAtTime(at.wind * (0.18 + 0.12 * Math.sin(t * 0.7)), t, 0.4);
    this.amb.wind.f.frequency.setTargetAtTime(500 + 300 * Math.sin(t * 0.31), t, 0.5);
    this.amb.rain.g.gain.setTargetAtTime(at.rain * 0.16, t, 0.4);
    const crack = Math.random() < 0.15 ? 1 : 0.4;
    this.amb.fire.g.gain.setTargetAtTime(at.fire * 0.08 * crack, t, 0.02);
    this.updateMusic(t);
  },

  // ---------------- music ----------------
  // Beat-by-beat scheduler. Music is built from phrases of 8 beats; a short
  // motif (rhythm + melodic shape) repeats with variations in an A A' B A
  // pattern, and every so often the melody rests while chords carry on.
  setMood(m) {
    const M = this.music;
    if (M.mood === m) return;
    M.mood = m;
    M.beat = 0; M.phrase = -1; M.section = 0; M.motif = null; M.last = null;
    M.next = this.ac ? this.ac.currentTime + 0.4 : 0;
  },

  newMotif(m) {
    const rhythm = [], steps = [];
    for (let i = 0; i < 8; i++) {
      const strong = i % 2 === 0;
      const on = i === 0 || Math.random() < (strong ? m.density + 0.2 : m.density * 0.5);
      rhythm.push(on ? 1 : 0);
      steps.push([-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]);
    }
    rhythm[7] = 0; // breathe at the end of every phrase
    return { rhythm, steps };
  },

  updateMusic(t) {
    const M = this.music;
    const m = MOODS[M.mood];
    if (!m) return;
    if (M.next < t - 0.5) M.next = t + 0.05; // recover after the tab sleeps
    while (M.next < t + 0.25) {
      this.scheduleBeat(m, M, M.next);
      M.next += m.beat;
      M.beat++;
    }
  },

  scheduleBeat(m, M, time) {
    const b = M.beat % 8;
    const bar = Math.floor(M.beat / 4);
    const chord = m.chords[bar % m.chords.length];
    if (b === 0) {
      M.phrase++;
      const pos = M.phrase % 4;
      if (pos === 0) { M.section++; if (!M.motif || M.section % 2 === 1) M.motif = this.newMotif(m); M.restSection = Math.random() < 0.25; }
      M.cur = pos === 2 ? this.newMotif(m) : M.motif; // B phrase
      M.silent = M.restSection && pos >= 2;
    }
    // bass + pad on each bar
    if (M.beat % 4 === 0) {
      const root = m.root + chord[0];
      this.note(root - 24 + (root - 24 < 36 ? 12 : 0), 'sine', m.bassVol, m.beat * 3.6, time, { attack: 0.04 });
      if (m.drone && bar % 2 === 0) this.note(m.root - 24, 'sine', m.bassVol * 0.8, m.beat * 8, time, { attack: 1.2 });
      for (let i = 1; i < 3; i++) this.note(m.root + chord[i] - 12, 'sine', m.padVol, m.beat * 4.2, time, { attack: m.beat * 1.2, sustain: 0.8 });
    }
    if (M.silent) return;
    if (!M.cur.rhythm[b]) return;
    // melody note: step through the scale, landing on chord tones on strong beats
    const scaleNotes = [];
    for (let o = -24; o <= 24; o += 12) for (const s of m.scale) { const n = m.root + o + s; if (n >= m.lo && n <= m.hi) scaleNotes.push(n); }
    scaleNotes.sort((a, c) => a - c);
    let idx = M.last === null ? Math.floor(scaleNotes.length / 2) : scaleNotes.indexOf(M.last);
    if (idx < 0) idx = Math.floor(scaleNotes.length / 2);
    const variation = M.phrase % 4 === 1 && Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    idx = clamp(idx + M.cur.steps[b] + variation, 0, scaleNotes.length - 1);
    let note = scaleNotes[idx];
    if (b % 4 === 0) {
      let best = note, bd = 99;
      for (const n of scaleNotes) {
        const pc = ((n - m.root) % 12 + 12) % 12;
        if (chord.some(cn => ((cn % 12) + 12) % 12 === pc) && Math.abs(n - note) < bd) { bd = Math.abs(n - note); best = n; }
      }
      note = best;
    }
    // drift back toward the middle if we wander to the edges
    if (note >= m.hi - 1 && Math.random() < 0.6) note = scaleNotes[Math.max(0, scaleNotes.indexOf(note) - 2)];
    M.last = note;
    let len = 1;
    while (b + len < 8 && !M.cur.rhythm[b + len] && len < 3) len++;
    const jitter = (Math.random() - 0.5) * 0.02;
    const vol = m.leadVol * (b % 4 === 0 ? 1 : 0.8) * (0.9 + Math.random() * 0.2);
    this.note(note, m.lead, vol, m.beat * (m.pluck ? Math.min(len, 2) * 0.9 : len * 1.1), time + jitter, { attack: m.pluck ? 0.012 : 0.07, pluck: m.pluck });
  },

  note(midi, wave, vol, dur, t, o) {
    o = o || {};
    const ac = this.ac;
    const osc = ac.createOscillator(); osc.type = wave;
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    const g = ac.createGain();
    const a = o.attack || 0.03;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.pluck) g.gain.exponentialRampToValueAtTime(vol * 0.25, t + a + dur * 0.5);
    else g.gain.setTargetAtTime(vol * (o.sustain || 0.6), t + a, dur * 0.4);
    g.gain.setTargetAtTime(0.0001, t + Math.max(a, dur * 0.8), dur * 0.25 + 0.05);
    osc.connect(g); g.connect(this.musicBus);
    osc.start(t); osc.stop(t + dur * 1.6 + 0.3);
  },

  // ---------------- whale song ----------------
  whale(vol) {
    if (!this.ac || this.ac.state !== 'running') return;
    const ac = this.ac, t = ac.currentTime;
    vol = vol || 0.2;
    const base = 120 + Math.random() * 90;
    const o = ac.createOscillator(); o.type = 'sine';
    const o2 = ac.createOscillator(); o2.type = 'triangle';
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * (1.4 + Math.random() * 0.6), t + 1.2);
    o.frequency.linearRampToValueAtTime(base * 0.8, t + 3.2);
    o2.frequency.setValueAtTime(base * 2.01, t);
    o2.frequency.linearRampToValueAtTime(base * 2.9, t + 1.3);
    o2.frequency.linearRampToValueAtTime(base * 1.6, t + 3.2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    const g2 = ac.createGain(); g2.gain.value = 0.25;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.whaleBus);
    o.start(t); o2.start(t); o.stop(t + 3.8); o2.stop(t + 3.8);
  },

  // ---------------- sfx ----------------
  sfx(name) {
    if (!this.ac || this.ac.state !== 'running') return;
    const ac = this.ac, t = ac.currentTime;
    const env = (node, a, d, v) => {
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
      node.connect(g); g.connect(this.sfxBus);
      return g;
    };
    const osc = (type, f0, f1, dur, v, delay) => {
      const o = ac.createOscillator(); o.type = type;
      const st = t + (delay || 0);
      o.frequency.setValueAtTime(f0, st);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, st + dur);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(v, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      o.connect(g); g.connect(this.sfxBus);
      o.start(st); o.stop(st + dur + 0.05);
    };
    const noise = (type, freq, dur, v, q) => {
      const s = ac.createBufferSource(); s.buffer = this.noise;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
      s.connect(f); env(f, 0.01, dur, v);
      s.start(t, Math.random()); s.stop(t + dur + 0.1);
      return f;
    };
    switch (name) {
      case 'blip': osc('square', 660, 0, 0.05, 0.05); break;
      case 'select': osc('square', 520, 0, 0.05, 0.05); osc('square', 780, 0, 0.07, 0.05, 0.05); break;
      case 'back': osc('square', 400, 260, 0.08, 0.05); break;
      case 'type': osc('square', 900 + Math.random() * 200, 0, 0.015, 0.012); break;
      case 'coin': osc('square', 988, 0, 0.06, 0.06); osc('square', 1319, 0, 0.18, 0.06, 0.06); break;
      case 'pickup': osc('triangle', 523, 0, 0.08, 0.12); osc('triangle', 784, 0, 0.14, 0.12, 0.07); break;
      case 'splash': noise('lowpass', 1400, 0.35, 0.35); osc('sine', 300, 80, 0.2, 0.1); break;
      case 'plop': osc('sine', 600, 150, 0.12, 0.2); break;
      case 'bite': osc('square', 880, 0, 0.06, 0.08); osc('square', 880, 0, 0.06, 0.08, 0.1); break;
      case 'reel': osc('square', 1500 + Math.random() * 300, 0, 0.02, 0.02); break;
      case 'catch': [0, 4, 7, 12].forEach((n, i) => osc('triangle', 523 * Math.pow(2, n / 12), 0, 0.2, 0.12, i * 0.07)); break;
      case 'lose': osc('triangle', 392, 196, 0.4, 0.12); break;
      case 'bump': noise('lowpass', 300, 0.3, 0.6); osc('sine', 90, 40, 0.3, 0.3); break;
      case 'door': noise('bandpass', 500, 0.15, 0.3, 2); osc('sine', 140, 90, 0.12, 0.15); break;
      case 'chop': noise('bandpass', 1200, 0.08, 0.5, 3); osc('square', 180, 90, 0.06, 0.08); break;
      case 'thud': osc('sine', 120, 50, 0.25, 0.3); break;
      case 'gull': osc('sawtooth', 1800, 1200, 0.18, 0.025); osc('sawtooth', 1700, 1100, 0.2, 0.02, 0.22); break;
      case 'thunder': { const f = noise('lowpass', 220, 2.2, 0.7); f.frequency.setTargetAtTime(90, t + 0.3, 0.6); break; }
      case 'whoosh': { const f = noise('bandpass', 400, 0.9, 0.4, 0.8); f.frequency.exponentialRampToValueAtTime(2400, t + 0.8); break; }
      case 'lamp': [0, 7, 12, 16, 19].forEach((n, i) => osc('sine', 392 * Math.pow(2, n / 12), 0, 1.4, 0.1, i * 0.12)); break;
      case 'quest': [0, 4, 7, 12, 7, 12].forEach((n, i) => osc('triangle', 440 * Math.pow(2, n / 12), 0, 0.25, 0.1, i * 0.09)); break;
      case 'cut': noise('highpass', 3000, 0.1, 0.4); osc('square', 1200, 400, 0.08, 0.04); break;
      case 'hum': osc('sine', 110, 0, 1.5, 0.15); osc('sine', 165, 0, 1.5, 0.08); break;
    }
  },
};
