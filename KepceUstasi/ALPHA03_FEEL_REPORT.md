# ALPHA 0.3 — YAKALAMA HİSSİ RAPORU

Tarih: 20 Kasım 2026 · Araç: `tests/sim/feel.mjs` (gerçek `PotPhysics` + `LadleController`, sabit 60 Hz adım,
deterministik tohum). Ham veriler: `reports/alpha03/feel/*.json`. **Bu ölçümler simülasyondur; gerçek telefonda
oynanarak hissin doğrulandığı iddia edilmiyor. Gerçek cihazda test yapılmadı.**

## Yöntem
1. **Isıtılmış tencere:** Oyunun kurallarıyla 24 (Alpha 0.2'de 30) topçuk dolduruluyor, ardından 5 tur rastgele
   kepçe + hibrit yenileme oynatılıyor. Böylece ölçüm ilk dolum anında değil, koşu ortasındaki gerçekçi bir
   tencerede yapılıyor.
2. **9 hedef konum:** Salınım aralığının soldan sağa eşit 9 noktası (merkeze göre px).
3. **3 dokunma toleransı:** Kepçe o noktadan geçerken tam zamanında (σ=0), Gauss hatası σ=4 adım (67 ms) ve
   σ=8 adım (133 ms). Toleranslı ölçümler 4 tekrar.
4. Her ölçüm aynı tencere anlık görüntüsünden (snapshot) başlıyor ve gerçek fizikle iniş/kapanma/kaldırma yapıyor;
   kapasite aşımı fiziksel olarak dökülüyor.
5. "Okuyan oyuncu" değeri: tencerenin görünür en iyi noktasını seçip oraya, ilgili toleransla nişan alan oyuncu.
   "Rastgele": bir salınım periyodu içinde rastgele an.

## Teşhis (Alpha 0.2)
* Merkez ±41 px aralığında 67 ms hatayla bile **6,25–6,73 / 7** yük; 133 ms hatayla **5,75–6,46**. Merkezin
  ±82 px'lik bir "plato"su neredeyse her zaman kepçeyi dolduruyordu.
* Kök neden yalnız merkezi yığın değil, **yoğunluk**: kepçe ağzı ~10 topçukluk hacim alırken kapasite 7. Merkezde
  yeterince topçuk olan her inişte kapasite doluyordu. Tek başına sırt/havuz eklemek bu yüzden işe yaramadı
  (topçukları yayıp rastgele yakalamayı artırdı).
* Topçuklar tek bir merkez kümede toplanıyordu (dilim 4–6 ≈ %60).

## Parametre denemeleri (her biri tek değişiklik veya küçük adım; 10–16 tencere)

"Merkez" = merkeze tam/67 ms/133 ms nişan. "Okuyan" = görünür en iyi noktaya nişan (67 ms / 133 ms).
Hedef öneriler: rastgele 2,7–3,9 · orta (133 ms) 4,3–5,5 · iyi (67 ms) 5,3–6,3 · kusursuz 6,1–7,0.

| Aday | Değişiklik (Alpha 0.2'ye göre) | Merkez 0 / 67 / 133 ms | Okuyan 67 / 133 ms | Rastgele | Not |
|---|---|---|---|---:|---|
| A02 | — (önce) | 6,83 / 6,73 / 6,46 | 6,35 / 5,85 | 4,64 | geniş plato |
| p16 | salınım 2,0 → 1,6 sn | 7,00 / 6,81 / 6,04 | 6,17 / 5,29 | 4,60 | hata px'te büyür, plato kalır |
| ridge45 | merkezde 45 px sırt | 5,08 / 5,75 / 6,10 | 6,60 / 5,52 | 4,82 | merkez kötüleşir, rastgele artar ✗ |
| narrow | düz orta %18 → %5, kenar 150 | 7,00 / 6,79 / 6,27 | 5,98 / 5,81 | 4,25 | daha dar ama yine dolu |
| R2/R3 | ±45–60 px sırtlar (3 havuz) | ~6,5 / 6,2 / 6,0 | ~6,3 / 5,9 | ~5,1 | topçuk yayılır, rastgele artar ✗ |
| C1 | topçuk 30/24/36 → 24/20/30 | 6,92 / 6,52 / 5,73 | 6,00 / 5,67 | 4,01 | yoğunluk etkili |
| C3 | ağız 44 → 38 | 6,42 / 6,48 / 5,71 | 6,04 / 5,40 | 4,08 | tek başına sınırlı |
| C2 | C1 + ağız 40 | 6,50 / 5,94 / 5,48 | 5,65 / 5,29 | 3,28 | bantlara yakın, ayrım küçük |
| D1 | C2 + salınım 1,7 sn | 6,42 / 5,88 / 5,17 | 5,21 / 5,10 | 3,71 | |
| D4 | C1 + ağız 42 + salınım 1,7 sn | 6,94 / 6,39 / 5,17 | 5,89 / 5,03 | 3,61 | iyi–orta ayrımı ~1; tek küme (yan nokta en iyi %8) |
| E1 | D4 + ±72 px 18 px sırtlar | 6,67 / 6,31 / 5,54 | 6,04 / 5,19 | 4,06 | |
| E2 | E1 + kümeli döküm | 6,83 / 6,42 / 5,60 | 5,75 / 5,23 | 3,89 | |
| **E3** | **D4 + ±72 px 26 px sırtlar + kümeli döküm** | **6,69 / 6,50 / 5,13** | **6,05 / 4,58** | **3,77** | **seçildi: yan nokta en iyi %35** |
| E5 | sırtlar ±80, 34 px | 6,94 / 6,34 / 5,08 | 6,06 / 4,92 | 3,77 | yan küme %13 |
| E6 | sırtlar ±78, 30 px, kenar 95 | 6,75 / 6,17 / 4,63 | 6,03 / 4,91 | 3,83 | yan küme %25, kenarlar daha cömert |

### Seçilen değerler: önce → sonra

| Parametre | Alpha 0.2 | Alpha 0.3 | Gerekçe |
|---|---|---|---|
| Topçuk başlangıç / min hedef / maks / min ekleme | 30 / 24 / 36 / 6 | **24 / 20 / 30 / 5** | Kepçe hacmi ≈ 10 topçuk, kapasite 7: yoğunluk düşünce yalnız iyi yerleşen iniş dolu gelir |
| Kepçe ağız yarıçapı (%100) | 44 px | **42 px** | Küçük adım; geniş kepçe kartı/yükseltmesi hâlâ +1,0 yük kazandırıyor (aşağıda) |
| Salınım periyodu | 2,0 sn | **1,7 sn** | Aynı ms hatası daha çok px demek: zamanlama farkı büyür. Ağırbaşlı Kepçe kartı daha değerli |
| Tencere tabanı | düz orta + kavisli kenar | **+ merkezden ±72 px'te 26 px yüksekliğinde iki alçak sırt** (48 parçalı çarpıştırıcı) | Orta havuz + iki yan havuz: yan kümeler de anlamlı |
| Yenileme dökümü | her topçuk rastgele x | **her yenilemede tohumlu bir döküm noktası çevresinde (±34 px) küme** | Kümeler turdan tura yer değiştiriyor: tencereyi okumak önemli |
| Hibrit tencere formülü, tek dokunuş, kapasite (7), fiziksel dökülme | — | **değişmedi** | |

## Önce / sonra ayrıntılı ölçümler

### Alpha 0.2 (önce) (12 ısıtılmış tencere)

| Tolerans \ konum (px, merkeze göre) | -165 | -124 | -82 | -41 | 0 | 41 | 82 | 124 | 165 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| tam zamanlama (0 ms) | 0.58 | 2.92 | 5.33 | 6.67 | 6.83 | 6.75 | 6.00 | 4.42 | 1.75 |
| σ 4 adım (67 ms) | 0.67 | 3.04 | 5.17 | 6.25 | 6.73 | 6.38 | 5.83 | 4.29 | 1.90 |
| σ 8 adım (133 ms) | 1.42 | 3.27 | 5.15 | 5.75 | 6.46 | 6.02 | 5.65 | 4.13 | 2.35 |

Yük histogramı (σ 4 adım), her konum için 0…7+ yük sayısı:

| Konum | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| -165 | 31 | 6 | 7 | 4 | 0 | 0 | 0 | 0 |
| -124 | 7 | 10 | 2 | 8 | 9 | 5 | 2 | 5 |
| -82 | 0 | 3 | 2 | 5 | 6 | 6 | 10 | 16 |
| -41 | 1 | 1 | 1 | 0 | 2 | 1 | 10 | 32 |
| 0 | 0 | 0 | 0 | 0 | 1 | 4 | 2 | 41 |
| 41 | 0 | 0 | 2 | 0 | 0 | 5 | 10 | 31 |
| 82 | 0 | 0 | 1 | 3 | 7 | 6 | 6 | 25 |
| 124 | 2 | 3 | 6 | 2 | 10 | 12 | 6 | 7 |
| 165 | 16 | 0 | 16 | 8 | 5 | 3 | 0 | 0 |

Topçuk dağılımı (tencere genişliği 9 dilim, soldan sağa; tüm ısıtılmış tencerelerin toplamı):

```
dilim 1 | ##                                5  (büyük 0)
dilim 2 | ###########                      29  (büyük 0)
dilim 3 | ##################               47  (büyük 2)
dilim 4 | ############################     73  (büyük 2)
dilim 5 | ##############################   78  (büyük 5)
dilim 6 | ############################     73  (büyük 7)
dilim 7 | ########################         63  (büyük 5)
dilim 8 | ################                 42  (büyük 0)
dilim 9 | #####                            13  (büyük 1)
```
### Alpha 0.3 (sonra, gönderilen değerler) (16 ısıtılmış tencere)

| Tolerans \ konum (px, merkeze göre) | -167 | -125 | -83 | -42 | 0 | 42 | 83 | 125 | 167 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| tam zamanlama (0 ms) | 0.38 | 2.00 | 5.63 | 6.31 | 6.69 | 6.25 | 6.13 | 3.75 | 0.06 |
| σ 4 adım (67 ms) | 0.41 | 2.58 | 4.97 | 5.66 | 6.50 | 6.03 | 5.47 | 3.52 | 0.30 |
| σ 8 adım (133 ms) | 1.44 | 2.58 | 4.69 | 4.98 | 5.13 | 5.25 | 5.16 | 3.59 | 1.16 |

Yük histogramı (σ 4 adım), her konum için 0…7+ yük sayısı:

| Konum | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| -167 | 51 | 4 | 5 | 4 | 0 | 0 | 0 | 0 |
| -125 | 25 | 3 | 4 | 6 | 9 | 7 | 5 | 5 |
| -83 | 2 | 2 | 4 | 10 | 5 | 9 | 11 | 21 |
| -42 | 2 | 2 | 3 | 3 | 3 | 6 | 12 | 33 |
| 0 | 0 | 1 | 0 | 2 | 2 | 3 | 6 | 50 |
| 42 | 0 | 1 | 3 | 2 | 3 | 5 | 14 | 36 |
| 83 | 2 | 1 | 1 | 2 | 11 | 14 | 4 | 29 |
| 125 | 9 | 11 | 3 | 9 | 9 | 6 | 4 | 13 |
| 167 | 52 | 7 | 3 | 2 | 0 | 0 | 0 | 0 |

Topçuk dağılımı (tencere genişliği 9 dilim, soldan sağa; tüm ısıtılmış tencerelerin toplamı):

```
dilim 1 | #                                 3  (büyük 0)
dilim 2 | #####                            19  (büyük 2)
dilim 3 | ################                 58  (büyük 1)
dilim 4 | ######################           79  (büyük 3)
dilim 5 | ##############################  107  (büyük 8)
dilim 6 | ########################         84  (büyük 3)
dilim 7 | #######################          82  (büyük 3)
dilim 8 | ########                         28  (büyük 0)
dilim 9 |                                   0  (büyük 0)
```

En iyi nokta (tam zamanlamada) hangi konumdaydı: [0, 0, 8, 10, 14, 10, 9, 1, 0] → yan kümelerde (±82 px ve ötesi) olma oranı **%35**.


## Özet

| Ölçüm | Alpha 0.2 | Alpha 0.3 | Öneri bandı |
|---|---:|---:|---|
| Rastgele dokunuş | 4,64 | **3,77** | 2,7–3,9 ✓ |
| Okuyan, 133 ms (orta oyuncu) | 5,85 | **4,58** | 4,3–5,5 ✓ |
| Okuyan, 67 ms (iyi oyuncu) | 6,35 | **6,05** | 5,3–6,3 ✓ |
| Kusursuz | 7,00 | **6,94** | 6,1–7,0 ✓ |
| İyi − orta ayrımı | 0,50 | **1,47** | "anlamlı ayrım" ✓ |
| En iyi noktanın yan kümede olması | ~%0 | **%35** | birden fazla küme ✓ |

Tam oyun simülasyonundaki (gerçek koşu, yetenekler dahil) yükler ALPHA03_BALANCE_REPORT.md'de. Orada iyi−orta farkı
daha küçük (~0,4). Nedeni: koşularda tencere sık sık zayıf (yeni dökülmüş, kümeler dağınık) olduğunda iki oyuncu da
aynı düşük değeri alıyor. Fark en çok dolu kümelerde ortaya çıkıyor.

## Kepçe yükseltmeleriyle ölçüm (E3 tabanında, 10 tencere)

| Ağız yarıçapı | Merkez 0 / 67 / 133 ms | Okuyan 67 / 133 ms | Rastgele |
|---|---|---|---:|
| 42 (temel) | 6,60 / 6,40 / 5,30 | 5,85 / 4,28 | 3,83 |
| 48 | 6,80 / 6,58 / 5,83 | 5,78 / 5,50 | 4,25 |
| 55 | 7,00 / 6,72 / 6,45 | 6,15 / 5,50 | 4,25 |
| 63 | 7,00 / 6,83 / 6,53 | 5,97 / 5,75 | 4,53 |

Geniş Kepçe/Kepçe Genişliği, zamanlama hatasını affettiren bir yük artışı veriyor; kart ve yükseltme değeri korunuyor.
Not: Merkez havuzu sırtlar arasında daraldığı için çok küçük, yapay bir 5 topluk yığın yalnız en geniş kepçeyle
tamamen alınabiliyor (`physics.test` bu nedenle güncellendi). Gerçekçi tencerelerde geniş kepçe her zaman daha iyi.

## Sınırlamalar
* Ölçümler bot modelidir. Gerçek oyuncunun hata dağılımı ve tencereyi okuma becerisi farklı olabilir.
* Telefonda gerçek dokunma gecikmesi, ekran yenileme ve hissiyat **test edilmedi**.
* Kümeli döküm ve sırtlar görsel olarak tencere dokusuna işlendi (`tools/gen-assets.mjs` aynı `floorY` profilinden çiziyor).
