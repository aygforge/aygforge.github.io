// Karakter oluşturma, EXP/seviye, stat dağıtma, beceri rankları ve sıfırlamalar.
import { CLASSES } from '../data/classes.js';
import { ITEMS } from '../data/items.js';
import { SKILLS, CLASS_SKILLS, maxRank, rankUpCost, MASTERY_BOOKS, MASTERY_BOOK_LEVEL } from '../data/skills.js';
import { countStack, removeStack } from './inventory.js';
import { MAX_LEVEL, STAT_POINTS_PER_LEVEL, BAG_START, SLOTS, xpToNext, RESET_COST, SCHEMA_VERSION, SKILL_BAR_SIZE } from '../data/constants.js';
import { MAPS } from '../data/maps/index.js';
import { makeContainer } from './inventory.js';
import { createItem } from './loot.js';
import { computeStats } from './stats.js';
import { makeUid } from '../core/rng.js';

export function validateName(name) {
  const n = (name || '').trim();
  if (n.length < 3 || n.length > 14) return { ok: false, msg: 'İsim 3–14 karakter olmalı' };
  if (!/^[A-Za-zÇĞİÖŞÜçğıöşü0-9 ]+$/.test(n)) return { ok: false, msg: 'Yalnızca harf, rakam ve boşluk' };
  return { ok: true, name: n };
}

export function createCharacter({ name, cls, slot }, rng) {
  const c = CLASSES[cls];
  if (!c) throw new Error('Geçersiz sınıf');
  const entry = MAPS.village.entries.start;
  const char = {
    v: SCHEMA_VERSION,
    id: makeUid('c'), slot, name, cls,
    level: 1, exp: 0, gold: 20,
    alloc: { str: 0, dex: 0, int: 0, vit: 0 },
    skills: {}, bonusSkillPoints: 0, mastery: false,
    equipment: Object.fromEntries(SLOTS.map((s) => [s, null])),
    bag: makeContainer(BAG_START),
    pending: [],
    quests: {},
    contract: null, contractsDone: 0,
    world: {
      map: 'village', x: entry.x, y: entry.y,
      discovered: {}, waystones: ['ws_village'], dungeonUnlocked: false,
      bossRespawnAt: {}, elite: {}, altarReadyAt: {}, activeTime: 0, tutorialDone: false,
    },
    dungeon: null,
    claims: {},
    autoPotion: { hpOn: false, hpPct: 35, mpOn: false, mpPct: 25 },
    hp: 0, mp: 0,
    record: { kills: 0, deaths: 0, playTime: 0, bossKills: {}, legendaries: 0, upgrades: 0, killsByEnemy: {} },
    titles: [],
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  ensureV2Fields(char, true);
  for (const tid of c.starterKit) {
    const inst = createItem(tid, null, rng, { noBonus: true, src: 'starter' });
    char.equipment[ITEMS[tid].slot] = inst;
  }
  unlockSkillsForLevel(char);
  const st = computeStats(char);
  char.hp = st.maxHp;
  char.mp = st.maxMp;
  return char;
}

// V2 alanları: yeni karakterde boş başlar; V1 kaydından geçişte (migrate) eksik olanlar eklenir.
// Var olan V1 verisine (seviye, eşya, görev, kayıtlar) dokunulmaz.
export function newHistory(fromV1 = false) {
  return { since: Date.now(), fromV1, kills: 0, byEnemy: {}, bossKills: {}, found: { R: 0, E: 0, L: 0 }, dungeons: {} };
}

export function ensureV2Fields(char, fresh = false) {
  if (!Array.isArray(char.skillBar)) char.skillBar = defaultSkillBar(char);
  if (!char.masteryBooks || typeof char.masteryBooks !== 'object') char.masteryBooks = {};
  if (!char.history || typeof char.history !== 'object') char.history = newHistory(!fresh);
  if (!char.runs || typeof char.runs !== 'object') char.runs = {};
  const w = char.world;
  if (w) {
    if (!w.flags || typeof w.flags !== 'object') w.flags = {};
    if (!w.chests || typeof w.chests !== 'object') w.chests = {};
  }
  char.v = SCHEMA_VERSION;
  return char;
}

// Varsayılan beceri çubuğu: V1 düzeni (ilk 4 aktif). 5. aktif açılınca Beceriler ekranından değiştirilir.
export function defaultSkillBar(char) {
  return CLASS_SKILLS[char.cls].actives.slice(0, SKILL_BAR_SIZE);
}

export function setSkillBar(char, slot, id) {
  const cs = CLASS_SKILLS[char.cls];
  if (slot < 0 || slot >= SKILL_BAR_SIZE) return { ok: false, msg: 'Geçersiz yuva' };
  if (!cs.actives.includes(id)) return { ok: false, msg: 'Geçersiz beceri' };
  if (!char.skills[id]) return { ok: false, msg: `Seviye ${SKILLS[id].unlock}'te açılır` };
  const bar = char.skillBar.slice();
  const prev = bar.indexOf(id);
  if (prev >= 0) bar[prev] = bar[slot];        // yer değiştir
  bar[slot] = id;
  char.skillBar = bar;
  return { ok: true };
}

// ------------------------------------------------------------------ Ustalık Kitapları (V2)
export function canApplyMasteryBook(char, id) {
  const s = SKILLS[id];
  if (!s || s.cls !== char.cls || s.kind !== 'active' || !MASTERY_BOOKS[id]) return { ok: false, msg: 'Geçersiz beceri' };
  if (char.level < MASTERY_BOOK_LEVEL) return { ok: false, msg: `Seviye ${MASTERY_BOOK_LEVEL} gerekli` };
  if ((char.skills[id] || 0) < maxRank(s)) return { ok: false, msg: 'Beceri Rank 5 olmalı' };
  if (char.masteryBooks?.[id]) return { ok: false, msg: 'Bu beceriye zaten kitap uygulandı' };
  if (countStack(char.bag, 'mastery_book') < 1) return { ok: false, msg: 'Ustalık Kitabı yok' };
  return { ok: true };
}

export function applyMasteryBook(char, id) {
  const chk = canApplyMasteryBook(char, id);
  if (!chk.ok) return chk;
  removeStack(char.bag, 'mastery_book', 1);
  char.masteryBooks = char.masteryBooks || {};
  char.masteryBooks[id] = true;
  return { ok: true, book: MASTERY_BOOKS[id] };
}

// ------------------------------------------------------------------ EXP / seviye
export function gainExp(char, amount) {
  const events = [];
  if (char.level >= MAX_LEVEL) return { gained: 0, events };
  char.exp += Math.max(0, Math.round(amount));
  while (char.level < MAX_LEVEL && char.exp >= xpToNext(char.level)) {
    char.exp -= xpToNext(char.level);
    char.level += 1;
    const unlocked = unlockSkillsForLevel(char);
    events.push({ type: 'levelup', level: char.level, unlocked });
  }
  if (char.level >= MAX_LEVEL) char.exp = 0;
  if (events.length) {
    const st = computeStats(char);
    char.hp = st.maxHp;
    char.mp = st.maxMp;
  }
  return { gained: amount, events };
}

export function unlockSkillsForLevel(char) {
  const cs = CLASS_SKILLS[char.cls];
  const unlocked = [];
  for (const id of [...cs.actives, ...cs.passives]) {
    if (!char.skills[id] && SKILLS[id].unlock <= char.level) {
      char.skills[id] = 1;
      unlocked.push(id);
    }
  }
  return unlocked;
}

// ------------------------------------------------------------------ Stat puanları
export function statPointsTotal(char) { return STAT_POINTS_PER_LEVEL * (char.level - 1); }
export function statPointsSpent(char) { return Object.values(char.alloc).reduce((a, b) => a + b, 0); }
export function statPointsFree(char) { return statPointsTotal(char) - statPointsSpent(char); }

export function allocateStats(char, add) {
  const sum = Object.values(add).reduce((a, b) => a + Math.max(0, b | 0), 0);
  if (sum <= 0) return { ok: false, msg: 'Dağıtılacak puan yok' };
  if (sum > statPointsFree(char)) return { ok: false, msg: 'Yeterli stat puanı yok' };
  const before = computeStats(char);
  for (const k of ['str', 'dex', 'int', 'vit']) char.alloc[k] += Math.max(0, add[k] | 0);
  const after = computeStats(char);
  char.hp = Math.min(after.maxHp, char.hp + Math.max(0, after.maxHp - before.maxHp));
  char.mp = Math.min(after.maxMp, char.mp + Math.max(0, after.maxMp - before.maxMp));
  return { ok: true };
}

// ------------------------------------------------------------------ Beceri puanları
export function skillPointsTotal(char) { return (char.level - 1) + (char.bonusSkillPoints || 0); }
export function skillPointsSpent(char) {
  let spent = 0;
  for (const [id, rank] of Object.entries(char.skills)) {
    const s = SKILLS[id];
    for (let r = 2; r <= rank; r++) spent += rankUpCost(s, r);
  }
  return spent;
}
export function skillPointsFree(char) { return skillPointsTotal(char) - skillPointsSpent(char); }

export function canRankUp(char, id) {
  const s = SKILLS[id];
  if (!s || s.cls !== char.cls || (s.kind !== 'active' && s.kind !== 'passive')) return { ok: false, msg: 'Geçersiz beceri' };
  const r = char.skills[id] || 0;
  if (!r) return { ok: false, msg: `Seviye ${s.unlock}'te açılır` };
  if (r >= maxRank(s)) return { ok: false, msg: 'En yüksek rank' };
  const cost = rankUpCost(s, r + 1);
  if (skillPointsFree(char) < cost) return { ok: false, msg: `${cost} beceri puanı gerekli`, cost };
  return { ok: true, cost };
}

export function rankUp(char, id) {
  const chk = canRankUp(char, id);
  if (!chk.ok) return chk;
  char.skills[id] += 1;
  return { ok: true, rank: char.skills[id] };
}

export function resetSkills(char) {
  const cost = RESET_COST(char.level);
  if (char.gold < cost) return { ok: false, msg: `${cost} Gold gerekli` };
  if (skillPointsSpent(char) === 0) return { ok: false, msg: 'Sıfırlanacak puan yok' };
  char.gold -= cost;
  for (const id of Object.keys(char.skills)) char.skills[id] = 1;
  return { ok: true, cost };
}

export function resetStats(char) {
  const cost = RESET_COST(char.level);
  if (char.gold < cost) return { ok: false, msg: `${cost} Gold gerekli` };
  if (statPointsSpent(char) === 0) return { ok: false, msg: 'Sıfırlanacak puan yok' };
  char.gold -= cost;
  char.alloc = { str: 0, dex: 0, int: 0, vit: 0 };
  const st = computeStats(char);
  char.hp = Math.min(char.hp, st.maxHp);
  char.mp = Math.min(char.mp, st.maxMp);
  return { ok: true, cost };
}

export function clampVitals(char) {
  const st = computeStats(char);
  char.hp = Math.max(0, Math.min(char.hp, st.maxHp));
  char.mp = Math.max(0, Math.min(char.mp, st.maxMp));
  return st;
}
