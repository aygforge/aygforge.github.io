#!/usr/bin/env python3
"""Builds the single-file deliverable ../football-wars-v4.html (all JS/CSS/data inlined, no external requests)."""
import json, os, re, sys
H = os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(os.path.join(H, p), encoding='utf-8').read()
def safe(js): return js.replace('</script', '<\\/script').replace('<!--', '<\\!--')
master = json.loads(rd('data/football_wars_master_2026_27.json'))
cfg = json.loads(rd('data/battle_engine_config.json'))
flags = json.loads(rd('assets/flags.json'))
flags_slim = {k: {'file': v['file'], 'page': v['page'], 'data': v['data']} for k, v in flags.items()}
# sanity checks on the embedded database
assert len(master['clubs']) == 194 and len(master['national_teams']) == 55 and len(master['leagues']) == 11
for t in master['clubs'] + master['national_teams']:
    assert sum(t['battle_profile']['roles_per_100'].values()) == 100, t['id']
j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
data_js = ('/* Embedded data: Football_Wars_DB_2026_27 (master + battle_engine_config), national flags (Wikimedia Commons). */\n'
           'window.FW_MASTER_DB = ' + j(master) + ';\n'
           'window.FW_ENGINE_CONFIG = ' + j(cfg) + ';\n'
           'window.FW_FLAGS = ' + j(flags_slim) + ';\n'
           'window.FW_LICENSES = ' + j({'mp4': rd('vendor/mp4-muxer.LICENSE'), 'webm': rd('vendor/webm-muxer.LICENSE')}) + ';\n')
parts = [
  ('mp4-muxer 5.2.2 (MIT, Vanilagy)', rd('vendor/mp4-muxer.js')),
  ('webm-muxer 5.1.4 (MIT, Vanilagy)', rd('vendor/webm-muxer.js')),
  ('data', data_js),
  ('font', rd('src/font.js')), ('engine', rd('src/engine.js')), ('director (V2)', rd('src/director.js')), ('sprites', rd('src/sprites.js')),
  ('render', rd('src/render.js')), ('v3', rd('src/v3.js')), ('audio', rd('src/audio.js')), ('export', rd('src/export.js')), ('app', rd('src/app.js')),
]
scripts = '\n'.join(f'<script>/* ---- {name} ---- */\n{safe(code)}\n</script>' for name, code in parts)
html = rd('src/template.html').replace('<!--INLINE_SCRIPTS-->', scripts)
assert not re.search(r'<script[^>]+src=', html), 'external script found'
assert not re.search(r'<link[^>]+href=', html), 'external stylesheet found'
out = os.path.join(H, '..', 'football-wars-v4.html')
open(out, 'w', encoding='utf-8').write(html)
print('wrote', os.path.normpath(out), round(len(html.encode('utf-8')) / 1024), 'KB')
