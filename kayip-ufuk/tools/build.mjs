#!/usr/bin/env node
// Deterministic build: dist/ = public (index.html, style.css, generated atlases) + src (ES modules) +
// data (packaged copy of the canonical GDD v2.0 DB/Map/Art JSON needed at runtime). Fails if any atlas is missing.
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { validateAtlases } from './validate_atlases.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = path.join(ROOT, 'Kayip_Ufuk_GDD_v2_0');
const DIST = path.join(ROOT, 'dist');
const argv = process.argv.slice(2); const args = new Set(argv);

/** Packaging verification: every atlas page present and physically valid (no missing sprite shipped silently). */
function verifyPackage(dir) {
  const r = validateAtlases(dir);
  if (!r.ok) { console.error(`PACKAGING VERIFICATION FAILED (${path.relative(ROOT, dir) || '.'}): ${r.errorCount} errors\n  ` + r.errors.slice(0, 10).join('\n  ')); process.exit(1); }
  console.log(`packaging verification OK: ${r.pagesChecked} atlas pages, ${r.spritesChecked} sprites physically validated`);
}
if (args.has('--verify-dir')) { verifyPackage(path.resolve(argv[argv.indexOf('--verify-dir') + 1])); process.exit(0); }


// Atlases are committed artefacts (procedural generator + farm asset pack import). Regenerate only on request:
// `--assets` runs tools/assetgen/generate.mjs and then tools/farmpack/import_farmpack.py (needs the pack locally,
// see tools/farmpack/README.md). Without --assets the committed public/assets are packaged as they are.
if (args.has('--assets') || !existsSync(path.join(ROOT, 'public/assets/atlas_index.json'))) {
  execFileSync(process.execPath, [path.join(ROOT, 'tools/assetgen/generate.mjs')], { stdio: 'inherit' });
  execFileSync('python3', [path.join(ROOT, 'tools/farmpack/import_farmpack.py')], { stdio: 'inherit' });
}
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
cpSync(path.join(ROOT, 'src'), path.join(DIST, 'src'), { recursive: true });
if (existsSync(path.join(ROOT, 'CREDITS.md'))) cpSync(path.join(ROOT, 'CREDITS.md'), path.join(DIST, 'CREDITS.md')); // asset licence: credit ships with the game
// runtime data copy (no QA scripts, no PNG previews, no CSV)
const index = JSON.parse(readFileSync(path.join(SPEC, 'ContentIndex_v2.0.json'), 'utf8'));
const files = ['ContentIndex_v2.0.json', 'ProductionTruth_v2.0.json', 'Art/AtlasLayout.json', 'Art/AudioManifest.json', 'Art/AvatarRig.json',
  ...Object.values(index.databaseFiles).map((d) => d.target), ...readdirSync(path.join(SPEC, 'Maps')).filter((f) => f.endsWith('.json')).map((f) => 'Maps/' + f)];
for (const f of files) { mkdirSync(path.dirname(path.join(DIST, 'data', f)), { recursive: true }); cpSync(path.join(SPEC, f), path.join(DIST, 'data', f)); }
// verify atlases
const layout = JSON.parse(readFileSync(path.join(SPEC, 'Art/AtlasLayout.json'), 'utf8'));
const missing = layout.pages.filter((p) => !existsSync(path.join(DIST, p.plannedPngPath)));
if (missing.length) { console.error('BUILD FAILED: missing atlas pages ' + missing.map((p) => p.pageId).join(', ')); process.exit(1); }
verifyPackage(DIST);
const version = { game: 'Kayıp Ufuk', version: '2.0.0', spec: 'GDD v2.0', builtUtc: new Date().toISOString(), files: files.length };
writeFileSync(path.join(DIST, 'version.json'), JSON.stringify(version, null, 1));
let total = 0; const walk = (d) => { for (const f of readdirSync(d)) { const p = path.join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p); else total += s.size; } }; walk(DIST);
console.log(`dist ready: ${(total / 1024 / 1024).toFixed(2)} MiB, ${files.length} data files, ${layout.pages.length} atlases`);
