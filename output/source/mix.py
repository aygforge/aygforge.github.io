import numpy as np, subprocess, sys
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
DUR = 94.4
UP = '/root/.claude/uploads/5b5984ea-1e29-5092-b197-863b900b4172/'
N = int(DUR * SR)

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

narr = load(UP + 'f92612e0-viski.mp3')
mus = load(UP + 'f50674d6-Dublin_Whiskey_Fire_-_usesuno.com.mp3')
print('narr sec', len(narr) / SR)

def fit(x):
    out = np.zeros((N, 2), np.float32); n = min(N, len(x)); out[:n] = x[:n]; return out
narr = fit(narr); mus = fit(mus)
t = np.arange(N) / SR

def env(keys):
    # keys: list of (time, dB) ; linear interpolation in dB
    tt = np.array([k[0] for k in keys]); dd = np.array([k[1] for k in keys])
    return 10 ** (np.interp(t, tt, dd) / 20)

# music level (dB relative to source). Narration sits at ~0 dB rel.
M = [(0, -9.5), (5.0, -9.5), (5.8, -12), (16.6, -12), (17.2, -9.5), (24.2, -9.5), (24.8, -10), (34.6, -10), (35.2, -13.5),
     (42.4, -13.5), (42.9, -9), (45.8, -9), (46.3, -9.5), (58.4, -9.5), (59.0, -12), (61.3, -12), (62.0, -13), (76.2, -13),
     (76.9, -12), (89.3, -12), (90.0, -10.5), (92.6, -10.5), (94.35, -60)]
g = env(M)[:, None]
# somber low-pass blend during deaths section, partial during final irony
sos = butter(2, 1100, 'low', fs=SR, output='sos')
musL = sosfilt(sos, mus, axis=0).astype(np.float32)
b = np.interp(t, [0, 61.3, 62.2, 76.3, 77.2, 86.2, 87.0, 100], [0, 0, .8, .8, .45, .45, 0, 0])[:, None]
music = (mus * (1 - b) + musL * b * 1.25) * g

rng = np.random.default_rng(7)
sfx = np.zeros(N, np.float32)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def seg(t0, t1): return int(t0 * SR), int(t1 * SR)
def fade_env(n, fi=.3, fo=.4):
    e = np.ones(n); a = int(fi * SR); b2 = int(fo * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if b2: e[-b2:] *= np.linspace(1, 0, b2)
    return e
def add(t0, sig, gain):
    i = int(t0 * SR); n = min(len(sig), N - i)
    if n > 0: sfx[i:i + n] += (sig[:n] * gain).astype(np.float32)

def crackle(t0, t1, density=30, gain=1.0):
    n = int((t1 - t0) * SR); x = np.zeros(n)
    k = rng.poisson(density * (t1 - t0)); pos = rng.integers(0, n - 800, k)
    for p in pos:
        L = rng.integers(60, 500); x[p:p + L] += rng.normal(0, 1, L) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(.2, 1)
    x = hp(x, 900) * .5
    roar = lp(rng.normal(0, 1, n), 300) * .25 * (1 + .3 * np.sin(np.arange(n) / SR * 2.1))
    return (x + roar) * fade_env(n, .4, .6) * gain

def flow(t0, t1, gain=1.0):
    n = int((t1 - t0) * SR); x = bp(rng.normal(0, 1, n), 250, 2200) * .35
    mod = 1 + .4 * np.sin(np.arange(n) / SR * 2 * np.pi * .7) + .2 * np.sin(np.arange(n) / SR * 2 * np.pi * 2.3)
    gl = np.zeros(n)
    for p in rng.integers(0, n - 4000, int((t1 - t0) * 9)):
        L = rng.integers(1200, 3500); f = rng.uniform(280, 750); tt = np.arange(L) / SR
        gl[p:p + L] += np.sin(2 * np.pi * (f + 900 * tt) * tt) * np.sin(np.pi * np.arange(L) / L) * .25
    return (x * mod + gl) * fade_env(n, .5, .6) * gain

def creak(dur=1.2, gain=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = 70 + 60 * tt / dur + 8 * np.sin(2 * np.pi * 9 * tt)
    ph = np.cumsum(f) / SR; saw = 2 * (ph % 1) - 1
    return bp(saw, 350, 1800) * fade_env(n, .2, .3) * (1 + .5 * np.sin(2 * np.pi * 3 * tt)) * gain

def split(gain=1.0):
    n = int(.6 * SR); tt = np.arange(n) / SR
    crack = bp(rng.normal(0, 1, n), 900, 5000) * np.exp(-tt / .04) * 1.4
    thump = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt / .12) * .8
    splinter = np.zeros(n)
    for p in rng.integers(0, int(.35 * SR), 25):
        L = 200; splinter[p:p + L] += rng.normal(0, 1, L) * np.exp(-np.arange(L) / 40) * .5
    return (crack + thump + hp(splinter, 1500)) * gain

def gush(dur=1.5, gain=1.0):
    n = int(dur * SR); x = bp(rng.normal(0, 1, n), 200, 1500)
    return x * fade_env(n, .05, .8) * gain

def hooves(t0, t1, gain=1.0):
    n = int((t1 - t0) * SR); x = np.zeros(n); tt = np.arange(int(.08 * SR)) / SR
    step = .27; k = 0
    while k * step < (t1 - t0) - .1:
        p = int((k * step + (.06 if k % 2 else 0)) * SR); f = rng.uniform(380, 520)
        c = (np.sin(2 * np.pi * f * tt) * .6 + rng.normal(0, .3, len(tt))) * np.exp(-tt / .015)
        x[p:p + len(c)] += c[:max(0, min(len(c), n - p))]; k += 1
    wheels = lp(rng.normal(0, 1, n), 180) * .3
    return (x + wheels) * fade_env(n, .3, .5) * gain

def bell(gain=1.0):
    n = int(1.6 * SR); tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in [(830, 1, .9), (1987, .5, .5), (2710, .35, .35), (3640, .2, .25)])
    return x * gain

def chuffs(t0, t1, gain=1.0):
    n = int((t1 - t0) * SR); x = np.zeros(n); per = int(.42 * SR); L = int(.18 * SR)
    for p in range(0, n - L, per): x[p:p + L] += lp(rng.normal(0, 1, L), 900) * np.exp(-np.arange(L) / (L / 3))
    return x * fade_env(n, .3, .5) * gain

def murmur(t0, t1, gain=1.0):
    n = int((t1 - t0) * SR); x = np.zeros(n); tt = np.arange(n) / SR
    for k in range(6):
        f0 = rng.uniform(250, 600)
        m = .5 + .5 * np.sin(2 * np.pi * rng.uniform(1.5, 4) * tt + rng.uniform(0, 6)) ** 2
        x += bp(rng.normal(0, 1, n), f0, f0 * 1.8) * m
    return x / 6 * fade_env(n, .8, 1) * gain

def steps(t0, t1, rate=2.2, gain=1.0):
    n = int((t1 - t0) * SR); x = np.zeros(n); L = int(.06 * SR)
    for k in range(int((t1 - t0) * rate)):
        p = int((k / rate + rng.uniform(-.03, .03)) * SR)
        if 0 <= p < n - L: x[p:p + L] += lp(rng.normal(0, 1, L), 600) * np.exp(-np.arange(L) / (L / 5))
    return x * gain

def rustle(dur=.9, gain=1.0):
    n = int(dur * SR); x = hp(rng.normal(0, 1, n), 2500)
    m = np.abs(lp(rng.normal(0, 1, n), 25)); m /= m.max()
    return x * m * fade_env(n, .05, .3) * gain

# --- schedule (gains tuned so SFX stay well below narration & music) ---
add(0.0, flow(0, 5.3), .055)
add(0.45, crackle(.45, 5.4, 35), .075)
add(8.4, crackle(8.4, 12.5, 12), .045)
add(12.3, creak(1.5), .03); add(14.6, creak(1.3), .025)
add(16.9, crackle(16.9, 24.6, 40), .08)
add(17.3, creak(1.2), .045)
add(18.55, split(), .11); add(18.7, gush(1.4), .05)
add(19.55, split(), .1); add(19.7, gush(1.4), .05)
add(20.4, flow(20.4, 35.0), .055)
add(24.4, crackle(24.4, 35.0, 45), .08)
add(26.0, steps(26, 29, 4), .03)
add(34.9, hooves(34.9, 37.4), .07)
add(35.2, bell(), .035); add(35.85, bell(), .03); add(36.5, bell(), .025)
add(36.8, chuffs(36.8, 42.6), .035)
add(35.0, crackle(35, 42.7, 18), .05)
add(36.0, murmur(36, 50.2), .03)
add(40.3, steps(40.3, 42.8, 2.6), .045)
add(42.6, flow(42.6, 58.4), .04)
add(45.8, flow(45.8, 50.3), .025)
add(50.35, rustle(1.1), .05)
add(51.9, rustle(.5), .025)
add(58.5, crackle(58.5, 61.2, 10), .03)
add(76.6, crackle(76.6, 82.5, 22), .045)
add(76.6, flow(76.6, 83.0), .035)
add(86.1, crackle(86.1, 89.6, 12), .03)
add(89.45, rustle(1.0), .055)

sfx_st = np.stack([sfx, sfx], 1)
mixd = narr * 1.0 + music + sfx_st
# gentle master fade at the end
mixd *= np.interp(t, [0, DUR - 1.1, DUR - .05, DUR], [1, 1, 0, 0])[:, None]
peak = np.abs(mixd).max(); print('peak', peak)
wavfile.write(sys.argv[1], SR, (mixd / max(1, peak) * .97).astype(np.float32))
