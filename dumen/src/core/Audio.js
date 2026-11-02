// WebAudio: ilk kullanıcı etkileşiminde açılır (autoplay yok). Tüm sesler prosedüreldir (harici dosya yok).
(function (D) {
  'use strict';
  let ctx = null, master = null, musicGain = null, sfxGain = null, musicTimer = null, musicKey = null, step = 0, nextT = 0;
  const S = () => D.Game.settings || {};
  const Audio = {
    unlocked: false,
    unlock() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.connect(master); sfxGain = ctx.createGain(); sfxGain.connect(master);
      Audio.unlocked = true; Audio.applySettings();
      if (musicKey) Audio.music(musicKey, true);
    },
    applySettings() { if (!ctx) return; const s = S(); master.gain.value = s.mute ? 0 : 1; musicGain.gain.value = (s.music != null ? s.music : 0.6) * 0.16; sfxGain.gain.value = (s.sfx != null ? s.sfx : 0.8) * 0.5; },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    tone(freq, dur, type, vol, when, slideTo, dest) {
      if (!ctx) return;
      const t0 = (when || ctx.currentTime);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(dest || sfxGain); o.start(t0); o.stop(t0 + dur + 0.05);
    },
    noise(dur, vol, filterFreq, when) {
      if (!ctx) return;
      const t0 = when || ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq || 1200;
      const g = ctx.createGain(); g.gain.value = vol || 0.3;
      src.connect(f); f.connect(g); g.connect(sfxGain); src.start(t0);
    },
    sfx(name) {
      if (!ctx || S().mute) return;
      const t = ctx.currentTime;
      switch (name) {
        case 'click': Audio.tone(660, 0.06, 'triangle', 0.18); break;
        case 'cast': Audio.noise(0.35, 0.25, 2400); Audio.tone(500, 0.3, 'sine', 0.12, t, 1200); break;
        case 'splash': Audio.noise(0.4, 0.35, 900); break;
        case 'bite': Audio.tone(880, 0.08, 'square', 0.15); Audio.tone(1320, 0.1, 'square', 0.12, t + 0.09); break;
        case 'reel': Audio.tone(1800 + Math.random() * 200, 0.025, 'square', 0.04); break;
        case 'alarm': Audio.tone(1000, 0.12, 'sawtooth', 0.12); break;
        case 'snap': Audio.noise(0.2, 0.5, 4000); Audio.tone(300, 0.4, 'sawtooth', 0.2, t, 60); break;
        case 'catch': [523, 659, 784, 1046].forEach((f, i) => Audio.tone(f, 0.25, 'triangle', 0.22, t + i * 0.09)); break;
        case 'legendary': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => Audio.tone(f, 0.4, 'triangle', 0.22, t + i * 0.11)); break;
        case 'fail': [440, 370, 311].forEach((f, i) => Audio.tone(f, 0.25, 'sine', 0.2, t + i * 0.13)); break;
        case 'tick': Audio.tone(1500, 0.03, 'square', 0.08); break;
        case 'chest': [330, 440, 660].forEach((f, i) => Audio.tone(f, 0.2, 'square', 0.12, t + i * 0.07)); Audio.noise(0.2, 0.15, 3000, t + 0.2); break;
        case 'coin': Audio.tone(1318, 0.08, 'square', 0.12); Audio.tone(1760, 0.18, 'square', 0.1, t + 0.07); break;
        case 'quest': [784, 988, 1175, 1568].forEach((f, i) => Audio.tone(f, 0.18, 'triangle', 0.16, t + i * 0.08)); break;
        case 'craft': Audio.noise(0.08, 0.4, 5000); Audio.tone(220, 0.15, 'square', 0.2); Audio.noise(0.08, 0.4, 5000, t + 0.18); break;
        case 'upgrade': [262, 330, 392, 523, 659].forEach((f, i) => Audio.tone(f, 0.3, 'sawtooth', 0.1, t + i * 0.08)); break;
        case 'dialog': Audio.tone(520 + Math.random() * 120, 0.05, 'triangle', 0.1); break;
        case 'wheel': Audio.tone(1200, 0.02, 'square', 0.06); break;
        case 'error': Audio.tone(200, 0.2, 'square', 0.15); break;
        case 'gull': Audio.tone(1400, 0.15, 'sawtooth', 0.08, t, 900); Audio.tone(1500, 0.15, 'sawtooth', 0.08, t + 0.18, 1000); break;
        default: break;
      }
    },
    // Basit prosedürel müzik: bölge ölçeği + tempo + dalga biçimi
    music(key, force) {
      if (musicKey === key && !force && musicTimer) return;
      musicKey = key;
      if (!ctx) return;
      if (musicTimer) clearInterval(musicTimer);
      const cfg = key === 'town' ? { scale: [0, 2, 4, 5, 7, 9], root: 60, tempo: 100, wave: 'triangle' } : key === 'menu' ? { scale: [0, 2, 4, 7, 9], root: 57, tempo: 84, wave: 'sine' } : key === 'shop' ? { scale: [0, 2, 4, 5, 7, 9, 11], root: 62, tempo: 110, wave: 'triangle' } : (D.RegionDB[key] ? D.RegionDB[key].music : null);
      if (!cfg) return;
      const beat = 60 / cfg.tempo / 2; step = 0; nextT = ctx.currentTime + 0.1;
      const rng = new D.RNG(D.RNG.hashStr(key));
      const melody = Array.from({ length: 32 }, () => (rng.chance(0.72) ? rng.pick(cfg.scale) + (rng.chance(0.3) ? 12 : 0) : null));
      const bass = [0, 0, cfg.scale[3] || 5, cfg.scale[2] || 4];
      const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
      musicTimer = setInterval(() => {
        if (!ctx || ctx.state !== 'running') return;
        while (nextT < ctx.currentTime + 0.25) {
          const n = melody[step % 32];
          if (n != null) Audio.tone(mtof(cfg.root + n), beat * 1.6, cfg.wave, 0.22, nextT, null, musicGain);
          if (step % 4 === 0) Audio.tone(mtof(cfg.root - 24 + bass[(step / 4) % 4]), beat * 3.5, 'sine', 0.3, nextT, null, musicGain);
          nextT += beat; step++;
        }
      }, 90);
    },
    vibrate(ms) { try { if (S().haptics && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* yok */ } }
  };
  D.Audio = Audio;
})(globalThis.DUMEN);
