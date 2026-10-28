"""Synthesizes the subtle SFX bed for the Antikythera short (48 kHz stereo WAV).

Everything is generated procedurally so the sounds stay soft and organic:
underwater ambience, bubbles, bronze scrapes, gear clicks / mechanical ticking,
paper movement and a gentle bell-like accent for the astronomical reveals.
usage: python3 sfx.py out.wav duration_seconds
"""
import sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


class Bus:
    def __init__(self, dur):
        self.x = np.zeros((int(dur * SR) + SR, 2))

    def add(self, t, sig, gain_db=0.0, pan=0.0):
        i = int(t * SR)
        if i >= len(self.x):
            return
        sig = sig[: len(self.x) - i] * 10 ** (gain_db / 20)
        self.x[i:i + len(sig), 0] += sig * np.sqrt((1 - pan) / 2)
        self.x[i:i + len(sig), 1] += sig * np.sqrt((1 + pan) / 2)


def ambience(dur):
    n = int(dur * SR)
    brown = np.cumsum(rng.standard_normal(n))
    brown -= lp(brown, 2)  # remove drift
    x = lp(brown, 380, 4)
    t = np.arange(n) / SR
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * t) * np.sin(2 * np.pi * 0.07 * t + 1)
    return x / (np.abs(x).max() + 1e-9)


def bubble(size=1.0):
    d = 0.04 + 0.05 * size
    n = int(d * SR)
    t = np.arange(n) / SR
    f0 = rng.uniform(380, 900) / size
    f = f0 * np.exp(t * rng.uniform(9, 16))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return lp(np.sin(ph) * env(n, 0.002, d / 3.5), 2500)


def scrape(dur=0.45):
    n = int(dur * SR)
    g = bp(rng.standard_normal(n), 1300, 5200)
    grain = (rng.random(n) < 0.004).astype(float)
    grain = lp(np.convolve(grain, np.ones(120) / 120, 'same'), 60) * 40 + 0.35
    t = np.arange(n) / SR
    shape = np.sin(np.pi * np.minimum(1, t / dur)) ** 0.8
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.18) * a for f, a in [(1240, .5), (2710, .35), (4130, .2)])
    x = g * grain * shape + 0.25 * ring * shape
    return x / (np.abs(x).max() + 1e-9)


def click(pitch=1.0):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    burst = rng.standard_normal(n) * np.exp(-t / 0.0015)
    x = bp(burst, 1800 * pitch, 4200 * pitch) * 3 + np.sin(2 * np.pi * 190 * pitch * t) * np.exp(-t / 0.012) * 0.5
    return x / (np.abs(x).max() + 1e-9)


def paper(dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    crinkle = np.abs(lp(rng.standard_normal(n), 30)) * 6
    x = bp(rng.standard_normal(n), 900, 6500) * np.sin(np.pi * t / dur) ** 1.5 * (0.5 + crinkle)
    return x / (np.abs(x).max() + 1e-9)


def chime(f0=660.0, dur=3.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / dec) for r, a, dec in [(1, 1, 1.6), (2.76, .45, .8), (5.4, .2, .4), (8.93, .08, .25)])
    x *= np.minimum(1, t / 0.006)
    for _ in range(5):  # tiny twinkles
        o = rng.uniform(0.05, 0.9)
        k = int(o * SR)
        m = n - k
        tt = np.arange(m) / SR
        x[k:] += 0.12 * np.sin(2 * np.pi * rng.uniform(2400, 4200) * tt) * np.exp(-tt / 0.35) * np.minimum(1, tt / 0.004)
    return x / (np.abs(x).max() + 1e-9)


def ticking(bus, t0, t1, rate, gain, pan=0.0):
    t, k = t0, 0
    while t < t1:
        bus.add(t, click(1.15 if k % 2 else 0.9), gain + rng.uniform(-1.5, 1.5), pan)
        t += 1 / rate * rng.uniform(0.97, 1.03)
        k += 1


def main(out, dur):
    b = Bus(dur)
    amb = ambience(dur + 1)
    n = len(amb)
    t = np.arange(n) / SR
    # underwater: 0-13s, faint again in the final seabed scene
    level = np.interp(t, [0, 12.4, 13.1, 53.9, 54.8, dur - 1.2, dur], [1, 1, 0, 0, 0.55, 0.55, 0])
    b.add(0, amb * level, -27)

    # bubbles around the diver and the rising fragment
    for tt in np.arange(0.05, 12.9, 0.11):
        busy = 1.0 if tt < 5.2 or tt > 11.1 else 0.45
        if rng.random() < 0.55 * busy:
            b.add(tt + rng.uniform(0, 0.1), bubble(rng.uniform(0.6, 1.4)), -30 + rng.uniform(-4, 2), rng.uniform(-0.6, 0.6))
    for tt in np.arange(4.35, 5.0, 0.05):  # the escaping bubble that opens scene 2
        b.add(tt, bubble(1.6), -24, 0.1)
    for tt in np.arange(54.2, dur - 1, 0.35):
        if rng.random() < 0.5:
            b.add(tt, bubble(rng.uniform(0.7, 1.2)), -36, rng.uniform(-0.5, 0.5))

    # bronze
    b.add(0.12, scrape(0.5), -24, -0.2)
    b.add(12.85, scrape(0.4), -25, 0.0)
    b.add(15.25, scrape(0.3), -28, 0.2)
    b.add(17.1, scrape(0.6), -28, 0.0)

    # gears
    ticking(b, 0.3, 3.9, 6, -31, -0.2)
    for i in range(13):
        b.add(17.6 + i * 0.14, click(1.0 + 0.04 * (i % 4)), -27, rng.uniform(-0.5, 0.5))
    for i in range(16):
        b.add(20.2 + (i % 9) * 0.12 + rng.uniform(0, 0.04), click(1.2), -30, rng.uniform(-0.6, 0.6))
    ticking(b, 18.0, 22.9, 4, -33)
    for tt in (23.3, 23.9, 26.5, 28.8):
        b.add(tt, click(0.85), -27)
    ticking(b, 23.0, 32.3, 3, -34, 0.1)
    ticking(b, 39.0, 40.4, 2, -30, 0.2)  # medieval clock
    for i in range(9):
        b.add(44.7 + i * 0.32, click(1.0 + 0.05 * (i % 3)), -28, rng.uniform(-0.4, 0.4))
    ticking(b, 47.9, 53.6, 5, -32, 0.3)  # hand crank
    ticking(b, 54.2, dur - 1.0, 1.5, -36)

    # paper
    for tt, g in ((8.85, -27), (32.15, -25), (40.25, -30), (42.05, -30), (12.6, -32)):
        b.add(tt, paper(rng.uniform(0.45, 0.65)), g, rng.uniform(-0.3, 0.3))
    for tt in (33.5, 35.0, 36.5, 38.0):  # hourglass flips / centuries passing
        b.add(tt, paper(0.3), -36, -0.4)

    # astronomical reveal accents
    b.add(23.75, chime(660), -29, -0.2)
    b.add(29.65, chime(523.3), -28, 0.2)
    b.add(50.5, chime(587.3), -29, 0)
    b.add(55.6, chime(440, 3.6), -30, 0)

    x = b.x[: int(dur * SR)]
    sf.write(out, x.astype(np.float32), SR, subtype='FLOAT')
    print('peak dBFS', 20 * np.log10(np.abs(x).max() + 1e-12))


if __name__ == '__main__':
    main(sys.argv[1], float(sys.argv[2]))
