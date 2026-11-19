import subprocess, numpy as np
from scipy.signal import butter, sosfilt
from timeline import TL, SCENES, END

SR = 48000
NAR = "/root/.claude/uploads/37318f6e-d8d4-5d2b-b44e-c24c0ef8f766/c70bde22-losangales.mp3"
MUS = "/root/.claude/uploads/37318f6e-d8d4-5d2b-b44e-c24c0ef8f766/7855fca4-False_Alarm_Los_Angeles_-_usesuno.com.mp3"
N = int(END * SR)
rng = np.random.default_rng(7)

def load(path, ch, ss=0):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(ss), "-i", path, "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).reshape(-1, ch)
    out = np.zeros((N, ch), np.float32); n = min(N, len(a)); out[:n] = a[:n]; return out

nar = load(NAR, 1)[:, 0]
mus = load(MUS, 2, ss=1.1)  # skip the track's 1.1 s of leading silence so music starts on frame 1
def db(x): return 10 ** (x / 20)

# ---- music volume envelope (dB), per channel standard ----
K = [(0, -11.5), (8.4, -11.5), (9.0, -16.5), (20.8, -16.5), (21.4, -14.5), (26.0, -14.5), (26.4, -14),
     (32.1, -14), (32.4, -11.5), (44.3, -11.5), (44.6, -10.5), (51.8, -10.5), (52.0, -9.5), (56.4, -9.5),
     (56.8, -13), (62.4, -13), (63.0, -19.5), (67.4, -19.5), (67.9, -23.5), (72.6, -23.5), (73.4, -17.5),
     (81.2, -17.5), (81.8, -15), (88.0, -15), (92.6, -14.5), (92.9, -12), (96.4, -12), (96.6, -18.5),
     (100.4, -18.5), (100.7, -14), (104.4, -14), (104.8, -13.5), (107.8, -14.5), (109.9, -60)]
t = np.arange(N) / SR
env = db(np.interp(t, [k[0] for k in K], [k[1] for k in K]))
# narration-aware ducking: dip music 2 dB more while voice is present (smoothed)
v = np.abs(nar); vs = np.convolve(v, np.ones(4800) / 4800, mode="same")
duck = db(-2.0 * np.clip(vs / 0.02, 0, 1))
mus *= (env * duck)[:, None]

# ---- SFX ----
sfx = np.zeros((N, 2), np.float32)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)
def add(t0, sig, gain_db, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0: return
    j = min(N, i + len(sig)); s = sig[: j - i] * db(gain_db)
    sfx[i:j, 0] += s * np.sqrt(0.5 * (1 - pan)) * 1.414 / 1.414
    sfx[i:j, 1] += s * np.sqrt(0.5 * (1 + pan))
def env_exp(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def pop(dist=1.0):  # distant flak pop: soft, low-passed
    n = int(0.9 * SR); x = rng.standard_normal(n) * env_exp(n, 0.07 + 0.08 * dist)
    x = lp(x, 900 / dist) * 0.8 + np.sin(2 * np.pi * 55 * np.arange(n) / SR) * env_exp(n, 0.12) * 0.6
    return x.astype(np.float32)
def gun():  # anti-aircraft gun: thump + crack, controlled
    n = int(1.4 * SR); x = rng.standard_normal(n) * env_exp(n, 0.05); x = lp(x, 2200)
    x += np.sin(2 * np.pi * 48 * np.arange(n) / SR) * env_exp(n, 0.22) * 1.3
    x += lp(rng.standard_normal(n), 300) * env_exp(n, 0.5) * 0.5
    return x.astype(np.float32)
def click():
    n = int(0.08 * SR); x = hp(rng.standard_normal(n), 1500) * env_exp(n, 0.006) + np.sin(2 * np.pi * 180 * np.arange(n) / SR) * env_exp(n, 0.01)
    return x.astype(np.float32)
def noise_bed(dur, lo, hi): return bp(rng.standard_normal(int(dur * SR)), lo, hi).astype(np.float32)
def fade(x, a=0.3, b=0.3):
    n = len(x); e = np.ones(n); na, nb = int(a * SR), int(b * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nb: e[-nb:] = np.linspace(1, 0, nb)
    return (x * e).astype(np.float32)

# city ambience + distant rumble under night scenes (ambiguous, no aircraft)
add(0, fade(lp(rng.standard_normal(int(62.5 * SR)), 160), 0.05, 1.5), -30)
# hook: ground guns + flak pops
for tt, x in TL["A_MUZZLE"]: add(tt, gun(), -25, (x - 540) / 700)
for tt, x, y, s in TL["A_FLAK"]: add(tt, pop(1.4), -24, (x - 540) / 600)
# newspaper rustle
def rustle(dur): x = noise_bed(dur, 2000, 7000); m = np.abs(lp(rng.standard_normal(len(x)), 12)); return fade(x * (m / m.max()), 0.05, 0.2)
add(8.65, rustle(1.0), -28); add(88.3, rustle(1.4), -28); add(73.45, rustle(0.6), -30)
# submarine context: sea + three small distant shots
add(13.4, fade(lp(rng.standard_normal(int(7.9 * SR)), 500), 0.5, 0.5), -33)
for tt in TL["C_SHOTS"]: add(tt, pop(1.6), -27, -0.3); add(tt + 1.3, pop(2.2), -32, 0.5)
# ticking + radio static
for k in range(int((26.0 - 21.3) * 2)): add(21.3 + k * 0.5, click(), -27, 0.3)
st = noise_bed(4.7, 1500, 5000) * (0.4 + 0.6 * (rng.random(int(4.7 * SR)) > 0.97)); add(21.3, fade(st, 0.2, 0.3), -40, -0.4)
# radar sweep pings + hum
for k in range(3): add(26.3 + 1.2 + k * 2.4, (np.sin(2 * np.pi * 1150 * np.arange(int(0.6 * SR)) / SR) * env_exp(int(0.6 * SR), 0.12)).astype(np.float32), -30)
add(26.0, fade((np.sin(2 * np.pi * 60 * np.arange(int(6.2 * SR)) / SR) * 0.5 + noise_bed(6.2, 100, 400) * 0.5).astype(np.float32), 0.3, 0.4), -38)
# air raid siren: slow rise/fall, distant
dur = 9.0; n = int(dur * SR); tt = np.arange(n) / SR
f = 280 + 420 * (0.5 - 0.5 * np.cos(2 * np.pi * tt / 9.0)) ** 0.7
ph = 2 * np.pi * np.cumsum(f) / SR
sir = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * (0.85 + 0.15 * np.sin(2 * np.pi * 5 * tt))
sir = lp(sir, 1800); sir = sir + 0.4 * np.roll(sir, int(0.09 * SR)) + 0.25 * np.roll(sir, int(0.21 * SR))
add(32.3, fade(sir.astype(np.float32), 1.2, 3.0), -27)
# blackout switches
for tt in TL["G_CLICKS"]: add(tt, click(), -22, rng.uniform(-0.6, 0.6))
# guns open fire
add(39.1, fade(noise_bed(1.6, 80, 300), 0.3, 0.4), -32)  # barrel traverse
for tt, b in TL["H_SHOTS"]: add(tt, gun(), -18 if b == 0 else -27, -0.2 if b == 0 else (b - 2) * 0.5)
# searchlight sky + 1,400 shells
for tt, x, y, s in TL["I_FLAK"]: add(tt, pop(1.3), -26, (x - 540) / 600)
for i, (tt, x, y, s) in enumerate(TL["J_FLAK"]): add(tt, pop(1.5), -27, (x - 540) / 600)
for i, (tt, x, dx) in enumerate(TL["J_TRACERS"][::3]): add(tt, gun(), -30, (x - 540) / 600)
for k in range(30):  # brass casings clinking
    n = int(0.15 * SR); tt2 = np.arange(n) / SR; fr = rng.uniform(2500, 4200)
    add(52.0 + k * 0.16 + rng.uniform(0, 0.08), (np.sin(2 * np.pi * fr * tt2) * env_exp(n, 0.03)).astype(np.float32), -36, -0.5)
# people believe it: muffled booms
for tt in TL["K_BOOMS"]: add(tt, lp(pop(2.0), 400).astype(np.float32), -24)
# morning: soft wind only
add(62.6, fade(noise_bed(11.0, 200, 900), 1.5, 2.0), -41)
# what started it: faint radar ping / static motifs
for k, tt in enumerate([81.8, 82.7, 83.6, 84.5]): add(tt, (np.sin(2 * np.pi * 900 * np.arange(int(0.5 * SR)) / SR) * env_exp(int(0.5 * SR), 0.1)).astype(np.float32), -36)
# final tension
add(88.3, fade(lp(rng.standard_normal(int(8.2 * SR)), 160), 1.0, 0.02), -30)
for tt, x, y, s in TL["Q_FLAK"]: add(tt, pop(1.3), -25, (x - 540) / 600)
for tt in TL["Q_SHOTS"]: add(tt, gun(), -22, 0.4)
sfx[int(96.51 * SR):int(97.2 * SR)] *= np.linspace(1, 0, int(97.2 * SR) - int(96.51 * SR))[:, None] ** 4  # abrupt silence
sfx[int(97.2 * SR):int(97.7 * SR)] = 0
# empty morning: searchlight off + gun lowering
add(TL["R_CLICK"], click(), -18, -0.5)
add(97.9, fade(noise_bed(2.5, 60, 220), 0.3, 0.6), -33, 0.4)
# ending ambience
add(100.6, fade(lp(rng.standard_normal(int(4.5 * SR)), 150), 0.8, 1.5), -34)

mix = mus + sfx + nar[:, None] * 1.0
out = np.clip(mix, -1, 1).astype(np.float32)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "mix.wav"], input=out.tobytes(), check=True)
print("mix ok", np.abs(mix).max())
