// Dokunulabilir dünya nesneleri: NPC, Yol Taşı, sunak, toplama düğümleri, görev nesneleri, Derin Ocak kapısı.
// Dokununca karakter etkileşim menziline otomatik yaklaşır, sonra işlem/arayüz açılır.
import Phaser from 'phaser';
import { net } from '../online/gameServer.js';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { TILE } from '../data/constants.js';
import { NPCS } from '../data/npcs.js';
import { WAYSTONES, ALTAR_COOLDOWN, GATHER_RESPAWN } from '../data/maps/index.js';
import { STACKABLES } from '../data/materials.js';
import { npcQuestMark, canInteractQuestObject, onInteract, interactRequirement } from '../systems/quests.js';
import { rollGather, rollAltar } from '../systems/loot.js';
import { addStack, stackCapacity } from '../systems/inventory.js';
import { canEnterDungeon, isDungeonUnlocked, getRun, breakSeal, currentStage, DUNGEON_INFO, runComplete } from '../systems/dungeon.js';
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
    const m = npcQuestMark(app.char, this.npc.id);
    const ready = m === 'ready', avail = m === 'avail';
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
    // V2: Yol Taşı'nı etkinleştirme görev hedefi (ör. "Ayaz'a Giden Yol")
    if (this.o.group && Math.hypot(p.x - this.x, p.y - this.y) < 3 * TILE && canInteractQuestObject(app.char, this.o.group, this.o.id)) {
      const ups = onInteract(app.char, this.o.group, this.o.id);
      for (const u of ups) bus.emit('questProgress', u);
      app.changed('quest');
      app.requestSave('questObject', true);
      this.scene.refreshMarks();
    }
  }
  interact() { bus.emit('openTravel', this.o.id); }
}

// kazma ile toplanan düğümler (geri kalanlar ot)
const ORE_KINDS = ['iron_ore', 'hard_ore', 'ash_ore', 'frost_crystal', 'dark_ore', 'obsidian_ore', 'soul_crystal', 'storm_ore', 'astral_crystal'];

export class GatherObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'gather';
    this.mat = o.kind;
    this.name = STACKABLES[o.kind].name;
    const ore = ORE_KINDS.includes(o.kind);
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
    const ore = ORE_KINDS.includes(this.mat);
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

const QOBJ_SPRITE = {
  wolf_track: 'track', hunter_cache: 'chest', purify_stone: 'purify', swamp_ruin: 'ruin', lost_miner: null,
  lost_caravan: 'caravan_wreck', ember_relic: 'ember_relic', scout_tracks: 'track', lost_scout: null, winter_relic: 'winter_relic',
};
const QOBJ_NPC = { lost_miner: 'npc_miner', lost_scout: 'npc_scout' };
const QOBJ_FLAT = new Set(['wolf_track', 'scout_tracks']);

export class QuestObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'qobj';
    this.name = o.label;
    const npcKey = o.look || QOBJ_NPC[o.group];
    if (npcKey) {
      this.s = scene.add.sprite(this.x, this.y, npcKey, 'idle0').setOrigin(0.5, 28.5 / 30).setDepth(100 + this.y);
      this.s.play(npcKey + '_idle');
      this.height = 60;
    } else {
      const flat = o.flat ?? QOBJ_FLAT.has(o.group);
      this.s = this.sprite(o.sprite || QOBJ_SPRITE[o.group], false, flat ? 0.5 : 1);
      if (flat) this.s.setDepth(30);
      this.height = flat ? 12 : 44;
    }
    this.glow = scene.add.image(this.x, this.y - this.height / 2, 'light').setScale(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
  }
  isDone() {
    // görev aşaması kalıcı olarak etkinleştirildiyse görünüm değişir (V3: çok adımlı nesnede son adım beklenir)
    const id = this.o.id;
    const used = Object.values(app.char.quests).some((q) => q.used?.some((u) => u === id || u.startsWith(id + '#')));
    return used && !canInteractQuestObject(app.char, this.o.group, id, this.o.order ?? null);
  }
  update(dt) {
    const active = canInteractQuestObject(app.char, this.o.group, this.o.id, this.o.order ?? null, true);
    this.glow.setAlpha(active ? 0.35 + Math.sin(this.scene.clock / 300) * 0.15 : 0);
    const done = this.isDone();
    if (this.s.texture.key.startsWith('obj_')) this.s.setFrame(done ? 1 : 0);
  }
  interact(p) {
    const ord = this.o.order ?? null;
    if (!canInteractQuestObject(app.char, this.o.group, this.o.id, ord)) {
      bus.emit('toast', { text: this.isDone() ? (this.o.doneSay || 'Bunu zaten inceledin') : (this.o.idleSay || 'Şu an burada yapılacak bir şey yok'), kind: 'info', short: true });
      return;
    }
    // V3: sıra, onarım/arındırma materyali ve işlem süresi
    const req = interactRequirement(app.char, this.o.group, this.o.id, ord);
    if (!req.ok) { bus.emit('toast', { text: req.msg, kind: 'warn' }); sound.play('error'); return; }
    const verb = { repair: 'Onarılıyor…', purify: 'Arındırılıyor…', dig: 'Kazılıyor…', activate: 'Etkinleştiriliyor…', write: 'Yazılıyor…' }[req.mode] || 'İnceleniyor…';
    p.startChannel(verb, req.channel, () => {
      const ups = onInteract(app.char, this.o.group, this.o.id, ord);
      if (!ups.length) return;
      if (req.mode === 'purify' || req.mode === 'activate') this.scene.fx.burst(this.x, this.y - 20, this.o.fxColor || 0x7af0ff, 20, 80, 800);
      if (req.mode === 'repair') { sound.play('anvil'); this.scene.fx.sprite('spark', this.x, this.y - 18, { scale: 1.8 }); }
      if (this.o.say) bus.emit('toast', { text: this.o.say, kind: 'info' });
      for (const u of ups) bus.emit('questProgress', u);
      if (this.o.group === 'purify_stone') { sound.play('altar'); this.scene.fx.burst(this.x, this.y - 20, 0x7af0ff, 20, 80, 800); }
      else sound.play('quest');
      if (this.o.group === 'lost_miner') bus.emit('toast', { text: 'Kadir: "Sonunda biri geldi! Kardeşime iyi olduğumu söyle."', kind: 'info' });
      const say = {
        lost_scout: 'Tamer: "Akrepler bacağımı zehirledi... Demre\'ye ulaşırım, sağ ol."',
        lost_caravan: 'Enkazdan yanık bir kervan defteri çıktı: "Kızıl Yarıklar\'a sürüklendik..."',
        ember_relic: 'Kalıntının içinde kor atıyor — sanki doğudaki kalderaya bağlı.',
      }[this.o.group];
      if (say) bus.emit('toast', { text: say, kind: 'info' });
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
      ok: 'Uyandır', onOk: () => (this.scene.spawner?.net ? net.questEvent(this.o.id) : this.start()),
    });
  }
  // ortak dünya: sunak sunucuda; bitince bekleme süren dolmuşsa ödülünü al
  netStart() { this.event = { net: true }; sound.play('altar'); bus.emit('toast', { text: `${this.name} uyandı! Dalga 1/${this.o.waves.length}`, kind: 'elite' }); }
  netEnd(done) {
    this.event = null;
    if (!done) { bus.emit('toast', { text: `${this.name} sustu`, kind: 'info' }); return; }
    if (!this.ready) { bus.emit('toast', { text: `${this.name} arındırıldı (sunağın senin için dinleniyor — ödül yok)`, kind: 'info' }); return; }
    this.reward();
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
    this.reward();
  }
  // tamamlandı — tek seferlik ödül, sonra bekleme süresi
  reward() {
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
    this.dId = o.dungeon || 'dungeon';
    this.info = DUNGEON_INFO[this.dId];
    this.group = o.group || this.info.gateGroup;
    this.name = this.info.name + ' Kapısı';
    this.s = this.sprite({ dungeon: 'dungeon_gate', dark_crypt: 'crypt_gate', astral_sanctum: 'sanctum_gate' }[this.dId] || 'frost_gate', false);
    this.height = 90;
    this.tapRadius = 44;
    this.interactRange = 2.2 * TILE;
  }
  update() {
    this.s.setFrame(isDungeonUnlocked(app.char, this.dId) ? 1 : 0);
  }
  interact(p) {
    const ch = app.char;
    const name = this.info.name;
    if (!isDungeonUnlocked(ch, this.dId) && canInteractQuestObject(ch, this.group, this.o.id)) {
      p.startChannel('Mühür etkinleştiriliyor…', 1.6, () => {
        const ups = onInteract(ch, this.group, this.o.id);
        for (const u of ups) bus.emit('questProgress', u);
        sound.play('altar');
        this.scene.fx.burst(this.x, this.y - 40, this.dId === 'frost_temple' ? 0x9fe8ff : 0xc070ff, 30, 120, 900);
        bus.emit('toast', { text: `${name} mührü açıldı! Artık sınırsız girebilirsin.`, kind: 'ok' });
        app.changed('quest');
        app.requestSave('dungeonUnlock', true);
        this.scene.refreshMarks();
      });
      return;
    }
    const chk = canEnterDungeon(ch, this.dId);
    if (!chk.ok) { bus.emit('toast', { text: chk.msg, kind: 'warn' }); return; }
    // biten koşu (boss yenildi) devam ettirilmez: girişte yeni koşu başlar
    const run = getRun(ch, this.dId);
    const resume = run && !runComplete(run, this.dId);
    bus.emit('confirm', {
      title: name, text: resume ? 'Kaldığın koşuya devam et.' : 'Yeni bir koşu başlat. Giriş sınırsızdır; boss ödülü her koşuda bir kez çekilir.',
      ok: 'Gir', onOk: () => this.scene.changeMap(this.dId, resume ? null : 'entrance', { enterDungeon: true }),
    });
  }
}

// V2: gizli sandık — karakter başına bir kez açılır (kayıtta world.chests)
export class ChestObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'chest';
    this.name = 'Gizli Sandık';
    this.s = this.sprite('chest', false);
    this.s.setScale(1.3);
    this.glow = scene.add.image(this.x, this.y - 12, 'light').setScale(0.45).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
    this.height = 30;
  }
  get opened() { return !!app.char.world.chests?.[this.o.id]; }
  update() {
    const op = this.opened;
    this.s.setFrame(op ? 1 : 0);
    this.glow.setAlpha(op ? 0 : 0.25 + Math.sin(this.scene.clock / 400) * 0.1);
  }
  interact(p) {
    if (this.opened) { bus.emit('toast', { text: 'Sandık boş', kind: 'info', short: true }); return; }
    p.startChannel('Sandık açılıyor…', 1.2, () => {
      const ch = app.char;
      if (ch.world.chests?.[this.o.id]) return;
      // önce yer kontrolü: hiçbir ödül kaybolmasın
      const loot = this.o.loot.map((l) => ({ id: l.id, qty: app.rng.int(l.qty[0], l.qty[1]) }));
      if (loot.some((l) => stackCapacity(ch.bag, l.id) < l.qty)) { bus.emit('toast', { text: 'Çantada yer aç, sonra sandığı aç', kind: 'warn' }); return; }
      (ch.world.chests = ch.world.chests || {})[this.o.id] = Date.now();
      const gold = app.rng.int(this.o.gold[0], this.o.gold[1]);
      ch.gold += gold;
      bus.emit('loot', { name: 'Gold', qty: gold, icon: 'ui:gold', r: 'U' });
      for (const l of loot) { addStack(ch.bag, l.id, l.qty); bus.emit('loot', { name: STACKABLES[l.id].name, qty: l.qty, icon: l.id, r: 'R' }); }
      sound.play('coin'); sound.play('drop_r');
      this.scene.fx.lootBeam(this.x, this.y, 0xffd060);
      bus.emit('toast', { text: 'Gizli sandık bulundu!', kind: 'level' });
      app.changed('inventory');
      app.requestSave('chest', true);
    });
  }
}

// V2: Buz Mabedi mühür taşı — dokununca kısa bir karşılaşma başlar; yaratıklar yenilince mühür kırılır
export class SealObj extends Base {
  constructor(scene, o) {
    super(scene, o);
    this.kind = 'seal';
    this.name = o.label;
    this.seal = scene.mapDef.seals.find((x) => x.id === o.id);
    this.stage = this.seal.stage || 3;
    this.lever = this.seal.kind === 'lever';
    // V4: Gökyarık Mabedi — enerji düğümleri (gerçek: 'lever', yanıltıcı: 'decoy') ve gök mühürleri
    this.decoy = this.seal.kind === 'decoy';
    const sanctum = scene.mapId === 'astral_sanctum';
    this.s = this.sprite(sanctum ? (this.lever || this.decoy ? 'energy_node' : 'sanctum_seal')
      : this.lever ? 'crypt_lever' : scene.mapId === 'dark_crypt' ? 'royal_seal_dg' : 'temple_seal', false);
    this.light = scene.add.image(this.x, this.y - 30, 'light_blue').setScale(0.6).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
    if (scene.mapId === 'dark_crypt') this.light.setTint(0xb080ff);
    // yanıltıcı düğüm sönük görünür (ipucu: gerçek düğümlerin ışığı parlak)
    if (this.decoy) this.light.setAlpha(0.12);
    this.height = 56;
    this.interactRange = 1.8 * TILE;
  }
  get broken() { return !!getRun(app.char, this.scene.mapId)?.seals?.includes(this.o.id); }
  refresh() { this.update(); }
  update() {
    if (this.decoy) { this.s.setFrame(2); return; }
    const br = this.broken, active = this.scene.spawner?.sealWaveAlive?.(this.o.id);
    this.s.setFrame(br ? 2 : active ? 1 : 0);
    this.light.setVisible(!br);
  }
  interact(p) {
    const sc = this.scene, ch = app.char;
    const group = sc.mapDef.seals.filter((x) => (x.stage || 3) === this.stage);
    const done = () => group.filter((x) => getRun(ch, sc.mapId)?.seals?.includes(x.id)).length;
    if (this.decoy) {
      // zararsız ipucu: yanlış düğüm hiçbir şeyi bozmaz, yalnız doğru yönü gösterir
      bus.emit('toast', { text: this.seal.hint || 'Bu düğüm sönük; enerji buradan akmıyor. Işığı parlak olan düğümleri ara.', kind: 'info' });
      sound.play('error');
      return;
    }
    if (this.broken) { bus.emit('toast', { text: `${this.name} zaten ${this.lever ? 'etkin' : 'kırıldı'}`, kind: 'info', short: true }); return; }
    if (currentStage(ch, sc.mapId) < this.stage) {
      bus.emit('toast', { text: this.lever ? 'Mekanizma, zindana giden kapı açılmadan çalışmaz.' : 'Mühür, galeriye giden yol açılmadan uyanmaz.', kind: 'info' });
      return;
    }
    // ortak dünya (parti dungeon'u): mühür/mekanizma sunucuda; sonuç herkese bildirilir
    if (sc.spawner?.net) {
      if (this.lever) p.startChannel('Mekanizma çevriliyor…', 2.2, () => net.seal(this.o.id));
      else if (sc.spawner.sealWaveAlive(this.o.id)) bus.emit('toast', { text: 'Mührün muhafızları hâlâ ayakta!', kind: 'warn', short: true });
      else net.seal(this.o.id);
      return;
    }
    if (this.lever) {
      // kapı mekanizması: kısa kanal, karşılaşma yok; ikisi birden etkinleşince bölüm kapısı açılabilir
      p.startChannel('Mekanizma çevriliyor…', 2.2, () => {
        if (this.broken || !breakSeal(ch, sc.mapId, this.o.id)) return;
        sound.play('portal');
        bus.emit('toast', { text: `${this.name} etkinleşti (${done()}/${group.length})`, kind: 'ok' });
        this.refresh();
        app.requestSave('seal', true);
        sc.checkStageCleared(this.stage);
      });
      return;
    }
    if (sc.spawner.sealWaveAlive(this.o.id)) { bus.emit('toast', { text: 'Mührün muhafızları hâlâ ayakta!', kind: 'warn', short: true }); return; }
    if (sc.spawner.spawnSealWave(this.seal)) {
      sound.play('shield');
      bus.emit('toast', { text: `${this.name} uyandı! Muhafızlarını yen. (${done()}/${group.length})`, kind: 'elite' });
    }
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
    this.tapRadius = 48;
    this.interactRange = 1.2 * TILE;
    // kenar geçişi: okun tam üstü değil, geçidin tamamı (kenara 2,6 tile, ok ekseninde ±3,5 tile) tetikler
    this.edge = o.x <= 0 ? 'w' : o.x >= def.w - 1 ? 'e' : o.y <= 0 ? 'n' : o.y >= def.h - 1 ? 's' : null;
    this.cx = ix + 0.5; this.cy = iy + 0.5;
  }
  inZone(p) {
    const tx = p.x / TILE, ty = p.y / TILE, def = this.scene.mapDef;
    if (!this.edge) return Math.hypot(tx - this.cx, ty - this.cy) < 1.6;
    const horiz = this.edge === 'w' || this.edge === 'e';
    const along = horiz ? Math.abs(ty - this.cy) : Math.abs(tx - this.cx);
    const depth = { w: tx, e: def.w - tx, n: ty, s: def.h - ty }[this.edge];
    return along <= 3.5 && depth <= 2.6;
  }
  update(dt) {
    this.cool -= dt;
    const lk = this.locked();
    if (lk !== this._lk) { this._lk = lk; this.s.setTint(lk ? 0x707070 : 0xffffff).setAlpha(lk ? 0.55 : 0.9); this.label.setText((lk ? '✖ ' : '➜ ') + this.o.label + (lk ? ' (kapalı)' : '')); }
    const p = this.scene.player;
    if (this.cool > 0 || p.dead) return;
    // bölgeden bir kez çıkılmadan yeniden tetiklenmez (ör. dungeon çıkış onayı tekrar tekrar açılmaz)
    const inside = this.inZone(p);
    if (!inside) this.armed = true;
    else if (this.armed) { this.armed = false; this.trigger(); }
  }
  interact() { this.trigger(); }
  locked() {
    const req = this.o.requires;
    if (!req) return false;
    if (req.quest && !app.char.quests[req.quest]) return true;
    if (req.flag && !app.char.world.flags?.[req.flag]) return true;
    return false;
  }
  trigger() {
    this.cool = 2; this.armed = false;
    const o = this.o;
    if (this.locked()) { bus.emit('toast', { text: o.requires.msg, kind: 'warn' }); return; }
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
