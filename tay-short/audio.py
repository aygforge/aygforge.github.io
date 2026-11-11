#!/usr/bin/env python3
"""Builds the final audio mix: untouched narration (master timeline) + supplied music
(seamlessly extended by repeating a matching section, ducked under speech) + synthesized subtle SFX."""
import subprocess, sys, wave
import numpy as np
from scipy import signal

SR = 44100
DUR = 87.2
S14 = 81.80
SIL = [[4.27, 4.96], [8.04, 8.80], [10.78, 11.70], [12.36, 12.69], [15.19, 15.56], [19.11, 19.92], [22.88, 23.23], [25.50, 26.33], [30.65, 31.58], [34.78, 35.11], [38.65, 39.51], [44.42, 45.41], [48.96, 49.42], [52.75, 53.79], [56.41, 56.72], [58.36, 59.21], [60.60, 61.00], [65.96, 66.95], [70.76, 71.84], [76.13, 76.60], [78.50, 78.85], [80.18, 81.30], [82.24, 82.74]]


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


# ---------------- music: extend without replacing it ----------------
def extend_music(m, need):
    if len(m) / SR >= need:
        return m, None
    mono = signal.resample_poly(m.mean(axis=1), 1, 4)  # 11025 Hz
    hop = 256
    f, t, Z = signal.stft(mono, fs=SR / 4, nperseg=1024, noverlap=1024 - hop)
    F = np.log1p(np.abs(Z[:200]) * 50).T
    F = F - F.mean(axis=1, keepdims=True)
    F /= (np.linalg.norm(F, axis=1, keepdims=True) + 1e-9)
    fps = SR / 4 / hop
    extra = need - len(m) / SR
    best = (-1, None, None)
    win = int(3.0 * fps)
    for lag in range(int((extra + 0.3) * fps), int((extra + 14) * fps)):
        sim = (F[lag:] * F[:-lag]).sum(axis=1)
        sm = np.convolve(sim, np.ones(win) / win, mode='valid')
        lo, hi = int(25 * fps) - lag, int(68 * fps) - lag  # jump point T1 between 25 s and 68 s
        lo = max(lo, 0)
        if hi <= lo: continue
        k = lo + int(np.argmax(sm[lo:hi]))
        if sm[k] > best[0]:
            best = (sm[k], (k + lag + win // 2) / fps, lag / fps)
    score, T1, L = best
    # refine lag at sample level with waveform cross-correlation
    a = int(T1 * SR); n = int(0.25 * SR)
    ref = m[a - n:a + n].mean(axis=1)
    b0 = int((T1 - L) * SR); bestc, bestd = -1e9, 0
    for d in range(-600, 601, 2):
        seg = m[b0 + d - n:b0 + d + n].mean(axis=1)
        c = float((ref * seg).sum())
        if c > bestc: bestc, bestd = c, d
    b = b0 + bestd
    xf = int(0.09 * SR)
    w = np.linspace(0, 1, xf)[:, None]
    out = np.concatenate([m[:a - xf], m[a - xf:a] * np.cos(w * np.pi / 2) + m[b - xf:b] * np.sin(w * np.pi / 2), m[b:]])
    return out, (score, T1, L)


# ---------------- SFX synthesis ----------------
rs = np.random.RandomState(7)
def env_exp(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def tone(f, d): return np.sin(2 * np.pi * f * np.arange(int(d * SR)) / SR)
def sweep(f0, f1, d):
    n = int(d * SR); f = np.geomspace(f0, f1, n); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def bp(x, lo, hi):
    sos = signal.butter(2, [lo, hi], btype='band', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def lp(x, fc):
    sos = signal.butter(2, fc, btype='low', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def fade(x, a=0.004, r=0.01):
    na, nr = int(a * SR), int(r * SR); x = x.copy(); x[:na] *= np.linspace(0, 1, na); x[-nr:] *= np.linspace(1, 0, nr); return x

def s_pop(f=520): x = sweep(f, f * 1.7, 0.07); return fade(x * env_exp(len(x), 0.03))
def s_ding(f=1320): n = int(0.45 * SR); return fade((tone(f, 0.45) + .5 * tone(f * 1.5, 0.45)) * env_exp(n, 0.12)) * .7
def s_tick(): n = int(0.03 * SR); return fade(bp(rs.randn(n), 1800, 5000) * env_exp(n, 0.006), 0.0005, 0.005)
def s_whoosh(d=0.45): n = int(d * SR); return fade(bp(rs.randn(n), 400, 2600) * np.hanning(n) ** 1.5, 0.01, 0.05) * .8
def s_glitch(d=0.22):
    out = []
    for _ in range(int(d / 0.022)):
        n = int(0.022 * SR); f = rs.choice([180, 320, 640, 1100, 1900, 2800])
        out.append(np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * (rs.rand() > .35) * rs.uniform(.4, 1))
    return fade(lp(np.concatenate(out), 5000), 0.002, 0.01) * .5
def s_warn():
    a = signal.sawtooth(2 * np.pi * 466 * np.arange(int(.13 * SR)) / SR, 0.5); b = signal.sawtooth(2 * np.pi * 349 * np.arange(int(.18 * SR)) / SR, 0.5)
    return np.concatenate([fade(a, .01, .03), np.zeros(int(.04 * SR)), fade(b, .01, .06)]) * .6
def s_thunk(): n = int(0.22 * SR); x = tone(88, 0.22) * env_exp(n, 0.05); x[:int(.03 * SR)] += s_tick() * 1.2; return fade(x)
def s_down(): n = int(0.7 * SR); return fade(sweep(520, 55, 0.7) * env_exp(n, 0.3), .01, .1) * .7
def s_up(): n = int(0.55 * SR); return fade(sweep(160, 1300, 0.55) * np.hanning(n), .01, .05) * .5
def s_vib(d=0.5): n = int(d * SR); tt = np.arange(n) / SR; return fade(lp(np.sign(np.sin(2 * np.pi * 155 * tt)), 420) * (.55 + .45 * np.sin(2 * np.pi * 27 * tt)), .02, .05) * .6
def s_erase(): n = int(0.3 * SR); tt = np.arange(n) / SR; return fade(bp(rs.randn(n), 1500, 5200) * (.5 + .5 * np.sin(2 * np.pi * 19 * tt)) * np.hanning(n), .01, .03) * .7
def s_paper(): n = int(0.6 * SR); return fade(bp(rs.randn(n), 250, 1700) * np.hanning(n), .02, .1) * .7
def s_type(k=7):
    x = np.zeros(int(0.09 * SR * k) + 2000)
    for i in range(k):
        p = int((i * 0.09 + rs.uniform(0, .02)) * SR); c = s_tick(); x[p:p + len(c)] += c * rs.uniform(.5, 1)
    return x


def build_sfx(n):
    out = np.zeros((n, 2))
    def put(t, x, g=1.0, pan=0.0):
        if t >= S14 - 0.4: return  # keep the real-image ending free of SFX
        i = int(t * SR); x = x[:max(0, n - i)]
        out[i:i + len(x), 0] += x * g * (1 - max(0, pan)); out[i:i + len(x), 1] += x * g * (1 + min(0, pan))
    # S1 hook
    for k, t in enumerate([0.03, 0.33, 0.62, 0.95, 1.25, 1.56]): put(t, s_pop(500 + 60 * (k % 3)), .13, -.2)
    put(0.08, s_ding(), .10)
    tt = 0.0
    while tt < 2.4: put(tt, s_tick(), .13, .4); tt += 0.07 + tt * 0.03
    for t in [1.7, 2.35, 3.0, 3.75, 6.2]: put(t, s_glitch(.25), .12)
    put(3.95, s_warn(), .08); put(5.5, s_ding(880), .09, .4); put(6.95, s_down(), .15); put(6.95, s_thunk(), .2)
    put(8.12, s_up(), .13)
    for i in range(9): put(8.12 + i * .065, s_tick(), .10, .4)
    # S2
    put(8.8, s_whoosh(.5), .12); put(9.55, s_pop(660), .15, .3); put(9.6, s_ding(1568), .08); put(10.15, s_pop(560), .14, -.3)
    # S3
    put(11.75, s_whoosh(.4), .09)
    for i in range(8): put(12.0 + i * .2, s_pop(420 + 45 * i), .09, (i % 2) * .6 - .3)
    for k in range(15): put(13.1 + k * .42 + .95, s_pop(700 + 40 * (k % 4)), .055)
    put(15.6, s_ding(1175), .07)
    # S4 feed
    put(19.75, s_whoosh(.6), .12)
    put(20.1, s_type(8), .06)
    for k in range(8): t = 20.1 + k * .78; put(t, s_pop(520 if k % 2 == 0 else 780), .10, -.3 if k % 2 == 0 else .3)
    put(22.4, s_ding(1568), .06); put(24.7, s_ding(1320), .06)
    # S5
    put(26.4, s_whoosh(.55), .12)
    for i, t in enumerate([27.2, 27.9, 28.6]): put(t, s_pop(392 * (1 + .12 * i)), .12, .3)
    put(29.05, fade(tone(196, .5) * np.hanning(int(.5 * SR))), .09); put(29.6, fade(tone(185, .5) * np.hanning(int(.5 * SR))), .09)
    put(29.9, s_pop(330), .1, -.3); put(30.25, s_pop(330), .1, .3); put(30.75, s_ding(988), .08, -.3)
    # S6
    put(31.6, s_whoosh(.6), .11)
    for k in range(19): put(32.45 + k * .355, s_pop(300 - 4 * k), .075, (k % 3 - 1) * .5); put(32.45 + k * .355 + 1.1, s_tick(), .07)
    for t in [34.6, 35.9, 37.0, 38.1]: put(t, s_glitch(.2), .09)
    for t in [35.3, 37.2]: put(t, s_warn(), .075)
    # S7 loop
    put(39.55, s_whoosh(.6), .11)
    for c, d in [(40.3, 1.5), (41.85, 1.25), (43.15, 1.05), (44.25, 1.0)]:
        put(c, s_pop(280), .1, -.5); put(c + d * .47, s_glitch(.2), .12); put(c + d * .52, s_pop(240), .11, .5)
    # S8 chaos
    put(45.5, s_whoosh(.5), .1); put(45.7, s_pop(620), .08, -.4)
    tt = 45.7
    while tt < 53.7: put(tt, s_tick(), .09, .5); tt += max(0.07, 0.42 - (tt - 45.7) * .05)
    for j in range(16): put(49.6 + j * .235 + .3, s_ding(1320 + 110 * (j % 4)), .05, .5)
    for t in [50.0, 51.0, 52.0, 52.7, 53.3]: put(t, s_glitch(.25), .11)
    for t in [50.25, 52.15]: put(t, s_warn(), .08, -.4)
    for t in [50.6, 52.5]: put(t, s_vib(.5), .10)
    for t in np.arange(49.5, 53.6, .5): put(t, s_whoosh(.3), .045)
    # S9 moderation + offline
    for j in range(6): put(54.3 + j * .36, s_erase(), .11)
    put(57.36, s_thunk(), .26); put(57.38, s_down(), .16); put(57.42, s_tick(), .14, .5)
    # S10
    put(59.25, s_whoosh(.6), .10)
    for c in range(4): put(59.6 + c * .22, s_pop(300 + 30 * c), .085, -.4 if c % 2 == 0 else .4); put(60.45 + c * .18, s_whoosh(.3), .05)
    put(61.4, s_paper(), .15)
    for r in range(3): put(62.55 + r * .35, s_tick(), .09); put(63.05 + r * .35, s_pop(880), .05, .4)
    put(63.7, s_erase(), .07); put(64.1, s_erase(), .07); put(65.05, s_tick(), .11); put(65.5, s_tick(), .11)
    # S11
    put(66.8, s_paper(), .10); put(67.1, s_whoosh(.5), .10)
    tt = 67.4
    while tt < 70.4: put(tt, s_tick(), .12); tt += 0.085
    put(70.42, s_ding(1047), .13)
    put(70.5, s_down(), .08)
    # S12
    put(71.8, s_whoosh(.6), .10)
    for k in range(27): put(72.4 + k * .24 + 1.6, s_pop(660 + 50 * (k % 4)), .04, -.5)
    for k in range(18): put(75.2 + k * .215 + 1.6, s_pop(230), .05, .5)
    for t in [76.7, 77.5, 78.2, 78.8]: put(t, s_glitch(.22), .095)
    put(77.6, s_whoosh(.6), .07)
    put(79.24, s_thunk(), .32); put(79.27, s_down(), .18)
    # S13
    put(81.0, s_whoosh(.6), .07); put(81.25, s_pop(520), .07, .4)
    return out


def music_env(n):
    t = np.arange(n) / SR
    g = np.full(n, 0.27)
    for a, b in [(31.58, 38.65), (39.51, 44.42), (59.21, 65.96), (71.84, 80.18)]:   # dense narration
        g[(t >= a) & (t < b)] = 0.225
    for a, b in SIL:                                                                # transitions / reveals
        if b - a >= 0.6: g[(t >= a - 0.05) & (t < b - 0.12)] = 0.34
    g[(t >= 57.45) & (t < 58.9)] = 0.15                                             # quiet beat when Tay goes offline
    g[t >= 84.75] = 0.29                                                            # music under the real image after narration ends
    k = int(0.3 * SR); g = np.convolve(np.pad(g, k, mode='edge'), np.hanning(k) / np.hanning(k).sum(), mode='same')[k:-k]
    g *= np.clip((DUR - 0.05 - t) / 1.6, 0, 1) ** 1.5                               # smooth final fade-out
    g *= np.clip(t / 0.05, 0, 1)
    return g


def main(narr_path, music_path, out_wav):
    n = int(DUR * SR)
    narr = load(narr_path); music = load(music_path)
    music, info = extend_music(music, DUR + 0.5)
    print('music extension (similarity, jump at s, repeated section s):', info)
    mix = np.zeros((n, 2))
    narr = narr * np.sqrt(2)  # undo ffmpeg's -3 dB mono->stereo upmix so narration keeps its original level
    mix[:min(n, len(narr))] += narr[:n]
    mix += music[:n] * music_env(n)[:, None]
    mix += build_sfx(n)
    amb = lp(rs.randn(n), 900) * 0.0035
    mix += amb[:, None] * np.clip((DUR - np.arange(n) / SR) / 1.5, 0, 1)[:, None]
    peak = np.abs(mix).max(); print('peak before limit', peak)
    if peak > 0.97: mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.97 if peak > 1.25 else mix * (0.97 / peak)
    with wave.open(out_wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())


if __name__ == '__main__':
    main(*sys.argv[1:4])
