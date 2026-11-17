# Sistem Durum Raporu

Durum: ✅ tamamlandı · 🟡 kısmen / sadeleştirilmiş · ❌ yok

## Çekirdek döngü ve dünya
| Özellik | Durum | Not |
|---|---|---|
| Hazırlık → ticaret → item → tayfa/hayvan → tamir/yükseltme → yolculuk (2–6 event) → varış → final/batış → meta | ✅ | `GameCore` faz makinesi: arrival → harbor → voyage → arrival … → ended |
| 45 liman, 5 bölge, 8 tip, Büyük Liman finali | ✅ | |
| Seed ile deterministik rota (6–10 liman, tekrar yok, bölgeler sırayla) | ✅ | Aynı seed + aynı kilit durumu → aynı rota |
| Mesafe dağılımı %35/%45/%20 → 2 / 3–4 / 5–6 event | ✅ | Old Finn, Deneyimli Rota, Yusuf, Yıldız Haritası değiştiricileri |
| Parşömen dünya haritası (mesafe renkleri, bölge bantları, gemi, uyarılar, tip görünürlüğü meta'ya bağlı) | ✅ | |

## Liman
| Özellik | Durum | Not |
|---|---|---|
| Tek sahne, tipe/bölgeye göre arka plan (8 tip + final) | ✅ | Prosedürel şehir, gökyüzü, deniz, rıhtım |
| 5 panel: Mal Al/Sat, İtem Seç, Tersane, Tayfa, Hayvan | ✅ | Teklifler girişte seed ile üretilir, ziyaret boyunca sabit (kayıtta korunur) |
| Liman tipi özel kuralları (tersane yok, garantili Diego/Kara Bayrak, Isı Kalkanı, Buz Kıran Pruva, hayvan şansları, askerî liman denetim yok) | ✅ | |
| Yetersiz altın / dolu kargo / eksik slot için işlem engeli ve açıklama, kritik işlemlerde onay | ✅ | |

## Gemi, tamir, ticaret, item
| Özellik | Durum | Not |
|---|---|---|
| 5 gemi seviyesi, her biri ayrı görsel; 4 hasar görseli (çatlak, yama, eğik direk, yırtık yelken, su/duman) | ✅ | |
| Hull kategorileri (% bazlı), kaçış ve kargo cezaları, sızıntı | ✅ | |
| Kısmi/tam tamir, acil yama, item, tayfa, event ile tamir; Groot → sızıntı → Doc Vargas → Esperanza sırası | ✅ | |
| 15 mal, gruplar, bozulma, liman çarpanları, seed sapması, kâr = 1 XP / 10 altın | ✅ | Partiler ayrı maliyetle tutulur |
| Kaçak mal işareti, Askerî Denetim, müsadere, fiyat cezası, kahraman statüsü, ticaret bonusları | ✅ | |
| 18 item (15 + 3 eksik), aktif/pasif/tek kullanım, item → seçenek vurgulama, kilitli seçenek açıklaması | ✅ | |

## Eventler
| Özellik | Durum | Not |
|---|---|---|
| 18 tehlike, 15 şans, 12 gizem, 8 felaket, 3 tamir, 5 tayfa, 3 özel, 4 hayvan eventi | ✅ | Her biri kendi metni, seçenekleri, gereksinimleri, şans ve gerçek durum değişiklikleri ile |
| 12 zincir (Korsanın Teklifi, Yarı Batmış Gemi, Fırtına Öncesi, Gizemli Yolcu, Hazine Peşinde, Kaçakçı Ağı, Deniz Tanrısı'nın Laneti, İki Liman Savaşı, Kayıp Mürettebat, Ticaret Savaşı, Hayalet Gemi, Kayıp Prenses) | ✅ | Bayrak hafızası, dallanma, şimdi/sonraki rota/varışta devam, tekrar başlamaz, ekranda adım göstergesi |
| Bölgesel ağırlıklar, kritik durumda tamir +15 / tehlike −10, uygunsuz eventlerin elenmesi, tekrar önleme | ✅ | |
| Şans hesabı (temel + item + tayfa×Pita + hayvan + buff − hasar cezası, en fazla %100), kart üzerinde döküm | ✅ | |
| Event illüstrasyonları (gökyüzü × deniz × ~55 nesne × hava efekti), yavaş kaydırma | ✅ | `CUSTOM_ART` ile değiştirilebilir. GDD'deki "her tip için 2–3 hazır varyant" yerine katman kombinasyonu kullanıldı |
| Sonucun iki kez alınmasının engellenmesi (UI + çekirdek + kayıt) | ✅ | |

## Tayfa ve hayvanlar
| Özellik | Durum | Not |
|---|---|---|
| 30 tayfa: sınıf, fiyat, bölge, pasif, event bonusu, alıntı, açıklama, özgün sprite, kendi idle animasyonu | ✅ | |
| Tüm pasif ve sinerjiler (Pita, Doc+Esperanza, Tarçın+Pita, Cüce+Reza) | ✅ | Bırakılan tayfanın etkisi anında kalkar (etkiler her seferinde mevcut tayfadan hesaplanır) |
| 5 hayvan, pasifler, bisküvi, özel seçenekler | ✅ | |
| Güvertede yürüme, durma, yön değiştirme, sınır içinde kalma, çakışmadan kaçınma | ✅ | |
| Hayvan–tayfa etkileşimleri (Zıpır+Groot, Tarçın+Bjorn kemik, Tarçın+Pita, Cüce+Hamid tespih, Cüce+Reza omuz, Kırmızı+Diego "Rum iç!", Gece Yarısı+Magda) | ✅ | |
| Eski Dostlar: 5 birlikte döngü, event tepkileri, sessizlik + kararma + başlık sinematiği, kapasite 2, Codex sayfası, özet satırı | ✅ | |
| Event sırasında tayfanın "görev animasyonu" | 🟡 | Event ekranı tam ekran illüstrasyon olduğu için güverte görünmez; tayfa portreleri seçenek kartlarında, güverte tepkileri (savaşçılar silah çeker, Tarçın havlar, Zıpır oturur) eventten hemen önce yolculuk sahnesinde oynar |

## Meta, kayıt, ekranlar, ses, performans
| Özellik | Durum | Not |
|---|---|---|
| 20 kalıcı upgrade, önkoşullar, gizli Solara dalı, XP ayrı takibi | ✅ | |
| Codex (limanlar, olaylar, zincirler, tayfa, hayvanlar, mallar, başarımlar, istatistik, koleksiyon sayfaları, Eski Dostlar) | ✅ | |
| Otomatik aktif run kaydı (RNG durumu dahil), yedekli, sürümlü, dışa/içe aktarma, çift onaylı sıfırlama | ✅ | |
| Ana menü, harita, liman, yolculuk, event, run özeti, yükseltmeler, Codex, ayarlar | ✅ | |
| Ses: deniz/liman/fırtına ambiyansı, üretken müzik (menü, liman, yolculuk, tehlike, gizem, Eski Dostlar), tüm efektler; ayrı ses ayarları | ✅ | Müzik moda göre değişir; GDD'deki "bölgeye göre farklı müzik" uygulanmadı 🟡 |
| Mobil: yatay zorunlu, 16:9–20:9 uyumu, güvenli alan, döndür ekranı, isteğe bağlı tam ekran, dokunma koruması, uzun basma | ✅ | |
| Performans: düşük çözünürlüklü tampon, önbellekli sprite/gökyüzü/şehir, arka planda durdurma, 30 FPS modu, animasyon azaltma | ✅ | Ayrı "parçacık azaltma" anahtarı arayüze eklenmedi 🟡 |
| PWA manifest + service worker, tek dosya build, `dist/web` | ✅ | |
| Steam başarımları / Steam SDK | ❌ | HTML5 hedefi kapsamı dışında |
| Hazır lisanslı pixel art paketi | ❌ | Bilinçli olarak kullanılmadı; tüm görseller koddan üretiliyor |

## Top-down yolculuk reworkü
| Özellik | Durum | Not |
|---|---|---|
| Top-down gemi, 5 ayrı seviye (gövde, güverte, direk, dümen, kargo alanı, yürünebilir alan, hasar görseli) | ✅ | Yarı saydam yelkenler, salınım/rota düzeltme |
| Yaşayan güverte: tüm tayfa + hayvan, 4 yön yürüme, kişiliğe göre işler, hayvan davranışları, dokununca bilgi paneli | ✅ | Kişilik senaryoları (Groot tamir, Pita yemek, Zıpır güneşlenme, Tarçın iz sürme…) |
| Güvertede görünen kargo (al/sat/kaybet anında değişir) | ✅ | |
| Gerçek zamanlı yolculuk, ambiyans (balık, martı, uzak gemi, enkaz, gölge, sis, adacık, hava); seyir varsayılan olarak eski ×3 hızında | ✅ | Hız düğmesi kaldırıldı |
| Deniz yolu seçimi, gizli hedef, ipucu doğruluğu, bölgesel talep | ✅ | |
| EncounterDirector yaşam döngüsü, aksiyon primitifleri, kayıt güvenliği | ✅ | |
| Korsan Baskını: Savaş / Kaç / Rüşvet / Teslim ol (yanaşma, kanca, korsanlar sandık taşır) | ✅ | |
| Her event için özel sahne (109/109: tehlike 18, şans 15, gizem 12, felaket 8, tamir 3, zincir 45, özel 3, tayfa 5, hayvan 4) | ✅ | Her seçenek, başarı/başarısızlık dalı ve otomatik çözüm ayrı kurgulandı. `tools/scenecheck.cjs` hepsini tarayıcıda oynatıp denetler |
| Rıhtım (varış) eventleri giriş animasyonu | ✅ | Korsan, kaçakçı, savaş, lonca, madalyon, Zıpır & Tarçın |
| Kamera | 🟡 | Yalnızca hafif kaydırma/yakınlaştırma ve sarsıntı |
| Varış/yanaşma animasyonu | ✅ | Kıyı ipuçları, iskele, kasaba; liman adı varışta açılır |

## Yaşayan Denizler & Sonsuz Deniz
| Özellik | Durum | Not |
|---|---|---|
| 25 bağımsız X1 olayı, her biri için ayrı koreografi (yaklaşma, tepki, karar, aksiyon, başarı/başarısızlık, çıkış) | ✅ | `scenes/x1.js`; yeni çizimler `Props3.js` |
| 4 zincir / 14 aşama / 12 final, finallere özel görüntü, Codex kaydı | ✅ | |
| Dünya Hafızası bağlantıları (Yanlış Teslimat, Dalgıç Hırsızlar, Kopan Direk, Sahte Ateşkes, Müzayede, Haritasız Fener, Dev Göz, Siyah Yağmur, Kardeşlik, Zıpır) | ✅ | Geri dönen gemiler aynı stil/bayrakla gelir |
| Denizci Günlüğü, görülmemiş olaylara ×1,5 ağırlık (deterministik) | ✅ | |
| 4 Hikâye Yankısı (sahne olarak) | ✅ | |
| 3 fraksiyon (−3..+3), pirateRep taşıması, çift bonus yok, fraksiyon enjekte seçenekleri (animasyonlu) | ✅ | |
| 6 sözleşme, kapasite sınırı, satılamaz görev kargosu, %70 buluşma, eskort gemisi | ✅ | |
| 12 yükseltme (2 yeni dal), 12 başarım | ✅ | |
| Sonsuz Deniz: derinlik I–V, deniz koşulları, kilometre taşları, skor, rekorlar, kozmetikler, güvenli çıkış | ✅ | 50/100/200 ek liman simülasyonu |
| Kayıt v4 → v5 taşıma, idempotent ödüller | ✅ | |

## Denge güncellemesi
| Özellik | Durum | Not |
|---|---|---|
| Item dayanıklılığı (15 item, 2–4 kullanım, kırılma, arayüzde kalan hak) | ✅ | Tüketilebilirler değişmedi |
| Zıpır/Tarçın nadirliği (%40 ilk karşılaşma, %30 ikinci) | ✅ | |
| 4 yeni hayvan + 12 hayvan güverte olayı (her biri özel sahne) | ✅ | |
| Varsayılan seyir hızı ×3, hız düğmesi yok | ✅ | |
| Eskort çakışmaları (yolda ve limanda) | ✅ | |
| Ticaret makası, satış doygunluğu, bölgesel fiyat farkı | ✅ | |
| Sonsuz Deniz: daha dik derinlik, Uçurum kademeleri, gemi tehdidi, pahalı onarım/yükseltme | ✅ | |

## Genişleme Paketi 2 — Kaptanların Hikâyeleri
| Özellik | Durum | Not |
|---|---|---|
| 25 EVT_X2 olayı (6/9/6/3/1), her biri özel koreografi | ✅ | 188 sahne senaryosu tarayıcıda hatasız |
| 4 zincir / 14 aşama / 12 final, alt sonuçlar Codex'te | ✅ | Kişisel zincirde güvenli kapanış |
| Zincir kotası (2 aktif / 1 kişisel), kalan seyir şartı, bekleyen aşamaların olay sayısına dahil edilmesi | ✅ | |
| 12 yükseltme (5680 XP), 8 başarım | ✅ | İşaret Fenerleri: run başına bir güvenli iletişim seçeneği |
| Sonsuz Deniz üst sınırı + 6 derinlik varyantı | ✅ | |
| Kayıt v6 (x1 korunur) | ✅ | |
| 3/4 görünüm çizimleri kaynak koda taşındı | ✅ | Yüklenen sürümle yan yana görsel karşılaştırma |
| İstem dışı sözleşme başarısızlığında −1 itibar | 🟡 | Paket 1'de ceza yoktu; Sözleşme Teminatı'nın anlamlı olması için küçük kontrollü düzeltme |

## Genişleme Paketi 3 — Efsanevi Denizler ve Rakip Kaptanlar
| Özellik | Durum | Not |
|---|---|---|
| 25 EVT_X3 olayı (6/8/6/4/1), 3 efsane, her biri özel sahne | ✅ | Efsanelerde her seçeneğin fiziksel sonucu farklı |
| Rakip kaptan ilişkisi (−2..+2), 2 liman bekleme, seferde tek karşılaşma, −2 takip | ✅ | Neris'in gemisi ve figürü yeni |
| 4 zincir / 15 aşama / 12 final, 4 yankı | ✅ | Kişisel değil; 2 aktif zincir sınırı |
| 8 yükseltme (4370 XP, registry 52), 10 başarım | ✅ | |
| Denizci Kroniği (Codex), Denizcilerin Mirası epiloğu | ✅ | |
| Kayıt v7 (x1/x2/eğitim korunur) | ✅ | |
| Sahne adımı normalleştirme (`normSteps`) | ✅ | Eski bir hata: iç içe `[par, wait]` grupları atlanıyordu |
| Gerçek mobil cihaz testi | ⬜ | Yalnızca masaüstü Chromium ile test edildi |

## Gizli Deniz Hikâyeleri (23 easter egg)
| Özellik | Durum | Not |
|---|---|---|
| 23 EVT_EGG olayı (11/9/2/1, 17 nadir + 6 çok nadir), 69 seçenek | ✅ | Yeni yükseltme/başarım yok |
| Ayrı RNG akışlı zamanlayıcı: normal sefer ≤1, Sonsuz Deniz 6 limanda ≤1 | ✅ | Eski zar akışına dokunmaz |
| 23 özgün sahne, şanslı seçeneklerde ayrı başarı/başarısızlık | ✅ | |
| Codex "Gizli Deniz Hikâyeleri" (spoilersız ???) | ✅ | |
| (8).html çizim yamalarının kaynağa taşınması (Props6) | ✅ | |
| Azaltılmış hareket: sahne sallantısı/parlama sınırı | ✅ | Ayar açıkken tüm sahnelerde |
| Gerçek mobil cihaz testi | ⬜ | Yalnızca masaüstü Chromium |

## Bilinen sınırlamalar
- Rework sonrası simülasyon (300 run): tamamlanma %82,7, run ~43 dk (saf seyir ~18 dk, event başına ~30 sn), ~31 event/run, 1,14 yükseltme/run. Özel sahneler run'ı hedef aralığın (25–45 dk) üst ucuna taşıdı; gerekirse yaklaşma/çıkış beklemeleri kısaltılabilir.
- Denge (rework öncesi): otomatik oyuncu run'ların ~%87'sini tamamlıyor ve ortalama ~6 limanda bir gemi yükseltiyor (GDD hedefi 2–3). Bilgili bir oyuncu daha hızlı yükseltebilir; zorluk ve fiyatlar `balance.js` ile kolayca ayarlanır. Gerçek oyuncu testleriyle ince ayar önerilir.
- Harita etiketleri ve bazı ikincil yazılar ~19–20 mantıksal piksel (küçük telefonlarda ~10 CSS px).
