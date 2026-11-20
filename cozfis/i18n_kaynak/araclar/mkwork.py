"""Create translation work chunks + tag tables from catalog.json and data JSON.
usage: python3 mkwork.py <wdir>
"""
import json, re, sys, os
W = sys.argv[1]
cat = json.load(open(os.path.join(W, 'catalog.json')))
TAG = re.compile(r'<\/?[a-zA-Z][^<>]*>')
ATTR = re.compile(r'((?:title|placeholder|alt|aria-label)=")([^"]*)(")')

def compress(msg):
    tags = []
    def rep(m):
        t = m.group(0); i = len(tags)
        vals = [a[1] for a in ATTR.findall(t) if re.search(r'[A-Za-zÇĞİÖŞÜçğıöşü]{2,}', a[1])]
        tags.append(t)
        return '⟦%d%s⟧' % (i, ''.join('|' + v for v in vals))
    w = TAG.sub(rep, msg)
    if tags:
        w = re.sub(r'\n\s*', ' ', w)  # whitespace insignificant in HTML
    w = w.replace('\n', '⏎')
    return w, tags

def data_items():
    out = []
    D = {n: json.load(open(os.path.join(W, n + '.json'))) for n in ['FISHDB_DATA', 'GAMECONFIG_DATA', 'EXPANSION_DATA']}
    db, cfg, exp = D['FISHDB_DATA'], D['GAMECONFIG_DATA'], D['EXPANSION_DATA']
    for r in db['regions']: out.append(('d.region.%s.name' % r['id'], r['name']))
    for r in cfg['regions']: out.append(('d.region.%s.req' % r['id'], r['requirements']))
    for s in db['spots']: out.append(('d.spot.%s.name' % s['id'], s['name']))
    for b in db['bait_catalog']: out.append(('d.bait.%s.name' % b['id'], b['name']))
    for kind in ['rods', 'lines', 'reels', 'hooks']:
        for g in cfg['shop'][kind]: out.append(('d.%s.%s.name' % (kind[:-1], g['id']), g['name']))
    for b in cfg['boats']: out.append(('d.boat.%s.name' % b['id'], b['name']))
    for a in cfg['automation']: out.append(('d.auto.%s.name' % a['id'], a['name']))
    for c in cfg['customers']: out.append(('d.cust.%s.name' % c['id'], c['name']))
    for e in cfg['events']: out.append(('d.event.%s.name' % e['id'], e['name']))
    for a in cfg['achievements'] + exp['achievements']:
        out.append(('d.ach.%s.name' % a['id'], a['name'])); out.append(('d.ach.%s.cond' % a['id'], a['condition_tr']))
    cats = []
    for a in cfg['achievements'] + exp['achievements']:
        if a['category'] not in cats: cats.append(a['category'])
    for c in cats: out.append(('d.achcat.' + re.sub(r'[^a-z0-9]+', '_', c.lower().replace('ı','i').replace('İ','i').replace('ş','s').replace('ğ','g').replace('ü','u').replace('ö','o').replace('ç','c')).strip('_'), c))
    for s in exp['shops']: out.append(('d.shop.%s.name' % s['id'], s['name']))
    for s in exp['snacks']: out.append(('d.snack.%s.name' % s['id'], s['name'])); out.append(('d.snack.%s.desc' % s['id'], s['desc']))
    for f in exp['festivals']:
        out.append(('d.fest.%s.name' % f['id'], f['name'])); out.append(('d.fest.%s.comp' % f['id'], f['comp_name'])); out.append(('d.fest.%s.rule' % f['id'], f['rule']))
    for r in exp['rivals']: out.append(('d.rival.%s.name' % r['id'], r['name']))
    for f in db['fish']: out.append(('d.fish.%s.name' % f['id'], f['name_tr']))
    for f in db['fish']: out.append(('d.fish.%s.desc' % f['id'], f['encyclopedia_tr']))
    dl = dict(cfg['npc_dialogues']); dl.update(exp['npc_dialogues'])
    for npc, lst in dl.items():
        for d in lst: out.append(('d.npc.%s.%s' % (npc, d['trigger']), d['text_tr']))
    return out

tags = {}; items = []
for k, v in sorted(cat.items(), key=lambda kv: kv[1]['lines'][0]):
    w, tg = compress(v['tr']); tags[k] = tg; items.append((k, w, v['lines'][0]))
seen = set()
for k, v in data_items():
    if k in seen: continue
    seen.add(k); items.append((k, v.replace('\n', '⏎'), 0)); tags[k] = []
json.dump(tags, open(os.path.join(W, 'tags.json'), 'w'), ensure_ascii=False)
json.dump({k: w for k, w, _ in items}, open(os.path.join(W, 'work_src.json'), 'w'), ensure_ascii=False, indent=0)
os.makedirs(os.path.join(W, 'work'), exist_ok=True)
# chunk by ~6000 chars
chunks = []; cur = []; size = 0
for it in items:
    cur.append(it); size += len(it[1]) + 30
    if size > 6000: chunks.append(cur); cur = []; size = 0
if cur: chunks.append(cur)
for i, ch in enumerate(chunks):
    with open(os.path.join(W, 'work', '%02d.txt' % i), 'w') as f:
        for k, w, l in ch: f.write('@%s  L%d\n%s\n' % (k, l, w))
print('items', len(items), 'chunks', len(chunks), 'chars', sum(len(w) for _, w, _ in items))
