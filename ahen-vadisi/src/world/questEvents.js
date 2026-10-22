// V3 görev olayları: refakat (kervan / yolcu) ve alan savunması.
// - Olaylar yalnız aktif görev hedefi varken başlatılabilir; başarısızlık kalıcı değildir (yeniden denenir).
// - Olay yaratıkları `questSpawn`: EXP, ganimet, görev sayacı ya da elit katkısı vermez (farm çoğaltılamaz).
// - Olay durumu kayda yazılmaz: harita değişince / bayılınca olay sıfırlanır; tamamlanma görev hedefinde saklanır.
import Phaser from 'phaser';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { TILE } from '../data/constants.js';
import { eventAvailable, eventDone, onEventComplete } from '../systems/quests.js';
import { sound } from '../audio/sound.js';

// Ortak: korunan hedef (HP çubuğu, etiket, darbe alma)
class Guarded {
  constructor(scene, o, kind) {
    this.scene = scene;
    this.o = o;
    this.kind = kind;
    this.name = o.name;
    this.x = o.x * TILE + TILE / 2;
    this.y = o.y * TILE + TILE / 2 + 8;
    this.radius = 14;
    this.tapRadius = 32;
    this.interactRange = 2 * TILE;
    this.height = 44;
    this.maxHp = o.hp;
    this.hp = o.hp;
    this.running = false;
    this.dead = false;   // düşmanlar için "hedef öldü mü" (yalnız olay sırasında anlamlı)
    this.wave = [];
    this.bar = scene.add.graphics().setDepth(50002);
    this.label = scene.add.text(this.x, this.y - 70, o.name, { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#bfe8a0', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(50000);
    this.glow = scene.add.image(this.x, this.y - 20, 'light').setScale(0.7).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
  }

  get available() { return !!eventAvailable(app.char, this.kind === 'escort' ? 'escort' : 'defend', this.o.id); }

  drawBar() {
    const g = this.bar;
    g.clear();
    if (!this.running) return;
    const w = 54, x = this.x - w / 2, y = this.y - this.height - 12;
    g.fillStyle(0x000000, 0.75).fillRect(x - 1, y - 1, w + 2, 7);
    const f = Math.max(0, this.hp / this.maxHp);
    g.fillStyle(f > 0.5 ? 0x60d060 : f > 0.25 ? 0xe0c040 : 0xe04040, 1).fillRect(x, y, w * f, 5);
  }

  takeHit(dmg) {
    if (!this.running || this.dead) return;
    this.hp -= dmg;
    this.scene.fx.damage(this.x, this.y - this.height, dmg, { toPlayer: true });
    this.flash?.();
    this.drawBar();
    if (this.hp <= 0) { this.dead = true; this.fail(`${this.o.name} düştü! Görev yeniden denenebilir.`); }
  }

  spawnWave(list, around, rMin = 4.5, rMax = 6) {
    const sc = this.scene;
    const out = [];
    let k = 0;
    for (const [id, n] of list) {
      for (let i = 0; i < n; i++, k++) {
        let pos = null;
        for (let t = 0; t < 24 && !pos; t++) {
          const a = Math.random() * Math.PI * 2, r = (rMin + Math.random() * (rMax - rMin)) * TILE;
          const x = around.x + Math.cos(a) * r, y = around.y + Math.sin(a) * r * 0.85;
          if (!sc.grid.blockedAt(x, y) && sc.grid.findPath(x, y, around.x, around.y, 900)) pos = { x, y };
        }
        if (!pos) pos = { x: around.x + (k % 3 - 1) * TILE, y: around.y + 2 * TILE };
        const e = sc.spawner.spawnEnemy(id, pos.x, pos.y, { questSpawn: true, leashR: 40 * TILE });
        e.objective = this;
        e.questEvent = this;
        e.state = 'chase'; e.engaged = true;
        sc.fx.sprite('spark', pos.x, pos.y - 20, { scale: 2, tint: 0xff6040 });
        out.push(e);
      }
    }
    this.wave.push(...out);
    return out;
  }

  aliveWave() { return this.wave.filter((e) => !e.dead); }
  clearWave() { for (const e of this.wave) if (!e.dead) this.scene.spawner.despawn(e); this.wave = []; }
  onEnemyDead() {}

  complete(text) {
    const ch = app.char;
    this.running = false;
    this.clearWave();
    const ups = onEventComplete(ch, this.kind === 'escort' ? 'escort' : 'defend', this.o.id);
    for (const u of ups) bus.emit('questProgress', u);
    sound.play('victory');
    this.scene.fx.lootBeam(this.x, this.y, 0x80f080);
    bus.emit('toast', { text, kind: 'level' });
    this.drawBar();
    app.changed('quest');
    app.requestSave('questEvent', true);
    this.scene.refreshMarks();
  }

  fail(text) {
    this.running = false;
    this.clearWave();
    sound.play('error');
    bus.emit('toast', { text, kind: 'warn' });
    this.reset();
    this.drawBar();
  }

  reset() { this.hp = this.maxHp; this.dead = false; }
}

// ------------------------------------------------------------------------------------------------ Refakat
// o: { type:'escort', id, x, y, name, look (NPC görünümü) | sprite (nesne), hp, speed, route: [[x,y]...], ambushes: [{ at: 0–1, wave }] }
export class EscortObj extends Guarded {
  constructor(scene, o) {
    super(scene, o, 'escort');
    this.start = { x: this.x, y: this.y };
    this.speedPx = (o.speed || 2.4) * TILE;
    this.follow = (o.follow || 5) * TILE;
    if (o.look) {
      this.s = scene.add.sprite(this.x, this.y, o.look, 'idle0').setOrigin(0.5, 28.5 / 30).setDepth(100 + this.y);
      this.s.play(o.look + '_idle');
      this.height = 60;
    } else {
      this.s = scene.add.sprite(this.x, this.y, 'obj_' + (o.sprite || 'caravan'), 0).setOrigin(0.5, 1).setDepth(100 + this.y);
      if (scene.anims.exists('obj_' + (o.sprite || 'caravan') + '_a')) this.s.play('obj_' + (o.sprite || 'caravan') + '_a');
      this.height = 40;
    }
    this.shadow = scene.add.image(this.x, this.y, 'obj_shadow').setScale(2, 1.4).setAlpha(0.55).setDepth(99 + this.y);
    this.flash = () => { this.s.setTintFill(0xff6060); scene.time.delayedCall(80, () => this.s.clearTint()); };
    this.atEnd = false;
    // görev zaten tamamlandıysa hedefte bekler
    if (this.objectiveDone()) this.placeAtEnd();
  }

  objectiveDone() { return eventDone(app.char, 'escort', this.o.id); }

  placeAtEnd() {
    const [ex, ey] = this.o.route[this.o.route.length - 1];
    this.x = ex * TILE + TILE / 2; this.y = ey * TILE + TILE / 2 + 8;
    this.atEnd = true;
    this.sync();
  }

  buildPath() {
    const g = this.scene.grid;
    const pts = [[this.x, this.y], ...this.o.route.map(([x, y]) => [x * TILE + TILE / 2, y * TILE + TILE / 2])];
    const path = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = g.findPath(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 40000);
      if (seg && seg.length) path.push(...seg);
      else path.push({ x: pts[i + 1][0], y: pts[i + 1][1] });   // yol bulunamazsa ara nokta (takılma kurtarması devreye girer)
    }
    return path;
  }

  interact() {
    if (this.running) { bus.emit('toast', { text: `${this.o.name} yolda. Yakınında kal ki ilerlesin.`, kind: 'info', short: true }); return; }
    if (!this.available) {
      bus.emit('toast', { text: this.atEnd ? `${this.o.name}: "Sağ salim vardık, teşekkürler!"` : (this.o.idleSay || `${this.o.name} yola çıkmak için bekliyor.`), kind: 'info', short: true });
      return;
    }
    bus.emit('confirm', {
      title: this.o.name,
      text: this.o.intro || 'Refakat: kervan yalnız SEN YAKININDAYKEN ilerler. Yolda pusu kurulabilir; saldırganları kervana ulaşmadan durdur. Kervanın canı biterse görev yeniden denenebilir.',
      ok: 'Yola çık', onOk: () => this.begin(),
    });
  }

  begin() {
    if (this.atEnd) { this.x = this.start.x; this.y = this.start.y; this.atEnd = false; }
    this.reset();
    this.path = this.buildPath();
    this.total = this.path.length;
    this.node = 0;
    this.ambushed = new Set();
    this.stuckT = 0; this.lastPos = { x: this.x, y: this.y };
    this.running = true;
    sound.play('quest');
    bus.emit('toast', { text: `${this.o.name} yola çıktı. Yakınında kal!`, kind: 'ok' });
    this.drawBar();
  }

  reset() {
    super.reset();
    if (!this.start) return;
    this.x = this.start.x; this.y = this.start.y; this.atEnd = false;
    this.sync();
  }

  sync() {
    if (!this.s) return;
    this.s.setPosition(Math.round(this.x), Math.round(this.y)).setDepth(100 + this.y);
    this.shadow.setPosition(this.x, this.y).setDepth(99 + this.y);
    this.label.setPosition(this.x, this.y - this.height - 14);
    this.glow.setPosition(this.x, this.y - 20);
  }

  update(dt) {
    const sc = this.scene, p = sc.player;
    this.glow.setAlpha(!this.running && this.available ? 0.35 + Math.sin(sc.clock / 300) * 0.15 : 0);
    if (!this.running) { this.sync(); return; }
    if (p.dead) { this.fail('Bayıldın. Refakat yeniden denenebilir.'); return; }
    const frac = this.total ? this.node / this.total : 1;
    for (const [k, am] of (this.o.ambushes || []).entries()) {
      if (!this.ambushed.has(k) && frac >= am.at) {
        this.ambushed.add(k);
        const ahead = this.path[Math.min(this.path.length - 1, this.node + 4)] || this;
        this.spawnWave(am.wave, ahead, 3.5, 5.5);
        sound.play('warn');
        bus.emit('toast', { text: am.say || 'Pusu! Kervanı koru!', kind: 'elite' });
      }
    }
    const threatened = this.aliveWave().some((e) => Math.hypot(e.x - this.x, e.y - this.y) < 3.2 * TILE);
    const near = Math.hypot(p.x - this.x, p.y - this.y) < this.follow;
    if (near && !threatened && this.node < this.path.length) {
      const n = this.path[this.node];
      const dx = n.x - this.x, dy = n.y - this.y, d = Math.hypot(dx, dy);
      if (d < 5) this.node++;
      else {
        const step = Math.min(d, this.speedPx * dt);
        sc.grid.move(this, dx / d * step, dy / d * step);
        if (this.s.setFlipX) this.s.setFlipX(dx < 0);
      }
      // takılma kurtarması: 1,5 sn ilerleme yoksa sonraki yol noktasına yerleş (ağaç arkasında sonsuz bekleme yok)
      this.stuckT += dt;
      if (this.stuckT >= 1.5) {
        if (Math.hypot(this.x - this.lastPos.x, this.y - this.lastPos.y) < 6) { this.x = n.x; this.y = n.y; this.node++; }
        this.stuckT = 0; this.lastPos = { x: this.x, y: this.y };
      }
    }
    if (this.node >= this.path.length && !this.aliveWave().length) {
      this.atEnd = true;
      this.complete(this.o.doneSay || `${this.o.name} hedefe ulaştı!`);
      return;
    }
    if (!near && !this._farWarnT) { this._farWarnT = 4; bus.emit('toast', { text: `${this.o.name} seni bekliyor — yakınına dön.`, kind: 'info', short: true }); }
    if (this._farWarnT) this._farWarnT = Math.max(0, this._farWarnT - dt) || 0;
    if (Math.hypot(p.x - this.x, p.y - this.y) > 22 * TILE) this.fail(`${this.o.name} yalnız kaldı. Refakat yeniden denenebilir.`);
    this.sync();
    this.drawBar();
  }
}

// ------------------------------------------------------------------------------------------------ Savunma
// o: { type:'defense', id, x, y, name, sprite, hp, waves: [[ [enemy, n], ... ], ...], ring: [min,max] }
export class DefenseObj extends Guarded {
  constructor(scene, o) {
    super(scene, o, 'defense');
    this.s = scene.add.sprite(this.x, this.y, 'obj_' + (o.sprite || 'camp_crates'), 0).setOrigin(0.5, 1).setDepth(100 + this.y);
    if (scene.anims.exists('obj_' + o.sprite + '_a')) this.s.play('obj_' + o.sprite + '_a');
    this.height = o.height || 40;
    this.label.setPosition(this.x, this.y - this.height - 14);
    this.flash = () => { this.s.setTintFill(0xff6060); scene.time.delayedCall(80, () => this.s.clearTint()); };
  }

  interact() {
    if (this.running) { bus.emit('toast', { text: `Dalga ${this.waveNo}/${this.o.waves.length} — ${this.o.name} saldırı altında!`, kind: 'info', short: true }); return; }
    if (!this.available) { bus.emit('toast', { text: this.o.idleSay || `${this.o.name} şimdilik güvende.`, kind: 'info', short: true }); return; }
    bus.emit('confirm', {
      title: this.o.name,
      text: this.o.intro || `Savunma: ${this.o.waves.length} düşman dalgası ${this.o.name} hedefine saldıracak. Korunan hedefin canı çubukta görünür; düşerse görev yeniden denenebilir. Bu düşmanlar EXP/ganimet vermez.`,
      ok: 'Hazırım', onOk: () => this.begin(),
    });
  }

  begin() {
    this.reset();
    this.running = true;
    this.waveNo = 0;
    sound.play('warn');
    this.nextWave();
    this.drawBar();
  }

  nextWave() {
    this.waveNo++;
    const ring = this.o.ring || [5, 7];
    this.spawnWave(this.o.waves[this.waveNo - 1], { x: this.x, y: this.y }, ring[0], ring[1]);
    bus.emit('toast', { text: `${this.o.name}: Dalga ${this.waveNo}/${this.o.waves.length}`, kind: 'elite' });
  }

  update() {
    const sc = this.scene, p = sc.player;
    this.glow.setAlpha(!this.running && this.available ? 0.35 + Math.sin(sc.clock / 300) * 0.15 : 0);
    if (!this.running) return;
    if (p.dead) { this.fail('Bayıldın. Savunma yeniden denenebilir.'); return; }
    if (Math.hypot(p.x - this.x, p.y - this.y) > 18 * TILE) { this.fail(`${this.o.name} savunmasız bırakıldı. Yeniden denenebilir.`); return; }
    if (this.aliveWave().length) return;
    if (this.waiting) return;
    if (this.waveNo >= this.o.waves.length) { this.complete(this.o.doneSay || `${this.o.name} korundu!`); return; }
    this.waiting = true;
    sc.time.delayedCall(1400, () => { this.waiting = false; if (this.running) this.nextWave(); });
  }
}
