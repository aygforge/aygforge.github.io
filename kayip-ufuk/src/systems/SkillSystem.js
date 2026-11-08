// 8 use-to-learn skills × 5 ranks (0/80/220/450/800), perks, daily anti-farm, idempotent XP events.
export class SkillSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }

  static initialState(content) {
    const o = {};
    for (const sk of content.skills.values()) o[sk.id] = { xp: 0, level: 1, craftDaily: {} };
    return o;
  }

  level(skillId) {
    const sk = this.g.content.skills.get(skillId); const xp = this.s.skills[skillId].xp;
    let lv = 1; sk.levelThresholdsTotalXp.forEach((t, i) => { if (xp >= t) lv = i + 1; });
    return lv;
  }

  /** Highest unlocked value for perk key (perkStackPolicy). */
  perk(skillId, key, dflt) {
    const sk = this.g.content.skills.get(skillId); const lv = this.level(skillId); let v = dflt;
    for (const p of sk.perks) if (p.level <= lv && p[key] !== undefined) v = p[key];
    return v;
  }

  /** Award XP for a completed action. eventId makes it idempotent across save/load. */
  award(tx, skillId, actionKey, eventId, amountOverride) {
    const sk = this.g.content.skills.get(skillId); if (!sk) return 0;
    const amount = amountOverride ?? sk.xpActions[actionKey] ?? 0;
    if (amount <= 0) return 0;
    const key = `XP:${skillId}:${eventId}`;
    if (this.g.store.hasClaim(key)) return 0;
    this.g.store.claim(tx, key);
    const st = this.s.skills[skillId];
    const before = this.level(skillId);
    tx.set(st, 'xp', st.xp + amount);
    const after = this.level(skillId);
    tx.set(st, 'level', after);
    tx.emit('skill.xp', { skillId, amount, xp: st.xp });
    if (after > before) tx.emit('skill.levelup', { skillId, level: after, name: sk.levels[after - 1] });
    return amount;
  }

  /** Crafting repeat cap: first 5/day full, next 10 half, then 0 (SkillDB.config). */
  craftXp(tx, recipeId, base, eventId, skillId = 'SKILL_CRAFTING') {
    const cfg = this.g.content.db.SkillDB.config; const day = this.s.clock.dayIndex;
    const st = this.s.skills[skillId];
    const k = `${day}:${recipeId}`;
    const n = st.craftDaily[k] || 0;
    let amt = base;
    if (n >= cfg.craftingRepeatDailyFullXp + cfg.craftingRepeatDailyHalfXp) amt = 0;
    else if (n >= cfg.craftingRepeatDailyFullXp) amt = Math.floor(base / 2);
    tx.set(st.craftDaily, k, n + 1);
    // prune old days
    for (const key of Object.keys(st.craftDaily)) if (!key.startsWith(day + ':')) delete st.craftDaily[key];
    return amt > 0 ? this.award(tx, skillId, null, eventId, amt) : 0;
  }
}

/** Recipe knowledge: START / MAT: / STATION: / BP: / STORY: unlock codes. */
export class KnowledgeSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  learnMaterial(tx, itemId) {
    const k = this.s.knowledge.items;
    if (!k[itemId]) { if (tx) tx.set(k, itemId, true); else k[itemId] = true; }
  }
  learnStation(tx, buildId) {
    const k = this.s.knowledge.stations;
    if (!k[buildId]) { tx.set(k, buildId, true); return true; }
    return false;
  }
  storyFlag(flag) {
    const s = this.s; const c = this.g.content;
    const u = c.db.EscapeDB.unlocks[flag];
    if (!u) return !!s.world.worldFlags[flag];
    if (u.type === 'COUNT_UNIQUE_STORY_SPECIAL') return u.of.filter((o) => s.story.specialItemsGranted.includes(o.itemId)).length >= u.minimum;
    if (u.type === 'POI_DISCOVERED') return !!s.story.poiStates[u.poiId]?.discovered;
    if (u.type === 'SPECIAL_DISCOVERED') return s.story.specialItemsGranted.includes(u.itemId);
    if (u.type === 'BUILT_OR_CRAFTED') return !!s.knowledge.items[u.itemId];
    return false;
  }
  unlocked(recipe) {
    const u = recipe.unlock;
    if (u === 'START') return true;
    const [kind, id] = u.split(':');
    if (kind === 'MAT') return !!this.s.knowledge.items[id];
    if (kind === 'STATION') return !!this.s.knowledge.stations[id];
    if (kind === 'BP') return this.s.story.learnedBlueprints.includes(id);
    if (kind === 'STORY') return this.storyFlag(id);
    return false;
  }
  unlockText(recipe) {
    const [kind, id] = recipe.unlock.split(':');
    const c = this.g.content;
    if (kind === 'MAT') return `Keşfet: ${c.itemName(id)}`;
    if (kind === 'STATION') return `İstasyon kur: ${c.itemName(id)}`;
    if (kind === 'BP') return `Özel plan: ${c.blueprints.get(id) || id}`;
    if (kind === 'STORY') return ({ TWO_NAV_SOURCES: 'İki seyir kaydı bul', RADIO_STATION_DISCOVERED: 'Radyo Atölyesini keşfet', GENERATOR_CORE_FOUND: 'Jeneratör çekirdeğini bul' })[id] || id;
    return '';
  }
}
