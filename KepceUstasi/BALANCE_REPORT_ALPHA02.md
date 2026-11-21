# BALANCE REPORT — Alpha 0.1 → Alpha 0.2

Tarih: 20 Kasım 2026 · Ölçüm: başsız simülasyon (gerçek RunController + gerçek Matter.js tencere), **100 tohum /
chapter / politika** (tohumlar 20000–20099 Alpha 0.2, 10000–10099 Alpha 0.1). Toplam **2 800 tam koşu** nihai
tablolarda + arama koşuları. Alpha 0.1 sayıları, `0cd3e26` commit'inin ayrı bir çalışma ağacında **yeniden
koşuldu** (eski rapordan kopyalanmadı). Ham veriler: `reports/alpha02/*.json`.

## Bot politikaları ve sınırları

| Politika | Tanım | Sınır |
|---|---|---|
| `random` | Her salınımda 4–115. adım arasında rastgele dokunur | Zamanlamaya hiç dikkat etmeyen oyuncu; alt sınır gibi |
| `good` | Kepçenin tencere merkezinden ilk geçişini hedefler, zamanlama hatası Gauss σ = 4 adım (67 ms) | İnsan benzeri iyi oyuncu modeli; tepki/dikkat dağınıklığı yok |
| `average` | Aynı hedef, σ = 8 adım (133 ms) | "Merkeze nişan alan sıradan oyuncu" |
| `perfect` | Kepçe merkeze ±14–26 px yakınken dokunur (Alpha 0.1'deki eski "good" botu) | Pratikte kusursuz |
| `bad` | Kepçe salınımın kenarındayken dokunur | Bilinçli olarak kötü |
| profil `upg` | Kapasite, Genişlik, Dayanıklılık, Atış Ustalığı Sv2 (≈ ilk zaferden sonra alınabilecek düzey) | — |

Tüm botlar kartları **rastgele** seçer (bilinçli build kurmaz); bu yüzden yetenek dağılımı tablosu tekliflerin
dağılımını gösterir, oyuncu tercihini değil. Bot zaferleri insan başarı oranı değildir.

## Ana karşılaştırma (yükseltmesiz profil)

| Sürüm | Chapter | Politika | Galibiyet | 0/1/2/3★ | Ort. can kaybı | Ort. tur | Boss turu | Ort. yük | Tahmini dk* |
|---|---|---|---:|---|---:|---:|---:|---:|---:|
| 0.1 | Menemen | random | %100 | 0/0/6/94 | 0,16 | 23,0 | — | 3,72 | 2,0 |
| **0.2** | Menemen | random | **%79** | 21/0/53/26 | 3,05 | 31,0 | 8,6 | 3,66 | 2,8 |
| 0.1 | Menemen | good | %100 | 0/0/0/100 | 0 | 14,7 | — | 6,35 | 1,4 |
| **0.2** | Menemen | good | **%100** | 0/0/0/100 | 0,03 | 21,4 | 5,3 | 6,32 | 2,0 |
| 0.1 | Menemen | average | %100 | 0/0/0/100 | 0 | 15,6 | — | 5,93 | 1,4 |
| **0.2** | Menemen | average | **%100** | 0/0/1/99 | 0,14 | 22,5 | 5,5 | 5,98 | 2,1 |
| 0.1 | Menemen | perfect | %100 | 0/0/0/100 | 0 | 14,6 | — | 6,48 | 1,1 |
| **0.2** | Menemen | perfect | **%100** | 0/0/0/100 | 0,03 | 20,6 | 5,0 | 6,42 | 1,6 |
| 0.1 | Menemen | bad | %7 | 93/0/7/0 | 5,39 | 47,7 | — | 0,08 | 3,5 |
| **0.2** | Menemen | bad | **%0** | 100/0/0/0 | 5,23 | 13,7 | — | 0,25 | 1,0 |
| 0.1 | Patates | random | %100 | 0/0/15/85 | 0,38 | 28,4 | — | 3,90 | 2,5 |
| **0.2** | Patates | random | **%44** | 56/0/41/3 | 4,81 | 41,4 | 10,2 | 3,85 | 3,7 |
| 0.1 | Patates | good | %100 | 0/0/0/100 | 0 | 18,3 | — | 6,66 | 1,7 |
| **0.2** | Patates | good | **%100** | 0/0/18/82 | 0,44 | 34,7 | 7,0 | 6,61 | 3,3 |
| 0.1 | Patates | average | %100 | 0/0/0/100 | 0 | 19,1 | — | 6,21 | 1,8 |
| **0.2** | Patates | average | **%100** | 0/0/28/72 | 0,80 | 36,9 | 7,6 | 6,21 | 3,5 |
| 0.1 | Patates | perfect | %100 | 0/0/0/100 | 0 | 18,1 | — | 6,71 | 1,4 |
| **0.2** | Patates | perfect | **%100** | 0/0/18/82 | 0,44 | 34,4 | 7,0 | 6,68 | 2,7 |
| 0.1 | Patates | bad | %14 | 86/0/14/0 | 5,18 | 72,7 | — | 0,06 | 5,4 |
| **0.2** | Patates | bad | **%0** | 100/0/0/0 | 5,10 | 10,6 | — | 0,35 | 0,8 |

\* Tahmini süre = sabit adımlı simülasyon süresi + tur başına ~1,1 sn savaş animasyonu + atış başına 0,15 sn (1x
animasyon). Botlar düşünmeden dokunur; gerçek oyuncu süresi daha uzundur. "Boss turu" = boss dalgasında
kazanılan koşulardaki kepçe turu sayısı (Alpha 0.1 kodu bu istatistiği tutmuyordu).

### Temel yükseltmeli profil (`upg`, Alpha 0.2)

| Chapter | Politika | Galibiyet | 0/1/2/3★ | Can kaybı | Tur | Boss turu | Yük |
|---|---|---:|---|---:|---:|---:|---:|
| Menemen | random | %98 | 2/0/47/51 | 1,77 | 28,0 | 7,2 | 3,99 |
| Menemen | good | %100 | 0/0/0/100 | 0 | 18,6 | 4,6 | 6,56 |
| Patates | random | %79 | 21/0/68/11 | 4,20 | 42,6 | 9,5 | 4,16 |
| Patates | good | %100 | 0/0/9/91 | 0,22 | 31,1 | 6,4 | 6,91 |

Kalıcı geliştirmeler artık hissedilir fark yaratıyor (Patates rastgele %44 → %79).

### Yalnızca yeni yetenekler, eski düşman sayıları (`a01enemies` varyantı)

| Chapter | Politika | Galibiyet | 0/1/2/3★ | Boss turu | Tur |
|---|---|---:|---|---:|---:|
| Menemen | random | %100 | 0/0/3/97 | 5,3 | 21,4 |
| Menemen | good | %100 | 0/0/0/100 | 3,2 | 14,1 |
| Patates | random | %100 | 0/0/8/92 | 7,0 | 26,7 |
| Patates | good | %100 | 0/0/0/100 | 4,3 | 16,9 |

Güçlenen 6 kartlık sistem eski düşman değerleriyle boss'u 3–4 turluk bir oyuncağa çeviriyor; düşman
değerlerinin yeniden ayarlanması bu yüzden gerekliydi.

## Hedeflere göre değerlendirme

| Hedef (GDD Alpha 0.2 §4) | Ölçülen | Durum |
|---|---|---|
| Menemen random %55–80 | %79 | **Karşılandı** (bandın üst ucu) |
| Patates random %35–65 | %44 | **Karşılandı** |
| Menemen good %80–95 | %100 | **Karşılanmadı** (üstünde) |
| Patates good %65–90 | %100 | **Karşılanmadı** (üstünde) |
| Patates, Menemen'den belirgin zor | random 79 → 44, can kaybı 3,1 → 4,8 | Karşılandı |
| Kötü zamanlama iyi zamanlamadan belirgin az kazanmalı | bad %0, good %100 | Karşılandı |
| Rastgele bot sürekli 3★ almamalı | Menemen %26, Patates %3 üç yıldız (0.1: %94 / %85) | Karşılandı |
| Boss 4–7 etkili kepçe turu | good: Menemen 5,3, Patates 7,0 · random: 8,6 / 10,2 | İyi oynayışta karşılandı; rastgele oynayışta uzun |
| Chapter 4–7 dk | Bot tahmini 2,0–3,7 dk (gerçek oyuncu daha uzun) | Gerçek oyuncuyla ölçülmedi |
| Simülasyonda kilit / NaN / çift sonuç yok | 2 800 nihai + ~800 arama koşusunda 0 hata | Karşılandı |
| İkincil olay sınırına takılma | 100 tohumlu tüm Alpha 0.2 raporlarında 0 olay | Karşılandı |

### İyi oyuncu hedefine neden ulaşılamadı

Sorun zorluk sayılarından çok **yakalama fiziğinin toleransında**. Kavisli tencerede topçuklar ortada geniş bir
yığın oluşturuyor; merkezi hedefleyen her model, 133 ms zamanlama hatasıyla bile, 7'lik kapasitenin ~6'sını
dolduruyor (good 6,3–6,6; average 6,0–6,2; random 3,6–3,9). Yani "merkeze nişan alan" oyuncu rastgele oyuncunun
~1,7 katı mermi alıyor ve bu fark, hiçbir düşman ayarıyla iki bandı aynı anda tutturmaya izin vermiyor:

| Arama adayı (30 tohum) | Menemen random | Menemen good | Patates random | Patates good |
|---|---:|---:|---:|---:|
| A: HP ×1,5/×1,7, spawn 0,70–0,76 / 0,66–0,72 | %100 | %100 (perfect) | %97 | %100 (perfect) |
| B: HP ×1,7/×2,0, spawn 0,62–0,68 / 0,60–0,66, boss 44/66 | %83 | %100 | %93 | %100 |
| C: HP ×2,0/×2,4, spawn 0,58–0,64 / 0,56–0,62, boss 48/72 | **%33** | %100 | %67 | %100 |
| D: HP ×1,8/×2,6, spawn 0,60–0,66 / 0,54–0,60, boss 44/64 (40 tohum) | %70 | %100 | %30 | %100 |
| **E (seçilen)**: HP ×1,7/×2,8, spawn 0,58–0,64 / 0,56–0,62, boss 42/62, boss x 0,70 (40 tohum) | %73 | %100 | %40 | %100 |

C'de rastgele bot Menemen'de %33'e düşerken iyi bot hâlâ %100. İyi botu %80–95'e indirecek bir zorluk,
rastgele botu bandın çok altına iter. Seçilen değer (E) rastgele bandını tutturuyor ve iyi oyuncuda baskıyı
(daha çok tur, Patates'te %18 iki yıldız, can kaybı) artırıyor.

**Öneri (bu revizyonun kapsamı dışında, fizik değişikliği gerektirir):** merkez yığının toleransını daraltmak.
Örneğin daha hızlı salınım, daha dar kepçe ağzı ya da daha sığ/geniş tencere tabanı. Böylece iyi zamanlamanın
değeri korunur, ama ±70 ms hata gerçekten yük kaybettirir. Prompt "gerçek fiziksel kepçe yakalaması bozulmayacak"
dediği için bu revizyonda fizik geometrisine dokunulmadı.

## Seçilen Alpha 0.2 değerleri (`src/data/content.js → CHAPTERS[].balance`)

| | Menemen | Patates Kızartması | Alpha 0.1 |
|---|---|---|---|
| Normal düşman HP çarpanı | ×1,7 (domates 7, biber 5, yumurta 3, minyon 3) | ×2,8 (patates 8, zırhlı 20 + 2 kalkan, tuz 6) | ×1 |
| Boss HP | Dev Domates 42 | Patates Kral 62 (+4 kabuk) | 24 / 36 |
| Dalga spawn x | 0,58–0,64 (temasa 4 adım) | 0,56–0,62 (temasa 4 adım) | 0,86–0,93 (7 adım) |
| Boss başlangıç x | 0,70 | 0,70 | 0,86 |
| Dalga kompozisyonu, tarif, bahşiş, Şef HP, upgrade | değişmedi | değişmedi | — |

Menemen çarpanı GDD'nin önerdiği ×1,4–1,7 aralığında. Patates ×2,8 aralığın dışında: aralık içindeki adaylarda
rastgele bot %93'ün üstünde kazandı. Spawn x her iki chapter'da da önerilen 0,62–0,76 aralığının biraz altında.

## Yetenek seçim dağılımı (100 koşu, rastgele seçim)

Her koşuda 6 seçim yapıldı (toplam 600/politika). Örnek: Patates `good` en sık teklif edilip alınanlar Kalın Önlük 41,
Çifte Yağ Atışı 39, Patlayan Yağ 33, Lezzetli Lokma 32; en az Kızgın Yağ Ustalığı 17. Menemen `random`: Güçlü
Püskürtme 33, Sos Sıçraması 31 … İlk Yardım 8 (yalnızca yaralıyken teklif edilir). 24 kartın hepsi seçildi.
Tam dağılım: `reports/alpha02/final.json → results[].picks`. Kritik isabet: ortalama 1,8–4,1 / koşu.
