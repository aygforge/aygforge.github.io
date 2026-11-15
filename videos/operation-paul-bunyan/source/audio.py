# Audio mix: narration (master, untouched timing) + looped supplied music with automation + synthesized subtle SFX.
import subprocess, math
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
END = 105.7
U = '/root/.claude/uploads/44728941-80ba-5a8f-92b3-0aeb4ccc7cce/'
NARR = U + '04976097-bombard_man.mp3'
MUSIC = U + '0323efe0-Operation_-_usesuno.com.mp3'
rng = np.random.default_rng(1976)
NS = int(END * SR)
T = np.arange(NS) / SR


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def env(points):
    """piecewise-linear envelope from (time, value) pairs."""
    ts, vs = zip(*points)
    return np.interp(T, ts, vs)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)


def place(buf, t0, x, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= NS:
        return
    x = x[:NS - i]
    l = math.cos((pan + 1) * math.pi / 4) * math.sqrt(2)
    r = math.sin((pan + 1) * math.pi / 4) * math.sqrt(2)
    buf[i:i + len(x), 0] += x * gain * l
    buf[i:i + len(x), 1] += x * gain * r


def fade(x, a=0.02, b=0.05):
    n = len(x)
    e = np.ones(n)
    na, nb = min(int(a * SR), n // 2), min(int(b * SR), n // 2)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nb:
        e[-nb:] *= np.linspace(1, 0, nb)
    return x * e


def noise(d):
    return rng.normal(0, 1, int(d * SR))


# ------------------------------------------------------------------ narration (untouched)
narr = decode(NARR)
nar = np.zeros((NS, 2))
nar[:len(narr)] = narr[:NS]

# ------------------------------------------------------------------ music: skip the near-silent intro, loop with crossfades
mus = decode(MUSIC)
seg = mus[int(6.3 * SR):int(51.0 * SR)]
xf = int(1.5 * SR)
music = np.zeros((NS + SR * 60, 2))
pos = 0
first = True
while pos < NS:
    s = seg.copy()
    if not first:
        s[:xf] *= np.linspace(0, 1, xf)[:, None]
    s[-xf:] *= np.linspace(1, 0, xf)[:, None]
    music[pos:pos + len(s)] += s
    pos += len(s) - xf
    first = False
music = music[:NS]
# match music loudness to narration speech level, then automate
speech = narr[np.abs(narr).max(1) > 0.02]
music *= 10 ** ((rms_db(speech) - rms_db(seg)) / 20)
target = env([
    (0, -9.5), (7.6, -9.0), (8.4, -10.5),            # hook reveal -> normal
    (31.3, -10.5), (32.2, -20.0), (37.9, -20.0),     # deaths: significantly reduced
    (38.6, -14.0), (43.0, -11.0), (47.0, -10.5),     # rebuild from "Bunun üzerine..."
    (48.4, -9.5), (50.6, -9.5), (53.7, -10.0),
    (56.4, -8.8), (59.3, -8.5), (62.0, -8.2), (67.2, -8.2), (68.3, -8.4), (72.4, -8.4),  # SF, helis, B-52, Midway
    (76.3, -7.5), (76.75, -30.0), (78.3, -30.0),     # build, then drop: "Ağacı kesmek." lands alone
    (79.3, -10.5), (100.9, -10.5),
    (101.0, -10.5), (104.0, -11.0), (END, -11.0)])
NREF = rms_db(speech)
win = SR
def movavg(x, w):
    c = np.concatenate([[0], np.cumsum(x)])
    i = np.arange(len(x))
    lo = np.clip(i - w // 2, 0, len(x)); hi = np.clip(i + w // 2, 0, len(x))
    return (c[hi] - c[lo]) / np.maximum(hi - lo, 1)
sq = movavg(movavg((music ** 2).mean(1), win), 2 * win)
mdb = 10 * np.log10(sq + 1e-10)
gain = 10 ** ((target + NREF - 20 * np.log10(0.0 + 1) - mdb) / 20)
gain = np.minimum(gain, 4.0)
gain *= env([(0, 0.0), (0.03, 1.0), (104.2, 1.0), (105.65, 0.0), (END, 0.0)])
music *= gain[:, None]

# ------------------------------------------------------------------ SFX
sfx = np.zeros((NS, 2))


def wind(d):
    n = noise(d)
    w = lp(n, 500) * (0.6 + 0.4 * np.sin(np.arange(len(n)) / SR * 2 * math.pi * 0.17 + rng.uniform(0, 6)))
    w += hp(lp(n, 2200), 900) * 0.15
    return fade(w, 1.0, 1.2)


for t0, d, g in [(0.0, 8.4, 0.05), (13.4, 18.0, 0.05), (31.9, 6.4, 0.035), (38.3, 12.0, 0.045),
                 (53.7, 8.0, 0.04), (76.6, 21.0, 0.04), (96.9, 4.2, 0.035)]:
    place(sfx, t0, wind(d), g)


def rotor(d, rate=5.6):
    n = noise(d)
    tt = np.arange(len(n)) / SR
    pulse = (0.5 + 0.5 * np.cos(2 * math.pi * rate * tt)) ** 6
    x = lp(n, 260) * pulse * 3 + lp(n, 120) * 0.3
    return fade(x, 0.8, 0.8)


for t0, d, g, pan in [(0.95, 7.3, 0.10, -0.4), (1.05, 7.2, 0.08, 0.4), (59.3, 8.8, 0.12, -0.3),
                      (59.45, 8.6, 0.10, 0.35), (73.5, 0.6, 0.12, 0.0), (79.3, 15.0, 0.05, 0.2),
                      (49.2, 1.4, 0.06, 0.0)]:
    place(sfx, t0, rotor(d, 5.2 + rng.uniform(0, 1)), g, pan)


def flyover(d, peak=0.5, bright=900):
    n = noise(d)
    tt = np.linspace(0, 1, len(n))
    e = np.exp(-((tt - peak) / 0.28) ** 2)
    x = lp(n, 180) * 2.2 + bp(n, 300, bright) * 0.5
    return fade(x * e, 0.3, 0.5)


for t0, d, g, pk in [(1.0, 4.0, 0.16, 0.5), (61.9, 5.5, 0.22, 0.45), (74.05, 1.15, 0.14, 0.5),
                     (89.0, 7.0, 0.05, 0.6)]:
    place(sfx, t0, flyover(d, pk), g)


def jet(d):
    n = noise(d)
    tt = np.linspace(0, 1, len(n))
    e = np.exp(-((tt - 0.4) / 0.2) ** 2)
    f = bp(n, 700, 4500) * e
    return fade(f, 0.05, 0.2)


for t0, g, pan in [(1.3, 0.07, -0.6), (64.4, 0.09, 0.0), (74.6, 0.08, 0.3)]:
    place(sfx, t0, jet(1.6), g, pan)


def step():
    n = noise(0.09)
    e = np.exp(-np.linspace(0, 1, len(n)) * 9)
    return lp(n, 900) * e + bp(n, 1500, 4000) * e * 0.3


def steps(t0, d, rate, g, pan=0.0, jitter=0.03):
    t = t0
    while t < t0 + d:
        place(sfx, t + rng.uniform(-jitter, jitter), step(), g * rng.uniform(0.7, 1.0), pan + rng.uniform(-0.3, 0.3))
        t += 1 / rate


steps(0.45, 0.8, 12, 0.10)
steps(1.5, 1.2, 14, 0.07)
steps(23.0, 2.6, 5, 0.06, -0.3)
steps(32.0, 1.9, 4.5, 0.035, 0.4)
steps(46.6, 1.9, 2.4, 0.08, -0.2)
steps(48.5, 1.8, 12, 0.05)
steps(55.2, 1.8, 10, 0.06)
steps(72.95, 0.5, 10, 0.06)


def static(d):
    n = noise(d)
    crack = (rng.random(len(n)) < 0.004) * rng.normal(0, 4, len(n))
    x = bp(n, 1200, 3800) * 0.5 + bp(crack, 800, 5000)
    return fade(x, 0.02, 0.12)


for t0, d in [(13.6, 0.5), (22.0, 0.45), (38.4, 0.5), (53.8, 0.55), (86.1, 0.5)]:
    place(sfx, t0, static(d), 0.05, rng.uniform(-0.5, 0.5))


def paper(d=0.35, bright=1.0):
    n = noise(d)
    tt = np.linspace(0, 1, len(n))
    e = np.sin(math.pi * tt) ** 0.7 * (1 + 0.6 * np.sin(2 * math.pi * 23 * tt * d))
    return fade(hp(lp(n, 6000 * bright), 700) * e, 0.01, 0.06)


for t0, d, g in [(7.95, 0.55, 0.12), (13.4, 0.4, 0.07), (38.2, 0.4, 0.07), (39.3, 0.3, 0.12), (40.0, 0.3, 0.12),
                 (40.7, 0.3, 0.12), (42.7, 0.35, 0.08), (50.35, 0.55, 0.14), (67.6, 0.5, 0.09),
                 (72.95, 0.18, 0.07), (73.5, 0.18, 0.07), (74.05, 0.18, 0.07), (74.6, 0.18, 0.07),
                 (75.15, 0.18, 0.07), (75.7, 0.18, 0.07), (96.9, 0.4, 0.06)]:
    place(sfx, t0, paper(d), g)


def thump(f=60, d=0.45, noise_amt=0.6):
    tt = np.arange(int(d * SR)) / SR
    e = np.exp(-tt * 9)
    x = np.sin(2 * math.pi * f * tt * (1 + 0.6 * np.exp(-tt * 20))) * e
    x += lp(noise(d), 400) * e * noise_amt
    return fade(x, 0.002, 0.05)


place(sfx, 11.18, thump(140, 0.15, 0.3), 0.07)          # pin
place(sfx, 52.13, thump(75, 0.35, 0.9), 0.30)           # stamp
place(sfx, 52.13, paper(0.12, 1.2), 0.12)


def tick():
    n = noise(0.02)
    return bp(n, 2500, 6000) * np.exp(-np.linspace(0, 1, len(n)) * 12)


t = 79.9
while t < 84.4:
    place(sfx, t, tick(), 0.05, 0.5)
    t += 0.25


def chainsaw(d, f_curve, g_curve):
    tt = np.arange(int(d * SR)) / SR
    f = np.interp(tt, *zip(*f_curve)) * (1 + 0.025 * np.sin(2 * math.pi * 3.1 * tt) + 0.01 * rng.normal(0, 1, len(tt)))
    ph = 2 * math.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * math.pi)) % 1.0) - 1
    pulse = (0.5 + 0.5 * np.cos(ph)) ** 8
    nz = rng.normal(0, 1, len(tt))
    x = np.tanh(2.5 * (saw * 0.6 + pulse * 0.8 + nz * pulse * 0.6))
    x = bp(x, 150, 3500) + 0.15 * bp(nz, 2000, 6000) * pulse
    x *= np.interp(tt, *zip(*g_curve))
    return fade(x, 0.05, 0.3)


# pull cord then run during the cut
cord = hp(noise(0.35), 400) * np.exp(-np.linspace(0, 1, int(0.35 * SR)) * 3)
place(sfx, 79.32, fade(cord), 0.05)
place(sfx, 79.5, chainsaw(5.4, [(0, 45), (0.25, 75), (0.6, 60), (0.9, 125), (4.5, 132), (4.9, 70), (5.4, 45)],
                          [(0, 0), (0.15, 0.6), (0.9, 1.0), (4.6, 1.0), (5.0, 0.5), (5.4, 0)]), 0.06, -0.1)
# brief idea-rev when the chainsaw appears (scene 7)
place(sfx, 44.45, chainsaw(0.9, [(0, 55), (0.3, 110), (0.9, 70)], [(0, 0), (0.2, 0.8), (0.9, 0)]), 0.03)


def creak(d):
    n = int(d * SR)
    tt = np.arange(n) / SR
    clicks = np.zeros(n)
    t = 0.0
    while t < d:
        i = int(t * SR)
        clicks[i:i + 30] += rng.normal(0, 1, len(clicks[i:i + 30]))
        t += 0.012 + 0.03 * (0.5 + 0.5 * math.sin(t * 9))
    b, a = signal.iirpeak(380, 6, fs=SR)
    x = signal.lfilter(b, a, clicks) * 3
    groan = np.sin(2 * math.pi * np.cumsum(110 + 25 * np.sin(tt * 3.0)) / SR) * 0.25
    return fade(x + groan * np.sin(math.pi * tt / d), 0.1, 0.2)


place(sfx, 83.7, creak(0.9), 0.07, 0.2)
place(sfx, 84.4, flyover(1.1, 0.75, 2500), 0.10, 0.4)          # falling whoosh
place(sfx, 85.45, thump(48, 0.9, 1.2), 0.32, 0.3)               # tree hits ground
leaves = hp(noise(1.4), 1500) * np.exp(-np.linspace(0, 1, int(1.4 * SR)) * 4)
place(sfx, 85.45, fade(leaves), 0.06, 0.4)

# ------------------------------------------------------------------ mix
mix = nar + music + sfx
pk = np.abs(mix).max()
print('peak before norm', pk)
wavfile.write('mix_pre.wav', SR, mix.astype(np.float32))
