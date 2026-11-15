import sys, math, subprocess, os
import numpy as np, cairo
from PIL import Image
from lib import *
from scenes import *

HERE = os.path.dirname(os.path.abspath(__file__))
_PHOTO = {}
_CAP = {}

def photo_surface():
    if 'surf' not in _PHOTO:
        im = Image.open(os.path.join(HERE, 'photo', 'paulbunyan.jpg')).convert('RGB')
        a = np.asarray(im)
        h, w = a.shape[:2]
        surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h)
        st = surf.get_stride()
        buf = np.ndarray((h, st // 4, 4), np.uint8, surf.get_data())
        buf[:, :w, 0] = a[..., 2]; buf[:, :w, 1] = a[..., 1]; buf[:, :w, 2] = a[..., 0]; buf[:, :w, 3] = 255
        surf.mark_dirty()
        _PHOTO['surf'] = surf; _PHOTO['wh'] = (w, h)
    return _PHOTO['surf'], _PHOTO['wh']

def band_mask():
    if 'band' not in _PHOTO:
        y = np.arange(H, dtype=np.float32)
        m = 0.9 * (1 - np.clip((y - 430) / 140.0, 0, 1)) ** 1.5
        _PHOTO['band'] = m[:, None, None]
    return _PHOTO['band']

def render_scene(fn, t):
    surf, ctx = new_canvas()
    ctx.save(); fn(ctx, t); ctx.restore()
    return surf_to_arr(surf)

def illustration(t):
    act = active_scenes(t)
    arr = None
    for (t0, t1, fn, fade) in act:
        a = render_scene(fn, t)
        if arr is None:
            arr = a
        else:
            w = sstep(t0, t0 + fade, t) if fade > 0 else 1.0
            arr = arr * (1 - w) + a * w
    return finish(arr, saturation(t))

def photo_frame(t):
    surf, ctx = new_canvas()
    ps, (pw, ph) = photo_surface()
    iw = 880; ih = iw * ph / pw
    cx, cy = 540, 1185
    x0, y0 = cx - iw / 2, cy - ih / 2
    b = 22
    ctx.set_source_rgba(0.2, 0.18, 0.25, 0.18)
    ctx.rectangle(x0 - b + 10, y0 - b + 14, iw + 2 * b, ih + 2 * b); ctx.fill()
    ctx.set_source_rgb(*hexc('F8F1E2'))
    ctx.rectangle(x0 - b, y0 - b, iw + 2 * b, ih + 2 * b); ctx.fill()
    k = clamp((t - PHOTO_IN) / (END - PHOTO_IN))
    zoom = 1.0 + 0.035 * ease_io(k)
    dx = 10 * k; dy = -6 * k
    ctx.save()
    ctx.rectangle(x0, y0, iw, ih); ctx.clip()
    ctx.translate(cx + dx, cy + dy)
    sc = iw / pw * zoom
    ctx.scale(sc, sc)
    ctx.translate(-pw / 2, -ph / 2)
    ctx.set_source_surface(ps, 0, 0)
    ctx.get_source().set_filter(cairo.FILTER_GOOD)
    ctx.paint()
    ctx.restore()
    a = surf_to_arr(surf)
    tx = textures()
    # keep the photograph itself untextured; only vignette the page
    return a * tx['vig']

# ------------------------------------------------------------------ captions
def cap_layout(i):
    if i in _CAP:
        return _CAP[i]
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, 10, 10); c = cairo.Context(s)
    text = CAPTIONS[i]
    size = 68
    while True:
        lines = wrap_lines(c, text, size, 960)
        lh = size * 1.18
        if len(lines) * lh <= 350 or size <= 40:
            break
        size -= 2
    _CAP[i] = (lines, size, lh)
    return _CAP[i]

def draw_caption(ctx, i, t, alpha):
    lines, size, lh = cap_layout(i)
    n = len(lines)
    total_h = n * lh
    ytop = 265 - total_h / 2 + size * 0.82
    start = N[i][0] - 0.12 if i > 0 else 0.0
    R = min(0.65, 0.16 * n + 0.2)
    for j, ln in enumerate(lines):
        y = ytop + j * lh
        k = clamp((t - start - j * R / n) / (R / n)) if i > 0 else clamp((t - start - j * 0.12) / 0.12)
        if k <= 0: continue
        adv = text_extent(ctx, ln, size)[0]
        ctx.save()
        ctx.rectangle(540 - adv / 2 - 20, y - size * 1.2, (adv + 40) * k, size * 1.7)
        ctx.clip()
        draw_text(ctx, ln, 540 + 0.6 * math.sin(int(t * 8) * 1.7 + j), y, size, col=INK, alpha=alpha)
        ctx.restore()

def draw_final_caption(ctx, t, alpha):
    a1 = sstep(97.3, 97.6, t)
    a2 = sstep(98.72, 98.95, t)
    if a1 > 0:
        adv = text_extent(ctx, 'İnanması güç ama', 72, bold=False)[0]
        k = clamp((t - 97.3) / 0.45)
        ctx.save(); ctx.rectangle(540 - adv / 2 - 20, 120, (adv + 40) * k, 120); ctx.clip()
        draw_text(ctx, 'İnanması güç ama', 540, 210, 72, col=mix(INK, PAPER, 0.38), bold=False, alpha=alpha * a1)
        ctx.restore()
    if a2 > 0:
        adv = text_extent(ctx, 'bu gerçekten yaşandı.', 90, bold=True)[0]
        k = clamp((t - 98.72) / 0.55)
        ctx.save(); ctx.rectangle(540 - adv / 2 - 20, 240, (adv + 40) * k, 140); ctx.clip()
        draw_text(ctx, 'bu gerçekten yaşandı.', 540 + 1.5, 330 + 1.5, 90, col=PAPER, bold=True, alpha=alpha * a2 * 0.5)
        draw_text(ctx, 'bu gerçekten yaşandı.', 540, 330, 90, col=hexc('1C1B45'), bold=True, alpha=alpha * a2)
        ctx.restore()

def overlay(arr, t):
    surf = arr_to_surface(arr)
    ctx = cairo.Context(surf)
    if t < 97.0:
        for i in range(17):
            st = N[i][0] - 0.12 if i > 0 else 0.0
            en = N[i + 1][0] - 0.18
            if st <= t < en:
                a = min(clamp((en - t) / 0.15), 1.0)
                draw_caption(ctx, i, t, a)
    if 97.0 <= t < PHOTO_FULL:
        draw_final_caption(ctx, t, 1 - sstep(PHOTO_IN, PHOTO_IN + 0.6, t))
    if t >= PHOTO_IN + 0.7:
        a = sstep(PHOTO_IN + 0.7, PHOTO_IN + 1.2, t)
        draw_text(ctx, 'Operasyonun gerçek görüntüsü', 540, 300, 62, col=INK, alpha=a)
    draw_text(ctx, '@bugercektenyasandi', 1040, 1872, 38, col=INK, bold=False, align='right', alpha=0.72)
    return surf_to_arr(surf)

def frame(t):
    if t < PHOTO_IN:
        arr = illustration(t)
    elif t < PHOTO_FULL:
        il = illustration(t)
        g = il[..., 0:1] * 0.11 + il[..., 1:2] * 0.59 + il[..., 2:3] * 0.30
        k = sstep(PHOTO_IN, PHOTO_IN + 0.35, t)
        il = il + (g - il) * 0.6 * k
        ph = photo_frame(t)
        w = sstep(PHOTO_IN + 0.2, PHOTO_FULL, t)
        arr = il * (1 - w) + ph * w
    else:
        arr = photo_frame(t)
    tx = textures()
    m = band_mask()
    paper = tx['paper'] * tx['vig']
    if t < PHOTO_FULL:
        arr = arr * (1 - m) + paper * m
    elif t < PHOTO_FULL + 0.01:
        pass
    arr = overlay(arr, t)
    if t > FADE_OUT:
        k = sstep(FADE_OUT, END - 0.05, t)
        arr = arr * (1 - k) + paper * k
    return arr

def frame_bytes(i):
    t = i / FPS
    a = frame(t)
    return (np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes()

if __name__ == '__main__':
    if sys.argv[1] == 'still':
        d = sys.argv[2]; os.makedirs(d, exist_ok=True)
        for ts in sys.argv[3:]:
            t = float(ts)
            a = frame(t)
            Image.fromarray((np.clip(a, 0, 1)[..., ::-1] * 255).astype(np.uint8)).resize((540, 960)).save(f'{d}/s_{t:06.2f}.png')
    elif sys.argv[1] == 'video':
        from multiprocessing import Pool
        out = sys.argv[2]
        n = int(END * FPS)
        start = int(float(sys.argv[3]) * FPS) if len(sys.argv) > 3 else 0
        stop = int(float(sys.argv[4]) * FPS) if len(sys.argv) > 4 else n
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                               '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
                               '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        with Pool(4) as pool:
            for k, b in enumerate(pool.imap(frame_bytes, range(start, stop), chunksize=3)):
                ff.stdin.write(b)
                if k % 150 == 0: print('frame', start + k, flush=True)
        ff.stdin.close(); ff.wait()
