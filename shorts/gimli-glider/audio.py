"""Audio mix: narration (master) + supplied music (ducked, extended by a seamless splice) + subtle synthesized SFX.

usage: python3 audio.py narration.mp3 music.mp3 out.wav
"""
import subprocess, sys
import numpy as np

SR = 48000
END = 66.4
N = int(END * SR)
rng = np.random.default_rng(1983)


def decode(path, ch):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-map', '0:a', '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).astype(np.float64)


def t_axis(n=N):
    return np.arange(n) / SR


def band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


def env(points, n=N):
    """piecewise-linear envelope from [(t, v), ...]"""
    ts, vs = zip(*points)
    return np.interp(t_axis(n), ts, vs)


def smoothstep(t, a, b):
    u = np.clip((t - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)


def noise(n=N):
    return rng.standard_normal(n)


def pink(n=N):
    X = np.fft.rfft(noise(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X /= np.sqrt(np.maximum(f, 20))
    y = np.fft.irfft(X, n)
    return y / np.std(y)


def place(dst, clip, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    j = min(len(dst), i + len(clip))
    if j <= i: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    dst[i:j, 0] += clip[:j - i] * gain * l * 1.414
    dst[i:j, 1] += clip[:j - i] * gain * r * 1.414


def db(x):
    return 10 ** (x / 20)


def main(narr_path, music_path, out_path):
    t = t_axis()
    narr = decode(narr_path, 1)[:, 0]
    narr = np.pad(narr, (0, max(0, N - len(narr))))[:N]

    # ------------------------------------------------ music: seamless self-similar splice (25.00 s ↔ 35.58 s)
    m = decode(music_path, 2)
    a, b, xf = int(25.00 * SR), int(35.58 * SR), int(0.12 * SR)
    w = np.sin(np.linspace(0, np.pi / 2, xf))[:, None]
    head, tail = m[:b], m[a:]
    music = np.concatenate([head[:-xf], head[-xf:] * w[::-1] + tail[:xf] * w, tail[xf:]])
    music = np.pad(music, ((0, max(0, N - len(music))), (0, 0)))[:N]

    # ducking: narration dominant; music sits ~15–20 % under speech, a touch higher in pauses
    e = np.abs(narr)
    k = int(0.05 * SR)
    e = np.convolve(e, np.ones(k) / k, mode='same')
    speech = np.clip((20 * np.log10(e + 1e-6) + 45) / 12, 0, 1)
    kk = int(0.25 * SR)
    speech = np.convolve(speech, np.ones(kk) / kk, mode='same')
    mg = db(-15.5) * (1 - speech) + db(-17.5) * speech
    # both engines dead: the world goes noticeably quieter, then the music returns
    quiet = smoothstep(t, 28.5, 29.0) * (1 - smoothstep(t, 30.0, 31.4))
    mg *= 1 - 0.88 * quiet
    hook = smoothstep(t, 1.4, 1.8) * (1 - smoothstep(t, 2.4, 3.6))
    mg *= 1 - 0.45 * hook
    mg *= 1 - smoothstep(t, 65.0, 66.35)
    music *= mg[:, None]

    sfx = np.zeros((N, 2))

    # ------------------------------------------------ engines
    def engine(speed_env, seed_gain=1.0):
        """jet hum: low rumble + fan whine whose pitch follows speed (0..1)"""
        rum = band(noise(), 30, 220) * 0.9 + band(noise(), 300, 1400) * 0.25
        rum /= np.std(rum)
        f = 2900 * (0.25 + 0.75 * speed_env)
        ph = 2 * np.pi * np.cumsum(f) / SR
        whine = np.sin(ph) * 0.12 + np.sin(ph * 0.5) * 0.08
        return (rum * 0.5 + whine) * speed_env * seed_gain

    # scene 1: spinning → slowing → stopped
    sp1 = 1 - smoothstep(t, 0.15, 1.9)
    s1 = engine(sp1) * (t < 2.5)
    sfx[:, 0] += s1 * db(-25); sfx[:, 1] += s1 * db(-25)
    # take-off swell (scene 3)
    to = smoothstep(t, 21.5, 22.2) * (1 - smoothstep(t, 22.8, 23.6))
    s3 = band(noise(), 40, 900) * to
    sfx[:, 0] += s3 * db(-30); sfx[:, 1] += s3 * db(-30)
    # scene 4: two engines, left one dies first, then the right (panned)
    present = smoothstep(t, 23.3, 23.8)
    left = engine((1 - smoothstep(t, 24.55, 25.6)) * present)
    right = engine((1 - smoothstep(t, 27.55, 28.7)) * present)
    gate4 = (t > 23.0) & (t < 30.0)
    sfx[:, 0] += (left * 0.8 + right * 0.35) * db(-26) * gate4
    sfx[:, 1] += (left * 0.35 + right * 0.8) * db(-26) * gate4

    # ------------------------------------------------ air: cockpit ambience + wind, prominent once powerless
    air = band(pink(), 150, 2200)
    air /= np.std(air)
    gust = 0.75 + 0.25 * np.sin(2 * np.pi * 0.23 * t) * np.sin(2 * np.pi * 0.07 * t + 1)
    windlvl = env([(0, -60), (1.4, -60), (2.4, -32), (7.5, -34), (8.4, -38), (14.0, -40), (14.6, -60), (21.6, -60), (23.0, -42),
                   (24.5, -40), (28.4, -38), (29.0, -40), (29.9, -38), (30.7, -30), (33.0, -32), (40.0, -33), (49.0, -33), (51.9, -36), (54.3, -46),
                   (60.0, -48), (66.4, -50)])
    w2 = air * gust * db(windlvl)
    sfx[:, 0] += w2; sfx[:, 1] += np.roll(w2, 900)

    # ------------------------------------------------ instrument alert chimes (soft, two-tone)
    def chime(f1=740, f2=554, d=0.9):
        tt = np.arange(int(d * SR)) / SR
        e1 = np.exp(-tt * 5)
        c = np.sin(2 * np.pi * f1 * tt) * e1
        c2 = np.sin(2 * np.pi * f2 * tt) * np.exp(-np.maximum(tt - 0.22, 0) * 5) * (tt > 0.22)
        return (c + c2) * 0.5
    place(sfx, chime(), 24.75, db(-28))
    place(sfx, chime(), 27.85, db(-28))
    place(sfx, chime(880, 880, 0.5), 8.8, db(-34))   # fuel fault lamp

    # ------------------------------------------------ pencil scribbles while the calculation is written
    def scratch(d):
        n = int(d * SR)
        s = band(noise(n), 2500, 7000)
        am = np.clip(np.sin(2 * np.pi * 9 * np.arange(n) / SR) + 0.3, 0, None)
        return s / np.std(s) * am * np.hanning(n)
    for t0, d in [(16.9, 0.5), (17.45, 0.4), (17.7, 0.6), (18.35, 0.4), (18.6, 0.2), (18.8, 0.45), (19.25, 0.35), (10.4, 0.6), (37.4, 0.5)]:
        place(sfx, scratch(d), t0, db(-33))

    # ------------------------------------------------ transition whooshes (paper / air)
    def whoosh(d=0.8):
        n = int(d * SR)
        s = band(noise(n), 200, 3000)
        return s / np.std(s) * np.sin(np.linspace(0, np.pi, n)) ** 2
    for t0 in [7.55, 14.0, 23.15, 29.3, 33.2, 36.7, 60.9]:
        place(sfx, whoosh(), t0, db(-34))

    # ------------------------------------------------ distant race-car ambience (scenes 7–10)
    rc = np.zeros(N)
    for i, (t0, d, f0) in enumerate([(43.6, 2.6, 95), (44.9, 2.2, 120), (46.2, 3.0, 105), (48.0, 2.4, 130), (50.5, 3.0, 110), (62.0, 3.6, 100)]):
        n = int(d * SR); tt = np.arange(n) / SR
        f = f0 * (1 + 0.25 * np.sin(np.pi * tt / d)) * (1 + 0.02 * np.sin(2 * np.pi * 7 * tt))
        ph = 2 * np.pi * np.cumsum(f) / SR
        saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
        clip = band(saw, 60, 700) * np.sin(np.pi * tt / d) ** 1.5
        i0 = int(t0 * SR); rc[i0:i0 + n] += clip[:max(0, min(n, N - i0))]
    rc /= (np.max(np.abs(rc)) + 1e-9)
    place(sfx, rc, 0, db(-33), pan=0.25)

    # ------------------------------------------------ touchdown, braking, nose on the runway
    def chirp(d=0.18, f0=1300, f1=850):
        n = int(d * SR); tt = np.arange(n) / SR
        f = np.linspace(f0, f1, n)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + band(noise(n), 800, 4000) / 3
        return s * np.exp(-tt * 14)
    def thump(d=0.35, f=55):
        tt = np.arange(int(d * SR)) / SR
        return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 12)
    place(sfx, chirp(), 51.88, db(-24)); place(sfx, chirp(0.14, 1150, 800), 51.98, db(-27))
    place(sfx, thump(), 51.88, db(-20))
    brake = band(noise(), 40, 500) * smoothstep(t, 52.0, 52.3) * (1 - smoothstep(t, 53.6, 54.4))
    sfx[:, 0] += brake * db(-31); sfx[:, 1] += brake * db(-31)
    scrape = band(noise(), 300, 2500) * smoothstep(t, 53.25, 53.45) * (1 - smoothstep(t, 53.7, 54.4))
    sfx[:, 0] += scrape * db(-38); sfx[:, 1] += scrape * db(-38)
    place(sfx, whoosh(0.6), 54.9, db(-36))   # slides inflating

    mix = music + sfx
    mix[:, 0] += narr; mix[:, 1] += narr
    peak = np.max(np.abs(mix))
    if peak > 0.98: mix *= 0.98 / peak
    mix.astype(np.float32).tofile(out_path + '.f32')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', out_path + '.f32',
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-c:a', 'pcm_s16le', out_path], check=True)


if __name__ == '__main__':
    main(*sys.argv[1:4])
