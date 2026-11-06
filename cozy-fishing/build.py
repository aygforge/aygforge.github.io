#!/usr/bin/env python3
"""Cozy Fishing build: src/*.js + JSON verileri -> tek dosya index.html (+ ZIP)."""
import json, os, zipfile, glob
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
fdb = json.load(open(os.path.join(SRC, 'data/CozyFishing_FishDB_v1.1.json'), encoding='utf-8'))
gcf = json.load(open(os.path.join(SRC, 'data/CozyFishing_GameConfig_v1.0.json'), encoding='utf-8'))
head = open(os.path.join(SRC, '00_head.html'), encoding='utf-8').read()
js = ''
for f in sorted(glob.glob(os.path.join(SRC, '[0-9][0-9]_*.js'))):
    js += '\n/* ---- ' + os.path.basename(f) + ' ---- */\n' + open(f, encoding='utf-8').read()
data = ('window.FISHDB_DATA=' + json.dumps(fdb, ensure_ascii=False, separators=(',', ':')) + ';\n'
        'window.GAMECONFIG_DATA=' + json.dumps(gcf, ensure_ascii=False, separators=(',', ':')) + ';')
html = head + '<script id="data">\n' + data.replace('</', '<\\/') + '\n</script>\n<script>\n' + js.replace('</script', '<\\/script') + '\n</script>\n</body>\n</html>\n'
out = os.path.join(ROOT, 'index.html')
open(out, 'w', encoding='utf-8').write(html)
readme = open(os.path.join(ROOT, 'README.txt'), encoding='utf-8').read()
z = os.path.join(ROOT, 'CozyFishing_FullRelease.zip')
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.write(out, 'index.html'); zf.writestr('README.txt', readme)
print('index.html', len(html.encode('utf-8')), 'bayt;', 'zip', os.path.getsize(z), 'bayt')
