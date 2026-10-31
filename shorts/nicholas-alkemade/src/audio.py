import numpy as np, wave, sys
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 67.8
N = int(SR * DUR)
A = sys.argv[1]  # audio dir
rng = np.random.default_rng(7)

def readwav(p):
    w = wave.open(p); ch = w.getnchannels(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return x.reshape(-1, ch)

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def tt(n=N): return np.arange(n) / SR
def env(points, n=N):
    """piecewise-linear envelope from [(t, gain_linear), ...]"""
    ts, gs = zip(*points); return np.interp(tt(n), ts, gs).astype(np.float32)
def db(d): return 10 ** (d / 20)
def smooth_noise(rate, n=N, seed=0):
    r = np.random.default_rng(seed); k = int(DUR * rate) + 3
    return np.interp(tt(n), np.linspace(0, DUR, k), r.random(k)).astype(np.float32)
def norm(x): return x / (np.sqrt(np.mean(x ** 2)) + 1e-9)

def place(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if j <= i: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += sig[:j - i] * gain * l * 1.414; buf[i:j, 1] += sig[:j - i] * gain * r * 1.414

out = np.zeros((N, 2), np.float32)

# ---------- wind beds ----------
def wind(seed, lo, hi, gust_rate, n=N):
    w = norm(bp(rng.standard_normal(n), lo, hi)); g = 0.55 + 0.45 * smooth_noise(gust_rate, n, seed)
    whistle = norm(bp(rng.standard_normal(n), hi * 0.7, hi * 0.75, 2)) * 0.25 * smooth_noise(gust_rate * 1.7, n, seed + 1)
    return (w * g + whistle).astype(np.float32)
wL, wR = wind(1, 180, 1100, 0.6), wind(2, 160, 1000, 0.55)
high_wind = env([(0, db(-27)), (8.4, db(-26)), (9.0, db(-34)), (16.3, db(-36)), (21.2, db(-60)), (27.9, db(-60)), (31.8, db(-48)), (33.4, db(-34)), (34.2, db(-30)), (36.0, db(-29)), (40.6, db(-40)), (41.5, db(-60))])
out[:, 0] += wL * high_wind; out[:, 1] += wR * high_wind

# strong free fall wind (roaring, fluttering)
fL = norm(bp(rng.standard_normal(N), 90, 2600)); fR = norm(bp(rng.standard_normal(N), 90, 2600))
flutter = 0.7 + 0.3 * np.sin(2 * np.pi * 6.5 * tt()) * smooth_noise(2, seed=5)
roar = env([(0, 0), (0.3, db(-30)), (8.6, db(-30)), (9.0, 0), (35.8, 0), (36.6, db(-22)), (38.5, db(-19.5)), (39.6, db(-17)), (40.5, db(-18)), (41.3, db(-24)), (43.8, db(-28)), (44.5, db(-30)), (44.7, 0)])
out[:, 0] += fL * flutter * roar; out[:, 1] += fR * flutter * roar

# winter forest ambience
fo = norm(lp(rng.standard_normal(N), 500)) * (0.6 + 0.4 * smooth_noise(0.3, seed=9))
fo2 = norm(lp(rng.standard_normal(N), 480)) * (0.6 + 0.4 * smooth_noise(0.3, seed=10))
forest = env([(0, 0), (44.8, 0), (45.4, db(-34)), (47.4, db(-36)), (48.0, 0), (51.7, 0), (52.3, db(-35)), (56.5, db(-35)), (57.0, db(-33)), (67.8, db(-34))])
out[:, 0] += fo * forest; out[:, 1] += fo2 * forest

# ---------- engines ----------
t = tt()
eng = np.zeros(N, np.float32)
for f0, ph in [(52.0, 0), (53.1, 1), (51.4, 2), (52.7, 3)]:
    for h in range(1, 9):
        eng += (np.sin(2 * np.pi * f0 * h * t + ph * h) / h ** 1.1).astype(np.float32)
eng = norm(lp(eng, 380) + 0.6 * norm(lp(rng.standard_normal(N), 260)))
eng_out = norm(lp(eng, 900)); eng_in = norm(lp(eng, 180))
e_ext = env([(0, db(-40)), (8.6, db(-40)), (9.2, db(-27)), (16.3, db(-27)), (18.0, db(-28)), (21.0, db(-30)), (21.3, 0), (34.0, 0), (34.4, db(-31)), (36.0, db(-32)), (38.0, db(-48)), (39.5, 0)])
e_int = env([(0, 0), (20.9, 0), (21.4, db(-31)), (27.9, db(-31)), (33.5, db(-33)), (34.3, 0)])
out[:, 0] += eng_out * e_ext + eng_in * e_int; out[:, 1] += eng_out * e_ext * 0.95 + eng_in * e_int

# ---------- restrained combat ambience ----------
def thump(dur=1.2, f=55, seed=0):
    n = int(dur * SR); tl = np.arange(n) / SR; r = np.random.default_rng(seed)
    s = np.sin(2 * np.pi * f * tl * (1 - 0.15 * tl)) * np.exp(-tl * 5) + 0.5 * lp(r.standard_normal(n), 300) * np.exp(-tl * 7)
    a = np.minimum(1, tl / 0.01); return (s * a).astype(np.float32)
for i, tt0 in enumerate([18.2, 18.45, 18.7]): place(out, thump(seed=i), tt0, db(-24 + i), pan=0.3)
for i, tt0 in enumerate(np.arange(17.85, 18.55, 0.085)):  # very soft distant rattle
    n = int(0.05 * SR); s = bp(rng.standard_normal(n), 300, 1500) * np.exp(-np.arange(n) / SR * 90)
    place(out, s.astype(np.float32), tt0, db(-40), pan=0.5)

# ---------- fire ----------
def crackles(rate, n, seed, lo=1500, hi=7000):
    r = np.random.default_rng(seed); s = np.zeros(n, np.float32)
    k = r.poisson(rate * n / SR)
    for p in r.integers(0, n - 2000, k):
        L = int(r.uniform(0.002, 0.012) * SR); s[p:p + L] += (r.standard_normal(L) * np.exp(-np.arange(L) / L * 5) * r.uniform(0.2, 1)).astype(np.float32)
    return hp(s, lo)
fire_rumble = norm(lp(rng.standard_normal(N), 260)) * (0.6 + 0.4 * smooth_noise(3, seed=21))
fire_cr = crackles(22, N, 22) * 6
fire_e = env([(0, 0), (18.8, 0), (20.2, db(-32)), (21.2, db(-27)), (24.2, db(-27)), (24.5, db(-22)), (27.9, db(-25)), (30.4, db(-24)), (31.7, db(-24)), (32.4, db(-31)), (34.0, db(-38)), (35.5, db(-44)), (36.6, 0)])
out[:, 0] += (fire_rumble + fire_cr) * fire_e; out[:, 1] += (fire_rumble * 0.9 + crackles(22, N, 23) * 6) * fire_e
# flare whoosh
n = int(1.4 * SR); tl = np.arange(n) / SR
wh = norm(bp(rng.standard_normal(n), 200, 2200)) * np.sin(np.pi * np.minimum(1, tl / 1.4)) ** 2
place(out, wh.astype(np.float32), 24.2, db(-26))

# ---------- fabric / movement ----------
def fabric(dur, seed, lo=900, hi=5000):
    n = int(dur * SR); r = np.random.default_rng(seed); tl = np.arange(n) / SR
    s = norm(bp(r.standard_normal(n), lo, hi)) * np.sin(np.pi * tl / dur) ** 1.5 * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * tl + r.random())))
    return s.astype(np.float32)
for tt0, d, g, p in [(21.6, 0.9, -30, 0.2), (24.4, 0.5, -28, 0.3), (30.3, 0.6, -33, -0.4), (31.9, 0.6, -33, 0.4), (35.5, 0.9, -28, 0), (46.0, 0.8, -32, 0), (48.3, 0.6, -34, 0.3), (57.3, 0.9, -34, 0)]:
    place(out, fabric(d, int(tt0 * 10)), tt0, db(g), pan=p)

# ---------- pine branches ----------
for i, tt0 in enumerate([42.3, 43.0, 43.7, 44.15]):
    n = int(0.9 * SR); tl = np.arange(n) / SR
    sw = norm(bp(rng.standard_normal(n), 400, 3500)) * np.exp(-((tl - 0.12) / 0.12) ** 2)
    rus = crackles(260, n, 50 + i, 2500, 9000) * 4 * np.exp(-tl * 3.5)
    place(out, (sw + rus).astype(np.float32), tt0 - 0.1, db(-25 - i * 0.5), pan=(-0.4 if i % 2 == 0 else 0.4))
    # snow sliding off the branch
    sn = norm(bp(rng.standard_normal(n), 1500, 6000)) * np.exp(-tl * 2.5) * np.minimum(1, tl / 0.08)
    place(out, sn.astype(np.float32), tt0 + 0.05, db(-36))

# ---------- soft snow impact ----------
n = int(2.4 * SR); tl = np.arange(n) / SR
thud = norm(lp(rng.standard_normal(n), 140)) * np.exp(-tl * 6) * np.minimum(1, tl / 0.03)
puff = norm(lp(bp(rng.standard_normal(n), 300, 4000), 2500)) * np.exp(-tl * 1.6) * np.minimum(1, tl / 0.05)
place(out, (thud * 0.9 + puff * 0.6).astype(np.float32), 44.62, db(-22))

# ---------- paper / notebook ----------
def scratch(dur, seed):
    n = int(dur * SR); r = np.random.default_rng(seed); tl = np.arange(n) / SR
    m = np.clip(np.sin(2 * np.pi * 7.5 * tl + r.random() * 6) , 0, 1) ** 2
    return (norm(bp(r.standard_normal(n), 2500, 8000)) * m * np.sin(np.pi * tl / dur) ** 0.5).astype(np.float32)
place(out, scratch(1.5, 61), 47.7, db(-35), pan=-0.4)
def rustle(dur, seed):
    n = int(dur * SR); tl = np.arange(n) / SR
    return (norm(bp(np.random.default_rng(seed).standard_normal(n), 900, 6000)) * np.sin(np.pi * tl / dur) ** 2 + crackles(120, n, seed, 2000, 8000) * 3 * np.sin(np.pi * tl / dur)).astype(np.float32)
for tt0, s in [(48.6, 71), (50.4, 72), (51.2, 73)]: place(out, rustle(0.5, s), tt0, db(-33), pan=0.2)

# ---------- footsteps in snow ----------
for i, tt0 in enumerate(np.arange(51.95, 53.5, 0.42)):
    n = int(0.22 * SR); tl = np.arange(n) / SR
    c = (crackles(900, n, 80 + i, 800, 5000) * 3 + norm(bp(rng.standard_normal(n), 300, 2500)) * 0.4) * np.exp(-tl * 14) * np.minimum(1, tl / 0.01)
    place(out, c.astype(np.float32), tt0, db(-32), pan=-0.5)
# torch click
n = int(0.03 * SR); place(out, (hp(rng.standard_normal(n), 2000) * np.exp(-np.arange(n) / SR * 200)).astype(np.float32), 52.7, db(-36), pan=-0.4)

# ---------- transition swishes (paper / pencil) ----------
for tt0, d, g in [(8.5, 0.8, -33), (27.6, 0.7, -34), (47.25, 0.75, -34), (51.6, 0.55, -35), (56.45, 0.65, -34)]:
    place(out, fabric(d, int(tt0 * 7), 600, 4500), tt0, db(g))

# ---------- music ----------
mus = readwav(A + '/music.wav')[:N]
if len(mus) < N: mus = np.vstack([mus, np.zeros((N - len(mus), 2), np.float32)])
menv = env([(0, db(-15.5)), (34.0, db(-15.5)), (35.8, db(-17)), (36.6, db(-24)), (40.3, db(-24)), (41.5, db(-16)), (44.4, db(-17)), (44.7, db(-21)), (45.6, db(-15.5)), (61.5, db(-15)), (65.6, db(-15)), (67.8, db(-40))])
out += mus * menv[:, None]

# ---------- narration (master) ----------
nar = readwav(A + '/narr.wav')[:, 0]
nn = np.zeros(N, np.float32); nn[:min(N, len(nar))] = nar[:N]
out[:, 0] += nn; out[:, 1] += nn

pk = np.abs(out).max(); print('peak', pk)
out = out / max(1.0, pk / 0.95)
with wave.open(A + '/mix.wav', 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
# stems for checks
with wave.open(A + '/sfx_only.wav', 'w') as w:
    o2 = out.copy(); o2[:, 0] -= nn / max(1.0, pk / 0.95); o2[:, 1] -= nn / max(1.0, pk / 0.95)
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(o2, -1, 1) * 32767).astype(np.int16).tobytes())
