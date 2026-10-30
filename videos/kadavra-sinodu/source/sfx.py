"""Synthesize subtle SFX bed (hall ambience, parchment, quill, seal, stone, steps, chair, murmur)."""
import numpy as np, wave, sys

SR = 48000
DUR = 59.4
N = int(SR * DUR)
rng = np.random.default_rng(7)
out = np.zeros((N, 2))


def bandnoise(n, lo, hi, tilt=0.0):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    m = ((f >= lo) & (f <= hi)).astype(float)
    # soft edges
    m = np.where(f < lo, np.exp(-((lo - f) / (lo * 0.3 + 1)) ** 2), m)
    m = np.where(f > hi, np.exp(-((f - hi) / (hi * 0.3 + 1)) ** 2), m)
    if tilt:
        m *= (np.maximum(f, 20) / 1000.0) ** tilt
    y = np.fft.irfft(X * m, n)
    return y / (np.std(y) + 1e-9)


def env(n, a, r, shape=1.0):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na) ** shape
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** shape
    return e


def place(sig, t, gain_db, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * 10 ** (gain_db / 20)
    l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    out[i:i + len(sig), 0] += sig * l
    out[i:i + len(sig), 1] += sig * r


def lfo_noise(n, rate):
    k = max(2, int(n / SR * rate) + 2)
    pts = rng.random(k)
    return np.interp(np.linspace(0, k - 1, n), np.arange(k), pts)


# --- sound designs ---
def parchment(d):
    n = int(d * SR)
    s = bandnoise(n, 1500, 7000) * (lfo_noise(n, 25) ** 3) * env(n, 0.03, 0.12)
    crack = (rng.random(n) < 0.0015) * rng.standard_normal(n) * 3
    return (s + bandnoise(n, 300, 1500) * 0.3 * env(n, 0.05, 0.1) + np.convolve(crack, np.exp(-np.arange(200) / 30), 'same')) * 0.25


def pageflip(d=0.22):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    e = np.sin(np.pi * t) ** 2 * (1 + 2 * np.exp(-((t - 0.6) / 0.08) ** 2))
    return bandnoise(n, 900, 6000) * e * 0.25


def quill(d):
    n = int(d * SR)
    strokes = (np.sin(2 * np.pi * np.cumsum(4.5 + 2 * lfo_noise(n, 3)) / SR) > 0.1).astype(float)
    strokes = np.convolve(strokes, np.ones(400) / 400, 'same')
    grit = bandnoise(n, 3000, 9000) * (0.6 + 0.4 * (rng.random(n) < 0.3))
    return grit * strokes * env(n, 0.05, 0.1) * 0.13


def stamp():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
    click = bandnoise(n, 400, 4000) * np.exp(-t * 60) * 0.5
    return (thump + click) * 0.7


def step():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 95 * t) * np.exp(-t * 28) * 0.6 + bandnoise(n, 200, 2500) * np.exp(-t * 45) * 0.35) * 0.6


def stone(d):
    n = int(d * SR)
    grind = bandnoise(n, 50, 900, tilt=-0.4) * (0.5 + 0.5 * lfo_noise(n, 18)) * env(n, 0.08, 0.2)
    grit = bandnoise(n, 1500, 5000) * (rng.random(n) < 0.02) * 2
    return (grind + grit * 0.3) * 0.45


def door(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 180 + 90 * np.sin(2 * np.pi * 1.3 * t) + 40 * lfo_noise(n, 8)
    creak = np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.sin(2 * np.pi * np.cumsum(f * 0.5 + 9) / SR) > 0.3)
    creak = np.convolve(creak, np.ones(30) / 30, 'same')
    rumble = bandnoise(n, 40, 300) * 0.6
    return (creak * 0.25 + rumble) * env(n, 0.05, 0.25) * 0.45


def chair(d):
    n = int(d * SR)
    scrape = bandnoise(n, 250, 1800) * (0.4 + 0.6 * lfo_noise(n, 30) ** 2) * env(n, 0.05, 0.08)
    return scrape * 0.4


def cloth(d):
    n = int(d * SR)
    return bandnoise(n, 400, 4500) * (lfo_noise(n, 6) ** 2) * env(n, 0.15, 0.25) * 0.18


def murmur(d, density=8):
    n = int(d * SR)
    y = np.zeros(n)
    for v in range(density):
        lo = 250 + rng.random() * 300
        voice = bandnoise(n, lo, lo + 900 + rng.random() * 600)
        syll = lfo_noise(n, 4 + rng.random() * 3) ** 2
        gate = (lfo_noise(n, 0.6) > 0.35).astype(float)
        gate = np.convolve(gate, np.ones(2400) / 2400, 'same')
        y += voice * syll * gate
    return y / np.sqrt(density) * env(n, 0.4, 0.6) * 0.3


def crackle(d, rate=3):
    n = int(d * SR)
    imp = (rng.random(n) < rate / SR) * (rng.random(n) ** 2)
    k = np.exp(-np.arange(300) / 40) * rng.standard_normal(300)
    return np.convolve(imp, k, 'same') * 0.6


def whoosh(d):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    return bandnoise(n, 300, 3000) * np.sin(np.pi * t) ** 2 * 0.25


# --- ambience bed ---
amb = bandnoise(N, 30, 500, tilt=-0.8) * 0.05
amb += crackle(DUR, 2.5) * 0.25 * 0.5
out[:, 0] += amb * 0.9
out[:, 1] += np.roll(amb, 1500) * 0.9

# --- timeline (global seconds) ---
ev = []
ev += [(murmur(2.6, 10), 0.0, -6, 0)]
ev += [(cloth(1.0), 0.2, -4, -0.3)]
ev += [(stone(0.9), 7.78, -2, 0.1)]
ev += [(pageflip(), 8.85 + 0.2 * i, -6, 0.05 * (i % 3 - 1)) for i in range(9)]
ev += [(quill(2.0), 11.1, -3, -0.2)]
ev += [(stamp(), 14.26, -5, 0)]
ev += [(parchment(0.6), 14.75, -4, 0.2)]
ev += [(step(), 14.85 + 0.42 * i, -8, 0.3) for i in range(3)]
ev += [(stone(0.45), 15.55, -2, 0)]
ev += [(pageflip(0.3), 16.05, -6, 0)]
ev += [(door(0.9), 16.2, -3, 0)]
ev += [(cloth(1.4), 16.9, 0, 0)]
ev += [(cloth(1.2), 18.7, -2, 0)]
ev += [(chair(0.7), 20.4, -1, 0), (stamp(), 21.1, -16, 0)]
ev += [(step(), 22.3 + 0.28 * i, -12, (-0.6 if i % 2 else 0.6)) for i in range(6)]
ev += [(murmur(2.8, 8), 22.4, -10, 0)]
ev += [(step(), 29.0 + 0.36 * i, -9, 0.4) for i in range(4)]
ev += [(murmur(1.8, 8), 31.9, -9, 0)]
ev += [(parchment(0.8), 34.0, -3, 0)]
ev += [(quill(1.8), 34.25, -3, -0.1)]
ev += [(stamp(), 36.4, -3, 0.1)]
ev += [(whoosh(0.5), 36.95, -8, 0)]
ev += [(parchment(0.25), 37.3 + 0.12 * i, -9, (i % 3 - 1) * 0.4) for i in range(6)]
ev += [(quill(0.32), 38.45 + 0.55 * i, 0, (i % 2 - 0.5) * 0.6) for i in range(4)]
ev += [(murmur(7.4, 16), 41.4, -2, 0)]
ev += [(parchment(1.5), 42.2, -8, -0.3), (parchment(1.5), 45.2, -7, 0.3)]
ev += [(whoosh(0.7), 44.2, -5, 0)]
ev += [(chair(0.45), 47.0, -2, -0.2), (stamp(), 47.62, -14, 0), (chair(0.4), 47.9, -6, 0)]
ev += [(pageflip(0.4), 49.95, -4, 0), (parchment(0.9), 50.2, -8, 0)]
ev += [(crackle(5.0, 6), 54.0, -6, 0)]

for sig, t, g, p in ev:
    place(sig, t, g, p)

# --- hall reverb ---
irn = int(1.7 * SR)
it = np.arange(irn) / SR
for ch in range(2):
    ir = rng.standard_normal(irn) * np.exp(-it * 3.6)
    ir[0] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    L = N + irn
    nfft = 1 << int(np.ceil(np.log2(L)))
    wet = np.fft.irfft(np.fft.rfft(out[:, ch], nfft) * np.fft.rfft(ir, nfft), nfft)[:N]
    out[:, ch] = out[:, ch] * 0.75 + wet * 0.45

out *= 0.5
pk = np.max(np.abs(out))
print('peak', pk)
if pk > 0.9: out *= 0.9 / pk
pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
