#!/usr/bin/env node
// Builds reports/test-results.json (92 runtime + 28 visual IDs) from REAL executions only:
//   - unit/system tests:   node --test --test-reporter=tap tests/unit/*.test.mjs  (re-run here, TAP kept as evidence)
//   - browser E2E:         reports/evidence/e2e-results.json      (tests/e2e/run-e2e.mjs)
//   - browser visual:      reports/evidence/visual-results.json   (tests/e2e/visual.mjs)
//   - long session:        reports/evidence/perf-longsession.json (tests/e2e/longsession.mjs)
// An ID covered by several sources is PASS only if every source passed. IDs with no execution stay NOT_RUN with a reason.
// Usage: node tools/make_test_report.mjs [--no-unit-run]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = path.join(ROOT, 'Kayip_Ufuk_GDD_v2_0');
const rd = (p) => JSON.parse(readFileSync(path.join(ROOT, p), 'utf8'));
const runtimeSrc = JSON.parse(readFileSync(path.join(SPEC, 'Contracts/AcceptanceTests.json'), 'utf8')).runtimeTests;
const visualSrc = JSON.parse(readFileSync(path.join(SPEC, 'Art/AssetAcceptanceTests.json'), 'utf8')).tests;
const TAP = 'reports/evidence/unit-tap.txt';

// ---------- 1. unit tests (TAP) ----------
if (!process.argv.includes('--no-unit-run')) {
  const files = ['boot_nav', 'craft', 'survival_eco', 'explore_endings', 'assets'].map((f) => `tests/unit/${f}.test.mjs`);
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
  writeFileSync(path.join(ROOT, TAP), r.stdout + (r.stderr ? '\n# STDERR\n' + r.stderr : ''));
}
const sources = {}; // id -> [{src,status,evidence,notes}]
const add = (id, entry) => { (sources[id] ||= []).push(entry); };
const unitSummary = { pass: 0, fail: 0 };
if (existsSync(path.join(ROOT, TAP))) {
  const lines = readFileSync(path.join(ROOT, TAP), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(ok|not ok) \d+ - (.*)$/); if (!m) continue;
    const name = m[2]; const pass = m[1] === 'ok'; pass ? unitSummary.pass++ : unitSummary.fail++;
    let loc = ''; let err = '';
    for (let j = i + 1; j < Math.min(lines.length, i + 40) && !/^(ok|not ok) \d+/.test(lines[j]); j++) {
      const l = lines[j].match(/location: '(.*?):(\d+):\d+'/); if (l) loc = `${path.relative(ROOT, l[1])}:${l[2]}`;
      const e = lines[j].match(/^\s+error: (.*)$/); if (e && !err) err = e[1].slice(0, 200);
    }
    const id = (name.match(/^((?:AT_[A-Z_]+?_\d+)|(?:VIS_\d+))\b/) || [])[1];
    if (!id) continue;
    const ev = [loc || 'tests/unit', TAP];
    const extra = path.join('reports/evidence/unit', `${id}.json`); if (existsSync(path.join(ROOT, extra))) ev.push(extra);
    if (id === 'VIS_27' && existsSync(path.join(ROOT, 'reports/evidence/atlas-validation.json'))) ev.push('reports/evidence/atlas-validation.json');
    add(id, { src: 'unit (node --test)', status: pass ? 'PASS' : 'FAIL', evidence: ev, notes: pass ? name : `${name} — ${err}` });
  }
}

// ---------- 2. browser runs ----------
for (const [file, label] of [['reports/evidence/e2e-results.json', 'browser E2E (Chromium headless)'], ['reports/evidence/visual-results.json', 'browser visual (Chromium headless)']]) {
  if (!existsSync(path.join(ROOT, file))) continue;
  const doc = rd(file);
  for (const [id, r] of Object.entries(doc.results)) {
    if (!/^(AT_|VIS_)/.test(id) || r.status === 'INFO') continue;
    add(id, { src: label, status: r.status, evidence: r.evidence.length ? r.evidence.concat([file]) : [file], notes: r.notes });
  }
}

// ---------- 3. long session ----------
const LS = 'reports/evidence/perf-longsession.json';
if (existsSync(path.join(ROOT, LS))) {
  const d = rd(LS);
  if (!d.running && d.verdict) {
    const v = d.verdict;
    add('AT_PERFORMANCE_02', { src: 'long session (Chromium headless, container)', status: v.bounded && v.durationMin >= 59.5 ? 'PASS' : v.durationMin < 59.5 ? 'NOT_RUN' : 'FAIL', evidence: [LS, 'tests/e2e/longsession.mjs'],
      notes: `${v.durationMin} min real time, ${v.visits} visits over 12 regions + 3 caves; heap ${v.heapStartMiB}→${v.heapEndMiB} MiB (max ${v.heapMaxMiB}), 2nd-half slope ${v.secondHalfSlopeMiBPer10Min} MiB/10 min; caches bounded (chunks ≤${v.maxChunks}, decor ≤${v.maxDecor}, avatar ≤${v.maxAvatarCache}); errors ${v.errors.length}. Headless desktop Chromium, NOT a phone — repeat on target Android.` });
  }
}

// ---------- 4. explicitly not executable here ----------
const MOBILE = 'No physical mobile device or GPU is available in this cloud container; only headless desktop Chromium.';
const notRun = {
  AT_PERFORMANCE_01: `${MOBILE} Requires midrange Android hardware (procedure). Headless reference in reports/evidence/e2e/perf_desktop_headless.json.`,
  AT_PERFORMANCE_03: `${MOBILE} Cold boot must be measured on the supported mobile device. Emulated reference (Pixel-class viewport, 4× CPU throttle) in reports/evidence/mobile-reference.json.`,
  AT_PERFORMANCE_04: `${MOBILE} Requires a human 30-minute playtest at the smallest landscape width. Automated partial evidence: touch-target audit (AT_INPUT_UI_06) and first shelter/tools craftable (AT_ITEM_CRAFT_01) both PASS.`,
  VIS_22: `${MOBILE} Decoded-asset budget must be profiled on device. Container run shows bounded caches (perf-longsession.json) but all 24 atlas pages stay resident (96 MiB worst-case decoded vs 48 MiB target; no scene-scoped eviction implemented).`,
  VIS_23: `${MOBILE} Requires the lowest target Android device (cave, rain, swarm, busy camp).`,
};

// ---------- merge ----------
const merge = (t) => {
  const list = sources[t.id] || [];
  if (!list.length) return { id: t.id, priority: t.priority, status: notRun[t.id] ? 'NOT_RUN' : 'NOT_RUN', evidence: notRun[t.id] && existsSync(path.join(ROOT, 'reports/evidence/mobile-reference.json')) && t.id === 'AT_PERFORMANCE_03' ? ['reports/evidence/mobile-reference.json'] : [], notes: notRun[t.id] || 'No automated or manual execution recorded.', sources: [] };
  const statuses = list.map((x) => x.status);
  const status = statuses.includes('FAIL') ? 'FAIL' : statuses.every((s) => s === 'PASS') ? 'PASS' : statuses.includes('BLOCKED') ? 'BLOCKED' : 'NOT_RUN';
  return { id: t.id, priority: t.priority, status: notRun[t.id] && status !== 'FAIL' ? 'NOT_RUN' : status, evidence: [...new Set(list.flatMap((x) => x.evidence))], notes: (notRun[t.id] ? notRun[t.id] + ' | ' : '') + list.map((x) => `[${x.src}] ${x.notes}`).join(' | ').slice(0, 1500), sources: list.map((x) => x.src) };
};
const runtime = runtimeSrc.map(merge), visual = visualSrc.map(merge);
const count = (l) => l.reduce((a, t) => ((a[t.status] = (a[t.status] || 0) + 1), a), {});
const p0open = [...runtime, ...visual].filter((t) => t.priority === 'P0' && t.status !== 'PASS').map((t) => t.id);
const chromium = (() => { try { const req = createRequire(import.meta.url); const pkg = path.join(path.dirname(req.resolve('playwright')), 'package.json'); return `Chromium headless (Playwright ${JSON.parse(readFileSync(pkg, 'utf8')).version})`; } catch { return 'Chromium headless (Playwright)'; } })();
const version = existsSync(path.join(ROOT, 'dist/version.json')) ? rd('dist/version.json') : {};
const report = {
  sourceVersion: 'v2.0', generatedUtc: new Date().toISOString(), generator: 'tools/make_test_report.mjs',
  environment: { browser: chromium, device: 'Linux cloud container, headless, no GPU, no physical mobile device', build: `dist (${version.version || '?'}, built ${version.builtUtc || '?'})`, node: process.version },
  summary: { runtime: count(runtime), visual: count(visual), unitTests: unitSummary, p0NotPassed: p0open },
  releaseReady: p0open.length === 0 && ![...runtime, ...visual].some((t) => t.status === 'FAIL'),
  releaseReadyNote: 'RELEASE_READY requires every P0 PASS and no FAIL. P1 device/performance tests that are NOT_RUN are listed in reports/STATUS.md and reports/NEXT_STEPS.md.',
  runtime, visual,
};
writeFileSync(path.join(ROOT, 'reports/test-results.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report.summary), 'releaseReady=', report.releaseReady);
