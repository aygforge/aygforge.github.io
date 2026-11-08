#!/usr/bin/env python3
"""Static-only v2.0 package integrity test. No browser, simulated gameplay, or image quality tests."""
from pathlib import Path
import json, hashlib,collections,sys
B=Path(__file__).resolve().parent.parent
j=lambda p:json.loads(p.read_text(encoding='utf-8'))
checks=[]
def ck(id,result,detail=''):
 checks.append({'id':id,'status':'PASS' if bool(result) else 'FAIL','detail':detail})
D=lambda n:j(B/'DB'/f'{n}.json')
A=lambda n:j(B/'Art'/f'{n}.json')
C=lambda n:j(B/'Contracts'/f'{n}.json')
meta=j(B/'ContentIndex_v2.0.json');v=j(B/'ProductionTruth_v2.0.json')
ck('T01_Files',len(list((B/'DB').glob('*.json')))==31)
ck('T02_Index',len(meta['databaseFiles'])==31)
for nm,val in meta['databaseFiles'].items():
 p=B/val['target'];ck('SHA_'+nm,p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==val['sha256'])
M=D('AssetManifest'); I=D('ItemDB')['items']; R=D('RecipeDB')['recipes']; BB=D('BuildDB')['buildings']; P=D('POIDB')['pois'];Q=D('PuzzleDB')['puzzles'];S=D('StoryDB')['records'];F=D('FishDB')['fish'];CR=D('CropDB')['crops'];AN=D('AnimalDB');SK=D('SkillDB')['skills'];ES=D('EscapeDB');REG=D('RegionDB')['regions']; L=D('LootTableDB')
ID=lambda arr:{x['id'] for x in arr}
i=ID(I); b=ID(BB);p=ID(P);s=ID(S);q=ID(Q);fish=ID(F);crops=ID(CR);reg=ID(REG);r=ID(R)
for n,arr,expected in [('Items',I,179),('Recipes',R,183),('Builds',BB,58),('POI',P,38),('Puzzle',Q,12),('Story',S,15),('Fish',F,10),('Crop',CR,12),('Skills',SK,8)]: ck('Count_'+n,len(arr)==expected and len(ID(arr))==expected)
ck('Blueprint_20',len(D('RecipeDB')['blueprints'])==20 and len(D('RecipeDB')['blueprintSources'])==20)
ck('Species_25',len(AN['landAnimals'])==12 and len(AN['marineAnimals'])==3 and len(F)==10)
ck('Recipes_type',dict(collections.Counter(x['outputType'] for x in R))=={'item':114,'build':60,'upgrade':9})
ck('Recipes_valid',all(set(x['inputs']) <= i and x['outputId'] in i|b and (x['station']=='HAND' or x['station'] in b) for x in R))
ck('Recipes_unlock',all((u.split(':',1)[1] in i if u.startswith('MAT:') else u.split(':',1)[1] in b if u.startswith('STATION:') else u.split(':',1)[1] in D('RecipeDB')['blueprints'] if u.startswith('BP:') else True) for u in (x.get('unlock','') for x in R)))
ck('Upgrades_uid',all(x.get('runtimeBehavior')=='UPGRADE_EXISTING' and x.get('preserveTargetEntityUid') is True and x.get('targetBuildId') in b for x in R if x['outputType']=='upgrade'))
ck('Sea_chest_not_upgrade',next(x for x in R if x['id']=='R_SEA_CHEST')['outputType']=='build')
ck('Build_recipe',all(x.get('recipeId') in r for x in BB))
ck('POI_spatial',all(x['regionId'] in reg and (not x.get('puzzleId') or x['puzzleId'] in q) and set(x.get('storyRecordIds',[]))<=s for x in P))
ck('Loot_POI',len(L['poiLoot'])==38 and {x['poiId'] for x in L['poiLoot']}==p)
ck('Blueprints_fixed',len([x for x in P if x['reward'].get('blueprintId')])==20 and {x['reward']['blueprintId'] for x in P if x['reward'].get('blueprintId')}==set(D('RecipeDB')['blueprints']))
ck('Puzzles_fixed',len({x['poiId'] for x in Q})==12 and {x['poiId'] for x in Q}<=p)
ck('No_human_NPC',D('DesignConstants')['livingHumanNPCs']==0)
ck('Two_endings',len(ES['routes'])==2)
ck('Art_item_manifest',{x['itemId'] for x in M['itemIcons']}==i)
ck('Art_build_manifest',{x['buildId'] for x in M['buildSprites']}==b)
ck('Art_POI_manifest',{x['poiId'] for x in M['poiScenes']}==p)
ck('Art_crop_manifest',{x['cropId'] for x in M['cropSprites']}==crops)
ck('Art_anim_clips',len(M['characterClips'])==16)
ck('Asset_bookkeeping',A('SpriteCatalog')['totalFrames']==3180 and len(A('AtlasLayout')['pages'])==24)
sprites=A('SpriteCatalog')['canonicalRecords'];atlas=A('AtlasLayout');frames=atlas['sprites']; pages={pg['pageId']:pg for pg in atlas['pages']}
ck('Sprite_unique',len(sprites)==3180 and len({x['spriteId'] for x in sprites})==3180)
ck('Atlas_exact_match',set(x['spriteId'] for x in sprites)==set(frames))
ck('Atlas_pages',len(pages)==24 and all(x['width']<=1024 and x['height']<=1024 for x in pages.values()))
ck('Atlas_inside',all(s['pageId'] in pages and s['x']>=0 and s['y']>=0 and s['w']>0 and s['h']>0 and s['x']+s['w']<=pages[s['pageId']]['width'] and s['y']+s['h']<=pages[s['pageId']]['height'] for s in frames.values()))
# Geometry overlap by row scan (rectangles per atlas; avoids 3k^2 naive pairs).
collisions=0
by_pg=collections.defaultdict(list)
for id,s2 in frames.items():by_pg[s2['pageId']].append((s2['x'],s2['y'],s2['w'],s2['h'],id))
for pg,rects in by_pg.items():
 rects.sort(key=lambda x:x[0])
 for idx,a in enumerate(rects):
  for d in rects[idx+1:]:
   if d[0]>=a[0]+a[2]:break
   if a[1]<d[1]+d[3] and d[1]<a[1]+a[3]:collisions+=1
ck('Atlas_no_overlap',collisions==0)
ck('No_real_assets',not list((B/'Assets').rglob('*.png')) and not list((B/'Assets').rglob('*.wav')))
ck('Runtime_tests_spec_only',len(C('AcceptanceTests')['runtimeTests'])==92 and C('AcceptanceTests')['runtimeTestsPassed']==0)
ck('Art_tests_spec_only',len(A('AssetAcceptanceTests')['tests'])==28 and A('AssetAcceptanceTests')['runStatus']!='PASSED')
ck('Map_files',len(list((B/'Maps').glob('*.json')))==7)
for f in (B/'Maps').glob('*.json'):
 o=j(f);w,h=o['sizeTiles'];ok=len(o['tileRowsRLE'])==h and all(sum(int(n) for _,n in row)==w for row in o['tileRowsRLE'])
 ck('Map_RLE_'+f.stem,ok)
# explicit: no game files in this design package
ck('No_game_claim',v['status']['game']=='NOT_IMPLEMENTED' and not (B/'dist/index.html').exists())
report={'version':'v2.0','kind':'STATIC_PACKAGE_VALIDATION_ONLY','totalChecks':len(checks),'passed':sum(x['status']=='PASS' for x in checks),'failed':sum(x['status']=='FAIL' for x in checks),'checks':checks,'runtimeTestsExecuted':0,'assetTestsExecuted':0,'realArtAssetsCreated':0,'scopeNote':'Static references, metadata, maps RLE, atlas planned boxes; no runtime, visual, gameplay, performance, or actual content availability simulation'}
(B/'QA'/'Validation_v2.0.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False,indent=2))
if report['failed']:print('FAILED:',[x for x in checks if x['status']=='FAIL'])
sys.exit(1 if report['failed'] else 0)
