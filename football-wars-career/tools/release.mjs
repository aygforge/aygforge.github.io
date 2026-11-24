// Packages the build: standalone HTML, itch.io ZIP (index.html at the root), source ZIP. Uses the system `zip`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync, rmSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rel = resolve(root, 'release'), tmp = resolve(root, '.itch-tmp');
if (!existsSync(resolve(root, 'dist/index.html'))) throw new Error('run vite build first');
mkdirSync(rel, { recursive: true });
copyFileSync(resolve(root, 'dist/index.html'), resolve(rel, 'FootballWarsCareer.html'));
for (const f of ['README.md', 'TEST_REPORT.md', 'LICENSES.md']) if (existsSync(resolve(root, f))) copyFileSync(resolve(root, f), resolve(rel, f));
// itch.io: index.html must be at the ZIP root
rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp);
copyFileSync(resolve(root, 'dist/index.html'), resolve(tmp, 'index.html'));
copyFileSync(resolve(root, 'LICENSES.md'), resolve(tmp, 'LICENSES.md'));
rmSync(resolve(rel, 'FootballWarsCareer_itch.zip'), { force: true });
execFileSync('zip', ['-X', '-q', '-j', resolve(rel, 'FootballWarsCareer_itch.zip'), resolve(tmp, 'index.html'), resolve(tmp, 'LICENSES.md')]);
rmSync(tmp, { recursive: true, force: true });
// source: modular code, data, tests, tools, docs (no node_modules / build output)
rmSync(resolve(rel, 'FootballWarsCareer_source.zip'), { force: true });
execFileSync('zip', ['-X', '-q', '-r', resolve(rel, 'FootballWarsCareer_source.zip'), 'src', 'tests', 'tools', 'index.html', 'vite.config.js', 'package.json', 'package-lock.json', 'README.md', 'TEST_REPORT.md', 'LICENSES.md', '.gitignore',
  '-x', '*/node_modules/*', '*.DS_Store'], { cwd: root });
const sz = f => (statSync(resolve(rel, f)).size / 1024).toFixed(1) + ' KB';
const out = ['FootballWarsCareer.html', 'FootballWarsCareer_itch.zip', 'FootballWarsCareer_source.zip'].map(f => `${f}  ${sz(f)}`);
writeFileSync(resolve(rel, 'MANIFEST.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
