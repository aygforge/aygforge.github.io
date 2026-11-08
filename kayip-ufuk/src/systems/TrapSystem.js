// 3 trap kinds, ≤6 active, one persisted roll per trap per day (2 if upgraded), bait rules, claim once.
import { RngStreams } from '../core/RngStreams.js';
import { PLAYER_INV } from './InventorySystem.js';
import { BYPRODUCTS } from './WildlifeSystem.js';

export class TrapSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }

  setBait(trapUid, itemId) {
    const t = this.s.productionState.trapsById[trapUid]; const def = this.c.traps.get(t?.buildId);
    if (!t || !def) return { ok: false };
    if (!def.validBaitItemIds.includes(itemId)) { this.g.bus.emit('ui.error', { text: 'Bu tuzak için uygun yem değil' }); return { ok: false }; }
    if (t.bait) return { ok: false, code: 'HAS_BAIT' };
    return this.g.store.transaction(null, (tx) => {
      this.g.inventory.remove(tx, [PLAYER_INV], itemId, 1);
      tx.set(t, 'bait', itemId);
      tx.emit('trap.set', { trapUid });
    });
  }

  /** Daily roll for the finished day; idempotent by lastRolledDay. */
  onDay(newDay) {
    const cfg = this.c.db.TrapDB.config;
    for (const [uid, t] of Object.entries(this.s.productionState.trapsById)) {
      if (t.lastRolledDay >= newDay) continue;
      const b = this.s.buildingState.byId[uid]; if (!b || b.stage !== 'complete') { t.lastRolledDay = newDay; continue; }
      const def = this.c.traps.get(t.buildId);
      const region = this.g.terrain.regionAt('OVERWORLD', b.tile[0], b.tile[1]) || this.g.wildlife.nearestRegion(b.tile[0], b.tile[1]);
      const cap = t.upgraded ? def.upgradedCapacity : def.capacity;
      const rolls = t.upgraded ? cfg.dailyRollsPerTrapWhenUpgraded : cfg.dailyRollsPerTrapBase;
      for (let r = 0; r < rolls; r++) {
        if (t.storedCatch.length >= cap) break; // rollOnlyIfUnfilled
        if (!def.habitats.includes(region)) break;
        const rng = RngStreams.keyed(this.s.world.worldSeed, 'trap', uid, newDay, r);
        let chance = t.bait ? def.catchChanceFittingBait : def.baseCatchChanceNoBait;
        chance *= this.g.skills.perk('SKILL_HUNTING', 'trapSuccessMultiplier', 1);
        if (def.possibleFishIds) {
          const zone = this.g.fishing.zoneNear(b.tile[0], b.tile[1], 4);
          if (zone) chance *= this.s.ecosystem.fishHabitatStock[zone.id] ?? 1;
        }
        const hit = rng.next() < chance;
        t.bait = null; // bait consumed only when a roll occurs (lost on fail too)
        if (hit) {
          if (def.possibleFishIds) t.storedCatch.push({ kind: 'fish', id: rng.pick(def.possibleFishIds) });
          else t.storedCatch.push({ kind: 'animal', id: rng.pick(def.possibleAnimals) });
        }
      }
      t.lastRolledDay = newDay; t.dailyRolls = rolls;
    }
  }

  /** TRAP_CLAIM: one reward per stored catch, XP once per claim event. */
  claim(trapUid) {
    const t = this.s.productionState.trapsById[trapUid];
    if (!t || !t.storedCatch.length) { this.g.bus.emit('ui.toast', { text: 'Tuzak boş' }); return { ok: false, code: 'EMPTY' }; }
    const def = this.c.traps.get(t.buildId);
    const claimNo = (t.claims || 0) + 1;
    const txId = `TRAP_CLAIM:${trapUid}:${claimNo}`;
    return this.g.store.transaction(txId, (tx) => {
      const rng = RngStreams.keyed(this.s.world.worldSeed, 'trapclaim', trapUid, claimNo);
      for (const cth of t.storedCatch) {
        if (cth.kind === 'fish') {
          const f = this.c.fish.get(cth.id);
          this.g.giveOrDrop(tx, 'MAT_RAW_FISH', f.rawFishPortions.min || 1);
          const j = this.s.ecosystem.fishJournal; const prev = j[f.id] || { caughtCount: 0, bestWeight: 0 };
          tx.set(j, f.id, { caughtCount: prev.caughtCount + 1, bestWeight: Math.max(prev.bestWeight, f.sizeCm.min) });
        } else {
          const sp = this.c.species.get(cth.id);
          for (const [itemId, { min, max }] of Object.entries(sp.loot)) { const q = rng.int(min, max); if (q > 0) this.g.giveOrDrop(tx, itemId, q); }
          const by = BYPRODUCTS[cth.id]; if (by) for (const [id, [mn, mx, ch]] of Object.entries(by)) if (rng.next() < ch) this.g.giveOrDrop(tx, id, rng.int(mn, mx));
        }
      }
      tx.set(t, 'storedCatch', []);
      tx.set(t, 'claims', claimNo);
      this.g.skills.award(tx, def.xpSkillId, null, txId, def.xpOnClaim);
      tx.emit('trap.claimed', { trapUid });
    });
  }
}
