// 12 replayable environmental puzzles with persisted UI state. Wrong answers never consume items.
// completionEffects (flag) + POI reward are committed together exactly once.

const MODS = { THREE_PINS: 4, THREE_ROTATORS: 4, FOUR_CONNECTORS: 4, TWO_ROTATORS: 4, THREE_DIALS: 6 };
const COMPLETION_SIDE_EFFECTS = {
  RELAY_REPAIRED: (sys, tx) => { sys.g.exploration.openShortcut(tx, 'GATE_RELAY'); tx.set(sys.s.world.worldFlags, 'RELAY_PATH_OPEN', true); },
  CABLE_CAR_REPAIRED: (sys, tx) => { sys.g.exploration.openShortcut(tx, 'GATE_CLIMB'); },
};

export class PuzzleSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  def(id) { return this.g.content.puzzles.get(id); }

  stateOf(id) {
    const all = this.s.story.puzzlesById;
    if (!all[id]) all[id] = { uiState: JSON.parse(JSON.stringify(this.def(id).stateSchema)), solved: false, appliedWorldFlag: false, claimTransactionId: null, attempts: 0 };
    return all[id];
  }

  canStart(id) {
    const p = this.def(id); const sc = p.startCondition; const reasons = [];
    if (sc.poiDiscovered && !this.s.story.poiStates[sc.poiDiscovered]?.discovered) reasons.push('Önce bu yeri keşfet');
    if (sc.repairMaterialsDeposited && !this.s.story.poiStates[p.poiId]?.materialsDeposited) reasons.push('Önce onarım malzemelerini bırak');
    if (sc.escapeProjectBuilt && !this.g.escape.stationBuilt()) reasons.push('Haberleşme istasyonu kurulmalı');
    if (sc.energyAvailable && !this.g.escape.stationPowered()) reasons.push('Enerji kaynağı (güneş veya jeneratör) gerekli');
    for (const f of sc.requiredStoryFlags || []) if (!this.s.story.specialItemsGranted.includes(f)) reasons.push('Eksik: ' + this.g.content.itemName(f));
    return reasons;
  }

  /** PUZZLE_ACTION: persist progress on every change; completion flag + reward in one commit. */
  action(id, actionId, arg = null) {
    const p = this.def(id); const st = this.stateOf(id);
    if (st.solved) return { ok: true, solved: true };
    const reasons = this.canStart(id);
    if (reasons.length) { this.g.bus.emit('ui.error', { text: reasons[0] }); return { ok: false, code: 'START_CONDITION', reasons }; }
    const u = st.uiState; const w = p.uiWidget; const mod = MODS[w];
    const idx = (n) => n - 1;
    let wrongSequence = false;
    switch (w) {
      case 'THREE_TOGGLE': { const i = p.allowedActions.indexOf(actionId); if (i < 0) return { ok: false }; u.valves[i] = !u.valves[i]; break; }
      case 'TWO_ROTATORS': { const wheel = arg ?? 0; u.wheelAngles[wheel] = (u.wheelAngles[wheel] + (actionId === 'ROTATE_LEFT' ? 3 : 1)) % mod; break; }
      case 'THREE_PINS': { const n = +actionId.slice(-1); u.pins[idx(n)] = (u.pins[idx(n)] + 1) % mod; break; }
      case 'THREE_ROTATORS': { const key = Object.keys(u)[0]; const n = +actionId.slice(-1); u[key][idx(n)] = (u[key][idx(n)] + 1) % mod; break; }
      case 'FOUR_CONNECTORS': { const n = +actionId.slice(-1); u.contacts[idx(n)] = (u.contacts[idx(n)] + 1) % mod; break; }
      case 'THREE_DIALS': { const n = +actionId.slice(-1); u.dials[idx(n)] = (u.dials[idx(n)] + 1) % mod; break; }
      case 'THREE_STEP_SEQUENCE': case 'THREE_SEQUENCE': {
        const key = w === 'THREE_STEP_SEQUENCE' ? 'completedSteps' : 'sequence';
        if (actionId === 'RESET') { u[key] = []; break; }
        const step = w === 'THREE_SEQUENCE' ? actionId.replace('SELECT_', '') : actionId;
        u[key].push(step);
        const sol = p.solution[key];
        if (u[key].some((s, i) => s !== sol[i])) { wrongSequence = true; u[key] = []; }
        break;
      }
      default: return { ok: false, code: 'UNKNOWN_WIDGET' };
    }
    st.attempts++;
    if (wrongSequence) { this.g.bus.emit('puzzle.fail', { id }); }
    this.g.persistence?.markDirty('puzzle');
    if (this.isSolved(p, u)) return this.complete(id);
    this.g.bus.emit('puzzle.changed', { id });
    return { ok: true, solved: false };
  }

  isSolved(p, u) { return JSON.stringify(u) === JSON.stringify(p.solution); }

  complete(id) {
    const p = this.def(id); const st = this.stateOf(id);
    const txId = `PUZZLE:${id}`;
    const r = this.g.store.transaction(txId, (tx) => {
      tx.set(st, 'solved', true);
      tx.set(st, 'appliedWorldFlag', true);
      tx.set(st, 'claimTransactionId', txId);
      tx.set(this.s.world.worldFlags, p.completionEffects.setFlag, true);
      COMPLETION_SIDE_EFFECTS[p.completionFlag]?.(this, tx);
      const ps = this.g.exploration.ps(p.poiId);
      tx.set(ps, 'puzzleCompleted', true);
      tx.emit('puzzle.solved', { id, flag: p.completionFlag });
    });
    if (!r.ok) return r;
    // POI reward (if triggered on completion) in the same logical step; reward ledger keeps it single
    const loot = this.g.content.poiLoot.get(p.poiId);
    if (loot.rewardClaimTrigger === 'ON_PUZZLE_COMPLETED' || loot.rewardClaimTrigger === 'ON_SEARCH') {
      if (!this.g.exploration.ps(p.poiId).rewardClaimed && !this.g.exploration.accessProblem(p.poiId)) this.g.exploration.grantReward(p.poiId);
    }
    if (id === 'PZ_LIGHTHOUSE_TUNE') this.g.escape.onTuned();
    this.g.persistence?.checkpoint('puzzle');
    return { ok: true, solved: true };
  }

  hint(id, level) { const h = this.def(id).hintLevels.find((x) => x.level === level); return h ? h.hint : ''; }
}
