#!/usr/bin/env node
// Deterministic build: dist/ = public (index.html, style.css, generated atlases) + src (ES modules) +
// data (packaged copy of the canonical GDD v2.0 DB/Map/Art JSON needed at runtime). Fails if any atlas is missing.
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = path.join(ROOT, 'Kayip_Ufuk_GDD_v2_0');
const DIST = path.join(ROOT, 'dist');
const args = new Set(process.argv.slice(2));

if (!args.has('--skip-assets') || !existsSync(path.join(ROOT, 'public/assets/atlas_index.json'))) {
  execFileSync(process.execPath, [path.join(ROOT, 'tools/assetgen/generate.mjs')], { stdio: 'inherit' });
}
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
cpSync(path.join(ROOT, 'src'), path.join(DIST, 'src'), { recursive: true });
// runtime data copy (no QA scripts, no PNG previews, no CSV)
const index = JSON.parse(readFileSync(path.join(SPEC, 'ContentIndex_v2.0.json'), 'utf8'));
const files = ['ContentIndex_v2.0.json', 'ProductionTruth_v2.0.json', 'Art/AtlasLayout.json', 'Art/AudioManifest.json', 'Art/AvatarRig.json',
  ...Object.values(index.databaseFiles).map((d) => d.target), ...readdirSync(path.join(SPEC, 'Maps')).filter((f) => f.endsWith('.json')).map((f) => 'Maps/' + f)];
for (const f of files) { mkdirSync(path.dirname(path.join(DIST, 'data', f)), { recursive: true }); cpSync(path.join(SPEC, f), path.join(DIST, 'data', f)); }
// verify atlases
const layout = JSON.parse(readFileSync(path.join(SPEC, 'Art/AtlasLayout.json'), 'utf8'));
const missing = layout.pages.filter((p) => !existsSync(path.join(DIST, p.plannedPngPath)));
if (missing.length) { console.error('BUILD FAILED: missing atlas pages ' + missing.map((p) => p.pageId).join(', ')); process.exit(1); }
const version = { game: 'Kayıp Ufuk', version: '2.0.0', spec: 'GDD v2.0', builtUtc: new Date().toISOString(), files: files.length };
writeFileSync(path.join(DIST, 'version.json'), JSON.stringify(version, null, 1));
let total = 0; const walk = (d) => { for (const f of readdirSync(d)) { const p = path.join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p); else total += s.size; } }; walk(DIST);
console.log(`dist ready: ${(total / 1024 / 1024).toFixed(2)} MiB, ${files.length} data files, ${layout.pages.length} atlases`);
