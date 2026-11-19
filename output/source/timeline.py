# Shared timeline: written to timeline.js for the renderer, imported by the audio mixer.
import json, random

SENT = [
 ("1942’de Los Angeles saatlerce gökyüzüne ateş açtı…", 0.00, 4.49),
 ("ama ortada gerçek bir düşman uçağı yoktu.", 5.23, 7.82),
 ("Olay, Pearl Harbor saldırısından sadece birkaç ay sonra yaşandı.", 8.77, 12.70),
 ("Üstelik bir gece önce Japon denizaltısı I-17, California kıyısındaki bir petrol tesisini bombalamıştı.", 13.57, 20.60),
 ("Bu yüzden Los Angeles’ta herkes yeni bir saldırı bekliyordu.", 21.42, 24.84),
 ("25 Şubat gecesi radarlar kıyıya yaklaşan tanımlanamayan bir hedef tespit etti.", 26.17, 31.31),
 ("Kısa süre sonra hava saldırısı sirenleri çalmaya başladı.", 32.37, 35.71),
 ("Şehir tamamen karartıldı.", 36.65, 38.43),
 ("Ve saat 3 civarında uçaksavar birlikleri gökyüzüne ateş açtı.", 39.14, 43.54),
 ("Projektörler gecenin karanlığını tararken yüzlerce uçaksavar mermisi şehrin üzerinde patlıyordu.", 44.62, 50.96),
 ("Yaklaşık bir saat içinde 1.400’den fazla mermi ateşlendi.", 51.99, 55.85),
 ("İnsanlar gerçekten Los Angeles’ın Japon uçaklarının saldırısı altında olduğunu düşünüyordu.", 56.80, 61.89),
 ("Ama sabah olduğunda ortada vurulmuş tek bir düşman uçağı bile yoktu.", 62.69, 66.91),
 ("Çünkü Japonya o gece Los Angeles’a hiçbir hava saldırısı düzenlememişti.", 67.89, 72.41),
 ("ABD Donanması kısa süre sonra yaşananların savaş gerginliği ve yanlış alarm sonucu ortaya çıktığını açıkladı.", 73.59, 80.53),
 ("Gökyüzünde tam olarak neyin ilk alarmı başlattığıysa hiçbir zaman kesin olarak belirlenemedi.", 81.54, 87.32),
 ("O gece tarihe “Battle of Los Angeles” adıyla geçti.", 88.41, 91.85),
 ("Binlerce insanın gerçek bir saldırı sandığı savaş…", 92.82, 96.09),
 ("aslında hiç gelmeyen bir düşmana karşı yapılmıştı.", 96.66, 99.73),
 ("İnanması güç ama bu gerçekten yaşandı.", 100.75, 104.28),
]
LINE20B = 102.18  # "bu gerçekten yaşandı." starts here

SCENES = [0.0, 8.62, 13.42, 21.27, 26.02, 32.22, 36.50, 39.00, 44.47, 51.84,
          56.65, 62.54, 67.74, 73.44, 81.39, 88.26, 92.67, 96.51, 100.60, 104.60]
END = 110.0

R = random.Random(1942)

# Scene A (hook) flak bursts: t, worldX, worldY, size
A_FLAK = [(0.45,470,900,1.0),(0.70,690,760,1.1),(0.95,300,700,0.9),(1.15,820,560,1.0),(1.35,560,620,1.2),
          (1.55,380,520,0.9),(1.75,700,480,1.0),(2.00,520,600,1.1),(2.30,330,360,0.9),(2.60,760,260,1.0),
          (2.90,600,180,1.0),(3.30,400,0,0.9),(3.70,680,40,1.0),(4.20,480,-120,0.8),(4.80,740,130,0.9),
          (5.40,360,160,0.8),(6.20,640,-130,0.8),(7.00,440,240,0.8),(7.80,700,-30,0.8)]
A_MUZZLE = [(0.30,170),(0.50,930),(0.75,600),(0.95,320),(1.20,800),(1.45,170),(1.80,930),(2.30,600),
            (2.80,320),(3.40,800),(4.10,170),(4.80,930),(5.70,600),(6.60,320),(7.60,800)]

# Scene C submarine shots (absolute)
C_SHOTS = [16.4, 17.7, 19.0]

# Scene G blackout clicks
G_CLICKS = [36.75, 36.95, 37.15, 37.35, 37.55, 37.75, 37.95, 38.15]

# Scene H gun shots: (t, battery) battery 0 = foreground
H_SHOTS = [(41.20,0),(41.90,0)] + [(t,b) for t,b in [(42.35,1),(42.55,2),(42.80,3),(43.00,0),(43.20,1),(43.40,2),
           (43.60,3),(43.80,0),(44.00,1),(44.20,2),(44.40,3)]]

def scatter(t0, t1, rate, cx, cy, rx, ry, jitter=0.5):
    out=[]; t=t0
    while t < t1:
        out.append((round(t,3), round(cx+R.uniform(-rx,rx)), round(cy+R.uniform(-ry,ry)), round(R.uniform(0.6,1.2),2)))
        t += rate*R.uniform(1-jitter,1+jitter)
    return out

I_FLAK = scatter(44.55, 51.9, 0.22, 540, 700, 330, 260)
J_FLAK = scatter(51.84, 56.75, 0.07, 540, 640, 470, 330)
J_TRACERS = [(round(51.84+i*0.035+R.uniform(0,0.03),3), R.randrange(60,1020), R.uniform(-0.35,0.35)) for i in range(int(4.9/0.035))]
K_BOOMS = [round(56.8+i*0.55+R.uniform(-0.15,0.15),3) for i in range(10)]
Q_FLAK = scatter(92.70, 96.45, 0.17, 540, 650, 420, 300)
Q_SHOTS = [round(92.75+i*0.32+R.uniform(-0.06,0.06),3) for i in range(12)]
R_CLICK = 97.75
P_RUSTLE = (88.30, 89.70)

TL = dict(SENT=[{"text":s,"a":a,"b":b} for s,a,b in SENT], LINE20B=LINE20B, SCENES=SCENES, END=END,
          A_FLAK=A_FLAK, A_MUZZLE=A_MUZZLE, C_SHOTS=C_SHOTS, G_CLICKS=G_CLICKS, H_SHOTS=H_SHOTS,
          I_FLAK=I_FLAK, J_FLAK=J_FLAK, J_TRACERS=J_TRACERS, K_BOOMS=K_BOOMS, Q_FLAK=Q_FLAK, Q_SHOTS=Q_SHOTS,
          R_CLICK=R_CLICK)

if __name__ == "__main__":
    with open("timeline.js","w",encoding="utf-8") as f:
        f.write("const TL = " + json.dumps(TL, ensure_ascii=False) + ";\n")
    print("ok", len(I_FLAK), len(J_FLAK), len(J_TRACERS), len(Q_FLAK))
