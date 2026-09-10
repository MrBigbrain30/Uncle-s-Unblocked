// Nagesh City - all sound.
//
// Nagesh has exactly one recorded voice line ("Nagesh"). Everything he
// expresses is that one sample resampled: despair is 0.46x, triumph is 2.05x.
// Every other character speaks in oscillator blips.

const VOICE_URL = '../assets/nagesh.wav';

// Named emotional registers for the one and only voice line.
export const VOICE = {
  death: 0.46,
  hurt: 0.62,
  fail: 0.55,
  sad: 0.7,
  neutral: 1.0,
  enterCar: 0.86,
  pickup: 1.1,
  checkpoint: 1.34,
  missionStart: 1.18,
  missionComplete: 1.72,
  unlock: 1.95,
  triumph: 2.05,
};

class Audio {
  constructor() {
    this.ctx = null;
    this.buffer = null;
    this.ready = false;
    this.enabled = true;
    this.masterVol = 0.85;
    this.musicVol = 0.5;
    this.sfxVol = 0.9;
    this._musicTimer = null;
    this._musicStep = 0;
    this._track = null;
    this._engine = null;
    this._lastVoiceAt = 0;
    this._lastRand = 0;
  }

  /** Must be called from a user gesture (browsers block audio otherwise). */
  async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVol;
    this.master.connect(this.ctx.destination);

    // A touch of hall on everything makes the procedural city feel like a place.
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this._impulse(1.6, 2.6);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.18;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.master);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);
    this.sfxBus.connect(this.reverb);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.musicVol;
    this.musicBus.connect(this.master);

    this.voiceBus = this.ctx.createGain();
    this.voiceBus.gain.value = 1.0;
    this.voiceBus.connect(this.master);
    this.voiceBus.connect(this.reverb);

    await this._loadVoice();
    this.ready = true;
  }

  async _loadVoice() {
    try {
      const res = await fetch(new URL(VOICE_URL, import.meta.url));
      const buf = await res.arrayBuffer();
      this.buffer = await this.ctx.decodeAudioData(buf);
    } catch (e) {
      console.warn('Nagesh voice failed to load; falling back to synth.', e);
      this.buffer = this._synthVoiceFallback();
    }
  }

  // If the wav is missing we still want the game playable.
  _synthVoiceFallback() {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * 0.55);
    const b = this.ctx.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const env = Math.min(1, t * 20) * Math.exp(-t * 3.2);
      const f = 150 - t * 40;
      d[i] = env * 0.5 * (Math.sin(t * f * 6.283) + 0.4 * Math.sin(t * f * 12.566));
    }
    return b;
  }

  _impulse(duration, decay) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * duration);
    const b = this.ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return b;
  }

  get time() { return this.ctx ? this.ctx.currentTime : 0; }

  // ------------------------------------------------------------- distance ---

  /** Where the ears are. Set once a frame from the player's position. */
  setListener(x, z) { this._lx = x; this._lz = z; }

  /**
   * Volume for something happening at (x, z). Returns 0 when it is far enough
   * away not to be worth playing at all - traffic is constantly clipping lamp
   * posts on the other side of the district, and every one of those used to
   * arrive at full volume in the player's ear.
   */
  gainAt(x, z, falloff = 42) {
    if (this._lx === undefined) return 1;
    const d = Math.hypot(x - this._lx, z - this._lz);
    if (d > falloff * 3) return 0;
    return 1 / (1 + (d / falloff) * (d / falloff) * 3);
  }

  // ---------------------------------------------------------------- voice ---

  /**
   * Play "Nagesh" at a given pitch. rate 1 = as recorded.
   * @param {number} rate playbackRate; also shortens/lengthens the clip
   * @param {object} opts {gain, delay, throttle}
   */
  voice(rate = 1, opts = {}) {
    if (!this.ready || !this.enabled || !this.buffer) return null;
    const now = this.ctx.currentTime;
    // Stop menu spam from turning into a wall of Nageshes.
    const throttle = opts.throttle !== undefined ? opts.throttle : 0.045;
    if (now - this._lastVoiceAt < throttle) return null;
    this._lastVoiceAt = now;

    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = Math.max(0.08, rate);

    const g = this.ctx.createGain();
    // Very high pitches get thin, very low ones get boomy. Compensate so every
    // register sits at a comfortable level.
    const comp = rate > 1 ? 1 / Math.pow(rate, 0.35) : 1 / Math.pow(rate, 0.15);
    g.gain.value = (opts.gain !== undefined ? opts.gain : 0.9) * comp;

    let node = g;
    if (rate < 0.8) {
      // Low = dread. Roll off the fizz so it reads as a groan.
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 200 + rate * 3000;
      g.connect(lp);
      node = lp;
    } else if (rate > 1.5) {
      // High = elation. Trim the top so it stays bright but not harsh.
      const hs = this.ctx.createBiquadFilter();
      hs.type = 'highshelf';
      hs.frequency.value = 4200;
      hs.gain.value = -5;
      g.connect(hs);
      node = hs;
    }

    src.connect(g);
    node.connect(this.voiceBus);
    src.start(now + (opts.delay || 0));
    return src;
  }

  /** Menu buttons: the same word, never the same note twice in a row. */
  voiceRandom(lo = 0.62, hi = 1.85, gain = 0.55) {
    let r = 1;
    for (let guard = 0; guard < 8; guard++) {
      r = lo + Math.random() * (hi - lo);
      if (Math.abs(r - this._lastRand) > (hi - lo) * 0.18) break;
    }
    this._lastRand = r;
    return this.voice(r, { gain, throttle: 0.03 });
  }

  /** A rising run of Nageshes - used for pickup streaks. */
  voiceLadder(step, gain = 0.6) {
    const semitone = Math.pow(2, 1 / 12);
    return this.voice(0.95 * Math.pow(semitone, Math.min(step, 10) * 1.5), { gain });
  }

  /** Chord of Nageshes. The end of the game earns this. */
  voiceChord(rates, gain = 0.5) {
    rates.forEach((r, i) => this.voice(r, { gain, delay: i * 0.07, throttle: 0 }));
  }

  // ------------------------------------------------------------ beep speech ---

  /**
   * Everyone who is not Nagesh talks in blips. Pitch and waveform per speaker
   * make characters recognisable before you read the name tag.
   */
  blip(profile, charCode) {
    if (!this.ready || !this.enabled) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = profile.wave || 'square';

    const isVowel = 'aeiouAEIOU'.indexOf(String.fromCharCode(charCode)) !== -1;
    const jitter = ((charCode * 37) % 13) / 13 - 0.5;
    const base = profile.pitch * (1 + jitter * (profile.spread || 0.22));
    const dur = (isVowel ? 0.085 : 0.055) * (profile.rate || 1);

    o.frequency.setValueAtTime(base, now);
    o.frequency.exponentialRampToValueAtTime(base * (isVowel ? 1.06 : 0.9), now + dur);

    const vol = (profile.gain || 0.14) * (isVowel ? 1 : 0.8);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    let tail = g;
    if (profile.filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = profile.filter;
      f.Q.value = profile.q || 4;
      g.connect(f);
      tail = f;
    }
    o.connect(g);
    tail.connect(this.sfxBus);
    o.start(now);
    o.stop(now + dur + 0.02);
  }

  // ------------------------------------------------------------------ sfx ---

  tone(freq, dur, opts = {}) {
    if (!this.ready || !this.enabled) return;
    const now = this.ctx.currentTime + (opts.delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opts.wave || 'sine';
    o.frequency.setValueAtTime(freq, now);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), now + dur);
    const vol = opts.gain !== undefined ? opts.gain : 0.2;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + (opts.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(now);
    o.stop(now + dur + 0.05);
  }

  noise(dur, opts = {}) {
    if (!this.ready || !this.enabled) return;
    const now = this.ctx.currentTime + (opts.delay || 0);
    const sr = this.ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * dur));
    const b = this.ctx.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    const f = this.ctx.createBiquadFilter();
    f.type = opts.type || 'bandpass';
    f.frequency.setValueAtTime(opts.freq || 900, now);
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, now + dur);
    f.Q.value = opts.q || 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(opts.gain !== undefined ? opts.gain : 0.2, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(now);
  }

  ui() { this.tone(880, 0.07, { wave: 'square', gain: 0.05, to: 1320 }); }
  hit() { this.noise(0.16, { freq: 380, to: 90, gain: 0.3, type: 'lowpass', q: 2 }); }

  crash(force, gain = 1) {
    if (gain <= 0.02) return;
    this.noise(0.28, { freq: 240, to: 60, gain: Math.min(0.42, 0.1 + force * 0.3) * gain, type: 'lowpass' });
    this.tone(70, 0.22, { wave: 'triangle', gain: 0.16 * gain, to: 40 });
  }

  pickupChime(step) {
    const f = 660 * Math.pow(2, step / 12);
    this.tone(f, 0.16, { wave: 'triangle', gain: 0.14, to: f * 1.5 });
  }

  gateOpen() {
    this.tone(110, 1.1, { wave: 'sawtooth', gain: 0.12, to: 330 });
    this.noise(1.2, { freq: 200, to: 1600, gain: 0.1, type: 'bandpass', q: 0.7 });
  }

  /** A lamp post meeting a bumper: bent steel and a burst bulb. */
  clang(gain = 1) {
    if (gain <= 0.02) return;
    this.tone(420, 0.55, { wave: 'triangle', gain: 0.17 * gain, to: 165 });
    this.tone(930, 0.34, { wave: 'square', gain: 0.06 * gain, to: 600 });
    this.noise(0.45, { freq: 2600, to: 420, gain: 0.16 * gain, type: 'bandpass', q: 1.2 });
    this.noise(0.12, { freq: 6200, gain: 0.13 * gain, type: 'highpass', delay: 0.02 });
  }

  droneWhir() { this.tone(1400, 0.12, { wave: 'square', gain: 0.03, to: 1150 }); }

  camera() {
    this.noise(0.05, { freq: 3000, gain: 0.16, type: 'highpass' });
    this.tone(2400, 0.05, { wave: 'square', gain: 0.05 });
  }

  alarm() {
    for (let i = 0; i < 3; i++) {
      this.tone(520, 0.18, { wave: 'square', gain: 0.09, to: 780, delay: i * 0.22 });
    }
  }

  glitch() {
    for (let i = 0; i < 7; i++) {
      this.noise(0.05, { freq: 200 + Math.random() * 4000, gain: 0.12, type: 'bandpass', q: 8, delay: i * 0.045 });
    }
  }

  heartbeat() {
    this.tone(58, 0.2, { wave: 'sine', gain: 0.34, to: 38 });
    this.tone(52, 0.24, { wave: 'sine', gain: 0.26, to: 34, delay: 0.26 });
  }

  // ------------------------------------------------------------- gunplay ---

  /**
   * Every gun is the same three ingredients in different proportions: a crack
   * of filtered noise, a body thump, and a tail. The proportions are what make
   * a pistol sound like a pistol and the rifle sound like a decision.
   * @param dist metres to the shooter, used to soften distant fire
   */
  gunshot(kind = 'pistol', gain = 1, dist = 0) {
    const far = 1 / (1 + Math.max(0, dist) * 0.022);
    const g = gain * far;
    const specs = {
      pistol: { crack: [2600, 700, 0.07, 0.34], body: [190, 60, 0.1, 0.22], tail: 0.16 },
      smg: { crack: [3000, 900, 0.05, 0.26], body: [230, 80, 0.07, 0.16], tail: 0.09 },
      shotgun: { crack: [1500, 260, 0.16, 0.44], body: [110, 38, 0.22, 0.34], tail: 0.3 },
      rifle: { crack: [3600, 520, 0.11, 0.42], body: [150, 45, 0.16, 0.3], tail: 0.34 },
    };
    const s = specs[kind] || specs.pistol;
    this.noise(s.crack[2], { freq: s.crack[0], to: s.crack[1], gain: s.crack[3] * g, type: 'bandpass', q: 0.6 });
    this.tone(s.body[0], s.body[2], { wave: 'triangle', gain: s.body[3] * g, to: s.body[1] });
    this.noise(s.tail, { freq: 900, to: 180, gain: 0.09 * g, type: 'lowpass', delay: 0.03 });
  }

  dryFire() { this.tone(1800, 0.03, { wave: 'square', gain: 0.06, to: 900 }); }
  gunSwap() { this.noise(0.07, { freq: 2200, gain: 0.08, type: 'bandpass', q: 3 }); }

  reload() {
    this.tone(320, 0.05, { wave: 'square', gain: 0.07, to: 180 });
    this.noise(0.06, { freq: 1400, gain: 0.08, type: 'bandpass', q: 2, delay: 0.16 });
  }

  reloadDone() {
    this.tone(560, 0.05, { wave: 'square', gain: 0.08, to: 320 });
    this.noise(0.05, { freq: 2600, gain: 0.09, type: 'highpass', delay: 0.04 });
  }

  ricochet(gain = 1) {
    this.tone(1800 + Math.random() * 1400, 0.13, { wave: 'sine', gain: 0.05 * gain, to: 420 });
    this.noise(0.05, { freq: 3400, gain: 0.06 * gain, type: 'bandpass', q: 6 });
  }

  /** A bullet arriving. The headshot version is unmistakably worse. */
  flesh(headshot) {
    this.noise(headshot ? 0.16 : 0.09, {
      freq: headshot ? 340 : 520, to: 90, gain: headshot ? 0.24 : 0.15, type: 'lowpass', q: 1.4,
    });
    if (headshot) this.tone(120, 0.12, { wave: 'triangle', gain: 0.12, to: 55 });
  }

  swing() { this.noise(0.14, { freq: 700, to: 1900, gain: 0.09, type: 'bandpass', q: 1.4 }); }
  thump() { this.tone(150, 0.12, { wave: 'triangle', gain: 0.2, to: 60 }); this.noise(0.08, { freq: 400, gain: 0.14, type: 'lowpass' }); }
  targetPing() { this.tone(1320, 0.22, { wave: 'sine', gain: 0.12, to: 1980 }); }

  enemyAlert(gain = 1) {
    if (gain <= 0.02) return;
    this.tone(420, 0.1, { wave: 'square', gain: 0.07 * gain, to: 620 });
    this.tone(620, 0.09, { wave: 'square', gain: 0.06 * gain, to: 480, delay: 0.11 });
  }

  enemyDown(gain = 1) {
    if (gain <= 0.02) return;
    this.tone(240, 0.3, { wave: 'sawtooth', gain: 0.09 * gain, to: 70 });
    this.noise(0.24, { freq: 300, to: 80, gain: 0.12 * gain, type: 'lowpass', delay: 0.05 });
  }

  explosion(gain = 1) {
    if (gain <= 0.02) return;
    this.noise(0.9, { freq: 900, to: 45, gain: 0.5 * gain, type: 'lowpass', q: 1 });
    this.tone(64, 0.7, { wave: 'triangle', gain: 0.42 * gain, to: 24 });
    this.tone(120, 0.3, { wave: 'sawtooth', gain: 0.2 * gain, to: 40 });
    this.noise(1.5, { freq: 260, to: 70, gain: 0.16 * gain, type: 'lowpass', delay: 0.12 });
  }

  /** A vehicle catching light, looped by the caller every second or so. */
  fireCrackle(gain = 1) {
    if (gain <= 0.02) return;
    this.noise(0.5, { freq: 700 + Math.random() * 500, to: 260, gain: 0.06 * gain, type: 'bandpass', q: 0.8 });
  }

  cashRegister() {
    this.tone(880, 0.08, { wave: 'square', gain: 0.09, to: 1320 });
    this.tone(1320, 0.14, { wave: 'triangle', gain: 0.1, to: 1760, delay: 0.08 });
  }

  denied() {
    this.tone(220, 0.14, { wave: 'square', gain: 0.09, to: 140 });
    this.tone(160, 0.18, { wave: 'square', gain: 0.08, to: 100, delay: 0.13 });
  }

  // --------------------------------------------------------------- engine ---

  startEngine(profile) {
    if (!this.ready || this._engine) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    osc.type = profile.wave || 'sawtooth';
    sub.type = 'square';
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 3;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(filter); sub.connect(filter);
    filter.connect(gain); gain.connect(this.sfxBus);
    osc.start(); sub.start();
    this._engine = { osc, sub, filter, gain, profile };
  }

  updateEngine(rpm01, load) {
    const e = this._engine;
    if (!e) return;
    const now = this.ctx.currentTime;
    const base = e.profile.base || 45;
    const top = e.profile.top || 240;
    const f = base + (top - base) * rpm01;
    e.osc.frequency.setTargetAtTime(f, now, 0.06);
    e.sub.frequency.setTargetAtTime(f * 0.5, now, 0.08);
    e.filter.frequency.setTargetAtTime(320 + rpm01 * 2200, now, 0.08);
    e.gain.gain.setTargetAtTime(0.035 + load * 0.075, now, 0.1);
  }

  get engineRunning() { return !!this._engine; }

  stopEngine() {
    const e = this._engine;
    if (!e) return;
    const now = this.ctx.currentTime;
    e.gain.gain.setTargetAtTime(0.0001, now, 0.08);
    e.osc.stop(now + 0.5); e.sub.stop(now + 0.5);
    this._engine = null;
  }

  // ---------------------------------------------------------------- music ---

  /**
   * Tiny step sequencer. Each district gets a track whose harmony carries the
   * story: the slums are modal and hungry, the Heights are major but detuned,
   * the Vault has no key at all.
   */
  playTrack(track) {
    if (!this.ready) return;
    if (this._track && this._track.id === track.id) return;
    this.stopTrack();
    this._track = track;
    this._musicStep = 0;
    this._nextNoteTime = this.ctx.currentTime + 0.1;
    this._musicTimer = setInterval(() => this._scheduler(), 40);
  }

  stopTrack() {
    if (this._musicTimer) clearInterval(this._musicTimer);
    this._musicTimer = null;
    this._track = null;
  }

  setMusicVolume(v) {
    this.musicVol = v;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  setMasterVolume(v) {
    this.masterVol = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  duckMusic(amount, seconds) {
    if (!this.musicBus) return;
    const now = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setTargetAtTime(this.musicVol * amount, now, 0.08);
    this.musicBus.gain.setTargetAtTime(this.musicVol, now + seconds, 0.5);
  }

  _scheduler() {
    const t = this._track;
    if (!t) return;
    const step = 60 / t.bpm / 2; // eighth notes
    while (this._nextNoteTime < this.ctx.currentTime + 0.2) {
      this._emitStep(t, this._musicStep, this._nextNoteTime);
      this._musicStep++;
      this._nextNoteTime += step;
    }
  }

  _emitStep(t, step, when) {
    const spb = 60 / t.bpm / 2;
    const bar = Math.floor(step / 16) % t.chords.length;
    const s = step % 16;
    const root = t.chords[bar];

    if (t.bass && t.bass[s]) {
      this._note(root / 2, when, spb * 1.6, t.bassWave || 'sawtooth', 0.16, 240);
    }
    if (t.arp && t.arp[s] !== null && t.arp[s] !== undefined) {
      this._note(root * Math.pow(2, t.arp[s] / 12), when, spb * 0.85,
        t.arpWave || 'square', 0.055, 3000, t.detune || 0);
    }
    if (s === 0 && t.pad) {
      for (const iv of t.pad) {
        this._note(root * Math.pow(2, iv / 12) / 2, when, spb * 14, 'triangle', 0.032, 1200, t.detune || 0);
      }
    }
    if (t.kick && t.kick[s]) this._perc(when, 'kick');
    if (t.hat && t.hat[s]) this._perc(when, 'hat');
    if (t.snare && t.snare[s]) this._perc(when, 'snare');
  }

  _note(freq, when, dur, wave, gain, cutoff, detune = 0) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    o.type = wave;
    o.frequency.value = freq;
    o.detune.value = detune;
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(f); f.connect(g); g.connect(this.musicBus);
    o.start(when); o.stop(when + dur + 0.05);
  }

  _perc(when, kind) {
    if (kind === 'kick') {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, when);
      o.frequency.exponentialRampToValueAtTime(42, when + 0.12);
      g.gain.setValueAtTime(0.26, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
      o.connect(g); g.connect(this.musicBus);
      o.start(when); o.stop(when + 0.2);
      return;
    }
    const sr = this.ctx.sampleRate;
    const dur = kind === 'snare' ? 0.13 : 0.035;
    const len = Math.floor(sr * dur);
    const b = this.ctx.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    const f = this.ctx.createBiquadFilter();
    f.type = kind === 'snare' ? 'bandpass' : 'highpass';
    f.frequency.value = kind === 'snare' ? 1800 : 7000;
    const g = this.ctx.createGain();
    g.gain.value = kind === 'snare' ? 0.1 : 0.05;
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start(when);
  }
}

const NOTES = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

/** Note name to frequency, e.g. hz('A', 3). */
export function hz(name, octave) {
  return 440 * Math.pow(2, (NOTES[name] + (octave - 4) * 12 - 9) / 12);
}

export const audio = new Audio();
