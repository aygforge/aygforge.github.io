/*
 * Mahjong: Zen Journey — AudioManager.
 * All sound is synthesised with WebAudio (no audio files): tile clicks,
 * chimes, a gong for new worlds and a generative pentatonic ambient score.
 * The context is only created/resumed from a user gesture.
 */
(function (root) {
  'use strict';

  const SCALES = [
    [0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 2, 5, 7, 9], [0, 2, 4, 7, 11], [0, 3, 5, 8, 10], [0, 2, 3, 7, 9]
  ];
  const ROOTS = [57, 55, 53, 60, 58, 62]; // MIDI roots per world key

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  class AudioManager {
    constructor() {
      this.ctx = null;
      this.settings = { music: true, sfx: true, volume: 0.6 };
      this.worldKey = 0;
      this.musicTimer = null;
      this.suspendedByVisibility = false;
      this.nextNoteAt = 0;
    }
    applySettings(s) {
      this.settings = { music: s.music, sfx: s.sfx, volume: s.volume };
      if (this.ctx) {
        this.master.gain.setTargetAtTime(this.settings.volume * 0.9, this.ctx.currentTime, 0.05);
        this.musicBus.gain.setTargetAtTime(this.settings.music ? 0.5 : 0, this.ctx.currentTime, 0.3);
        this.sfxBus.gain.setTargetAtTime(this.settings.sfx ? 1 : 0, this.ctx.currentTime, 0.02);
      }
      this._updateMusic();
    }
    // Must be called from a user gesture (pointerdown/click/keydown).
    unlock() {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) {
        try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
        const c = this.ctx;
        this.master = c.createGain();
        this.comp = c.createDynamicsCompressor();
        this.comp.threshold.value = -18; this.comp.ratio.value = 4;
        this.master.connect(this.comp); this.comp.connect(c.destination);
        this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
        this.musicBus = c.createGain(); this.musicBus.gain.value = 0;
        // gentle echo for the ambient score
        this.delay = c.createDelay(2); this.delay.delayTime.value = 0.46;
        this.fb = c.createGain(); this.fb.gain.value = 0.38;
        this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 2200;
        this.musicBus.connect(this.master);
        this.musicBus.connect(this.delay); this.delay.connect(this.lp); this.lp.connect(this.fb); this.fb.connect(this.delay); this.lp.connect(this.master);
        this.noiseBuf = this._noise();
        this.applySettings(this.settings);
      }
      if (this.ctx.state === 'suspended' && !this.suspendedByVisibility) this.ctx.resume().catch(() => {});
      this._updateMusic();
    }
    setVisible(visible) {
      if (!this.ctx) return;
      this.suspendedByVisibility = !visible;
      if (visible) this.ctx.resume().catch(() => {}); else this.ctx.suspend().catch(() => {});
      this._updateMusic();
    }
    setWorld(w) { this.worldKey = w % SCALES.length; this._restartPad(); }

    _noise() {
      const c = this.ctx, len = c.sampleRate * 1;
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }
    _ok() { return this.ctx && this.ctx.state === 'running' && this.settings.sfx && this.settings.volume > 0; }
    _tone(freq, t, dur, opts) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = (opts && opts.type) || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opts && opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
      const peak = (opts && opts.gain) || 0.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + ((opts && opts.attack) || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect((opts && opts.bus) || this.sfxBus);
      o.start(t); o.stop(t + dur + 0.05);
    }
    _noiseHit(t, dur, freq, q, gain) {
      const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noiseBuf;
      f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.sfxBus);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
    _bell(freq, t, dur, gain, bus) {
      this._tone(freq, t, dur, { gain, bus });
      this._tone(freq * 2.01, t, dur * 0.6, { gain: gain * 0.35, bus });
      this._tone(freq * 3.02, t, dur * 0.3, { gain: gain * 0.12, bus, type: 'triangle' });
    }

    play(name) {
      if (!this._ok()) return;
      const t = this.ctx.currentTime + 0.005;
      const scale = SCALES[this.worldKey], rootN = ROOTS[this.worldKey];
      const note = (i) => mtof(rootN + 12 + scale[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5));
      switch (name) {
        case 'select':
          this._noiseHit(t, 0.05, 2400, 1.4, 0.22);
          this._tone(820, t, 0.07, { gain: 0.08, to: 640, type: 'triangle' });
          break;
        case 'deselect':
          this._noiseHit(t, 0.04, 1600, 1.2, 0.12);
          break;
        case 'match': {
          const i = Math.floor(Math.random() * 3);
          this._noiseHit(t, 0.06, 2800, 1.6, 0.2);
          this._bell(note(i + 2), t + 0.02, 0.9, 0.12);
          this._bell(note(i + 4), t + 0.11, 1.1, 0.1);
          break;
        }
        case 'mismatch':
          this._tone(190, t, 0.16, { gain: 0.12, to: 130 });
          this._noiseHit(t, 0.05, 700, 1, 0.1);
          break;
        case 'blocked':
          this._tone(240, t, 0.08, { gain: 0.06, to: 200, type: 'triangle' });
          break;
        case 'hint':
          [5, 7, 9].forEach((k, j) => this._bell(note(k), t + j * 0.08, 0.5, 0.07));
          break;
        case 'shuffle':
          for (let k = 0; k < 6; k++) this._noiseHit(t + k * 0.045, 0.05, 1800 + k * 300, 1.5, 0.12);
          break;
        case 'undo':
          this._tone(660, t, 0.12, { gain: 0.07, to: 440 });
          break;
        case 'button':
          this._tone(1200, t, 0.04, { gain: 0.05, type: 'triangle' });
          break;
        case 'star':
          this._bell(note(7), t, 0.8, 0.12);
          break;
        case 'win':
          [0, 2, 4, 5, 7, 9].forEach((k, j) => this._bell(note(k), t + j * 0.11, 1.4, 0.1));
          this._tone(mtof(rootN), t, 2.4, { gain: 0.08, attack: 0.3 });
          this._tone(mtof(rootN + 7), t, 2.4, { gain: 0.05, attack: 0.3 });
          break;
        case 'world':
          this._tone(98, t, 3.2, { gain: 0.28 });
          this._tone(98 * 2.76, t, 2.2, { gain: 0.08 });
          this._tone(98 * 5.4, t, 1.2, { gain: 0.04 });
          this._noiseHit(t, 0.3, 400, 0.6, 0.12);
          [0, 2, 4, 7].forEach((k, j) => this._bell(note(k), t + 0.6 + j * 0.18, 1.6, 0.07));
          break;
        case 'achievement':
          [4, 7, 9].forEach((k, j) => this._bell(note(k), t + j * 0.09, 1, 0.09));
          break;
      }
    }

    // ---- ambient score
    _updateMusic() {
      const want = this.ctx && this.settings.music && !this.suspendedByVisibility && this.ctx.state !== 'closed';
      if (want && !this.musicTimer) {
        this.nextNoteAt = this.ctx.currentTime + 0.5;
        this.musicTimer = setInterval(() => this._schedule(), 250);
        this._restartPad();
      } else if (!want && this.musicTimer) {
        clearInterval(this.musicTimer); this.musicTimer = null;
        this._stopPad();
      }
    }
    _stopPad() {
      if (this.pad) {
        const t = this.ctx.currentTime;
        for (const p of this.pad) { p.g.gain.setTargetAtTime(0.0001, t, 0.8); p.o.stop(t + 4); }
        this.pad = null;
      }
    }
    _restartPad() {
      if (!this.ctx || !this.musicTimer) return;
      this._stopPad();
      const c = this.ctx, t = c.currentTime;
      const rootN = ROOTS[this.worldKey] - 12;
      this.pad = [0, 7, 12].map((iv, k) => {
        const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
        o.type = 'sine'; o.frequency.value = mtof(rootN + iv) * (k === 2 ? 1.003 : 1);
        lfo.frequency.value = 0.05 + k * 0.03; lg.gain.value = 0.012;
        lfo.connect(lg); lg.connect(g.gain);
        g.gain.setValueAtTime(0.0001, t); g.gain.setTargetAtTime(0.028 - k * 0.006, t, 2.5);
        o.connect(g); g.connect(this.musicBus);
        o.start(t); lfo.start(t);
        return { o, g, lfo };
      });
    }
    _schedule() {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const c = this.ctx;
      while (this.nextNoteAt < c.currentTime + 0.6) {
        const t = this.nextNoteAt;
        const scale = SCALES[this.worldKey], rootN = ROOTS[this.worldKey];
        const deg = Math.floor(Math.random() * 8);
        const m = rootN + scale[deg % 5] + 12 * Math.floor(deg / 5);
        if (Math.random() < 0.82) {
          this._bell(mtof(m), t, 2.6, 0.05 + Math.random() * 0.03, this.musicBus);
          if (Math.random() < 0.3) this._bell(mtof(m + 12), t + 0.35, 2, 0.025, this.musicBus);
        }
        this.nextNoteAt += 1.2 + Math.random() * 2.2;
      }
    }
  }

  root.MJAudio = { AudioManager };
}(typeof globalThis !== 'undefined' ? globalThis : this));
