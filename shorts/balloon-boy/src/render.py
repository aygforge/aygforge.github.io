import sys, subprocess, time
from scenes import *

CAP_TOP, CAP_BOT = 64, 446       # caption band: upper ~23% of 1920
CAP_W = 968

_layout_cache = {}

def layout_caption(i):
    if i in _layout_cache:
        return _layout_cache[i]
    s = SENTS[i]
    words = s.split(' ')
    # highlight spans
    marks = [False] * len(s)
    for ph in HILITE[i]:
        k = s.find(ph)
        assert k >= 0, (i, ph)
        for j in range(k, k + len(ph)):
            marks[j] = True
    wmark = []
    pos = 0
    for w in words:
        wmark.append(any(marks[pos:pos + len(w)]))
        pos += len(w) + 1
    for size in range(76, 38, -2):
        f = font('kalamb', size)
        sp = f.measureText(' ')
        lines = []
        cur = []; cw = 0
        for wi, w in enumerate(words):
            ww = f.measureText(w)
            if cur and cw + sp + ww > CAP_W:
                lines.append((cur, cw)); cur = [wi]; cw = ww
            else:
                cw = ww if not cur else cw + sp + ww
                cur.append(wi)
        if cur:
            lines.append((cur, cw))
        lh = size * 1.22
        if len(lines) * lh <= (CAP_BOT - CAP_TOP) and len(lines) <= 5:
            break
    # sanity: rebuilt text must be identical to the narration sentence
    rebuilt = ' '.join(' '.join(words[j] for j in ln) for ln, _ in lines)
    assert rebuilt == s, (rebuilt, s)
    res = (f, size, lh, lines, words, wmark)
    _layout_cache[i] = res
    return res

def caption_band(d, a):
    d.gradient_rect(skia.Rect(0, 0, W, 560), [CREAM, CREAM, CREAM], a, pos=None)
    # replace with alpha gradient

def draw_band(d, a=1.0):
    pts = [skia.Point(0, 0), skia.Point(0, 590)]
    cols = [hexc(CREAM, 0.93 * a), hexc(CREAM, 0.86 * a), hexc(CREAM, 0.0)]
    sh = skia.GradientShader.MakeLinear(pts, cols, [0.0, 0.70, 1.0])
    d.c.drawRect(skia.Rect(0, 0, W, 590), skia.Paint(Shader=sh))

def draw_caption(d, i, a, rise):
    f, size, lh, lines, words, wmark = layout_caption(i)
    total = len(lines) * lh
    y = CAP_TOP + (CAP_BOT - CAP_TOP - total) / 2 + size * 0.95 + rise
    sp = f.measureText(' ')
    r = random.Random(i)
    for li, (ln, lw) in enumerate(lines):
        x = (W - lw) / 2
        d.c.save()
        d.c.translate(W / 2, y); d.c.rotate(r.uniform(-0.8, 0.8)); d.c.translate(-W / 2, -y)
        for wi in ln:
            w = words[wi]
            col = RED if wmark[wi] else INK
            d.text(w, x, y, f, col, a, stroke=CREAM, sw=12)
            x += f.measureText(w) + sp
        d.c.restore()
        y += lh

def captions(d, t):
    # which sentence (shown from its onset until the next one begins)
    if t >= STARTS[9] - 0.12:
        return final_text(d, t)
    idx = 0
    for i in range(9):
        if t >= STARTS[i] - 0.12:
            idx = i
    on = STARTS[idx] - 0.12
    nxt = STARTS[idx + 1] - 0.12
    a_in = 1.0 if idx == 0 else ease((t - on) / 0.22)
    a_out = 1.0 - ease((t - (nxt - 0.16)) / 0.16)
    a = min(a_in, a_out)
    draw_band(d, 1.0)
    draw_caption(d, idx, a, (1 - a_in) * 14)

def final_text(d, t):
    draw_band(d, 1.0)
    f1 = font('kalam', 74)
    f2 = font('kalamb', 104)
    a1 = ease((t - (STARTS[9] - 0.12)) / 0.3)
    t2 = 62.85
    a2 = ease((t - (t2 - 0.1)) / 0.3)
    d.text('İnanması güç ama', W / 2, 205 + (1 - a1) * 12, f1, '#6F6A92', a1, align='center', stroke=CREAM, sw=12)
    s2 = 1.0 + 0.12 * (1 - eout((t - (t2 - 0.1)) / 0.45))
    d.c.save(); d.c.translate(W / 2, 330); d.c.scale(s2, s2); d.c.translate(-W / 2, -330)
    # darker + bolder: draw ink twice with slight offset for heavy pencil weight
    d.text('bu gerçekten yaşandı.', W / 2 + 1.5, 330 + 1.0, f2, '#16132E', a2, align='center', stroke=CREAM, sw=14)
    d.text('bu gerçekten yaşandı.', W / 2, 330, f2, '#16132E', a2, align='center')
    # hand-drawn underline
    k = eout((t - (t2 + 0.5)) / 0.6)
    if k > 0:
        x0 = W / 2 - 330
        d.line([(x0 + i * 660 * k / 10, 362 + math.sin(i * 0.9) * 3) for i in range(11)], 6, RED, 0.85 * a2, rough=1.2)
    d.c.restore()

def watermark(d, t):
    a = 0.78 if t < SB[9] else lerp(0.78, 1.0, prog(t, SB[9], SB[9] + 1))
    f = font('kalamb', 40)
    d.text('@bugercektenyasandi', W - 44, H - 64, f, INK, a, align='right', stroke=CREAM, sw=8)

def scene_at(d, i, t):
    lt = t - SB[i]
    SCENES[i](d, lt)

def draw_frame(d, t):
    d.begin(t)
    i = max(k for k in range(10) if SB[k] <= t) if t >= 0 else 0
    i = min(i, 9)
    drawn = False
    # transition into scene i (just started)
    if i in TRANS and TRANS[i][0] == 'fade':
        dur = TRANS[i][1]
        if t < SB[i] + dur / 2:
            scene_at(d, i - 1, t)
            a = prog(t, SB[i] - dur / 2, SB[i] + dur / 2)
            with_alpha(d, ease(a), scene_at, d, i, t)
            drawn = True
    if not drawn and (i + 1) in TRANS and TRANS[i + 1][0] == 'fade':
        dur = TRANS[i + 1][1]
        if t > SB[i + 1] - dur / 2:
            scene_at(d, i, t)
            a = prog(t, SB[i + 1] - dur / 2, SB[i + 1] + dur / 2)
            with_alpha(d, ease(a), scene_at, d, i + 1, t)
            drawn = True
    if not drawn:
        scene_at(d, i, t)
    captions(d, t)
    watermark(d, t)
    d.paper_overlay(0.9)

def render_range(f0, f1, out):
    d = Ctx()
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-g', '60', out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    for fr in range(f0, f1):
        draw_frame(d, fr / FPS)
        p.stdin.write(d.surf.toarray().tobytes())
        if (fr - f0) % 60 == 0:
            print(out, fr, f'{time.time() - t0:.1f}s', flush=True)
    p.stdin.close(); p.wait()

def stills(times, out):
    d = Ctx()
    for tt in times:
        draw_frame(d, tt)
        d.surf.makeImageSnapshot().save(f'{out}_{tt:05.2f}.png')

if __name__ == '__main__':
    if sys.argv[1] == 'stills':
        stills([float(x) for x in sys.argv[3:]], sys.argv[2])
    else:
        render_range(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
