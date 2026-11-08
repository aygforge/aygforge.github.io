// 10 fish species, zone stock, rod tension mini-game (cast → bite → fight), spearfishing, journal.
import { TILE, T, C } from '../world/TerrainSystem.js';
import { RngStreams } from '../core/RngStreams.js';
import { PLAYER_INV } from './InventorySystem.js';
import { clamp } from '../core/util.js';

export class FishingSystem {
  constructor(game) { this.g = game; this.session = null; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }
  get cfg() { return this.c.db.FishDB.config; }

  zoneTile(z) {
    if (z.island === 'ATLAS') return { scene: 'OVERWORLD', x: z.tileAtlas[0], y: z.tileAtlas[1] };
    if (z.island === 'CAVE_POND') return { scene: 'CAVE_POND', x: z.tileLocal[0], y: z.tileLocal[1] };
    const [x, y] = this.g.terrain.localToAtlas(z.island, ...z.tileLocal); return { scene: 'OVERWORLD', x, y };
  }
  zoneNear(tx, ty, extra = 0) {
    const scene = this.g.world.sceneId; let best = null, bd = 1e9;
    for (const z of this.c.fishZones.values()) {
      const p = this.zoneTile(z); if (p.scene !== scene) continue;
      const d = Math.hypot(p.x - tx, p.y - ty);
      if (d <= z.radiusTiles + extra && d < bd) { bd = d; best = z; }
    }
    return best;
  }
  habitatAt(tx, ty) {
    const g = this.g.world.grid;
    if (g.isCave) return { habitat: 'CAVE_POOL', regionId: 'REG_MOUNTAIN' };
    const code = g.tileAt(tx, ty);
    const region = this.g.terrain.regionAt('OVERWORLD', tx, ty) || this.g.wildlife.nearestRegion(tx, ty);
    if ([T.RIVER_DEEP, T.RIVER_FORD, T.RIVER_BANK, T.WETLAND_WADE].includes(code)) return { habitat: 'RIVER', regionId: region };
    if (code === T.SEA_REEF) return { habitat: 'REEF', regionId: region };
    if (g.coastDist && g.coastDist[g.i(tx, ty)] > 6) return { habitat: 'OPEN_SEA', regionId: region };
    return { habitat: code === T.OCEAN_SHALLOW ? 'SHALLOW_COAST' : 'COAST', regionId: region };
  }
  speciesForZone(z) {
    const list = this.c.db.FishDB.fish.filter((f) => f.habitats.includes(z.habitat) || f.regionIds.includes(z.regionId));
    return list.length ? list.map((f) => f.id) : ['FISH_SARDINE'];
  }

  /** Water tile in front of player (≤2 tiles). */
  waterInFront() {
    const w = this.g.world; const [tx, ty] = w.playerTile(); const g = w.grid;
    const fv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.s.player.facing];
    for (let k = 1; k <= 2; k++) {
      const x = tx + fv[0] * k, y = ty + fv[1] * k;
      const code = g.tileAt(x, y);
      if (g.isCave ? (code === C.DEEP_POOL || code === C.SHALLOW_POOL) : this.g.terrain.isWaterTile(g, x, y) && code !== T.RIVER_BANK) return [x, y];
    }
    if (this.s.player.mode === 'RAFT') return [tx + fv[0], ty + fv[1]];
    return null;
  }

  rodTier(rod) { return this.cfg.rodTierLevels[rod.itemId] || 1; }

  candidates(tx, ty, rod, baitId) {
    const zone = this.zoneNear(tx, ty);
    const hab = zone ? { habitat: zone.habitat, regionId: zone.regionId } : this.habitatAt(tx, ty);
    const phase = this.g.clock.phase();
    const stock = zone ? (this.s.ecosystem.fishHabitatStock[zone.id] ?? 1) : 1;
    const out = [];
    for (const f of this.c.db.FishDB.fish) {
      if (!f.habitats.includes(hab.habitat) && !(f.regionIds.includes(hab.regionId) && hab.habitat !== 'RIVER' && hab.habitat !== 'CAVE_POOL')) continue;
      if (f.minRodTier > this.rodTier(rod)) continue;
      let wgt = f.catchWeight;
      if (f.preferredPhases.includes(phase)) wgt *= 1.5;
      if (baitId) wgt *= f.baitOverrides[baitId] || 1;
      else if (f.difficulty >= 3) wgt *= 0.35; // noBaitAllowedForCommonFish: rare fish strongly prefer bait
      out.push({ f, weight: wgt * stock });
    }
    return { list: out, zone, hab };
  }

  /** CAST */
  cast(baitId = null) {
    const p = this.s.player;
    if (this.session) return { ok: false, code: 'BUSY' };
    const rod = this.g.inventory.bestTool('rod');
    if (!rod) { this.g.bus.emit('ui.error', { text: 'Olta gerekli' }); return { ok: false, code: 'NO_ROD' }; }
    const water = this.waterInFront();
    if (!water) { this.g.bus.emit('ui.error', { text: 'Suya dön ve kıyıya yaklaş' }); return { ok: false, code: 'NO_WATER' }; }
    if (baitId && !this.g.inventory.hasItem(baitId)) baitId = null;
    if (!baitId) baitId = this.cfg.fishBaitIds.slice().reverse().find((b) => this.g.inventory.hasItem(b)) || null;
    const { list, zone } = this.candidates(water[0], water[1], rod, baitId);
    if (!list.length) { this.g.bus.emit('ui.error', { text: 'Burada balık yok' }); return { ok: false, code: 'NO_FISH' }; }
    const castNo = (this.s.ecosystem.castCount || 0) + 1;
    const r = this.g.store.transaction(`CAST:${castNo}`, (tx) => {
      tx.set(this.s.ecosystem, 'castCount', castNo);
      this.g.inventory.wear(tx, rod, 1);
      const keep = baitId && this.g.rng.get('fish_bites').chance(this.g.skills.perk('SKILL_FISHING', 'baitPreservationChance', 0));
      if (baitId && !keep) this.g.inventory.remove(tx, [PLAYER_INV], baitId, 1);
    });
    if (!r.ok) return r;
    const rng = this.g.rng.get('fish_bites');
    const pick = rng.weighted(list).f;
    const rare = pick.difficulty >= 4;
    const cw = this.cfg.castWaitSeconds;
    let wait = rare ? rng.range(cw.rareMin, cw.rareMax) : rng.range(cw.commonMin, cw.commonMax);
    wait *= this.g.skills.perk('SKILL_FISHING', 'biteWaitMultiplier', 1) / this.g.climate.fishingMul();
    if (this.g.inventory.hasItem('SAL_PLASTIC')) wait *= 0.9; // plastic float (ItemDB uses: yüzer balık avı malzemesi)
    const fight = pick.fightSeconds.min + rng.next() * (pick.fightSeconds.max - pick.fightSeconds.min);
    const sizeT = rng.next();
    this.session = { phase: 'WAIT', t: 0, wait, fish: pick, zone, fight, progress: 0, tension: 40, outT: 0, slackT: 0, biteT: 0, sizeT, reeling: false, water, rodUid: rod.uid };
    p.fishing = true;
    this.g.bus.emit('fish.cast', { fishHidden: true });
    return { ok: true };
  }

  /** Player input: hold = reel (raises tension & progress), tap during bite = hook. */
  input(reeling) { if (this.session) this.session.reeling = reeling; }
  hook() { const s = this.session; if (s && s.phase === 'BITE') { s.phase = 'FIGHT'; s.t = 0; this.g.bus.emit('fish.hooked', {}); } }

  tick(dt) {
    const s = this.session; if (!s) return;
    s.t += dt;
    if (s.phase === 'WAIT') { if (s.t >= s.wait) { s.phase = 'BITE'; s.t = 0; this.g.bus.emit('fish.bite', {}); } return; }
    if (s.phase === 'BITE') { if (s.t > 1.6) this.end(false, 'Balık yemi kaçırdı'); return; }
    if (s.phase === 'FIGHT') {
      const diff = s.fish.difficulty;
      const pull = (Math.sin(s.t * (1.3 + diff * 0.35)) * 0.5 + 0.5) * (6 + diff * 5);
      s.tension += (s.reeling ? 34 + diff * 2 : -30) * dt + pull * dt * (s.reeling ? 1 : 0.6);
      s.tension = clamp(s.tension, 0, 100);
      const [lo0, hi0] = this.cfg.tensionSafeRange;
      const widen = this.g.skills.perk('SKILL_FISHING', 'tensionSafeWindowMultiplier', 1);
      const mid = (lo0 + hi0) / 2, half = ((hi0 - lo0) / 2) * widen;
      const lo = mid - half, hi = mid + half; s.lo = lo; s.hi = hi;
      const safe = s.tension >= lo && s.tension <= hi;
      if (safe) { s.outT = 0; if (s.reeling) s.progress += dt / s.fight; }
      else s.outT += dt;
      if (s.tension < lo) s.slackT += dt; else s.slackT = 0;
      if (s.tension > hi && s.outT > this.cfg.tensionLoseThresholdSeconds) return this.end(false, 'Misina koptu! (gerilim fazla)');
      if (s.slackT > this.cfg.hookFailureIfSlackSeconds) return this.end(false, 'İğne çıktı (misina gevşek)');
      if (s.progress >= 1) this.end(true);
    }
  }

  end(success, msg) {
    const s = this.session; this.session = null; this.s.player.fishing = false;
    if (!success) { this.g.bus.emit('fish.lost', { text: msg }); return { ok: false }; }
    return this.landFish(s.fish, s.sizeT, s.zone, 'rod');
  }
  cancel() { if (this.session) { this.session = null; this.s.player.fishing = false; this.g.bus.emit('fish.lost', { text: 'Olta toplandı' }); } }

  landFish(fish, sizeT, zone, method) {
    const no = (this.s.ecosystem.catchCount || 0) + 1;
    return this.g.store.transaction(`CATCH:${no}`, (tx) => {
      tx.set(this.s.ecosystem, 'catchCount', no);
      const cm = fish.sizeCm.min + sizeT * (fish.sizeCm.max - fish.sizeCm.min);
      const j = this.s.ecosystem.fishJournal;
      const prev = j[fish.id] || { caughtCount: 0, bestWeight: 0 };
      tx.set(j, fish.id, { caughtCount: prev.caughtCount + 1, bestWeight: Math.max(prev.bestWeight, Math.round(cm)) });
      if (!this.s.ecosystem.natureJournal.includes(fish.id)) tx.push(this.s.ecosystem.natureJournal, fish.id);
      let portions = 0;
      if (!fish.releaseOnly) {
        portions = Math.round(fish.rawFishPortions.min + sizeT * (fish.rawFishPortions.max - fish.rawFishPortions.min));
        portions = Math.max(1, portions);
        this.g.giveOrDrop(tx, fish.outputItemId, portions);
        this.g.giveOrDrop(tx, 'MAT_FISH_OFFCUT', 1);
        if (fish.difficulty >= 3) this.g.giveOrDrop(tx, 'MAT_BONE', 1);
      }
      if (zone) {
        const st = this.s.ecosystem.fishHabitatStock;
        tx.set(st, zone.id, Math.max(this.cfg.habitatStockMin, (st[zone.id] ?? 1) - this.cfg.stockCostPerCatch));
      }
      this.g.skills.award(tx, 'SKILL_FISHING', null, `catch:${no}`, fish.catchXp);
      tx.emit('fish.landed', { fishId: fish.id, cm: Math.round(cm), portions, released: !!fish.releaseOnly, method });
      return { fishId: fish.id, portions };
    });
  }

  /** Spearfishing: only spearAllowed fish visible in shallow water in front. */
  trySpear(weapon) {
    if (!weapon || !/SPEAR$/.test(weapon.itemId)) return null;
    const [px, py] = this.s.player.positionPx;
    const fish = this.g.world.animals.find((a) => a.fish && Math.hypot(a.x - px, a.y - py) < TILE * 2.2);
    if (!fish) return null;
    const f = this.c.fish.get(fish.speciesId);
    const g = this.g.world.grid; const code = g.tileAt(Math.floor(fish.x / TILE), Math.floor(fish.y / TILE));
    const shallow = [T.OCEAN_SHALLOW, T.SEA_REEF, T.RIVER_FORD, T.WETLAND_WADE].includes(code);
    if (!f.spearAllowed || !shallow) { this.g.bus.emit('ui.toast', { text: 'Bu balık zıpkınla avlanamaz' }); return { ok: false }; }
    const hit = RngStreams.keyed(this.s.world.worldSeed, 'spear', fish.id).next() < 0.55;
    this.g.store.transaction(null, (tx) => this.g.inventory.wear(tx, weapon, 1));
    this.g.world.animals = this.g.world.animals.filter((a) => a !== fish);
    if (!hit) { this.g.bus.emit('ui.toast', { text: 'Iskaladın!' }); return { ok: true, hit: false }; }
    const zone = this.zoneNear(Math.floor(fish.x / TILE), Math.floor(fish.y / TILE));
    return this.landFish(f, 0.3, zone, 'spear');
  }

  onDay() {
    const st = this.s.ecosystem.fishHabitatStock;
    for (const k of Object.keys(st)) st[k] = Math.min(this.cfg.habitatStockMax, st[k] + this.cfg.stockRegainPerGameDay);
  }
}
