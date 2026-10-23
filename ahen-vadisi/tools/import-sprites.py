#!/usr/bin/env python3
"""Hazır sprite paketlerini oyuna aktarır (yalnız geliştirme aracı, Pillow gerekir).

Kullanım:  python3 tools/import-sprites.py <ham_paketler_klasörü>

Klasörde LuizMelo paketleri açılmış olmalı (Fantasy_Warrior/, Wizard_Pack/, EVil_Wizard_2/,
"Monsters Creatures Fantasy 2/" ...). Klasörde bulunmayan paketlerin önceki çıktısı korunur
(yalnız mevcut paketler yeniden işlenir; spritePacks.js birleştirilerek yazılır).
Her paket için:
  * tüm karelerin ortak dolu alanı bulunur ve kareler buna kırpılır (gereksiz boşluk atılır),
  * karakter hedef oyun boyuna ölçeklenir (küçültmede BOX, büyütmede en yakın piksel),
  * ayak noktası (Idle'ın alt orta noktası) sprite orijini olarak hesaplanır,
  * her animasyon public/sprites/<id>/<anim>.png yatay şeridi olarak yazılır,
  * src/art/spritePacks.js meta veri modülü üretilir.
"""
import colorsys
import glob
import json
import os
import re
import shutil
import sys
from PIL import Image, ImageOps

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from aseprite import load as load_aseprite  # noqa: E402

# Animasyon kaynağı biçimleri (PACKS[...]['anims'][ad] = (kaynak, fps, tekrar)):
#   'Run'                                   → yatay şerit dosyası Run.png (kare boyu pack['frame'])
#   {'strip': 'Attack3', 'frames': [0, 1, 2]} → şeritten seçilen kareler (aynı kare tekrar edebilir)
#   {'files': 'Run/LightBandit_Run'}        → tek tek kare dosyaları LightBandit_Run_0.png, _1.png …
#   {'ase': 'Massacre.aseprite', 'from': 1, 'to': 6}  → Aseprite karelerinin aralığı (görünür katmanlar birleşik)
#   {'derive': 'bob' | 'flash' | 'collapse', 'of': 'idle'} → pakette olmayan animasyonu var olandan türet
#   Her dict kaynakta 'reverse': True kareleri ters çevirir.
# Paket seçenekleri: 'flip': True (sola bakan paketi sağa çevir), 'scale' (boy yerine sabit ölçek; tam sayıya yakın
# ölçek piksel sanatı bozmaz), 'hue' (doymuş pikselleri hedef renk tonuna çevir, ör. mor akrebi kızıla), 'credit_file' (lisans/EULA dosyası, LICENSE.txt olarak kopyalanır).
# V4: kaynak dict'te 'fw'/'fh' o animasyonun kare boyunu verir (şeritlerin kare boyu farklı paketler); paket seçeneği
#   'pad': 'left-bottom' farklı boyutlu kareleri ortak tuvale sol-alt hizalı yerleştirir (karakter karede sola dayalıysa).
# FX: 'fx' → {ad: (dosya, kare_g, kare_y, ölçek, fps, tekrar)} paketin efekt şeritleri public/sprites/fx/<ad>.png olur;
#   oyun bu dokuları procedural efekt (fx_<ad>) yerine kullanır (FX_PACKS).

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
    # Monsters Creatures Fantasy 2 (LuizMelo): Çayır Sıçanı ve Mağara Yarasası
    'mon_meadow_rat': {
        'name': 'Monsters Creatures Fantasy 2 — Rat (LuizMelo)', 'dir': 'Monsters Creatures Fantasy 2/Rat', 'frame': (70, 70),
        'height': 20, 'license': None,
        'anims': {'idle': ('idle', 9, -1), 'walk': ('run', 12, -1), 'atk': ('attack_bite', 20, 0),
                  'hurt': ('hurt', 12, 0), 'die': ('rat-death', 10, 0)},
    },
    'mon_cave_bat': {
        'name': 'Monsters Creatures Fantasy 2 — Bat (LuizMelo)', 'dir': 'Monsters Creatures Fantasy 2/Bat', 'frame': (87, 87),
        'height': 40, 'license': None,
        # yarasa hep uçar: bekleme ve yürüme aynı kanat çırpma şeridi (farklı hız)
        'anims': {'idle': ('fly', 11, -1), 'walk': ('fly', 15, -1), 'atk': ('attack', 20, 0),
                  'hurt': ('hurt', 12, 0), 'die': ('death', 9, 0)},
    },
    # Bandits (Sven Thole): Orman Yağmacısı = Light Bandit. Ölüm: "Recover" (yerden kalkma) karelerinin tersi = yere düşme.
    'mon_forest_raider': {
        'name': 'Bandits — Light Bandit (Sven Thole)', 'dir': 'Bandits/Sprites/Light Bandit', 'frame': (48, 48),
        'scale': 1.5, 'flip': True, 'license': 'Bandits/EULA.txt',
        'anims': {'idle': ({'files': 'Idle/LightBandit_Idle'}, 6, -1), 'walk': ({'files': 'Run/LightBandit_Run'}, 12, -1),
                  'atk': ({'files': 'Attack/LightBandit_Attack'}, 16, 0), 'hurt': ({'files': 'Hurt/LightBandit_Hurt'}, 10, 0),
                  'die': ({'files': 'Recover/LightBandit_Recover', 'reverse': True}, 12, 0)},
    },
    # Monster Creatures Fantasy (LuizMelo): Kazmacı Goblin = Goblin, Diken Kökçüsü = Mushroom, Çürük Muhafız = Skeleton
    'mon_pick_goblin': {
        'name': 'Monster Creatures Fantasy — Goblin (LuizMelo)', 'dir': 'Monster_Creatures_Fantasy/Goblin', 'frame': (150, 150),
        'scale': 1.0, 'license': None,
        'anims': {'idle': ('Idle', 7, -1), 'walk': ('Run', 13, -1), 'atk': ('Attack', 16, 0),
                  'hurt': ('Take Hit', 12, 0), 'die': ('Death', 9, 0)},
    },
    'mon_thorn_rootling': {
        'name': 'Monster Creatures Fantasy — Mushroom (LuizMelo)', 'dir': 'Monster_Creatures_Fantasy/Mushroom', 'frame': (150, 150),
        'scale': 1.0, 'license': None,
        'anims': {'idle': ('Idle', 6, -1), 'walk': ('Run', 11, -1), 'atk': ('Attack', 14, 0),
                  'hurt': ('Take Hit', 12, 0), 'die': ('Death', 9, 0)},
    },
    'mon_rotten_guard': {
        'name': 'Monster Creatures Fantasy — Skeleton (LuizMelo)', 'dir': 'Monster_Creatures_Fantasy/Skeleton', 'frame': (150, 150),
        'scale': 1.0, 'license': None,
        'anims': {'idle': ('Idle', 6, -1), 'walk': ('Walk', 7, -1), 'atk': ('Attack', 13, 0),
                  'hurt': ('Take Hit', 12, 0), 'die': ('Death', 9, 0)},
    },
    # Kızıl Damar Gözcüsü (elit) = Flying Eye, kızıla boyanır; hep uçar (bekleme ve yürüme aynı kanat çırpma şeridi)
    'mon_red_vein_watcher': {
        'name': 'Monster Creatures Fantasy — Flying Eye (LuizMelo)', 'dir': 'Monster_Creatures_Fantasy/Flying eye', 'frame': (150, 150),
        'scale': 2.0, 'hue': '#b8303a', 'license': None,
        'anims': {'idle': ('Flight', 10, -1), 'walk': ('Flight', 14, -1), 'atk': ('Attack', 14, 0),
                  'hurt': ('Take Hit', 12, 0), 'die': ('Death', 9, 0)},
    },
    # Monsters Creatures Fantasy 2 — Slime: Bataklık Sülüğü
    'mon_swamp_leech': {
        'name': 'Monsters Creatures Fantasy 2 — Slime (LuizMelo)', 'dir': 'Monsters Creatures Fantasy 2/Slime', 'frame': (156, 156),
        'scale': 1.0, 'license': None,
        'anims': {'idle': ('idle', 10, -1), 'walk': ('walk', 10, -1), 'atk': ('attack', 22, 0),
                  'hurt': ('hurt', 12, 0), 'die': ('death', 12, 0)},
    },
    # Scorpian (32×32): Kızıl Akrep — mor akrep kızıla boyanır; pakette darbe/ölüm yok
    'mon_crimson_scorpion': {
        'name': 'Scorpian', 'dir': 'Scorpian', 'frame': (32, 32), 'scale': 1.5, 'hue': '#c8382a', 'license': None,
        'anims': {'idle': ('Idel', 5, -1), 'walk': ('Walk', 9, -1), 'atk': ('Attack', 9, 0),
                  'hurt': ({'derive': 'flash', 'of': 'idle'}, 10, 0),
                  'die': ({'derive': 'collapse', 'of': 'idle'}, 10, 0)},
    },
    # V4: Okçu = Huntress 2 (LuizMelo, CC0); oku ve ok efekti paketten
    'hero_archer': {
        'name': 'Huntress 2 (LuizMelo, CC0)', 'dir': 'Huntress_2/Huntress 2/Sprites/Character', 'frame': (100, 100),
        'height': 58, 'license': 'Huntress_2/Huntress 2/License.txt',
        'anims': {'idle': ('Idle', 9, -1), 'walk': ('Run', 13, -1), 'atk': ('Attack', 16, 0), 'atk2': ('Attack', 16, 0),
                  'cast': ('Attack', 16, 0), 'hurt': ('Get Hit', 12, 0), 'die': ('Death', 10, 0)},
        'fx': {'arrow': ('../Arrow/Move.png', 24, 5, 2, 12, -1)},
    },
    # V4: Ölü Çağıran = Evil Wizard 3 (LuizMelo, CC0). Saldırı şeridinin mermi uçuş kareleri (9–12) atılır: mermiyi oyun atar.
    'hero_necromancer': {
        'name': 'Evil Wizard 3 (LuizMelo, CC0)', 'dir': 'Evil_Wizard_3/Evil Wizard 3/Sprites', 'frame': (140, 140),
        'height': 58, 'license': 'Evil_Wizard_3/Evil Wizard 3/License.txt',
        'anims': {'idle': ('Idle', 9, -1), 'walk': ('Run', 12, -1),
                  'atk': ({'strip': 'Attack', 'frames': list(range(9))}, 18, 0), 'atk2': ({'strip': 'Attack', 'frames': list(range(9))}, 18, 0),
                  'cast': ({'strip': 'Attack', 'frames': list(range(9))}, 18, 0), 'hurt': ('Get hit', 12, 0), 'die': ('Death', 14, 0)},
        'fx': {'soul_bolt': ('Projectile/Moving.png', 50, 50, 1, 12, -1), 'soul_burst': ('Projectile/Explode.png', 50, 50, 1, 18, 0)},
    },
    # V4: Ölü Çağıran'ın iskeleti = Skeleton Sprite Pack; şeritlerin kare boyu farklı, karakter karede sola dayalı
    'mon_skeleton_minion': {
        'name': 'Skeleton Sprite Pack', 'dir': 'Skeleton_Sprite_Pack/Skeleton/Sprite Sheets', 'frame': (24, 32),
        'scale': 1.5, 'pad': 'left-bottom', 'license': None,
        'anims': {'idle': ({'strip': 'Skeleton Idle', 'fw': 24, 'fh': 32}, 8, -1), 'walk': ({'strip': 'Skeleton Walk', 'fw': 22, 'fh': 33}, 12, -1),
                  'atk': ({'strip': 'Skeleton Attack', 'fw': 43, 'fh': 37}, 22, 0), 'hurt': ({'strip': 'Skeleton Hit', 'fw': 30, 'fh': 32}, 16, 0),
                  'die': ({'strip': 'Skeleton Dead', 'fw': 33, 'fh': 32}, 12, 0)},
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


def numbered(prefix):
    fs = glob.glob(prefix + '_*.png')
    fs.sort(key=lambda f: int(re.findall(r'_(\d+)\.png$', f)[0]))
    return [Image.open(f).convert('RGBA') for f in fs]


_ase_cache = {}


def load_source(base, spec, fw, fh):
    if isinstance(spec, str):
        return frames_of(os.path.join(base, spec + '.png'), fw, fh)
    if 'strip' in spec:
        allf = frames_of(os.path.join(base, spec['strip'] + '.png'), spec.get('fw', fw), spec.get('fh', fh))
        frs = [allf[i].copy() for i in spec['frames']] if 'frames' in spec else allf
    elif 'files' in spec:
        frs = numbered(os.path.join(base, spec['files']))
    elif 'ase' in spec:
        path = os.path.join(base, spec['ase'])
        doc = _ase_cache.get(path) or _ase_cache.setdefault(path, load_aseprite(path))
        frs = [f.copy() for f in doc['frames'][spec['from']:spec['to'] + 1]]
    else:
        raise ValueError(spec)
    return frs[::-1] if spec.get('reverse') else frs


def derive(kind, src):
    """Pakette olmayan animasyonu var olan karelerden üret."""
    if kind == 'bob':      # koşu: bekleme kareleri 1–2 px zıplar
        out = []
        for i, fr in enumerate(src):
            dy = [0, -1, -2, -1][i % 4]
            c = Image.new('RGBA', fr.size)
            c.paste(fr, (0, dy), fr)
            out.append(c)
        return out
    if kind == 'flash':    # darbe: beyaz silüet + geri sekme
        fr = src[0]
        white = Image.new('RGBA', fr.size, (255, 255, 255, 255))
        sil = Image.new('RGBA', fr.size)
        sil.paste(white, (0, 0), fr.getchannel('A').point(lambda v: 255 if v > 0 else 0))
        back = Image.new('RGBA', fr.size)
        back.paste(fr, (-2, 0), fr)
        return [sil, back]
    if kind == 'collapse':  # ölüm: gövde yere çöker ve solar
        fr = src[0]
        box = fr.getbbox()
        out = []
        for k, (sq, a) in enumerate([(0.85, 1.0), (0.6, 0.9), (0.35, 0.7), (0.18, 0.45)]):
            part = fr.crop(box)
            nh = max(1, round(part.height * sq))
            part = part.resize((part.width + k * 2, nh), Image.NEAREST)
            part.putalpha(part.getchannel('A').point(lambda v: int(v * a)))
            c = Image.new('RGBA', fr.size)
            c.paste(part, (box[0] - k, box[3] - nh), part)
            out.append(c)
        return out
    raise ValueError(kind)


def recolor(fr, color):
    """Doymuş piksellerin tonunu hedef renge çevirir (parlaklık ve doygunluk korunur, gri/siyah dış hat değişmez)."""
    h = color.lstrip('#')
    th = colorsys.rgb_to_hsv(*(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)))[0]
    px = fr.load()
    for y in range(fr.height):
        for x in range(fr.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.15:
                r, g, b = (round(c * 255) for c in colorsys.hsv_to_rgb(th, s, v))
                px[x, y] = (r, g, b, a)
    return fr


def union(boxes):
    boxes = [b for b in boxes if b]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))


def load_existing(name='SPRITE_PACKS'):
    if not os.path.exists(OUT_JS):
        return {}
    txt = open(OUT_JS, encoding='utf-8').read()
    m = re.search(name + r' = (\{.*?\});\n', txt, re.S)
    return json.loads(m.group(1)) if m else {}


def pad_frames(frs, w, h):
    """Farklı boyutlu kareleri ortak tuvale sol-alt hizalı yerleştir."""
    out = []
    for fr in frs:
        c = Image.new('RGBA', (w, h))
        c.paste(fr, (0, h - fr.height), fr)
        out.append(c)
    return out


def main(src):
    meta = load_existing()
    fx_meta = load_existing('FX_PACKS')
    credits = []
    for pid, p in PACKS.items():
        base = os.path.join(src, p['dir'])
        if not os.path.isdir(base):
            print(f'ATLANDI {pid}: {base} yok')
            continue
        fw, fh = p['frame']
        raw = {}
        for a, (spec, _, _) in p['anims'].items():
            if isinstance(spec, dict) and 'derive' in spec:
                continue
            frs = load_source(base, spec, fw, fh)
            if p.get('flip'):
                frs = [ImageOps.mirror(fr) for fr in frs]
            if p.get('hue'):
                frs = [recolor(fr, p['hue']) for fr in frs]
            # tamamen boş kareleri at (bazı şeritlerin sonunda boş kare olabilir)
            raw[a] = [fr for fr in frs if fr.getbbox()] or frs[:1]
        if p.get('pad'):
            pw = max(fr.width for frs in raw.values() for fr in frs)
            ph = max(fr.height for frs in raw.values() for fr in frs)
            raw = {a: pad_frames(frs, pw, ph) for a, frs in raw.items()}
        for a, (spec, _, _) in p['anims'].items():
            if isinstance(spec, dict) and 'derive' in spec:
                raw[a] = derive(spec['derive'], raw[spec['of']])
        u = union([fr.getbbox() for frs in raw.values() for fr in frs])
        idle = union([fr.getbbox() for fr in raw['idle']])
        scale = p.get('scale') or p['height'] / (idle[3] - idle[1])
        body = round((idle[3] - idle[1]) * scale)
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
            'w': tw, 'h': th, 'body': body,                          # karakterin bekleme boyu (oyun pikseli)
            'ox': round(((idle[0] + idle[2]) / 2 - u[0]) / cw, 4),   # ayak noktası (yatay orta)
            'oy': round((idle[3] - u[1]) / ch, 4),                   # ayak noktası (alt)
            'anims': anims, 'credit': p['name'],
        }
        if p['license']:
            shutil.copy(os.path.join(src, p['license']), os.path.join(out, 'LICENSE.txt'))
        for name, (f, fw2, fh2, sc, fps, rep) in p.get('fx', {}).items():
            im = Image.open(os.path.normpath(os.path.join(base, f))).convert('RGBA')
            n = im.width // fw2
            im = im.crop((0, 0, n * fw2, fh2)).resize((n * fw2 * sc, fh2 * sc), Image.NEAREST)
            os.makedirs(os.path.join(OUT_DIR, 'fx'), exist_ok=True)
            im.save(os.path.join(OUT_DIR, 'fx', name + '.png'), optimize=True)
            fx_meta[name] = {'w': fw2 * sc, 'h': fh2 * sc, 'frames': n, 'fps': fps, 'repeat': rep, 'credit': p['name']}
        credits.append(f"{pid}: {p['name']}")
        print(f'{pid}: kare {tw}x{th}, ölçek {scale:.2f}, {len(anims)} animasyon')
    with open(OUT_JS, 'w', encoding='utf-8') as fh:
        fh.write('// OTOMATİK ÜRETİLDİ: tools/import-sprites.py — elle düzenlemeyin.\n')
        fh.write('// Hazır sprite paketleri (public/sprites/<id>/<anim>.png). ox/oy: ayak noktası (orijin).\n')
        order = [k for k in PACKS if k in meta] + [k for k in meta if k not in PACKS]
        fh.write('export const SPRITE_PACKS = ' + json.dumps({k: meta[k] for k in order}, ensure_ascii=False, indent=2) + ';\n')
        fh.write('// Paket efektleri (public/sprites/fx/<ad>.png): procedural fx_<ad> dokusunun yerine geçer.\n')
        fh.write('export const FX_PACKS = ' + json.dumps(fx_meta, ensure_ascii=False, indent=2) + ';\n')
    print('yazıldı:', os.path.relpath(OUT_JS, ROOT))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
