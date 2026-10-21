#!/usr/bin/env python3
"""Hazır sprite paketlerini oyuna aktarır (yalnız geliştirme aracı, Pillow gerekir).

Kullanım:  python3 tools/import-sprites.py <ham_paketler_klasörü>

Klasörde LuizMelo paketleri açılmış olmalı (Fantasy_Warrior/, Wizard_Pack/, EVil_Wizard_2/ ...).
Her paket için:
  * tüm karelerin ortak dolu alanı bulunur ve kareler buna kırpılır (gereksiz boşluk atılır),
  * karakter hedef oyun boyuna ölçeklenir (küçültmede BOX, büyütmede en yakın piksel),
  * ayak noktası (Idle'ın alt orta noktası) sprite orijini olarak hesaplanır,
  * her animasyon public/sprites/<id>/<anim>.png yatay şeridi olarak yazılır,
  * src/art/spritePacks.js meta veri modülü üretilir.
"""
import json
import os
import shutil
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'sprites')
OUT_JS = os.path.join(ROOT, 'src', 'art', 'spritePacks.js')

# anim: (dosya, fps, tekrar) — kare sayısı dosya genişliğinden bulunur
PACKS = {
    'hero_warrior': {
        'name': 'Fantasy Warrior (LuizMelo, CC0)', 'dir': 'Fantasy_Warrior/Fantasy Warrior/Sprites', 'frame': (162, 162),
        'height': 58, 'license': 'Fantasy_Warrior/Fantasy Warrior/License.txt',
        'anims': {'idle': ('Idle', 9, -1), 'walk': ('Run', 13, -1), 'atk': ('Attack1', 18, 0), 'atk2': ('Attack2', 18, 0),
                  'cast': ('Attack3', 18, 0), 'hurt': ('Take hit', 12, 0), 'die': ('Death', 10, 0)},
    },
    'hero_mage': {
        'name': 'Wizard Pack (LuizMelo)', 'dir': 'Wizard_Pack/Wizard Pack', 'frame': (231, 190),
        'height': 58, 'license': None,
        'anims': {'idle': ('Idle', 8, -1), 'walk': ('Run', 13, -1), 'atk': ('Attack1', 18, 0), 'atk2': ('Attack2', 18, 0),
                  'cast': ('Attack2', 18, 0), 'hurt': ('Hit', 12, 0), 'die': ('Death', 10, 0)},
    },
    'mon_ore_priest': {
        'name': 'Evil Wizard 2 (LuizMelo, CC0)', 'dir': 'EVil_Wizard_2/EVil Wizard 2/Sprites', 'frame': (250, 250),
        'height': 72, 'license': 'EVil_Wizard_2/EVil Wizard 2/License.txt',
        'anims': {'idle': ('Idle', 9, -1), 'walk': ('Run', 12, -1), 'atk': ('Attack1', 16, 0), 'atk2': ('Attack2', 16, 0),
                  'hurt': ('Take hit', 12, 0), 'die': ('Death', 10, 0)},
    },
}


def frames_of(path, fw, fh):
    im = Image.open(path).convert('RGBA')
    return [im.crop((i * fw, 0, (i + 1) * fw, fh)) for i in range(im.width // fw)]


def union(boxes):
    boxes = [b for b in boxes if b]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))


def main(src):
    meta = {}
    credits = []
    for pid, p in PACKS.items():
        base = os.path.join(src, p['dir'])
        if not os.path.isdir(base):
            print(f'ATLANDI {pid}: {base} yok')
            continue
        fw, fh = p['frame']
        raw = {a: frames_of(os.path.join(base, f + '.png'), fw, fh) for a, (f, _, _) in p['anims'].items()}
        u = union([fr.getbbox() for frs in raw.values() for fr in frs])
        idle = union([fr.getbbox() for fr in raw['idle']])
        scale = p['height'] / (idle[3] - idle[1])
        cw, ch = u[2] - u[0], u[3] - u[1]
        tw, th = max(1, round(cw * scale)), max(1, round(ch * scale))
        resample = Image.BOX if scale < 1 else Image.NEAREST
        out = os.path.join(OUT_DIR, pid)
        os.makedirs(out, exist_ok=True)
        # klasörü silmeden eski animasyon dosyalarını temizle (geliştirme sunucusu klasörü izlemeye devam eder)
        for old in os.listdir(out):
            if old.endswith('.png') and old[:-4] not in p['anims']:
                os.remove(os.path.join(out, old))
        anims = {}
        for a, (f, fps, rep) in p['anims'].items():
            frs = [fr.crop(u).resize((tw, th), resample) for fr in raw[a]]
            strip = Image.new('RGBA', (tw * len(frs), th))
            for i, fr in enumerate(frs):
                strip.paste(fr, (i * tw, 0))
            strip.save(os.path.join(out, a + '.png'), optimize=True)
            anims[a] = {'frames': len(frs), 'fps': fps, 'repeat': rep}
        meta[pid] = {
            'w': tw, 'h': th, 'body': p['height'],                   # karakterin bekleme boyu (oyun pikseli)
            'ox': round(((idle[0] + idle[2]) / 2 - u[0]) / cw, 4),   # ayak noktası (yatay orta)
            'oy': round((idle[3] - u[1]) / ch, 4),                   # ayak noktası (alt)
            'anims': anims, 'credit': p['name'],
        }
        if p['license']:
            shutil.copy(os.path.join(src, p['license']), os.path.join(out, 'LICENSE.txt'))
        credits.append(f"{pid}: {p['name']}")
        print(f'{pid}: kare {tw}x{th}, ölçek {scale:.2f}, {len(anims)} animasyon')
    with open(OUT_JS, 'w', encoding='utf-8') as fh:
        fh.write('// OTOMATİK ÜRETİLDİ: tools/import-sprites.py — elle düzenlemeyin.\n')
        fh.write('// Hazır sprite paketleri (public/sprites/<id>/<anim>.png). ox/oy: ayak noktası (orijin).\n')
        fh.write('export const SPRITE_PACKS = ' + json.dumps(meta, ensure_ascii=False, indent=2) + ';\n')
    print('yazıldı:', os.path.relpath(OUT_JS, ROOT))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
