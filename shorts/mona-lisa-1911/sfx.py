# Synthesises the restrained SFX bed (no samples needed) -> out/sfx.wav
import numpy as np
from scipy.signal import butter, sosfilt
import wave

SR = 48000
DUR = 65.5
rng = np.random.default_rng(7)
bus = np.zeros(int(SR * DUR))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)


def noise(d):
    return rng.standard_normal(int(SR * d))


def norm(x):
    m = np.abs(x).max()
    return x / m if m > 0 else x


def add(t, x, db):
    i = int(t * SR)
    if i >= len(bus):
        return
    x = x[: len(bus) - i]
    bus[i:i + len(x)] += x * 10 ** (db / 20)


def env(n, a=0.002, d=0.08):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def fade(x, fi=0.05, fo=0.05):
    n = len(x); e = np.ones(n)
    a, b = min(int(fi * SR), n // 2), min(int(fo * SR), n // 2)
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[-b:] = np.linspace(1, 0, b)
    return x * e


# ---------------- sound makers ----------------
def footstep(soft=1.0):
    n = noise(0.12)
    x = bp(n, 70, 380) * env(len(n), 0.003, 0.035) * 1.0 + hp(n, 2500) * env(len(n), 0.001, 0.008) * 0.35 * soft
    return norm(x)


def steps(t0, t1, every, db, jitter=0.03, echo=False):
    t = t0; k = 0
    while t < t1:
        s = footstep()
        if echo:
            s = np.concatenate([s, np.zeros(int(0.5 * SR))])
            for dly, g in [(0.11, 0.35), (0.23, 0.18), (0.37, 0.08)]:
                i = int(dly * SR); s[i:i + len(footstep())] += footstep() * g
        add(t, s, db - (2 if k % 2 else 0))
        t += every + rng.uniform(-jitter, jitter); k += 1


def rustle(d, lo=1800, hi=8000):
    n = noise(d)
    x = bp(n, lo, hi)
    m = np.abs(lp(rng.standard_normal(len(n)), 30)); m = m / m.max()
    crack = (rng.random(len(n)) < 0.002) * rng.standard_normal(len(n)) * 3
    x = x * (0.3 + m) + bp(crack, 2000, 9000)
    return fade(norm(x), 0.04, 0.12)


def pencil(d, rate=7.0):
    n = noise(d)
    x = bp(n, 2500, 9000)
    t = np.arange(len(n)) / SR
    strokes = np.abs(np.sin(np.pi * rate * t + 0.6 * np.sin(2.3 * t))) ** 1.5
    grain = 0.6 + 0.4 * np.abs(lp(rng.standard_normal(len(n)), 200)) * 4
    return fade(norm(x * strokes * np.clip(grain, 0, 1.5)), 0.03, 0.08)


def knock(f=190, d=0.25):
    t = np.arange(int(d * SR)) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.7 * t)) * np.exp(-t / 0.045)
    x += bp(noise(d), 800, 4000) * np.exp(-t / 0.006) * 0.6
    return norm(x)


def press_clacks(t0, t1, db, every=0.26):
    t = t0; k = 0
    while t < t1:
        n = noise(0.07)
        c = bp(n, 900, 3500) * env(len(n), 0.001, 0.012)
        th = lp(noise(0.12), 160) * env(int(0.12 * SR), 0.002, 0.04)
        x = np.zeros(int(0.12 * SR)); x[:len(c)] += norm(c) * 0.7; x += norm(th) * (0.8 if k % 2 == 0 else 0.4)
        add(t, x, db)
        t += every; k += 1


def shutter():
    x = np.zeros(int(0.2 * SR))
    for dly, g in [(0.0, 1.0), (0.065, 0.7)]:
        n = noise(0.012); c = hp(n, 1800) * env(len(n), 0.0005, 0.003)
        i = int(dly * SR); x[i:i + len(c)] += norm(c) * g
    m = bp(noise(0.06), 400, 1500) * env(int(0.06 * SR), 0.002, 0.015)
    x[int(0.01 * SR):int(0.01 * SR) + len(m)] += norm(m) * 0.3
    return x


def door(close=True):
    d = 0.55
    t = np.arange(int(d * SR)) / SR
    f = 260 + 140 * np.sin(np.pi * t / d) + 30 * np.sin(2 * np.pi * 23 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    creak = np.sign(np.sin(ph)) * 0.3 + np.sin(ph)
    creak = bp(creak, 200, 2000) * np.sin(np.pi * t / d) ** 2 * 0.25
    x = np.concatenate([creak, np.zeros(int(0.25 * SR))])
    if close:
        th = knock(110, 0.25) * 0.8
        x[int(0.5 * SR):int(0.5 * SR) + len(th)] += th
    return norm(x)


def pluck(freq, d=1.2, bright=0.5):
    t = np.arange(int(d * SR)) / SR
    x = sum((bright ** (h - 1)) * np.sin(2 * np.pi * freq * h * t) * np.exp(-t * (2.5 + h * 1.5)) for h in range(1, 7))
    return norm(x * np.minimum(1, t / 0.003))


def accent(notes, gap=0.12, bright=0.45):
    out = np.zeros(int(SR * (gap * len(notes) + 1.5)))
    for i, f in enumerate(notes):
        p = pluck(f, 1.3, bright); j = int(i * gap * SR); out[j:j + len(p)] += p * (0.8 ** i)
    return norm(out)


def chime(freqs=(1318.5, 1760, 2637), d=1.6):
    t = np.arange(int(d * SR)) / SR
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (2 + i)) for i, f in enumerate(freqs))
    return norm(x * np.minimum(1, t / 0.002))


def tear():
    n = noise(0.22)
    t = np.arange(len(n)) / SR
    crackle = (rng.random(len(n)) < 0.02) * rng.standard_normal(len(n))
    x = bp(n * 0.4 + crackle * 2, 1200, 7000) * np.sin(np.pi * t / 0.22) ** 0.5
    return fade(norm(x), 0.005, 0.05)


def ambience(d, lvl_murmur=0.0):
    n = noise(d)
    room = lp(n, 500) * 0.5 + bp(rng.standard_normal(len(n)), 120, 300) * 0.3
    x = room
    if lvl_murmur:
        m = bp(rng.standard_normal(len(n)), 250, 1100)
        mod = np.abs(lp(rng.standard_normal(len(n)), 6)); mod /= mod.max()
        x = x + m * mod * lvl_murmur
    return fade(norm(x), 0.8, 0.8)


def train(d):
    n = noise(d)
    t = np.arange(len(n)) / SR
    rumble = lp(n, 180, 4) * (1 + 0.15 * np.sin(2 * np.pi * 9 * t))
    x = norm(rumble) * 0.8
    k = 0.0
    while k < d - 0.2:
        for dd in (0.0, 0.11):
            i = int((k + dd) * SR); c = knock(95, 0.18) * 0.55; x[i:i + len(c)] += c[:len(x) - i]
        k += 0.62
    return fade(norm(x), 0.5, 0.6)


def whoosh(d=0.7):
    n = noise(d); t = np.arange(len(n)) / SR
    x = bp(n, 400, 3000) * np.sin(np.pi * t / d) ** 2
    return norm(x)


# ---------------- timeline ----------------
for a, b, mur in [(0, 10.5, 0.35), (14.8, 17.5, 0.6), (33.0, 40.1, 0.0), (52.9, 65.5, 0.4)]:
    add(a, ambience(b - a, mur), -40)

# Scene 1
add(0.0, knock(170, 0.3), -26)
steps(1.45, 2.0, 0.28, -27)
steps(3.95, 5.0, 0.3, -27)
add(5.13, accent([659.3, 987.8], 0.1, 0.35), -24)
add(6.0, pencil(1.2), -30)
steps(7.5, 8.7, 0.3, -29)
# Scene 2
steps(7.8, 8.6, 0.28, -28)
steps(8.0, 8.9, 0.27, -30)
steps(8.1, 10.5, 0.17, -33)
add(9.05, knock(210, 0.25), -29)
add(10.2, rustle(0.9), -27)
press_clacks(11.3, 12.95, -30)
for tt in [12.0, 12.5, 13.1, 13.7, 14.1]:
    add(tt, rustle(0.5), -32)
add(14.6, whoosh(0.7) * 0.5 + rustle(0.7) * 0.5, -26)
steps(15.4, 16.7, 0.35, -36, echo=True)
# Scene 3
add(16.8, rustle(0.6), -30)
for k in range(14):
    add(17.0 + k * 0.16, knock(2400, 0.03), -40)
for tt in [17.2, 17.5, 17.8, 18.1, 18.35]:
    add(tt, knock(900, 0.06), -36)
for tt in [17.0, 17.45, 17.9, 18.35]:
    add(tt, rustle(0.15, 2500, 9000), -34)
steps(19.75, 22.0, 0.24, -30, jitter=0.05)
add(21.5, door(close=True), -28)
# Scene 4
add(22.6, rustle(0.7), -31)
add(23.6, pencil(1.4), -30)
add(24.6, rustle(0.6), -32)
add(24.95, pencil(0.5, 3.0), -29)
add(25.33, accent([783.99, 1174.66, 1567.98], 0.09, 0.45), -22)
steps(26.55, 27.25, 0.28, -29)
add(27.5, rustle(0.25, 2500, 9000), -31)
# Scene 5
add(28.6, rustle(0.7), -31)
add(30.0, pencil(0.9, 9.0), -27)
add(31.3, rustle(0.7, 1200, 6000), -30)
add(32.3, knock(140, 0.2) * 0.6 + rustle(0.2) * 0.4, -27)
add(32.9, rustle(0.7), -32)
# Scene 6
add(34.1, whoosh(0.8), -33)
steps(34.4, 36.7, 0.43, -28, echo=True)
add(36.7, shutter(), -24)
add(38.0, rustle(0.25, 2500, 9000), -34)
add(38.75, rustle(0.6, 500, 3000), -31)
steps(39.25, 40.4, 0.43, -30, echo=True)
# Scene 7
add(39.95, door(close=False), -30)
steps(40.25, 41.0, 0.27, -29)
add(40.9, door(close=False)[: int(0.45 * SR)] * 0.6, -33)
add(41.1, rustle(0.35, 500, 3000), -31)
add(41.62, knock(120, 0.3), -25)
add(42.0, whoosh(0.5), -34)
for tt in [42.6, 43.1, 43.6]:
    add(tt, rustle(0.4), -33)
add(44.25, tear(), -27)
add(45.15, tear(), -27)
add(46.45, whoosh(0.7), -32)
# Scene 8
add(46.8, train(2.4), -27)
steps(48.9, 49.6, 0.3, -31)
add(49.4, door(close=True), -31)
add(49.9, rustle(0.6, 500, 3000), -29)
steps(51.2, 51.9, 0.3, -29)
add(52.1, chime(), -30)
add(53.25, shutter(), -25)
add(53.75, shutter(), -26)
# Scene 9
add(53.85, whoosh(0.8) * 0.5 + rustle(0.8) * 0.5, -27)
press_clacks(54.95, 56.1, -32, every=0.2)
for k in range(8):
    add(55.0 + k * 0.14, rustle(0.12, 2500, 9000), -36)
steps(56.2, 57.2, 0.2, -36)
for k in range(5):
    add(57.3 + k * 0.1, rustle(0.1, 2500, 9000), -33)
add(58.4, rustle(0.6), -32)
add(59.1, shutter(), -27)
add(59.7, shutter(), -28)
# Scene 10
add(60.3, rustle(0.6), -33)
add(62.35, pencil(0.6, 2.0), -30)

bus = np.clip(bus, -1, 1)
pcm = (bus * 32767).astype(np.int16)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('peak dBFS', 20 * np.log10(np.abs(bus).max() + 1e-9))
