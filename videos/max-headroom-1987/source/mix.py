import numpy as np, wave, sys
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 76.5
N = int(DUR * SR)
rng = np.random.default_rng(1987)

def readwav(p):
    w = wave.open(p); n = w.getnframes(); d = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    return d.reshape(-1, w.getnchannels())
def db(x): return 10 ** (x / 20)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, btype='high', fs=SR, output='sos'), x)
def smooth(x, sec):
    k = max(1, int(sec * SR)); c = np.cumsum(np.concatenate([[0], x])); y = (c[k:] - c[:-k]) / k
    return np.concatenate([np.full(k // 2, y[0]), y, np.full(len(x) - len(y) - k // 2, y[-1])])

narr = readwav('narr.wav'); mus = readwav('mus.wav')
out_n = np.zeros((N, 2), np.float32); out_n[:len(narr)] = narr[:N]
out_m = np.zeros((N, 2), np.float32); out_m[:min(N, len(mus))] = mus[:N]

# ---------- music automation ----------
t = np.arange(N) / SR
# narration activity (gaps -> music rises)
env = np.sqrt(smooth(out_n[:, 0] ** 2, 0.08))
active = (env > db(-42)).astype(np.float32)
active = np.maximum.reduce([np.roll(active, s) for s in range(0, int(0.25 * SR), 2400)])  # hold
active = smooth(active, 0.35)
base = -12.7  # music ~11 dB under narration (~28%)
auto = np.zeros(N)
def seg(a, b, v, ramp=0.4):
    auto[:] += v * np.clip(np.minimum((t - a) / ramp + 1, (b - t) / ramp + 1), 0, 1)
seg(0.0, 1.6, 2.5, 0.01)          # hook accent
seg(12.2, 14.4, 1.5)              # first hijack
seg(14.3, 18.2, 0.6)              # stranger
seg(22.3, 26.0, -2.5, 0.8)        # relief / false end
seg(26.1, 30.4, 0.8, 1.2)         # builds again
seg(30.4, 33.6, 2.0)              # strongest tension
seg(35.2, 37.0, 1.2)
seg(38.5, 42.0, 0.6)              # uncomfortable pulse
seg(42.4, 49.5, -1.2)             # dense narration
seg(50.4, 53.4, -0.8)             # investigative
seg(54.0, 57.6, -1.0)             # dense
seg(57.6, 60.4, -3.0, 0.7)        # pull back
seg(60.8, 69.4, -1.0)             # dense long sentence
seg(70.3, 73.7, 1.2)              # final line fuller
gap_boost = 2.5 * (1 - active)
gain_db = base + auto + gap_boost
gain_db = np.minimum(gain_db, base + 3.2)  # cap peaks ~35%
gain_db = smooth(smooth(gain_db, 0.25), 0.25)
fade = np.clip((DUR - 0.05 - t) / 1.8, 0, 1) ** 1.5
out_m *= (db(gain_db) * fade)[:, None]

# ---------- SFX ----------
sfx = np.zeros((N, 2), np.float32)
def put(sig, at, lvl, pan=0.0):
    i = int(at * SR); sig = sig[:max(0, N - i)]
    sig = sig / (np.max(np.abs(sig)) + 1e-9) * db(lvl)
    sfx[i:i + len(sig), 0] += sig * (1 - max(0, pan)); sfx[i:i + len(sig), 1] += sig * (1 + min(0, pan))
def envAD(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
def static(d):
    n = int(d * SR); x = rng.standard_normal(n); x = bp(x, 900, 9000)
    crack = (rng.random(n) > 0.9993) * rng.standard_normal(n) * 6; x += hp(crack, 2000)
    am = 0.7 + 0.3 * np.sin(2 * np.pi * 60 * np.arange(n) / SR)
    return x * am * envAD(n, 0.01, min(0.15, d * 0.4))
def tracking(d):
    n = int(d * SR); x = lp(rng.standard_normal(n), 2500); tt = np.arange(n) / SR
    am = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 29.97 * tt / 2)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tt))
    buzz = 0.25 * np.sign(np.sin(2 * np.pi * 59.94 * tt)) ; buzz = lp(buzz, 700)
    return (x * am + buzz) * envAD(n, 0.2, 0.3)
def hum(d):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 60 * tt) + 0.5 * np.sin(2 * np.pi * 120 * tt) + 0.3 * np.sin(2 * np.pi * 180 * tt)) * envAD(n, 0.5, 0.8)
def click(f=2500, d=0.04):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * 0.6 + rng.standard_normal(n) * 0.5) * np.exp(-tt * 120)
def thud(f=70, d=0.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt * (1 - tt)) * np.exp(-tt * 14) + lp(rng.standard_normal(n), 600) * np.exp(-tt * 30) * 0.5
def paper(d=0.45):
    n = int(d * SR); x = bp(rng.standard_normal(n), 1800, 7000); tt = np.arange(n) / SR
    am = np.abs(smooth(rng.standard_normal(n), 0.012)) * 10 * np.sin(np.pi * tt / d) ** 0.7
    return x * am
def warble(d=0.7):
    n = int(d * SR); tt = np.arange(n) / SR
    f = 520 - 300 * tt / d + 40 * np.sin(2 * np.pi * 9 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * envAD(n, 0.05, 0.2) + 0.3 * bp(rng.standard_normal(n), 300, 3000)
def gibberish(d):
    n = int(d * SR); tt = np.arange(n) / SR
    src = np.sign(np.sin(2 * np.pi * (115 + 25 * np.sin(2 * np.pi * 1.3 * tt)) * tt)) + 0.4 * rng.standard_normal(n)
    out = np.zeros(n); blk = int(0.03 * SR)
    for i in range(0, n, blk):
        k = i // blk; f1 = 400 + 500 * abs(np.sin(k * 1.7)); f2 = 1200 + 900 * abs(np.sin(k * 0.9 + 1))
        seg_ = src[i:i + blk]; out[i:i + blk] = bp(seg_, f1 * 0.8, f1 * 1.25, 1) + 0.6 * bp(seg_, f2 * 0.85, f2 * 1.2, 1)
    syl = (np.sin(2 * np.pi * 4.6 * tt + np.sin(2 * np.pi * 0.8 * tt) * 2) > -0.2).astype(float)
    syl = smooth(syl, 0.02)
    out = out * syl; out = np.round(out * 6) / 6  # crushed
    return lp(out, 3500) * envAD(n, 0.1, 0.3)
def whoosh(d=1.4):
    n = int(d * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n)
    return lp(x, 900) * np.sin(np.pi * tt / d) ** 2

# ambience bed
put(lp(rng.standard_normal(N), 400) * 0.5 + 0.2 * hum(DUR), 0, -46)
# CRT switch-on
put(thud(55, 0.25), 0.0, -30); put(np.sin(2 * np.pi * 7800 * np.arange(int(0.6 * SR)) / SR) * envAD(int(0.6 * SR), 0.01, 0.5), 0.02, -46)
# hums while TVs on
for a, b in [(0, 23.9), (23.9, 33.1), (33.1, 50.0), (60.7, 76.5)]: put(hum(b - a), a, -44)
# statics
for at, d, l in [(0.33, 0.55, -23), (7.15, 0.6, -32), (12.35, 0.62, -26), (13.55, 0.6, -33), (18.3, 0.6, -32), (21.95, 0.45, -29),
                 (23.65, 0.6, -36), (25.2, 0.75, -40), (30.6, 1.7, -25), (32.8, 0.6, -31), (33.1, 0.5, -34), (35.9, 0.35, -28), (37.85, 0.6, -32),
                 (41.75, 0.6, -33), (48.4, 0.28, -25), (49.7, 0.6, -30), (53.4, 0.6, -36), (60.4, 0.6, -31), (62.5, 0.3, -36), (64.7, 0.3, -36), (67.0, 0.3, -36), (69.6, 0.6, -35),
                 (70.2, 0.3, -38), (72.0, 0.3, -40), (73.6, 0.3, -38)]:
    put(static(d), at, l, pan=(rng.random() - 0.5) * 0.4)
put(static(2.5) * np.linspace(1, 0, int(2.5 * SR)), 74.0, -40)
# tracking noise during pirate
for a, b, l in [(0.85, 7.45, -38), (12.95, 18.6, -38), (18.6, 22.25, -42), (35.95, 48.4, -37), (60.7, 69.9, -42), (69.9, 76.3, -44)]:
    put(tracking(b - a), a, l)
# warble / bend
put(warble(0.7), 11.75, -33)
put(warble(0.9), 35.3, -33)
# distorted speech texture
for a, b, l in [(14.3, 18.1, -37), (38.6, 41.5, -38), (42.5, 48.35, -33)]: put(gibberish(b - a), a, l)
# control room buttons
for i, at in enumerate([19.1, 19.45, 19.9, 20.35, 20.8, 21.25, 21.65, 22.05]): put(click(1800 + (i % 3) * 600), at, -31, pan=0.35)
put(thud(90, 0.2), 22.3, -31, pan=0.3)
# clock ticks
for k in range(4): put(click(3200, 0.02), 24.1 + k * 0.5, -36)
tick = 26.2; step = 0.32
while tick < 28.4: put(click(3400, 0.015), tick, -37); tick += step; step = max(0.05, step * 0.85)
# stopwatch
for k in range(16): put(click(4200, 0.012), 38.2 + k * 0.25, -40)
# paper / folder
for at in [50.15, 50.5, 51.0, 51.5, 51.95, 52.4]: put(paper(0.45), at, -33, pan=(rng.random() - 0.5) * 0.6)
put(thud(80, 0.2), 52.4, -36)
put(whoosh(1.6), 55.1, -36)
put(paper(0.6), 58.3, -33); put(thud(65, 0.35), 59.0, -30); put(thud(110, 0.25), 59.55, -27)
# VHS / tape clicks in decades scene
put(click(1500, 0.05), 62.55, -32); put(thud(75, 0.3), 62.75, -32); put(click(1900, 0.05), 64.75, -34); put(click(2400, 0.04), 67.05, -34)
put(click(1200, 0.06), 70.0, -34)

out_s = sfx * db(4)
def lufs_rough(x):  # K-weight approx via highpass + simple energy
    y = hp(x[:, 0] + x[:, 1], 100); return 10 * np.log10(np.mean(y ** 2) + 1e-12)
print('narr', lufs_rough(out_n), 'music', lufs_rough(out_m), 'sfx', lufs_rough(out_s))
mix = out_n + out_m + out_s
for name, arr in [('mix', mix), ('music_only', out_m), ('sfx_only', out_s)]:
    a = np.clip(arr, -1, 1); w = wave.open(name + '.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((a * 32767).astype(np.int16).tobytes()); w.close()
# dump gain curve summary
for s in [0, 1, 5, 7.5, 12.5, 16, 20, 23, 25, 28, 31, 36, 40, 45, 52, 56, 59, 65, 71, 74, 76]:
    print(f'{s:5.1f}s music gain {gain_db[int(s*SR)]:6.2f} dB')
