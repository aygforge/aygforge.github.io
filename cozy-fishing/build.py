#!/usr/bin/env python3
"""Cozy Fishing build: src/*.js + JSON verileri -> tek dosya cozyfishing_v3.html (+ CozyFishing_v3_Update.zip). index.html (v1) ve cozyfishing_v2.html ezilmez.."""
import json, os, zipfile, glob
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
fdb = json.load(open(os.path.join(SRC, 'data/CozyFishing_FishDB_v1.2.json'), encoding='utf-8'))
gcf = json.load(open(os.path.join(SRC, 'data/CozyFishing_GameConfig_v1.0.json'), encoding='utf-8'))
exp = json.load(open(os.path.join(SRC, 'data/CozyFishing_Expansion_v1.json'), encoding='utf-8'))
head = open(os.path.join(SRC, '00_head.html'), encoding='utf-8').read()
js = ''
for f in sorted(glob.glob(os.path.join(SRC, '[0-9][0-9]_*.js'))):
    js += '\n/* ---- ' + os.path.basename(f) + ' ---- */\n' + open(f, encoding='utf-8').read()
data = ('window.FISHDB_DATA=' + json.dumps(fdb, ensure_ascii=False, separators=(',', ':')) + ';\n'
        'window.GAMECONFIG_DATA=' + json.dumps(gcf, ensure_ascii=False, separators=(',', ':')) + ';\n'
        'window.EXPANSION_DATA=' + json.dumps(exp, ensure_ascii=False, separators=(',', ':')) + ';')
html = head + '<script id="data">\n' + data.replace('</', '<\\/') + '\n</script>\n<script>\n' + js.replace('</script', '<\\/script') + '\n</script>\n</body>\n</html>\n'
out = os.path.join(ROOT, 'cozyfishing_v3.html')
open(out, 'w', encoding='utf-8').write(html)
z = os.path.join(ROOT, 'CozyFishing_v3_Update.zip')
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.write(out, 'cozyfishing_v3.html')
    for extra in ('README.txt', 'CHANGES_v3.md'):
        pth = os.path.join(ROOT, extra)
        if os.path.exists(pth): zf.write(pth, extra)
print('cozyfishing_v3.html', len(html.encode('utf-8')), 'bayt;', 'zip', os.path.getsize(z), 'bayt')
