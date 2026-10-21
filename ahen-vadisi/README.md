# AHEN VADİSİ — V2.0 «Kül ve Ayaz»

Mobil öncelikli (yatay ekran), HTML5 tabanlı, eski usul 2D fantastik RPG. Karaağaç Köyü'nden Derin Ocak'a uzanan
Lv. 1–20 ilerleme döngüsü (V1) ve onun üzerine kurulan **V2.0 Kül ve Ayaz Genişlemesi (Lv. 21–30)**: Kırık Damar
Madeni'nin doğusunda açılan göçükten Kül Yaylaları'na, oradan Ayaz Geçidi'ne ve Buz Mabedi zindanına uzanan yeni hikâye.
Warrior veya Mage ile seviye kas, nadir eşya düşür, demircide +5'e kadar yükselt, Alfa Kurt, Maden Golemi, Kül Devi ve
Donmuş Muhafız'ı yen, zindanlara sınırsız gir ve Legendary avına çık.

V1 kayıtları V2'de otomatik ve kayıpsız açılır (geçişten önceki kayıt `v1_backup` olarak saklanır).
Değişiklikler: [`docs/CHANGELOG.md`](docs/CHANGELOG.md) · V2 mimarisi ve bilinen sınırlamalar: [`docs/V2_NOTLARI.md`](docs/V2_NOTLARI.md)

Oyuncu karakterleri (Warrior, Mage), Cevher Rahibi, Çayır Sıçanı ve Mağara Yarasası LuizMelo'nun sprite paketleriyle çizilir
(`public/sprites/`, kaynaklar: [`docs/CREDITS.md`](docs/CREDITS.md)). Diğer tüm görseller (V2'nin 12 yeni yaratık/elit/boss
sprite'ı, NPC'ler, kül/kar/buz tile set'leri, 90 eşya ikonu, efektler) ve bütün sesler **oyun açılırken kodla (procedural) üretilir**.
Ayarlar → "Kahraman görünümü: Ekipman görünür (piksel)" seçeneği giyilen silah/zırhı gösteren piksel kahramanı kullanır.
Sprite paketi yüklenemezse oyun otomatik olarak procedural karaktere geri döner.

## Ekran görüntüleri

| | |
|---|---|
| ![Köy HUD](docs/ekran/hud-844x390.png) | ![Orman](docs/ekran/forest-control.png) |
| ![Maden Golemi](docs/ekran/golem-fight.png) | ![Demirci](docs/ekran/demirci.png) |
| ![Envanter](docs/ekran/inventory-844x390.png) | ![Eşya kartı](docs/ekran/esya-karti.png) |
| ![Kül Yaylaları](docs/ekran/v2-ash.png) | ![Kül Devi](docs/ekran/v2-ash-giant.png) |
| ![Ayaz Geçidi](docs/ekran/v2-frost.png) | ![Buz Mabedi](docs/ekran/v2-temple.png) |
| ![Beceri çubuğu](docs/ekran/v2-skills.png) | ![Av Geçmişi](docs/ekran/v2-history.png) |

## Hızlı başlangıç

Gereksinim: Node.js 20.19+ (veya 22.12+).

```bash
cd ahen-vadisi
npm install          # bağımlılıklar (Phaser 3.90, Vite, Vitest, Playwright)
npm run dev          # geliştirme sunucusu: http://localhost:5173  (aynı ağdaki telefondan: http://<bilgisayar-ip>:5173)
npm test             # birim testleri (103 test; 100.000–1.000.000 loot simülasyonu dahil)
npm run build        # üretim paketi → dist/
npm run preview      # dist/ klasörünü yerelde sun: http://localhost:4173
npm run test:e2e     # (önce build) tarayıcıda uçtan uca testler — V1 regresyonu + V2 senaryoları
npm run package      # release/ altında itch.io ZIP'i ve proje arşivi
```

Geliştirici paneli yalnızca adres çubuğuna `?dev=1` eklenince görünür (ör. `http://localhost:5173/?dev=1`).
Normal oyuncu deneyiminde hiçbir hile/test butonu yoktur.

## Hazır HTML5 paketi (itch.io / statik sunucu)

`npm run build` sonrası `dist/` klasörü tek başına çalışır:

- `index.html` kökte, tüm dosyalara **göreli yollarla** erişir (`base: './'`).
- Ek sunucu veya backend gerekmez; kayıt tarayıcıda IndexedDB'de tutulur.
- `sw.js` servis işçisi tüm dosyaları önbelleğe alır → HTTPS veya localhost üzerinde **çevrimdışı oynanır**.
- `manifest.webmanifest` ile Android'de "Ana ekrana ekle" → tam ekran yatay PWA.

### itch.io'ya yükleme

1. `npm run package` → `release/ahen-vadisi-html5-itch.zip` oluşur (içinde kökte `index.html`).
2. itch.io → *Create new project* → **Kind of project: HTML**.
3. ZIP'i yükle, **"This file will be played in the browser"** kutusunu işaretle.
4. *Embed options*: **Mobile friendly** ✔, **Orientation: Landscape**, *Viewport dimensions* 960×540,
   **Fullscreen button** ✔ (önerilir), *Automatically start on page load* isteğe bağlı.
5. Kaydet ve önizle. (itch.io iframe'inde servis işçisi tarayıcıya göre çalışmayabilir; oyun yine de çalışır.)

### GitHub Pages

Bu depoda `ahen-vadisi/dist/` derlenmiş haliyle bulunur. Dal `main`'e birleştirildiğinde oyun
`https://aygforge.github.io/ahen-vadisi/dist/` adresinden oynanabilir (HTTPS → PWA/çevrimdışı destekli).

## Kontroller

| Dokunmatik (birincil) | Klavye (masaüstü) |
|---|---|
| Sol alt joystick: hareket (en yüksek öncelik, otomatik yaklaşmayı anında keser); halkanın çevresine dokunmak da yönlendirir | WASD / oklar |
| Düşmana dokun: hedef seç → yol bularak yaklaş → menzilde otomatik normal saldırı | — |
| NPC / cevher / bitki / görev nesnesine dokun: yaklaş ve etkileşim | — |
| Büyük kılıç: aktif saldırı — her basış en yakın düşmana bir vuruş, basılı tutunca vurmaya devam | Boşluk |
| Küçük kırmızı "OTO" butonu: otomatik normal saldırı aç/kapa | R |
| Sağ alt 4 beceri butonu (manuel; hangi 4 aktif becerinin duracağı Beceriler ekranında seçilir) | 1–4 |
| HP / MP iksir butonları; hedef değiştir (klavye) | Q / E, Tab |
| Sağ üst: Çanta, Karakter, Beceriler, Görevler, Ayarlar, mini harita | I, C, K, J, Esc, M |

Zemindeki altın oklar takip edilen görevin bir sonraki hedefine (başka haritadaysa oraya götüren geçide) giden
yolu gösterir; Ayarlar → "Görev yön okları" ile kapatılabilir. Harita geçişleri geçidin tamamından yapılır.

Kurallar (belge §3.1): joystick bırakılınca karakter hedefe kendiliğinden koşmaz; hedef ölünce yeni hedef
otomatik seçilmez; erişilemeyen hedefe sonsuz koşma olmaz; duvar arkasından saldırı yapılamaz.

## İçerik özeti

- **Sınıflar:** Warrior (Savaşçı), Mage (Büyücü) — 5 aktif (Lv.25: Kılıç Yağmuru / Zincir Yıldırım), 3 pasif, Lv.20 Ustalık I,
  4 düğmelik beceri çubuğu, Lv.30 Ustalık Kitapları; Lv.30'da 31 beceri puanı, 87 stat puanı.
- **Dünya:** Karaağaç Köyü (64×48), Fısıldayan Orman (120×88), Kırık Damar Madeni (104×78), Sis Bataklığı (112×80),
  Derin Ocak dungeon'ı (104×80, 4 bölüm); **V2:** Kül Yaylaları (112×80, Lv.20–25), Ayaz Geçidi (116×88, Lv.25–30),
  Buz Mabedi dungeon'ı (100×76, 4 bölüm, Mühür Galerisi). Her açık bölgede 4 farm kampı, elit, yol taşı, toplama düğümleri;
  V2 bölgelerinde güvenli kamp, NPC'ler, 2'şer gizli sandık.
- **Yaratıklar:** 20 normal, 5 elit, 4 boss (Alfa Kurt, Maden Golemi, Kül Devi, Donmuş Muhafız) — telegraflı büyük saldırılar,
  aşamalar, kalkan kristalleri, yer tehlikeleri, yardımcı çağırma.
- **Eşyalar:** 90 ekipman şablonu (V1: 14 N / 15 U / 18 R / 11 E / 2 L; V2: 4 U / 15 R / 9 E / 2 L), rastgele bonuslar, +5 yükseltme.
- **Hardcore loot:** Legendary yalnızca Maden Golemi ve Donmuş Muhafız'ın %0,4 boss çekilişinden; pity/garanti/craft/sandık yok.
- **Ekonomi:** Tek para Gold; 8 iksir, 35 tarif (V2 materyalleri V1 materyalleriyle birlikte kullanılır), tamir, parçalama,
  çanta/depo genişletme, ortak depo, yol taşı seyahati.
- **Görevler:** 28 ana + 12 yan görev (40), 2 sınıf görevi, tekrarlanabilir Av Sözleşmeleri.
- **Av Geçmişi:** türe göre öldürme, boss zaferleri, bulunan Rare/Epic/Legendary, tamamlanan zindanlar (ganimeti etkilemez).
- **Kayıt:** 3 karakter yuvası, IndexedDB + atomik yazım, 2 önceki sağlam snapshot, checksum, JSON yedek dışa/içe aktarma,
  sürümlü şema geçişi (V1 → V2) ve geçiş öncesi yedek. PWA: yeni sürüm hazır olunca "kaydet ve yenile" bildirimi.

## Proje yapısı

```
ahen-vadisi/
├─ index.html              giriş sayfası (viewport-fit=cover, dikey ekran uyarısı)
├─ public/                 manifest, uygulama ikonları
├─ src/
│  ├─ main.js              önyükleme, Phaser yapılandırması, yaşam döngüsü (arka plan kaydı)
│  ├─ core/                app (profil, kayıt zamanlaması, stat önbelleği), olay yolu, RNG
│  ├─ data/                MERKEZİ VERİ: sabitler, sınıflar, beceriler, yaratıklar, 90 eşya, materyaller,
│  │                       tarifler, loot oranları, NPC'ler, görevler, 8 harita tanımı
│  ├─ systems/             SAF OYUN MANTIĞI (Node'da test edilir): stats, combat, loot, inventory,
│  │                       economy (alım/satım/craft/yükseltme/tamir), quests, rewards, dungeon, character
│  ├─ save/                şema/doğrulama/checksum + IndexedDB deposu (snapshot, localStorage yedeği)
│  ├─ world/               harita üreticisi, tile kaydı, ızgara (çarpışma, görüş, A*), savaş çalışma zamanı,
│  │                       spawner, efektler, keşif (fog), girdi
│  ├─ entities/            Player (B kontrolü), Enemy (AI), bosslar, etkileşim nesneleri
│  ├─ scenes/              BootScene (doku üretimi), WorldScene, doku kaydı
│  ├─ art/                 procedural pixel-art: pixel tamponu, tile/damga, karakter, yaratık, ikon, efekt, menü manzarası
│  ├─ audio/               WebAudio procedural ses efektleri, ortam ve müzik
│  ├─ ui/                  DOM arayüz: HUD, joystick, menüler, paneller (envanter, karakter, beceri, görev,
│  │                       harita, ayarlar, NPC hizmetleri), eşya kartı/karşılaştırma
│  └─ dev/                 geliştirici paneli (?dev=1)
├─ tests/unit/             Vitest: veri, harita, formüller, loot RNG, ekonomi, görevler, dungeon, kayıt, denge
├─ tests/e2e/              Playwright: mobil HUD (5 çözünürlük), kontrol, kayıt, PWA, performans, dungeon
├─ tools/                  ikon üretici, paketleyici, görsel inceleme betikleri
└─ docs/                   TEST_RAPORU.md, GELISTIRME_NOTLARI.md
```

Tasarım ilkesi: hasar, loot, görev, eşya ve ekonomi işlemleri **tek yetkili sistem** (`src/systems/*`) tarafından
hesaplanır; arayüz yalnızca bu sistemlerin sonucunu gösterir (`src/ui/actions.js` köprüsü).

Ayrıntılı test sonuçları: [`docs/TEST_RAPORU.md`](docs/TEST_RAPORU.md) ·
Genişletme rehberi: [`docs/GELISTIRME_NOTLARI.md`](docs/GELISTIRME_NOTLARI.md)
