#!/usr/bin/env python3
"""Audio mix for the Great Emu War short: narration (master) + extended supplied music + synthesized SFX."""
import numpy as np, wave, sys, os
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 1322 / 30  # video duration
N = int(round(DUR * SR))
A = sys.argv[1]  # audio dir
rng = np.random.default_rng(1932)

def load(path, ch):
    w = wave.open(path); n = w.getnframes(); c = w.getnchannels()
    x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    x = x.reshape(-1, c)
    if ch == 1: return x.mean(1)
    return x if c == 2 else np.repeat(x, 2, 1)

def db(v): return 10 ** (v / 20)
def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype='band', fs=SR, output='sos'); return sosfilt(sos, x, axis=0)
def lp(x, f, order=2):
    sos = butter(order, f, btype='low', fs=SR, output='sos'); return sosfilt(sos, x, axis=0)
def hp(x, f, order=2):
    sos = butter(order, f, btype='high', fs=SR, output='sos'); return sosfilt(sos, x, axis=0)
def env_exp(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)
def pan(mono, p):  # p -1..1
    l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4)
    return np.stack([mono * l, mono * r], 1)
def place(buf, sig, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), len(buf) - i)
    buf[i:i + n] += sig[:n] * gain

# ---------------- narration (untouched, master) ----------------
narr = load(os.path.join(A, 'narr.wav'), 1)
narr = np.concatenate([narr, np.zeros(max(0, N - len(narr)))])[:N]

# speech activity envelope for ducking
win = int(0.03 * SR)
rms = np.sqrt(np.convolve(narr ** 2, np.ones(win) / win, 'same'))
act = (rms > db(-40)).astype(float)
# smooth: fast attack (60ms), slow release (350ms)
def smooth_env(a, att, rel):
    out = np.zeros_like(a); y = 0.0
    ka = 1 - np.exp(-1 / (att * SR / 64)); kr = 1 - np.exp(-1 / (rel * SR / 64))
    dec = a[::64]; o = np.zeros_like(dec)
    for i, v in enumerate(dec):
        y += (v - y) * (ka if v > y else kr); o[i] = y
    return np.interp(np.arange(len(a)), np.arange(len(dec)) * 64, o)
speech = smooth_env(act, 0.06, 0.35)

# ---------------- music: supplied track extended by one 32-beat loop ----------------
mus = load(os.path.join(A, 'music.wav'), 2)
T1, LAG, XF = 18.40, 13.995, 0.60
# fine-align the loop lag by waveform cross-correlation (±15 ms)
a = int(T1 * SR); W = int(0.4 * SR); m = mus.mean(1)
best = (-2, LAG)
for L in range(int((LAG - 0.015) * SR), int((LAG + 0.015) * SR), 4):
    s1 = m[a - W:a + W]; s2 = m[a - L - W:a - L + W]
    c = np.dot(s1, s2) / np.sqrt(np.dot(s1, s1) * np.dot(s2, s2) + 1e-12)
    if c > best[0]: best = (c, L / SR)
LAG = best[1]
print('loop lag', round(LAG, 4), 'corr', round(best[0], 3))
L = int(LAG * SR); x0 = int((T1 - XF / 2) * SR); xn = int(XF * SR)
head = mus[:x0 + xn]
tail = mus[x0 - L:]
g = np.linspace(0, 1, xn)[:, None]
fo, fi = np.cos(g * np.pi / 2), np.sin(g * np.pi / 2)
ext = np.concatenate([head[:x0], head[x0:x0 + xn] * fo + tail[:xn] * fi, tail[xn:]])
print('extended music length', len(ext) / SR)
ext = np.concatenate([ext, np.zeros((max(0, N - len(ext)), 2))])[:N]
# gentle end fade
fe = int(0.35 * SR); ext[-fe:] *= np.linspace(1, 0, fe)[:, None]

# music gain: ~-22 dB (LU) under narration, ~-17 in gaps; accents swell slightly
MUS_SPEECH, MUS_GAP = -25.7, -20.7
gain_db = MUS_GAP + (MUS_SPEECH - MUS_GAP) * speech
tt = np.arange(N) / SR
def bump(t0, t1, amt, rise=0.08, fall=0.6):
    return amt * np.clip((tt - t0) / rise + 1, 0, 1) * np.clip(1 - (tt - t1) / fall, 0, 1) * (tt >= t0 - rise)
accent = bump(0.0, 0.9, 3) + bump(19.85, 20.8, 2.5) + bump(21.25, 22.0, 3) + bump(24.95, 25.6, 2.5) + bump(36.45, 37.6, 4) + bump(42.1, 44.1, 2)
music = ext * db(gain_db + accent)[:, None]

# ---------------- SFX ----------------
sfx = np.zeros((N, 2))
def noise(n): return rng.standard_normal(n)

# wind / dry countryside ambience (with slow gusts) + faint cicada shimmer
n = N
wind = lp(noise(n), 500, 2) + 0.4 * bp(noise(n), 900, 2500)
gust = 0.55 + 0.45 * np.interp(np.arange(n), np.linspace(0, n, 30), rng.random(30))
gust = np.convolve(gust, np.ones(4800) / 4800, 'same')
wind *= gust
wind /= np.sqrt(np.mean(wind ** 2))
cic = bp(noise(n), 4200, 6200) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * tt) ** 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.31 * tt))
cic /= np.sqrt(np.mean(cic ** 2))
amb_level = np.interp(tt, [0, 9.1, 9.3, 11.5, 11.7, 13.8, 14.0, 35.3, 35.5, 39.2, 39.5, DUR], [1, 1, .45, .45, .3, .3, 1, 1, .25, .25, 1, 1])
amb = (wind * db(-36) + cic * db(-50)) * amb_level
sfx += np.stack([amb, np.roll(amb, 1700)], 1)

# emu footsteps (soft thuds + dirt crunch)
def step(strength=1.0):
    n = int(0.09 * SR); t = np.arange(n) / SR
    th = np.sin(2 * np.pi * (70 + 40 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.025)
    cr = bp(noise(n), 900, 3500) * np.exp(-t / 0.018)
    return (th * 0.9 + cr * 0.35) * strength
def run_steps(t0, t1, rate, level_db, pan_from=-0.5, pan_to=0.5, n_birds=3, fade=(0.2, 0.4)):
    for b in range(n_birds):
        t = t0 + rng.random() * 0.15
        while t < t1:
            u = (t - t0) / max(1e-3, t1 - t0)
            fi = min(1, (t - t0) / fade[0]) * min(1, (t1 - t) / fade[1])
            p = pan_from + (pan_to - pan_from) * u + (rng.random() - 0.5) * 0.4
            place(sfx, pan(step(0.6 + 0.4 * rng.random()), p), t, db(level_db) * fi)
            t += 1 / rate * (0.85 + 0.3 * rng.random())
run_steps(0.0, 7.3, 7, -23, -0.6, 0.6, 4, (0.01, 0.3))
run_steps(7.3, 8.6, 8, -18, -0.8, 0.8, 5, (0.05, 0.6))
run_steps(10.85, 11.45, 7, -25, 0.0, -0.8, 1)
run_steps(13.9, 15.6, 3, -34, 0.3, -0.2, 4)
run_steps(21.25, 22.2, 9, -15, -0.9, 0.9, 6, (0.02, 0.5))
run_steps(23.22, 24.3, 6, -36, -0.4, 0.4, 3)
run_steps(24.4, 26.4, 5, -38, 0.6, -0.6, 2)
run_steps(26.5, 28.6, 6, -32, -0.6, 0.7, 3)
run_steps(29.6, 34.0, 3, -38, -0.5, 0.5, 3)
run_steps(35.38, 36.1, 0.01, -60, 0, 0, 1)

# Lewis gun: ~9.5 rounds/s; restrained level, short outdoor slap tail
ir_n = int(0.7 * SR); ir = noise(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.16); ir = lp(ir, 2500); ir /= np.abs(ir).sum() ** 0.5 * 6
def shot(close=1.0):
    n = int(0.16 * SR); t = np.arange(n) / SR
    crack = bp(noise(n), 400, 5200) * np.exp(-t / 0.012)
    body = lp(noise(n), 900) * np.exp(-t / 0.035) * 2.2
    thump = np.sin(2 * np.pi * 85 * t) * np.exp(-t / 0.04) * 0.9
    mech = bp(noise(n), 2500, 7000) * np.exp(-np.maximum(0, t - 0.03) / 0.006) * (t > 0.03) * 0.25
    s = crack * 0.8 + body + thump + mech
    s = s / np.max(np.abs(s))
    wet = fftconvolve(s, ir)[:int(0.6 * SR)]
    out = np.zeros(int(0.6 * SR)); out[:n] += s; out += wet * (1.2 - 0.6 * close)
    return out
def burst(t0, t1, level_db, p=-0.4, close=0.5):
    t = t0
    while t < t1:
        place(sfx, pan(shot(close), p + (rng.random() - .5) * 0.1), t, db(level_db) * (0.85 + 0.15 * rng.random()))
        # dirt impact out in the field, slightly later and quieter
        place(sfx, pan(bp(noise(int(0.08 * SR)), 300, 2500) * np.exp(-np.arange(int(0.08 * SR)) / SR / 0.02), -p * 0.8), t + 0.09, db(level_db - 16))
        t += 1 / 9.5
burst(1.10, 1.80, -9, -0.45)
burst(4.90, 5.70, -9, -0.45)
burst(19.88, 20.80, -7, -0.4)
burst(24.38, 24.92, -7, -0.1, close=1.0)

# mechanism: dry trigger clicks, cocking-handle clack
def click(bright=1.0):
    n = int(0.05 * SR); t = np.arange(n) / SR
    s = bp(noise(n), 1800, 8000) * np.exp(-t / 0.0035)
    for f in (2900, 4700, 6100): s += np.sin(2 * np.pi * f * t) * np.exp(-t / 0.012) * 0.25 * bright
    return s / np.max(np.abs(s))
def clack():
    n1 = int(0.11 * SR); t = np.arange(n1) / SR
    slide = bp(noise(n1), 1200, 5000) * (t / t[-1]) * 0.35
    return np.concatenate([slide, click(1.2) * 1.1, np.zeros(int(0.06 * SR)), click(0.8) * 0.8])
place(sfx, pan(click(), -0.05), 24.98, db(-9))
place(sfx, pan(clack(), -0.05), 25.40, db(-8))
place(sfx, pan(click(), -0.05), 25.95, db(-9))
for tc in (26.67, 27.33, 28.0):
    place(sfx, pan(clack(), -0.3), tc, db(-19))

# military truck: engine rumble (low fundamental + harmonics), approach → idle
def engine(dur, f0, f1, lvl0, lvl1):
    n = int(dur * SR); t = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1 + 0.02 * np.sin(2 * np.pi * 3.1 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(k * ph + rng.random() * 6) / k ** 0.8 for k in range(1, 9))
    s += 0.6 * lp(noise(n), 300) * (1 + np.sin(ph * 0.5))
    s = lp(s, 700) * np.linspace(db(lvl0), db(lvl1), n)
    fade = np.minimum(1, np.minimum(t / 0.25, (dur - t) / 0.35))
    return s / 4 * fade
place(sfx, pan(engine(1.6, 34, 42, -34, -16), -0.6), 15.15)
place(sfx, pan(engine(1.4, 30, 26, -18, -25), -0.2), 16.70)
for d in range(3):  # time-lapse repositioning
    t0 = 29.57 + d * 1.75 + 0.72 * 1.75
    place(sfx, pan(engine(0.55, 40, 44, -27, -27), -0.4 + 0.4 * d), t0)

# dust / whoosh transitions
def whoosh(dur, lo=200, hi=3000, up=True):
    n = int(dur * SR); t = np.arange(n) / SR; s = noise(n)
    out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        u = i / n; fc = (lo + (hi - lo) * (u if up else 1 - u))
        out[i:i + seg] = bp(s[i:i + seg], max(60, fc * 0.5), min(SR / 2 - 100, fc * 1.6), 1)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return lp(out, 6000) * e
for (tw, d, lv, up) in [(8.35, 0.85, -26, True), (10.95, 0.7, -28, False), (13.5, 0.4, -30, True), (17.85, 0.5, -27, True),
                        (21.2, 0.8, -24, True), (21.86, 0.22, -30, True), (22.5, 0.22, -30, False), (23.12, 0.22, -30, True),
                        (24.1, 0.45, -28, False), (26.38, 0.3, -30, True), (29.0, 0.6, -30, False), (34.8, 0.6, -30, True),
                        (38.5, 0.85, -29, True), (39.15, 0.4, -32, False)]:
    place(sfx, pan(whoosh(d, up=up), (rng.random() - .5) * 0.6), tw, db(lv))

# opening accent (first reveal): soft low hit + dust
def lowhit(dur=1.2, f=48):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t * (1 + 0.3 * np.exp(-t / 0.05))) * np.exp(-t / 0.35) + 0.3 * lp(noise(n), 200) * np.exp(-t / 0.15))
place(sfx, pan(lowhit(), 0), 0.0, db(-17))
place(sfx, pan(lowhit(1.4, 44), 0), 36.45, db(-16))  # Great Emu War reveal (with music hit)
place(sfx, pan(lowhit(0.8, 55), 0), 21.25, db(-24))  # scatter

# restrained comedic pizzicato (Karplus–Strong) when the emus escape / one looks back
def pluck(freq, dur=0.6):
    n = int(dur * SR); Lp = int(SR / freq); buf = rng.uniform(-1, 1, Lp); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % Lp]
        buf[i % Lp] = 0.5 * (buf[i % Lp] + buf[(i + 1) % Lp]) * 0.994
    return hp(out, 120) * np.exp(-np.arange(n) / SR / 0.25)
place(sfx, pan(pluck(392.0), 0.2), 21.34, db(-21))
place(sfx, pan(pluck(261.6), -0.2), 21.52, db(-21))
place(sfx, pan(pluck(329.6, 0.5), 0.3), 27.22, db(-24))

# footprints appear (soft dirt pats), notebook paper + pencil
for k in range(5): place(sfx, pan(step(0.8), 0.6 - k * 0.3), 34.05 + k * 0.13, db(-27))
def pencil_scratch(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    mod = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7.5 * t + np.sin(2 * np.pi * 1.3 * t) * 2))
    return bp(noise(n), 2500, 9000) * mod * np.minimum(1, np.minimum(t / 0.05, (dur - t) / 0.1))
place(sfx, pan(pencil_scratch(0.85), 0.0), 35.62, db(-31))
place(sfx, pan(pencil_scratch(0.75), 0.2), 37.12, db(-33))
place(sfx, pan(whoosh(0.45, 400, 5000), 0.0), 35.38, db(-30))  # page appears

# SFX duck slightly under speech
sfx *= db(-3.5 * speech)[:, None]

mix = music + sfx + np.stack([narr, narr], 1) * 1.0
peak = np.max(np.abs(mix)); print('peak before norm', 20 * np.log10(peak))
mix /= max(1.0, peak / 0.89)
out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
# stems for checking
for name, sig in (('music_stem.wav', music), ('sfx_stem.wav', sfx)):
    o = (np.clip(sig, -1, 1) * 32767).astype(np.int16)
    w = wave.open(os.path.join(os.path.dirname(sys.argv[2]), name), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(o.tobytes()); w.close()
print('done', len(out) / SR)
