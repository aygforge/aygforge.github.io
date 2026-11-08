// 12 land + 3 marine species near-camera simulation with species AI, hunting, predators,
// decorative underwater fish, and the two immortal companions (parrot, monkey). No human NPCs exist.
import { TILE, T } from '../world/TerrainSystem.js';
import { clamp, facingFromVec } from '../core/util.js';
import { PLAYER_INV } from './InventorySystem.js';

const PET_SPECIES = { ANIMAL_FOREST_BIRD: 'parrot', ANIMAL_MONKEY: 'monkey' };
const PET_FOOD = { parrot: { fitting: ['FOOD_BANANA', 'CROP_PINEAPPLE'], favorite: ['FOOD_BERRY'] }, monkey: { fitting: ['FOOD_BERRY', 'FOOD_COCONUT'], favorite: ['FOOD_BANANA'] } };
const WEAPONS = { TOOL_WOOD_SPEAR: { dmg: 15, range: 1.6 }, TOOL_IRON_SPEAR: { dmg: 30, range: 1.8 }, TOOL_STONE_KNIFE: { dmg: 9, range: 1.3 }, TOOL_MACHETE: { dmg: 18, range: 1.4 },
  TOOL_BOW: { dmg: 25, range: 6, ammo: 'CMP_ARROW' }, TOOL_HUNTER_BOW: { dmg: 40, range: 7, ammo: 'CMP_ARROW' }, TOOL_SLING: { dmg: 12, range: 5, ammo: 'CMP_SLING_STONE' },
  TOOL_STONE_AXE: { dmg: 10, range: 1.3 }, TOOL_COPPER_AXE: { dmg: 14, range: 1.3 }, TOOL_IRON_AXE: { dmg: 18, range: 1.3 } };
let seq = 0;

export class WildlifeSystem {
  constructor(game) { this.g = game; this.spawnT = 0; this.fishT = 0; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }
  get w() { return this.g.world; }

  label(a) {
    if (a.pet) return `${a.name || 'Dost'} (${this.trustTier(a.petData.trust)})`;
    const sp = this.c.species.get(a.speciesId);
    if (PET_SPECIES[a.speciesId]) return `Yaklaş: ${sp.name}`;
    return sp.huntable ? `Avla: ${sp.name}` : `Gözlemle: ${sp.name}`;
  }
  trustTier(t) { const th = this.c.db.AnimalDB.pets.trustThresholds; for (const [k, [a, b]] of Object.entries(th)) if (t >= a && t <= b) return ({ shy: 'Çekingen', familiar: 'Tanıdık', friend: 'Dost', loyal: 'Sadık' })[k]; return ''; }

  // ---------- spawning ----------
  speciesForRegion(regionId, swimming) {
    const reg = this.c.regions.get(regionId); if (!reg) return [];
    const phase = this.g.clock.phase(); const raining = this.g.climate.isRaining();
    return (reg.animalSpeciesIds || []).filter((id) => {
      const sp = this.c.species.get(id);
      const marine = id.startsWith('MARINE_');
      if (marine !== swimming) return false;
      if (PET_SPECIES[id] && this.petEntry(PET_SPECIES[id])) return false; // individual already befriended
      if (sp.preferredPhases && !sp.preferredPhases.includes(phase) && !(raining && sp.preferredPhases.includes('RAIN'))) {
        if (sp.aiProfile === 'NOCTURNAL_FLY') return false;
        if (phase === 'NIGHT' && sp.preferredPhases.every((p) => p !== 'NIGHT')) return Math.random() < 0.25;
      }
      const pop = this.s.world.regionPopulation[regionId]?.[id];
      if (pop && pop.killed >= 4 && this.s.clock.dayIndex - pop.lastKillDay < (sp.respawnGameDays || 2)) return false;
      return true;
    });
  }

  tick(dt) {
    const w = this.w; if (!w) return;
    this.spawnT -= dt;
    const [ptx, pty] = w.playerTile();
    const wild = w.animals.filter((a) => !a.pet && !a.fish);
    if (this.spawnT <= 0) {
      this.spawnT = 2.5;
      // despawn far animals
      w.animals = w.animals.filter((a) => a.pet || Math.hypot(a.x / TILE - ptx, a.y / TILE - pty) < 26);
      const max = this.c.db.AnimalDB.config.maxNearbyActiveCreaturesTypical[1];
      if (wild.length < max && w.sceneId === 'OVERWORLD') this.trySpawn(ptx, pty);
      if (w.sceneId === 'CAVE_BATS' || w.sceneId === 'CAVE_POND') this.trySpawnCave(ptx, pty);
      this.ensurePets();
    }
    this.fishT -= dt;
    if (this.fishT <= 0) { this.fishT = 3; this.spawnFish(ptx, pty); }
    for (const a of w.animals) this.think(a, dt, ptx, pty);
  }

  trySpawn(ptx, pty) {
    const g = this.w.grid; const rng = this.g.rng.get('wildlife_spawn');
    for (let attempt = 0; attempt < 6; attempt++) {
      const ang = rng.next() * Math.PI * 2, dist = 13 + rng.next() * 7; // never in camera view
      const x = Math.floor(ptx + Math.cos(ang) * dist), y = Math.floor(pty + Math.sin(ang) * dist);
      if (!g.inb(x, y)) continue;
      const code = g.tileAt(x, y);
      const swimming = [T.OCEAN_SHALLOW, T.SEA_REEF, T.OCEAN_DEEP].includes(code);
      if (!swimming && !this.g.terrain.passable(g, x, y, 'ANIMAL')) continue;
      const region = this.g.terrain.regionAt('OVERWORLD', x, y) || this.nearestRegion(x, y);
      const list = this.speciesForRegion(region, swimming);
      if (!list.length) continue;
      const id = rng.pick(list);
      const sp = this.c.species.get(id);
      if (sp.aiProfile === 'RARE_TERRITORIAL' && rng.next() > 0.12) continue;
      if (sp.damagePerAttack > 0 && this.nearCamp(x, y)) continue; // campCoreNoDangerSpawnTiles
      if (sp.aiProfile === 'TERRITORIAL_AMBUSH' && !this.nearCrocAnchor(x, y)) continue;
      if (this.s.clock.dayIndex <= 2 && sp.damagePerAttack >= 15) continue; // tutorial safety days
      this.add(id, x, y, region);
      return;
    }
  }
  trySpawnCave(ptx, pty) {
    const sid = this.w.sceneId;
    if (this.w.animals.filter((a) => !a.pet).length >= 3) return;
    const g = this.w.grid; const rng = this.g.rng.get('wildlife_spawn');
    const x = ptx + rng.int(-10, 10), y = pty + rng.int(-10, 10);
    if (Math.hypot(x - ptx, y - pty) < 7 || !this.g.terrain.passable(g, x, y, 'ANIMAL')) return;
    if (sid === 'CAVE_BATS') this.add('ANIMAL_FRUIT_BAT', x, y, 'REG_MOUNTAIN');
  }
  nearestRegion(x, y) {
    const g = this.g.terrain.overworld;
    for (let r = 1; r < 12; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const reg = this.g.terrain.regionAt('OVERWORLD', x + dx, y + dy); if (reg) return reg; }
    void g; return 'REG_LAGOON';
  }
  nearCamp(x, y) {
    const r = this.c.db.AnimalDB.config.campCoreNoDangerSpawnTiles;
    for (const b of Object.values(this.s.buildingState.byId)) if ((b.buildId === 'BUILD_CAMPFIRE' || b.data.restValue) && Math.hypot(b.tile[0] - x, b.tile[1] - y) < r) return true;
    return false;
  }
  nearCrocAnchor(x, y) {
    // 3 fixed wetland habitat anchors in the swamp (local MAIN coords)
    const anchors = [[52, 160], [62, 176], [44, 146]].map((p) => this.g.terrain.localToAtlas('MAIN', ...p));
    return anchors.some(([ax, ay]) => Math.hypot(ax - x, ay - y) < 7);
  }

  add(speciesId, tx, ty, region, extra = {}) {
    const sp = this.c.species.get(speciesId);
    const a = { id: `a${++seq}`, speciesId, region, x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, hp: sp.hp || 10, state: 'idle', t: 0, dir: 'down', vx: 0, vy: 0, anim: 'idle', cd: 0, home: [tx, ty], ...extra };
    this.w.animals.push(a);
    if (!this.s.ecosystem.natureJournal.includes(speciesId)) { this.s.ecosystem.natureJournal.push(speciesId); this.g.bus.emit('journal.species', { speciesId }); }
    return a;
  }

  spawnFish(ptx, pty) {
    // decorative fish in visible water near fish zones; species from zone habitat
    const w = this.w; const existing = w.animals.filter((a) => a.fish).length;
    w.animals = w.animals.filter((a) => !a.fish || Math.hypot(a.x / TILE - ptx, a.y / TILE - pty) < 18);
    if (existing >= 4) return;
    const zone = this.g.fishing.zoneNear(ptx, pty, 14);
    if (!zone) return;
    const list = this.g.fishing.speciesForZone(zone);
    const rng = this.g.rng.get('cosmetic');
    const g = w.grid;
    for (let k = 0; k < 4; k++) {
      const x = ptx + rng.int(-9, 9), y = pty + rng.int(-6, 6);
      if (!this.g.terrain.isWaterTile(g, x, y) || g.tileAt(x, y) === T.RIVER_FORD) continue;
      const sid = rng.pick(list);
      this.add(sid, x, y, zone.regionId, { fish: true });
      return;
    }
  }

  // ---------- AI ----------
  think(a, dt, ptx, pty) {
    const sp = this.c.species.get(a.speciesId);
    const g = this.w.grid;
    const ax = a.x / TILE, ay = a.y / TILE;
    const dp = Math.hypot(ax - ptx - 0.5, ay - pty - 0.5);
    a.t += dt; a.cd = Math.max(0, a.cd - dt); a.animT = (a.animT || 0) + dt;
    const water = a.fish || a.speciesId.startsWith('MARINE_');
    const speed = (sp.walkSpeedTilesPerSecond || (water ? 1.6 : 1.5)) * TILE;
    const playerSwim = this.s.player.mode === 'SWIM' || this.s.player.mode === 'DIVE';
    const sprint = this.w.sprintingNow;
    if (a.pet) return this.thinkPet(a, dt, ptx, pty, dp);
    let mvx = 0, mvy = 0; let anim = 'idle';
    const prof = sp.aiProfile;
    const fleeFrom = () => { const d = dp || 1; mvx = (ax - ptx) / d; mvy = (ay - pty) / d; anim = water ? 'swim' : 'move'; };
    const wander = (sp2 = 0.35) => {
      if (a.t > a.nextTurn || !a.nextTurn) { a.nextTurn = a.t + 1.5 + Math.random() * 2.5; const ang = Math.random() * Math.PI * 2; a.wx = Math.cos(ang); a.wy = Math.sin(ang); a.idle = Math.random() < 0.4; }
      if (!a.idle) { mvx = a.wx * sp2; mvy = a.wy * sp2; anim = water ? 'swim' : 'move'; } else anim = water ? 'swim' : 'idle';
    };
    const sight = sp.sightTiles || 4, hearing = sp.hearingTiles || 2;
    const noticed = dp < sight * 0.6 || (sprint && dp < hearing + 2) || dp < hearing;
    switch (prof) {
      case 'FORAGE_FLEE': case 'FLEE': case 'HOP_AND_FLEE': case 'GROUND_FEED_FLY': case 'FLY_AND_LAND': case 'NOCTURNAL_FLY':
        if (noticed || a.hurt > 0) { fleeFrom(); if (a.state !== 'flee') { a.state = 'flee'; a.react = 0.5; } } else { a.state = 'idle'; wander(prof === 'HOP_AND_FLEE' ? 0.5 : 0.3); }
        break;
      case 'HIDE_IN_SHELL':
        if (dp < 2.5) { a.state = 'hide'; anim = 'react'; } else { a.state = 'idle'; wander(0.25); }
        break;
      case 'TREE_HOP_CURIOUS':
        if (a.hurt > 0) fleeFrom();
        else if (dp < 6 && dp > 2.5) { mvx = (ptx + 0.5 - ax) / dp * 0.4; mvy = (pty + 0.5 - ay) / dp * 0.4; anim = 'move'; }
        else wander(0.3);
        break;
      case 'WARN_CHARGE': case 'WARN_BITE': case 'TERRITORIAL_AMBUSH': case 'RARE_TERRITORIAL': {
        const trigger = prof === 'WARN_BITE' ? 2.2 : prof === 'RARE_TERRITORIAL' ? (playerSwim ? 4 : 0) : prof === 'TERRITORIAL_AMBUSH' ? 4 : 3.5;
        const chaseLimit = this.c.db.AnimalDB.config.predatorChaseLimitTiles;
        const fromHome = Math.hypot(ax - a.home[0], ay - a.home[1]);
        if (a.state === 'warn') {
          anim = 'warn'; a.warnT -= dt;
          if (dp > trigger + 2) a.state = 'idle';
          else if (a.warnT <= 0) a.state = 'attack';
        } else if (a.state === 'attack') {
          anim = 'attack';
          if (fromHome > chaseLimit || dp > chaseLimit) { a.state = 'return'; }
          else if (dp > 1.1) { if (prof !== 'WARN_BITE') { mvx = (ptx + 0.5 - ax) / dp * 1.25; mvy = (pty + 0.5 - ay) / dp * 1.25; anim = water ? 'swim' : 'move'; } else a.state = 'idle'; }
          else if (a.cd <= 0) {
            a.cd = sp.attackCooldownSeconds || 3; a.attackFx = 0.4;
            this.g.survival.damage(sp.damagePerAttack, 'animal');
            if (sp.poisonChance && Math.random() < sp.poisonChance) { this.s.player.effects.push({ id: 'poison', t: 25 }); this.g.bus.emit('ui.toast', { text: 'Zehirlendin — panzehir veya bitki çayı iç' }); }
          }
        } else if (a.state === 'return') {
          const dh = fromHome || 1; mvx = (a.home[0] - ax) / dh * 0.6; mvy = (a.home[1] - ay) / dh * 0.6; anim = water ? 'swim' : 'move';
          if (fromHome < 1.5) a.state = 'idle';
        } else {
          if (dp < trigger && (prof !== 'RARE_TERRITORIAL' || playerSwim)) { a.state = 'warn'; a.warnT = 1.2; this.g.bus.emit('animal.warn', { speciesId: a.speciesId }); }
          else wander(water ? 0.4 : 0.25);
          if (a.hurt > 0 && prof === 'WARN_CHARGE') a.state = 'attack';
        }
        break;
      }
      default: // marine observe/flee + fish
        if (prof === 'SWIM_FLEE' && dp < 3) fleeFrom(); else wander(0.4);
        anim = 'swim';
    }
    if (a.hurt > 0) a.hurt -= dt;
    // movement with terrain rules
    const nx = a.x + mvx * speed * dt, ny = a.y + mvy * speed * dt;
    const ok = (px, py) => {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (water) return this.g.terrain.isWaterTile(g, tx, ty) && g.tileAt(tx, ty) !== T.RIVER_FORD;
      if (['GROUND_FEED_FLY', 'FLY_AND_LAND', 'NOCTURNAL_FLY'].includes(prof) && a.state === 'flee') return g.inb(tx, ty) && g.tileAt(tx, ty) !== T.CLIFF_WALL;
      return this.g.terrain.passable(g, tx, ty, 'ANIMAL');
    };
    if (ok(nx, a.y)) a.x = nx; else a.nextTurn = 0;
    if (ok(a.x, ny)) a.y = ny; else a.nextTurn = 0;
    if (Math.abs(mvx) + Math.abs(mvy) > 0.01) a.dir = facingFromVec(mvx, mvy, a.dir);
    if (a.react > 0) { a.react -= dt; anim = water ? 'turn' : 'react'; }
    a.anim = anim;
    a.flying = ['GROUND_FEED_FLY', 'FLY_AND_LAND', 'NOCTURNAL_FLY'].includes(prof) && a.state === 'flee';
  }

  // ---------- hunting / combat ----------
  /** ATTACK: uses equipped weapon (or best spear/bow in bag). */
  attack() {
    const p = this.s.player; const inv = this.g.inventory;
    let weapon = inv.equipped('main_hand');
    if (!weapon || !WEAPONS[weapon.itemId] || weapon.durability === 0) {
      weapon = null;
      for (const id of ['TOOL_HUNTER_BOW', 'TOOL_BOW', 'TOOL_IRON_SPEAR', 'TOOL_WOOD_SPEAR', 'TOOL_SLING', 'TOOL_MACHETE', 'TOOL_STONE_KNIFE']) {
        const t = inv.bestTool(id);
        if (t && t.durability !== 0 && (!WEAPONS[id].ammo || inv.hasItem(WEAPONS[id].ammo))) { weapon = t; break; }
      }
    }
    const spec = weapon ? WEAPONS[weapon.itemId] : { dmg: 5, range: 1.2 };
    if (spec.ammo && !inv.hasItem(spec.ammo)) { this.g.bus.emit('ui.error', { text: 'Mühimmat yok' }); return { ok: false }; }
    const [px, py] = p.positionPx; const fv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.facing];
    let target = null, best = 1e9;
    for (const a of this.w.animals) {
      if (a.pet) continue;
      const dx = (a.x - px) / TILE, dy = (a.y - py) / TILE; const d = Math.hypot(dx, dy);
      if (d > spec.range + 0.5) continue;
      const dot = (dx * fv[0] + dy * fv[1]) / (d || 1);
      if (d > 1.2 && dot < 0.3) continue;
      const score = d - dot; if (score < best) { best = score; target = a; }
    }
    p.attackAnim = { t: 0, kind: weapon && /BOW|SLING/.test(weapon.itemId) ? 'bow' : 'spear' };
    const fishing = this.g.fishing.trySpear(weapon);
    if (fishing) return fishing;
    const r = this.g.store.transaction(null, (tx) => {
      if (spec.ammo) inv.remove(tx, [PLAYER_INV], spec.ammo, 1);
      if (weapon) inv.wear(tx, weapon, 1);
    });
    if (!target) { this.g.bus.emit('player.swing', {}); return { ok: true, hit: false }; }
    const sp = this.c.species.get(target.speciesId);
    const isPetCandidate = !!PET_SPECIES[target.speciesId] && sp.aiProfile === 'TREE_HOP_CURIOUS';
    if (isPetCandidate) { target.hurt = 2; target.state = 'flee'; return { ok: true, hit: false, protected: true }; }
    target.hp -= spec.dmg * (weapon ? 1 : 1) ; target.hurt = 1.5; target.react = 0.3;
    this.g.bus.emit('animal.hit', { speciesId: target.speciesId });
    if (target.hp <= 0) this.kill(target, sp);
    return { ok: r.ok, hit: true };
  }

  kill(a, sp) {
    this.w.animals = this.w.animals.filter((x) => x !== a);
    if (!sp.huntable) return; // observe-only species only scare away, never yield loot
    const killId = `HUNT:${a.id}:${this.s.clock.gameElapsedSeconds | 0}`;
    this.g.store.transaction(killId, (tx) => {
      for (const [itemId, { min, max }] of Object.entries(sp.loot || {})) {
        const q = min + Math.floor(Math.random() * (max - min + 1));
        if (q > 0) this.g.giveOrDrop(tx, itemId, q);
      }
      this.g.skills.award(tx, 'SKILL_HUNTING', 'successfulHunt', killId);
      const rp = this.s.world.regionPopulation;
      if (!rp[a.region]) tx.set(rp, a.region, {});
      const cur = rp[a.region][a.speciesId] || { killed: 0, lastKillDay: 0 };
      tx.set(rp[a.region], a.speciesId, { killed: cur.killed + 1, lastKillDay: this.s.clock.dayIndex });
      tx.emit('animal.killed', { speciesId: a.speciesId });
    });
  }

  /** Daily population recovery (no permanent extinction). */
  onDay(day) {
    for (const reg of Object.values(this.s.world.regionPopulation)) for (const [sid, pop] of Object.entries(reg)) {
      const sp = this.c.species.get(sid);
      if (day - pop.lastKillDay >= (sp.respawnGameDays || 2)) pop.killed = Math.max(0, pop.killed - 2);
    }
    for (const f of Object.values(this.s.ecosystem.tamedFriends)) f.daily = { day, feed: 0, calm: 0, nearby: 0, helped: 0, fed: false };
  }

  // ---------- pets ----------
  petEntry(kind) { return Object.values(this.s.ecosystem.tamedFriends).find((f) => f.kind === kind) || null; }

  interactWild(a, action = 'calm') {
    const kind = PET_SPECIES[a.speciesId];
    if (!kind || this.c.species.get(a.speciesId).aiProfile === 'FLEE') return { ok: false };
    let f = this.petEntry(kind);
    if (!f) {
      const id = kind === 'parrot' ? 'PET_PARROT' : 'PET_MONKEY';
      f = { id, kind, speciesId: a.speciesId, name: kind === 'parrot' ? 'Mavi' : 'Pati', trust: 0, activeFollower: false, campId: null, lastHelperGameDay: 0, daily: { day: this.s.clock.dayIndex, feed: 0, calm: 0, nearby: 0, helped: 0, fed: false } };
      this.s.ecosystem.tamedFriends[id] = f;
      a.pet = true; a.petId = id; a.petData = f;
      this.g.bus.emit('pet.met', { kind });
    }
    return this.petInteract(f.id, action);
  }

  petInteract(petId, action, itemId = null) {
    const f = this.s.ecosystem.tamedFriends[petId]; if (!f) return { ok: false };
    const cfg = this.c.db.AnimalDB.pets; const day = this.s.clock.dayIndex;
    if (!f.daily || f.daily.day !== day) f.daily = { day, feed: 0, calm: 0, nearby: 0, helped: 0, fed: false };
    if (action === 'feed') {
      const food = PET_FOOD[f.kind];
      const choice = itemId || [...food.favorite, ...food.fitting].find((id) => this.g.inventory.hasItem(id));
      if (!choice) { this.g.bus.emit('ui.error', { text: f.kind === 'parrot' ? 'Papağan meyve ister (yabani meyve/muz)' : 'Maymun muz veya meyve ister' }); return { ok: false }; }
      if (f.daily.feed >= cfg.dailyTrustLimits.feedActions) { this.g.bus.emit('ui.toast', { text: `${f.name} bugün tok` }); return { ok: false, code: 'DAILY_LIMIT' }; }
      return this.g.store.transaction(`PETFEED:${petId}:${day}:${f.daily.feed}`, (tx) => {
        this.g.inventory.remove(tx, [PLAYER_INV], choice, 1);
        const gain = food.favorite.includes(choice) ? cfg.trustEvents.feedFavorite : cfg.trustEvents.feedFitting;
        tx.set(f, 'trust', clamp(f.trust + gain, 0, 100));
        tx.set(f.daily, 'feed', f.daily.feed + 1); tx.set(f.daily, 'fed', true);
        tx.emit('pet.trust', { petId, trust: f.trust });
      });
    }
    if (action === 'calm') {
      if (f.daily.calm >= cfg.dailyTrustLimits.calmActions) { this.g.bus.emit('ui.toast', { text: `${f.name} seni tanıyor` }); return { ok: false }; }
      f.daily.calm++; f.trust = clamp(f.trust + cfg.trustEvents.calmInteraction, 0, 100);
      this.g.bus.emit('pet.trust', { petId, trust: f.trust }); return { ok: true };
    }
    if (action === 'FOLLOW') {
      if (f.trust < 30) { this.g.bus.emit('ui.error', { text: 'Önce güven kazan (Tanıdık: 30)' }); return { ok: false }; }
      for (const o of Object.values(this.s.ecosystem.tamedFriends)) o.activeFollower = false; // max 1 follower
      f.activeFollower = true; f.mode = 'FOLLOW'; this.g.bus.emit('pet.command', { petId, cmd: 'FOLLOW' }); return { ok: true };
    }
    if (action === 'STAY') { f.activeFollower = false; f.mode = 'STAY'; f.stayAt = { sceneId: this.w.sceneId, tile: this.w.playerTile() }; return { ok: true }; }
    if (action === 'RETURN_TO_CAMP') {
      f.activeFollower = false; f.mode = 'HOME';
      const home = Object.values(this.s.buildingState.byId).find((b) => b.stage === 'complete' && b.buildId === (f.kind === 'parrot' ? 'BUILD_PARROT_PERCH' : 'BUILD_MONKEY_PLATFORM')) || Object.values(this.s.buildingState.byId).find((b) => b.buildId === (f.kind === 'parrot' ? 'BUILD_PARROT_HOUSE' : 'BUILD_PLAY_POST'));
      if (!home) { this.g.bus.emit('ui.error', { text: f.kind === 'parrot' ? 'Önce papağan tüneği kur' : 'Önce maymun platformu kur' }); f.mode = 'STAY'; f.stayAt = { sceneId: this.w.sceneId, tile: this.w.playerTile() }; return { ok: false }; }
      f.campId = home.uid; return { ok: true };
    }
    return { ok: false };
  }

  ensurePets() {
    const w = this.w;
    for (const f of Object.values(this.s.ecosystem.tamedFriends)) {
      let a = w.animals.find((x) => x.petId === f.id);
      let want = null;
      if (f.activeFollower) want = { sceneId: w.sceneId, tile: w.playerTile() };
      else if (f.mode === 'HOME' && f.campId && this.s.buildingState.byId[f.campId]) { const b = this.s.buildingState.byId[f.campId]; want = { sceneId: 'OVERWORLD', tile: [b.tile[0] + 1, b.tile[1] + b.h] }; }
      else if (f.stayAt) want = f.stayAt;
      if (!want || want.sceneId !== w.sceneId) { if (a) w.animals = w.animals.filter((x) => x !== a); continue; }
      if (!a) {
        const g = w.grid; const spot = this.g.pathfinder.nearestTile(g, want.tile[0] + 1, want.tile[1], (x, y) => this.g.terrain.passable(g, x, y, 'WALK'), 6) || want.tile;
        a = this.add(f.speciesId, spot[0], spot[1], 'REG_GROVE', { pet: true, petId: f.id, petData: f, name: f.name, hp: 999 });
      }
      a.petData = f; a.name = f.name;
    }
  }

  thinkPet(a, dt, ptx, pty, dp) {
    const f = a.petData; a.anim = 'idle';
    if (f.activeFollower && dp > 2.2) {
      if (dp > 14) { a.x = (ptx + 1.5) * TILE; a.y = (pty + 0.5) * TILE; }
      const sp = (dp > 5 ? 4.5 : 3) * TILE * dt;
      const vx = (ptx + 0.5 - a.x / TILE) / dp, vy = (pty + 0.5 - a.y / TILE) / dp;
      a.x += vx * sp; a.y += vy * sp; a.dir = facingFromVec(vx, vy, a.dir); a.anim = 'move';
    }
    a.flying = f.kind === 'parrot' && a.anim === 'move';
    a.animT = (a.animT || 0) + dt;
    // nearby calm trust (once/day) when player is close and not sprinting
    if (dp < 3 && !this.w.sprintingNow && f.daily && f.daily.nearby < this.c.db.AnimalDB.pets.dailyTrustLimits.nearbyCalmActions) {
      f.daily.nearby++; f.trust = clamp(f.trust + this.c.db.AnimalDB.pets.trustEvents.nearbyCalm, 0, 100);
    }
    // helper actions require being fed today
    if (f.activeFollower && f.daily?.fed && f.trust >= 30) this.petHelp(f, a);
  }

  petHelp(f, a) {
    const day = this.s.clock.dayIndex;
    if (f.kind === 'parrot') {
      if ((f.daily.helped || 0) >= 2 || (f.lastHelpT || 0) > this.s.clock.gameElapsedSeconds - 60) return;
      const [tx, ty] = this.w.playerTile();
      const poi = this.g.exploration.poisInScene(this.w.sceneId).find((p) => this.c.pois.get(p.id).rank === 'SIDE' && !this.s.story.poiStates[p.id]?.searched && Math.hypot(p.ax - tx, p.ay - ty) <= 6);
      if (poi) { f.daily.helped = (f.daily.helped || 0) + 1; f.lastHelpT = this.s.clock.gameElapsedSeconds; a.react = 1; this.g.bus.emit('pet.alert', { poiId: poi.id, text: `${f.name} yakında gizli bir şey fark etti!` }); }
    } else if (f.kind === 'monkey') {
      if (f.lastHelperGameDay === day) return;
      const [tx, ty] = this.w.playerTile();
      const node = this.w.nodeDefs.find((n) => n.sceneId === this.w.sceneId && ['FOOD_BANANA', 'FOOD_BERRY', 'FOOD_COCONUT'].includes(n.itemId) && this.w.nodeReady(n) && Math.hypot(n.tile[0] - tx, n.tile[1] - ty) < 8);
      if (node) {
        f.lastHelperGameDay = day;
        const r = this.g.resources.completeHarvest(node.id, null);
        if (r.ok) this.g.bus.emit('pet.alert', { text: `${f.name} sana ${this.c.itemName(node.itemId)} getirdi` });
      }
    }
  }
}
