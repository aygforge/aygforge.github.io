import numpy as np, wave, json, subprocess, sys
SR = 48000
TOTAL = float(sys.argv[1])
def rd(p):
    w = wave.open(p); d = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(np.float64) / 32768; return d
def lufs(p):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])
N = int(TOTAL * SR)
narr = rd('narr.wav'); music = rd('music.wav')
gN = 10 ** ((-16 - lufs('narr.wav')) / 20); gM = 10 ** ((-29 - lufs('music.wav')) / 20)
out_n = np.zeros((N, 2)); out_n[:len(narr)] += narr[:N] * gN

# ---- music loop with crossfades ----
mus = np.zeros((N + SR * 60, 2)); XF = int(1.5 * SR); loop0 = int(8.0 * SR)
pos = 0; seg = music.copy(); first = True
while pos < N:
    s = seg if first else music[loop0:]
    s = s.copy(); L = len(s)
    if not first: s[:XF] *= np.linspace(0, 1, XF)[:, None]
    s[-XF:] *= np.linspace(1, 0, XF)[:, None]
    mus[pos:pos + L] += s; pos += L - XF; first = False
mus = mus[:N] * gM
# envelope (dB) keyframes
T = json.load(open('times.json')); ST = [a for a, b in T]
keys = [(0, 3), (3.6, 3), (5.0, 0), (8.5, 0), (18.6, 0.5), (23.0, 0.5), (33.4, 1), (34.2, 3), (41.0, 3), (42.6, 4), (44.4, 4), (45.5, 0), (49.2, 1), (49.8, 3.5), (53.8, 3), (55.0, -1), (61.0, -1), (61.9, 0), (66.5, 0), (67.0, -2), (73.5, -2), (74.0, 0), (77.4, 0), (77.8, -2), (83.3, -2), (84.0, 3), (91.4, 3), (92.5, 1), (98.5, 1), (102.3, 1.5), (102.8, 4), (TOTAL - 1.4, 4), (TOTAL, -60)]
tt = np.arange(N) / SR; kx = [k[0] for k in keys]; ky = [k[1] for k in keys]
env = 10 ** (np.interp(tt, kx, ky) / 20)
mus *= env[:, None]

# ---- SFX ----
rng = np.random.default_rng(1)
def band(dur, lo, hi, seed=0):
    n = int(dur * SR); x = np.random.default_rng(seed).standard_normal(n); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0; y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
sfx = np.zeros(N)
def place(sig, t0, gain_db, fade=0.3):
    i0 = int(t0 * SR); sig = sig.copy(); f = int(fade * SR)
    if f > 0 and len(sig) > 2 * f: sig[:f] *= np.linspace(0, 1, f); sig[-f:] *= np.linspace(1, 0, f)
    i1 = min(N, i0 + len(sig)); sfx[i0:i1] += sig[:i1 - i0] * 10 ** (gain_db / 20)
def lfo(n, rate, depth, ph=0): return 1 - depth + depth * (0.5 + 0.5 * np.sin(np.arange(n) / SR * 2 * np.pi * rate + ph))
# gentle wind in high-sky scenes
for a, b, g in [(0, 8.4, -40), (42.4, 49.0, -37), (49.0, 54.5, -42), (61.6, 66.4, -40), (92.2, 102.6, -44)]:
    w = band(b - a, 150, 900, int(a)); place(w * lfo(len(w), 0.23, 0.5), a, g, 0.8)
# rising wind during ascent
a, b = ST[8] + 0.6, ST[11] + 0.2; w = band(b - a, 200, 1600, 7); w *= np.linspace(0.15, 1, len(w)) ** 1.5; place(w, a, -32, 0.4)
# suburban ambience (soft noise + birds)
for a, b in [(11.2, 15.6), (23.8, 33.4), (73.7, 77.2)]:
    place(band(b - a, 300, 2500, int(a * 3)) * 0.5, a, -46, 0.6)
    for k in range(int((b - a) / 1.6)):
        t0 = a + 0.5 + k * 1.6 + rng.random() * 0.6; n = int(0.09 * SR); ti = np.arange(n) / SR
        fr = 3800 + 900 * np.sin(ti * 90); ch = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.hanning(n); place(ch, t0, -44, 0)
# balloon rubber movement (soft squeaks) when balloons multiply
for k in range(10):
    t0 = ST[5] + 0.4 + k * 0.38; n = int(0.12 * SR); ti = np.arange(n) / SR
    fr = 700 + 500 * ti / 0.12; s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.hanning(n) * (0.6 + 0.4 * np.sin(ti * 300)); place(s, t0, -42, 0)
# commercial jet ambience at a distance
a = ST[13] - 0.2; d = 6.0; j = band(d, 60, 700, 13); n = len(j); e = np.interp(np.arange(n) / SR, [0, 1.5, 3.5, 6], [0.1, 1, 0.7, 0.05]); place(j * e, a, -33, 0.3)
# radio static
a = ST[14] - 0.4; st = band(2.2, 1500, 4500, 21); cr = (rng.random(len(st)) < 0.002).astype(float) * rng.standard_normal(len(st)) * 3
place(st * lfo(len(st), 7, 0.6) + cr, a, -36, 0.15)
# control tower ambience + soft radar beeps
a = ST[14] + 1.3; place(band(4.6, 80, 600, 31), a, -44, 0.5)
for k in range(3):
    n = int(0.08 * SR); ti = np.arange(n) / SR; place(np.sin(2 * np.pi * 1180 * ti) * np.hanning(n), a + 0.6 + k * 1.43, -40, 0)
# electrical line hum
a = ST[17] - 0.3; d = 4.4; ti = np.arange(int(d * SR)) / SR
hum = 0.6 * np.sin(2 * np.pi * 60 * ti) + 0.35 * np.sin(2 * np.pi * 120 * ti) + 0.2 * np.sin(2 * np.pi * 180 * ti) + 0.05 * band(d, 2000, 6000, 41)
place(hum, a, -38, 0.6)
# paper rustle + stamp
a = ST[19] - 0.3
place(band(0.5, 2000, 8000, 51) * np.hanning(int(0.5 * SR)), a + 0.2, -40, 0)
stp = a + 1.75; n = int(0.25 * SR); ti = np.arange(n) / SR; th = np.sin(2 * np.pi * 85 * ti) * np.exp(-ti * 28) + band(0.25, 200, 3000, 61) * np.exp(-ti * 45) * 0.6
place(th, stp, -22, 0)
# museum room tone
place(band(9.5, 60, 900, 71), ST[20] - 0.3, -47, 1.0)
place(band(TOTAL - 102.4, 60, 900, 72), 102.4, -48, 0.6)
# gentle air release puffs during descent (no pops)
for k in range(6):
    t0 = ST[15] - 0.3 + 0.5 + k * 0.42 + 0.2; place(band(0.35, 1500, 6000, 80 + k) * np.hanning(int(0.35 * SR)), t0, -44, 0)

mixd = out_n + mus + sfx[:, None]
pk = np.abs(mixd).max()
if pk > 0.97: mixd *= 0.97 / pk
pcm = (np.clip(mixd, -1, 1) * 32767).astype(np.int16)
w = wave.open('mix.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('peak', pk)
