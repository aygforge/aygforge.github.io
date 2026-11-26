// Builds the single-file offline game: FootballWars_Roguelite_Reborn.html
const fs = require('fs'), path = require('path');
const S = f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8');
const order = ['v4_data.js', 'v4_font.js', 'engine_rogue.js', 'v4_director.js', 'sprites.js', 'render.js', 'v3.js', 'v4_audio.js', 'arcade_audio.js', 'rogue_data.js', 'rogue_core.js', 'rogue_app.js'];
let html = S('rogue_shell.html').replace('/*@@CSS@@*/', () => S('rogue_style.css'));
const scripts = order.map(f => '<script>/* ---- ' + f + ' ---- */\n' + S(f).replace(/<\/script/gi, '<\\/script') + '\n</script>').join('\n');
html = html.replace('<!--@@SCRIPTS@@-->', () => scripts);
const out = path.join(__dirname, '../FootballWars_Roguelite_Reborn.html');
fs.writeFileSync(out, html);
console.log('built', out, (html.length / 1024).toFixed(1) + ' KB');
if (/<script[^>]+src=|<link[^>]+href=["']https?:/i.test(html)) console.log('WARNING: external script/css reference');
