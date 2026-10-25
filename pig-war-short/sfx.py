# Restrained procedural SFX bed for the Pig War short (48 kHz mono float -> wav)
import numpy as np, wave, sys
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000; DUR = 59.7
out = np.zeros(int(SR * DUR) + SR)
R = np.random.default_rng(7)

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
def db(d): return 10 ** (d / 20)
def noise(sec): return R.standard_normal(int(SR * sec))
def env(n, a, r, shape=4.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * shape / max(r, 1e-4)); return e
IR = noise(0.9) * np.exp(-np.arange(int(SR * 0.9)) / SR * 6); IR = lp(IR, 3500); IR /= np.abs(IR).sum() ** 0.5 * 4
def verb(x, wet=0.35): y = fftconvolve(x, IR)[:len(x) + len(IR)]; z = np.zeros(len(y)); z[:len(x)] = x * (1 - wet); return z + y * wet
def add(t, x, gain_db=0):
    i = int(t * SR); x = x * db(gain_db); j = min(len(out), i + len(x)); out[i:j] += x[:j - i]
def norm(x): return x / (np.abs(x).max() + 1e-9)

def snort(): n = noise(0.16); x = bp(n, 250, 900) * env(len(n), 0.01, 0.12, 5); x += bp(noise(0.16), 90, 200) * env(len(n), 0.01, 0.1, 6) * 0.6; return norm(x)
def chirp(f0=3200, f1=4400, d=0.09):
    t = np.arange(int(SR * d)) / SR; f = np.linspace(f0, f1, len(t)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.sin(np.pi * t / d) ** 2
def birdcall(): x = np.concatenate([chirp(3000 + R.random() * 800, 4200 + R.random() * 600, 0.07), np.zeros(int(SR * 0.04)), chirp(3600, 3000, 0.08)]); return x
def distant_shot():
    n = noise(0.5); x = lp(n, 700, 3) * env(len(n), 0.002, 0.12, 6) + lp(noise(0.5), 160) * env(int(SR * 0.5), 0.003, 0.2, 5) * 1.5
    return norm(verb(norm(x), 0.55))
def whoosh(d=0.7, lo=300, hi=2500):
    n = noise(d); t = np.arange(len(n)) / SR; x = bp(n, lo, hi) * np.sin(np.pi * t / d) ** 2; return norm(x)
def scratch(d=0.8):
    n = noise(d); t = np.arange(len(n)) / SR; m = 0.55 + 0.45 * np.sin(2 * np.pi * 11 * t + 3 * np.sin(2 * np.pi * 2.3 * t))
    return norm(bp(n, 2500, 7000) * m * np.minimum(1, np.minimum(t, d - t) * 20))
def thump(f=70, d=0.35):
    t = np.arange(int(SR * d)) / SR; x = np.sin(2 * np.pi * (f + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 9); return norm(x)
def drumroll(d=2.8):
    n = int(SR * d); x = np.zeros(n); t = 0.0
    while t < d - 0.05:
        k = noise(0.06); k = bp(k, 900, 5000) * env(len(k), 0.002, 0.05, 6); i = int(t * SR); x[i:i + len(k)] += k[:max(0, n - i)] * (0.3 + 0.7 * t / d)
        t += 1 / 15
    return norm(verb(x, 0.25))
def step(): k = noise(0.08); return norm(lp(k, 900) * env(len(k), 0.003, 0.06, 6))
def splash(): k = noise(0.45); t = np.arange(len(k)) / SR; return norm(bp(k, 400, 3500) * np.sin(np.pi * t / 0.45) ** 1.5 * np.exp(-t * 3))
def creak(d=1.0, f=180):
    t = np.arange(int(SR * d)) / SR; ff = f + 60 * np.sin(2 * np.pi * 0.7 * t); ph = 2 * np.pi * np.cumsum(ff) / SR
    saw = (ph / (2 * np.pi)) % 1 * 2 - 1; pulses = (np.sin(2 * np.pi * 26 * t) > 0.6).astype(float)
    x = bp(saw * pulses, 250, 1600) * np.sin(np.pi * t / d) ** 2; return norm(x)
def flutter(d=1.2):
    n = noise(d); t = np.arange(len(n)) / SR; m = 0.5 + 0.5 * np.sin(2 * np.pi * 9 * t) * np.sin(2 * np.pi * 1.3 * t)
    return norm(bp(n, 500, 3000) * m * np.sin(np.pi * t / d))
def clank(f=620):
    t = np.arange(int(SR * 0.5)) / SR; x = sum(np.sin(2 * np.pi * f * r * t) * np.exp(-t * (8 + 4 * k)) / (k + 1) for k, r in enumerate([1, 2.76, 5.4, 8.9]))
    return norm(x + bp(noise(0.5), 2000, 6000) * np.exp(-t * 60) * 0.5)
def rumble(d=0.9): n = noise(d); t = np.arange(len(n)) / SR; return norm(lp(n, 220) * np.sin(np.pi * t / d))
def heartbeat(): return norm(np.concatenate([thump(55, 0.25), np.zeros(int(SR * 0.08)), thump(50, 0.3) * 0.7]))
def water_bed(d):
    n = noise(d); t = np.arange(len(n)) / SR; m = 0.6 + 0.4 * np.sin(2 * np.pi * 0.18 * t) * np.sin(2 * np.pi * 0.07 * t + 1)
    return bp(n, 150, 1200) * m / 6
def wind(d): n = noise(d); t = np.arange(len(n)) / SR; return lp(n, 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.2 * t)) / 5
def paper(): return norm(bp(noise(0.35), 1500, 6000) * env(int(SR * 0.35), 0.02, 0.3, 4) * (0.5 + 0.5 * np.sign(np.sin(np.linspace(0, 60, int(SR * .35))))))

def fade(x, fi=0.4, fo=0.6):
    n = len(x); a = np.ones(n); i = int(fi * SR); o = int(fo * SR); a[:i] = np.linspace(0, 1, i); a[n - o:] = np.linspace(1, 0, o); return x * a

# --- scene 1
for t in (0.35, 0.62, 1.0): add(t, snort(), -24)
for t in (0.2, 1.7, 4.8, 12.6, 13.9, 15.2, 55.5, 57.6): add(t, birdcall(), -30)
add(1.5, whoosh(0.4, 200, 1200), -30)
add(2.30, distant_shot(), -17)
add(2.34, whoosh(0.8, 150, 900), -28)
add(3.35, drumroll(2.9), -27)
add(3.62, thump(), -20); add(4.45, thump(62), -20)
add(4.3, creak(1.2), -32)
# transitions 1->2, 2->3
add(6.4, whoosh(1.0, 400, 3000), -27); add(7.5, scratch(0.9), -31)
add(8.4, scratch(1.2), -29); add(9.0, scratch(1.2), -29)
add(11.5, whoosh(0.95, 400, 3000), -27)
# scene 3
add(15.95, whoosh(0.4, 200, 1200), -30)
add(16.85, distant_shot(), -17)
add(16.92, flutter(1.0), -26)
# scene 4
add(17.4, whoosh(0.5, 300, 2500), -29); add(18.45, thump(90, 0.25), -18); add(18.47, paper(), -26)
add(19.05, whoosh(0.7, 300, 2000), -28)
# scene 5
for i in range(8): add(22.4 + i * 0.19, step(), -28)
for i in range(9): add(24.35 + i * 0.16, step(), -27)
add(25.85, whoosh(0.7, 250, 2500), -24)
add(26.0, fade(water_bed(8.0)), -8)
for t in (26.2, 27.05, 27.9): add(t, splash(), -27)
for i in range(7): add(27.55 + i * 0.2, step(), -29)
add(28.0, flutter(1.4), -30)
# scene 6: warship reveals
for t in (29.75, 30.9, 31.95): add(t, thump(48, 0.6), -17); add(t + 0.1, creak(1.1, 150 + R.random() * 60), -28)
add(32.6, flutter(1.2), -31)
# scene 7: standoff
add(34.0, fade(water_bed(9.2)), -9)
add(35.85, rumble(0.9), -20); add(36.2, clank(540), -27); add(36.45, clank(610), -29)
add(37.6, creak(1.3, 160), -31)
for i in range(6): add(39.7 + i * 0.85, heartbeat(), -21)
# scene 8: nobody fires
for i in range(2): add(44.85 + i * 0.85, heartbeat(), -24)
add(45.05, clank(480), -30); add(45.2, whoosh(0.5, 200, 1000), -31)
add(45.85, whoosh(0.8, 400, 3500), -27)
add(46.25, paper(), -27); add(46.8, scratch(0.75), -27); add(47.75, whoosh(0.4, 200, 900), -33)
# scene 9
add(48.9, fade(wind(2.0)), -10)
add(50.9, scratch(0.9), -32)
add(52.25, whoosh(1.4, 200, 1500), -29)
# ending
add(54.9, fade(water_bed(4.8), 0.8, 1.5), -12)
add(55.4, flutter(1.6), -33)

out = out[:int(SR * DUR)]
out = np.clip(out, -1, 1)
w = wave.open(sys.argv[1], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
print('peak', np.abs(out).max())
