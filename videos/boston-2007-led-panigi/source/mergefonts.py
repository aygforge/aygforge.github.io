import sys, os
from fontTools.ttLib import TTFont
from fontTools.merge import Merger
os.makedirs('fonts', exist_ok=True)
jobs = {}
for fam, d in [('kalam','fontsource-kalam-5.3.0'),('caveat','fontsource-caveat-5.3.0'),('shantell','fontsource-shantell-sans-5.3.0'),('patrick','fontsource-patrick-hand-5.3.0')]:
    files = os.listdir(f'npmf/{d}/files')
    for w in ['300','400','500','600','700','800']:
        a = f'{d.split("-5")[0].replace("fontsource-","")}-latin-{w}-normal.woff'
        b = a.replace('-latin-','-latin-ext-')
        if a in files and b in files:
            out = f'fonts/{fam}-{w}.ttf'
            tmp=[]
            for i,src in enumerate([a,b]):
                f = TTFont(f'npmf/{d}/files/{src}'); f.flavor=None
                p=f'/tmp/claude-0/-home-user-aygforge-github-io/76304bce-b80e-5688-8047-e18eb47c713a/scratchpad/work/_t{i}.ttf'; f.save(p); tmp.append(p)
            try:
                m = Merger().merge(tmp); m.save(out); print('ok', out)
            except Exception as e: print('fail', out, e)
