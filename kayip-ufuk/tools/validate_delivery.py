#!/usr/bin/env python3
"""Static build/release checks; never claims runtime or artistic test pass."""
import argparse
import html.parser
import json
import re
import struct
import sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / 'Kayip_Ufuk_GDD_v2_0'


class LocalAssets(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.files=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ('script','img','link','audio','source'):
            for key in ('src','href'):
                if key in a:
                    value=a[key]
                    if value.startswith(('http:','https:','//')): self.files.append(('remote',value))
                    elif value and not value.startswith(('data:','blob:','#')): self.files.append(('local',value.split('?')[0].split('#')[0]))


def png_dims(path):
    with path.open('rb') as f:
        head=f.read(24)
    if head[:8]!=b'\x89PNG\r\n\x1a\n' or head[12:16]!=b'IHDR': raise ValueError('PNG signature/IHDR yok')
    return struct.unpack('>II',head[16:24])


def main():
    ap=argparse.ArgumentParser(description='Validate planned release artifacts and test evidence without faking browser results')
    ap.add_argument('--dist', default='dist', help='build output directory relative to project root')
    args=ap.parse_args()
    dist = (ROOT / args.dist).resolve()
    errors=[]; warns=[]; stats={}
    def err(s): errors.append(s)
    def warn(s): warns.append(s)
    if not SPEC.is_dir():
        err('Kayip_Ufuk_GDD_v2_0 kaynak klasörü yok')
        print(json.dumps({'errors':errors},ensure_ascii=False,indent=2));return 1
    atlas=json.loads((SPEC/'Art/AtlasLayout.json').read_text(encoding='utf8'))
    source_tests=json.loads((SPEC/'Contracts/AcceptanceTests.json').read_text(encoding='utf8'))['runtimeTests']
    asset_tests=json.loads((SPEC/'Art/AssetAcceptanceTests.json').read_text(encoding='utf8'))['tests']
    audio=json.loads((SPEC/'Art/AudioManifest.json').read_text(encoding='utf8'))['catalog']
    html = dist/'index.html'
    if not html.is_file():err('dist/index.html mevcut değil')
    elif html.stat().st_size<500:err('dist/index.html çok küçük, uygulama giriş dosyası doğrulanmalı')
    else:
        parser=LocalAssets();parser.feed(html.read_text(encoding='utf8', errors='replace'))
        for typ,url in parser.files:
            if typ=='remote':err('HTML içinde runtime dış kaynak bağımlılığı: '+url)
            else:
                path=(dist/url.lstrip('/')).resolve()
                if dist not in path.parents and path!=dist:err('HTML yerel dosya yolu dist dışına çıkıyor: '+url)
                elif not path.exists():err('HTML referansı yok: '+url)
    missing=[]; bad=[]
    for pg in atlas['pages']:
        png=dist/pg['plannedPngPath']
        if not png.exists():missing.append(pg['pageId'])
        else:
            try:
                w,h=png_dims(png)
                if (w,h)!=(pg['width'],pg['height']):bad.append(pg['pageId']+' '+str((w,h)))
                if png.stat().st_size<2000:warn('atlas oldukça küçük; boş/placeholder olabilir: '+pg['pageId'])
            except Exception as e:bad.append(pg['pageId']+' '+str(e))
    if missing:err('Atlas PNG eksik (%s/24): %s' %(len(missing), ', '.join(missing)))
    if bad:err('Atlas PNG boyutu/biçimi hatalı: '+', '.join(bad))
    stats['atlasPagesPresent']=len(atlas['pages'])-len(missing)
    stats['spriteRecordsPlanned']=len(atlas['sprites'])
    if not missing and not bad:
        try:
            from PIL import Image,ImageChops
            pages={pg['pageId']:Image.open(dist/pg['plannedPngPath']).convert('RGBA') for pg in atlas['pages']}
            alpha_fail=[]; non_empty=0; hashes=[]
            for sid,info in atlas['sprites'].items():
                box=(info['x'],info['y'],info['x']+info['w'],info['y']+info['h'])
                crop=pages[info['pageId']].crop(box)
                if crop.getchannel('A').getbbox() is None:alpha_fail.append(sid)
                else:non_empty+=1
                hashes.append(hash(crop.tobytes()))
            stats['nonTransparentSpriteRects']=non_empty
            stats['uniquePixelRectHashes']=len(set(hashes))
            if alpha_fail:err('Tamamen saydam sprite rect: '+str(len(alpha_fail))+' örnek: '+', '.join(alpha_fail[:8]))
            if len(set(hashes))<200:warn('Sprite çeşitliliği çok düşük; 3180 kayda rağmen tekrar görseller olabilir')
        except ImportError:warn('Pillow yüklü değil; karelerin gerçek piksel içeriği denetlenemedi')
    audio_provenance=ROOT/'reports/audio-provenance.json'
    if not audio_provenance.exists():warn('63 ses tetikleyicisinin kaynağı belgelenmemiş: reports/audio-provenance.json')
    else:
        try:
            doc=json.loads(audio_provenance.read_text(encoding='utf8'))
            byid={x['soundId']:x for x in doc.get('cues',[])}
            ids={x['soundId'] for x in audio}
            if set(byid)!=ids:err('Audio provenance 63 soundId ile eşleşmiyor')
            for id in ids & set(byid):
                record=byid[id];mode=record.get('mode')
                if mode=='file' and not (dist/record.get('path','_NONE_')).exists():err('Ses dosyası yok: '+id)
                elif mode=='web_audio' and not record.get('functionRef'):err('Web Audio sentez fonksiyonu bildirilmemiş: '+id)
                elif mode not in ('file','web_audio'):err('Sesin gerçek üretim modu tanımsız: '+id)
        except Exception as e:err('audio provenance bozuk: '+str(e))
    test_path=ROOT/'reports/test-results.json'
    if not test_path.exists():err('reports/test-results.json yok; 92+28 testin gerçek sonucu bekleniyor')
    else:
        try:
            report=json.loads(test_path.read_text(encoding='utf8'))
            for label,src in [('runtime',source_tests),('visual',asset_tests)]:
                found={x['id']:x for x in report.get(label,[])}
                expected={x['id']:x for x in src}
                if set(found)!=set(expected):err(f'{label} test ID listesi kaynakla aynı değil')
                counts=Counter(x.get('status') for x in found.values());stats[label+'TestStatuses']=dict(counts)
                for id in set(found)&set(expected):
                    t=found[id]
                    if t.get('status') not in ('PASS','FAIL','NOT_RUN','BLOCKED'):err('Geçersiz test durumu: '+id)
                    if t.get('status')=='PASS' and not t.get('evidence'):err('Kanıtsız test PASS: '+id)
                    if expected[id].get('priority')=='P0' and t.get('status')!='PASS':err('P0 tamamlanmadı: '+id)
        except Exception as e:err('test raporu bozuk: '+str(e))
    output={'kind':'DELIVERY_STATIC_PRECHECK_NOT_BROWSER_EXECUTION','result':'BLOCKED' if errors else 'STATIC_CHECKS_OK','errors':errors,'warnings':warns,'stats':stats,'note':'Bu araç tarayıcı davranışı, oyun eğlencesi veya görsel sanat kalitesini tek başına doğrulayamaz.'}
    target=ROOT/'reports/delivery-precheck.json'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps(output,ensure_ascii=False,indent=2))
    return 1 if errors else 0


if __name__=='__main__':
    raise SystemExit(main())
