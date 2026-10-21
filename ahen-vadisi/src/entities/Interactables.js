// Dokunulabilir dünya nesneleri: NPC, Yol Taşı, sunak, toplama düğümleri, görev nesneleri, Derin Ocak kapısı.
// Dokununca karakter etkileşim menziline otomatik yaklaşır, sonra işlem/arayüz açılır.
import Phaser from 'phaser';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { TILE } from '../data/constants.js';
import { NPCS } from '../data/npcs.js';
import { WAYSTONES, ALTAR_COOLDOWN, GATHER_RESPAWN } from '../data/maps/index.js';
import { STACKABLES } from '../data/materials.js';
import { questsForNpc, canInteractQuestObject, onInteract } from '../systems/quests.js';
import { rollGather, rollAltar } from '../systems/loot.js';
import { addStack, stackCapacity } from '../systems/inventory.js';
import { canEnterDungeon } from '../systems/dungeon.js';
import { sound } from '../audio/sound.js';

class Base {
  constructor(scene, o) {
    this.scene = scene;
    this.o = o;
    this.kind = 'object';
    this.x = o.x * TILE + TILE / 2;
    this.y = o.y * TILE + TILE / 2 + 8;
    this.radius = 12;
    this.interactRange = 1.5 * TILE;
    this.tapRadius = 26;
    this.height = 40;
  }
  sprite(key, anim = true, oy = 1) {
    const s = this.scene.add.sprite(this.x, this.y, 'obj_' + key, 0).setOrigin(0.5, oy).setDepth(100 + this.y);
    if (anim && this.scene.anims.exists('obj_' + key + '_a')) s.play('obj_' + key + '_a');
    return s;
  }
  update() {}
  interact() {}
}

export class NpcObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'npc';
    this.npc = NPCS[o.npc];
    this.name = this.npc.name;
    this.s = scene.add.sprite(this.x, this.y, this.npc.sprite, 'idle0').setOrigin(0.5, 28.5 / 30).setDepth(100 + this.y);
    this.s.play(this.npc.sprite + '_idle');
    this.s.anims.setProgress(Math.random());
    if (o.npc === 'boran' || o.npc === 'keeper') this.s.setScale(1.05);
    this.shadow = scene.add.image(this.x, this.y, 'obj_shadow').setScale(1.4, 1.2).setAlpha(0.6).setDepth(99 + this.y);
    this.label = scene.add.text(this.x, this.y - 66, this.npc.name, { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#ffe8a0', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(50000);
    this.mark = scene.add.sprite(this.x, this.y - 80, 'obj_quest_mark', 0).setOrigin(0.5, 1).setDepth(50001).setVisible(false);
    this.height = 60;
    this.tapRadius = 30;
    this.refreshMark();
  }
  refreshMark() {
    const list = questsForNpc(app.char, this.npc.id);
    const ready = list.some((x) => x.status === 'active' && x.ready && x.q.turnIn === this.npc.id);
    const avail = list.some((x) => x.status === 'available');
    const contract = this.npc.id === 'hunter' && app.char.contract && app.char.contract.p >= app.char.contract.n;
    if (ready || contract) { this.mark.setTexture('obj_quest_turnin').setVisible(true).play('obj_quest_turnin_a'); }
    else if (avail) { this.mark.setTexture('obj_quest_mark').setVisible(true).play('obj_quest_mark_a'); }
    else this.mark.setVisible(false);
  }
  update() {
    const p = this.scene.player;
    if (p && Math.abs(p.x - this.x) > 4) this.s.setFlipX(p.x < this.x);
  }
  interact() {
    sound.play('click');
    bus.emit('openNpc', this.npc.id);
  }
}

export class WaystoneObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'waystone';
    this.name = 'Yol Taşı';
    this.s = this.sprite('waystone');
    this.light = scene.add.image(this.x, this.y - 30, 'light_blue').setScale(0.7).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
    this.height = 56;
  }
  update() {
    const p = this.scene.player;
    const w = app.char.world;
    if (!w.waystones.includes(this.o.id) && Math.hypot(p.x - this.x, p.y - this.y) < 3 * TILE) {
      w.waystones.push(this.o.id);
      bus.emit('toast', { text: `Yol Taşı keşfedildi: ${WAYSTONES[this.o.id].name}`, kind: 'ok' });
      sound.play('portal');
      app.requestSave('waystone', true);
    }
  }
  interact() { bus.emit('openTravel', this.o.id); }
}

export class GatherObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'gather';
    this.mat = o.kind;
    this.name = STACKABLES[o.kind].name;
    const ore = o.kind === 'iron_ore' || o.kind === 'hard_ore';
    this.key = ore ? 'ore_' + o.kind : 'herb_' + o.kind;
    this.usedKey = ore ? 'ore_used' : 'herb_used';
    this.s = this.sprite(this.key, false);
    this.height = 26;
    this.interactRange = 1.3 * TILE;
  }
  // tükenme zamanı kayıtta tutulur: haritaya girip çıkarak düğüm yenilenemez
  get readyAt() { return app.char.world.gatherAt?.[this.o.id] || 0; }
  set readyAt(v) { (app.char.world.gatherAt = app.char.world.gatherAt || {})[this.o.id] = v; }
  get depleted() { return app.char.world.activeTime < this.readyAt; }
  update() {
    const dep = this.depleted;
    if (dep !== this._dep) { this._dep = dep; this.s.setTexture('obj_' + (dep ? this.usedKey : this.key)); }
  }
  interact(p) {
    if (this.depleted) { bus.emit('toast', { text: 'Tükenmiş, biraz bekle', kind: 'warn', short: true }); return; }
    if (stackCapacity(app.char.bag, this.mat) <= 0) { bus.emit('toast', { text: 'Çanta dolu', kind: 'warn' }); return; }
    const ore = this.mat.includes('ore');
    sound.play(ore ? 'mine' : 'gather');
    p.startChannel(ore ? 'Kazılıyor…' : 'Toplanıyor…', 1.2, () => {
      if (this.depleted) return;
      const g = rollGather(this.mat, app.rng);
      const left = addStack(app.char.bag, g.id, g.qty);
      const got = g.qty - left;
      sound.play(ore ? 'mine' : 'gather');
      this.readyAt = app.char.world.activeTime + GATHER_RESPAWN[0] + Math.random() * (GATHER_RESPAWN[1] - GATHER_RESPAWN[0]);
      bus.emit('loot', { name: this.name, qty: got, icon: g.id, r: 'N' });
      app.changed('inventory');
      app.requestSave('gather');
      this.scene.refreshMarks();
    });
  }
}

const QOBJ_SPRITE = { wolf_track: 'track', hunter_cache: 'chest', purify_stone: 'purify', swamp_ruin: 'ruin', lost_miner: null };

export class QuestObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'qobj';
    this.name = o.label;
    if (o.group === 'lost_miner') {
      this.s = scene.add.sprite(this.x, this.y, 'npc_miner', 'idle0').setOrigin(0.5, 28.5 / 30).setDepth(100 + this.y);
      this.s.play('npc_miner_idle');
      this.height = 60;
    } else {
      this.s = this.sprite(QOBJ_SPRITE[o.group], false, o.group === 'wolf_track' ? 0.5 : 1);
      if (o.group === 'wolf_track') this.s.setDepth(30);
      this.height = o.group === 'wolf_track' ? 12 : 44;
    }
    this.glow = scene.add.image(this.x, this.y - this.height / 2, 'light').setScale(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
  }
  isDone() {
    // görev aşaması kalıcı olarak etkinleştirildiyse görünüm değişir
    return Object.values(app.char.quests).some((q) => q.used?.includes(this.o.id));
  }
  update(dt) {
    const active = canInteractQuestObject(app.char, this.o.group, this.o.id);
    this.glow.setAlpha(active ? 0.35 + Math.sin(this.scene.clock / 300) * 0.15 : 0);
    const done = this.isDone();
    if (this.s.texture.key.startsWith('obj_')) this.s.setFrame(done ? 1 : 0);
  }
  interact(p) {
    if (!canInteractQuestObject(app.char, this.o.group, this.o.id)) {
      bus.emit('toast', { text: this.isDone() ? 'Bunu zaten inceledin' : 'Şu an burada yapılacak bir şey yok', kind: 'info', short: true });
      return;
    }
    p.startChannel('İnceleniyor…', 1.0, () => {
      const ups = onInteract(app.char, this.o.group, this.o.id);
      for (const u of ups) bus.emit('questProgress', u);
      if (this.o.group === 'purify_stone') { sound.play('altar'); this.scene.fx.burst(this.x, this.y - 20, 0x7af0ff, 20, 80, 800); }
      else sound.play('quest');
      if (this.o.group === 'lost_miner') bus.emit('toast', { text: 'Kadir: "Sonunda biri geldi! Kardeşime iyi olduğumu söyle."', kind: 'info' });
      app.changed('quest');
      app.requestSave('questObject', true);
      this.scene.refreshMarks();
    });
  }
}

export class AltarObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'altar';
    this.name = o.name;
    this.s = this.sprite('altar');
    this.light = scene.add.image(this.x, this.y - 30, 'light').setTint(0xc070ff).setScale(0.8).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
    this.event = null;
    this.height = 50;
    this.interactRange = 2 * TILE;
  }
  get ready() { return app.char.world.activeTime >= (app.char.world.altarReadyAt[this.o.id] || 0); }
  update() {
    const r = this.ready && !this.event;
    if (r !== this._r) { this._r = r; this.s.setTexture(r ? 'obj_altar' : 'obj_altar_off'); if (r) this.s.play('obj_altar_a'); else this.s.stop(); this.light.setVisible(r); }
  }
  interact() {
    if (this.event) { bus.emit('toast', { text: 'Sunak olayı sürüyor!', kind: 'info', short: true }); return; }
    if (!this.ready) {
      const left = Math.ceil((app.char.world.altarReadyAt[this.o.id] - app.char.world.activeTime) / 60);
      bus.emit('toast', { text: `Sunak dinleniyor (~${left} dk aktif oyun)`, kind: 'info' });
      return;
    }
    bus.emit('confirm', {
      title: this.name, text: 'Sunağı uyandırırsan yaratık dalgaları saldıracak. Hepsini yenersen Sunak Tozu ve şansla Sunak Kristali kazanırsın.',
      ok: 'Uyandır', onOk: () => this.start(),
    });
  }
  start() {
    this.event = { wave: 0, alive: [] };
    sound.play('altar');
    bus.emit('toast', { text: `${this.name} uyandı! Dalga 1/${this.o.waves.length}`, kind: 'elite' });
    this.spawnWave();
  }
  spawnWave() {
    const sc = this.scene;
    const list = this.o.waves[this.event.wave];
    this.event.alive = list.map((id, i) => {
      const a = (i / list.length) * Math.PI * 2;
      let x = this.x + Math.cos(a) * 3 * TILE, y = this.y + Math.sin(a) * 2.5 * TILE;
      if (sc.grid.blockedAt(x, y)) { x = this.x + (i - 1) * TILE; y = this.y + 2 * TILE; }
      const e = sc.spawner.spawnEnemy(id, x, y, { leashR: 12 * TILE });
      e.altar = this;
      e.aggro(sc.player);
      sc.fx.sprite('spark', x, y - 20, { scale: 2, tint: 0xc070ff });
      return e;
    });
  }
  onWaveEnemyDead(e) {
    if (!this.event) return;
    this.event.alive = this.event.alive.filter((x) => x !== e && !x.dead);
    if (this.event.alive.length) return;
    this.event.wave++;
    if (this.event.wave < this.o.waves.length) {
      bus.emit('toast', { text: `Dalga ${this.event.wave + 1}/${this.o.waves.length}`, kind: 'elite' });
      this.scene.time.delayedCall(1200, () => this.spawnWave());
      return;
    }
    // tamamlandı — tek seferlik ödül, sonra bekleme süresi
    const ch = app.char;
    ch.world.altarReadyAt[this.o.id] = ch.world.activeTime + ALTAR_COOLDOWN;
    const rewards = rollAltar(this.o.crystalChance, app.rng);
    for (const r of rewards) {
      const left = addStack(ch.bag, r.id, r.qty);
      if (r.qty - left > 0) bus.emit('loot', { name: STACKABLES[r.id].name, qty: r.qty - left, icon: r.id, r: r.id === 'altar_crystal' ? 'E' : 'U' });
    }
    this.event = null;
    sound.play('victory');
    this.scene.fx.lootBeam(this.x, this.y, 0xc070ff);
    bus.emit('toast', { text: `${this.name} arındırıldı!`, kind: 'ok' });
    app.changed('inventory');
    app.requestSave('altar', true);
  }
}

export class DungeonGateObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'gate';
    this.name = 'Derin Ocak Kapısı';
    this.s = this.sprite('dungeon_gate', false);
    this.height = 90;
    this.tapRadius = 44;
    this.interactRange = 2.2 * TILE;
    this.y += 0;
  }
  update() {
    const open = app.char.world.dungeonUnlocked;
    this.s.setFrame(open ? 1 : 0);
  }
  interact(p) {
    const ch = app.char;
    if (!ch.world.dungeonUnlocked && canInteractQuestObject(ch, 'dungeon_gate', this.o.id)) {
      p.startChannel('Mühür etkinleştiriliyor…', 1.6, () => {
        const ups = onInteract(ch, 'dungeon_gate', this.o.id);
        for (const u of ups) bus.emit('questProgress', u);
        sound.play('altar');
        this.scene.fx.burst(this.x, this.y - 40, 0xc070ff, 30, 120, 900);
        bus.emit('toast', { text: 'Derin Ocak\'ın mührü açıldı! Artık sınırsız girebilirsin.', kind: 'ok' });
        app.changed('quest');
        app.requestSave('dungeonUnlock', true);
        this.scene.refreshMarks();
      });
      return;
    }
    const chk = canEnterDungeon(ch);
    if (!chk.ok) { bus.emit('toast', { text: chk.msg, kind: 'warn' }); return; }
    bus.emit('confirm', {
      title: 'Derin Ocak', text: ch.dungeon ? 'Kaldığın koşuya devam et.' : 'Yeni bir koşu başlat. Giriş sınırsızdır; boss ödülü her koşuda bir kez çekilir.',
      ok: 'Gir', onOk: () => this.scene.changeMap('dungeon', ch.dungeon ? null : 'entrance', { enterDungeon: true }),
    });
  }
}

export class PortalObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'portal';
    this.name = o.label;
    // kenar portalları haritanın içine kaydır
    const def = scene.mapDef;
    const ix = Math.min(Math.max(o.x, 1), def.w - 2), iy = Math.min(Math.max(o.y, 1), def.h - 2);
    this.x = ix * TILE + TILE / 2; this.y = iy * TILE + TILE / 2;
    this.s = scene.add.sprite(this.x, this.y, 'obj_portal', 0).setDepth(45).setAlpha(0.9);
    this.s.play('obj_portal_a');
    const ang = o.x <= 0 ? Math.PI : o.x >= def.w - 1 ? 0 : o.y <= 0 ? -Math.PI / 2 : o.y >= def.h - 1 ? Math.PI / 2 : 0;
    this.s.setRotation(ang + Math.PI);
    this.label = scene.add.text(this.x, this.y - 22, '➜ ' + o.label, { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#bfe6ff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(50000);
    this.cool = 1.2;
    this.tapRadius = 30;
    this.interactRange = 0.9 * TILE;
  }
  update(dt) {
    this.cool -= dt;
    const p = this.scene.player;
    if (this.cool > 0 || p.dead) return;
    if (Math.hypot(p.x - this.x, p.y - this.y) < 0.9 * TILE) this.trigger();
  }
  interact() { this.trigger(); }
  trigger() {
    this.cool = 2;
    const o = this.o;
    if (o.dungeonExit) {
      bus.emit('confirm', {
        title: 'Dungeon\'dan çık', text: 'Gönüllü çıkış mevcut koşuyu bitirir. Bir sonraki girişte yeni koşu başlar.',
        ok: 'Çık', onOk: () => this.scene.changeMap(o.to, o.entry, { exitDungeon: true }),
      });
      return;
    }
    this.scene.changeMap(o.to, o.entry);
  }
}

export class FxObj {
  constructor(scene, o) {
    const x = o.x * TILE + TILE / 2, y = o.y * TILE + TILE / 2;
    this.kind = 'fx';
    if (o.fx === 'campfire' || o.fx === 'torch' || o.fx === 'brazier') {
      const key = o.fx === 'brazier' ? 'brazier_fire' : o.fx;
      const s = scene.add.sprite(x, y + (o.fx === 'brazier' ? -14 : 10), 'obj_' + key, 0).setOrigin(0.5, 1).setDepth(100 + y + 12);
      s.play('obj_' + key + '_a');
      s.anims.setProgress(Math.random());
      const l = scene.add.image(x, y - 4, 'light').setScale(o.fx === 'torch' ? 1.6 : 2.2).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
      scene.tweens.add({ targets: l, alpha: 0.32, scale: l.scale * 0.92, yoyo: true, repeat: -1, duration: 300 + Math.random() * 200 });
      scene.lights.push(l);
    } else if (o.fx === 'forge') {
      const l = scene.add.image(x, y + 16, 'light').setScale(2).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
      scene.tweens.add({ targets: l, alpha: 0.25, yoyo: true, repeat: -1, duration: 500 });
    } else if (o.fx === 'chimney') {
      scene.time.addEvent({
        delay: 700, loop: true, callback: () => {
          if (scene.lowPerf) return;
          const s = scene.add.image(x + 12, y - 70, 'obj_smoke').setDepth(60000).setAlpha(0.5);
          scene.tweens.add({ targets: s, y: s.y - 50, x: s.x + 14, alpha: 0, scale: 2, duration: 2600, onComplete: () => s.destroy() });
        },
      });
    }
  }
}

export class CheckpointObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'checkpoint';
    this.s = this.sprite('checkpoint');
    this.name = 'Kontrol Noktası';
  }
  interact() { bus.emit('toast', { text: 'Kontrol noktası: Boss savaşında yenilirsen buradan devam edersin.', kind: 'info' }); }
}
