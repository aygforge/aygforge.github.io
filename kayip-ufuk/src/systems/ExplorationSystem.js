// 38 fixed POIs: discovery, interaction types, guaranteed + HMAC-seeded bonus loot (rolled once, persisted),
// pending loot when inventory is full, 20 unique blueprints, 7 story specials, 15 records, map cells, shortcuts.
import { hmacSha256 } from '../core/util.js';
import { Sfc32 } from '../core/RngStreams.js';
import { PLAYER_INV } from './InventorySystem.js';

export const SPECIAL_INV = 'inv_special';
const CAVE_OF = { POI_COPPER_MINE: 'CAVE_COPPER', POI_BAT_CAVERN: 'CAVE_BATS', POI_UNDERGROUND_POND: 'CAVE_POND' };
const DIVE_TYPES = new Set(['SHALLOW_DIVE', 'DIVE', 'OPEN_UNDERWATER', 'DIVE_AND_OPEN']);
// Repair deposits for POIs whose material list is not specified in POIDB (documented in reports/spec-issues.md)
export const POI_DEPOSITS = { POI_STONE_BRIDGE: { CMP_PLANK: 6, CMP_ROPE: 4 }, POI_CABLE_CAR: { CMP_ROPE: 2, CMP_PLANK: 2 } };
const VERB = {
  SEARCH_WRECK: 'Enkazı ara', OPEN_CHEST: 'Sandığı aç', CLIMB_SHORT: 'Tırman ve ara', SEARCH_HUT: 'Kulübeyi ara', GATHER: 'Topla', CUT_VINES: 'Sarmaşıkları kes',
  REPAIR_WATER: 'Vanaları incele', REPAIR_BRIDGE: 'Köprüyü onar', FIND_HIDDEN_CAVE: 'Şelale arkasını incele', REPAIR_BENCH: 'Tezgâhı onar ve ara', CLIMB_ROPE: 'İple tırman',
  TRACK_SIGNS: 'İzleri takip et', RETRIEVE_LOG: 'Kayıtları al', OPEN_UNDERWATER: 'Su altı kilidini aç', SEARCH_PIER: 'İskeleyi ara', CLEAR_DEBRIS: 'Molozu temizle',
  REPAIR_MECHANISM: 'Mekanizmayı onar', PRY_LOCK: 'Kilidi kırarak aç', ALIGN_COMPASS: 'Gözlem diskini hizala', CONNECT_POWER: 'Röleyi bağla', EXPLORE_CAVE: 'Galeriyi ara',
  UNDERGROUND_FISH: 'Gölet kıyısını ara', READ_RECORDS: 'Kayıtları oku', REPAIR_LOCKER: 'Verici kasasını aç', SEARCH_BUILDING: 'Binayı ara', OPEN_LOCK: 'Kilidi çöz',
  SHALLOW_DIVE: 'Dal ve ara', DIVE: 'Dal ve ara', LOW_TIDE: 'Kumdaki işaretleri incele', REPAIR_ANTENNA: 'Güç dolabını incele', DIVE_AND_OPEN: 'Dal ve kamarayı aç',
  REPAIR_PANEL: 'Paneli onar', SEARCH_GREENHOUSE: 'Serayı ara', SEARCH_SHELTER: 'Sığınağı ara', REPAIR_IRRIGATION: 'Olukları onar',
};

export class ExplorationSystem {
  constructor(game) {
    this.g = game; this.c = game.content;
    this.list = this.c.db.POIDB.pois.map((p) => {
      const [ax, ay] = game.terrain.localToAtlas(p.islandId, ...p.tileLocal);
      const anchor = this.c.db.CollisionNavDB.poiApproachAnchors.find((a) => a.poiId === p.id);
      return { id: p.id, ax, ay, radius: Math.max(2.2, (anchor?.recommendedInteractRadiusTiles || 2) + 0.4), scene: 'OVERWORLD' };
    });
    this.byId = new Map(this.list.map((p) => [p.id, p]));
    this.cellCheckT = 0;
  }
  get s() { return this.g.store.state; }
  poisInScene(scene) { return scene === 'OVERWORLD' ? this.list : []; }
  ps(id) {
    const st = this.s.story.poiStates;
    if (!st[id]) st[id] = { discovered: false, searched: false, puzzleCompleted: false, bonusRolled: false, guaranteedClaimed: false, selectedLoot: null, pendingItems: {}, rewardClaimed: false, deposited: {} };
    return st[id];
  }

  label(id) {
    const poi = this.c.pois.get(id); const st = this.ps(id);
    if (st.rewardClaimed && Object.keys(st.pendingItems).length === 0) {
      if (id === 'POI_WATER_STATION' && this.s.world.worldFlags.WATER_STATION_FIXED) return 'Temiz su al';
      if (id === 'POI_FRUIT_HILL') return 'Meyve topla';
      if (id === 'POI_LIGHTHOUSE') return this.g.escape.lighthouseLabel();
      return poi.name;
    }
    if (Object.keys(st.pendingItems).length) return `Kalan ganimeti al: ${poi.name}`;
    return `${VERB[poi.interactionType] || 'İncele'}: ${poi.name}`;
  }

  // ---------- discovery & exploration XP ----------
  onPlayerMoved() {
    this.cellCheckT++;
    if (this.cellCheckT % 6) return;
    const w = this.g.world; const [tx, ty] = w.playerTile();
    if (w.sceneId === 'OVERWORLD') {
      for (const p of this.list) {
        if (Math.abs(p.ax - tx) > 7 || Math.abs(p.ay - ty) > 7) continue;
        const st = this.ps(p.id);
        if (!st.discovered && Math.hypot(p.ax - tx, p.ay - ty) <= 6) this.discover(p.id);
      }
      const reg = w.regionId();
      if (reg && !this.s.world.visitedRegions.includes(reg)) {
        this.g.store.transaction(`REGION:${reg}`, (tx) => {
          tx.push(this.s.world.visitedRegions, reg);
          this.g.skills.award(tx, 'SKILL_EXPLORATION', 'discoverUniqueRegion', `region:${reg}`);
          tx.emit('region.discovered', { regionId: reg, name: this.c.regions.get(reg).name });
        });
      }
      const isl = w.islandId();
      if (isl && !this.s.world.visitedIslands.includes(isl)) this.s.world.visitedIslands.push(isl);
    }
    // 16x16 exploration cells with reveal radius perk
    const cell = this.c.db.SkillDB.config.explorationCellTiles[0];
    const rr = Math.round(6 * this.g.skills.perk('SKILL_EXPLORATION', 'revealRadiusMultiplier', 1));
    const ex = this.s.world.exploredCells;
    for (const [dx, dy] of [[0, 0], [rr, 0], [-rr, 0], [0, rr], [0, -rr]]) {
      const key = `${w.sceneId}:${Math.floor((tx + dx) / cell)}:${Math.floor((ty + dy) / cell)}`;
      if (!ex[key]) {
        this.g.store.transaction(`CELL:${key}`, (tx) => {
          tx.set(ex, key, 1);
          this.g.skills.award(tx, 'SKILL_EXPLORATION', 'revealNew16By16Cell', `cell:${key}`);
          tx.emit('map.reveal', { key });
        });
      }
    }
  }

  discover(poiId) {
    return this.g.store.transaction(`DISCOVER:${poiId}`, (tx) => {
      const st = this.ps(poiId);
      tx.set(st, 'discovered', true);
      if (!this.s.world.visitedPoiIds.includes(poiId)) tx.push(this.s.world.visitedPoiIds, poiId);
      this.g.skills.award(tx, 'SKILL_EXPLORATION', 'discoverUniquePoi', `poi:${poiId}`);
      tx.add(this.s.stats, 'poisDiscovered', 1);
      tx.emit('poi.discovered', { poiId, name: this.c.pois.get(poiId).name });
    });
  }

  // ---------- requirements ----------
  accessProblem(poiId) {
    const poi = this.c.pois.get(poiId); const acc = poi.access; const inv = this.g.inventory;
    const p = this.s.player;
    if (acc.toolsAnyOf?.length) {
      const has = acc.toolsAnyOf.some((t) => inv.hasItem(t) || (t === 'TOOL_DIVING_MASK' && inv.hasItem('TOOL_DIVING_KIT')));
      if (!has) return `Gerekli: ${acc.toolsAnyOf.map((t) => this.c.itemName(t)).join(' veya ')}`;
    }
    if (DIVE_TYPES.has(poi.interactionType) && !(p.mode === 'SWIM' || p.mode === 'DIVE' || p.mode === 'RAFT' || this.g.world.waterNearby().sea)) return 'Dalmak için suya gir';
    if (poi.interactionType === 'LOW_TIDE' && !this.g.climate.isLowTide()) return `Kum dili şu an su altında — cezir ${this.g.climate.nextLowTideText()}`;
    const dep = POI_DEPOSITS[poiId]; const st = this.ps(poiId);
    if (dep && !st.depositDone) {
      const miss = Object.entries(dep).filter(([id, n]) => (st.deposited[id] || 0) + inv.count([PLAYER_INV], id) < n);
      if (miss.length) return `Onarım için: ${Object.entries(dep).map(([id, n]) => `${this.c.itemName(id)} ${n}`).join(', ')}`;
    }
    return null;
  }

  /** OPEN_POI / interact. Returns {ok, opened:'puzzle'|'loot'|...} */
  interact(poiId) {
    const poi = this.c.pois.get(poiId); const st = this.ps(poiId);
    if (!st.discovered) this.discover(poiId);
    // story records at the POI are always readable (ON_READ_OBJECT)
    for (const rid of poi.storyRecordIds) this.readStory(rid);
    const loot = this.c.poiLoot.get(poiId);
    // repeatable services after claim
    if (st.rewardClaimed && !Object.keys(st.pendingItems).length) return this.repeatService(poiId);
    if (Object.keys(st.pendingItems).length) return this.claimPending(poiId);
    const prob = this.accessProblem(poiId);
    if (prob) { this.g.bus.emit('ui.error', { text: prob }); return { ok: false, code: 'ACCESS', text: prob }; }
    const dep = POI_DEPOSITS[poiId];
    if (dep && !st.depositDone) this.depositRepair(poiId, dep);
    if (poiId === 'POI_LIGHTHOUSE' && loot.rewardClaimTrigger === 'ON_INSPECT_POWER_CABINET') return this.grantReward(poiId);
    if (poi.puzzleId && loot.rewardClaimTrigger === 'ON_PUZZLE_COMPLETED' && !st.puzzleCompleted) {
      this.g.ui?.openPuzzle(poi.puzzleId);
      return { ok: true, opened: 'puzzle' };
    }
    if (poi.puzzleId && !this.s.story.puzzlesById[poi.puzzleId]?.solved && poi.puzzleId !== 'PZ_LIGHTHOUSE_TUNE') {
      this.g.ui?.openPuzzle(poi.puzzleId); return { ok: true, opened: 'puzzle' };
    }
    return this.grantReward(poiId);
  }

  depositRepair(poiId, dep) {
    const st = this.ps(poiId);
    return this.g.store.transaction(`POI_DEPOSIT:${poiId}`, (tx) => {
      for (const [id, n] of Object.entries(dep)) {
        const need = n - (st.deposited[id] || 0);
        if (need > 0) { this.g.inventory.remove(tx, [PLAYER_INV], id, need); tx.set(st.deposited, id, n); }
      }
      tx.set(st, 'depositDone', true);
      if (poiId === 'POI_STONE_BRIDGE') { this.openShortcut(tx, 'GATE_BRIDGE'); tx.set(this.s.world.worldFlags, 'STONE_BRIDGE_REPAIRED', true); tx.set(st, 'repaired', true); }
      if (poiId === 'POI_CABLE_CAR') tx.set(st, 'materialsDeposited', true);
      tx.emit('poi.repaired', { poiId });
    });
  }

  /** Roll bonus loot exactly once with HMAC_SHA256(worldSeed, poiId, lootTableVersion) and persist it. */
  rollBonus(poiId) {
    const loot = this.c.poiLoot.get(poiId); const items = {};
    const h = hmacSha256(String(this.s.world.worldSeed), `${poiId}:${this.c.db.LootTableDB.meta.version}`);
    const dv = new DataView(h.buffer);
    const rng = new Sfc32([dv.getUint32(0), dv.getUint32(4), dv.getUint32(8), dv.getUint32(12) | 1]);
    for (const roll of loot.bonusRolls) {
      if (roll.chancePermille != null && rng.int(0, 999) >= roll.chancePermille) continue;
      const pool = this.c.lootPools.get(roll.poolId);
      const avail = pool.entries.slice();
      for (let i = 0; i < roll.rolls && avail.length; i++) {
        const e = rng.weighted(avail);
        avail.splice(avail.indexOf(e), 1); // allowDuplicateItemIdAcrossSlots: false
        items[e.itemId] = (items[e.itemId] || 0) + rng.int(e.min, e.max);
      }
    }
    if (!Object.keys(items).length) items.MAT_FIBER = 2; // bonusLootNeverEmpty
    return items;
  }

  grantReward(poiId) {
    const poi = this.c.pois.get(poiId); const st = this.ps(poiId); const loot = this.c.poiLoot.get(poiId);
    if (st.rewardClaimed) return { ok: false, code: 'ALREADY_CLAIMED' };
    const r = this.g.store.transaction(`POI_REWARD:${poiId}`, (tx) => {
      this.g.store.claim(tx, `${poiId}:REWARD_V1`);
      if (!st.bonusRolled) { tx.set(st, 'selectedLoot', this.rollBonus(poiId)); tx.set(st, 'bonusRolled', true); }
      tx.set(st, 'searched', true);
      const pending = {};
      for (const [id, n] of Object.entries(poi.reward.guaranteedItems || {})) pending[id] = (pending[id] || 0) + n;
      for (const [id, n] of Object.entries(st.selectedLoot)) pending[id] = (pending[id] || 0) + n;
      // unique: blueprint learned immediately; story special into key-item pocket (never lost/dropped)
      const bp = loot.guaranteedBlueprintId;
      if (bp && !this.s.story.learnedBlueprints.includes(bp)) {
        this.g.store.claim(tx, `BP:${bp}`);
        tx.push(this.s.story.learnedBlueprints, bp);
        tx.emit('blueprint.learned', { blueprintId: bp, name: this.c.blueprints.get(bp) });
      }
      const sp = loot.guaranteedStorySpecialId;
      if (sp && !this.s.story.specialItemsGranted.includes(sp)) {
        this.g.store.claim(tx, `SPECIAL:${sp}`);
        tx.push(this.s.story.specialItemsGranted, sp);
        this.g.inventory.add(tx, SPECIAL_INV, sp, 1);
        tx.emit('special.found', { itemId: sp, name: this.c.itemName(sp) });
      }
      // deliver what fits; the rest waits safely at the POI
      const left = {};
      for (const [id, n] of Object.entries(pending)) {
        const over = this.g.inventory.add(tx, PLAYER_INV, id, n);
        if (over > 0) left[id] = over;
      }
      tx.set(st, 'pendingItems', left);
      tx.set(st, 'guaranteedClaimed', true);
      tx.set(st, 'rewardClaimed', true);
      tx.emit('poi.looted', { poiId, items: pending, pending: left });
      return { pending, left };
    });
    if (r.ok) { this.g.escape.checkStory15(); this.g.persistence?.checkpoint('poi_reward'); }
    return r;
  }

  claimPending(poiId) {
    const st = this.ps(poiId);
    return this.g.store.transaction(null, (tx) => {
      const left = {};
      for (const [id, n] of Object.entries(st.pendingItems)) { const over = this.g.inventory.add(tx, PLAYER_INV, id, n); if (over > 0) left[id] = over; }
      tx.set(st, 'pendingItems', left);
      if (Object.keys(left).length) tx.emit('ui.toast', { text: 'Çanta dolu — kalan eşyalar burada bekliyor' });
      tx.emit('poi.looted', { poiId, pending: left });
    });
  }

  repeatService(poiId) {
    const day = this.s.clock.dayIndex; const st = this.ps(poiId);
    if (poiId === 'POI_WATER_STATION' && this.s.world.worldFlags.WATER_STATION_FIXED) {
      st.springDay !== day && (st.springDay = day, st.springTaken = 0);
      const avail = 6 - (st.springTaken || 0);
      if (avail <= 0) { this.g.bus.emit('ui.toast', { text: 'Bugünkü süzülmüş su bitti (6/gün)' }); return { ok: false }; }
      const n = Math.min(avail, this.g.inventory.spaceFor(PLAYER_INV, 'WATER_CLEAN'));
      if (n <= 0) { this.g.bus.emit('ui.error', { text: 'Su taşıyacak kap yok' }); return { ok: false }; }
      return this.g.store.transaction(`SPRING:${day}:${st.springTaken || 0}`, (tx) => { this.g.inventory.add(tx, PLAYER_INV, 'WATER_CLEAN', n); tx.set(st, 'springTaken', (st.springTaken || 0) + n); tx.emit('water.taken', { n }); });
    }
    if (poiId === 'POI_FRUIT_HILL') {
      if (st.fruitDay === day) { this.g.bus.emit('ui.toast', { text: 'Meyveler yarın yeniden olgunlaşır' }); return { ok: false }; }
      return this.g.store.transaction(`FRUIT_HILL:${day}`, (tx) => { tx.set(st, 'fruitDay', day); this.g.giveOrDrop(tx, 'FOOD_BERRY', 3); this.g.giveOrDrop(tx, 'MAT_FIBER', 2); });
    }
    if (poiId === 'POI_LIGHTHOUSE') return this.g.escape.lighthouseInteract();
    if (CAVE_OF[poiId]) return this.g.caves.enter(CAVE_OF[poiId]);
    this.g.bus.emit('ui.toast', { text: 'Burası zaten arandı' });
    return { ok: false, code: 'ALREADY_CLAIMED' };
  }

  readStory(recordId) {
    if (this.s.story.storyRecordsRead.includes(recordId)) return false;
    this.s.story.storyRecordsRead.push(recordId);
    this.s.world.worldFlags[`STORY_READ_${recordId}`] = true;
    this.g.bus.emit('story.read', { recordId, title: this.c.stories.get(recordId).title });
    return true;
  }

  openShortcut(tx, gateId) {
    if (this.s.world.openedShortcuts.includes(gateId)) return;
    tx.push(this.s.world.openedShortcuts, gateId);
    this.g.terrain.openGates.add(gateId);
    tx.emit('shortcut.opened', { gateId });
  }
  syncGates() {
    this.g.terrain.openGates = new Set(this.s.world.openedShortcuts);
    if (this.g.inventory.hasItem('TOOL_CLIMB_KIT')) this.g.terrain.openGates.add('GATE_CLIMB');
  }

  visualState(poiId) {
    const st = this.s.story.poiStates[poiId];
    const repairedSprite = this.c.atlasSprites[`poi/${poiId}/repaired`];
    if (repairedSprite && (st?.repaired || st?.puzzleCompleted && poiId !== 'POI_LIGHTHOUSE' || (poiId === 'POI_LIGHTHOUSE' && this.g.escape?.stationBuilt()))) return 'repaired';
    if (st?.rewardClaimed) return 'searched';
    return 'default';
  }
}
