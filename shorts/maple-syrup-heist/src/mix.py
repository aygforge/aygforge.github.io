"""Audio: narration (master) + supplied music (spliced to its own ending, automated) + synthesized subtle SFX."""
import wave, math, sys
import numpy as np
from scipy import signal

SR = 48000
END = 73.54
N = int(END * SR)
rng = np.random.default_rng(11)
D = sys.argv[1]


def readwav(p):
    w = wave.open(p)
    ch = w.getnchannels()
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return a.reshape(-1, ch)


def db(x):
    return 10 ** (x / 20)


narr = readwav(D + '/narr.wav')[:, 0]
music = readwav(D + '/music.wav')
narr_full = np.zeros(N, np.float32)
narr_full[:len(narr)] = narr[:N]

# ---------------------------------------------------------------- music splice (keep the song's own ending)
def onset_env(x, t0, dur):
    seg_ = x[int(t0 * SR):int((t0 + dur) * SR)].mean(1)
    hop = 480
    fr = np.array([np.sqrt((seg_[i:i + 1024] ** 2).mean()) for i in range(0, len(seg_) - 1024, hop)])
    on = np.maximum(np.diff(np.log(fr + 1e-6)), 0)
    return on - on.mean()

XF0, XF1 = 63.2, 65.2  # crossfade window in video time
best, best_off = -1e9, 57.7
ref = onset_env(music, XF0 - 3, 6)
for off in np.arange(57.40, 58.00, 0.005):
    cand = onset_env(music, XF0 - 3 + off, 6)
    m = min(len(ref), len(cand))
    c = float((ref[:m] * cand[:m]).sum())
    if c > best:
        best, best_off = c, off
print('music B offset', round(best_off, 3))
A = music[:int(XF1 * SR) + 10]
mus = np.zeros((N, 2), np.float32)
mus[:len(A)] += A[:N]
xf = np.ones(N, np.float32)
i0, i1 = int(XF0 * SR), int(XF1 * SR)
ramp = np.linspace(0, 1, i1 - i0)
fa = np.cos(ramp * math.pi / 2)
fb = np.sin(ramp * math.pi / 2)
mus[i0:i1] *= fa[:, None]
mus[i1:] = 0
bstart = int((XF0 + best_off) * SR)
Bseg = music[bstart:bstart + (N - i0)]
bb = np.zeros((N - i0, 2), np.float32)
bb[:len(Bseg)] = Bseg
bb[:i1 - i0] *= fb[:, None]
mus[i0:] += bb
# gentle presence dip on music (makes room for the voice while keeping music audible)
def peaking(f0, gain_db, q):
    A_ = 10 ** (gain_db / 40)
    w0 = 2 * math.pi * f0 / SR
    al = math.sin(w0) / (2 * q)
    b = [1 + al * A_, -2 * math.cos(w0), 1 - al * A_]
    a = [1 + al / A_, -2 * math.cos(w0), 1 - al / A_]
    return np.array(b) / a[0], np.array(a) / a[0]
b, a = peaking(2500, -2.5, 0.8)
mus = signal.lfilter(b, a, mus, axis=0).astype(np.float32)
lp = signal.butter(2, 700, 'low', fs=SR, output='sos')
mus_lp = signal.sosfilt(lp, mus, axis=0).astype(np.float32)

# ---------------------------------------------------------------- music automation
T = [0.0, 6.83, 13.78, 19.09, 26.32, 30.81, 34.20, 41.06, 48.34, 56.21, 63.00, 68.03]
TEND = [5.89, 12.98, 18.18, 25.36, 30.12, 33.25, 40.08, 47.49, 55.17, 62.04, 67.00, 71.09]
CR = 100  # control rate
nc = int(END * CR) + 1
tc = np.arange(nc) / CR
# speech activity from narration envelope
env = np.array([np.sqrt((narr_full[min(int(t * SR), N - 480):min(int(t * SR), N - 480) + SR // CR] ** 2).mean() + 1e-12) for t in tc])
act = (20 * np.log10(env + 1e-9) > -40).astype(np.float32)
# hold short gaps inside words, smooth
act = np.convolve(act, np.ones(25) / 25, 'same')
act = (act > 0.15).astype(np.float32)

G_NORMAL, G_DENSE, G_PEAK = -11.3, -13.0, -9.4
dense = {3, 7, 8, 9}
g_speech = np.full(nc, G_NORMAL)
for i in range(12):
    if i in dense:
        m = (tc >= T[i]) & (tc < (T[i + 1] if i < 11 else END))
        g_speech[m] = G_DENSE
g = G_PEAK + (g_speech - G_PEAK) * act


def env_set(t0, t1, val, ramp=0.3, mode='set'):
    for k in range(nc):
        t = tc[k]
        w = min(seg(t, t0 - ramp, t0), 1 - seg(t, t1, t1 + ramp))
        if w > 0:
            g[k] = g[k] + (val - g[k]) * w if mode == 'set' else g[k] + val * w


def seg(t, a, b):
    if b <= a:
        return 1.0 if t >= b else 0.0
    return min(1.0, max(0.0, (t - a) / (b - a)))

# 1 first maple-syrup reveal: quirky accent (music intro is quiet; lift it)
env_set(0.0, 1.6, -8.0, 0.01)
# 2/3 theft begins / months-long momentum: gaps already lift; add momentum in scene 4
env_set(19.1, 25.3, 0.8, 0.5, 'add')
# 5 empty barrel: brief pull-back then surprise cue in the gap
env_set(30.6, 31.4, -14.0, 0.2)
env_set(33.25, 34.15, -8.8, 0.15)
# 6 9,500 barrels: fuller
env_set(34.3, 40.0, 1.0, 0.5, 'add')
env_set(40.08, 41.0, -8.6, 0.15)
# 7 inspector discovery: music drops
env_set(44.2, 47.35, -17.5, 0.35)
# 8 18.7 million: strongest accent
env_set(49.9, 51.7, 1.8, 0.3, 'add')
env_set(55.17, 56.15, -8.4, 0.12)
# 9 final brand line: rise for a satisfying finish
env_set(71.15, 73.6, -8.2, 0.35)
# smooth (one-pole forward+backward)
# compensate the song's own level changes (quiet intro) so the music stays clearly audible
mono = mus.mean(1)
mrms = np.array([np.sqrt((mono[max(0, int(t * SR) - SR // 2):int(t * SR) + SR // 2] ** 2).mean() + 1e-12) for t in tc])
mrms_db = 20 * np.log10(mrms)
mrms_db = signal.filtfilt([0.03], [1, -0.97], mrms_db)
corr = np.clip(-18.5 - mrms_db, -3, 9)
corr[tc > 71.2] = np.minimum(corr[tc > 71.2], 2)   # let the song's own ending decay naturally
gs = signal.filtfilt([0.06], [1, -0.94], g + corr) + 1.5  # global music trim
lpmix = np.zeros(nc)
for k in range(nc):
    t = tc[k]
    lpmix[k] = min(seg(t, 44.1, 44.5), 1 - seg(t, 47.2, 47.7))
gain_s = np.interp(np.arange(N) / SR, tc, db(gs)).astype(np.float32)
lpm = np.interp(np.arange(N) / SR, tc, lpmix).astype(np.float32)
fade = np.ones(N, np.float32)
fi0 = int(72.35 * SR)
fade[fi0:] = np.cos(np.linspace(0, math.pi / 2, N - fi0)) ** 1.5
mus_out = (mus * (1 - lpm[:, None]) + mus_lp * lpm[:, None] * 1.1) * (gain_s * fade)[:, None]
np.save(D + '/music_gain_db.npy', gs)

# ---------------------------------------------------------------- SFX synthesis
sfx = np.zeros((N, 2), np.float32)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x).astype(np.float32)


def lpf(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'low', fs=SR, output='sos'), x).astype(np.float32)


def hpf(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'high', fs=SR, output='sos'), x).astype(np.float32)


def norm(x):
    return x / (np.sqrt((x ** 2).mean()) + 1e-9)


def place(x, t, level_db, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    x = x[:N - i]
    x = x * db(level_db)
    l = math.cos((pan + 1) * math.pi / 4)
    r = math.sin((pan + 1) * math.pi / 4)
    sfx[i:i + len(x), 0] += x * l * 1.414
    sfx[i:i + len(x), 1] += x * r * 1.414


def edge(n, a=0.02, r=0.05):
    e = np.ones(n, np.float32)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def tt(d):
    return np.arange(int(d * SR)) / SR


def metal_clunk(size=1.0, dur=0.9):
    t = tt(dur)
    parts = [(150, 0.25, 1.0), (330, 0.18, 0.7), (575, 0.12, 0.5), (910, 0.08, 0.35), (1370, 0.05, 0.25), (2050, 0.03, 0.15)]
    x = sum(a * np.sin(2 * math.pi * f / size * t + rng.uniform(0, 6)) * np.exp(-t / d) for f, d, a in parts)
    x += lpf(rng.normal(0, 1, len(t)), 1800) * np.exp(-t / 0.012) * 2
    return norm(x.astype(np.float32)) * np.exp(-t / 0.4).astype(np.float32)


def hollow_tap():
    t = tt(1.4)
    parts = [(92, 0.55, 1.0), (186, 0.42, 0.7), (305, 0.3, 0.45), (470, 0.18, 0.3), (720, 0.1, 0.18)]
    x = sum(a * np.sin(2 * math.pi * f * t) * np.exp(-t / d) for f, d, a in parts)
    x += bp(rng.normal(0, 1, len(t)), 800, 4000) * np.exp(-t / 0.006) * 1.5
    return norm(x.astype(np.float32))


def roll(dur, rate=4.0, hollow=False):
    t = tt(dur)
    x = lpf(rng.normal(0, 1, len(t)), 180 if not hollow else 260, 3) * 3
    mod = 0.6 + 0.4 * np.sin(2 * math.pi * rate * t) ** 2
    x = x * mod
    out = norm(x) * edge(len(t), 0.15, 0.25)
    # rib clicks
    k = 0.0
    while k < dur - 0.3:
        c = metal_clunk(1.6 if not hollow else 1.0, 0.3) * (0.18 if not hollow else 0.3)
        i = int(k * SR)
        out[i:i + len(c)] += c[:len(out) - i]
        k += 1 / rate * (1 + 0.2 * rng.uniform(-1, 1))
    return out


def room(dur):
    t = tt(dur)
    x = lpf(rng.normal(0, 1, len(t)), 350, 2) + 0.3 * np.sin(2 * math.pi * 60 * t) * 0.05
    return norm(x) * edge(len(t), 1.0, 1.0)


def wind(dur):
    t = tt(dur)
    n1 = bp(rng.normal(0, 1, len(t)), 250, 900)
    n2 = bp(rng.normal(0, 1, len(t)), 600, 1800)
    l1 = 0.6 + 0.4 * np.sin(2 * math.pi * 0.17 * t + 1.0)
    l2 = 0.5 + 0.5 * np.sin(2 * math.pi * 0.11 * t + 2.0) ** 2
    return norm(n1 * l1 + 0.5 * n2 * l2) * edge(len(t), 1.0, 1.2)


def engine(dur, rpm_curve=None):
    t = tt(dur)
    f = 28 + (rpm_curve(t) if rpm_curve else 0)
    ph = np.cumsum(2 * math.pi * f / SR)
    x = signal.sawtooth(ph) * 0.6 + np.sin(ph * 2) * 0.4
    x = lpf(x.astype(np.float32), 380, 3) + 0.25 * lpf(rng.normal(0, 1, len(t)), 500)
    return norm(x) * edge(len(t), 0.5, 0.6)


def forklift_snd(dur):
    t = tt(dur)
    f = 520 + 160 * np.sin(2 * math.pi * 0.25 * t)
    ph = np.cumsum(2 * math.pi * f / SR)
    x = np.sin(ph) * 0.4 + 0.15 * np.sin(2 * ph) + lpf(rng.normal(0, 1, len(t)), 200) * 1.2
    return norm(x.astype(np.float32)) * edge(len(t), 0.6, 0.8)


def pour(dur, bright=1.0):
    t = tt(dur)
    x = bp(rng.normal(0, 1, len(t)), 300 * bright, 2600 * bright)
    x *= 0.7 + 0.3 * np.abs(np.sin(2 * math.pi * 7 * t + np.sin(2 * math.pi * 1.3 * t)))
    out = norm(x) * 0.6
    # bubbles / glugs
    k = 0.05
    while k < dur - 0.1:
        bd = rng.uniform(0.03, 0.07)
        bt = tt(bd)
        f0 = rng.uniform(300, 700) * bright
        bub = np.sin(2 * math.pi * np.cumsum(f0 * (1 + 2.5 * bt / bd)) / SR) * np.exp(-bt / (bd * 0.4))
        i = int(k * SR)
        out[i:i + len(bub)] += bub[:len(out) - i].astype(np.float32) * 0.9
        k += rng.uniform(0.04, 0.12)
    return out * edge(len(t), 0.08, 0.2)


def splash():
    t = tt(0.7)
    x = hpf(rng.normal(0, 1, len(t)), 900) * np.exp(-t / 0.12)
    return norm(x)


def paper(dur=0.35):
    t = tt(dur)
    x = bp(rng.normal(0, 1, len(t)), 2000, 9000)
    cr = (rng.random(len(t)) > 0.997).astype(np.float32)
    cr = np.convolve(cr, np.exp(-np.arange(200) / 30), 'same')
    x = x * (0.25 + cr)
    return norm(x) * edge(len(t), 0.03, 0.12)


def rattle(dur):
    t = tt(dur)
    out = lpf(rng.normal(0, 1, len(t)), 300) * 0.8
    out = norm(out) * 0.5
    k = 0.0
    while k < dur - 0.1:
        c = metal_clunk(0.5 + rng.uniform(0, 0.3), 0.12) * 0.35
        i = int(k * SR)
        out[i:i + len(c)] += c[:len(out) - i]
        k += 1 / 22
    return out * edge(len(t), 0.1, 0.2)


def wood_knock():
    t = tt(0.5)
    x = (np.sin(2 * math.pi * 210 * t) * np.exp(-t / 0.05) + 0.6 * np.sin(2 * math.pi * 640 * t) * np.exp(-t / 0.03) +
         0.4 * np.sin(2 * math.pi * 1250 * t) * np.exp(-t / 0.015))
    x += lpf(rng.normal(0, 1, len(t)), 3000) * np.exp(-t / 0.006)
    return norm(x.astype(np.float32))


def scribble(dur):
    t = tt(dur)
    x = bp(rng.normal(0, 1, len(t)), 2500, 7000) * (0.4 + 0.6 * np.abs(np.sin(2 * math.pi * 3.2 * t)))
    return norm(x) * edge(len(t), 0.05, 0.1)


def scrape(dur=0.6):
    t = tt(dur)
    x = bp(rng.normal(0, 1, len(t)), 150, 900) * np.exp(-t / 0.25)
    return norm(x)

# ambience beds
place(room(13.6), 0.0, -47)
place(room(23.0), 19.0, -48)
place(room(15.3), 41.0, -47)
place(wind(6.4), 13.3, -39, -0.2)
place(wind(10.8), 62.8, -40, 0.2)
place(wind(7.2), 19.0, -50)
# S1
place(metal_clunk(1.3, 1.0), 0.12, -32, -0.1)      # vault/lid
place(roll(5.6, 3.0), 0.0, -37, -0.4)              # cart rolling
place(pour(0.9, 0.8), 0.9, -37, 0.1)               # syrup gloop
place(paper(1.8), 2.6, -41, 0.2)                   # notes flutter
# S2
place(forklift_snd(5.2), 8.2, -40, 0.2)
place(paper(0.4), 10.8, -42, -0.3)
# S3
place(engine(5.6, lambda t: 6 * np.exp(-t / 1.5)), 13.5, -35, 0.4)
place(rattle(1.5), 14.28, -35, -0.4)
place(roll(2.0, 2.2), 15.9, -39, -0.2)
for tcl in (17.7, 18.83):
    place(metal_clunk(1.0, 0.8), tcl, -33, 0.1)
# S4: derive event times from the scene-4 cycle
sc4 = 19.09
for k in range(400):
    lt = k / 50
    if lt > 7.2:
        break
for c in range(0, 8):
    # solve phi(lt) = c + x
    def tof(target):
        lo, hi = 0.0, 8.0
        for _ in range(40):
            mid = (lo + hi) / 2
            if mid / 2.0 + 0.045 * mid * mid < target:
                lo = mid
            else:
                hi = mid
        return lo
    tp0, tp1, tsl = tof(c + 0.14), tof(c + 0.72), tof(c + 0.8)
    if tp0 < 7.1:
        place(pour(max(0.3, min(tp1, 7.2) - tp0), 0.9), sc4 + tp0, -37, 0.1)
    if tsl < 7.1:
        place(metal_clunk(1.2, 0.6), sc4 + tsl, -37, -0.2)
    t_tr = tof(c + 0.0)
    if t_tr < 6.5:
        place(engine(1.6, lambda t: 8 * t), sc4 + t_tr, -42, -0.5)
for k in range(9):
    tf = k * 0.8 + 0.3
    if tf < 7.0:
        place(paper(0.2), sc4 + tf, -45, 0.6)
# S5
place(pour(1.6, 0.8), 26.45, -32, 0.2)
place(pour(1.15, 1.3), 28.2, -33, -0.2)
place(splash(), 28.22, -35, -0.2)
place(metal_clunk(1.1, 1.0), 29.57, -31)
place(roll(1.0, 4), 29.8, -40)
# S6
place(roll(1.4, 5.0, hollow=True), 30.82, -35, -0.3)
for tb in (31.16, 31.51, 31.86):
    place(hollow_tap() * 0.6, tb, -36, -0.1)
place(metal_clunk(1.0, 0.7), 32.2, -35)
place(hollow_tap(), 32.45, -39)
place(metal_clunk(1.2, 0.7), 34.0, -36)
# S8
place(scrape(0.6), 44.04, -34, 0.1)
place(metal_clunk(1.0, 0.5) * 0.6, 44.08, -36, 0.1)
place(hollow_tap(), 45.51, -31, 0.1)
place(hollow_tap(), 45.96, -32, 0.1)
place(paper(0.4), 46.5, -42)
# S9
place(paper(0.5), 48.35, -38)
place(scribble(1.0), 48.6, -44)
place(pour(1.4, 0.9), 49.45, -36)
place(paper(2.4), 50.0, -37, 0.3)
place(pour(2.6, 0.8), 52.3, -41, -0.3)
# S10
place(paper(0.4), 56.3, -40)
place(paper(0.3), 57.0, -42)
place(scribble(1.6), 58.4, -46)
place(wood_knock(), 61.16, -30)
# S11
place(roll(3.2, 3.0), 63.2, -37, 0.3)
place(engine(5.0), 63.0, -45, 0.3)
place(pour(0.5, 0.7), 65.25, -40)
# S12
place(pour(0.5, 0.6), 68.2, -43)

# ---------------------------------------------------------------- mix
mix = np.zeros((N, 2), np.float32)
mix += narr_full[:, None]
mix += mus_out
mix += sfx * db(-1.5)
peak = np.abs(mix).max()
print('peak', peak)
mix /= max(1.0, peak / 0.95)
out = (mix * 32767).clip(-32768, 32767).astype(np.int16)
w = wave.open(D + '/mix_raw.wav', 'wb')
w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(out.tobytes())
w.close()
# stems for checking
for name, x in (('stem_music', mus_out), ('stem_sfx', sfx), ('stem_narr', np.repeat(narr_full[:, None], 2, 1))):
    o = (x / max(1.0, peak / 0.95) * 32767).clip(-32768, 32767).astype(np.int16)
    w = wave.open(D + '/%s.wav' % name, 'wb')
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(o.tobytes())
    w.close()
