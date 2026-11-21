// AudioService — kısa özgün sesler; aynı anda aşırı gürültüyü engelleyen tekrar/eşzamanlılık limiti.
export const SFX = ['click', 'swing', 'drop', 'catch', 'shoot', 'hit', 'sizzle', 'hurt', 'shield', 'warn', 'coin', 'skill', 'victory', 'defeat'];

const MIN_GAP = { shoot: 55, hit: 45, sizzle: 90, click: 30, coin: 60 };
const MAX_CONCURRENT = 6;

export class AudioService {
  constructor() {
    this.game = null;
    this.settings = { sound: true, volume: 0.8, music: true };
    this.last = {};
    this.active = 0;
    this.music = null;
  }
  attach(game, settings) {
    this.game = game;
    this.apply(settings);
  }
  apply(settings) {
    this.settings = { ...this.settings, ...settings };
    if (!this.game) return;
    this.game.sound.mute = !this.settings.sound;
    this.game.sound.volume = this.settings.volume;
    this.updateMusic();
  }
  play(key, opts = {}) {
    if (!this.game || !this.settings.sound) return;
    const now = performance.now();
    const gap = MIN_GAP[key] ?? 20;
    if (this.last[key] && now - this.last[key] < gap) return;
    if (this.active >= MAX_CONCURRENT) return;
    this.last[key] = now;
    try {
      const s = this.game.sound.add(key, { volume: opts.volume ?? 0.7, detune: opts.detune ?? 0 });
      this.active++;
      s.once('complete', () => {
        this.active--;
        s.destroy();
      });
      s.play();
    } catch {
      /* audio is optional */
    }
  }
  updateMusic() {
    if (!this.game) return;
    const want = this.settings.sound && this.settings.music;
    if (want && !this.music && this.game.sound.locked) {
      // mobile: no audio before the first user interaction
      if (!this._waitUnlock) {
        this._waitUnlock = true;
        this.game.sound.once('unlocked', () => {
          this._waitUnlock = false;
          this.updateMusic();
        });
      }
      return;
    }
    if (want && !this.music) {
      try {
        this.music = this.game.sound.add('music', { loop: true, volume: 0.35 });
        this.music.play();
      } catch {
        this.music = null;
      }
    } else if (!want && this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
    }
  }
}

export const audio = new AudioService();
