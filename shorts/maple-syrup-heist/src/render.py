import sys, subprocess, math
from scenes import *

SENTS = [
    "Kanada’da hırsızlar bir bankayı değil… milyonlarca dolarlık akçaağaç şurubu rezervini soydu.",
    "Quebec’te dev bir depoda, fiyatları dengelemek için binlerce varil akçaağaç şurubu saklanıyordu.",
    "Ama 2011’de bir grup, depodaki şurubu gizlice çalmaya başladı.",
    "Aylar boyunca dolu variller depodan çıkarılıyor, şurup başka varillere aktarılıyor ve satılıyordu.",
    "Bazı boşalan variller suyla doldurulup tekrar depoya bırakıldı.",
    "Bazılarıysa boş şekilde yerine kondu.",
    "Soygun o kadar uzun sürdü ki yaklaşık 9.500 varillik şurup ortadan kayboldu.",
    "2012’de yapılan kontrolde bir görevli varillerden birinin beklenmedik şekilde hafif olduğunu fark etti.",
    "Yapılan incelemede yaklaşık 18,7 milyon Kanada doları değerinde akçaağaç şurubunun çalındığı ortaya çıktı.",
    "Polis soruşturması sonunda olayla bağlantılı birçok kişi yakalandı ve bazıları mahkûm edildi.",
    "Olay tarihe “Büyük Kanada Akçaağaç Şurubu Soygunu” olarak geçti.",
    "İnanması güç ama bu gerçekten yaşandı.",
]
FINAL_L1 = "İnanması güç ama"
FINAL_L2 = "bu gerçekten yaşandı."
assert FINAL_L1 + " " + FINAL_L2 == SENTS[11]
T_L2 = 69.36

CAP_X0, CAP_X1 = 60, 1020
CAP_TOP, CAP_BOT = 78, 430


def wrap(text, font, maxw):
    words = text.split(' ')
    lines, cur = [], ''
    for w_ in words:
        cand = (cur + ' ' + w_).strip()
        if font.measureText(cand) <= maxw or not cur:
            cur = cand
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


_LAYOUT = {}


def layout(i):
    if i in _LAYOUT:
        return _LAYOUT[i]
    text = SENTS[i]
    for size in range(76, 40, -2):
        f = skia.Font(TF_BOLD, size)
        lines = wrap(text, f, CAP_X1 - CAP_X0)
        lh = size * 1.22
        if len(lines) * lh <= CAP_BOT - CAP_TOP:
            break
    # sanity: wrapped text re-joins to exact sentence
    assert ' '.join(lines) == text
    _LAYOUT[i] = (f, lines, lh)
    return _LAYOUT[i]


def draw_text_line(cv, s, x, y, font, color, reveal=1.0, bold_pass=False):
    w_ = font.measureText(s)
    cv.save()
    if reveal < 1:
        cv.clipRect(skia.Rect(x - 10, y - font.getSize() * 1.3, x + (w_ + 20) * reveal, y + font.getSize() * 0.6))
    p = skia.Paint(AntiAlias=True, Color=col(color, 1.0))
    cv.drawString(s, x, y, font, p)
    if bold_pass:
        cv.drawString(s, x + 1.6, y + 0.6, font, skia.Paint(AntiAlias=True, Color=col(color, 0.9)))
    cv.restore()


def caption_band(cv):
    pts = [(-20, -20), (W + 20, -20)]
    n = 18
    for i in range(n + 1):
        x = W + 20 - (W + 40) * i / n
        pts.append((x, BAND - 22 + 7 * hsh(i, 5)))
    p = mkpath(jitter(pts, 1.5, 4242), closed=True, smooth=False)
    sp = skia.Paint(Color=col(INK, 0.22), AntiAlias=True, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10))
    cv.save()
    cv.translate(0, 8)
    cv.drawPath(p, sp)
    cv.restore()
    cv.drawPath(p, fillp('#F8F1E1'))
    edge = pts[2:]
    line(cv, edge, INK, 4.2, jit=1.2, smooth=False)
    # tiny maple leaf + pencil underline flourish
    maple_leaf(cv, W - 58, BAND - 50, 15, RED, INK, 2)


def captions(cv, t):
    caption_band(cv)
    # which sentence
    i = 0
    for j in range(len(T)):
        if t >= T[j] - 0.06:
            i = j
    if i == 11:
        f1 = skia.Font(TF_REG, 80)
        f2 = skia.Font(TF_BOLD, 104)
        w1 = f1.measureText(FINAL_L1)
        w2 = f2.measureText(FINAL_L2)
        r1 = ease_out(seg(t, T[11] - 0.06, T[11] + 0.45))
        draw_text_line(cv, FINAL_L1, (W - w1) / 2, 205, f1, '#6F6A92', r1)
        if t >= T_L2 - 0.06:
            r2 = ease_out(seg(t, T_L2 - 0.06, T_L2 + 0.5))
            draw_text_line(cv, FINAL_L2, (W - w2) / 2, 345, f2, '#141333', r2, bold_pass=True)
            # hand-drawn underline under the bold line
            u = seg(t, T_L2 + 0.4, T_L2 + 0.9)
            if u > 0:
                x0 = (W - w2) / 2
                line(cv, [(x0, 378), (x0 + w2 * u * 0.5, 384), (x0 + w2 * u, 376)], AMBER_D, 6, jit=1.0)
        return
    f, lines, lh = layout(i)
    total = len(lines) * lh
    y0 = CAP_TOP + (CAP_BOT - CAP_TOP - total) / 2 + f.getSize() * 0.95
    st = T[i] - 0.06
    dur = 0.45
    for k, s in enumerate(lines):
        w_ = f.measureText(s)
        r = ease_out(seg(t, st + k * dur / len(lines), st + (k + 1) * dur / len(lines) + 0.05))
        draw_text_line(cv, s, (W - w_) / 2, y0 + k * lh, f, '#1E1C3E', r)


def watermark(cv, t):
    f = skia.Font(TF_BOLD, 36)
    s = "@bugercektenyasandi"
    w_ = f.measureText(s)
    a = 0.6 + 0.4 * seg(t, T[11], T[11] + 0.6)
    cv.drawString(s, W - 36 - w_, H - 52, f, skia.Paint(AntiAlias=True, Color=col('#FBF6EA', 0.7 * a),
                                                          MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 4)))
    cv.drawString(s, W - 36 - w_, H - 52, f, skia.Paint(AntiAlias=True, Color=col(INK, a)))


def draw_scene(cv, k, t):
    cv.save()
    SCENES[k](cv, t - T[k])
    cv.restore()


def iris_path(cx, cy, r):
    pts = ellipse_pts(cx, cy, r, r, 36)
    return mkpath(jitter(pts, max(2, r * 0.012), 5151), closed=True)


def compose(cv, t):
    trans = None
    for j in range(1, len(T)):
        if T[j] - TW0 <= t < T[j] + TW1:
            trans = j
    if trans is None:
        k = 0
        for j in range(len(T)):
            if t >= T[j] + TW1 - 1e-9 or (j == 0):
                k = j
        draw_scene(cv, k, t)
        return
    j = trans
    p = ease_io((t - (T[j] - TW0)) / (TW0 + TW1))
    typ, foc = TRANS[j]
    if typ == 'iris':
        cv.save()
        s = 1 + 0.35 * p
        cv.translate(foc[0], foc[1]); cv.scale(s, s); cv.translate(-foc[0], -foc[1])
        draw_scene(cv, j - 1, t)
        cv.restore()
        r = 10 + p * 2300
        ip = iris_path(foc[0], foc[1], r)
        cv.save()
        cv.clipPath(ip, doAntiAlias=True)
        cv.save()
        s2 = 1.15 - 0.15 * p
        cv.translate(foc[0], foc[1]); cv.scale(s2, s2); cv.translate(-foc[0], -foc[1])
        draw_scene(cv, j, t)
        cv.restore()
        cv.restore()
        cv.drawPath(ip, strokep(INK, 7, 0.9 * (1 - p * 0.6)))
    elif typ == 'fade':
        draw_scene(cv, j - 1, t)
        cv.saveLayerAlpha(None, int(255 * p))
        draw_scene(cv, j, t)
        cv.restore()
    elif typ in ('pushL', 'pushUp', 'pushDown'):
        if typ == 'pushL':
            o1, o2 = (-W * p, 0), (W * (1 - p), 0)
        elif typ == 'pushUp':
            o1, o2 = (0, -H * p), (0, H * (1 - p))
        else:
            o1, o2 = (0, H * p), (0, -H * (1 - p))
        cv.save(); cv.translate(*o1); draw_scene(cv, j - 1, t); cv.restore()
        cv.save(); cv.translate(*o2)
        cv.clipRect(skia.Rect(0, 0, W, H))
        draw_scene(cv, j, t); cv.restore()
        # ink seam
        if typ == 'pushL':
            x = W * (1 - p)
            line(cv, [(x, 0), (x, H)], INK, 6)
        else:
            y = H * (1 - p) if typ == 'pushUp' else H * p
            line(cv, [(0, y), (W, y)], INK, 6)
    elif typ == 'paper':
        draw_scene(cv, j - 1, t)
        cv.drawRect(skia.Rect(0, 0, W, H), fillp(INK, 0.25 * p))
        y = H * (1 - p)
        cv.save()
        cv.translate(0, y)
        cv.rotate(-3 * (1 - p))
        sp = skia.Paint(Color=col(INK, 0.35), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16))
        cv.drawRect(skia.Rect(-40, -10, W + 40, H + 200), sp)
        cv.clipRect(skia.Rect(-40, 0, W + 40, H + 200))
        cv.translate(0, -0)
        draw_scene(cv, j, t)
        cv.restore()


SURF = None


def render(t):
    global SURF
    if SURF is None:
        SURF = skia.Surface(W, H)
    cv = SURF.getCanvas()
    begin_frame(t)
    cv.clear(col(PAPER))
    cv.save()
    compose(cv, t)
    cv.restore()
    captions(cv, t)
    watermark(cv, t)
    apply_paper(cv)
    return SURF.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType)


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'still':
        from PIL import Image
        for ts in sys.argv[2:]:
            t = float(ts)
            a = render(t)
            Image.fromarray(a).convert('RGB').resize((540, 960), Image.LANCZOS).save('still_%06.2f.png' % t)
    elif mode == 'seg':
        f0, f1, out = int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
        ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS),
                               '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
                               '-x264-params', 'keyint=60', out], stdin=subprocess.PIPE)
        for fi in range(f0, f1):
            a = render(fi / FPS)
            ff.stdin.write(a.tobytes())
            if fi % 60 == 0:
                print(out, fi, flush=True)
        ff.stdin.close()
        ff.wait()
