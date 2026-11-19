// Packages dist/ into release/varneth-itch.zip with index.html at the ZIP root.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('dist/index.html missing — run npm run build'); process.exit(1); }
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (/(src|href)="\/(?!\/)/.test(html)) { console.error('absolute asset paths found in index.html'); process.exit(1); }
fs.mkdirSync(path.join(root, 'release'), { recursive: true });
const out = path.join(root, 'release', 'varneth-itch.zip');
fs.rmSync(out, { force: true });
execFileSync('zip', ['-r', '-q', '-9', out, '.'], { cwd: dist });
const list = execFileSync('unzip', ['-l', out]).toString();
if (!/\sindex\.html\n/.test(list)) { console.error('index.html not at zip root'); process.exit(1); }
console.log(`created ${path.relative(root, out)} (${(fs.statSync(out).size / 1048576).toFixed(2)} MB)`);
