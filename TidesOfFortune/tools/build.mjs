// Derleme: dist/TidesOfFortune.html (tek dosya) + dist/web/ (statik hosting, itch.io, Capacitor).
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const web = path.join(dist, 'web');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(web, 'assets/fonts'), { recursive: true });
fs.mkdirSync(path.join(web, 'assets/icons'), { recursive: true });

await import('./make-icons.mjs');

const res = await build({ entryPoints: [path.join(root, 'src/main.js')], bundle: true, format: 'iife', minify: true, target: ['chrome80', 'safari13', 'firefox80'], write: false, legalComments: 'none' });
const js = res.outputFiles[0].text;
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// dist/web
for (const f of fs.readdirSync(path.join(root, 'assets/fonts'))) fs.copyFileSync(path.join(root, 'assets/fonts', f), path.join(web, 'assets/fonts', f));
for (const f of fs.readdirSync(path.join(root, 'assets/icons'))) fs.copyFileSync(path.join(root, 'assets/icons', f), path.join(web, 'assets/icons', f));
fs.writeFileSync(path.join(web, 'game.js'), js);
fs.writeFileSync(path.join(web, 'style.css'), css);
fs.copyFileSync(path.join(root, 'manifest.webmanifest'), path.join(web, 'manifest.webmanifest'));
fs.copyFileSync(path.join(root, 'sw.js'), path.join(web, 'sw.js'));
fs.writeFileSync(path.join(web, 'index.html'), html.replace('<script type="module" src="src/main.js"></script>', '<script src="game.js"></script>'));

// tek dosya: fontlar base64, ikon data URI, CSS ve JS satır içi
const inlineCss = css.replace(/url\('assets\/fonts\/([^']+)'\)/g, (_, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(root, 'assets/fonts', f)).toString('base64')})`);
const icon = `data:image/png;base64,${fs.readFileSync(path.join(root, 'assets/icons/icon-192.png')).toString('base64')}`;
let single = html
  .replace('<link rel="manifest" href="manifest.webmanifest">', '')
  .replace(/href="assets\/icons\/icon-192.png"/g, `href="${icon}"`)
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${inlineCss}\n</style>`)
  .replace('<script type="module" src="src/main.js"></script>', () => `<script>window.__TOF_SINGLE_FILE__=true;</script>\n<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);
fs.writeFileSync(path.join(dist, 'TidesOfFortune.html'), single);
const kb = (p) => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
console.log('dist/TidesOfFortune.html', kb(path.join(dist, 'TidesOfFortune.html')));
console.log('dist/web/game.js', kb(path.join(web, 'game.js')));
