// Denge simülasyonu: çok sayıda seed üzerinde otomatik run oynatır ve ekonomi/ölüm/event dağılımını raporlar.
// Kullanım: node tools/simulate.mjs [runSayısı] [--meta]   (--meta: run'lar arası kalıcı ilerleme birikir)
import { createBot, newCore } from './bot.mjs';
import { HARBOR_BY_ID } from '../src/data/harbors.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { voyageDuration } from '../src/systems/RouteSystem.js';

const N = Number(process.argv[2] || 300);
const withMeta = process.argv.includes('--meta');
let core = newCore();
const agg = { minutes: 0, sail: 0, complete: 0, sunk: 0, harbors: 0, gold: 0, xp: 0, upgrades: 0, events: 0, cats: {}, deathRegion: {}, maxLevel: {}, routeLen: 0, upgradeHarborGap: [] };
const errors = [];
for (let i = 0; i < N; i++) {
  if (!withMeta) core = newCore();
  const seed = 'SIM' + i.toString(36).toUpperCase();
  core.newRun(seed);
  const bot = createBot(core, { rngSeed: i + 7, smart: process.argv.includes('--smart') });
  try {
    const { result, stats } = bot.playRun();
    const run = core.run;
    agg[result === 'complete' ? 'complete' : 'sunk']++;
    agg.harbors += run.stats.harborsReached;
    // süre tahmini: gerçek seyir süreleri + event başına ~20 sn karar/animasyon + liman başına ~75 sn
    let sail = 0;
    run.route.forEach((r, i) => { if (r.distance && i < run.route.length - 1) sail += voyageDuration(run.seed, i, r.distance); });
    agg.sail += sail / 60;
    agg.minutes += (sail + stats.events * 20 + run.stats.harborsReached * 75) / 60;
    agg.routeLen += run.totalHarbors;
    agg.gold += run.stats.maxGold;
    agg.xp += run.xp.total;
    agg.upgrades += stats.upgrades;
    agg.events += stats.events;
    if (stats.upgrades) agg.upgradeHarborGap.push(run.stats.harborsReached / stats.upgrades);
    agg.maxLevel[run.ship.level] = (agg.maxLevel[run.ship.level] || 0) + 1;
    for (const [k, v] of Object.entries(stats.cats)) agg.cats[k] = (agg.cats[k] || 0) + v;
    if (result !== 'complete') agg.deathRegion[stats.deathRegion] = (agg.deathRegion[stats.deathRegion] || 0) + 1;
    core.dismissSummary();
    if (withMeta) {
      for (const u of UPGRADES) if (core.meta.xpAvailable >= u.cost) core.buyUpgrade(u.id);
    }
  } catch (e) {
    errors.push({ seed, e: e.stack || String(e) });
    core = newCore();
  }
}
const ok = N - errors.length;
const pct = (x) => ((x / ok) * 100).toFixed(1) + '%';
console.log(`\n=== Tides of Fortune simülasyonu: ${N} run${withMeta ? ' (meta birikimli)' : ''} ===`);
console.log(`Tamamlanan: ${agg.complete} (${pct(agg.complete)})  Batan: ${agg.sunk} (${pct(agg.sunk)})`);
console.log(`Ortalama rota uzunluğu: ${(agg.routeLen / ok).toFixed(2)}  ulaşılan liman: ${(agg.harbors / ok).toFixed(2)}`);
console.log(`Tahmini run süresi: ${(agg.minutes / ok).toFixed(1)} dk (saf seyir ${(agg.sail / ok).toFixed(1)} dk)`);
console.log(`Ortalama en yüksek altın: ${(agg.gold / ok).toFixed(0)}  run XP: ${(agg.xp / ok).toFixed(0)}`);
console.log(`Gemi yükseltme / run: ${(agg.upgrades / ok).toFixed(2)}  yükseltme başına liman: ${agg.upgradeHarborGap.length ? (agg.upgradeHarborGap.reduce((a, b) => a + b, 0) / agg.upgradeHarborGap.length).toFixed(2) : '-'}`);
console.log(`Run sonu gemi seviyesi dağılımı:`, agg.maxLevel);
console.log(`Event / run: ${(agg.events / ok).toFixed(1)}  kategori dağılımı:`, Object.fromEntries(Object.entries(agg.cats).map(([k, v]) => [k, ((v / agg.events) * 100).toFixed(1) + '%'])));
console.log(`Batış bölgeleri:`, agg.deathRegion);
if (withMeta) console.log('Meta sonu upgrade sayısı:', core.meta.upgrades.length, 'XP:', core.meta.xpTotalEarned);
if (errors.length) {
  console.log(`\nHATALAR (${errors.length}):`);
  for (const e of errors.slice(0, 5)) console.log(e.seed, e.e);
  process.exitCode = 1;
}
