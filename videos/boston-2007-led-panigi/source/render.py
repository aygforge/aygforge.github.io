import sys, os, math, subprocess, time
import numpy as np
import skia
import lib
from lib import *
import scenes
from scenes import SCENES

# ------------------------------------------------ narration master timeline (from silence analysis)
SENT = [
    (0.00, 4.37, "2007’de bir çizgi film reklamı, Boston’da bomba paniğine yol açtı."),
    (5.00, 12.26, "Şehrin farklı noktalarına, üzerinde piksel şeklinde bir çizgi film karakteri bulunan ışıklı LED panolar yerleştirilmişti."),
    (13.03, 20.27, "Panolar aslında Aqua Teen Hunger Force isimli çizgi filmin yeni filmi için hazırlanan bir reklam kampanyasının parçasıydı."),
    (20.96, 26.40, "Ama 31 Ocak sabahı panolardan biri şüpheli elektronik cihaz olarak ihbar edildi."),
    (27.04, 33.30, "Polis ve bomba imha ekipleri bölgeye geldi ve cihazlardan biri güvenlik amacıyla imha edildi."),
    (34.05, 38.03, "Kısa süre sonra şehrin başka noktalarında da benzer cihazlar bulundu."),
    (38.70, 45.68, "Bazı yollar, köprüler ve toplu taşıma hatları kapatıldı ve Boston saatlerce güvenlik alarmına geçti."),
    (46.53, 51.38, "İşin en garip kısmıysa bu panoların haftalardır şehirde duruyor olmasıydı."),
    (52.18, 60.15, "Aynı reklam panoları başka Amerikan şehirlerine de yerleştirilmişti ama böyle büyük bir paniğe yalnızca Boston’da yol açtı."),
    (61.09, 70.99, "Olayın reklam kampanyası olduğu anlaşılınca şirketler özür diledi ve olayla bağlantılı olarak toplam 2 milyon dolar ödeme konusunda anlaşmaya varıldı."),
    (71.97, 78.12, "Bir çizgi film reklamı, yanlış anlaşılınca bütün bir şehrin düzenini saatlerce değiştirmişti."),
    (78.91, 82.16, "İnanması güç ama bu gerçekten yaşandı."),
]
FINAL_L1_T = 78.91
FINAL_L2_T = 80.72
TOTAL = 86.3
BOUNDS = [0.0] + [(SENT[i][1] + SENT[i + 1][0]) / 2 for i in range(11)] + [TOTAL]
TR = 0.28   # half transition

FOCI = {1: (540, 930), 2: (540, 1150), 3: (560, 1330), 4: (540, 1420), 5: (560, 1350), 6: (540, 1200),
        7: (540, 1250), 8: (540, 950), 9: (540, 1390), 10: (540, 1200), 11: (540, 1180)}

_SURF = {}
def surf(k):
    if k not in _SURF: _SURF[k] = skia.Surface(W, H)
    return _SURF[k]

def draw_scene(c, i, T):
    t = T - BOUNDS[i]; d = BOUNDS[i + 1] - BOUNDS[i]
    c.save(); SCENES[i](c, t, d); c.restore()

_HEADER = None
def header_img():
    global _HEADER
    if _HEADER is None:
        arr = paper_image().toarray().copy()
        y = np.arange(H, dtype=np.float32)
        a = np.clip((560 - y) / (560 - 455), 0, 1)
        a = a * a * (3 - 2 * a)
        arr[:, :, 3] = (a[:, None] * 255).astype(np.uint8)
        # premultiply
        arr[:, :, :3] = (arr[:, :, :3].astype(np.float32) * a[:, None, None]).astype(np.uint8)
        _HEADER = skia.Image.fromarray(arr, colorType=skia.ColorType.kRGBA_8888_ColorType, alphaType=skia.AlphaType.kPremul_AlphaType)
    return _HEADER

# ------------------------------------------------ captions
CAP_TOP, CAP_BOT = 92, 445
_LAYOUT = {}
def layout(text, fontfile='kalam-700.ttf', maxw=950):
    key = (text, fontfile)
    if key in _LAYOUT: return _LAYOUT[key]
    tf = typeface(fontfile)
    for size in range(70, 30, -1):
        f = skia.Font(tf, size)
        lines = balanced_wrap(text, f, maxw)
        lh = size * 1.2
        if len(lines) * lh <= (CAP_BOT - CAP_TOP) and all(f.measureText(l) <= maxw for l in lines):
            break
    _LAYOUT[key] = (size, lines)
    return size, lines

def draw_lines(c, lines, font, y0, lh, col, alpha, reveal=1.0, seed=0, shadow=True):
    tot = sum(len(l) for l in lines); shown = tot * reveal; acc = 0
    for i, l in enumerate(lines):
        wl = font.measureText(l)
        x = (W - wl) / 2
        y = y0 + i * lh
        rot = 0.5 * vnoise(i * 3.3 + 1, seed)
        c.save(); c.translate(W / 2, y); c.rotate(rot); c.translate(-W / 2, -y)
        if shown < acc + len(l):
            k = max(0.0, (shown - acc) / max(1, len(l)))
            c.clipRect(skia.Rect.MakeLTRB(x - 10, y - lh, x + wl * k + 6, y + lh * 0.5))
        if shadow:
            c.drawString(l, x + 2.5, y + 3, font, skia.Paint(AntiAlias=True, Color=C('#FFFFFF', 0.55 * alpha)))
        c.drawString(l, x, y, font, skia.Paint(AntiAlias=True, Color=C(col, alpha)))
        c.restore()
        acc += len(l)

def draw_caption(c, T):
    # which sentence
    for i in range(11):
        a = BOUNDS[i] if i > 0 else 0.0
        b = BOUNDS[i + 1]
        st = max(a, SENT[i][0] - 0.12) if i > 0 else -1.0
        if a - 0.05 <= T < b + 0.2:
            if T < st: continue
            fade_in = seg(T, st, st + 0.18)
            fade_out = 1 - seg(T, b - 0.1, b + 0.15)
            al = min(fade_in, fade_out)
            if al <= 0: continue
            size, lines = layout(SENT[i][2])
            f = skia.Font(typeface('kalam-700.ttf'), size)
            lh = size * 1.2
            block = len(lines) * lh
            y0 = CAP_TOP + (CAP_BOT - CAP_TOP - block) / 2 + size * 0.9
            reveal = ease_out(seg(T, st, st + min(0.55, 0.12 + 0.004 * len(SENT[i][2]))))
            draw_lines(c, lines, f, y0, lh, INK, al, reveal, seed=i)
    # final branded line
    if T >= FINAL_L1_T - 0.1:
        a1 = seg(T, FINAL_L1_T - 0.1, FINAL_L1_T + 0.2)
        f1 = skia.Font(typeface('kalam-300.ttf'), 74)
        draw_lines(c, ["İnanması güç ama"], f1, 225, 80, '#6F7090', a1, ease_out(seg(T, FINAL_L1_T - 0.1, FINAL_L1_T + 0.45)), seed=21, shadow=False)
        if T >= FINAL_L2_T - 0.08:
            a2 = seg(T, FINAL_L2_T - 0.08, FINAL_L2_T + 0.15)
            f2 = skia.Font(typeface('kalam-700.ttf'), 98)
            sc = lerp(1.08, 1.0, ease_out(seg(T, FINAL_L2_T - 0.08, FINAL_L2_T + 0.4)))
            c.save(); c.translate(W / 2, 350); c.scale(sc, sc); c.translate(-W / 2, -350)
            draw_lines(c, ["bu gerçekten yaşandı."], f2, 372, 100, '#161A3C', a2, ease_out(seg(T, FINAL_L2_T - 0.08, FINAL_L2_T + 0.55)), seed=22)
            c.restore()

def draw_handle(c, T):
    f = skia.Font(typeface('kalam-400.ttf'), 34 if T < BOUNDS[11] else 40)
    s = "@bugercektenyasandi"
    wdt = f.measureText(s)
    a = 0.55 if T < BOUNDS[11] else lerp(0.55, 0.9, seg(T, BOUNDS[11], BOUNDS[11] + 0.6))
    c.drawString(s, W - 44 - wdt + 2, 1866 + 2, f, skia.Paint(AntiAlias=True, Color=C('#FFFFFF', 0.5 * a)))
    c.drawString(s, W - 44 - wdt, 1866, f, skia.Paint(AntiAlias=True, Color=C(INK, a)))

# ------------------------------------------------ frame
def render_frame(fi):
    T = fi / FPS
    G.frame = fi; G.t = T; G.seed = fi // 3
    out = surf('out'); c = out.getCanvas()
    i = 0
    while i < 11 and T >= BOUNDS[i + 1]: i += 1
    # transition windows
    trans = None
    if i < 11 and T > BOUNDS[i + 1] - TR: trans = (i, i + 1)
    elif i > 0 and T < BOUNDS[i] + TR: trans = (i - 1, i)
    if trans is None:
        draw_scene(c, i, T)
    else:
        a, b = trans
        bb = BOUNDS[b]
        u = ease_io(seg(T, bb - TR, bb + TR))
        sa = surf('a'); sb = surf('b')
        draw_scene(sa.getCanvas(), a, T)
        draw_scene(sb.getCanvas(), b, T)
        c.drawImage(sa.makeImageSnapshot(), 0, 0)
        fx, fy = FOCI[b]
        r = 1900 * u
        if r > 1:
            clip = wob_circle(fx, fy, r, seed=b, amp=0.035, n=36)
            c.save(); c.clipPath(clip, skia.ClipOp.kIntersect, True)
            c.drawImage(sb.makeImageSnapshot(), 0, 0)
            c.restore()
            if u < 0.98:
                ink(c, clip, 7, a=1 - u * 0.5)
                ink(c, wob_circle(fx, fy, r * 0.97, seed=b + 5, amp=0.04, n=36), 3, a=0.5 * (1 - u))
    c.drawImage(header_img(), 0, 0)
    draw_caption(c, T)
    draw_handle(c, T)
    gp = skia.Paint(); gp.setBlendMode(skia.BlendMode.kMultiply)
    c.drawImage(grain_image(G.seed), 0, 0, skia.SamplingOptions(), gp)
    return out

def nframes(): return int(round(TOTAL * FPS))

if __name__ == '__main__':
    build_textures()
    mode = sys.argv[1]
    if mode == 'stills':
        times = [float(x) for x in sys.argv[2].split(',')]
        os.makedirs('stills', exist_ok=True)
        for T in times:
            t0 = time.time()
            img = render_frame(int(round(T * FPS))).makeImageSnapshot()
            img.save(f'stills/f_{T:06.2f}.png', skia.kPNG)
            print(T, f'{time.time() - t0:.2f}s', flush=True)
    elif mode == 'chunk':
        a, b, outp = int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
        ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', '60', outp], stdin=subprocess.PIPE)
        t0 = time.time()
        for fi in range(a, b):
            arr = render_frame(fi).makeImageSnapshot().toarray(colorType=skia.ColorType.kRGBA_8888_ColorType)
            ff.stdin.write(arr.tobytes())
            if (fi - a) % 60 == 0: print(f'chunk {a}: {fi - a}/{b - a} {time.time() - t0:.0f}s', flush=True)
        ff.stdin.close(); ff.wait()
        print('done', outp, flush=True)
