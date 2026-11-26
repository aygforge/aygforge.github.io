# Android ikon ve açılış ekranı görsellerini oyunun kendi piksel ikonundan üretir (tools/make-icons.mjs ile aynı çizim).
# Kullanım: python3 tools/android-assets.py   (Pillow gerekir; çıktı android/app/src/main/res altına yazılır)
#  - Uyarlanabilir ikon: arka plan = gökyüzü + güneş + deniz, ön plan = yalnız gemi (66/108 güvenli dairenin içinde)
#  - Eski tip kare/yuvarlak ikon ve açılış ekranı (koyu zemin + ortada ikon)
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'android/app/src/main/res')
MAP = [
    '................................',
    '................................',
    '...............r................',
    '...............rr...............',
    '...............k................',
    '.............wwkww..............',
    '............wwwkwww.............',
    '...........wwwwkwwww............',
    '...........wwwwkwwww....kww.....',
    '..........wwwwwkwwwww...kwww....',
    '..........wwwwwkwwwww...kwwww...',
    '..........wwwwwkwwwww...kwwwww..',
    '...........wwwwkwwww....kwwww...',
    '..........kkkkkkkkkkkkkkkkkkk...',
    '.......nnnnnnnnnnnnnnnnnnnnnnnk.',
    '........nyyyyyyyyyyyyyyyyyyyyk..',
    '.........nnnnnnnnnnnnnnnnnnnk...',
    '..........NNNNNNNNNNNNNNNNNk....',
]
C = {'k': (26, 20, 35), 'w': (244, 234, 213), 'r': (200, 66, 59), 'n': (139, 90, 43), 'N': (92, 58, 30), 'y': (242, 193, 78)}
BG = (18, 12, 24)


def background(S):
    """Gökyüzü gradyanı + güneş + deniz şeritleri (make-icons.mjs ile aynı formül)"""
    im = Image.new('RGB', (S, S))
    px = im.load()
    for y in range(S):
        for x in range(S):
            u, v = x / S, y / S
            if v < 0.62:
                t = v / 0.62
                col = (37 + t * 200, 34 + t * 110, 79 - t * 10)
                dx, dy = u - 0.5, v - 0.6
                if dx * dx + dy * dy < 0.045:
                    col = (255, 200, 110)
            else:
                col = (95, 184, 201) if int(v * 40) % 3 == 0 else (36, 66, 107)
            px[x, y] = tuple(max(0, min(255, round(c))) for c in col)
    return im


def ship(cell):
    """Yalnız gemi, saydam zemin; cell = harita pikseli başına çıktı pikseli"""
    xs = [x for row in MAP for x, ch in enumerate(row) if ch != '.']
    ys = [y for y, row in enumerate(MAP) if any(ch != '.' for ch in row)]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    im = Image.new('RGBA', ((x1 - x0 + 1) * cell, (y1 - y0 + 1) * cell), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y, row in enumerate(MAP):
        for x, ch in enumerate(row):
            if ch != '.':
                d.rectangle([(x - x0) * cell, (y - y0) * cell, (x - x0 + 1) * cell - 1, (y - y0 + 1) * cell - 1], fill=C[ch] + (255,))
    return im


def full_icon(S):
    im = background(S).convert('RGBA')
    for y, row in enumerate(MAP):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            for yy in range(int((y / 32 + 0.22) * S), int(((y + 1) / 32 + 0.22) * S)):
                for xx in range(int(x / 32 * S), int((x + 1) / 32 * S)):
                    if 0 <= xx < S and 0 <= yy < S:
                        im.putpixel((xx, yy), C[ch] + (255,))
    return im


def save(im, rel):
    p = os.path.join(RES, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    im.save(p)


DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, k in DENS.items():
    # uyarlanabilir ikon katmanları: 108dp tuval
    S = round(108 * k)
    save(background(S), f'mipmap-{name}/ic_launcher_background.png')
    fg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    cell = max(1, int((60 * k) // 24))  # gemi ~60dp genişlik (güvenli daire 66dp)
    sh = ship(cell)
    fg.alpha_composite(sh, ((S - sh.width) // 2, (S - sh.height) // 2 + round(2 * k)))
    save(fg, f'mipmap-{name}/ic_launcher_foreground.png')
    # eski tip (Android 7 ve öncesi) kare ve yuvarlak ikon: 48dp
    L = round(48 * k)
    sq = full_icon(L * 4).resize((L, L), Image.NEAREST)
    save(sq, f'mipmap-{name}/ic_launcher.png')
    mask = Image.new('L', (L, L), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, L - 1, L - 1], fill=255)
    rd = Image.new('RGBA', (L, L), (0, 0, 0, 0))
    rd.paste(sq, (0, 0), mask)
    save(rd, f'mipmap-{name}/ic_launcher_round.png')

# açılış ekranı (Android 11 ve öncesi tam ekran görsel): koyu zemin + ortada ikon
SPLASH = {'mdpi': (480, 320), 'hdpi': (800, 480), 'xhdpi': (1280, 720), 'xxhdpi': (1600, 960), 'xxxhdpi': (1920, 1280)}
for name, (w, h) in SPLASH.items():
    for orient, (W, H) in (('land', (w, h)), ('port', (h, w))):
        im = Image.new('RGB', (W, H), BG)
        s = min(W, H) // 3
        ic = full_icon(s * 2).resize((s, s), Image.NEAREST)
        im.paste(ic, ((W - s) // 2, (H - s) // 2))
        save(im, f'drawable-{orient}-{name}/splash.png')
im = Image.new('RGB', (480, 320), BG)
ic = full_icon(320).resize((107, 107), Image.NEAREST)
im.paste(ic, ((480 - 107) // 2, (320 - 107) // 2))
save(im, 'drawable/splash.png')
print('android ikon ve açılış görselleri üretildi')
