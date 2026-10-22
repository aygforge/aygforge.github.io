// Oynanış doğrulama botu (yalnız geliştirme / test). Üretim paketine dahil edilmez.
// Gerçek oyun çalışma zamanını bir oyuncu gibi kullanır: dokun-hedefle (selectTarget/selectInteract),
// joystick (kaçınma), beceriler, iksirler, NPC işlemleri (act.*). Stat/EXP/eşya hilesi YAPMAZ.
import { app } from '../core/app.js';
import { act } from '../ui/actions.js';
import { ui } from '../ui/ui.js';
import { joy } from '../world/input.js';
import { MAPS, WAYSTONES } from '../data/maps/index.js';
import { QUESTS, QUEST_MAP, CLASS_QUESTS } from '../data/quests.js';
import { ENEMIES } from '../data/enemies.js';
import { ITEMS, ITEM_LIST, canClassUse, isUpgradeable } from '../data/items.js';
import { POTIONS } from '../data/materials.js';
import { SKILLS, CLASS_SKILLS } from '../data/skills.js';
import { TILE, SLOTS, cumulativeXp } from '../data/constants.js';
import { RECIPES } from '../data/recipes.js';
import { questStatus, isReady, objectiveDone, canInteractQuestObject } from '../systems/quests.js';
import { statPointsFree, canRankUp, gainExp } from '../systems/character.js';
import { statsWithItem, computeStats } from '../systems/stats.js';
import { countStack, addStack } from '../systems/inventory.js';
import { upgradeInfo, repairAllCost, craftCheck } from '../systems/economy.js';
import { currentStage } from '../systems/dungeon.js';
import { createItem } from '../systems/loot.js';
import { Rng } from '../core/rng.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms / (app.timeScale || 1)));
const W = () => app.world;
const P = () => app.world?.player;
const C = () => app.char;
const LOG = [];
const stats = { deaths: 0, kills: 0, started: Date.now(), events: [] };
let stopFlag = false;
function log(msg) {
  const ch = C();
  const line = `[${((Date.now() - stats.started) / 1000).toFixed(0)}s · oyun ${(ch?.record.playTime / 60).toFixed(1)}dk · Lv${ch?.level} · ${ch?.gold}G] ${msg}`;
  LOG.push(line);
  console.log('BOT', line);
}

// ------------------------------------------------------------------ temel bekleme
async function until(fn, timeout = 60000, step = 120) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (stopFlag) throw new Error('durduruldu');
    await handleDeath();
    try { if (fn()) return true; } catch { /* sahne geçişi */ }
    await sleep(step);
  }
  return false;
}

async function waitWorld(mapId) {
  return until(() => W() && W().mapId === mapId && P() && !W().changing && W().scene.isActive(), 30000);
}

async function handleDeath() {
  if (P()?.dead) {
    stats.deaths++;
    const p = P(), ch = app.char;
    const near = W().enemies.filter((e) => !e.dead && (e.state === 'chase' || e.state === 'attack') && Math.hypot(e.x - p.x, e.y - p.y) < 6 * TILE).map((e) => `${e.tpl.id}:${e.tpl.level}`);
    const pots = Object.keys(POTIONS).filter((id) => id.startsWith('hp')).map((id) => countStack(ch.bag, id)).join('/');
    const now = W().clock, by = {};
    for (const h of W().combat.hurtLog || []) if (now - h.t < 20000) by[`${h.src}/${h.label}`] = (by[`${h.src}/${h.label}`] || 0) + h.dmg;
    const tgt = p.lastTarget && !p.lastTarget.dead ? ` hedefHP=%${Math.round(100 * p.lastTarget.hp / p.lastTarget.maxHp)}` : '';
    log(`ÖLÜM #${stats.deaths} (${W().mapId}) Lv${ch.level} maxHP=${app.stats().maxHp} saldıranlar=[${near.join(',')}] hpİksir=${pots} son20sn=${JSON.stringify(by)}${tgt}`);
    await new Promise((r) => setTimeout(r, 1300));
    const btn = document.querySelector('[data-testid=respawn]');
    if (btn) { ui.closeModal(); W().respawn(); }
    await new Promise((r) => setTimeout(r, 500));
  }
  // beklenmeyen modal/panel açık kaldıysa kapat
  if (ui.layers.modal.firstChild && !document.querySelector('[data-testid=respawn]')) ui.closeModal();
  if (ui.openName) ui.closePanel();
}

// ------------------------------------------------------------------ hareket
async function goTo(tx, ty, tol = 1.3, timeout = 150000) {
  const t0 = Date.now();
  let fails = 0;
  while (Date.now() - t0 < timeout) {
    await handleDeath();
    const p = P(), w = W();
    if (!p) { await sleep(200); continue; }
    const gx = tx * TILE + 16, gy = ty * TILE + 16;
    if (Math.hypot(p.x - gx, p.y - gy) <= tol * TILE) return true;
    await dodge();
    // yolda saldırıya uğrarsa karşılık ver (tehlikeli elitten ise kaç)
    if (!goTo.busy) {
      const att = w.enemies.find((e) => !e.dead && (e.state === 'chase' || e.state === 'attack') && e.tpl.kind !== 'boss' && Math.hypot(e.x - p.x, e.y - p.y) < 3 * TILE);
      if (att) {
        goTo.busy = true;
        try { if (isDanger(att)) await flee(att); else await fight(att, 60000); } finally { goTo.busy = false; }
        continue;
      }
    }
    const path = w.grid.findPath(p.x, p.y, gx, gy, 80000);
    if (!path || !path.length) {
      if (++fails > 4) { log(`yol yok → (${tx},${ty}) ${w.mapId}`); return false; }
      await sleep(400); continue;
    }
    // ~10 tile ileriye ara hedef
    let idx = Math.min(path.length - 1, 10);
    const wp = path[idx];
    let reached = false;
    const fake = { x: wp.x, y: wp.y, interactRange: idx === path.length - 1 ? tol * TILE : 20, height: 0, radius: 6, interact: () => { reached = true; } };
    p.selectInteract(fake);
    await until(() => reached || !p.approaching || p.dead || W() !== w, 15000, 80);
    if (W() !== w) return true; // portala girildi
  }
  log(`zaman aşımı → (${tx},${ty})`);
  return false;
}

// Telegraflı saldırıdan kaçın: oyuncu bir uyarı alanının içindeyse merkezden uzaklaş
async function dodge() {
  const w = W(), p = P();
  if (!w || !p || p.dead) return;
  const tgs = w.children.list.filter((o) => o.active && o.texture?.key?.startsWith('tg_') && o.alpha > 0.1);
  for (const g of tgs) {
    const r = Math.max(g.displayWidth, g.displayHeight) / 2;
    let cx = g.x, cy = g.y;
    if (g.texture.key === 'tg_rect') { cx = g.x + Math.cos(g.rotation) * g.displayWidth / 2; cy = g.y + Math.sin(g.rotation) * g.displayWidth / 2; }
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < r + 20) {
      let ax = p.x - cx, ay = p.y - cy;
      if (g.texture.key === 'tg_rect') { ax = -Math.sin(g.rotation); ay = Math.cos(g.rotation); }
      const n = Math.hypot(ax, ay) || 1;
      joy.active = true; joy.x = ax / n; joy.y = ay / n;
      await sleep(650);
      joy.active = false; joy.x = 0; joy.y = 0;
      return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------ haritalar arası
const LINKS = { village: { forest: 'v_to_forest' }, forest: { village: 'f_to_village', mine: 'f_to_mine' }, mine: { forest: 'm_to_forest', swamp: 'm_to_swamp' }, swamp: { mine: 's_to_mine' }, dungeon: {} };
function route(from, to) {
  const q = [[from]], seen = new Set([from]);
  while (q.length) {
    const r = q.shift(), last = r[r.length - 1];
    if (last === to) return r;
    for (const n of Object.keys(LINKS[last] || {})) if (!seen.has(n)) { seen.add(n); q.push([...r, n]); }
  }
  return null;
}
async function travel(mapId) {
  if (W().mapId === mapId) return true;
  if (W().mapId === 'dungeon') {
    const exit = MAPS.dungeon.objects.find((o) => o.dungeonExit);
    W().changeMap(exit.to, exit.entry, { exitDungeon: true });
    await waitWorld('mine');
  }
  // yol taşıyla kısa yol
  const ws = Object.entries(WAYSTONES).find(([id, x]) => x.map === mapId && C().world.waystones.includes(id));
  const here = MAPS[W().mapId].objects.find((o) => o.type === 'waystone');
  const hops = route(W().mapId, mapId)?.length - 1;
  if (ws && here && hops >= 2 && C().gold >= WAYSTONES[ws[0]].cost + 200) {
    await goTo(here.x, here.y + 1, 2);
    act.travel(ws[0]);
    if (await waitWorld(mapId)) { log(`yol taşı → ${mapId}`); return true; }
  }
  const r = route(W().mapId, mapId);
  for (let i = 1; i < r.length; i++) {
    const portal = MAPS[r[i - 1]].objects.find((o) => o.id === LINKS[r[i - 1]][r[i]]);
    const px = Math.min(Math.max(portal.x, 1), MAPS[r[i - 1]].w - 2), py = Math.min(Math.max(portal.y, 1), MAPS[r[i - 1]].h - 2);
    await goTo(px, py, 0.5);
    if (!(await waitWorld(r[i]))) { log(`harita geçişi başarısız ${r[i - 1]}→${r[i]}`); return false; }
  }
  return true;
}

// ------------------------------------------------------------------ savaş
// Oyuncudan yüksek seviyeli elit/boss: gerçek oyuncu gibi bilerek çekilmez
let hunting = null;
const avoidUntil = {};   // elit id → gerçek zaman (ms); bu süre içinde kampında farm yapılmaz
// farm için: elit kampında, elitten 2 seviye üstün değilsek veya yakın zamanda elitten kaçtıysak farm yapma
function campAvoided(id, fledOnly = false) {
  for (const def of Object.values(MAPS)) {
    for (const a of def.areas) {
      if (!a.elite || !(a.spawns || []).some((x) => x.enemy === id)) continue;
      if ((avoidUntil[a.elite] || 0) > Date.now() || (!fledOnly && ENEMIES[a.elite].level >= C().level - 1)) return true;
    }
  }
  return false;
}
function isDanger(e) { return !e.dead && e.tpl.id !== hunting && W().mapId !== 'dungeon' && (e.tpl.kind === 'elite' || e.tpl.kind === 'boss') && e.tpl.level >= C().level - 1; }
function dangerNear(x, y, tiles) { return W().enemies.find((e) => isDanger(e) && Math.hypot(e.x - x, e.y - y) < tiles * TILE); }

function nearestEnemy(ids, maxTiles = 200) {
  const p = P(), all = W().enemies;
  // mesafe + yakınındaki her başka düşman için ceza (tek tek çekmeyi tercih et)
  const cost = (e) => Math.hypot(e.x - p.x, e.y - p.y) + 4 * TILE * all.filter((o) => o !== e && !o.dead && o.tpl.kind !== 'dummy' && Math.hypot(o.x - e.x, o.y - e.y) < 4 * TILE).length;
  return all.filter((e) => !e.dead && ids.includes(e.tpl.id) && Math.hypot(e.x - p.x, e.y - p.y) < maxTiles * TILE && (isDanger(e) || !dangerNear(e.x, e.y, 9)))
    .sort((a, b) => cost(a) - cost(b))[0];
}

// Savaş dışı HP yenilenmesini bekle (kimse kovalamıyorsa), gerçek oyuncu gibi
async function rest(minPct = 0.6) {
  const t0 = Date.now();
  while (C().hp / app.stats().maxHp < minPct && Date.now() - t0 < 25000 / (app.timeScale || 1)) {
    const p = P();
    if (!p || p.dead) return;
    if (W().enemies.some((e) => !e.dead && (e.state === 'chase' || e.state === 'attack') && Math.hypot(e.x - p.x, e.y - p.y) < 8 * TILE)) return;
    await sleep(400);
  }
}

// Tehlikeden uzaklaş (elit veya iksirsiz düşük HP)
async function flee(from) {
  const p = P(), g = W().grid;
  stats.flees = (stats.flees || 0) + 1;
  if (from.tpl?.kind === 'elite') avoidUntil[from.tpl.id] = Date.now() + 150000 / (app.timeScale || 1);
  p.clearTarget();
  log(`uzaklaş: ${from.tpl?.name || '?'}`);
  const base = Math.atan2(p.y - from.y, p.x - from.x);
  for (const off of [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9]) {
    for (const d of [16, 11]) {
      const tx = Math.floor((p.x + Math.cos(base + off) * d * TILE) / TILE), ty = Math.floor((p.y + Math.sin(base + off) * d * TILE) / TILE);
      if (g.blocked(tx, ty)) continue;
      const path = g.findPath(p.x, p.y, tx * TILE + 16, ty * TILE + 16, 20000);
      if (path && path.length) { const b = goTo.busy; goTo.busy = true; try { await goTo(tx, ty, 2, 20000); } finally { goTo.busy = b; } return true; }
    }
  }
  return false;
}

// bilerek girilen elit/boss savaşında ondan kaçılmaz (çağrıları temizlerken de)
async function fight(e, timeout = 120000) {
  const prev = hunting;
  if (e.tpl.kind === 'boss' || e.tpl.kind === 'elite') hunting = e.tpl.id;
  try { return await fightLoop(e, timeout); } finally { hunting = prev; }
}

async function fightLoop(e, timeout) {
  const p = P();
  const t0 = Date.now();
  p.selectTarget(e);
  p.lastTarget = e;
  const deaths0 = stats.deaths;
  while (!e.dead && Date.now() - t0 < timeout) {
    if (p.dead) return false;   // ölüm: çağıran yeniden planlar (handleDeath orada)
    await handleDeath();
    if (P() !== p || p.dead || stats.deaths !== deaths0) return false;
    if (await dodge()) { p.selectTarget(e); continue; }
    const de = dangerNear(p.x, p.y, 7);
    if (de && de !== e) { log(`kaçış: ${de.tpl.name} (Lv${de.tpl.level})`); await flee(de); return false; }
    const hpLeft = ['hp_s', 'hp_m', 'hp_l'].reduce((a, id) => a + countStack(C().bag, id), 0);
    if (!hpLeft && C().hp / app.stats().maxHp < 0.22 && e.tpl.kind !== 'boss' && e.hp / e.maxHp > 0.3) { log('iksir yok, HP kritik → geri çekil'); await flee(e); return false; }
    if (!p.target) p.selectTarget(e);
    if (p.target !== e && p.target && !p.target.dead) e = p.target;
    // Mage mesafe korur (kiting): yakın dövüşçü 2,8 tile içine girince kısa süre uzaklaş; hedef korunur
    if (C().cls !== 'warrior' && (e.tpl.kind === 'boss' || e.tpl.kind === 'elite') && Math.hypot(e.x - p.x, e.y - p.y) < 2.8 * TILE) {
      const ax = p.x - e.x, ay = p.y - e.y, n = Math.hypot(ax, ay) || 1;
      joy.active = true; joy.x = ax / n; joy.y = ay / n;
      await sleep(700);
      joy.active = false; joy.x = 0; joy.y = 0;
      continue;
    }
    // boss savaşında yakındaki çağrıları önce temizle
    if (e.tpl.kind === 'boss') {
      const add = W().enemies.find((x) => !x.dead && x.summoned && x.tpl.ai !== 'static' && Math.hypot(x.x - p.x, x.y - p.y) < 2.5 * TILE);
      if (add) { await fight(add, 20000); p.selectTarget(e); continue; }
    }
    // beceriler (koruma becerileri önce)
    const acts = CLASS_SKILLS[C().cls].actives;
    const hpPct = C().hp / app.stats().maxHp;
    for (let i = 0; i < 4; i++) {
      const s = SKILLS[acts[i]];
      if (!C().skills[acts[i]] || p.cooldowns[acts[i]] > 0) continue;
      if (s.target === 'self' && hpPct > 0.75) continue;
      if (s.id === 'war_charge' && Math.hypot(e.x - p.x, e.y - p.y) < 3 * TILE) continue;
      if (p.useSkill(i)) break;
    }
    // iksir yedeği (otomatik iksir de açık)
    if (C().hp / app.stats().maxHp < 0.3) p.usePotion('hp', true);
    if (!p.approaching && !p.inAttackRange(e) && Date.now() - t0 > 4000) p.selectTarget(e);
    await sleep(150);
  }
  if (e.dead) stats.kills++;
  return e.dead;
}

async function killEnemies(ids, count, areaHint, farming = false) {
  let done = 0;
  for (let guard = 0; guard < count * 6 && done < count; guard++) {
    if (farming && ids.every((id) => campAvoided(id, true))) break;
    await handleDeath();
    await manage();
    await rest();
    let e = nearestEnemy(ids, 60);
    if (!e) {
      if (areaHint) await goTo(areaHint.x, areaHint.y, 3);
      await until(() => nearestEnemy(ids, 60), 25000);
      e = nearestEnemy(ids, 60);
      if (!e) continue;
    }
    const dist = Math.hypot(e.x - P().x, e.y - P().y) / TILE;
    if (dist > 8) await goTo(Math.floor(e.x / TILE), Math.floor(e.y / TILE), 5);
    const d0 = stats.deaths;
    if (await fight(e)) done++;
    else if (stats.deaths > d0 || P()?.dead) { await handleDeath(); return done; }
  }
  return done;
}

// ------------------------------------------------------------------ karakter yönetimi
function itemScore(st) { return st.power * 1.0 + st.def * 0.6 + st.mdef * 0.4 + st.maxHp * 0.06 + st.maxMp * 0.02 + st.critChance * 60 + st.atkSpeed * 60; }

async function manage() {
  const ch = C();
  if (!ch) return;
  // stat puanları
  const free = statPointsFree(ch);
  if (free > 0) {
    const main = { warrior: 'str', mage: 'int', archer: 'dex', necromancer: 'int' }[ch.cls];
    const a = { str: 0, dex: 0, int: 0, vit: 0 };
    a[main] = Math.ceil(free * 0.65); a.vit = free - a[main];
    act.allocate(a);
  }
  // beceriler
  const order = {
    warrior: ['heavy_strike', 'weapon_discipline', 'whirlwind', 'hard_skin', 'iron_skin', 'heavy_strike', 'battle_rhythm', 'war_charge'],
    mage: ['fireball', 'elemental_mastery', 'ice_blast', 'mana_control', 'mana_shield', 'meteor', 'frozen_target'],
    archer: ['aimed_shot', 'sharpshooter', 'multi_shot', 'agile_reflex', 'piercing_arrow', 'hunter_instinct', 'agile_step'],
    necromancer: ['soul_arrow', 'dark_knowledge', 'summon_skeleton', 'bone_bond', 'life_drain', 'soul_harvest', 'curse_seal'],
  }[ch.cls];
  for (let k = 0; k < 3; k++) for (const id of order) if (canRankUp(ch, id).ok) act.rankUp(id);
  // ekipman
  if (ch.pending.length) act.claimPending();
  for (let i = 0; i < ch.bag.size; i++) {
    const it = ch.bag.slots[i];
    if (!it || it.q !== undefined) continue;
    const t = ITEMS[it.tid];
    if (!canClassUse(t, ch.cls) || ch.level < t.lv) continue;
    const cur = itemScore(computeStats(ch));
    if (itemScore(statsWithItem(ch, it)) > cur + 0.5 && act.equip(i)?.ok) log(`kuşandı: ${t.name} (${it.r})`);
  }
  // otomatik iksir
  ch.autoPotion.hpOn = true; ch.autoPotion.hpPct = 45; ch.autoPotion.mpOn = true; ch.autoPotion.mpPct = 20;
  W().autoAttack = true;
}

async function townRun() {
  await travel('village');
  const ch = C();
  const npc = (id) => MAPS.village.objects.find((o) => o.npc === id);
  await goToNpc('mira');
  // önemsiz eşyaları sat (kuşanılamayan / daha zayıf), kilitlileri koru
  for (let i = 0; i < ch.bag.size; i++) {
    const it = ch.bag.slots[i];
    if (!it || it.q !== undefined || it.lock || it.r === 'L') continue;
    const t = ITEMS[it.tid];
    const usable = canClassUse(t, ch.cls) && ch.level >= t.lv && itemScore(statsWithItem(ch, it)) > itemScore(computeStats(ch));
    // demir lazımsa N/U çöpü parçala (Hurda → Demir), değilse sat
    const needIron = countStack(ch.bag, 'iron') < 4;
    if (!usable && needIron && (it.r === 'N' || it.r === 'U')) act.dismantle(i);
    else if (!usable && (it.r === 'N' || it.r === 'U' || !canClassUse(t, ch.cls) || t.lv + 6 < ch.level)) act.sell(i);
  }
  for (const m of ['small_fur', 'wolf_tooth', 'wolf_pelt', 'swamp_mud', 'old_armor_scrap', 'captain_badge', 'executioner_brand', 'alpha_claw', 'golem_shard']) {
    for (let i = 0; i < ch.bag.size; i++) if (ch.bag.slots[i]?.tid === m) act.sell(i);
  }
  await goToNpc('elin');
  const hpBest = ['hp_l', 'hp_m', 'hp_s'].find((id) => POTIONS[id].lv <= ch.level);
  const mpBest = ['mp_l', 'mp_m', 'mp_s'].find((id) => POTIONS[id].lv <= ch.level);
  const wantHp = ch.cls === 'warrior' ? 16 : 12, wantMp = ch.cls === 'warrior' ? 6 : ch.cls === 'archer' ? 8 : 10;
  const buy = (id, want, share) => { const n = Math.max(0, want - countStack(ch.bag, id)); const afford = Math.floor((ch.gold * share) / POTIONS[id].buy); const q = Math.min(n, afford); if (q > 0) act.buyPotion(id, q); };
  // iksir ekipmandan önce gelir; pahalı iksire yetmiyorsa küçük iksir
  buy(Math.floor((ch.gold * 0.6) / POTIONS[hpBest].buy) >= 6 ? hpBest : 'hp_s', wantHp, 0.6);
  buy(ch.gold > 600 ? mpBest : 'mp_s', wantMp, 0.4);
  if (ch.bag.size < 42 && ch.gold > 3500) act.expandBag();
  await goToNpc('mira');
  // boş slotlara tüccarın temel ekipmanını al (iksirden kalan parayla)
  for (const [tid, t] of Object.entries(ITEMS)) {
    if (!t.sources.includes('merchant') || !canClassUse(t, ch.cls) || ch.equipment[t.slot]) continue;
    if (t.slot === 'offhand' && computeStats(ch).twoHanded) continue;
    if (ch.gold < 150) break;
    const r = act.buyEquip(tid);
    if (r.ok) { const i = ch.bag.slots.findIndex((x) => x?.uid === r.inst.uid); act.equip(i); log(`tüccardan alındı: ${t.name}`); }
  }
  await goToNpc('boran');
  if (repairAllCost(ch) > 0 && ch.gold > repairAllCost(ch)) act.repair();
  // demir üret ve silahı yükselt
  while (craftCheck(ch, 'r_iron').ok) act.craft('r_iron');
  while (craftCheck(ch, 'r_iron_scrap').ok) act.craft('r_iron_scrap');
  while (craftCheck(ch, 'r_iron_junk').ok) act.craft('r_iron_junk');
  // sınıfa uygun ekipman tarifleri (ör. Avcı Palası) — sahip değilse ve parası yetiyorsa üret
  for (const r of RECIPES) {
    const t = r.out.equip && ITEMS[r.out.id];
    if (!t || !canClassUse(t, ch.cls) || t.lv > ch.level || ch.gold < (r.gold || 0) + 150) continue;
    if (SLOTS.some((sl) => ch.equipment[sl]?.tid === t.id) || ch.bag.slots.some((x) => x?.tid === t.id)) continue;
    if (craftCheck(ch, r.id).ok && act.craft(r.id).ok) log(`üretildi: ${t.name}`);
  }
  await manage();
  for (const slot of ['weapon', 'chest', 'offhand']) {
    const it = ch.equipment[slot];
    if (!it) continue;
    for (let k = 0; k < 3; k++) {
      const info = upgradeInfo(it);
      if (!info.ok || info.to > 3) break;
      if (ch.gold < info.gold + 300) break;
      if (!info.mats.every((m) => countStack(ch.bag, m.id) >= m.qty)) {
        if (info.mats[0].id === 'hardening_stone' && craftCheck(ch, 'r_hardening').ok) act.craft('r_hardening');
        else break;
      }
      const r = act.upgrade({ where: 'equip', slot });
      if (r.ok) log(`yükseltme ${slot}: ${r.success ? 'BAŞARILI' : 'başarısız'} → +${r.plus}`);
    }
  }
}

async function goToNpc(id) {
  await travel('village');
  const o = MAPS.village.objects.find((x) => x.npc === id);
  await goTo(o.x, o.y + 1, 1.5);
}

// ------------------------------------------------------------------ görevler
async function questObjective(q) {
  const ch = C();
  for (let i = 0; i < q.objectives.length; i++) {
    const o = q.objectives[i];
    if (objectiveDone(ch, q, i) || o.type === 'talk') continue;
    const hint = o.hint || q.hint;
    if (o.type === 'kill' || o.type === 'qitem') {
      const ids = o.type === 'kill' ? (o.enemy ? [o.enemy] : (o.enemies === '*' ? Object.values(ENEMIES).filter((e) => e.kind === 'normal' && e.level >= (o.minLevel || 0)).map((e) => e.id) : o.enemies)) : o.from;
      const mapId = hint?.map || findEnemyMap(ids[0]);
      if (ids.includes('mine_golem')) { await dungeonRun(true); continue; }
      if (ids.includes('training_dummy')) { await travel('village'); }
      else await travel(mapId);
      if (['swamp_executioner', 'bandit_captain', 'red_vein_watcher'].includes(ids[0])) { await eliteHunt(ids[0]); continue; }
      const bossQuest = ids.some((id) => ENEMIES[id]?.kind === 'boss');
      if (bossQuest) { await brewPotions(12); await travel(mapId); }
      let d0 = stats.deaths, dPrep = stats.deaths;
      while (!objectiveDone(C(), q, i)) {
        if (bossQuest && stats.deaths > dPrep) { dPrep = stats.deaths; await townRun(); await brewPotions(12); await travel(mapId); }
        if (stats.deaths - d0 >= 3 && C().level < 20) { log('çok ölüm → seviye kas'); await farmTo(C().level + 1); d0 = stats.deaths; await travel(mapId); }
        const area = hint && hint.map === W().mapId ? hint : areaOf(ids[0]);
        const n = await killEnemies(ids, 1, area);
        if (!n) await sleep(500);
        if (needTown()) { await townRun(); await travel(mapId); }
      }
    } else if (o.type === 'reach') {
      await travel(hint.map);
      const loc = MAPS[hint.map].locations.find((l) => l.id === o.loc);
      await goTo(loc.x, loc.y, 1.5);
      await until(() => objectiveDone(C(), q, i), 4000);
    } else if (o.type === 'interact') {
      for (const [mid, def] of Object.entries(MAPS)) {
        for (const ob of def.objects.filter((x) => x.group === o.group)) {
          if (objectiveDone(C(), q, i)) break;
          if (!canInteractQuestObject(C(), o.group, ob.id)) continue;
          await travel(mid);
          const obj = W().objects.find((x) => x.o?.id === ob.id);
          await goTo(ob.x, ob.y + 1, 1.2);
          for (let t = 0; t < 4 && canInteractQuestObject(C(), o.group, ob.id); t++) {
            // yakındaki saldırganları önce temizle (kanal hasarla kesilir)
            const near = W().enemies.filter((e) => !e.dead && e.state !== 'idle' && e.tpl.kind !== 'dummy' && Math.hypot(e.x - P().x, e.y - P().y) < 6 * TILE);
            for (const e of near) await fight(e, 60000);
            P().selectInteract(W().objects.find((x) => x.o?.id === ob.id) || obj);
            await until(() => !canInteractQuestObject(C(), o.group, ob.id), 8000);
          }
        }
      }
    } else if (o.type === 'deliver') {
      await gather(o.item, o.count);
    } else if (o.type === 'dungeon') {
      await dungeonRun(false, o.stage);
    }
  }
}

function findEnemyMap(id) {
  for (const [mid, def] of Object.entries(MAPS)) for (const a of def.areas) if ((a.spawns || []).some((s) => s.enemy === id) || a.elite === id || a.boss === id) return mid;
  return 'forest';
}
function areaOf(id) {
  for (const def of Object.values(MAPS)) for (const a of def.areas) if ((a.spawns || []).some((s) => s.enemy === id) || a.elite === id || a.boss === id) return { x: a.x, y: a.y, map: def.id };
  return null;
}
function needTown() {
  const ch = C();
  const hp = ['hp_s', 'hp_m', 'hp_l'].reduce((a, id) => a + countStack(ch.bag, id), 0);
  const lowDur = SLOTS.some((s) => ch.equipment[s] && ch.equipment[s].d < 30);
  const full = ch.bag.slots.filter(Boolean).length >= ch.bag.size - 2;
  return (hp < 3 && ch.gold >= 60) || lowDur || full;
}

// Boss öncesi hazırlık: Şifalı Ot topla ve Elin'de ucuz HP iksiri üret (gerçek oyuncunun parasız yolu)
async function brewPotions(target = 12) {
  const hpCount = () => ['hp_s', 'hp_m', 'hp_l'].reduce((a, id) => a + countStack(C().bag, id), 0);
  if (hpCount() >= target) return;
  const need = target - hpCount();
  await gather('healing_herb', Math.min(24, need * 2));
  await travel('village');
  await goToNpc('elin');
  const n = Math.floor(countStack(C().bag, 'healing_herb') / 2);
  const bottles = n - countStack(C().bag, 'empty_bottle');
  if (bottles > 0) act.buyBottle(bottles);
  let made = 0;
  for (let i = 0; i < n; i++) if (craftCheck(C(), 'r_hp_s').ok && act.craft('r_hp_s').ok) made++;
  if (made) log(`iksir üretildi: Küçük HP ×${made}`);
}

async function gather(item, count) {
  const mapId = item === 'healing_herb' ? 'forest' : item === 'mana_herb' ? 'swamp' : 'mine';
  await travel(mapId);
  const skip = new Set();
  for (let g = 0; g < 60 && countStack(C().bag, item) < count; g++) {
    const nodes = W().objects.filter((o) => o.kind === 'gather' && o.mat === item && !o.depleted && !skip.has(o));
    if (!nodes.length) { await sleep(3000); continue; }
    const p = P();
    nodes.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const n = nodes[0];
    const g = W().grid;
    const spot = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]].map(([dx, dy]) => [n.o.x + dx, n.o.y + dy]).find(([x, y]) => !g.blocked(x, y));
    if (!spot || !(await goTo(spot[0], spot[1], 1.2, 40000))) { skip.add(n); continue; }
    p.selectInteract(n);
    await until(() => n.depleted, 6000);
  }
}

async function eliteHunt(id) {
  const area = areaOf(id);
  await travel(area.map);
  log(`elit avı: ${ENEMIES[id].name}`);
  hunting = id;
  for (let k = 0; k < 400; k++) {
    const e = nearestEnemy([id], 200);
    if (e) { await goTo(Math.floor(e.x / TILE), Math.floor(e.y / TILE), 5); if (await fight(e, 240000)) { log(`${ENEMIES[id].name} yenildi`); hunting = null; return; } continue; }
    // bölgedeki normal yaratıkları keserek eliti çağır
    const camp = MAPS[area.map].areas.find((a) => a.elite === id);
    await killEnemies(camp.spawns.map((s) => s.enemy), 1, camp);
    if (needTown()) { await townRun(); await travel(area.map); }
  }
}

async function dungeonRun(boss, stageTarget = 3) {
  await travel('mine');
  const gate = MAPS.mine.objects.find((o) => o.type === 'dungeon_gate');
  await goTo(gate.x, gate.y + 3, 1.5);
  W().changeMap('dungeon', null, { enterDungeon: true });
  await waitWorld('dungeon');
  log(`dungeon koşusu (bölüm ${currentStage(C())})`);
  for (let k = 0; k < 300; k++) {
    const st = currentStage(C());
    if (!boss && st > stageTarget) return;
    if (st > 4) { log('Golem yenildi!'); return; }
    const list = W().enemies.filter((e) => !e.dead && e.stage === st);
    if (!list.length) { await sleep(500); continue; }
    const p = P();
    list.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const e = list[0];
    await goTo(Math.floor(e.x / TILE), Math.floor(e.y / TILE), 5);
    await fight(e, e.tpl.kind === 'boss' ? 600000 : 120000);
    const hpPots = ['hp_s', 'hp_m', 'hp_l'].reduce((a, id) => a + countStack(C().bag, id), 0);
    if (hpPots < 2 && st < 4 && C().gold > 300 && !boss) { log('iksir bitti → köy'); await townRun(); return dungeonRun(boss, stageTarget); }
  }
}

async function farmTo(level) {
  log(`farm → Lv${level}`);
  const tooHard = {};   // yaratık id → bu farm sırasında ölüm sayısı
  while (C().level < level) {
    const L = C().level;
    // seviyeye uygun en yüksek yaratık
    let opts = Object.values(ENEMIES).filter((e) => e.kind === 'normal' && e.level <= L && e.level >= L - 4 && findEnemyMap(e.id) !== 'dungeon');
    if (opts.some((e) => !campAvoided(e.id))) opts = opts.filter((e) => !campAvoided(e.id));
    if (opts.some((e) => (tooHard[e.id] || 0) < 2)) opts = opts.filter((e) => (tooHard[e.id] || 0) < 2);
    opts.sort((a, b) => b.level - a.level);
    const target = opts[0] || ENEMIES.meadow_rat;
    const area = areaOf(target.id);
    await travel(area.map);
    const d0 = stats.deaths;
    await killEnemies([target.id], 6, area, true);
    if (stats.deaths > d0) { tooHard[target.id] = (tooHard[target.id] || 0) + 1; if (tooHard[target.id] >= 2) log(`farm hedefi bırakıldı: ${target.name}`); }
    if (needTown()) await townRun();
  }
}

// ------------------------------------------------------------------ ana akış
export async function runStory({ maxMinutes = 600 } = {}) {
  stopFlag = false;
  stats.started = Date.now();
  log(`BOT başladı: ${C().name} (${C().cls})`);
  const main = QUESTS.filter((q) => q.main).sort((a, b) => a.order - b.order);
  for (const q of [...main]) {
    if (Date.now() - stats.started > maxMinutes * 60000) { log('süre sınırı'); break; }
    await manage();
    if (questStatus(C(), q) === 'done') continue;
    // sınıf görevleri (beceri puanı) uygun olunca
    for (const cq of CLASS_QUESTS) if (questStatus(C(), cq) === 'available') { await goToNpc('sage'); act.acceptQuest(cq.id); log(`sınıf görevi alındı ${cq.name}`); }
    if (questStatus(C(), q) === 'lowlevel') await farmTo(q.minLevel);
    // makul oyuncu: önerilen seviyenin alt sınırına, boss görevlerinde bir üstüne kadar kas
    const recLow = parseInt(q.rec, 10) || q.minLevel;
    const want = Math.min(20, recLow + (['m07', 'm17'].includes(q.id) ? 1 : 0));
    if (C().level < want && questStatus(C(), q) !== 'done' && !(C().quests[q.id] && isReady(C(), q))) await farmTo(want);
    if (questStatus(C(), q) === 'available') {
      await townRun();
      await goToNpc('muhtar');
      act.acceptQuest(q.id);
      log(`görev alındı: ${q.order}. ${q.name}`);
    }
    for (let attempt = 0; attempt < 6 && !isReady(C(), q); attempt++) {
      if (questStatus(C(), q) !== 'active') { log(`görev aktif değil (${questStatus(C(), q)}): ${q.name}`); break; }
      if (attempt) log(`görev tekrar deneniyor (${attempt}): ${q.name}`);
      await questObjective(q);
      await until(() => isReady(C(), q), 3000);
    }
    for (const cq of CLASS_QUESTS) if (C().quests[cq.id]?.s === 'active' && isReady(C(), cq)) { await goToNpc('sage'); act.turnIn(cq.id, 'sage'); log(`sınıf görevi tamam ${cq.name}`); }
    await goToNpc('muhtar');
    const r = act.turnIn(q.id, 'muhtar');
    log(`görev ${r.ok ? 'TESLİM' : 'TESLİM EDİLEMEDİ: ' + r.msg}: ${q.order}. ${q.name}`);
    stats.events.push({ q: q.id, level: C().level, playMin: +(C().record.playTime / 60).toFixed(1), deaths: stats.deaths });
    await app.flushSave('bot');
  }
  log(`BİTTİ. Ölüm: ${stats.deaths}, öldürme: ${stats.kills}, Lv ${C().level}`);
  return { log: LOG, stats, char: { level: C().level, gold: C().gold, quests: Object.keys(C().quests).length, titles: C().titles, mastery: C().mastery, legend: C().record.legendaries } };
}

// Hedefli Golem denemesi (yalnız geliştirme): belge §5'teki "Lv.20 Warrior Rare +3/+4" donanımıyla
// gerçek savaş — bot telegraflardan kaçar, iksir kullanır; süre oyun saatiyle ölçülür.
export async function golemTrial({ plus = 3, hpPotions = 15, maxDeaths = 3 } = {}) {
  stopFlag = false;
  const ch = C(), rng = new Rng(2026);
  gainExp(ch, Math.max(0, cumulativeXp(20) - ch.exp));
  ch.world.dungeonUnlocked = true;
  for (const slot of SLOTS) {
    const opts = ITEM_LIST.filter((t) => t.slot === slot && canClassUse(t, ch.cls) && t.lv <= 20 && t.allowedRarities.includes('R'));
    if (slot === 'offhand' && ITEMS[ch.equipment.weapon?.tid]?.hand === 'two') { ch.equipment.offhand = null; continue; }
    const pref = slot === 'weapon' ? opts.filter((t) => t.hand !== 'two') : opts;
    const t = (pref.length ? pref : opts).sort((a, b) => b.lv - a.lv)[0];
    if (!t) continue;
    const it = createItem(t.id, 'R', rng);
    if (isUpgradeable(t)) it.p = plus;
    ch.equipment[slot] = it;
  }
  addStack(ch.bag, 'hp_l', hpPotions); addStack(ch.bag, 'mp_l', 10);
  app.changed('equip');
  await manage();
  const gear = SLOTS.map((sl) => ch.equipment[sl] && `${ITEMS[ch.equipment[sl].tid].name}+${ch.equipment[sl].p}`).filter(Boolean).join(', ');
  log(`Golem denemesi: Lv${ch.level} ${ch.cls} · ${gear} · HP ${app.stats().maxHp}`);
  W().changeMap('dungeon', null, { enterDungeon: true });
  await waitWorld('dungeon');
  for (const st of [1, 2, 3]) { for (const e of W().enemies) if (!e.dead && e.stage === st) W().spawner.despawn(e); W().checkStageCleared(st); }
  const cp = MAPS.dungeon.entries.checkpoint;
  P().x = cp.x * TILE + 16; P().y = cp.y * TILE + 16;
  const res = { attempts: [] };
  for (let attempt = 1; attempt <= maxDeaths + 1; attempt++) {
    await until(() => W().enemies.some((e) => !e.dead && e.tpl.id === 'mine_golem'), 30000);
    const g = W().enemies.find((e) => !e.dead && e.tpl.id === 'mine_golem');
    const t0 = W().clock, pot0 = countStack(C().bag, 'hp_l'), d0 = stats.deaths;
    await goTo(Math.floor(g.x / TILE), Math.floor(g.y / TILE), 6);
    await fight(g, 1800000);
    const sec = Math.round((W().clock - t0) / 1000);
    const a = { attempt, won: g.dead, sec, golemHpPct: Math.round(100 * Math.max(0, g.hp) / g.maxHp), potionsUsed: pot0 - countStack(C().bag, 'hp_l') };
    res.attempts.push(a);
    log(`Golem denemesi #${attempt}: ${g.dead ? 'YENİLDİ' : 'ölüm'} · ${sec} sn oyun · Golem HP %${a.golemHpPct} · iksir ${a.potionsUsed}`);
    if (g.dead || (!P().dead && stats.deaths === d0)) break;
    await handleDeath();
    // her denemeden önce oyuncu gibi ikmal: iksirler yeniden tamamlanır
    addStack(C().bag, 'hp_l', Math.max(0, hpPotions - countStack(C().bag, 'hp_l')));
    if (attempt >= maxDeaths) break;
  }
  return res;
}

export function stop() { stopFlag = true; }
export function getLog() { return { log: LOG.slice(-60), stats }; }
window.__AHEN_BOT = { runStory, stop, getLog };
