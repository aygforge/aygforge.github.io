// Denge raporu sürücüsü (Alpha 0.2). Oyun verisini DEĞİŞTİRMEZ; varyantlar yalnızca alt süreçlere BALANCE ortam
// değişkeniyle verilir. Her kombinasyon tests/sim/batch.mjs ile aynı tohumlarla koşar (4 paralel süreç).
//
// Kullanım:
//   node tests/sim/balance.mjs [runs=100] [variants=final] [policies=random,good,bad] [profiles=none] [chapters=menemen,fries]
// Örnek: node tests/sim/balance.mjs 100 final,a01enemies random,good,bad none,upg
// Çıktı: tests/sim/balance-results.json + konsolda markdown tablo.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const [runs = '100', variantsArg = 'final', policiesArg = 'random,good,bad', profilesArg = 'none', chaptersArg = 'menemen,fries'] = process.argv.slice(2);

export const VARIANTS = {
  // the shipped Alpha 0.2 data (src/data/content.js)
  final: {},
  // Alpha 0.2 skills, but Alpha 0.1 enemy numbers (base HP, spawn x 0.86–0.93, boss at 0.86): shows what the
  // stronger skills alone would do to the old balance
  a01enemies: {
    menemen: { hpScale: 1, bossHp: 24, spawnXMin: 0.86, spawnXMax: 0.93, bossX: 0.86 },
    fries: { hpScale: 1, bossHp: 36, spawnXMin: 0.86, spawnXMax: 0.93, bossX: 0.86 },
  },
};

// Extra candidate variants for a parameter search: VARIANTS_FILE=path/to/variants.json (name -> overrides)
if (process.env.VARIANTS_FILE) Object.assign(VARIANTS, JSON.parse(readFileSync(process.env.VARIANTS_FILE, 'utf8')));
const OUT = process.env.BALANCE_OUT || join(HERE, 'balance-results.json');

function runJob(job) {
  return new Promise((resolve) => {
    const env = { ...process.env, BALANCE: JSON.stringify(VARIANTS[job.variant] || {}) };
    const p = spawn(process.execPath, [join(HERE, 'batch.mjs'), job.chapter, job.policy, String(runs), job.profile, '20000'], { env });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('close', () => {
      try {
        resolve({ ...job, ...JSON.parse(out.trim().split('\n').pop()) });
      } catch {
        resolve({ ...job, error: out.slice(0, 400) });
      }
    });
  });
}

async function main() {
  const jobs = [];
  for (const variant of variantsArg.split(','))
    for (const chapter of chaptersArg.split(','))
      for (const policy of policiesArg.split(','))
        for (const profile of profilesArg.split(',')) jobs.push({ variant, chapter, policy, profile });
  const results = [];
  const queue = jobs.slice();
  await Promise.all(
    [0, 1, 2, 3].map(async () => {
      while (queue.length) {
        const r = await runJob(queue.shift());
        results.push(r);
        process.stderr.write(`done ${r.variant}/${r.chapter}/${r.policy}/${r.profile}\n`);
      }
    }),
  );
  results.sort((a, b) => JSON.stringify([a.variant, a.chapter, a.policy, a.profile]).localeCompare(JSON.stringify([b.variant, b.chapter, b.policy, b.profile])));
  writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), runs: Number(runs), results }, null, 2));
  console.log('| Varyant | Chapter | Politika | Profil | Koşu | Galibiyet | 0/1/2/3★ | Ort. can kaybı | Ort. tur | Boss turu | Ort. yük | Tahmini dk | Hata |');
  console.log('|---|---|---|---|---:|---:|---|---:|---:|---:|---:|---:|---:|');
  for (const r of results) {
    if (r.error) {
      console.log(`| ${r.variant} | ${r.chapter} | ${r.policy} | ${r.profile} | — | HATA | | | | | | | ${r.error.slice(0, 40)} |`);
      continue;
    }
    console.log(`| ${r.variant} | ${r.chapter} | ${r.policy} | ${r.profile} | ${r.runs} | %${Math.round(r.winRate * 100)} | ${r.stars.join('/')} | ${r.avgHpLost} | ${r.avgTurns} | ${r.avgBossTurns ?? '—'} | ${r.avgLoad} | ${r.avgMinutes} | ${r.failures} |`);
  }
}

main();
