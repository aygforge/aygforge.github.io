import numpy as np, subprocess, json
from scipy import signal

SR = 48000
DUR = 68.0
N = int(DUR * SR)
rng = np.random.default_rng(1)

def db(x):
    return 10 ** (x / 20)

narr = np.fromfile('narr.f32', dtype=np.float32).astype(np.float64)
mus = np.fromfile('music.f32', dtype=np.float32).astype(np.float64).reshape(-1, 2)
narr = np.pad(narr, (0, max(0, N - len(narr))))[:N]
mus = mus[:N]

tt = np.arange(N) / SR

def smooth(x, sec):
    k = max(1, int(sec * SR))
    c = np.cumsum(np.insert(x, 0, 0))
    y = (c[k:] - c[:-k]) / k
    pad = k // 2
    return np.pad(y, (pad, N - len(y) - pad), mode='edge')

# ------------------------------------------------------------ speech activity
env = np.sqrt(smooth(narr ** 2, 0.05) + 1e-12)
env_db = 20 * np.log10(env + 1e-9)
speech = (env_db > -38).astype(float)
# hold 0.3s so commas don't pump the music, then smooth edges (no jumps)
hold = int(0.30 * SR)
sp_held = smooth(speech, 0.30) > 1e-6
mask = smooth(sp_held.astype(float), 0.25)

# ------------------------------------------------------------ music automation (dB, relative to narration level)
NARR_REF = -17.4
NORMAL, DENSE, GAP = -10.0, -11.5, -6.5
DENSE_WIN = [(9.27, 16.45), (37.84, 45.09), (46.15, 53.63)]
speech_db = np.full(N, NORMAL)
for a, b in DENSE_WIN:
    w = smooth(((tt >= a) & (tt < b)).astype(float), 0.4)
    speech_db = speech_db * (1 - w) + DENSE * w

def window(a, b, ramp):
    return smooth(((tt >= a) & (tt < b)).astype(float), ramp)

# moments (added under speech)
speech_db += 1.5 * window(0.0, 1.2, 0.3)       # first-frame accent
speech_db += 1.0 * window(17.2, 25.6, 0.5)     # helicopter / TV chase energy
speech_db += 2.0 * window(38.4, 40.4, 0.4)     # attic reveal swell
speech_db += 1.0 * window(49.8, 53.6, 0.4)     # after the ironic shift
speech_db += 1.0 * window(61.3, 65.0, 0.6)     # final brand line: fuller
gap_db = np.full(N, GAP)
gap_db += 1.5 * window(65.0, 68.5, 0.5)        # tail after last word
g = gap_db * (1 - mask) + speech_db * mask
# "Ama içinden kimse çıkmadı." -> pull music back right before the reveal, then return
dip = window(35.38, 36.08, 0.12)
g = g * (1 - dip) + (-26.0) * dip
g += 1.0 * window(36.9, 37.7, 0.25)

# level-follow: hold the music at the target distance under the narration
mm = mus.mean(1)
mrms = 20 * np.log10(np.sqrt(smooth(mm ** 2, 1.5)) + 1e-9)
follow = np.clip(0.85 * (NARR_REF - mrms), -6.0, 12.0)
follow = smooth(follow, 0.8)

gain = db(g + follow)
# ending fade (cosine) over the last 2.2 s
fade = np.ones(N)
f0 = int((DUR - 2.2) * SR)
fade[f0:] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, N - f0)))
gain *= fade

# ironic shift at the hoax line: brief low-pass "muffled" moment then opens up
sos = signal.butter(4, 700, 'lowpass', fs=SR, output='sos')
mus_lp = np.stack([signal.sosfiltfilt(sos, mus[:, ch]) for ch in range(2)], 1)
wet = 0.85 * window(48.70, 49.55, 0.18)
mus_fx = mus * (1 - wet[:, None]) + mus_lp * wet[:, None] * 1.25

music_out = mus_fx * gain[:, None]

# ------------------------------------------------------------ SFX synthesis
sfx = np.zeros((N, 2))

def place(sig, t0, level_db, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    sig = sig[:N - i0]
    rms = np.sqrt(np.mean(sig ** 2) + 1e-12)
    sig = sig / rms * db(level_db)
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    sfx[i0:i0 + len(sig), 0] += sig * l * 1.414
    sfx[i0:i0 + len(sig), 1] += sig * r * 1.414

def env_ar(n, att, rel):
    e = np.ones(n)
    a = int(att * SR); r = int(rel * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e

def bandnoise(dur, lo, hi, order=2):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x)

def lownoise(dur, hi, order=2):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    sos = signal.butter(order, hi, 'lowpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x)

def wind(dur, lo=150, hi=1100, gust=0.25):
    x = bandnoise(dur, lo, hi)
    n = len(x); t = np.arange(n) / SR
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * gust * t + rng.random() * 6) * np.sin(2 * np.pi * gust * 0.37 * t + 1)
    return x * lfo * env_ar(n, 0.6, 0.8)

def rotor(dur, rate=11.0, dist=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    base = lownoise(dur, 420 - 250 * dist)
    ph = (t * rate) % 1.0
    puls = (0.25 + np.exp(-ph * 9)) ** 1.5
    thump = np.sin(2 * np.pi * 55 * t) * np.exp(-ph * 14) * 0.6
    whine = 0.05 * (1 - dist) * np.sin(2 * np.pi * 880 * t + 3 * np.sin(2 * np.pi * 0.3 * t))
    return (base * puls + thump * (1 - 0.6 * dist) + whine) * env_ar(n, 0.5, 0.6)

def radio(dur=0.8):
    n = int(dur * SR); t = np.arange(n) / SR
    x = bandnoise(dur, 600, 2600, 3)
    syl = 0.3 + 0.7 * np.abs(np.sin(2 * np.pi * 4.7 * t + 2 * np.sin(2 * np.pi * 1.3 * t)))
    y = x * syl * env_ar(n, 0.01, 0.05)
    clk = np.zeros(n); clk[:120] = rng.standard_normal(120) * np.linspace(1, 0, 120) * 3
    clk[-150:] += rng.standard_normal(150) * np.linspace(0, 1, 150) * 2
    return y + clk

def tv_ambience(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    murmur = bandnoise(dur, 250, 1600) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 2.3 * t) * np.sin(2 * np.pi * 0.7 * t)))
    hum = 0.08 * np.sin(2 * np.pi * 60 * t) + 0.04 * np.sin(2 * np.pi * 120 * t)
    hiss = 0.15 * bandnoise(dur, 6000, 12000)
    return (murmur + hum + hiss) * env_ar(n, 0.3, 0.4)

def tick(pitch=2600):
    n = int(0.045 * SR); t = np.arange(n) / SR
    click = rng.standard_normal(n) * np.exp(-t * 900)
    tone = np.sin(2 * np.pi * pitch * t) * np.exp(-t * 160)
    sos = signal.butter(2, 900, 'highpass', fs=SR, output='sos')
    return signal.sosfilt(sos, click * 0.6 + tone)

def fabric(dur=0.7):
    n = int(dur * SR); t = np.arange(n) / SR
    x = bandnoise(dur, 900, 6000)
    am = np.clip(signal.sosfilt(signal.butter(1, 18, 'lowpass', fs=SR, output='sos'), rng.standard_normal(n)) * 30, 0, None)
    return x * (0.3 + am) * env_ar(n, 0.05, 0.25)

def creak(dur=0.55, f0=170, f1=130):
    n = int(dur * SR); t = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1 + 0.04 * np.sin(2 * np.pi * 7 * t))
    ph = np.cumsum(f) / SR
    pulses = (np.mod(ph, 1.0) < 0.08).astype(float) * (0.6 + 0.4 * rng.random(n))
    sos = signal.butter(2, [300, 2200], 'bandpass', fs=SR, output='sos')
    y = signal.sosfilt(sos, pulses)
    return y * np.sin(np.pi * t / dur) ** 1.5

def paper(dur=0.35):
    n = int(dur * SR)
    x = bandnoise(dur, 1800, 7000)
    spikes = (rng.random(n) < 0.004) * rng.standard_normal(n) * 6
    sos = signal.butter(2, 1500, 'highpass', fs=SR, output='sos')
    return (x * 0.5 + signal.sosfilt(sos, spikes)) * env_ar(n, 0.02, 0.15)

def pin_click():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return rng.standard_normal(n) * np.exp(-t * 500) + 0.5 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 300)

def whoosh(dur=0.5, lo=300, hi=3000):
    n = int(dur * SR); t = np.arange(n) / SR
    x = bandnoise(dur, lo, hi)
    return x * np.sin(np.pi * t / dur) ** 2

def stamp():
    n = int(0.35 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 85 * t) * np.exp(-t * 22)
    click = lownoise(0.35, 2500) * np.exp(-t * 80) * 0.8
    return body + click

def roomtone(dur):
    n = int(dur * SR)
    return lownoise(dur, 380, 1) * env_ar(n, 0.4, 0.6)

# ------------------------------------------------------------ SFX schedule
place(wind(9.2), 0.0, -40, -0.2)
place(rotor(8.8), 0.0, -38, 0.45)
place(wind(8.0, 200, 900), 9.0, -44, 0.0)
place(fabric(1.1), 9.7, -38, 0.4)
place(radio(0.8), 14.7, -40, -0.5)
place(radio(0.6), 15.9, -43, -0.5)
place(rotor(2.5), 17.2, -37, 0.3)
place(wind(2.4, 200, 1400), 17.2, -40, -0.2)
place(radio(0.7), 18.3, -41, -0.4)
place(tv_ambience(2.4), 19.4, -42, 0.0)
place(rotor(2.2, 12.0), 21.5, -34, 0.0)
place(wind(2.2, 300, 2500, 0.6), 21.5, -42, 0.0)
place(rotor(2.0, 11.0, 0.5), 23.6, -41, -0.3)
place(rotor(6.5, 10.5, 0.4), 25.7, -42, -0.2)
for k, tk in enumerate(np.arange(25.8, 31.95, 0.25)):
    place(tick(2600 if k % 2 == 0 else 2150), tk, -35, 0.1)
place(radio(0.7), 28.8, -43, 0.5)
place(wind(5.6, 200, 2200, 0.4), 32.1, -40, 0.0)
place(rotor(2.8, 11, 0.85), 32.2, -46, 0.4)
place(fabric(0.8), 34.15, -38, 0.0)
# clarity moment during the music dip: field wind + grass a little clearer
place(wind(1.2, 400, 3000, 0.8), 35.3, -38, -0.1)
place(fabric(0.4), 35.82, -40, 0.0)
place(roomtone(6.0), 37.6, -46, 0.0)
place(creak(0.6), 38.9, -36, 0.2)
place(creak(0.5, 150, 118), 40.3, -38, 0.25)
place(rotor(3.3, 11, 0.6), 42.6, -43, -0.6)
place(radio(0.7), 43.6, -44, -0.6)
for tp in (46.25, 46.6, 46.95, 47.35, 47.75, 48.15):
    place(pin_click(), tp, -40, 0.0)
    place(paper(0.25), tp - 0.05, -44, 0.0)
place(whoosh(0.6, 200, 1500), 48.85, -40, 0.0)
place(paper(0.45), 49.65, -38, 0.0)
place(paper(0.4), 50.4, -42, 0.2)
place(stamp(), 52.2, -33, 0.1)
place(tv_ambience(6.6), 54.4, -44, 0.0)
for tw, pn in ((56.95, -0.5), (57.25, 0.5), (57.55, 0.0)):
    place(whoosh(0.45, 600, 5000), tw, -42, pn)
    place(paper(0.3), tw + 0.35, -44, pn)
place(whoosh(0.6, 200, 1500), 58.25, -42, 0.0)
place(wind(6.7, 200, 1000), 61.3, -44, 0.0)
place(rotor(6.7, 11, 0.6), 61.3, -46, 0.4)
sfx *= fade[:, None] ** 0.5

# ------------------------------------------------------------ mix
mix = np.stack([narr, narr], 1) + music_out + sfx
np.save('music_gain.npy', g + follow)
mix.astype(np.float32).tofile('mix.f32')

# diagnostics: music vs narration during speech/gaps
def seg_db(x, a, b):
    s = x[int(a * SR):int(b * SR)]
    return 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-9)
for (a, b, name) in [(1, 5, 's1 speech'), (8.3, 9.2, 'gap1'), (10, 16, 's2 dense'), (18, 24, 's3 chase'), (35.4, 36.0, 'dip'),
                     (36.2, 36.8, 'after dip'), (39, 40, 'attic'), (62, 64.9, 'final'), (65.2, 66.5, 'tail')]:
    print(f'{name:10s} narr {seg_db(narr, a, b):6.1f}  music {seg_db(music_out.mean(1), a, b):6.1f}  sfx {seg_db(sfx.mean(1), a, b):6.1f}')
