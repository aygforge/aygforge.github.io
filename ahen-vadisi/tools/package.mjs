// Teslim paketleri: itch.io HTML5 ZIP'i (dist içeriği kökte) ve proje arşivi (node_modules hariç).
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = join(root, 'release');
mkdirSync(rel, { recursive: true });
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' });

if (!existsSync(join(root, 'dist', 'index.html'))) run('npx vite build');
const itch = join(rel, 'ahen-vadisi-html5-itch.zip');
const src = join(rel, 'ahen-vadisi-proje.zip');
for (const f of [itch, src]) rmSync(f, { force: true });
run(`zip -r -q -9 "${itch}" .`, join(root, 'dist'));
run(`zip -r -q -9 "${src}" . -x "node_modules/*" "release/*" "tests/e2e/screens/*" ".git/*"`);
console.log('Oluşturuldu:\n ', itch, '\n ', src);
