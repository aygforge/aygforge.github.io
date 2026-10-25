// Inlines src/style.css and src/*.js into a single self-contained index.html
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'src');
const shell = fs.readFileSync(path.join(src, 'shell.html'), 'utf8');
const css = fs.readFileSync(path.join(src, 'style.css'), 'utf8');
const js = fs.readdirSync(src).filter(f => /^\d\d_.*\.js$/.test(f)).sort()
  .map(f => `// ---- ${f}\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
if (js.includes('</script')) throw new Error('script terminator inside JS');
const out = shell.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
const dest = path.join(__dirname, '..', 'index.html');
fs.writeFileSync(dest, out);
console.log('wrote', dest, Math.round(out.length / 1024) + ' KB');
