// Spawn / respawn: kamp popülasyonları (aktif oyun süresiyle), elit katkı kuralı, boss zamanlayıcıları,
// dungeon bölüm yaratıkları, sunak dalgaları ve çağrılan yardımcılar.
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { ENEMIES } from '../data/enemies.js';
import { ELITE_RULE } from '../data/maps/index.js';
import { TILE } from '../data/constants.js';
import { Enemy } from '../entities/Enemy.js';
import { Rng } from '../core/rng.js';
import { getRun } from '../systems/dungeon.js';
import { huntSpawns } from '../systems/quests.js';

export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.slots = [];
    this.hunts = {};   // V3: görev varyantı avları (anahtar → yaratık)
    this.elites = [];
    this.bosses = [];
    this.checkT = 0;
  }

  get world() { return app.char.world; }
  get now() { return this.world.activeTime; }

  init() {
    const sc = this.scene, def = sc.mapDef;
    if (def.dungeon) { this.initDungeon(); return; }
    for (const a of def.areas || []) {
      if (a.spawns) {
        for (const s of a.spawns) for (let i = 0; i < s.max; i++) {
          const slot = { area: a, enemy: s.enemy, ent: null, respawnAt: 0 };
          this.slots.push(slot);
          this.spawnSlot(slot, true);
        }
      }
      if (a.elite) this.elites.push({ area: a, enemy: a.elite, ent: null });
      if (a.boss) this.bosses.push({ area: a, enemy: a.boss, ent: null });
    }
    this.checkSpecial();
  }

  randomCell(area, awayFromPlayer = true, rng = Math.random) {
    const cells = this.scene.built.areaCells[area.id] || [];
    const p = this.scene.player;
    for (let k = 0; k < 30; k++) {
      const [x, y] = cells[Math.floor(rng() * cells.length)];
      const px = x * TILE + TILE / 2, py = y * TILE + TILE / 2;
      if (!awayFromPlayer || !p || Math.hypot(px - p.x, py - p.y) > 6 * TILE) return { x: px, y: py };
    }
    const [x, y] = cells[Math.floor(rng() * cells.length)] || [area.x, area.y];
    return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
  }

  spawnEnemy(id, x, y, opts = {}) {
    const e = new Enemy(this.scene, ENEMIES[id], x, y, opts);
    this.scene.enemies.push(e);
    return e;
  }

  spawnSlot(slot, initial = false) {
    const pos = this.randomCell(slot.area, !initial);
    slot.ent = this.spawnEnemy(slot.enemy, pos.x, pos.y, { spawnRef: slot });
    if (slot.area.noRespawnDelay) slot.ent.home = { x: pos.x, y: pos.y };
  }

  spawnSummon(id, x, y) {
    const g = this.scene.grid;
    let px = x, py = y;
    if (g.blockedAt(px, py)) { px = this.scene.player.x; py = this.scene.player.y - TILE; if (g.blockedAt(px, py)) return null; }
    return this.spawnEnemy(id, px, py, { summoned: true });
  }

  despawn(e) {
    if (e.dead) return;
    e.dead = true;
    e.destroy();
  }

  // V3: aktif görevin özel av hedefi (ör. Yaralı Alfa İzcisi) — görev sürerken haritada bir tane bulunur.
  // Kalıcı boss değildir; EXP verir, ekipman düşürmez (şablonda lootTable yok).
  checkHunts() {
    const want = huntSpawns(app.char, this.scene.mapId);
    const keys = new Set(want.map((w) => w.key));
    for (const [k, e] of Object.entries(this.hunts)) {
      if (!keys.has(k) && e && !e.dead) this.despawn(e);
      if (!keys.has(k) || (e && e.dead)) delete this.hunts[k];
    }
    for (const w of want) {
      const cur = this.hunts[w.key];
      if (cur && !cur.dead) continue;
      const x = w.x * TILE + TILE / 2, y = w.y * TILE + TILE / 2;
      const p = this.scene.player;
      if (p && Math.hypot(p.x - x, p.y - y) < 5 * TILE) continue;   // oyuncunun dibinde doğmaz
      const e = this.spawnEnemy(w.enemy, x, y, { leashR: 14 * TILE });
      e.huntKey = w.key;
      this.hunts[w.key] = e;
    }
  }

  // Elitler ve boss'lar (aktif süre tabanlı)
  checkSpecial() {
    const mapId = this.scene.mapId;
    this.checkHunts();
    for (const el of this.elites) {
      if (el.ent && !el.ent.dead) continue;
      const st = this.world.elite[mapId] || (this.world.elite[mapId] = { kills: 0, lastDeath: -1e9 });
      if (st.kills >= ELITE_RULE.killsNeeded && this.now - st.lastDeath >= ELITE_RULE.minActiveSec) {
        const pos = this.randomCell(el.area, true);
        el.ent = this.spawnEnemy(el.enemy, pos.x, pos.y, { spawnRef: el });
        el.ent.home = { x: el.area.x * TILE, y: el.area.y * TILE };
        bus.emit('toast', { text: `${ENEMIES[el.enemy].name} ${el.area.name} bölgesinde ortaya çıktı!`, kind: 'elite' });
      }
    }
    for (const b of this.bosses) {
      if (b.ent && !b.ent.dead) continue;
      const at = this.world.bossRespawnAt[b.enemy] || 0;
      if (this.now >= at) {
        const serial = (this.world.bossSerial = this.world.bossSerial || {});
        serial[b.enemy] = (serial[b.enemy] || 0) + 1;
        b.ent = this.spawnEnemy(b.enemy, b.area.x * TILE, b.area.y * TILE, { spawnRef: b, leashR: (b.area.r + 6) * TILE });
        b.ent.killId = `${b.enemy}:${app.char.id}:${serial[b.enemy]}`;
      }
    }
  }

  update(dt) {
    this.checkT -= dt;
    if (this.checkT > 0) return;
    this.checkT = 0.5;
    for (const s of this.slots) {
      if (s.ent && !s.ent.dead) continue;
      if (this.now >= s.respawnAt) this.spawnSlot(s);
    }
    this.checkSpecial();
  }

  onEnemyDeath(e) {
    const ref = e.spawnRef;
    const mapId = this.scene.mapId;
    if (ref && this.slots.includes(ref)) {
      ref.ent = null;
      const base = e.tpl.respawn || 20;
      ref.respawnAt = this.now + base * (0.8 + Math.random() * 0.4);
    }
    // Elit katkısı yalnız elitin kendi kampındaki öldürmelerden gelir (belge: alan-kesim katkısı)
    if (e.tpl.kind === 'normal' && ref && this.elites.some((el) => el.area === ref.area)) {
      const st = this.world.elite[mapId] || (this.world.elite[mapId] = { kills: 0, lastDeath: -1e9 });
      st.kills++;
    }
    if (ref && this.elites.includes(ref)) {
      ref.ent = null;
      this.world.elite[mapId] = { kills: 0, lastDeath: this.now };
    }
    if (ref && this.bosses.includes(ref)) {
      ref.ent = null;
      this.world.bossRespawnAt[e.tpl.id] = this.now + (e.tpl.respawn || 600);
    }
    if (e.altar) e.altar.onWaveEnemyDead(e);
  }

  // ------------------------------------------------------------- dungeon
  initDungeon() {
    const sc = this.scene, def = sc.mapDef, run = getRun(app.char, sc.mapId);
    const rng = new Rng(hashStr(run.runId));
    this.sealWaves = {};
    for (const [stageStr, list] of Object.entries(def.stages)) {
      const stage = +stageStr;
      if (run.cleared.includes(stage)) continue;
      if (stage === 4) {
        if (run.bossKilled) continue;
        const g = this.spawnEnemy(def.boss || 'mine_golem', def.bossSpawn.x * TILE, def.bossSpawn.y * TILE, { stage, leashR: 13 * TILE });
        this.golem = g;   // (adı V1'den; zindanın bossu)
        continue;
      }
      const area = def.areas.find((a) => a.stage === stage);
      for (const [id, n] of list) {
        for (let i = 0; i < n; i++) {
          const pos = this.randomCell(area, false, () => rng.float());
          this.spawnEnemy(id, pos.x, pos.y, { stage, leashR: 10 * TILE });
        }
      }
    }
  }

  stageAlive(stage) {
    return this.scene.enemies.some((e) => !e.dead && e.stage === stage);
  }

  // Mühür Galerisi: mühür karşılaşması (yaratıklar 3. bölüme sayılır; kırılan mühür koşuda kalıcı)
  spawnSealWave(seal) {
    if (this.sealWaves[seal.id]?.some((e) => !e.dead)) return false;
    const sc = this.scene;
    const list = [];
    let i = 0;
    for (const [id, n] of seal.wave) for (let k = 0; k < n; k++, i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      let x = (seal.x + 0.5) * TILE + Math.cos(a) * 2.6 * TILE, y = (seal.y + 0.5) * TILE + Math.sin(a) * 2 * TILE;
      if (sc.grid.blockedAt(x, y)) { x = (seal.x + 0.5) * TILE; y = (seal.y + 2) * TILE; }
      const e = this.spawnEnemy(id, x, y, { stage: 3, leashR: 12 * TILE });
      e.sealId = seal.id;
      e.aggro(sc.player);
      sc.fx.sprite('shatter', x, y - 20, { scale: 1.8 });
      list.push(e);
    }
    this.sealWaves[seal.id] = list;
    return true;
  }

  sealWaveAlive(sealId) {
    return (this.sealWaves?.[sealId] || []).some((e) => !e.dead);
  }

  resetGolem() {
    const g = this.golem;
    if (!g || g.dead) return;
    g.behavior?.reset();
    g.hp = g.maxHp;
    g.x = g.home.x; g.y = g.home.y;
    g.state = 'idle'; g.casting = null; g.windup = null; g.engaged = false;
    g.sync();
    g.drawBar();
  }
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
