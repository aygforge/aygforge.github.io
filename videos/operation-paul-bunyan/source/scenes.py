# Scene choreography for Operation Paul Bunyan, timed to the narration.
import math
import numpy as np
import cairo
from lib import *
from assets import *

# narration sentence windows (measured from the ElevenLabs file)
N = [(0.00, 7.55), (8.64, 12.88), (13.94, 21.15), (22.29, 30.90), (31.90, 37.53), (38.71, 42.17),
     (43.02, 46.28), (47.12, 49.84), (50.69, 53.07), (54.26, 61.05), (62.06, 67.15), (68.21, 72.20),
     (73.15, 76.48), (77.32, 78.16), (79.34, 85.36), (86.45, 90.31), (91.28, 96.37), (97.44, 100.90)]

CAPTIONS = [
    "1976’da bir ağacı kesmek için bombardıman uçakları, savaş uçakları ve yüzlerce asker hazırlandı.",
    "Olay Kuzey ve Güney Kore arasındaki Panmunjom bölgesinde yaşandı.",
    "Buradaki büyük bir kavak ağacı, Birleşmiş Milletler Komutanlığına ait iki gözlem noktası arasındaki görüşü kapatıyordu.",
    "18 Ağustos 1976’da Amerikan ve Güney Koreli askerlerden oluşan bir ekip ağacın dallarını budamak için bölgeye gitti.",
    "Ancak Kuzey Kore askerleriyle çıkan çatışmada iki Amerikalı subay hayatını kaybetti.",
    "Bunun üzerine üç gün sonra çok sıra dışı bir karar alındı.",
    "Bu kez ağacı budamak yerine tamamen keseceklerdi.",
    "Ama bunu sıradan bir bahçe işi gibi yapmadılar.",
    "Operasyonun adı Paul Bunyan’dı.",
    "Ağacı kesecek mühendisleri Güney Kore özel kuvvetleri, ağır silahlar ve saldırı helikopterleri koruyordu.",
    "Gökyüzünde B-52 bombardıman uçakları ve savaş uçakları hazır bekliyordu.",
    "USS Midway uçak gemisi de Kore açıklarına konuşlandırılmıştı.",
    "Bütün bu askerî güç tek bir görev için hazırlandı:",
    "Ağacı kesmek.",
    "Operasyon başladı ve mühendisler kavak ağacını yaklaşık 42 dakika içinde tamamen devirdi.",
    "Kuzey Kore askerleri operasyonu izledi ama müdahale etmedi.",
    "Ve bütün bu dev askerî gösteri, tek bir ağacın kesilmesiyle sona erdi.",
    "İnanması güç ama bu gerçekten yaşandı.",
]

NARR_END = 100.91
PHOTO_IN = 101.0
PHOTO_FULL = 102.0
FADE_OUT = 104.9
END = 105.7

FREEZES = [(34.0, 38.3), (100.9, 200.0)]


def boil_at(t):
    for a, b in FREEZES:
        if a <= t < b:
            return int(a * 8)
    return int(t * 8)


def saturation(t):
    if t < 31.8:
        return 1.0
    if t < 38.4:
        return 1 - 0.82 * sstep(31.8, 33.4, t)
    return 0.18 + 0.82 * sstep(38.6, 40.8, t)


def cam_lerp(t, keys):
    """keys: list of (time, cx, cy, z); eased interpolation."""
    if t <= keys[0][0]:
        return keys[0][1:]
    for i in range(1, len(keys)):
        if t <= keys[i][0]:
            a, b = keys[i - 1], keys[i]
            k = ease_io((t - a[0]) / (b[0] - a[0]))
            z = math.exp(lerp(math.log(a[3]), math.log(b[3]), k))
            return (lerp(a[1], b[1], k), lerp(a[2], b[2], k), z)
    return keys[-1][1:]


def pop(t, t0, d=0.35):
    if t < t0:
        return 0.0
    return ease_out_back((t - t0) / d)


def setup(ctx, t, keys, shake=0.0):
    cx, cy, z = cam_lerp(t, keys)
    if shake:
        cx += shake * math.sin(t * 61) / z
        cy += shake * math.cos(t * 53) / z
    camera(ctx, cx, cy, z)
    return Pen(ctx, boil_at(t), z), z


def anchored(ctx, x, y, k, fn):
    """scale-in around a world anchor."""
    if k <= 0.01:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(k, k)
    ctx.translate(-x, -y)
    fn()
    ctx.restore()


GY = 1600  # standard ground line


# =============================================================== SCENE A: hook
def scene_hook(ctx, t):
    keys = [(0.0, 540, 1250, 1.3), (0.8, 540, 1240, 1.25), (2.5, 540, 910, 0.62), (7.5, 540, 880, 0.56),
            (8.35, 548, 1470, 4.5)]
    p, z = setup(ctx, t, keys)
    sky_wash(p, -2000, GY, alpha=0.35)
    for i, (cx, cy, s) in enumerate([(-300, 380, 1.0), (1250, 250, 1.2), (900, 640, 0.7), (100, 820, 0.6)]):
        cloud(p, cx + 12 * t * (1 if i % 2 else -1), cy, s, seed=i + 3)
    # distant ridge
    p.shape([(-1500, GY - 60), (-600, GY - 160), (100, GY - 90), (900, GY - 170), (1700, GY - 80), (2500, GY - 140),
             (2500, GY + 10), (-1500, GY + 10)], fill=mix(OLIVE_L, SKY, 0.45), seed=21, hatch_sp=14)
    ground(p, GY, seed=3)
    # far artillery + trucks (wave 3)
    for i, x in enumerate((-650, -420, 1500, 1730)):
        k = pop(t, 2.5 + i * 0.12)
        anchored(ctx, x, GY - 40, k, lambda x=x, i=i: artillery(p, x, GY - 40, 0.9, face=1 if x < 540 else -1,
                                                                seed=500 + i * 9))
    for i, x in enumerate((-180, 1260)):
        k = pop(t, 2.3 + i * 0.15)
        anchored(ctx, x, GY + 120, k, lambda x=x, i=i: truck(p, x, GY + 120, 1.0, face=1 if x < 540 else -1,
                                                             seed=520 + i * 7))
    # wave 3 soldiers far rows
    for side in (-1, 1):
        base = 540 + side * 700
        squad(p, base - 260, GY + 10, 7, 3, 80, 60, 0.85, kind='rok' if side < 0 else 'army',
              seed=700 + side * 50, appear=lambda i, side=side: pop(t, 2.2 + 0.03 * i))
    # tree
    tree(p, 540, GY, 0.95, t, sway=1.0)
    # wave 1: ring of soldiers close to the tree
    for i, (dx, dy, kind) in enumerate([(-170, 40, 'army'), (170, 40, 'army'), (-260, 90, 'rok'), (260, 90, 'rok'),
                                         (-90, 110, 'army'), (90, 110, 'army'), (-350, 150, 'army'),
                                         (350, 150, 'army'), (0, 170, 'rok'), (-210, 190, 'rok'),
                                         (210, 190, 'rok')]):
        k = pop(t, 0.45 + i * 0.045, 0.3)
        x, y = 540 + dx, GY + dy
        anchored(ctx, x, y, k, lambda x=x, y=y, kind=kind, i=i: soldier(
            p, x, y, 1.15, col=OLIVE if kind == 'army' else OLIVE_D, helmet=kind == 'army', beret=kind == 'rok',
            rifle=True, face=1 if x < 540 else -1, seed=900 + i * 13))
    # wave 2 rows
    squad(p, 60, GY + 260, 12, 2, 85, 70, 1.0, kind='army', seed=1200,
          appear=lambda i: pop(t, 1.5 + 0.02 * i))
    # helicopters
    for i, (x0, x1, y, face, t0) in enumerate([(-200, 170, 900, 1, 0.95), (1300, 920, 840, -1, 1.05),
                                                (-700, -230, 560, 1, 1.9), (1800, 1330, 520, -1, 2.0)]):
        k = ease_io((t - t0) / (0.9 if i < 2 else 1.4))
        if t > t0:
            x = lerp(x0, x1, k) + 6 * math.sin(t * 1.7 + i)
            helicopter(p, x, y + 8 * math.sin(t * 2 + i), 0.75, t, face=face, seed=40 + i * 9)
    # fighters streak
    for i, (t0, y, s) in enumerate([(1.3, 650, 0.8), (1.45, 720, 0.8), (3.4, 300, 0.7)]):
        if t > t0:
            x = -400 + (t - t0) * 1200
            if x < 2400:
                speed_lines(p, x, y, s, seed=80 + i)
                fighter(p, x, y, s, seed=60 + i * 7)
    # B-52
    if t > 1.0:
        k = ease_io((t - 1.0) / 1.7)
        x = lerp(-1200, 480, k) + 25 * (t - 1.0)
        b52(p, x, 330, 1.15, seed=150)
    # hand-drawn circle around the tree
    if 4.4 < t < 7.6:
        k = clamp((t - 4.4) / 0.8)
        pts = []
        n = int(60 * k) + 2
        for i in range(n):
            a = -1.9 + 2 * math.pi * 1.08 * i / 60
            pts.append((540 + 360 * math.cos(a), 1170 + 520 * math.sin(a)))
        p.line(pts, col=RED, lw=6, seed=33, amp=2.0, alpha=0.85 * (1 - sstep(7.2, 7.6, t)))


# =============================================================== SCENE B: map
def map_world_keys():
    pm = proj(*PANMUNJOM)
    dm = proj(127.3, 38.25)
    return [(7.9, 540, 1000, 0.9), (8.7, 540, 1060, 1.0), (9.5, 540, 1060, 1.0), (10.8, dm[0], dm[1], 2.6),
            (11.2, dm[0] - 30, dm[1] + 5, 2.7), (12.4, pm[0], pm[1] - 10, 7.5), (13.9, pm[0], pm[1] - 20, 22.0)]


def scene_map(ctx, t):
    p, z = setup(ctx, t, map_world_keys())
    korea_map(p, t, dmz=lin(9.6, 10.9, t), pin=lin(11.15, 11.55, t))


# =============================================================== SCENE C: JSA (S3-S5)
OPA = (40, 1330)
OPB = (1050, 1330)
TREEC = (560, GY)


def jsa_ground(p):
    pts = [(-1600, GY + 20), (-300, GY + 10), (-120, 1370), (40, 1320), (200, 1380), (330, GY - 5), (800, GY),
           (900, 1380), (1050, 1325), (1200, 1370), (1400, GY), (2600, GY + 15), (2600, 3600), (-1600, 3600)]
    p.shape(pts, fill=GROUND, seed=12, hatch_sp=13, hatch_ang=0.3, lw=3.4)


def scene_jsa(ctx, t):
    keys = [(13.3, 560, 1180, 0.95), (15.0, 545, 1150, 0.82), (21.6, 545, 1150, 0.8), (23.6, 520, 1350, 1.1),
            (31.0, 540, 1360, 1.05), (34.0, 560, 1380, 1.12), (38.4, 520, 1520, 1.55)]
    p, z = setup(ctx, t, keys)
    fz = 34.0 <= t < 38.4
    tt = 34.0 if fz else t
    sky_wash(p, -2000, GY, alpha=0.32)
    cloud(p, 200 + 8 * tt, 640, 0.8, seed=4)
    cloud(p, 900 - 6 * tt, 520, 0.6, seed=5)
    p.shape([(-1500, GY - 90), (-200, GY - 190), (600, GY - 130), (1400, GY - 200), (2500, GY - 100),
             (2500, GY), (-1500, GY)], fill=mix(OLIVE_L, SKY, 0.5), seed=22, hatch_sp=14)
    jsa_ground(p)
    fade_people = 1 - sstep(34.5, 35.6, t)
    # observation posts
    op_post(p, OPA[0], OPA[1], 1.0, seed=150, flagcol=BLUE_L)
    op_post(p, OPB[0], OPB[1], 1.0, seed=160, flagcol=BLUE_L)
    fence(p, -400, 1500, GY + 120, seed=40)
    # road
    p.line([(-1500, GY + 60), (2500, GY + 60)], col=KHAKI, lw=3, seed=41, alpha=0.7)
    # work party truck
    if t > 22.2:
        k = ease_io((t - 22.2) / 2.4)
        tx = lerp(-500, 300, k)
        truck(p, tx, GY + 30, 1.0, seed=520, t=tt, moving=(t < 24.6), alpha=fade_people)
    # tree
    tree(p, TREEC[0], TREEC[1], 0.9, tt, sway=1.0 if not fz else 0.0, leaf_shake=0.0,
         seed=7)
    # ladder against the tree
    la = sstep(25.0, 25.6, t) * fade_people
    if la > 0:
        ladder(p, 470, GY + 5, 535, GY - 330, alpha=la)
    # work party members
    people = [(-260, 'army', 23.0), (-200, 'rok', 23.2), (-140, 'army', 23.4), (-90, 'rok', 23.7),
              (-40, 'army', 23.9)]
    targets = [380, 430, 650, 700, 760]
    for i, ((x0, kind, t0), xt) in enumerate(zip(people, targets)):
        if t < t0:
            continue
        k = ease_io((t - t0) / 2.2)
        x = lerp(x0, xt, k)
        walking = 0.05 < k < 0.98 and not fz
        # confrontation: party turns toward approaching group
        soldier(p, x, GY + 40 + (i % 2) * 18, 1.05, col=KHAKI if kind == 'army' else OLIVE, helmet=True,
                walk=(tt * 9 + i) if walking else None, face=1 if (x < 600 or t > 32.5) else -1,
                seed=800 + i * 11, alpha=fade_people,
                tool='raise' if (i == 3 and 26.5 < t < 31.6) else None)
    # worker on the ladder trimming with a saw
    if 26.0 < t:
        a = sstep(26.0, 26.5, t) * fade_people
        lx, ly = 505, GY - 175
        soldier(p, lx, ly, 1.0, col=KHAKI, helmet=True, seed=880, alpha=a, tool='raise', face=1)
        saw_dx = 8 * math.sin(tt * 9) if t < 31.6 else 0
        handsaw(p, lx - 10 + saw_dx, ly - 125, 0.55, rot=-0.6, alpha=a)
        # pruning tool resting
    if 23.6 < t:
        shears(p, 330, GY + 112, 0.45, rot=0.2, alpha=sstep(23.6, 24.1, t) * fade_people)
    # small branch falling (routine pruning)
    if 28.3 < t < 30.2:
        k = clamp((t - 28.3) / 1.0)
        bx, by = 470 - 30 * k, GY - 380 + 360 * k * k
        p.line([(bx, by), (bx - 60, by + 20)], col=BROWN, lw=6, seed=77)
        p.shape(blob_pts(bx - 70, by + 22, 26, 3), fill=LEAF2, seed=78)
    # S3 sight line between the two posts
    if 15.0 < t < 22.4:
        al = 1 - sstep(21.6, 22.3, t)
        wa = (OPA[0] + 60, OPA[1] - 168)
        wb = (OPB[0] - 60, OPB[1] - 168)
        k = clamp((t - 15.2) / 1.2)
        hitA = 330
        xa = lerp(wa[0], hitA, k)
        ya = lerp(wa[1], wa[1] + (wb[1] - wa[1]) * (hitA - wa[0]) / (wb[0] - wa[0]), k)
        p.line([wa, (xa, ya)], col=RED, lw=4.5, seed=91, dash=[18, 12], alpha=al)
        k2 = clamp((t - 16.0) / 1.0)
        hitB = 800
        xb = lerp(wb[0], hitB, k2)
        p.line([wb, (xb, wb[1])], col=RED, lw=4.5, seed=92, dash=[18, 12], alpha=al)
        # eye icons
        for (ex, ey), s0 in ((wa, 15.0), (wb, 15.4)):
            e = pop(t, s0) * al
            if e > 0:
                ey2 = ey - 70
                p.shape([(ex - 34 * e, ey2), (ex, ey2 - 18 * e), (ex + 34 * e, ey2), (ex, ey2 + 18 * e)],
                        fill=WHITE, seed=int(ex), lw=3, alpha=al, hatch=False)
                p.circle(ex, ey2, 9 * e, fill=INK, seed=int(ex) + 1, alpha=al, hatch=False)
        # blocked marks
        for (hx, hy, s0) in ((hitA, wa[1], 16.5), (hitB, wb[1], 17.1)):
            e = pop(t, s0) * al
            if e > 0:
                r = 26 * e
                p.line([(hx - r, hy - r), (hx + r, hy + r)], col=RED, lw=7, seed=95, alpha=al)
                p.line([(hx - r, hy + r), (hx + r, hy - r)], col=RED, lw=7, seed=96, alpha=al)
        # faint "should-be" sight line through the crown
        if t > 17.6:
            p.line([wa, wb], col=GREY_D, lw=2.5, seed=97, dash=[6, 14], alpha=0.5 * sstep(17.6, 18.4, t) * al)
    # S5 symbolic confrontation: grey silhouettes approach, scene freezes
    if t > 32.0:
        for i in range(6):
            x0 = 1500 + i * 70
            k = ease_io((t - 32.0 - i * 0.08) / 1.9)
            x = lerp(x0, 820 + i * 55, k)
            if fz:
                x = lerp(x0, 820 + i * 55, ease_io((34.0 - 32.0 - i * 0.08) / 1.9))
            soldier(p, x, GY + 34 + (i % 2) * 20, 1.05, col=GREY_D, helmet=False, face=-1, seed=1000 + i * 7,
                    walk=(tt * 9 + i) if (k < 0.98 and not fz) else None, alpha=fade_people,
                    hat_col=GREY_D, skin=GREY_L)
    # two empty helmets remain
    if t > 34.9:
        a = sstep(34.9, 36.0, t)
        helmet_on_ground(p, 470, GY + 92, 0.8, seed=1101, alpha=a)
        helmet_on_ground(p, 600, GY + 102, 0.8, seed=1103, alpha=a)


# =============================================================== SCENE D: decision (S6-S8)
def scene_decision(ctx, t):
    keys = [(38.2, 540, 1330, 1.05), (42.5, 540, 1300, 1.0), (47.6, 520, 1320, 1.0), (50.6, 540, 1040, 0.3)]
    p, z = setup(ctx, t, keys)
    sky_wash(p, -3000, GY, alpha=0.32, x0=-4000, x1=5000)
    ground(p, GY, x0=-4000, x1=5000, seed=5)
    grass(p, -200, 1300, GY + 40, seed=6)
    # forces fill the empty space (pull-back)
    if t > 48.4:
        for side in (-1, 1):
            for r in range(3):
                squad(p, 540 + side * (700 + r * 900) - 400, GY + 40 + r * 40, 10, 4, 85, 55, 0.95,
                      kind='rok' if (r + (side > 0)) % 2 else 'army', seed=2000 + r * 100 + side * 7,
                      appear=lambda i, r=r: pop(t, 48.5 + r * 0.35 + 0.004 * i))
        for i, x in enumerate((-1200, -2000, 2300, 3100)):
            k = pop(t, 49.0 + i * 0.1)
            anchored(ctx, x, GY - 20, k, lambda x=x, i=i: artillery(p, x, GY - 20, 1.3, face=1 if x < 540 else -1,
                                                                    seed=600 + i * 7))
        for i, x in enumerate((-700, 1800)):
            k = pop(t, 48.9 + i * 0.1)
            anchored(ctx, x, GY + 260, k, lambda x=x, i=i: truck(p, x, GY + 260, 1.4, seed=640 + i * 5,
                                                                 face=1 if x < 540 else -1))
        for i, (x, y) in enumerate([(-900, 300), (2000, 200), (-300, -200), (1500, -300)]):
            if t > 49.2 + i * 0.12:
                k = ease_io((t - 49.2 - i * 0.12) / 1.0)
                helicopter(p, x + (1 - k) * (-900 if x < 540 else 900), y, 1.5, t, face=1 if x < 540 else -1,
                           seed=300 + i * 11)
    tree(p, 540, GY, 0.9, t, sway=1.0, leaf_shake=1.0 if 45.0 < t < 45.9 else 0.0)
    # cut line at the base appears with the chainsaw idea
    if 45.3 < t < 50.6:
        p.line([(470, GY - 40), (620, GY - 40)], col=RED, lw=4, dash=[12, 9], seed=55,
               alpha=sstep(45.3, 45.7, t) * (1 - sstep(48.2, 48.8, t)))
    # calendar 18 -> 21
    if t < 43.4:
        a = sstep(38.4, 38.8, t) * (1 - sstep(42.7, 43.2, t))
        flips = [39.3, 40.0, 40.7]
        day, prev, f = 18, None, 1.0
        for i, ft in enumerate(flips):
            if t >= ft:
                day, prev, f = 19 + i, 18 + i, clamp((t - ft) / 0.5)
        calendar(p, 820, 1660 - 30 * (1 - a), 1.05, day, prev, f, alpha=a)
    # scissors -> chainsaw
    if 43.0 < t < 47.0:
        a = sstep(43.0, 43.3, t) * (1 - sstep(44.3, 44.9, t))
        anchored(ctx, 250, 1330, pop(t, 43.0), lambda: shears(p, 250, 1330, 1.3, rot=-0.25, alpha=a,
                                                             open_=0.25 + 0.15 * math.sin(t * 8)))
        b = sstep(44.4, 45.0, t) * (1 - sstep(46.5, 47.0, t))
        if b > 0:
            anchored(ctx, 200, 1380, 0.6 + 0.4 * ease_out_back(clamp((t - 44.4) / 0.5)),
                     lambda: chainsaw(p, 200, 1380, 1.6, rot=0.0, alpha=b))
    # engineer walks to the tree with a chainsaw
    if t > 46.6:
        k = ease_io((t - 46.6) / 1.9)
        x = lerp(-150, 420, k)
        walking = k < 0.97
        soldier(p, x, GY + 30, 1.6, col=KHAKI, helmet=True, hat_col=OLIVE, walk=t * 9 if walking else None,
                seed=1500)
        chainsaw(p, x + 34, GY - 50, 0.52, rot=0.15)


# =============================================================== SCENE E: operation file
def scene_file(ctx, t):
    sh = 10 * math.exp(-max(0, t - 52.13) * 9) if t > 52.13 else 0
    keys = [(50.3, 540, 1200, 0.95), (53.9, 540, 1190, 1.06)]
    p, z = setup(ctx, t, keys, shake=sh)
    # faint map grid
    for i in range(-6, 16):
        p.line([(i * 100, 300), (i * 100, 2200)], col=BLUE_L, lw=1.4, seed=i, alpha=0.4)
        p.line([(-600, 300 + i * 120), (1700, 300 + i * 120)], col=BLUE_L, lw=1.4, seed=50 + i, alpha=0.4)
    k = ease_out_back(clamp((t - 50.35) / 0.55), 1.2)
    y = lerp(2300, 1200, k)
    ctx.save()
    ctx.translate(540, y)
    ctx.rotate(-0.04 * (1 - k) + 0.02)
    ctx.translate(-540, -y)
    folder(p, 540, y, 1.45)
    if t > 52.13:
        e = clamp((t - 52.13) / 0.12)
        s = lerp(1.7, 1.15, e)
        stamp(p, 540, y + 10, s, alpha=0.4 + 0.6 * e)
    ctx.restore()


# =============================================================== SCENE F: ground force + sky (S10-S11)
def scene_force(ctx, t):
    keys = [(53.7, 540, 1390, 1.3), (54.9, 540, 1380, 1.2), (55.9, 540, 1330, 1.0), (57.2, 540, 1240, 0.78),
            (58.9, 540, 1150, 0.62), (61.6, 540, 1110, 0.58), (63.6, 560, 560, 0.5), (68.0, 600, 540, 0.48)]
    p, z = setup(ctx, t, keys)
    sky_wash(p, -3000, GY, alpha=0.38, x0=-4000, x1=5000)
    for i, (cx, cy, s) in enumerate([(-600, -200, 1.3), (1500, 0, 1.0), (300, -650, 1.4), (1200, 400, 0.8)]):
        cloud(p, cx + 10 * t * (1 if i % 2 else -1) - 600, cy, s, seed=10 + i)
    # far ridge with artillery silhouettes
    ridge_y = GY - 170
    p.shape([(-2500, GY - 60), (-1200, ridge_y - 40), (-300, ridge_y), (600, ridge_y - 30), (1500, ridge_y + 10),
             (2600, ridge_y - 50), (3500, GY - 60), (3500, GY), (-2500, GY)], fill=mix(OLIVE_L, SKY, 0.4),
            seed=31, hatch_sp=14)
    for i, x in enumerate((-900, -560, -220, 1300, 1640, 1980)):
        k = pop(t, 58.2 + i * 0.1)
        y = ridge_y - 10 + (0 if i % 3 == 1 else 15)
        anchored(ctx, x, y, k, lambda x=x, y=y, i=i: artillery(p, x, y, 0.9, col=mix(OLIVE, GREY, 0.45),
                                                               face=1 if x < 540 else -1, seed=700 + i * 9,
                                                               alpha=0.85))
    ground(p, GY, x0=-4000, x1=5000, seed=7)
    # ROK special forces rows (sides)
    for side in (-1, 1):
        squad(p, 540 + side * 560 - 250, GY + 50, 7, 3, 80, 55, 1.0, kind='rok', seed=3000 + side * 31,
              appear=lambda i, side=side: pop(t, 56.4 + 0.02 * i))
    # armed security right behind the engineers
    for i, x in enumerate((300, 370, 710, 780)):
        k = pop(t, 55.2 + i * 0.07)
        anchored(ctx, x, GY + 10, k, lambda x=x, i=i: soldier(p, x, GY + 10, 1.05, rifle=True,
                                                              face=1 if x < 540 else -1, seed=3300 + i * 7))
    tree(p, 540, GY, 0.85, t, sway=1.0)
    # engineers at the tree
    for i, x in enumerate((430, 650)):
        k = pop(t, 54.2 + i * 0.12)
        anchored(ctx, x, GY + 40, k, lambda x=x, i=i: (
            soldier(p, x, GY + 40, 1.15, col=KHAKI, hat_col=OLIVE, face=1 if x < 540 else -1, seed=3400 + i),
            chainsaw(p, x + (24 if x < 540 else -24), GY - 30, 0.36, rot=0.1 if x < 540 else math.pi - 0.1)))
    # attack helicopters overhead
    for i, (x, y, face, t0) in enumerate([(120, 880, 1, 59.3), (960, 830, -1, 59.45), (-300, 640, 1, 59.7),
                                          (1380, 600, -1, 59.8)]):
        if t > t0:
            k = ease_io((t - t0) / 1.2)
            xx = lerp(x - face * 1100, x, k) + 8 * math.sin(t * 1.3 + i)
            helicopter(p, xx, y + 10 * math.sin(t * 2.1 + i), 0.85, t, face=face, seed=330 + i * 13)
    # B-52s (enormous) and escorts
    if t > 61.9:
        k = ease_io((t - 61.9) / 2.0)
        b52(p, lerp(-1900, 1300, k) + 18 * (t - 61.9), -820, 1.0, seed=180, alpha=0.75, col=mix(GREY, SKY, 0.3))
        b52(p, lerp(-2400, 520, k) + 22 * (t - 61.9), 80, 2.2, seed=170)
    if t > 64.4:
        for i, (dx, dy) in enumerate([(820, -330), (900, 470), (1150, -120), (1240, 250)]):
            k = ease_io((t - 64.4 - i * 0.12) / 1.4)
            x = lerp(-1600, 600, k) + dx + 22 * (t - 64.4)
            y = 80 + dy
            speed_lines(p, x, y, 1.1, seed=400 + i, alpha=0.5)
            fighter(p, x, y, 1.1, seed=420 + i * 9)


# =============================================================== SCENE G: USS Midway
CARRIER_LL = (125.25, 36.55)


def scene_carrier(ctx, t):
    cpos = proj(*CARRIER_LL)
    keys = [(67.6, 540, 900, 0.75), (68.6, 540, 1020, 0.95), (70.2, cpos[0] + 20, cpos[1] - 10, 3.2),
            (73.0, cpos[0] + 30, cpos[1] - 12, 3.45)]
    p, z = setup(ctx, t, keys)
    korea_map(p, t, dmz=1.0, pin=1.0 if t > 67.6 else 0)
    if t > 69.2:
        k = ease_io((t - 69.2) / 1.2)
        cx = lerp(cpos[0] - 220, cpos[0], k)
        cy = lerp(cpos[1] + 90, cpos[1], k)
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(-0.25)
        ctx.translate(-cx, -cy)
        carrier(p, cx, cy, 0.22, t, alpha=sstep(69.2, 69.7, t))
        ctx.restore()


# =============================================================== SCENE H: montage
MONTAGE = [72.95, 73.5, 74.05, 74.6, 75.15, 75.7, 76.6]


def scene_montage(ctx, t):
    idx = 0
    for i in range(len(MONTAGE) - 1):
        if t >= MONTAGE[i]:
            idx = i
    lt = t - MONTAGE[idx]
    z = 1.0 + 0.12 * lt
    camera(ctx, 540, 1250, z)
    p = Pen(ctx, boil_at(t), z)
    # burst lines behind
    rs = np.random.default_rng(idx)
    for i in range(22):
        a = i / 22 * 2 * math.pi + rs.uniform(-0.05, 0.05)
        p.line([(540 + 300 * math.cos(a), 1250 + 300 * math.sin(a)), (540 + 1300 * math.cos(a),
                                                                       1250 + 1300 * math.sin(a))],
               col=KHAKI, lw=6, seed=i + idx * 40, alpha=0.5)
    if idx == 0:
        ground(p, 1480, seed=8)
        for i, x in enumerate((180, 360, 540, 720, 900)):
            soldier(p, x, 1500 + (i % 2) * 30, 2.4, col=OLIVE_D if i % 2 else OLIVE, helmet=not i % 2, beret=bool(i % 2),
                    rifle=True, seed=5000 + i * 9, face=1 if x < 540 else -1)
    elif idx == 1:
        helicopter(p, 330, 1050, 1.25, t, seed=5100)
        helicopter(p, 760, 1420, 1.25, t, face=-1, seed=5110)
    elif idx == 2:
        b52(p, 560, 1250, 1.2, seed=5200)
    elif idx == 3:
        for i, (x, y) in enumerate([(640, 1250), (380, 1050), (380, 1450)]):
            speed_lines(p, x, y, 1.9, seed=5300 + i)
            fighter(p, x, y, 1.9, seed=5310 + i * 9)
    elif idx == 4:
        p.shape(rect_pts(-1000, 0, 3000, 3000), fill=SEA, line=None, seed=3, hatch_sp=14)
        ctx.save()
        ctx.translate(540, 1250)
        ctx.rotate(-0.35)
        ctx.translate(-540, -1250)
        carrier(p, 600, 1250, 1.15, t)
        ctx.restore()
    elif idx == 5:
        ground(p, 1500, seed=9)
        artillery(p, 330, 1500, 2.0, seed=5500)
        artillery(p, 800, 1640, 2.0, seed=5510, face=-1)


# =============================================================== SCENE I: the tree, the cut, the end of it (S14-S17)
NKX = 2350


def scene_finale(ctx, t):
    keys = [(76.6, 520, 1300, 0.78), (77.25, 480, 1420, 1.35), (79.2, 480, 1430, 1.42), (80.6, 520, 1340, 0.95),
            (82.0, 520, 1340, 0.95), (84.2, 600, 1300, 0.8),
            (85.8, 760, 1280, 0.72), (87.6, NKX - 40, 1440, 1.3), (90.9, NKX - 60, 1440, 1.36),
            (93.4, 320, 830, 0.24), (94.6, 320, 840, 0.235), (96.9, 549, 1451, 2.3)]
    frozen = 76.6 <= t < 79.3
    p, z = setup(ctx, t, keys)
    bg = Pen(ctx, int(76.6 * 8) if frozen else p.boil, z)
    tb = 76.6 if frozen else t
    gone = 1 - sstep(94.3, 96.3, t)  # everything except the stump fades
    sky_wash(bg, -4000, GY, alpha=0.34 * gone, x0=-6000, x1=7000)
    # sea strip far left with the carrier symbol
    with_alpha(ctx, gone, lambda: (
        bg.shape([(-6000, GY - 20), (-1150, GY - 20), (-950, GY + 600), (-6000, GY + 600)], fill=SEA, seed=3,
                 hatch_sp=14),
        _flat_carrier(ctx, bg, -1650, GY + 140, tb)))
    with_alpha(ctx, gone, lambda: ground(bg, GY, x0=-1150, x1=7000, seed=11))
    # NK observation post (distant, right)
    with_alpha(ctx, gone, lambda: _nk_side(ctx, bg, tb))
    # supporting force (frozen during the punchline)
    with_alpha(ctx, gone, lambda: _finale_forces(ctx, bg, tb, t))
    # the tree
    fall = 0.0
    if t > 84.3:
        k = clamp((t - 84.3) / 1.15)
        fall = (math.pi / 2 - 0.04) * k ** 2.2
        if k >= 1:
            fall = math.pi / 2 - 0.04
    cut = sstep(79.7, 84.3, t)
    stump(p, 540, GY, 0.95, seed=61)
    if t < 84.3:
        tree(p, 540, GY, 0.85, tb, sway=0.0 if frozen else 0.8, cut=cut, leaf_shake=0.6 if 83.6 < t < 84.3 else 0)
    else:
        def fallen():
            ctx.save()
            ctx.rectangle(-9000, -9000, 20000, 9000 + GY + 30)
            ctx.clip()
            tree(p, 540, GY - 36, 0.85, t, sway=0.0, fall=fall)
            ctx.restore()
        with_alpha(ctx, gone, fallen)
    # dust puff when it lands
    if 85.4 < t < 87.5:
        k = clamp((t - 85.4) / 2.0)
        for i in range(9):
            x = 700 + i * 75
            r = 30 + 70 * k
            p.circle(x, GY - 10 - 10 * math.sin(i), r, fill=KHAKI_L, line=None, seed=70 + i, alpha=0.5 * (1 - k),
                     hatch=False)
    # engineer with chainsaw
    run = 79.4 < t < 84.4
    def eng():
        ex = 430
        soldier(p, ex, GY + 20, 1.3, col=KHAKI, hat_col=OLIVE, face=1, seed=6000)
        if run:
            chainsaw(p, ex + 46, GY - 44, 0.42, rot=0.02, t=t, running=True)
            sawdust(p, 545, GY - 40, t, 79.6, seed=8)
        elif t < 79.4:
            chainsaw(p, ex + 30, GY - 40, 0.42, rot=0.25)
        else:
            chainsaw(p, ex + 10, GY + 14, 0.42, rot=0.0)
    with_alpha(ctx, gone, eng)
    # 42-minute stopwatch (screen space)
    if 79.5 < t < 86.4:
        a = sstep(79.5, 79.9, t) * (1 - sstep(85.9, 86.4, t))
        mins = 42 * ease_io(clamp((t - 79.9) / 4.5))
        ctx.save()
        ctx.identity_matrix()
        sp = Pen(ctx, p.boil, 1.0)
        def sw():
            stopwatch(sp, 850, 760, 0.62, mins)
            draw_text(ctx, f'{int(round(mins))} dk', 850, 900, 54, col=INK)
        with_alpha(ctx, a, sw)
        ctx.restore()


def _flat_carrier(ctx, p, x, y, t):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1, 0.38)
    ctx.translate(-x, -y)
    carrier(p, x, y, 1.15, t)
    ctx.restore()


def _nk_side(ctx, p, t):
    nk_post(p, NKX + 240, GY - 10, 0.85, col=GREY_L, seed=171)
    for i, x in enumerate((NKX - 60, NKX + 30, NKX + 120)):
        soldier(p, x, GY + 30 + (i % 2) * 14, 1.1, col=hexc('7E8566'), helmet=False, hat_col=hexc('5F664A'),
                binoc=True, face=-1, seed=6100 + i * 7)
    fence(p, NKX - 260, NKX + 500, GY + 110, seed=73)


def _finale_forces(ctx, p, tb, t):
    # rows of soldiers left and right of the tree
    squad(p, -60, GY + 160, 9, 2, 80, 60, 1.0, kind='army', seed=7000)
    squad(p, 900, GY + 170, 7, 2, 80, 60, 1.0, kind='rok', seed=7100)
    squad(p, -900, GY + 60, 9, 3, 85, 55, 1.0, kind='rok', seed=7200)
    squad(p, 1450, GY + 60, 8, 3, 85, 55, 1.0, kind='army', seed=7300)
    for i, x in enumerate((-650, -300, 1250)):
        artillery(p, x, GY - 10, 1.0, face=1 if x < 540 else -1, seed=7400 + i * 9)
    truck(p, -350, GY + 60, 1.0, seed=7500)
    # helicopters (rotors stop while frozen)
    for i, (x, y, f) in enumerate([(80, 900, 1), (1040, 860, -1), (-700, 500, 1), (1700, 450, -1)]):
        helicopter(p, x + 6 * math.sin(tb * 1.3 + i), y + 8 * math.sin(tb * 2 + i), 0.85, tb, face=f,
                   seed=7600 + i * 11)
    # bombers + fighters high above (seen in the wide shot)
    b52(p, 200 + 15 * (tb - 76), -900, 2.0, seed=7700)
    b52(p, 1700 + 15 * (tb - 76), -450, 1.2, seed=7710, alpha=0.8)
    for i, (x, y) in enumerate([(1300, -1200), (1450, -950), (-600, -500)]):
        fighter(p, x + 30 * (tb - 76), y, 1.4, seed=7800 + i * 9)


# =============================================================== SCENE J: channel ending
def scene_end(ctx, t):
    keys = [(96.9, 540, 1330, 1.04), (101.0, 540, 1310, 1.0), (106, 540, 1305, 0.99)]
    p, z = setup(ctx, t, keys)
    tt = min(t, 100.9)
    sky_wash(p, -2000, GY, alpha=0.3)
    with_alpha(ctx, sstep(97.0, 97.8, t), lambda: b52(p, 560 + 10 * (tt - 97), 760, 0.62, seed=8100, alpha=0.6,
                                                      col=mix(GREY, SKY, 0.3)))
    with_alpha(ctx, sstep(97.3, 98.0, t), lambda: helicopter(p, 210, 1000 + 6 * math.sin(tt * 2), 0.5, tt,
                                                             seed=8200))
    ground(p, GY, seed=13)
    grass(p, -100, 1200, GY + 50, seed=14)
    with_alpha(ctx, sstep(97.1, 97.8, t), lambda: (op_post(p, 920, GY + 10, 1.0, seed=8300, flagcol=BLUE_L),
                                                    fence(p, -300, 1400, GY + 150, seed=8310)))
    stump(p, 520, GY + 60, 2.1, seed=61)
    with_alpha(ctx, sstep(97.5, 98.2, t), lambda: chainsaw(p, 690, GY + 40, 0.7, rot=-0.32, seed=8400))


# =============================================================== timeline
SCENES = [
    # (start, end, fn, fade-in seconds)
    (0.0, 8.35, scene_hook, 0.0),
    (7.95, 13.9, scene_map, 0.45),
    (13.4, 38.45, scene_jsa, 0.5),
    (38.2, 50.55, scene_decision, 0.55),
    (50.3, 53.95, scene_file, 0.25),
    (53.7, 68.25, scene_force, 0.3),
    (67.6, 72.95, scene_carrier, 0.65),
    (72.95, 76.6, scene_montage, 0.0),
    (76.6, 97.4, scene_finale, 0.0),
    (96.9, END, scene_end, 0.5),
]


def active_scenes(t):
    return [s for s in SCENES if s[0] <= t < s[1]]
