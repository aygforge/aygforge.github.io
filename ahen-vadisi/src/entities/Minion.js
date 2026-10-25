// V4 Ölü Çağıran yardımcısı (iskelet). Düşman listesine girmez; sahnede ayrı `minions` yöneticisinde yaşar.
// Kurallar (AFK farm engeli):
//  - Yalnız sahibinin SEÇTİĞİ hedefe saldırır (hedef sahibine ≤ MINION.leash tile). Kendi başına hedef aramaz.
//  - Hedef yoksa / ölünce sahibini takip eder. Sahibi ölünce yok olur.
//  - Hasarı tek öldürme yolundan uygulanır (combat.minionHit → applyToEnemy): EXP/ganimet/görev sayacı bir kez, sahibine.
//  - Kayda yalnız { main: true, hpPct } yazılır (canlı nesne/referans asla). Geçici (Ölüler Ordusu) iskelet kaydedilmez.
import { TILE } from '../data/constants.js';
import { MINION } from '../systems/stats.js';
import { sound } from '../audio/sound.js';
import { spritePack, animDuration } from '../art/spriteRuntime.js';

export class Minion {
  constructor(scene, owner, x, y, { temp = 0, hpPct = 1 } = {}) {
    this.scene = scene;
    this.owner = owner;
    this.kind = 'minion';
    this.x = x; this.y = y;
    this.radius = 9;
    this.height = 44;
    this.facing = 1;
    this.temp = temp;                 // >0: geçici iskelet bitiş zamanı (scene.clock ms)
    this.dead = false;
    this.target = null;
    this.attackTimer = 0.6;
    this.path = null; this.pathTimer = 0;
    this.swing = 0;
    this.refreshStats();
    this.hp = Math.max(1, Math.round(this.maxHp * hpPct));
    const c = scene.add.container(x, y);
    this.shadow = scene.add.image(0, 0, 'obj_shadow').setScale(1.3, 1.1).setAlpha(0.6);
    // hazır sprite paketi (Skeleton Sprite Pack) varsa o; yoksa procedural iskelet (aynı animasyon adları)
    this.pack = spritePack('mon_skeleton_minion');
    this.sprite = this.pack
      ? scene.add.sprite(0, 0, `${this.pack.id}:idle`, 0).setOrigin(this.pack.ox, this.pack.oy)
      : scene.add.sprite(0, 0, 'mon_skeleton_minion', 'idle0').setOrigin(0.5, 1);
    if (temp) this.sprite.setTint(0xb8f0d0);
    this.sprite.play('mon_skeleton_minion_idle');
    this.bar = scene.add.graphics();
    c.add([this.shadow, this.sprite, this.bar]);
    this.container = c;
    this.drawBar();
    scene.fx.sprite('spirit', x, y - 20, { scale: 1.6, tint: 0x8ad0a0 });
    scene.fx.burst?.(x, y - 10, 0x9ae0b0, 12, 70, 500);
  }

  // Statlar sahibinin anlık statlarından (seviye, INT, ekipman, Kemik Bağı, Ustalık) okunur
  refreshStats() {
    const m = this.owner.stats?.minion;
    const book = this.owner.book?.('summon_skeleton');
    const prevMax = this.maxHp || 0;
    this.maxHp = m ? m.maxHp : 100;
    this.def = m ? m.def : 10; this.mdef = m ? m.mdef : 10;
    this.power = (m ? m.power : 10) * (book?.minionAtk || 1);
    this.attackInterval = m ? m.attackInterval : MINION.attackInterval;
    this.level = m ? m.level : 1;
    this.critChance = m ? m.critChance : 0.05;
    if (prevMax && this.hp) this.hp = Math.min(this.maxHp, Math.round(this.hp * this.maxHp / prevMax));
  }

  get alive() { return !this.dead; }

  drawBar() {
    const g = this.bar;
    g.clear();
    if (this.dead) return;
    const w = 26, y = -this.height - 4;
    g.fillStyle(0x000000, 0.7).fillRect(-w / 2 - 1, y - 1, w + 2, 5);
    g.fillStyle(this.temp ? 0x9ae0b0 : 0x6ad07a, 1).fillRect(-w / 2, y, w * Math.max(0, this.hp / this.maxHp), 3);
  }

  // Saldırılabilir hedef: yalnız sahibinin seçili, canlı ve yakındaki hedefi
  pickTarget() {
    const o = this.owner;
    const t = o.target;
    if (!t || t.dead || t.gone || o.dead) return null;
    if (t.tpl?.kind === 'dummy') return t;
    if (Math.hypot(t.x - o.x, t.y - o.y) > MINION.leash * TILE) return null;
    return t;
  }

  update(dt) {
    if (this.dead) return;
    const sc = this.scene, o = this.owner, now = sc.clock;
    if (o.dead) { this.vanish(); return; }
    if (this.temp && now >= this.temp) { this.vanish(true); return; }
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.target = this.pickTarget();
    const speed = MINION.speed * TILE;
    let moved = false;
    if (this.target) {
      const t = this.target;
      const d = Math.hypot(t.x - this.x, t.y - this.y);
      const reach = MINION.range * TILE + (t.radius || 10);
      if (d > reach || !sc.grid.los(this.x, this.y - 6, t.x, t.y - 6)) moved = this.moveTo(t.x, t.y, dt, speed);
      else {
        this.face(t.x - this.x);
        if (this.attackTimer <= 0) this.attack(t);
      }
    } else {
      // takip: sahibinin biraz arkasında dur; çok uzaklaşırsa yanına ışınlan (sıkışma yok)
      const dO = Math.hypot(o.x - this.x, o.y - this.y);
      if (dO > 14 * TILE) this.teleportNear();
      else if (dO > MINION.followDist * TILE) moved = this.moveTo(o.x - o.facing * 22, o.y + 6, dt, speed * (dO > 5 * TILE ? 1.35 : 1));
    }
    const want = this.swing > 0 ? null : moved ? 'walk' : 'idle';
    this.swing = Math.max(0, this.swing - dt);
    if (want && this.sprite.anims.currentAnim?.key !== `mon_skeleton_minion_${want}`) this.sprite.play(`mon_skeleton_minion_${want}`);
    this.sync();
  }

  attack(t) {
    this.attackTimer = this.attackInterval;
    this.swing = 0.35;
    this.sprite.play('mon_skeleton_minion_atk');
    this.scene.time.delayedCall(180, () => {
      if (this.dead || t.dead) return;
      if (Math.hypot(t.x - this.x, t.y - this.y) > MINION.range * TILE * 1.4 + (t.radius || 10)) return;
      this.scene.combat.minionHit(t, this);
    });
  }

  moveTo(tx, ty, dt, speed) {
    const sc = this.scene;
    let gx = tx, gy = ty;
    if (!sc.grid.walkLine(this.x, this.y, tx, ty, this.radius * 0.8)) {
      this.pathTimer -= dt;
      if (!this.path || this.pathTimer <= 0) {
        if (sc.pathBudget > 0) { sc.pathBudget--; this.path = sc.grid.findPath(this.x, this.y, tx, ty, 900); this.pathTimer = 0.6; }
      }
      if (this.path?.length) {
        const n = this.path[0];
        if (Math.hypot(n.x - this.x, n.y - this.y) < 6) this.path.shift();
        gx = n.x; gy = n.y;
      }
    } else this.path = null;
    const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
    if (d < 1) return false;
    const step = Math.min(d, speed * dt);
    this.face(dx);
    return sc.grid.move(this, dx / d * step, dy / d * step);
  }

  teleportNear() {
    const o = this.owner;
    for (const [ox, oy] of [[-1, 0.4], [1, 0.4], [0, 1], [-1, -0.6], [1, -0.6]]) {
      const x = o.x + ox * 1.3 * TILE, y = o.y + oy * 1.3 * TILE;
      if (!this.scene.grid.blockedAt(x, y)) { this.x = x; this.y = y; this.path = null; break; }
    }
  }

  face(dx) {
    if (Math.abs(dx) < 0.5) return;
    this.facing = dx > 0 ? 1 : -1;
    this.sprite.setFlipX(this.facing < 0);
  }

  // Düşmandan gelen hasar (savunma formülüyle hesaplanmış ham sayı)
  takeHit(dmg) {
    if (this.dead) return;
    this.hp -= Math.max(1, Math.round(dmg));
    this.scene.fx.damage(this.x, this.y - this.height, Math.round(dmg), { toPlayer: true, small: true });
    this.sprite.setTintFill(0xff6060);
    this.scene.time.delayedCall(70, () => { if (!this.dead) { this.sprite.clearTint(); if (this.temp) this.sprite.setTint(0xb8f0d0); } });
    this.drawBar();
    if (this.hp <= 0) this.vanish();
  }

  heal(pct) {
    if (this.dead) return;
    this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * pct));
    this.drawBar();
  }

  vanish(expired = false) {
    if (this.dead) return;
    this.dead = true;
    this.bar.clear();
    this.shadow.setVisible(false);
    const sc = this.scene;
    if (!expired) sound.play('enemy_die', { vol: 0.5 });
    if (this.pack && !expired) {
      // paketin dağılma animasyonu, ardından solma
      this.sprite.play(`${this.pack.id}_die`, false);
      sc.tweens.add({ targets: this.sprite, alpha: 0, delay: animDuration(this.pack.id, 'die') * 1000, duration: 300, onComplete: () => this.container.destroy() });
    } else {
      sc.fx.sprite('ash_puff', this.x, this.y - 12, { scale: 1.4, tint: 0xe0d8c4 });
      sc.tweens.add({ targets: this.sprite, alpha: 0, angle: this.facing > 0 ? -70 : 70, duration: 420, onComplete: () => this.container.destroy() });
    }
    sc.minions?.onMinionGone(this);
  }

  // Sahne kapanırken / sahibi ölünce sessizce kaldır
  destroy() {
    this.dead = true;
    this.container.destroy();
  }

  sync() {
    this.container.setPosition(Math.round(this.x), Math.round(this.y));
    this.container.setDepth(100 + this.y);
  }
}
