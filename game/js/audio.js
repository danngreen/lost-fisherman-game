'use strict';
// ---------------------------------------------------------------------------
// Procedural audio: ambience (sea, wind, rain), sound effects, gentle music
// ---------------------------------------------------------------------------
const Sound = {
  ac: null, master: null, sfxBus: null, musicBus: null, ambBus: null,
  enabled: true, unlocked: false,
  amb: {}, ambTarget: { sea: 0, wind: 0, rain: 0, fire: 0 },
  music: { mood: 'none', next: 0, step: 0 },

  unlock() {
    if (!this.ac) this.init();
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
    this.unlocked = true;
  },

  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ac = new AC(); } catch (e) { return; }
    const ac = this.ac;
    this.master = ac.createGain();
    this.master.gain.value = this.enabled ? 0.7 : 0;
    this.master.connect(ac.destination);
    this.sfxBus = ac.createGain(); this.sfxBus.gain.value = 0.55; this.sfxBus.connect(this.master);
    this.ambBus = ac.createGain(); this.ambBus.gain.value = 0.6; this.ambBus.connect(this.master);
    this.musicBus = ac.createGain(); this.musicBus.gain.value = 0.32;

    // simple echo/reverb for music & whale
    const delay = ac.createDelay(1.0); delay.delayTime.value = 0.38;
    const fb = ac.createGain(); fb.gain.value = 0.38;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    this.musicBus.connect(this.master);
    this.musicBus.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay);
    const wet = ac.createGain(); wet.gain.value = 0.45; lp.connect(wet); wet.connect(this.master);
    this.echo = delay;

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
    this.t0 = ac.currentTime;
  },

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.7 : 0, this.ac.currentTime, 0.05);
  },

  setAmbience(o) { Object.assign(this.ambTarget, o); },

  update(dt) {
    if (!this.ac || this.ac.state !== 'running') return;
    const t = this.ac.currentTime;
    const at = this.ambTarget;
    // sea swell
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
  setMood(m) { if (this.music.mood !== m) { this.music.mood = m; this.music.step = 0; } },

  updateMusic(t) {
    const M = this.music;
    if (M.mood === 'none' || t < M.next) return;
    const moods = {
      village: { root: 60, scale: [0, 2, 4, 7, 9, 12, 14, 16], gap: [0.5, 1.0], wave: 'triangle', vol: 0.11, bass: true },
      sea: { root: 57, scale: [0, 2, 3, 5, 7, 9, 10, 12], gap: [0.8, 1.6], wave: 'triangle', vol: 0.09, bass: true },
      island: { root: 62, scale: [0, 2, 4, 7, 9, 12, 14], gap: [0.4, 0.9], wave: 'sine', vol: 0.12, bass: true },
      eerie: { root: 50, scale: [0, 1, 5, 7, 8, 12, 13], gap: [1.5, 3.2], wave: 'sine', vol: 0.09, bass: false, drone: true },
      night: { root: 55, scale: [0, 3, 5, 7, 10, 12, 15], gap: [1.1, 2.4], wave: 'sine', vol: 0.08, bass: false },
      wonder: { root: 64, scale: [0, 4, 7, 11, 12, 14, 16, 19], gap: [0.35, 0.6], wave: 'sine', vol: 0.11, bass: true },
    };
    const m = moods[M.mood];
    if (!m) return;
    M.step++;
    // melody walks
    if (M.idx === undefined) M.idx = 2;
    M.idx = clamp(M.idx + Math.floor(Math.random() * 5) - 2, 0, m.scale.length - 1);
    const note = m.root + m.scale[M.idx];
    this.tone(note, m.wave, m.vol, 1.6, t);
    if (m.bass && M.step % 4 === 1) this.tone(m.root - 12 + (M.step % 8 === 1 ? 0 : 7), 'sine', m.vol * 0.9, 3.0, t);
    if (m.drone && M.step % 3 === 1) this.tone(m.root - 12, 'sine', m.vol * 0.7, 6, t);
    M.next = t + lerp(m.gap[0], m.gap[1], Math.random());
  },

  tone(midi, wave, vol, dur, t) {
    const ac = this.ac;
    t = t || ac.currentTime;
    const o = ac.createOscillator(); o.type = wave;
    o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.musicBus);
    o.start(t); o.stop(t + dur + 0.05);
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
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.musicBus);
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
