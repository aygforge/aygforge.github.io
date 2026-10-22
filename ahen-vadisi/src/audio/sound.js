// Procedural ses: WebAudio ile sentezlenen efektler, bölge ortam sesleri ve hafif müzik döngüleri.
// Telifsiz — hiçbir ses dosyası kullanılmaz. Sessize alınabilir.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.vol = { sfx: 0.8, music: 0.45, ambient: 0.5 };
    this.musicOn = true;
    this.theme = null;
    this.timers = [];
    this.lastPlay = {};
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain(); this.musicBus.connect(this.master);
    this.ambBus = this.ctx.createGain(); this.ambBus.connect(this.master);
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applySettings();
    if (this.pendingTheme) this.setTheme(this.pendingTheme);
  }

  applySettings(s) {
    if (s) {
      this.enabled = s.sound; this.musicOn = s.music;
      this.vol = { sfx: s.sfxVol, music: s.musicVol, ambient: s.ambientVol };
    }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.vol.sfx, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.musicOn ? this.vol.music * 0.5 : 0, t, 0.1);
    this.ambBus.gain.setTargetAtTime(this.vol.ambient * 0.6, t, 0.1);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  // ----------------------------------------------------------- yapı taşları
  tone({ f = 440, f2 = null, type = 'sine', dur = 0.15, vol = 0.3, at = 0, attack = 0.005, bus = this.sfxBus }) {
    const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noiseBurst({ dur = 0.1, vol = 0.3, filter = 'bandpass', f = 1200, f2 = null, q = 1, at = 0, bus = this.sfxBus }) {
    const c = this.ctx, t = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = this.noise;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const fl = c.createBiquadFilter(); fl.type = filter; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(bus);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }

  // ----------------------------------------------------------- efektler
  play(name, opts = {}) {
    if (!this.ctx || !this.enabled) return;
    const now = performance.now();
    const minGap = { hit: 40, swing: 50, step: 120, coin: 60, drop_n: 60 }[name] || 25;
    if (now - (this.lastPlay[name] || 0) < minGap) return;
    this.lastPlay[name] = now;
    const v = opts.vol ?? 1;
    switch (name) {
      case 'swing': this.noiseBurst({ dur: 0.12, vol: 0.18 * v, f: 900, f2: 2600, q: 1.2 }); break;
      case 'hit': this.noiseBurst({ dur: 0.08, vol: 0.3 * v, filter: 'lowpass', f: 1800 }); this.tone({ f: 140, f2: 60, type: 'triangle', dur: 0.1, vol: 0.25 * v }); break;
      case 'crit': this.play('hit', { vol: 1.2 }); this.tone({ f: 1200, f2: 1800, type: 'square', dur: 0.12, vol: 0.08, at: 0.02 }); break;
      case 'miss': this.noiseBurst({ dur: 0.1, vol: 0.08, f: 3000 }); break;
      case 'bolt': this.tone({ f: 600, f2: 1200, type: 'triangle', dur: 0.15, vol: 0.12 }); this.noiseBurst({ dur: 0.12, vol: 0.08, f: 3000, f2: 1500 }); break;
      case 'fire': this.noiseBurst({ dur: 0.35, vol: 0.25, filter: 'lowpass', f: 800, f2: 3000 }); this.tone({ f: 220, f2: 110, type: 'sawtooth', dur: 0.25, vol: 0.06 }); break;
      case 'ice': for (let i = 0; i < 4; i++) this.tone({ f: 1800 + i * 300, f2: 2600 + i * 200, type: 'sine', dur: 0.18, vol: 0.06, at: i * 0.04 }); this.noiseBurst({ dur: 0.25, vol: 0.12, f: 5000, filter: 'highpass' }); break;
      case 'explosion': this.noiseBurst({ dur: 0.7, vol: 0.45, filter: 'lowpass', f: 1500, f2: 120 }); this.tone({ f: 90, f2: 35, type: 'sine', dur: 0.6, vol: 0.4 }); break;
      case 'buff': [0, 4, 7, 12].forEach((s, i) => this.tone({ f: 330 * 2 ** (s / 12), type: 'triangle', dur: 0.25, vol: 0.08, at: i * 0.05 })); break;
      case 'shield': this.tone({ f: 300, f2: 600, type: 'sine', dur: 0.4, vol: 0.15 }); this.tone({ f: 450, f2: 900, type: 'sine', dur: 0.4, vol: 0.08 }); break;
      case 'hurt': this.tone({ f: 200, f2: 90, type: 'square', dur: 0.12, vol: 0.12 }); break;
      case 'enemy_die': this.tone({ f: 260, f2: 70, type: 'triangle', dur: 0.3, vol: 0.12 }); this.noiseBurst({ dur: 0.2, vol: 0.08, filter: 'lowpass', f: 600 }); break;
      case 'death': [0, -3, -7, -12].forEach((s, i) => this.tone({ f: 330 * 2 ** (s / 12), type: 'triangle', dur: 0.4, vol: 0.15, at: i * 0.18 })); break;
      case 'coin': this.tone({ f: 1320, type: 'square', dur: 0.06, vol: 0.05 }); this.tone({ f: 1760, type: 'square', dur: 0.1, vol: 0.05, at: 0.05 }); break;
      case 'drop_n': this.tone({ f: 700, f2: 500, type: 'triangle', dur: 0.08, vol: 0.08 }); break;
      case 'drop_r': [0, 7, 12].forEach((s, i) => this.tone({ f: 880 * 2 ** (s / 12), type: 'sine', dur: 0.35, vol: 0.12, at: i * 0.07 })); break;
      case 'drop_e': [0, 4, 7, 11, 14].forEach((s, i) => this.tone({ f: 660 * 2 ** (s / 12), type: 'triangle', dur: 0.5, vol: 0.12, at: i * 0.08 })); this.noiseBurst({ dur: 0.6, vol: 0.05, f: 6000, filter: 'highpass', at: 0.1 }); break;
      case 'drop_l': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone({ f: 392 * 2 ** (s / 12), type: i % 2 ? 'square' : 'triangle', dur: 0.7, vol: 0.1, at: i * 0.09 })); this.tone({ f: 98, type: 'sine', dur: 1.5, vol: 0.25, at: 0.0 }); break;
      case 'levelup': [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => this.tone({ f: 440 * 2 ** (s / 12), type: 'triangle', dur: 0.3, vol: 0.13, at: i * 0.08 })); break;
      case 'quest': [0, 5, 9, 12].forEach((s, i) => this.tone({ f: 523 * 2 ** (s / 12), type: 'square', dur: 0.25, vol: 0.06, at: i * 0.1 })); this.tone({ f: 1046, type: 'triangle', dur: 0.6, vol: 0.1, at: 0.4 }); break;
      case 'anvil': this.tone({ f: 1400, f2: 1300, type: 'square', dur: 0.08, vol: 0.08 }); this.tone({ f: 2900, type: 'sine', dur: 0.5, vol: 0.07 }); this.noiseBurst({ dur: 0.06, vol: 0.2, f: 4000 }); break;
      case 'up_ok': this.play('anvil'); [0, 4, 7, 12].forEach((s, i) => this.tone({ f: 784 * 2 ** (s / 12), type: 'triangle', dur: 0.3, vol: 0.1, at: 0.25 + i * 0.07 })); break;
      case 'up_fail': this.play('anvil'); [0, -1, -5].forEach((s, i) => this.tone({ f: 330 * 2 ** (s / 12), type: 'sawtooth', dur: 0.3, vol: 0.06, at: 0.25 + i * 0.14 })); break;
      case 'click': this.tone({ f: 900, type: 'triangle', dur: 0.04, vol: 0.06 }); break;
      case 'error': this.tone({ f: 180, type: 'square', dur: 0.12, vol: 0.07 }); this.tone({ f: 150, type: 'square', dur: 0.15, vol: 0.07, at: 0.1 }); break;
      case 'potion': for (let i = 0; i < 4; i++) this.tone({ f: 400 + Math.random() * 600, f2: 900, type: 'sine', dur: 0.06, vol: 0.08, at: i * 0.05 }); break;
      case 'warn': this.tone({ f: 220, f2: 330, type: 'sawtooth', dur: 0.35, vol: 0.08 }); this.tone({ f: 165, type: 'square', dur: 0.4, vol: 0.05 }); break;
      case 'roar': this.noiseBurst({ dur: 0.9, vol: 0.35, filter: 'lowpass', f: 500, f2: 200, q: 3 }); this.tone({ f: 110, f2: 70, type: 'sawtooth', dur: 0.9, vol: 0.15 }); break;
      case 'howl': this.tone({ f: 400, f2: 700, type: 'sine', dur: 0.5, vol: 0.12 }); this.tone({ f: 700, f2: 380, type: 'sine', dur: 0.8, vol: 0.12, at: 0.5 }); break;
      case 'slam': this.noiseBurst({ dur: 0.4, vol: 0.4, filter: 'lowpass', f: 400 }); this.tone({ f: 70, f2: 30, type: 'sine', dur: 0.5, vol: 0.45 }); break;
      case 'gather': this.noiseBurst({ dur: 0.15, vol: 0.12, f: 2500 }); this.noiseBurst({ dur: 0.12, vol: 0.1, f: 1800, at: 0.12 }); break;
      case 'mine': this.tone({ f: 2200, type: 'square', dur: 0.05, vol: 0.06 }); this.noiseBurst({ dur: 0.08, vol: 0.15, f: 3000 }); break;
      case 'portal': this.noiseBurst({ dur: 0.6, vol: 0.15, f: 400, f2: 3000 }); this.tone({ f: 220, f2: 880, type: 'sine', dur: 0.6, vol: 0.08 }); break;
      case 'altar': [0, 3, 7, 10].forEach((s, i) => this.tone({ f: 293 * 2 ** (s / 12), type: 'sine', dur: 0.6, vol: 0.1, at: i * 0.12 })); break;
      case 'victory': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone({ f: 262 * 2 ** (s / 12), type: 'square', dur: 0.4, vol: 0.07, at: i * 0.12 })); this.tone({ f: 523, type: 'triangle', dur: 1.5, vol: 0.12, at: 0.9 }); break;
      default: break;
    }
  }

  // ----------------------------------------------------------- tema: müzik + ortam
  setTheme(theme) {
    if (!this.ctx) { this.pendingTheme = theme; return; }
    if (this.theme === theme) return;
    this.theme = theme;
    this.timers.forEach(clearInterval);
    this.timers = [];
    if (this.ambSrc) { try { this.ambSrc.stop(); } catch { /* */ } this.ambSrc = null; }
    if (!theme) return;
    // ortam gürültüsü (rüzgâr / mağara uğultusu)
    const amb = { village: [600, 0.05], forest: [900, 0.07], mine: [250, 0.09], swamp: [400, 0.08], dungeon: [180, 0.1], menu: [500, 0.04],
      ash: [320, 0.08], frost: [1400, 0.07], temple: [700, 0.07], dead: [450, 0.07], throne: [260, 0.09], crypt: [200, 0.1] }[theme] || [500, 0.05];
    const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const fl = this.ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = amb[0];
    const g = this.ctx.createGain(); g.gain.value = amb[1];
    s.connect(fl); fl.connect(g); g.connect(this.ambBus); s.start();
    this.ambSrc = s;
    // rastgele ortam olayları
    const ev = () => {
      if (!this.enabled) return;
      const r = Math.random();
      if ((theme === 'forest' || theme === 'village' || theme === 'menu') && r < 0.5) {
        const base = 2000 + Math.random() * 1500;
        for (let i = 0; i < 3; i++) this.tone({ f: base, f2: base * 1.3, type: 'sine', dur: 0.07, vol: 0.03, at: i * 0.1, bus: this.ambBus });
      } else if ((theme === 'mine' || theme === 'dungeon') && r < 0.45) {
        this.tone({ f: 1400 + Math.random() * 900, f2: 700, type: 'sine', dur: 0.12, vol: 0.05, bus: this.ambBus });
      } else if (theme === 'ash' && r < 0.5) {
        // kor çıtırtısı
        for (let i = 0; i < 3; i++) this.tone({ f: 2400 + Math.random() * 1800, f2: 900, type: 'square', dur: 0.02, vol: 0.025, at: i * 0.05 + Math.random() * 0.05, bus: this.ambBus });
      } else if ((theme === 'frost' || theme === 'temple') && r < 0.45) {
        // buz çınlaması / rüzgâr ıslığı
        if (Math.random() < 0.6) this.tone({ f: 2600 + Math.random() * 1200, f2: 2200, type: 'sine', dur: 0.25, vol: 0.03, bus: this.ambBus });
        else this.tone({ f: 500, f2: 900, type: 'sine', dur: 1.2, vol: 0.02, attack: 0.5, bus: this.ambBus });
      } else if (theme === 'dead' && r < 0.45) {
        // uzak çan / kuru dal çıtırtısı
        if (Math.random() < 0.5) this.tone({ f: 330, f2: 326, type: 'sine', dur: 2.2, vol: 0.025, attack: 0.02, bus: this.ambBus });
        else for (let i = 0; i < 2; i++) this.tone({ f: 900 + Math.random() * 500, f2: 400, type: 'square', dur: 0.03, vol: 0.02, at: i * 0.09, bus: this.ambBus });
      } else if ((theme === 'throne' || theme === 'crypt') && r < 0.45) {
        // derin uğultu / fısıltı
        if (Math.random() < 0.55) this.tone({ f: 70, f2: 60, type: 'sawtooth', dur: 1.6, vol: 0.025, attack: 0.6, bus: this.ambBus });
        else this.tone({ f: 1800 + Math.random() * 600, f2: 1200, type: 'sine', dur: 0.4, vol: 0.02, attack: 0.15, bus: this.ambBus });
      } else if (theme === 'swamp' && r < 0.55) {
        if (Math.random() < 0.5) this.tone({ f: 120 + Math.random() * 40, f2: 90, type: 'square', dur: 0.15, vol: 0.03, bus: this.ambBus });
        else this.tone({ f: 300, f2: 700, type: 'sine', dur: 0.05, vol: 0.04, bus: this.ambBus });
      }
    };
    this.timers.push(setInterval(ev, 1700));
    // müzik: pentatonik arpej + bas
    const scales = {
      village: [0, 2, 4, 7, 9], forest: [0, 2, 3, 7, 9], mine: [0, 3, 5, 7, 10], swamp: [0, 1, 5, 7, 8],
      dungeon: [0, 1, 3, 6, 7], menu: [0, 2, 4, 7, 9], field: [0, 2, 3, 7, 9], cave: [0, 3, 5, 7, 10],
      ash: [0, 1, 4, 5, 7], frost: [0, 2, 5, 7, 9], temple: [0, 2, 3, 6, 9],
      dead: [0, 2, 3, 7, 8], throne: [0, 1, 3, 6, 8], crypt: [0, 1, 3, 5, 6],
    };
    const scale = scales[theme] || scales.village;
    const root = { village: 220, forest: 196, mine: 174.6, swamp: 164.8, dungeon: 146.8, menu: 220, ash: 155.6, frost: 261.6, temple: 130.8, dead: 146.8, throne: 123.5, crypt: 110 }[theme] || 196;
    let step = 0;
    const beat = theme === 'dungeon' || theme === 'temple' || theme === 'crypt' ? 520 : theme === 'frost' || theme === 'dead' ? 480 : theme === 'throne' ? 500 : 420;
    const tick = () => {
      if (!this.musicOn || !this.enabled) { step++; return; }
      const bar = Math.floor(step / 8) % 4;
      const chordRoot = [0, 5, 3, 4][bar];
      if (step % 8 === 0) this.tone({ f: root / 2 * 2 ** (scale[chordRoot % 5] / 12), type: 'triangle', dur: 2.8, vol: 0.09, attack: 0.3, bus: this.musicBus });
      if (Math.random() < 0.62) {
        const deg = scale[Math.floor(Math.random() * scale.length)] + (Math.random() < 0.3 ? 12 : 0);
        this.tone({ f: root * 2 ** (deg / 12), type: 'sine', dur: 0.6, vol: 0.05, attack: 0.02, bus: this.musicBus });
      }
      step++;
    };
    this.timers.push(setInterval(tick, beat));
  }
}

export const sound = new SoundManager();
