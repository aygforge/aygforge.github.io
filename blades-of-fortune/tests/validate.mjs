// 174 olay düğümünün yapısal ve çalışma zamanı doğrulaması.
// 1) Sayılar, benzersiz kimlikler, veri bağlantıları; 2) koreografi kayıtları ve parmak izi benzersizliği;
// 3) Her düğümün HER seçeneği gerçek Event Director + çekirdek ile baştan sona oynatılır (giriş → karar → aksiyon/savaş → sonuç → çıkış → yolculuğa dönüş).
import { makeEnv, tick, PH } from './harness.mjs';
import { STANDALONE, CHAIN_STAGES, CHAINS, EVENTS } from '../src/data/index.js';
import { ITEMS, QUEST_ITEMS } from '../src/data/items.js';
import { ENEMIES } from '../src/data/enemies.js';
import { LOOKS } from '../src/render/sprites.js';
import { CFG } from '../src/config.js';

const errors = [], warns = [];
const E = (m) => errors.push(m), Wn = (m) => warns.push(m);
const NODES = [...STANDALONE, ...CHAIN_STAGES];
const CREATURES = new Set(['wolf', 'boar', 'spider', 'swamp', 'skeleton', 'ghost', 'wraith', 'shade', 'shadow', 'golem', 'troll', 'wyvern', 'horse', 'sheep', 'goat', 'rabbit', 'squirrel', 'cat', 'deer', 'frog', 'goose', 'donkey', 'crow', 'scorpion', 'orb', 'livingArmor', 'dragonPuppet', 'flyingTent']);
const STEP_TYPES = new Set(['spawn', 'remove', 'set', 'move', 'tween', 'wait', 'say', 'pose', 'shake', 'flash', 'sound', 'weather', 'particles', 'float', 'coins', 'give', 'proj', 'state', 'glow', 'emote', 'hit', 'swing', 'lunge', 'fall', 'flee', 'jump', 'spin', 'scroll', 'camera', 'dark', 'banner', 'timestop', 'speed', 'call', 'sync', 'auto']);
const LOOT = new Set(['weapon', 'armor', 'acc', 'cons', 'any', 'rare']);

// ——— 1) Sayılar ———
const standalone = STANDALONE.length, chains = Object.keys(CHAINS).length, stages = CHAIN_STAGES.length;
if (standalone !== 100) E(`Bağımsız olay sayısı 100 değil: ${standalone}`);
if (chains !== 20) E(`Zincir sayısı 20 değil: ${chains}`);
if (stages !== 74) E(`Zincir aşaması 74 değil: ${stages}`);
const ids = new Set(); for (const n of NODES) { if (ids.has(n.id)) E('Yinelenen kimlik ' + n.id); ids.add(n.id); }
const catCount = {}; for (const e of STANDALONE) catCount[e.cat] = (catCount[e.cat] || 0) + 1;
const expectCat = { danger: 20, npc: 15, explore: 15, treasure: 12, royal: 12, nature: 10, mystic: 8, absurd: 8 };
for (const [k, v] of Object.entries(expectCat)) if (catCount[k] !== v) E(`Kategori ${k}: ${catCount[k]} ≠ ${v}`);
const expectStages = { CH01: 4, CH02: 4, CH03: 4, CH04: 4, CH05: 3, CH06: 4, CH07: 4, CH08: 4, CH09: 4, CH10: 4, CH11: 3, CH12: 4, CH13: 4, CH14: 3, CH15: 3, CH16: 4, CH17: 3, CH18: 4, CH19: 4, CH20: 3 };
for (const [k, v] of Object.entries(expectStages)) if (!CHAINS[k] || CHAINS[k].stages.length !== v) E(`${k} aşama sayısı ${CHAINS[k] && CHAINS[k].stages.length} ≠ ${v}`);
if (Object.keys(ITEMS).length !== 32) E('Eşya sayısı 32 değil');
const baseEnemies = Object.keys(ENEMIES).filter((k) => k.startsWith('E_')).length;
if (baseEnemies < 12) E('Düşman türü < 12');

// ——— 2) Veri ve koreografi kayıtları ———
const fingerprints = new Map();
const walk = (steps, fn) => { for (const s of steps || []) { if (!s) continue; if (Array.isArray(s)) walk(s, fn); else fn(s); } };
for (const ev of NODES) {
  const id = ev.id;
  if (!ev.t || !ev.txt) E(`${id}: başlık/metin eksik`);
  if (!Array.isArray(ev.opts) || ev.opts.length < 2 || ev.opts.length > 4) E(`${id}: seçenek sayısı 2–4 olmalı (${ev.opts && ev.opts.length})`);
  if (!ev.reg || !ev.reg.length) E(`${id}: bölge tanımı yok`);
  if (!ev.setup && !ev.appr) E(`${id}: sahne kurulumu yok`);
  if (!ev.act) E(`${id}: aksiyon koreografisi yok`);
  if (!ev.out) E(`${id}: sonuç koreografisi yok`);
  const keys = new Set();
  const spawned = new Set(['hero']);
  const allSteps = [...(ev.setup || []), ...(ev.appr || []), ...(ev.intro || []), ...Object.values(ev.act || {}).flat(), ...Object.values(ev.out || {}).flat()];
  walk(allSteps, (s) => { if (!STEP_TYPES.has(s.type)) E(`${id}: bilinmeyen adım türü ${s.type}`); if (s.type === 'spawn') { spawned.add(s.e.id); if (!s.e.prop && !LOOKS[s.e.kind] && !CREATURES.has(s.e.kind)) E(`${id}: çizilemeyen aktör türü ${s.e.kind}`); } });
  walk(allSteps, (s) => { for (const f of ['id']) if (s[f] && typeof s[f] === 'string' && !spawned.has(s[f]) && s.type !== 'remove') Wn(`${id}: ${s.type} adımı tanımsız aktöre başvuruyor: ${s[f]}`); });
  for (const o of ev.opts || []) {
    if (!o.k || !o.l) E(`${id}: seçenek k/l eksik`);
    if (keys.has(o.k)) E(`${id}: yinelenen seçenek ${o.k}`); keys.add(o.k);
    if (!o.win) E(`${id}.${o.k}: win sonucu yok`);
    if ((o.chk || o.chance != null) && !o.lose && !o.fight) Wn(`${id}.${o.k}: şans var ama lose yok`);
    if (o.fight) for (const [, en] of o.fight.foes) if (!ENEMIES[en]) E(`${id}.${o.k}: bilinmeyen düşman ${en}`);
    const q = o.req || {};
    for (const it of [].concat(q.item || [], o.consume || [])) if (!ITEMS[it]) E(`${id}.${o.k}: bilinmeyen eşya ${it}`);
    if (q.qitem && !QUEST_ITEMS[q.qitem]) E(`${id}.${o.k}: bilinmeyen görev eşyası ${q.qitem}`);
    for (const r of [o.win, o.lose].filter(Boolean)) {
      const fx = r.fx || {};
      for (const it of [].concat(fx.item || [])) if (!ITEMS[it]) E(`${id}.${o.k}: fx bilinmeyen eşya ${it}`);
      if (fx.loot && !LOOT.has(fx.loot)) E(`${id}.${o.k}: geçersiz loot ${fx.loot}`);
      for (const qi of [fx.qitem, fx.qitemLose].filter(Boolean)) if (!QUEST_ITEMS[qi]) E(`${id}.${o.k}: bilinmeyen görev eşyası ${qi}`);
    }
    if (!(ev.act || {})[o.k]) E(`${id}.${o.k}: seçeneğe özgü aksiyon koreografisi yok`);
    const outs = Object.keys(ev.out || {}).filter((k) => k === o.k || k.startsWith(o.k + '.') || k.startsWith('*'));
    if (!outs.length) Wn(`${id}.${o.k}: sonuç koreografisi yok (yalnızca otomatik efekt)`);
  }
  for (const k of Object.keys(ev.act || {})) if (!keys.has(k)) E(`${id}: aksiyon anahtarı seçenekle eşleşmiyor: ${k}`);
  for (const k of Object.keys(ev.out || {})) { const b = k.split('.')[0]; if (b !== '*' && !keys.has(b)) E(`${id}: sonuç anahtarı seçenekle eşleşmiyor: ${k}`); }
  const fp = JSON.stringify([ev.setup, ev.appr, ev.intro, ev.act, ev.out], (k, v) => (typeof v === 'function' ? 'fn' : k === 'text' ? undefined : v));
  if (fingerprints.has(fp)) E(`${id}: koreografi ${fingerprints.get(fp)} ile aynı`); fingerprints.set(fp, id);
}

// ——— 3) Çalışma zamanı: her düğümün her seçeneği ———
let played = 0, combats = 0, optionsPlayed = 0;
function prepare(env, ev, opt) {
  const g = env.game, r = g.run;
  r.gold = 999; r.hero.baseAtk = 60; r.hero.baseHp = 400; r.hero.hp = 400; r.hero.baseDef = 30; r.hero.baseAgi = 30;
  const q = opt.req || {};
  for (const it of [].concat(q.item || [], opt.consume || [])) { r.bag.push({ id: it, n: 1 }); }
  if (q.opens) { const map = { wolf: 'X_WOLF', holy: 'X_HOLY', royal: 'X_BROOCH', mystic: 'X_EYE', stealth: 'A_LIGHT_3', chop: 'W_AXE_1', stone: 'W_AXE_3', dawn: 'W_SWORD_3' }; const it = ITEMS[map[q.opens]]; r.equip[it.slot] = it.id; }
  if (q.wfam) r.equip.weapon = { sword: 'W_SWORD_1', axe: 'W_AXE_1', spear: 'W_SPEAR_1' }[q.wfam];
  for (const f of [].concat(q.flag || [])) r.flags[f] = 1;
  if (q.qitem) r.qitems[q.qitem] = 1;
  if (ev.chain) { r.chains[ev.chain] = { status: 'active', stage: ev.stage, flags: {} }; for (const f of [].concat(q.cf || [], q.cfAll || [])) r.chains[ev.chain].flags[f] = 1; }
}
for (const ev of NODES) {
  for (const opt of ev.opts) {
    const env = makeEnv(); const g = env.game;
    try {
      g.newRun('VAL-' + ev.id + '-' + opt.k);
      prepare(env, ev, opt);
      const arrival = ev.where === 'town';
      if (arrival) {
        g.run.arrival = { townId: g.town().id, report: [], queue: [{ id: ev.id, src: 'test' }], pos: 0, current: null };
        g.run.phase = 'arrival'; g.run.visit = null; env.director.inArrival = true; env.director.playArrival();
      } else {
        g.depart(0); g.run.voyage.queue = [{ id: ev.id, src: 'test' }]; g.run.voyage.pos = 0;
        env.director.enterVoyage();
        env.director.nextAt = 0; // hemen tetikle
      }
      if (!tick(env, 30, () => env.director.phase === PH.DECISION)) throw new Error('karar aşamasına ulaşılamadı: ' + env.director.phase);
      if (env.director.eventId !== ev.id) throw new Error('yanlış olay: ' + env.director.eventId);
      const view = g.optionView(ev, opt);
      if (!view.available) throw new Error('hazırlığa rağmen seçenek kilitli: ' + view.reasons.join(', '));
      const res = env.director.choose(opt.k);
      if (!res.ok) throw new Error('seçim başarısız: ' + res.reason);
      if (res.combat) {
        combats++;
        if (!tick(env, 20, () => env.director.combatOn)) throw new Error('savaş başlamadı');
        let n = 0;
        while (env.director.combatOn && n++ < 40) { const r = env.director.combatAction({ type: n % 3 === 2 ? 'special' : 'attack' }); if (!r.ok && r.reason === 'Yeterli Odak yok.') env.director.combatAction({ type: 'attack' }); tick(env, 15, () => !env.director.busy); }
        if (env.director.combatOn) throw new Error('savaş bitmedi');
      }
      if (!tick(env, 60, () => env.director.phase === PH.OUTCOME && !env.director.steps.length && env.director.stepDur < 0)) throw new Error('sonuç aşamasına ulaşılamadı: ' + env.director.phase);
      const cur = g.host().current;
      if (!cur || !cur.result) throw new Error('sonuç kaydı yok');
      // Kaydet/yükle: sonuç ekranında kayıt yeniden okunduğunda ödül tekrar uygulanmamalı
      const goldBefore = g.run.gold, xpBefore = g.run.xp;
      const env2 = makeEnv(env.storage);
      if (!env2.game.run || env2.game.run.gold !== goldBefore || env2.game.run.xp !== xpBefore) throw new Error('kaydet/yükle tutarsız');
      const cur2 = env2.game.host().current; if (!cur2 || !cur2.result) throw new Error('yüklenen kayıtta sonuç kayıp');
      env.director.continueAfter();
      if (arrival) { if (!tick(env, 40, () => env.director.phase === PH.DOCKED)) throw new Error('kasabaya dönülemedi: ' + env.director.phase); }
      else if (!tick(env, 40, () => env.director.phase === PH.SAIL || env.director.phase === PH.DOCKING || env.director.phase === PH.DOCKED)) throw new Error('yolculuğa dönülemedi: ' + env.director.phase);
      if (!arrival) { tick(env, 25); const left = env.world.entities.filter((e) => e.encounter && e.y > -300 && e.y < 240 && !e.flee && e.alpha > 0.05); if (left.length > 12) Wn(`${ev.id}.${opt.k}: çok sayıda sahne nesnesi kaldı (${left.length})`); }
      if (env.world.hero.x !== 0 && env.director.phase === PH.SAIL) Wn(`${ev.id}.${opt.k}: kahraman yol eksenine dönmedi`);
      optionsPlayed++;
    } catch (e) { E(`${ev.id}.${opt.k}: ÇALIŞMA HATASI — ${e.message}`); }
  }
  played++;
}

// ——— Rapor ———
const report = { standalone, chains, stages, totalNodes: NODES.length, uniqueChoreographies: fingerprints.size, nodesPlayed: played, optionsPlayed, combats, items: Object.keys(ITEMS).length, enemies: baseEnemies, bosses: Object.keys(ENEMIES).length - baseEnemies, categories: catCount, errors: errors.length, warnings: warns.length };
console.log(JSON.stringify(report, null, 1));
if (warns.length) console.log('UYARILAR (' + warns.length + '):\n' + warns.slice(0, 60).join('\n'));
if (errors.length) { console.log('HATALAR:\n' + errors.join('\n')); process.exitCode = 1; } else console.log('✔ 174 düğüm doğrulandı');
import('node:fs').then((fs) => fs.writeFileSync(new URL('./validate-report.json', import.meta.url), JSON.stringify({ ...report, warningList: warns, errorList: errors }, null, 1)));
