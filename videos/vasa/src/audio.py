"""Audio for the Vasa episode: narration (master) + rearranged supplied music + synthesized restrained SFX."""
import subprocess, sys, math
import numpy as np
from scipy import signal

SR = 48000
UP = '/root/.claude/uploads/b2155809-548e-5020-80c4-2f4a44685df9/'
NARR = UP + '537dcb59-gemi.mp3'
MUSIC = UP + '094cd11c-The_Great_Molasses_Flood.mp3'
VIDEO_END = 38.80
N = int(VIDEO_END * SR)
rng = np.random.default_rng(1628)


def load(path, ch):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).astype(np.float64)
    return a.reshape(-1, ch) if ch > 1 else a


def db(x):
    return 10 ** (x / 20)


def env_ar(n, a, r, sus=0.0, curve=1.0):
    a_n = max(1, int(a * SR)); s_n = int(sus * SR); r_n = max(1, int(r * SR))
    e = np.concatenate([np.linspace(0, 1, a_n) ** curve, np.ones(s_n), np.linspace(1, 0, r_n) ** 2])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)


def pink(n):
    w = rng.standard_normal(n)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w) * 3


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


class Bus:
    def __init__(self):
        self.L = np.zeros(N); self.R = np.zeros(N)

    def add(self, x, t0, gain_db=0.0, pan=0.0):
        i = int(t0 * SR)
        if i >= N:
            return
        x = x[:N - i] * db(gain_db)
        gl = math.cos((pan + 1) * math.pi / 4); gr = math.sin((pan + 1) * math.pi / 4)
        self.L[i:i + len(x)] += x * gl * 1.414
        self.R[i:i + len(x)] += x * gr * 1.414


# ------------------------------------------------------------------ SFX synth
def creak(dur, f0, f1, res, q=6, rough=0.25):
    """stick-slip wood creak: impulse train with gliding rate through resonant filters"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * (t / dur) + rough * f0 * np.sin(2 * np.pi * 3.1 * t) * rng.uniform(0.5, 1)
    ph = np.cumsum(f / SR)
    imp = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.6 + 0.4 * rng.random(n))
    out = np.zeros(n)
    for r in res:
        b, a = signal.iirpeak(r, q, fs=SR)
        out += signal.lfilter(b, a, imp)
    out += bp(rng.standard_normal(n), res[0] * 0.8, res[0] * 1.6) * 0.03
    e = env_ar(n, dur * 0.25, dur * 0.4, dur * 0.35, 1.5)
    return norm(out * e)


def groan(dur, f0=28, f1=40):
    return creak(dur, f0, f1, [160, 260, 420], q=4, rough=0.35)


def rope(dur):
    return creak(dur, 150, 230, [1300, 2100], q=8, rough=0.15)


def thud(depth=60, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * depth * t * (1 - 0.3 * t / dur)) * np.exp(-t * 9)
    s += lp(rng.standard_normal(n), 900) * np.exp(-t * 40) * 0.6
    s += bp(rng.standard_normal(n), 250, 700) * np.exp(-t * 25) * 0.4   # wooden knock
    return norm(s)


def chime(f=1568, dur=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * d) for m, a, d in [(1, 1, 5), (2.76, 0.4, 8), (5.4, 0.15, 12)])
    return norm(s * (1 - np.exp(-t * 400)))


def whoosh(dur, f0, f1, peak=0.5):
    n = int(dur * SR); x = rng.standard_normal(n)
    out = np.zeros(n); blk = 1024
    for i in range(0, n, blk):
        u = i / n; fc = f0 + (f1 - f0) * u
        seg = x[max(0, i - 2048):i + blk]
        y = bp(seg, max(40, fc * 0.6), min(SR / 2 - 100, fc * 1.6))
        out[i:i + blk] = y[-len(out[i:i + blk]):]
    e = env_ar(n, dur * peak, dur * (1 - peak), 0, 2)
    return norm(out * e)


def flap(dur, rate=14, intensity=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    am = (0.5 + 0.5 * np.sin(2 * np.pi * (rate + 3 * np.sin(2 * np.pi * 0.7 * t)) * t)) ** 3
    x = bp(rng.standard_normal(n), 180, 2200) * am
    return norm(x * env_ar(n, 0.15, 0.4, dur - 0.55))


def water_rush(dur, a=0.6, r=0.8, bright=3500):
    n = int(dur * SR); t = np.arange(n) / SR
    x = bp(pink(n), 300, bright, 2)
    gurgle = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 5.3 * t + 2 * np.sin(2 * np.pi * 1.1 * t)))
    return norm(x * gurgle * env_ar(n, a, r, max(0, dur - a - r)))


def splash(dur=1.6, size=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 1600 + 800 * size) * (np.exp(-t * 5) * (1 - np.exp(-t * 60)))
    x += np.sin(2 * np.pi * 48 * t) * np.exp(-t * 6) * 0.8 * size
    x += lp(rng.standard_normal(n), 3000) * np.exp(-((t - 0.45) ** 2) / 0.05) * 0.25   # falling water
    return norm(x)


def bubbles(dur, rate=8, lowpass=1800):
    n = int(dur * SR); out = np.zeros(n)
    k = int(dur * rate)
    for _ in range(k):
        i = rng.integers(0, max(1, n - 4000)); L = rng.integers(900, 2600)
        tt = np.arange(L) / SR
        f = rng.uniform(250, 700) * (1 + 3 * tt / tt[-1])
        out[i:i + L] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 40) * rng.uniform(0.3, 1)
    return norm(lp(out, lowpass))


def drips(dur, rate=10):
    n = int(dur * SR); out = np.zeros(n)
    for _ in range(int(dur * rate)):
        i = rng.integers(0, max(1, n - 3000)); L = 1500
        tt = np.arange(L) / SR
        f = rng.uniform(1200, 2600) * (1 + 0.8 * tt / tt[-1])
        out[i:i + L] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 90) * rng.uniform(0.3, 1)
    return norm(out)


def clinks(dur, rate=5):
    n = int(dur * SR); out = np.zeros(n)
    for j in range(int(dur * rate)):
        i = int(j / rate * SR + rng.uniform(0, 0.05) * SR); L = 4000
        if i + L > n:
            break
        tt = np.arange(L) / SR
        out[i:i + L] += sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in [(1230, 50), (2950, 70), (4120, 90), (5600, 110)]) * rng.uniform(0.4, 1)
    return norm(out)


def winch(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 52 + 6 * t / dur
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    x = lp(saw, 420) + 0.25 * bp(rng.standard_normal(n), 800, 1600) * (0.5 + 0.5 * np.sin(2 * np.pi * f * 2 * t))
    return norm(x * env_ar(n, 0.3, 0.5, dur - 0.8))


def babble(dur, voices=18, bright=1400):
    """distant crowd murmur (no words, no screaming)"""
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for v in range(voices):
        f1 = rng.uniform(380, 750); f2 = rng.uniform(900, 1700)
        src = rng.standard_normal(n)
        y = bp(src, f1 * 0.8, f1 * 1.25) + 0.6 * bp(src, f2 * 0.85, f2 * 1.2)
        rate = rng.uniform(2.5, 5.5)
        am = np.clip(np.sin(2 * np.pi * rate * t + rng.uniform(0, 6.28)) + rng.uniform(-0.2, 0.4), 0, None) ** 1.5
        am *= np.clip(np.sin(2 * np.pi * rng.uniform(0.15, 0.4) * t + rng.uniform(0, 6.28)) + 0.4, 0, None)
        out += y * am
    return norm(lp(out, bright))


def ambience_water(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(pink(n), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t) * np.sin(2 * np.pi * 0.61 * t + 1))
    laps = np.zeros(n)
    for _ in range(int(dur * 1.3)):
        i = rng.integers(0, n - 20000); L = rng.integers(8000, 16000)
        tt = np.linspace(0, 1, L)
        laps[i:i + L] += bp(rng.standard_normal(L), 250, 1300) * np.sin(np.pi * tt) ** 2 * rng.uniform(0.3, 1)
    return norm(x + 0.5 * laps)


def wind_bed(dur, base=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(pink(n), 380) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * t + 0.5))
    return norm(x)


def underwater(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(pink(n), 220, 4) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.11 * t))
    return norm(x)


def fade_edges(x, a=0.3, r=0.6):
    n = len(x); e = np.ones(n)
    ai = int(a * SR); ri = int(r * SR)
    e[:ai] = np.linspace(0, 1, ai); e[n - ri:] = np.linspace(1, 0, ri)
    return x * e


# ------------------------------------------------------------------ music arrangement (bar aligned, 136.6 BPM)
SEGS = [(0.00, 3.24, 20.81), (17.57, 22.56, 26.96), (21.97, 11.15, 24.32), (35.14, 27.83, 30.048)]


def build_music():
    m = load(MUSIC, 2)
    out = np.zeros((N, 2))
    xf = int(0.09 * SR)
    for k, (v0, o0, o1) in enumerate(SEGS):
        i0 = int(v0 * SR); j0 = int(o0 * SR); j1 = int(o1 * SR)
        pre = xf // 2 if k > 0 else 0
        post = xf // 2 if k < len(SEGS) - 1 else 0
        a = max(0, j0 - pre); b = min(len(m), j1 + post)
        seg = m[a:b].copy()
        L = len(seg)
        g = np.ones(L)
        if pre:
            g[:2 * pre] = np.sin(np.linspace(0, np.pi / 2, 2 * pre))       # equal-power in
        else:
            g[:int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
        if post:
            g[L - 2 * post:] = np.cos(np.linspace(0, np.pi / 2, 2 * post))  # equal-power out
        seg *= g[:, None]
        start = i0 - pre
        e = min(N, start + L)
        out[start:e] += seg[:e - start]
    # soft tail after the track ends
    endi = int((35.14 + (30.048 - 27.83)) * SR)
    tail = out[endi - int(0.6 * SR):endi].copy()
    return out, endi


def main():
    narr = load(NARR, 1)
    narr_full = np.zeros(N); narr_full[:len(narr)] = narr
    music, music_end = build_music()

    # ---- narration loudness reference (rms over speech)
    win = int(0.05 * SR)
    pw = np.convolve(narr_full ** 2, np.ones(win) / win, 'same')
    speech = pw > (np.max(pw) * 0.004)
    # ducking envelope: smooth speech mask (attack 60 ms, release 350 ms)
    mask = speech.astype(float)
    duck = np.zeros(N); g = 0.0
    att = 1 - math.exp(-1 / (0.06 * SR)); rel = 1 - math.exp(-1 / (0.35 * SR))
    for i in range(0, N, 32):
        target = mask[i]
        g += (target - g) * (att if target > g else rel) * 32
        g = min(1, max(0, g))
        duck[i:i + 32] = g
    # ---- music gain automation (dB relative), narrative-driven
    auto = np.zeros(N)
    pts = [(0, 0), (7.6, 0), (8.0, 0.5), (15.4, -1.0), (17.5, 1.5), (19.0, 1.0), (21.9, 0.5), (22.2, 2.0), (26.5, 2.5), (28.6, 3.0),
           (29.6, 0), (30.3, -3.5), (32.0, -3.5), (33.3, 2.5), (35.2, 1.5), (35.6, 2.5), (37.4, 0)]
    xs = [p[0] * SR for p in pts]; ys = [p[1] for p in pts]
    auto = np.interp(np.arange(N), xs, ys)
    narr_rms = math.sqrt(np.mean(narr_full[speech] ** 2))
    mus_mono = music.mean(1)
    mus_rms = math.sqrt(np.mean(mus_mono[:music_end] ** 2))
    base = 20 * math.log10(narr_rms / mus_rms) - 13.5          # music ~13.5 dB under narration in gaps
    mg = db(base + auto - 4.0 * duck)                            # extra 4 dB duck under speech
    music *= mg[:, None]

    sfx = Bus()
    # ---- ambience beds
    harb = ambience_water(VIDEO_END)
    hmask = np.interp(np.arange(N) / SR, [0, 7.5, 8.2, 15.3, 15.8, 29.6, 30.2, 33.2, 33.5, VIDEO_END - 0.6, VIDEO_END],
                      [1, 1, 0, 0, 1, 1, 0, 0, 1, 0.8, 0])
    sfx.add(harb * hmask, 0, -27, -0.2)
    sfx.add(harb[::-1] * hmask, 0, -29, 0.3)
    wb = wind_bed(VIDEO_END)
    wmask = np.interp(np.arange(N) / SR, [0, 7.6, 8.0, 15.4, 15.9, 17.8, 18.4, 20.8, 22.0, 24.7, 25.2, 29.6, 30.0], [1, 1, 0.2, 0.2, 0.8, 0.8, 2.2, 1.6, 0.6, 0.4, 1.0, 1.0, 0])
    sfx.add(wb * wmask, 0, -29)
    crowd = babble(VIDEO_END)
    cmask = np.interp(np.arange(N) / SR, [0, 0.3, 1.2, 3.5, 7.0, 7.7, 8.0, 15.5, 16.0, 20.8, 21.2, 24.7, 25.3, 27.5, 29.5, 29.9],
                      [0.5, 1.4, 1.6, 0.8, 1.0, 1.0, 0, 0, 0.7, 0.7, 0, 0, 1.6, 1.3, 0.8, 0])
    sfx.add(lp(crowd, 1500) * cmask, 0, -31, 0.1)
    # ---- scene 1: lean, creaks, flapping, splash
    sfx.add(flap(7.0, 13), 0.0, -32, -0.2)
    sfx.add(creak(0.9, 60, 90, [520, 880]), 0.15, -27, -0.1)
    sfx.add(groan(1.3), 1.0, -26, 0.0)
    sfx.add(rope(0.4), 1.6, -33, -0.3)
    sfx.add(creak(1.0, 50, 75, [450, 760]), 4.3, -27, -0.1)
    sfx.add(groan(1.6, 24, 34), 5.0, -24, 0.0)
    sfx.add(water_rush(2.2, 0.6, 1.0, 2500), 5.4, -28, -0.1)
    sfx.add(splash(1.6, 0.8), 6.1, -24, -0.1)
    sfx.add(bubbles(1.8, 10), 6.4, -33, 0.0)
    # ---- scene 2: pencil/cannon deck: thuds for cannons, chimes for ornaments, wobble creaks
    sfx.add(whoosh(0.6, 400, 1400, 0.5), 7.75, -36, 0.0)
    for k_, ti in enumerate((8.62, 8.78, 8.94, 9.10)):
        sfx.add(thud(55 + k_ * 4, 0.6), ti, -26, (-0.3 if k_ % 2 == 0 else 0.3))
    sfx.add(lp(rng.standard_normal(int(1.6 * SR)), 180) * env_ar(int(1.6 * SR), 0.3, 1.0, 0.3), 8.6, -36)   # deck rumble
    sfx.add(creak(0.8, 40, 55, [300, 520]), 9.4, -30, 0.0)
    for k_, ti in enumerate((10.0, 10.15, 10.3, 10.45, 10.6, 10.72)):
        sfx.add(chime([1568, 1760, 2093, 1975, 2349, 2637][k_], 0.9), ti, -38, (k_ - 2.5) / 3)
    sfx.add(groan(1.2, 26, 36), 11.6, -28, -0.2)
    sfx.add(creak(1.0, 45, 70, [380, 640]), 12.8, -28, 0.3)
    sfx.add(groan(1.4, 22, 30), 13.9, -26, -0.2)
    sfx.add(whoosh(1.1, 300, 1800, 0.6), 14.9, -31, 0.4)        # cannon barrel -> wind line
    # ---- scene 3: departure, gust
    sfx.add(flap(4.6, 10), 15.6, -34, 0.0)
    sfx.add(rope(0.5), 16.4, -35, 0.2)
    sfx.add(whoosh(2.6, 250, 1300, 0.35), 17.75, -25, 0.5)      # strong gust
    sfx.add(whoosh(2.0, 200, 900, 0.4), 18.2, -30, -0.4)
    sfx.add(flap(2.8, 17), 17.95, -27, 0.0)
    sfx.add(rope(0.45), 18.3, -29, -0.3)
    sfx.add(rope(0.5), 18.9, -30, 0.2)
    sfx.add(groan(1.6, 24, 36), 18.4, -24, -0.1)
    sfx.add(creak(1.0, 60, 95, [600, 950]), 19.6, -28, -0.2)
    # ---- scene 4: water through gun ports
    sfx.add(creak(0.8, 45, 60, [400, 700]), 21.0, -29, -0.3)
    sfx.add(water_rush(2.7, 0.15, 0.6, 4200), 22.2, -24, -0.4)
    sfx.add(water_rush(2.4, 0.5, 0.8, 1800), 22.6, -28, -0.1)
    rumble_n = int(2.0 * SR)
    sfx.add(lp(rng.standard_normal(rumble_n), 160) * (0.5 + 0.5 * np.sin(np.linspace(0, 18, rumble_n))) * env_ar(rumble_n, 0.4, 0.8, 0.8), 22.7, -30, -0.2)  # cannon wheels
    sfx.add(groan(1.4, 22, 30), 23.4, -26, -0.2)
    # ---- scene 5: sinking
    sfx.add(groan(1.8, 20, 28), 25.4, -24, -0.1)
    sfx.add(creak(1.1, 40, 70, [350, 600]), 26.4, -27, 0.1)
    sfx.add(water_rush(3.5, 1.0, 1.2, 2200), 25.9, -26, 0.0)
    sfx.add(splash(2.0, 1.3), 27.8, -21, -0.1)
    sfx.add(bubbles(2.2, 12), 28.1, -30, 0.0)
    # ---- scene 6: underwater + time + recovery
    uw = underwater(4.0)
    sfx.add(fade_edges(uw, 0.4, 0.3), 29.65, -23)
    sfx.add(bubbles(3.5, 6, 1200), 29.8, -31)
    sfx.add(whoosh(1.4, 200, 700, 0.75), 31.0, -33, 0.0)        # time rushing
    sfx.add(whoosh(0.5, 900, 300, 0.2), 32.0, -31, 0.0)
    sfx.add(winch(2.6), 32.2, -28, 0.2)
    sfx.add(clinks(1.6, 6), 32.25, -36, -0.3)
    sfx.add(rope(0.6), 32.5, -30, 0.3)
    sfx.add(rope(0.7), 33.0, -29, -0.3)
    sfx.add(splash(1.8, 1.4), 33.3, -22, 0.0)
    sfx.add(water_rush(2.4, 0.05, 1.6, 3000), 33.4, -26, 0.0)  # water draining off the hull
    sfx.add(drips(3.0, 9), 33.9, -34, 0.1)
    sfx.add(groan(1.2, 26, 34), 33.7, -30, 0.0)
    # ---- ending
    sfx.add(chime(2093, 1.4), 35.72, -38, 0.0)

    mix = np.zeros((N, 2))
    sg = db(3.0)
    mix[:, 0] = narr_full + music[:, 0] + sfx.L * sg
    mix[:, 1] = narr_full + music[:, 1] + sfx.R * sg
    # final fade
    fi = int(0.5 * SR)
    mix[N - fi:] *= np.linspace(1, 0, fi)[:, None]
    music.astype(np.float32).tofile('stem_music.f32')
    np.stack([sfx.L, sfx.R], 1).astype(np.float32).tofile('stem_sfx.f32')
    # also stems for checking
    out = mix.astype(np.float32)
    out.tofile('mix_raw.f32')
    print('narr rms', narr_rms, 'music base gain dB', base, 'peak', np.max(np.abs(mix)))


if __name__ == '__main__':
    main()
