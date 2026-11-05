import numpy as np, subprocess, json, sys
from scipy.signal import butter, sosfilt, sosfiltfilt, fftconvolve

SR = 48000
TOTAL = float(sys.argv[1]) if len(sys.argv) > 1 else 86.3
N = int(TOTAL * SR)
rng = np.random.default_rng(42)

SENT = [(0.00, 4.37), (5.00, 12.26), (13.03, 20.27), (20.96, 26.40), (27.04, 33.30), (34.05, 38.03), (38.70, 45.68),
        (46.53, 51.38), (52.18, 60.15), (61.09, 70.99), (71.97, 78.12), (78.91, 82.16)]
BOUNDS = [0.0] + [(SENT[i][1] + SENT[i + 1][0]) / 2 for i in range(11)] + [TOTAL]
DENSE = {1, 2, 8, 9}
FULLER = {5, 6}

def db(x): return 10 ** (x / 20)

# ------------------------------------------------ load
narr = np.fromfile('narr48.f32', np.float32).astype(np.float64)
mus = np.fromfile('music48.f32', np.float32).astype(np.float64).reshape(-1, 2)
narr_full = np.zeros(N); narr_full[:min(N, len(narr))] = narr[:N]
assert len(narr) <= N, 'video shorter than narration!'

# narration: gain only (-17.8 LUFS -> -16 LUFS), no edits, no speed change
NARR_GAIN = db(1.8)
narr_full *= NARR_GAIN

# ------------------------------------------------ music edit: 15-bar splice so the real ending lands after the last word
DELTA = 32.73
SPLICE = 60.30
XF = 0.6
t = np.arange(N) / SR
def mus_at(times):
    idx = np.clip((times * SR).astype(np.int64), 0, len(mus) - 1)
    out = mus[idx].copy()
    out[(times * SR).astype(np.int64) >= len(mus)] = 0
    return out
a = mus_at(t)
b = mus_at(t + DELTA)
u = np.clip((t - (SPLICE - XF / 2)) / XF, 0, 1)
ga = np.cos(u * np.pi / 2); gb = np.sin(u * np.pi / 2)
music = a * ga[:, None] + b * gb[:, None]
# slow boost-only leveler: keep the bed audible through the song's softer intro
from scipy.signal import lfilter
def _kw(x):
    b1=[1.53512485958697,-2.69169618940638,1.19839281085285]; a1=[1,-1.69065929318241,0.73248077421585]
    b2=[1.0,-2.0,1.0]; a2=[1,-1.99004745483398,0.99007225036621]
    return lfilter(b2,a2,lfilter(b1,a1,x,axis=0),axis=0)
_k = _kw(music)
_pw = (_k ** 2).sum(1)
_hop = SR // 10
_blocks = np.array([_pw[i:i + 3 * SR].mean() for i in range(0, N, _hop)])
_st = -0.691 + 10 * np.log10(_blocks + 1e-12)
_valid = _st > -40
_target = np.median(_st[_valid])
_corr = np.clip(_target - _st, 0, 5.0); _corr[~_valid] = 0
_corr = np.convolve(_corr, np.ones(15) / 15, 'same')
_lev = db(np.interp(np.arange(N), np.arange(len(_corr)) * _hop + 1.5 * SR, _corr))
music *= _lev[:, None]
print('leveler max boost dB', _corr.max())
# soft tail fade at the very end
tail = np.clip((TOTAL - t) / 0.5, 0, 1)
music *= tail[:, None]

# ------------------------------------------------ speech activity
w = int(0.03 * SR)
env = np.sqrt(np.convolve(narr_full ** 2, np.ones(w) / w, 'same'))
speech = (20 * np.log10(env + 1e-9) > -40).astype(np.float64)
k = int(0.15 * SR)
speech = np.convolve(speech, np.ones(2 * k + 1), 'same') > 0

# target music level (fraction "perceived volume")
p = np.where(speech, 0.28, 0.34)
for i, (s0, s1) in enumerate(SENT):
    m = (t >= s0) & (t <= s1) & speech
    if i in DENSE: p[m] = 0.235
    if i in FULLER: p[m] = 0.29
    if i == 0: p[m] = 0.32
p[t > SENT[-1][1] + 0.1] = 0.40          # full but controlled ending
p[t < 0.35] = np.maximum(p[t < 0.35], 0.31)   # quirky hook on the first frame
# smooth: fast-ish duck, slower release
def smooth(x, att, rel):
    y = np.empty_like(x); v = x[0]
    aa = np.exp(-1 / (att * SR)); ar = np.exp(-1 / (rel * SR))
    for i in range(len(x)):
        c = aa if x[i] < v else ar
        v = c * v + (1 - c) * x[i]; y[i] = v
    return y
# do the smoothing at 1 kHz control rate for speed
step = 48
pc = p[::step]
SRc = SR / step
def smooth_c(x, att, rel):
    y = np.empty_like(x); v = x[0]
    aa = np.exp(-1 / (att * SRc)); ar = np.exp(-1 / (rel * SRc))
    for i in range(len(x)):
        c = aa if x[i] < v else ar
        v = c * v + (1 - c) * x[i]; y[i] = v
    return y
pc = smooth_c(pc, 0.16, 0.45)
pc = smooth_c(pc[::-1], 0.05, 0.05)[::-1]   # tiny symmetric smoothing to remove corners
p_s = np.interp(np.arange(N), np.arange(len(pc)) * step, pc)

# music loudness -14.9 LUFS, narration (after gain) -16 LUFS; map p -> dB below narration, +1 dB so it is never buried
MUS_REF = db(-13.0 - (-14.9))   # narration is mono duplicated to stereo (+3 LU)
music_gain = MUS_REF * p_s * db(1.0)
# speech-band carve (1-4 kHz) only while talking, keeps words clear without lowering the whole bed
sos = butter(2, [1000, 4000], 'bandpass', fs=SR, output='sos')
band = sosfiltfilt(sos, music, axis=0)
carve = np.interp(np.arange(N), np.arange(len(pc)) * step, smooth_c(speech[::step].astype(float), 0.12, 0.35))
music_out = (music - band * (0.3 * carve)[:, None]) * music_gain[:, None]

# ------------------------------------------------ SFX synthesis
sfx = np.zeros((N, 2))
def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'highpass', fs=SR, output='sos'), x)
def noise(sec): return rng.standard_normal(int(sec * SR))
def place(sig, at, gain_db, pan=0.0, fade=0.01):
    n0 = int(at * SR)
    if n0 >= N: return
    sig = sig[:N - n0].copy()
    f = int(fade * SR)
    if f > 0 and len(sig) > 2 * f:
        sig[:f] *= np.linspace(0, 1, f); sig[-f:] *= np.linspace(1, 0, f)
    g = db(gain_db)
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    sfx[n0:n0 + len(sig), 0] += sig * g * l * 1.414
    sfx[n0:n0 + len(sig), 1] += sig * g * r * 1.414
def norm(x):
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-12)   # RMS = 1 -> gain_db is RMS dBFS
def window(sig, t0, t1, fade=0.5):
    n = len(sig); tt = np.arange(n) / SR
    e = np.clip(tt / fade, 0, 1) * np.clip(((t1 - t0) - tt) / fade, 0, 1)
    return sig * e

def traffic(sec, seed=0):
    r = np.random.default_rng(seed)
    br = np.cumsum(r.standard_normal(int(sec * SR))); br = hp(br, 25); br = lp(br, 380)
    br = norm(br)
    tt = np.arange(len(br)) / SR
    br *= 0.8 + 0.2 * np.sin(tt * 0.7 + seed)
    out = br * 0.6
    tp = r.uniform(0.3, 1.5)
    while tp < sec - 1:
        L = r.uniform(1.4, 2.4)
        n = norm(bp(r.standard_normal(int(L * SR)), 150, 1400))
        e = np.sin(np.linspace(0, np.pi, len(n))) ** 2
        i0 = int(tp * SR); seg = n * e * r.uniform(0.5, 1.0)
        out[i0:i0 + len(seg)] += seg[:len(out) - i0]
        tp += r.uniform(1.6, 3.5)
    return norm(out)

def hum(sec, f0=120):
    tt = np.arange(int(sec * SR)) / SR
    x = sum(np.sin(2 * np.pi * f0 * h * tt + h) / h for h in range(1, 8))
    x = lp(x, 900) + 0.08 * np.sin(2 * np.pi * 7900 * tt)
    x *= 0.85 + 0.15 * np.sin(2 * np.pi * 3.1 * tt)
    return norm(x)

def click(strength=1.0):
    n = np.zeros(int(0.03 * SR)); n[0] = 1; n[1] = -0.6
    x = bp(n, 1800, 7000, 2) * 3 + lp(n, 400) * 1.2
    x += bp(rng.standard_normal(len(n)), 2000, 8000) * np.exp(-np.arange(len(n)) / (0.002 * SR)) * 0.3
    return x / np.max(np.abs(x)) * strength

def radio(sec=1.3, seed=0):
    r = np.random.default_rng(seed + 100)
    n = int(sec * SR); tt = np.arange(n) / SR
    sq = bp(r.standard_normal(int(0.18 * SR)), 600, 4000) * np.exp(-np.arange(int(0.18 * SR)) / (0.06 * SR))
    # garbled, word-less modulation
    syl = np.zeros(n); p = 0.2
    while p < sec - 0.25:
        L = r.uniform(0.08, 0.22); i0 = int(p * SR); i1 = min(n, int((p + L) * SR))
        syl[i0:i1] = np.sin(np.linspace(0, np.pi, i1 - i0)) * r.uniform(0.5, 1); p += L + r.uniform(0.02, 0.12)
    carrier = bp(r.standard_normal(n), 350, 2600) + 0.6 * np.sin(2 * np.pi * (180 + 40 * np.sin(tt * 9)) * tt)
    g = np.tanh(3 * bp(carrier * syl, 400, 2800)) * 0.7
    out = np.zeros(n + len(sq)); out[:len(sq)] += sq * 1.2
    out[:n] += g + 0.15 * bp(r.standard_normal(n), 800, 5000)
    out[n - int(0.1 * SR):n - int(0.1 * SR) + len(sq)] += sq * 0.8
    return norm(out)

def reverb(x, dec=0.8, mix=0.35):
    L = int(dec * SR); ir = rng.standard_normal(L) * np.exp(-np.arange(L) / (dec * SR / 5)); ir /= np.sqrt(np.sum(ir ** 2))
    return (1 - mix) * x + mix * fftconvolve(x, ir)[:len(x)]

def siren(sec, seed=0):
    tt = np.arange(int(sec * SR)) / SR
    f = 950 + 380 * np.sin(2 * np.pi * tt / 3.2 + seed)
    ph = 2 * np.cumsum(np.pi * f / SR)
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    x = lp(x, 1600)
    x = reverb(x, 1.2, 0.5)
    e = np.clip(tt / 1.0, 0, 1) * np.clip((sec - tt) / 1.2, 0, 1)
    return norm(x * e)

def clunk():
    n = int(0.6 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 85 * tt) * np.exp(-tt / 0.08) * 1.4
    x += lp(rng.standard_normal(n), 900) * np.exp(-tt / 0.03)
    for f_, d_ in ((430, 0.18), (1170, 0.12), (2230, 0.08)):
        x += 0.25 * np.sin(2 * np.pi * f_ * tt) * np.exp(-tt / d_)
    return norm(reverb(x, 0.5, 0.25))

def rustle(sec=0.45, seed=0):
    r = np.random.default_rng(seed + 300)
    n = int(sec * SR)
    x = bp(r.standard_normal(n), 900, 9000)
    cr = np.abs(r.standard_normal(n)) ** 3; cr = np.convolve(cr, np.ones(200) / 200, 'same')
    e = np.sin(np.linspace(0, np.pi, n)) ** 0.7
    return norm(x * (0.4 + cr) * e)

def whoosh(sec=0.55):
    n = int(sec * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n); ch = int(0.02 * SR)
    for i0 in range(0, n, ch):
        fc = 300 + 3500 * (i0 / n) ** 1.5
        out[i0:i0 + ch] = lp(x[max(0, i0 - 2000):i0 + ch], fc)[-len(x[i0:i0 + ch]):]
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return norm(out * e)

def impact():
    n = int(1.6 * SR); tt = np.arange(n) / SR
    f = 62 * np.exp(-tt * 1.2) + 34
    x = np.sin(2 * np.cumsum(np.pi * f / SR)) * np.exp(-tt / 0.35) * 1.5
    x += lp(rng.standard_normal(n), 700) * np.exp(-tt / 0.12) * 0.9
    x += bp(rng.standard_normal(n), 1500, 6000) * np.exp(-tt / 0.05) * 0.25
    return norm(reverb(x, 1.4, 0.35))

def murmur(sec, seed=0):
    r = np.random.default_rng(seed + 500)
    n = int(sec * SR); out = np.zeros(n)
    for v in range(7):
        syl = np.zeros(n); p_ = r.uniform(0, 0.5)
        while p_ < sec:
            L = r.uniform(0.1, 0.3); i0 = int(p_ * SR); i1 = min(n, int((p_ + L) * SR))
            syl[i0:i1] = np.sin(np.linspace(0, np.pi, i1 - i0)); p_ += L + r.uniform(0.05, 0.6)
        lo = r.uniform(250, 450)
        out += bp(r.standard_normal(n), lo, lo * 3) * syl
    out = lp(out, 1500)
    # keyboard clicks
    p_ = 0.0
    while p_ < sec - 0.05:
        c = click(r.uniform(0.15, 0.3)); i0 = int(p_ * SR)
        out[i0:i0 + len(c)] += c[:n - i0] * 0.15
        p_ += r.uniform(0.07, 0.35) if r.random() > 0.1 else r.uniform(0.8, 1.6)
    return norm(reverb(out, 0.6, 0.3))

def scribble(sec=0.8, seed=0):
    r = np.random.default_rng(seed + 700)
    n = int(sec * SR); tt = np.arange(n) / SR
    x = bp(r.standard_normal(n), 2500, 8000)
    e = (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * (7 + 3 * np.sin(tt * 5)) * tt))) * np.sin(np.linspace(0, np.pi, n)) ** 0.5
    return norm(x * e)

def stamp():
    n = int(0.5 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 110 * tt) * np.exp(-tt / 0.05) * 1.3 + bp(rng.standard_normal(n), 300, 3000) * np.exp(-tt / 0.025)
    return norm(reverb(x, 0.4, 0.2))

def heli(sec):
    n = int(sec * SR); tt = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 420)
    chop = (0.5 + 0.5 * np.sin(2 * np.pi * 13.5 * tt)) ** 4
    x = x * (0.25 + chop) + 0.4 * np.sin(2 * np.pi * 54 * tt) * chop
    e = np.clip(tt / 1.0, 0, 1) * np.clip((sec - tt) / 1.0, 0, 1)
    return norm(lp(x, 600) * e)

def blip(f=1250, sec=0.12):
    tt = np.arange(int(sec * SR)) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.03) + 0.3 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt / 0.015))

def train_move(sec):
    n = int(sec * SR); tt = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 220) * 1.2
    p_ = 0.1
    while p_ < sec - 0.1:
        for off in (0, 0.13):
            i0 = int((p_ + off) * SR); cl = bp(rng.standard_normal(int(0.04 * SR)), 300, 2500) * np.exp(-np.arange(int(0.04 * SR)) / (0.008 * SR)) * 3
            x[i0:i0 + len(cl)] += cl[:n - i0]
        p_ += 0.62
    e = np.clip(tt / 0.6, 0, 1) * np.clip((sec - tt) / 0.6, 0, 1)
    return norm(x * e)

def idle_train(sec):
    tt = np.arange(int(sec * SR)) / SR
    x = sum(np.sin(2 * np.pi * 60 * h * tt) / h ** 1.3 for h in range(1, 6)) * 0.5 + lp(rng.standard_normal(len(tt)), 300)
    return norm(reverb(x, 0.9, 0.4))

def shutter():
    a_ = click(1.0); b_ = click(0.7)
    out = np.zeros(int(0.12 * SR)); out[:len(a_)] += a_; out[int(0.06 * SR):int(0.06 * SR) + len(b_)] += b_
    return norm(out)

# --------------- placement (RMS dBFS levels; narration speech RMS is ~ -19 dBFS)
B = BOUNDS
# ambience beds per outdoor scene
for (t0, t1, lvl, sd) in [(0.0, B[1] + 0.3, -36, 1), (B[1] - 0.3, B[2] + 0.3, -41, 2), (B[3] - 0.3, B[4] + 0.3, -37, 3), (B[4] - 0.3, B[5] + 0.3, -36, 4),
                          (B[6] - 0.3, B[6] + 2.3, -37, 5), (B[6] + 4.0, B[7] + 0.3, -40, 6), (B[7] - 0.3, B[8] + 0.3, -39, 7),
                          (B[10] - 0.3, B[11] + 0.3, -40, 8), (B[11] - 0.3, TOTAL, -40, 9)]:
    place(window(traffic(t1 - t0, sd), t0, t1, 0.4), t0, lvl, 0.0)
# LED hum close to the boards
for (t0, t1, lvl) in [(0.0, B[1] + 0.2, -44), (B[7], B[8], -46), (B[11], TOTAL, -46)]:
    place(window(hum(t1 - t0), t0, t1, 0.3), t0, lvl, 0.1)
# first-frame switch-on + LED reveal clicks
place(click(1.0), 0.0, -26, 0.1)
place(click(0.7), 1.45, -30, 0.3)              # callout on the batteries
place(click(0.8), B[3] + 1.6, -29, 0.0)        # zoom onto wires/batteries (scene 4)
for k in range(10):                             # LEDs being pressed in (scene 3)
    place(click(0.5), B[2] + 4.4 + k * 0.33, -36, 0.2)
# police radio
for (at, sec, pan, sd) in [(0.7, 1.2, -0.3, 1), (B[3] + 4.7, 1.5, 0.2, 2), (B[4] + 0.4, 1.1, -0.2, 3), (B[5] + 0.3, 1.0, 0.3, 4),
                           (B[5] + 1.7, 1.0, -0.4, 5), (B[5] + 3.0, 0.9, 0.4, 6), (B[6] + 0.9, 1.0, 0.2, 7), (B[8] + 6.2, 1.0, 0.3, 8), (B[10] + 1.5, 1.0, -0.3, 9)]:
    place(radio(sec, sd), at, -33, pan)
# distant emergency vehicles - brief only
for (at, sec, lvl) in [(0.0, 3.6, -40), (B[4] - 0.2, 3.4, -40), (B[6] + 4.4, 3.4, -41), (B[8] + 5.6, 3.0, -40), (B[10] + 1.6, 3.8, -44)]:
    place(siren(sec), at, lvl, 0.35)
# road barriers
place(clunk(), B[6] + 0.55, -29, 0.4); place(clunk(), B[6] + 0.72, -31, 0.55)
place(clunk(), B[8] + 6.3, -33, 0.2); place(clunk(), B[10] + 2.4, -36, -0.2)
# paper movement
for i in range(1, 12):
    place(whoosh(0.55), B[i] - 0.3, -37, 0.0)
place(rustle(0.5, 1), B[2] + 1.95, -31, 0.4)                         # poster slides in
for i in range(6): place(rustle(0.25, 10 + i), B[7] + 0.95 + i * 0.17, -32, 0.1)   # calendar flips
for i in range(6): place(rustle(0.2, 20 + i), B[7] + 2.6 + i * 0.45, -38, 0.1)
for (at, sd) in [(B[9] + 1.0, 30), (B[9] + 2.6, 31), (B[9] + 4.4, 32), (B[9] + 6.5, 33), (B[9] + 6.7, 34)]:
    place(rustle(0.45, sd), at, -31, 0.0)
place(scribble(0.9, 1), B[9] + 5.45, -36, 0.1); place(scribble(0.6, 2), B[9] + 7.25, -37, -0.2); place(scribble(0.6, 3), B[9] + 7.55, -37, 0.2)
place(stamp(), B[9] + 9.0, -28, -0.2); place(stamp(), B[9] + 9.4, -27, 0.2)
for i in range(10): place(rustle(0.12, 40 + i), B[9] + 7.9 + i * 0.14, -36, -0.3 + i * 0.06)   # bills riffle (2M accent)
place(blip(880, 0.2), B[9] + 8.0, -34, 0.0)
# controlled disposal (stylized, not an explosion)
place(impact(), B[4] + 5.0, -21, 0.0)
# newsroom ambience
place(window(murmur(B[10] - B[9] + 0.4, 1), B[9] - 0.2, B[10] + 0.2, 0.6), B[9] - 0.2, -42, 0.0)
place(window(murmur(B[11] - B[10], 2), B[10], B[11], 0.6), B[10], -45, 0.0)
# trains
place(train_move(2.0), B[1] + 3.98, -37, -0.3)
place(window(idle_train(2.4), 0, 2.4, 0.4), B[6] + 1.8, -39, 0.0)
# helicopter
place(heli(3.0), B[6] + 4.6, -40, 0.5); place(heli(3.0), B[8] + 5.8, -40, -0.3); place(heli(4.0), B[10] + 2.5, -44, 0.4)
# map signal blips (more devices / other cities)
PINS_T = [0.15, 0.9, 1.55, 1.7, 2.25, 2.4, 2.55, 2.7, 2.85, 3.0, 3.1, 3.2, 3.3, 3.4]
for i, pt in enumerate(PINS_T): place(blip(1150 + 60 * (i % 4)), B[5] + pt, -36, -0.5 + (i % 5) * 0.25)
for i in range(10): place(blip(980), B[8] + 1.9 + i * 0.25, -39, -0.6 + i * 0.12)
# news camera shutters
for at in (B[10] + 3.0, B[10] + 3.4, B[10] + 4.6): place(shutter(), at, -38, 0.3)

# SFX sit under narration: duck a bit while talking
sfx_duck = 1 - 0.3 * carve
sfx *= sfx_duck[:, None]

mix = music_out + sfx + narr_full[:, None]
np.save('mix_raw.npy', mix.astype(np.float32))
# stem levels for report
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
sp = speech
print('narr rms (speech)', rms_db(narr_full[sp]), 'music rms (speech)', rms_db(music_out[sp]), 'music rms (pauses)', rms_db(music_out[~sp & (t < 82)]), 'sfx rms', rms_db(sfx))
from scipy.io import wavfile
wavfile.write('mix_raw.wav', SR, mix.astype(np.float32))
wavfile.write('stem_music.wav', SR, music_out.astype(np.float32))
wavfile.write('stem_narr.wav', SR, np.repeat(narr_full[:, None], 2, 1).astype(np.float32))
wavfile.write('stem_sfx.wav', SR, sfx.astype(np.float32))
print('peak', np.max(np.abs(mix)), 'narr peak', np.max(np.abs(narr_full)))
