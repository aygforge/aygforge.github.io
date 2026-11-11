// V4 yaratık ve elit yetenekleri (Gökyarık Ovası / Yıldız Mezarı). Hepsi telegraflı (≥0,8 sn) ve
// telegraf şekli = isabet alanı. Enemy.updateAbility bu modüle yalnız V4 yetenek adlarında yönlenir.
import Phaser from 'phaser';
import { TILE } from '../data/constants.js';
import { sound } from '../audio/sound.js';
import { inTelegraphCircle } from './Enemy.js';

export const V4_NORMAL_ABILITIES = new Set(['storm_pounce', 'rift_strike', 'star_fall']);
export const V4_ELITE_ABILITIES = new Set(['storm_field', 'void_guard']);

const STORM = 0x9ad0ff, VOID = 0xa070e0;

export function normalAbilityV4(e, ab, p, dP) {
  const sc = e.scene;
  if (ab === 'storm_pounce' && dP > 2.4 * TILE && dP < 6.5 * TILE && e.canSee(p)) {
    // Fırtına Tazısı: hat telegrafı ardından sıçrayış; isabette kısa yavaşlatma
    e.abilityCd = 7 + Math.random() * 2;
    e.dashAt(p, { len: Math.min(dP + TILE, 6.5 * TILE), w: 1.1 * TILE, dur: 850, coef: 1.2, label: 'Fırtına Sıçrayışı', tint: STORM, slow: 0.25 });
  } else if (ab === 'rift_strike' && dP < 7 * TILE && e.canSee(p)) {
    // Çatlak Kanat: oyuncunun durduğu yere yarıktan dalış (çember telegrafı), sonra o noktada belirir
    e.abilityCd = 9 + Math.random() * 2;
    const x = p.x, y = p.y, r = 1.5 * TILE, dur = 1150;
    sc.fx.telegraph({ kind: 'circle', x, y, r }, dur, STORM);
    sound.play('warn', { vol: 0.5 });
    e.sprite.setAlpha(0.5);
    e.casting = { t: dur / 1000, fn: () => {
      e.sprite.setAlpha(1);
      if (e.dead) return;
      if (!sc.grid.blockedAt(x, y)) { e.x = x; e.y = y - 4; }
      e.playAnim('atk');
      sc.fx.sprite('shatter', x, y - 8, { scale: 1.8, tint: STORM });
      sound.play('bolt', { vol: 0.6 });
      if (!p.dead && inTelegraphCircle(p.x, p.y, x, y, r)) sc.combat.enemyHitsPlayer(e, { coef: 1.3, dmgType: 'magic', label: 'Yarık Pençesi' });
    } };
  } else if (ab === 'star_fall' && dP < 8 * TILE && e.canSee(p)) {
    // Yıldız Kâhini: oyuncunun üstüne ve yanına iki küçük yıldız düşürür
    e.abilityCd = 10 + Math.random() * 2;
    e.playAnim('atk');
    sound.play('warn', { vol: 0.5 });
    const side = Math.random() < 0.5 ? -1 : 1;
    for (const [ox, oy] of [[0, 0], [1.5 * side, 0.6]]) {
      sc.combat.fallingShard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 1 * TILE, delay: 1.3, coef: 1.0, src: e, style: 'star', label: 'Yıldız Düşüşü' });
    }
    e.casting = { t: 0.5, fn: () => {} };
  } else {
    e.abilityCd = 1.2;
  }
}

// Elitler: üç adımlı döngü (alan → uzaktan baskı → savunma/iz). Öfke Enemy.updateAbility'de.
export function eliteAbilityV4(e, ab, p, dP) {
  const sc = e.scene;
  e.v4n = (e.v4n || 0) + 1;
  const step = e.v4n % 3;
  if (ab === 'storm_field') {
    // Fırtına Celladı
    if (step === 1 && dP < 4.2 * TILE) {
      e.abilityCd = e.enraged ? 7 : 8.5;
      const r = 3.6 * TILE, dur = e.enraged ? 1300 : 1500;
      sc.fx.telegraph({ kind: 'circle', x: e.x, y: e.y, r }, dur, STORM);
      sound.play('warn');
      sc.fx.text(e.x, e.y - e.height - 10, 'Fırtına Alanı', { color: '#9ad0ff', size: 13 });
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sc.fx.sprite('shatter', e.x, e.y - 6, { scale: 3.4, tint: STORM });
        sound.play('slam'); sc.fx.shake(0.008, 200);
        if (!p.dead && inTelegraphCircle(p.x, p.y, e.x, e.y, r)) {
          sc.combat.enemyHitsPlayer(e, { coef: 1.8, label: 'Fırtına Alanı' });
          sc.combat.slowPlayer(0.3, 1.5);
        }
      } };
    } else if (step === 2 && dP < 9 * TILE) {
      e.abilityCd = 8;
      sound.play('warn');
      e.playAnim('atk');
      sc.fx.text(e.x, e.y - e.height - 10, 'Yıldırım Zinciri', { color: '#9ad0ff', size: 13 });
      for (const [ox, oy] of [[0, 0], [1.6, 0.6], [-1.5, 0.7], [0.1, -1.5]]) {
        sc.combat.fallingShard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.05, src: e, style: 'storm', label: 'Yıldırım' });
      }
      e.casting = { t: 0.6, fn: () => {} };
    } else if (step === 0 && dP < 4.5 * TILE) {
      e.abilityCd = 9;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 3.8 * TILE, dur = 1450;
      sc.fx.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, STORM);
      sound.play('warn');
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sc.fx.sprite('slash', e.x + Math.cos(ang) * 32, e.y - 10 + Math.sin(ang) * 32, { scale: 3.2, rotation: ang, tint: STORM });
        sound.play('slam'); sc.fx.shake(0.006, 160);
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
        const da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
        if (!p.dead && d <= r && da <= Math.PI / 3) sc.combat.enemyHitsPlayer(e, { coef: 2.0, label: 'Cellat Yıldırımı' });
        // kesik yönünde kısa süreli fırtına izi
        for (let i = 1; i <= 2; i++) {
          sc.combat.groundHazard({ x: e.x + Math.cos(ang) * i * TILE * 1.3, y: e.y + Math.sin(ang) * i * TILE * 1.3, r: 0.8 * TILE, dur: 3, tick: 0.5, coef: 0.16, src: e, key: 'storm_ground', label: 'Fırtına izi' });
        }
      } };
    } else e.abilityCd = 1.2;
    return;
  }
  // Hiçlik Muhafızı: geniş hiçlik darbesi → hiçlik mermileri → Hiçlik Muhafazası (5 sn %35 hasar azaltma)
  if (step === 1 && dP < 4.6 * TILE) {
    e.abilityCd = 8.5;
    const r = 4 * TILE, dur = 1600;
    sc.fx.telegraph({ kind: 'circle', x: e.x, y: e.y, r }, dur, VOID);
    sound.play('warn');
    e.casting = { t: dur / 1000, fn: () => {
      if (e.dead) return;
      e.playAnim('atk');
      sc.fx.sprite('shatter', e.x, e.y - 6, { scale: 3.6, tint: VOID });
      sound.play('slam'); sc.fx.shake(0.009, 220);
      if (!p.dead && inTelegraphCircle(p.x, p.y, e.x, e.y, r)) sc.combat.enemyHitsPlayer(e, { coef: 1.9, label: 'Hiçlik Darbesi' });
    } };
  } else if (step === 2 && dP < 9 * TILE) {
    e.abilityCd = 8;
    sound.play('warn');
    e.playAnim('atk');
    sc.fx.text(e.x, e.y - e.height - 10, 'Boşluk Yağmuru', { color: '#c8a0ff', size: 13 });
    for (const [ox, oy] of [[0, 0], [1.5, 0.7], [-1.4, 0.8], [0.2, -1.4]]) {
      sc.combat.fallingShard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: e, style: 'star', label: 'Boşluk Parçası' });
    }
    e.casting = { t: 0.6, fn: () => {} };
  } else if (step === 0) {
    e.abilityCd = 9;
    e.casting = { t: 0.5, fn: () => {
      if (e.dead) return;
      e.reduce = 0.35;
      e.furyTint = 0xb0a0ff; e.sprite.setTint(e.furyTint);
      sc.fx.text(e.x, e.y - e.height - 10, 'Hiçlik Muhafazası', { color: '#c8a0ff', size: 13 });
      sound.play('shield');
      e.drawBar();
      sc.time.delayedCall(5000, () => { if (e.dead) return; e.reduce = 0; e.furyTint = null; e.sprite.clearTint(); e.drawBar(); });
    } };
  } else e.abilityCd = 1.2;
}
