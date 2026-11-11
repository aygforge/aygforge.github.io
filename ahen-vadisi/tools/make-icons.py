# Uygulama ikonlarını 32x32 pixel-art tasarımdan üretir (PWA / itch.io)
from PIL import Image, ImageDraw
import os, sys
out = sys.argv[1] if len(sys.argv) > 1 else 'public/icons'
os.makedirs(out, exist_ok=True)
S = 32
im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = im.load()
def px(x, y, c):
    if 0 <= x < S and 0 <= y < S: d[x, y] = c
# arka plan: alacakaranlık gökyüzü + dağ
for y in range(S):
    t = y / S
    c = (int(26 + 150 * t), int(24 + 70 * t), int(56 + 30 * t), 255)
    for x in range(S): px(x, y, c)
import math
for x in range(S):
    h = int(20 - 6 * math.sin(x * 0.25 + 1) - 3 * math.sin(x * 0.6))
    for y in range(h, S): px(x, y, (42, 36, 70, 255))
    h2 = int(25 - 2 * math.sin(x * 0.4 + 2))
    for y in range(h2, S): px(x, y, (22, 30, 38, 255))
# ay
for y in range(S):
    for x in range(S):
        if (x - 24) ** 2 + (y - 7) ** 2 <= 9: px(x, y, (250, 240, 210, 255))
# kılıç (çapraz)
for i in range(16):
    x, y = 8 + i, 25 - i
    px(x, y, (230, 236, 244, 255)); px(x + 1, y, (170, 180, 192, 255))
for i in range(-3, 4):
    px(10 + i, 21 + i, (232, 192, 96, 255))
px(7, 25, (110, 70, 40, 255)); px(6, 26, (110, 70, 40, 255)); px(5, 27, (232, 192, 96, 255))
# çerçeve
for i in range(S):
    for c in (0, S - 1):
        px(i, c, (138, 106, 58, 255)); px(c, i, (138, 106, 58, 255))
for size in (192, 512):
    im.resize((size, size), Image.NEAREST).save(f'{out}/icon-{size}.png')
# maskable: güvenli alan için ortalanmış küçültme
m = Image.new('RGBA', (512, 512), (26, 18, 32, 255))
inner = im.resize((384, 384), Image.NEAREST)
m.paste(inner, (64, 64))
m.save(f'{out}/icon-512-maskable.png')
print('ikonlar üretildi')
