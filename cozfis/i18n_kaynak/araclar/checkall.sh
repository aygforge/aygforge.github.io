#!/bin/bash
F=$1
for l in en es de fr pt; do
  node snap.js $F $l ../w/s_$l.json >/dev/null 2>&1
  node snap.js $F $l ../w/s_late_$l.json tr late >/dev/null 2>&1
done
python3 - <<'P'
import json,difflib,re
TR=re.compile(r'[^<>"]{0,30}[ğıışŞĞİ][^<>"]{0,30}')
ok=re.compile(r'Français|Türkçe|Poğaça|Börek|Selçuk|Kayalıköy|Rıza')
for l in ['en','es','de','fr','pt']:
    a=json.load(open(f'../w/s_{l}.json'));b=json.load(open(f'../w/s_late_{l}.json'))
    print('==',l,'errors',a['_errors'][:3],b['_errors'][:3],'missing',a['_missing'][:5],b['_missing'][:5])
    hits=set()
    for k,v in a.items():
        if k.startswith('_'): continue
        for m in TR.finditer(re.sub(r'data:[^"]*','',v)):
            if not ok.search(m.group(0)): hits.add((k,m.group(0)))
    for h in sorted(hits)[:15]: print('  TR?',h)
    n=0
    for k in a:
        if k.startswith('_') or k.startswith('mainmenu') or k in ('settings_menu','cc','town'): continue
        if a[k]!=b.get(k):
            n+=1
            sm=difflib.SequenceMatcher(None,a[k],b.get(k,''),autojunk=False)
            print('  DIFF',k,[(a[k][max(0,i1-30):i2+30],b[k][max(0,j1-30):j2+30]) for t,i1,i2,j1,j2 in sm.get_opcodes() if t!='equal'][:2])
    print('  livediffs',n)
P
