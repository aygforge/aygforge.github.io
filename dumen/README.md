# DÜMEN — mobil yatay HTML5 balıkçılık oyunu

Sıcak, absürt bir balıkçı kasabası: balık tut, Rüstem'e sat, tekneni 10 seviyede büyüt, 8 bölgeyi keşfet, 88 türü Denizin Defteri'ne yaz, Antik Kraken'i yakala.
Tamamen statik: build gerekmez, internet/CDN gerekmez. Kasaba, Liman Sokağı, harita, karakterler, iç mekânlar, 8 balıkçılık bölgesi arka planı ve çerçeveli su altı panelleri kullanıcının çizdiği yerel görsellerdir (`assets/`); balıklar, eşyalar, tekne ve efektler Canvas ile çizilir, sesler WebAudio. Görsel yüklenemezse prosedürel çizime geri düşülür.

## Çalıştırma
- **Doğrudan:** `index.html` dosyasını tarayıcıda aç (`file://` çalışır; kaynak JSON'lar `src/data/source/sources.js` içine birebir gömülüdür).
- **Statik sunucu:** `npx serve .` veya `python3 -m http.server` → `http://localhost:8000/`.
- **GitHub Pages:** bu klasör `https://aygforge.github.io/dumen/` adresinde yayınlanır.
- **itch.io:** `bash tools/build-zip.sh` → `dist/DUMEN_html5.zip` (index.html kökte). itch.io'da "HTML" proje türü, "This file will be played in the browser" işaretle, boyutu 1920×1080 (veya "Mobile friendly" + "Fullscreen button") seç.
- **Geliştirici modu:** `index.html?debug=1` → Ayarlar'da veri doğrulama özeti, coin/materyal/tekne/bayrak düğmeleri, reklam emülatörü (ödül yazmaz). Normal oyunda görünmez.

## Mobil
- Yatay 16:9 tasarım (mantıksal 1920×1080). 19.5:9 / 20:9 telefonlarda sahne yana **uzatılır** (extend), 4:3'te yukarı/aşağı; çentik güvenli alanı (`env(safe-area-inset-*)`) HUD'a uygulanır.
- Dikey tutulunca "Telefonunu yatay çevir" katmanı çıkar; oyun durumu korunur.
- Dokunma hedefleri en az 44 CSS px (ölçeğe göre hesaplanır). Eylemler yalnız `click` ile tetiklenir; SAR basılı tutma pointer capture + `pointerup/pointercancel/lostpointercapture` ile bırakılır. Sahne değişimi, modal açılışı ve sekme gizlenmesi tüm basılıları serbest bırakır.
- **Tam ekran:** Menü ve Ayarlar'daki düğme gerçek `requestFullscreen` (webkit yolu dahil) çağırır ve mümkünse yatay kilitler. iPhone Safari tam ekran API'si sunmaz; oyun bunu açıkça söyler (çözüm: Paylaş → Ana Ekrana Ekle).
- Ses ilk dokunuşta açılır (autoplay yok). Ayarlar: müzik/efekt seviyesi, sessiz, titreşim, azaltılmış hareket, yüksek kontrast, düşük güç (30 FPS + 1× çözünürlük), arayüz boyutu.

## Reklam durumu (dürüst)
Bu sürümde **gerçek bir reklam SDK'sı yoktur.** Kara Pazar Çarkı'nın günlük 1 ücretsiz hakkı çalışır; 2 ödüllü reklam hakkı "Reklam entegrasyonu gerekli" açıklamasıyla devre dışıdır. Entegrasyon için sayfaya şu adaptör eklenir:
```js
window.DUMEN_AD_PROVIDER = { isReady: () => true, showRewarded: async () => ({ rewarded: true /* yalnız gerçek SDK başarı geri çağrısında */ }) };
```
Oyun yalnız `rewarded === true` sonrası tek kullanımlık jeton üretir; jetonsuz/sahte istek hak vermez. Reklam iptal/başarısızsa hak tüketilmez.

## Oynanış özeti
- **Kasaba:** ana görünüm kullanıcının sağladığı illüstrasyondur (`assets/town_main.webp`); binalara dokununca içeri girilir. Soldan: Diğer Sokak (evin solu), Evim (kapının yanındaki ilan panosu), Market, Restoran (şimdilik kapalı), Hurdacı Hasan, Belediye (Denizin Defteri arşivi — Kaya Usta, Tersane İzni, duyurular); sahilde Komplo Teorisyeni'nin Evi ve Rüstem Aga; iskele/kayık → Balığa Çık. Martı iskele yanındaki kayığa konar.
- **Liman Sokağı** (evin solundan): Geri Dönüşüm Fabrikası (fabrika binaları), Zıpırleone'nin Mekanı (ortadaki Karanlık Mahalle; girişte Tekir), Tekne Atölyesi (tekne hangarı), Café (şimdilik kapalı), en sağ → Kasaba. Bu sokağın iskelesinden balığa çıkılmaz.
- **İç mekânlar:** Evim, Belediye (deniz müzesi; akvaryum → Denizin Defteri), Rüstem Aga, Market, Hurdacı Hasan, Geri Dönüşüm Fabrikası, Tekne Atölyesi, Karanlık Mahalle (Zıpırleone) ve Komplo Teorisyeni'nin evi kullanıcının çizdiği arka planlarla (`assets/bg/`); bilgi paneli önemli öğeyi kapatmayacak tarafta açılır.
- **Harita:** boyalı dünya haritası; 8 bölge görseldeki yerlerinde (Eski Liman sol alt, Yakamoz sol üst, Buzullar üst orta, Korsan Mezarlığı sağ üst, Kaynar Kazan sağ, Sazlıklar sağ alt, Paslı Sanayi alt orta, Bermuda ortadaki girdap). Kilitli bölgeler karartılır ve kilitlenir; bilgi kartı en az bölgeyi kapatan köşede açılır, ✕ ile gizlenir.
- **Karakterler:** Rüstem Aga, Hurdacı Hasan, Don Zıpırleone, Tekir (Don'un sağ kolu), Kaya Usta, Kropi Usta, Ahmet (Market), Belediye Başkanı, Geri Dönüşümcü — kullanıcı çizimleri iç mekânlarda ve diyalog portrelerinde. Müfettiş Tarçov, Komplo Teorisyeni, Martı ve oyuncu için görsel verilmediğinden prosedürel çizimler kullanılır.
- **Bölge görselleri:** her bölgenin arka planı `assets/regions/<KOD>.webp`, su altı paneli `assets/panels/<KOD>.webp` (EL Eski Liman, TS Sazlıklar, PSK Paslı Sanayi, YK Yakamoz, TB Buzullar, BKM Korsan Mezarlığı, KKD Kaynar Kazan, BG Bermuda). Tekne her görselde ön plandaki suya oturur (`RegionArt.BG_INFO`); siluetler, kanca ve balık panelin çerçeve içindeki penceresinde hareket eder (`RegionArt.PANEL_INSET`), siluet dokunma alanı da bu penceredir. Harita kartında seçili bölgenin önizlemesi (arka plan + panel) gösterilir.
- **Kayık:** balıkçılıkta her bölgenin kendi renkli kayığı (`assets/boats/<KOD>.webp`) kullanılır; oyuncu karakteri görünmez, olta kayıktaki tutucudan çıkar, gerilimle bükülür ve misina ucundan atılır. Takılı bayrak kozmetiği kıç direğinde dalgalanır. Tekne seviyesi görseli Tekne Atölyesi'nde gösterilmeye devam eder.
- **HUD:** sol üstte tahta bar (`assets/hud/`): Miyav Puanı, Hurda (Scrap) ve Coin ikonlarının alt plakalarında miktar yazar (10.000 üstü 12,3B / 1,2M kısaltılır; tam değer ekran okuyucu etiketinde). Çanta ikonu Envanter'i açar (balıkçılıkta yalnız olta atılmadan önce). Tekne seviyesi ve ambar barın yanında. HUD `--fs` ile, yani Arayüz Boyutu ayarıyla birlikte ölçeklenir.
- **Çöpler:** 9 çöp, kullanıcı ikonlarıyla (`assets/trash/`): Paslı Cıvata & Somun, Dişli Çark, Eski Gemi Çanı, Kopuk Kablo, Paslı Kapak, Paslı Motor, Plastik Poşet, Tek Çorap, Şişede Mesaj. Fabrikada materyale ayrışır.
- **SAR / ÇEK:** SAR düğmesi makara görselidir; basılı tutunca sarma kareleri (F1→F6) döngüyle oynar, bırakınca bırakma kareleri (RB1→RB5) bir kez akar. ÇEK düğmesi ip çerçeveli tahta görsel; çekmeye hazırken yeşil parlar ve nabız atar.
- **Kasabadaki kayık:** iskelenin sağında denizde hafifçe dalgalanan kayık (`assets/town_boat.webp`), üzerinde Martı. Martıya/kayığa dokununca ya da kendiliğinden ara ara replik söyler.
- **Balıkçılık:** Oltayı At → bekle → siluete dokun (su altı panelinin tamamı dokunma alanıdır; basıldığı anda en yakın siluet seçilir; masaüstünde 1–4 tuşları) → **SAR** (basılı) / bırak → İnat düşük, mesafe yakın, gerilim kırmızı dışındayken **ÇEK**. Gerilim yeşil/sarı/kırmızı; kırmızıda kısa düzeltme süresi var, uzun kalırsa ip kopar; uzun gevşeklikte balık kaçar; iki erken Çek "Erken çektin". 7 davranış ailesi ayrı hamle setleri kullanır; Kraken 3 evrelidir. Masaüstü: Boşluk = SAR, Enter/E = ÇEK.
- **Hazine:** ayrı zamanlama barı (yalnız yeni dokunuş sayılır). Sandık envantere girer, Envanter'den açılır.
- **Ekonomi:** tek fiyat hesaplayıcı (temel × nadirlik × boy × tazelik × Rüstem ilişki bonusu). Tazelik aktif oyun süresine bağlı.
- **İlerleme:** 10 tekne seviyesi, 9 olta, 4+4+3 ekipman, 14 yem, 25 özel eşya, kara pazar parçaları, 36 sipariş şablonu + 10 günlük, 19 ana görev, 13 hikâye bölümü, koleksiyon ödülleri.

## Mimari
```
index.html, style.css
src/core      ns, RNG (seed), EventBus, Clock (aktif oyun saati + saat geri alma koruması), Transactions (atomik + idempotent),
              Save (sürümlü, migration, yedek, export/import), Ads (adaptör), Game, Audio, Input, SceneManager
src/data      source/ (kaynak JSON'lar birebir + gömülü kopya), EconomyConfig, RegionDB, FishBalanceDB, ItemBalanceDB,
              BoatDB, ChestDB (+KeyRules, TrashDB, CosmeticDB), RecipeDB (+FactoryDB, ShopDB, WheelDB), NPCDB (+DialogueDB), QuestDB, Validate
src/systems   Inventory (+Econ), Loadout (25 özel eşya handler'ı), Encounter, Fishing (FightSim + TreasureBar), Quests, Actions
src/render    Art, FishArt (88 tür), ItemArt (102 ikon), NPCArt, BoatArt (10 seviye), SceneArt, RegionArt (8 bölge)
src/ui        UI (yerleşim, düğme, modal, diyalog, tam ekran), HUD, Panels
src/scenes    Boot, MainMenu, Town, Map, Fishing, NewStreet, Shops (Rüstem/Market/Hasan/Fabrika/Atölye/Kaya), Zipirleone (+Çark, Arka Oda),
              Inventory, Journal, Fishpedia, Settings
tests         load.js, run.js (Node), e2e.js (Playwright)
```
- **Statik DB ≠ runtime ≠ kayıt.** `FishDBSource`/`ItemDBSource` dondurulmuş; denge katmanları ayrı; kayıt yalnız ilerleme içerir.
- Her ekonomik eylem `systems/Actions.js` içinde tek yetkili fonksiyondur ve `Tx.run` ile taslak kopya üzerinde çalışır: doğrula → hesapla → uygula → değişmezleri kontrol et (stok ≥ 0, cüzdan tam sayı ≥ 0, benzersiz örnek kimlikleri) → commit → kaydet. Başarısızlıkta hiçbir kısmi değişiklik kalmaz; aynı `txId` ikinci kez işlenmez (ör. `cast:<id>`, `chest:<id>`, `wheel:<gün>:free`, `boat:<seviye>`).
- UI yalnız `Game.act()` çağırır; başarı mesajı yalnız `ok` sonrası gösterilir.

## Testler
```bash
node tests/run.js            # 209 test: veri bütünlüğü, işlem/idempotency, balıkçılık, 25 özel eşya, ekonomi, görevler, çark, kayıt, uçtan uca otomatik oyuncu
node tests/run.js --report   # + DATA_INTEGRITY_REPORT.md üretir
node tests/e2e.js            # Playwright + Chromium: gerçek pointer ile tam akış, çift tıklama, modal, kalıcılık, mobil boyutlar (19 kontrol)
node tests/e2e-touch.js      # Dokunmatik telefon görünümü: kasabadaki her binanın doğru yere açılması, hareketli siluete dokunma, hazine DOKUN düğmesi, panellerin taşmadan kaydırılması
```
Otomatik oyuncu yalnız gerçek eylemleri kullanarak yeni oyundan Tekne Sv.10'a, 8 bölgeye, 13 hikâye bölümüne ve Antik Kraken'e ulaşır (softlock testi).

Belirsiz kaynak noktaları ve seçilen çözümler: **CANON_GAPS.md**. Veri sayımları ve edinim tablosu: **DATA_INTEGRITY_REPORT.md**.
