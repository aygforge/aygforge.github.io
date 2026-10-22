// Görsel geri bildirim: hasar sayıları, efekt sprite'ları, telegraflar, ekran sarsıntısı.
import Phaser from 'phaser';
import { app } from '../core/app.js';
import { TG_SQUASH } from '../data/constants.js';

const DEPTH_FX = 60000;
const DEPTH_TEXT = 70000;

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.textPool = [];
  }

  text(x, y, str, { color = '#ffffff', size = 14, stroke = '#1a0e14', dur = 800, rise = 28, bold = true, scale = 1 } = {}) {
    if (!app.settings.damageNumbers && /^[0-9-+]/.test(str)) { /* sayı gizli */ return; }
    let t = this.textPool.pop();
    if (!t) {
      t = this.scene.add.text(0, 0, '', { fontFamily: 'Trebuchet MS, Verdana, sans-serif', fontStyle: 'bold', fontSize: '14px', color: '#fff', stroke: '#000', strokeThickness: 4 });
      t.setOrigin(0.5, 1).setDepth(DEPTH_TEXT);
    }
    t.setText(str).setColor(color).setStroke(stroke, 4).setFontSize(size).setFontStyle(bold ? 'bold' : 'normal');
    t.setPosition(x + (Math.random() - 0.5) * 10, y).setAlpha(1).setScale(scale * 0.7).setVisible(true).setActive(true);
    this.scene.tweens.add({ targets: t, scale, duration: 90, ease: 'Back.out' });
    this.scene.tweens.add({
      targets: t, y: y - rise, alpha: 0, delay: dur * 0.4, duration: dur * 0.6, ease: 'Cubic.in',
      onComplete: () => { t.setVisible(false).setActive(false); this.textPool.push(t); },
    });
  }

  damage(x, y, dmg, { crit = false, toPlayer = false, miss = false, kind = '', small = false, evaded = false } = {}) {
    if (evaded) return this.text(x, y, 'Kaçındın', { color: '#9ae0ff', size: 12 });
    if (miss) return this.text(x, y, 'Iska', { color: '#b8b8c0', size: 12 });
    if (toPlayer && small) return this.text(x, y, `-${dmg}`, { color: '#ffa090', size: 11, rise: 20 });
    if (toPlayer) return this.text(x, y, `-${dmg}`, { color: '#ff5a4a', size: 15 });
    if (kind === 'legend') return this.text(x, y - 10, `${dmg}`, { color: '#ffa040', size: 20, rise: 40, dur: 1100 });
    if (crit) {
      this.text(x, y - 14, 'KRİTİK!', { color: '#ffe060', size: 11, rise: 34 });
      return this.text(x, y, `${dmg}`, { color: '#ffd030', size: 20, rise: 36, dur: 950 });
    }
    return this.text(x, y, `${dmg}`, { color: '#ffffff', size: 15 });
  }

  sprite(key, x, y, { anim = true, depth = DEPTH_FX, scale = 1, rotation = 0, blend = null, tint = null, alpha = 1, life = null, origin = [0.5, 0.5] } = {}) {
    const s = this.scene.add.sprite(x, y, 'fx_' + key, 0).setDepth(depth).setScale(scale).setRotation(rotation).setAlpha(alpha).setOrigin(...origin);
    if (blend) s.setBlendMode(blend);
    if (tint) s.setTint(tint);
    const animKey = 'fx_' + key + '_a';
    if (anim && this.scene.anims.exists(animKey)) {
      s.play(animKey);
      const a = this.scene.anims.get(animKey);
      if (a.repeat === 0) s.once('animationcomplete', () => s.destroy());
    }
    if (life) this.scene.time.delayedCall(life, () => s.destroy());
    return s;
  }

  burst(x, y, color = 0xffffff, n = 8, speed = 60, life = 400) {
    if (app.settings.lowPerf) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const p = this.scene.add.image(x, y, 'fx_px').setDepth(DEPTH_FX).setTint(color);
      const a = Math.random() * Math.PI * 2, v = speed * (0.5 + Math.random());
      this.scene.tweens.add({ targets: p, x: x + Math.cos(a) * v * life / 1000, y: y + Math.sin(a) * v * life / 1000 - 10, alpha: 0, duration: life, onComplete: () => p.destroy() });
    }
  }

  shake(intensity = 0.004, dur = 120) {
    if (!app.settings.shake) return;
    this.scene.cameras.main.shake(dur, intensity);
  }

  // Telegraf: büyük saldırılar 1,2–1,8 sn önceden şekil+renk+animasyonla işaretlenir
  // shape: { kind:'circle', x, y, r } | { kind:'rect', x, y, len, width, angle } | { kind:'cone', x, y, r, angle } | { kind:'ring', x, y, r }
  // friendly: oyuncunun kendi uyarısı (Meteor vb.). Düşman telegrafları bittiğinde içindeki iskeletlere hasar verir (V4).
  telegraph(shape, duration, color = 0xff3a2a, { friendly = false } = {}) {
    const sc = this.scene;
    if (!friendly && sc.minions) sc.time.delayedCall(duration, () => sc.minions?.telegraphHit(shape));
    const g = [];
    const D = 40;
    if (shape.kind === 'circle' || shape.kind === 'ring') {
      const tex = shape.kind === 'ring' ? 'tg_ring' : 'tg_circle';
      const base = sc.add.image(shape.x, shape.y, tex).setDepth(D).setTint(color).setDisplaySize(shape.r * 2, shape.r * 2 * TG_SQUASH);
      const fill = sc.add.image(shape.x, shape.y, 'tg_fill').setDepth(D).setTint(color).setDisplaySize(1, 1).setAlpha(0.6);
      sc.tweens.add({ targets: fill, displayWidth: shape.r * 2, displayHeight: shape.r * 2 * TG_SQUASH, duration, ease: 'Linear' });
      g.push(base, fill);
    } else if (shape.kind === 'rect') {
      const base = sc.add.image(shape.x, shape.y, 'tg_rect').setOrigin(0, 0.5).setDepth(D).setTint(color).setRotation(shape.angle).setDisplaySize(shape.len, shape.width);
      const fill = sc.add.image(shape.x, shape.y, 'tg_rect').setOrigin(0, 0.5).setDepth(D).setTint(color).setRotation(shape.angle).setDisplaySize(1, shape.width).setAlpha(0.7);
      sc.tweens.add({ targets: fill, displayWidth: shape.len, duration, ease: 'Linear' });
      g.push(base, fill);
    } else if (shape.kind === 'cone') {
      const base = sc.add.image(shape.x, shape.y, 'tg_cone').setDepth(D).setTint(color).setRotation(shape.angle).setDisplaySize(shape.r * 2, shape.r * 2);
      const fill = sc.add.image(shape.x, shape.y, 'tg_cone').setDepth(D).setTint(color).setRotation(shape.angle).setDisplaySize(1, 1).setAlpha(0.7);
      sc.tweens.add({ targets: fill, displayWidth: shape.r * 2, displayHeight: shape.r * 2, duration });
      g.push(base, fill);
    }
    for (const o of g) sc.tweens.add({ targets: o, alpha: { from: o.alpha, to: o.alpha * 0.55 }, yoyo: true, repeat: -1, duration: 160 });
    sc.time.delayedCall(duration, () => g.forEach((o) => o.destroy()));
    return g;
  }

  levelUp(x, y) {
    const s = this.sprite('levelup', x, y, { origin: [0.5, 1], blend: Phaser.BlendModes.ADD, scale: 1.4 });
    this.scene.tweens.add({ targets: s, alpha: 0, delay: 900, duration: 600, onComplete: () => s.destroy() });
    this.burst(x, y - 30, 0xffe060, 18, 90, 900);
    this.text(x, y - 70, 'SEVİYE ATLADIN!', { color: '#ffe060', size: 18, rise: 30, dur: 1600 });
  }

  lootBeam(x, y, color) {
    const s = this.sprite('beam', x, y, { origin: [0.5, 1], blend: Phaser.BlendModes.ADD, tint: color, scale: 1.6 });
    this.scene.tweens.add({ targets: s, alpha: 0, delay: 1400, duration: 700, onComplete: () => s.destroy() });
    for (let i = 0; i < 5; i++) {
      const sp = this.sprite('sparkle', x + (Math.random() - 0.5) * 30, y - Math.random() * 40, { tint: color, blend: Phaser.BlendModes.ADD });
      this.scene.tweens.add({ targets: sp, y: sp.y - 30, alpha: 0, duration: 1100, delay: i * 120, onComplete: () => sp.destroy() });
    }
  }
}
