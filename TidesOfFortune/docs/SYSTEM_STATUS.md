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

## Bilinen sınırlamalar
- Denge: otomatik oyuncu run'ların ~%87'sini tamamlıyor ve ortalama ~6 limanda bir gemi yükseltiyor (GDD hedefi 2–3). Bilgili bir oyuncu daha hızlı yükseltebilir; zorluk ve fiyatlar `balance.js` ile kolayca ayarlanır. Gerçek oyuncu testleriyle ince ayar önerilir.
- Harita etiketleri ve bazı ikincil yazılar ~19–20 mantıksal piksel (küçük telefonlarda ~10 CSS px).
- Pixelify Sans fontunda "Z" harfi "2"ye benzer.
