"""Assemble final HTML.
usage: python3 assemble.py <wdir> <trdir> <out.html>
"""
import json, re, sys, os, glob
W, TRD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = os.path.dirname(os.path.abspath(__file__))
LANGS = ['en', 'es', 'de', 'fr', 'pt']
CODE = {'en': 'en', 'es': 'es', 'de': 'de', 'fr': 'fr', 'pt': 'pt-BR'}
cat = json.load(open(os.path.join(W, 'catalog.json')))
tags = json.load(open(os.path.join(W, 'tags.json')))
work = json.load(open(os.path.join(W, 'work_src.json')))
ATTR = re.compile(r'((?:title|placeholder|alt|aria-label)=")([^"]*)(")')

def parse(path):
    out = {}; key = None
    for ln in open(path, encoding='utf8').read().split('\n'):
        if ln.startswith('@'):
            key = ln[1:].split()[0]; out[key] = {}; continue
        if key is None or not ln.strip(): continue
        if ln.strip() == '=':
            out[key] = {l: None for l in LANGS}; continue
        m = re.match(r'^(tr|en|es|de|fr|pt|\*):\s?(.*)$', ln)
        if not m: raise SystemExit('bad line in %s: %r' % (path, ln[:80]))
        if m.group(1) == '*':
            for l in LANGS: out[key][l] = m.group(2)
        else: out[key][m.group(1)] = m.group(2)
    return out

def toks(s): return sorted(re.findall(r'⟦(\d+)', s))
def phs(s):
    s2 = re.sub(r'⟦[^⟧]*⟧', lambda m: m.group(0), s)
    return sorted(set(re.findall(r'\{(\d+)', s2)))

def expand(key, w):
    tg = tags.get(key, [])
    def rep(m):
        parts = m.group(1).split('|'); i = int(parts[0]); vals = parts[1:]; t = tg[i]
        if vals:
            it = iter(vals)
            def ra(a):
                if re.search(r'[A-Za-zÇĞİÖŞÜçğıöşü]{2,}', a.group(2)):
                    v = next(it, a.group(2)); return a.group(1) + v.replace('"', '&quot;') + a.group(3)
                return a.group(0)
            t = ATTR.sub(ra, t)
        return t
    s = re.sub(r'⟦([^⟧]*)⟧', rep, w)
    return s.replace('⏎', '\n')

errors = []
trans = {}
for p in sorted(glob.glob(os.path.join(TRD, '*.txt'))):
    for k, v in parse(p).items():
        if k in trans: errors.append('dup key ' + k)
        trans[k] = v
extra = parse(os.path.join(T, 'extra_keys.txt'))
LD = {'tr': {}}
for l in LANGS: LD[CODE[l]] = {}
for k, w in work.items():
    LD['tr'][k] = cat[k]['tr'] if k in cat else w.replace('⏎', '\n')
for k, v in extra.items():
    LD['tr'][k] = v.pop('tr', None) or LD['tr'].get(k)
for k, v in list(trans.items()) + list(extra.items()):
    if k not in work and k not in extra: errors.append('unknown key ' + k); continue
    src = work.get(k, '')
    for l in LANGS:
        s = v.get(l, 'MISSING')
        if s == 'MISSING': errors.append('missing %s %s' % (l, k)); continue
        if s is None: s = src
        if k in work:
            if toks(s) != toks(src): errors.append('tags %s %s: %s' % (l, k, s[:80]))
            if phs(s) != phs(src): errors.append('placeholders %s %s %s vs %s: %s' % (l, k, phs(s), phs(src), s[:80]))
            s = expand(k, s)
        LD[CODE[l]][k] = s
# extra keys need tr in extra file
for k, v in extra.items():
    pass
missing = {CODE[l]: [k for k in LD['tr'] if k not in LD[CODE[l]]] for l in LANGS}
json.dump({l: {'missing': len(m), 'sample': m[:30]} for l, m in missing.items()}, open(os.path.join(W, 'coverage.json'), 'w'), indent=1)
print('errors', len(errors)); [print(' ', e) for e in errors[:60]]
print('missing', {l: len(m) for l, m in missing.items()}, 'total', len(LD['tr']))

html = open(os.path.join(W, 'orig.html'), encoding='utf8').read()
lines = html.split('\n')
head_end = lines.index('<script id="data">')
head = '\n'.join(lines[:head_end])
REPL = [
 ('<html lang="tr">', '<html lang="en">'),
 ('<meta name="description" content="Cozy Fishing — sakin bir 2D pixel art balıkçılık ve küçük işletme oyunu. Çevrimdışı çalışan tek dosya.">',
  '<meta name="description" content="CozFis — a cozy 2D pixel art fishing and small business game. Single offline file. Languages: Türkçe, English, Español, Deutsch, Français, Português (Brasil).">\n<meta name="application-name" content="CozFis">\n<meta name="apple-mobile-web-app-title" content="CozFis">'),
 ('<title>Cozy Fishing</title>', '<title>CozFis</title>'),
 ('aria-label="Cozy Fishing oyun alanı"', 'aria-label="CozFis"'),
 ('<b>Lütfen telefonu yatay çevirin</b>', '<b data-i18n="i18n.rotate_title">Please rotate your phone to landscape</b>'),
 ('<span style="opacity:.8;font-size:15px">Cozy Fishing yatay ekranda oynanır. Çevirdiğinde oyun kaldığı yerden devam eder.</span>', '<span data-i18n="i18n.rotate_text" style="opacity:.8;font-size:15px">CozFis is played in landscape. Rotate your phone and the game continues where you left off.</span>'),
 ('color:#fff6e0">Tam ekran + yatay kilit</button>', 'color:#fff6e0" data-i18n="i18n.rotate_btn">Fullscreen + landscape lock</button>'),
 ('<div id="boot">Cozy Fishing yükleniyor…</div>', '<div id="boot" data-i18n="i18n.boot">CozFis…</div>'),
]
for a, b in REPL:
    if head.count(a) != 1: raise SystemExit('head repl fail: ' + a[:60])
    head = head.replace(a, b)
assert 'Cozy Fishing' not in head, 'old name remains in head'
data = '\n'.join(lines[head_end:head_end + 5])
data = data.replace('"game":"Cozy Fishing"', '"game":"CozFis"')
assert data.endswith('</script>') and 'Cozy Fishing' not in data
code = open(os.path.join(W, 'code_t.js'), encoding='utf8').read()
runtime = open(os.path.join(T, 'i18n_runtime.js'), encoding='utf8').read()
post = json.load(open(os.path.join(T, 'postpatch.json'), encoding='utf8'))
for p in post:
    c = code.count(p['old'])
    if c != p.get('n', 1): raise SystemExit('postpatch count %d: %s' % (c, p['old'][:80]))
    code = code.replace(p['old'], p['new'])
locale = '<script id="locale">\nwindow.LOCALE_DATA=' + json.dumps(LD, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';\n</script>'
final = head + '\n' + data + '\n' + locale + '\n<script>\n' + runtime + '\n' + code.replace("/* ---- 01_core.js ---- */\n'use strict';", "/* ---- 01_core.js ---- */") + '\n</script>\n</body>\n</html>\n'
assert 'Cozy Fishing' not in final and 'COZY FISHING' not in final
open(OUT, 'w', encoding='utf8').write(final)
print('wrote', OUT, len(final))
if errors: sys.exit(2)
