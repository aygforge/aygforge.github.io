# CozFis — Telefonda Elle Test Listesi (Android)

Bu listedeki adımlar **gerçek bir telefonda** uygulanmalıdır. Geliştirme ortamında fiziksel cihaz bağlı değildi ve
emülatörde WebView başlatılamadı (bkz. Build Report §5). Bu nedenle aşağıdaki maddeler henüz cihazda doğrulanmadı.

Kurulum: `adb install -r CozFis_Debug.apk` komutuyla ya da APK dosyasını telefonda açarak.
Uygulama ana ekranda "CozFis (debug)" adıyla görünür.

Her maddeyi ✅ (geçti) / ❌ (kaldı) / ⏭️ (uygulanamadı) ile işaretleyin. Kalan maddeler için ekran görüntüsü ve
`adb logcat -d > log.txt` çıktısını saklayın.

**Telefon bilgileri:** marka/model ______ · Android sürümü ______ · Android System WebView sürümü ______ ·
gezinme türü: hareket / 3 tuş · ekran: çentik / kamera deliği / yok

## A. İlk açılış
- [ ] A1. Uygulama açılıyor. Açılış ekranından sonra 5 saniye içinde ana menü görünüyor.
- [ ] A2. Ekran yatay. Telefonu ters yatay çevirince oyun da dönüyor ve kesilmiyor.
- [ ] A3. Durum çubuğu ve gezinme çubuğu gizli. Kenardan kaydırınca geçici olarak görünüyor, sonra yeniden gizleniyor.
- [ ] A4. Çentik veya kamera deliği oyun alanını, logoyu ve düğmeleri kesmiyor. Yanlarda koyu kenar boşluğu olması normaldir.
- [ ] A5. Piksel grafikler keskin; bulanıklık yok.
- [ ] A6. Telefonun dili Türkçe, İngilizce, İspanyolca, Almanca, Fransızca veya Portekizce (Brezilya) ise oyun o dilde açılıyor.
      Başka bir dilde (ör. İtalyanca) İngilizce açılıyor.
- [ ] A7. Uçak modunda (internet yokken) uygulama aynen açılıyor ve oynanıyor.

## B. Dokunmatik ve kontroller
- [ ] B1. Ana menü düğmeleri tek dokunuşla çalışıyor. Çift dokunma ekranı yakınlaştırmıyor, sayfa kaymıyor.
- [ ] B2. Uzun basınca metin seçimi veya "kopyala" menüsü çıkmıyor. Sadece ad yazma kutusunda çıkabilir.
- [ ] B3. Karakter oluşturma: ten, saç, saç rengi, kıyafet ve şapka seçilebiliyor. Ad yazılabiliyor, klavye açılıp kapanıyor ve düzen bozulmuyor.
- [ ] B4. Kasabada yürüme (sol/sağ) ve kapılara girme çalışıyor.
- [ ] B5. NPC ile konuşma ve diyalog pencereleri açılıp kapanıyor.
- [ ] B6. İskelede olta atma: düğmeye basılı tutma güç biriktiriyor, bırakınca olta atılıyor.
- [ ] B7. Balık mücadelesi: basılı tut / bırak ve yön düğmeleri yanıt veriyor. Bir balık yakalanıyor.
- [ ] B8. Envanter, ekipman dükkânı, balık pazarında satış, ansiklopedi ve deniz haritası açılıp kapanıyor. Listeler parmakla kaydırılabiliyor.
- [ ] B9. Ayarlar › Dil bölümünden 6 dilin hepsine geçiliyor. Menü, balık adları ve kasaba tabelaları anında değişiyor.

## C. Geri tuşu / geri hareketi
- [ ] C1. Açık bir panel (envanter, ayarlar…) varken geri → panel kapanıyor, oyun sürüyor.
- [ ] C2. Onay penceresi açıkken geri → pencere "Vazgeç" seçilmiş gibi kapanıyor.
- [ ] C3. Oyunda hiçbir şey açık değilken geri → Menü paneli açılıyor; uygulama **kapanmıyor**.
- [ ] C4. Olta için güç biriktirirken geri → atış iptal ediliyor.
- [ ] C5. Karakter oluşturmada geri → ana menüye dönülüyor.
- [ ] C6. Ana menüde geri → "Çıkmak için geri tuşuna tekrar bas" uyarısı çıkıyor. 2 saniye içinde ikinci basış uygulamayı kapatıyor.
- [ ] C7. (Android 14 ve sonrası) Geri hareketinde öngörülü geri (predictive back) animasyonu uygulamayı yanlışlıkla kapatmıyor.

## D. Ses ve yaşam döngüsü
- [ ] D1. İlk dokunuştan sonra müzik ve efektler çalıyor.
- [ ] D2. Ana ekrana dönünce ses hemen kesiliyor. Uygulama arka plandayken ses gelmiyor.
- [ ] D3. Uygulamaya dönünce ses kaldığı yerden **tek kez** sürüyor; çift müzik yok.
- [ ] D4. Ekranı kilitleyip 1 dakika sonra açınca oyun hızlanmıyor, zaman sıçramıyor, animasyonlar normal.
- [ ] D5. Oyun açıkken telefona bir arama gelince (ya da başka bir uygulama müzik çalmaya başlayınca) oyun sesi kesiliyor.
      Arama bitince ses geri geliyor.
- [ ] D6. Ayarlar'daki müzik/efekt seviyeleri ve sessiz mod çalışıyor ve uygulama yeniden açıldıktan sonra korunuyor.

## E. Kayıt
- [ ] E1. Yeni oyun başlat, bir balık yakala ve sat. Uygulamayı son uygulamalar listesinden kaydırıp kapat, yeniden aç →
      "Devam et" ile gün, para, çanta ve balık aynen geliyor.
- [ ] E2. Oyun sırasında ana ekrana dön ve 10 dakika bekle (ya da birkaç ağır uygulama aç) → geri dönünce kayıt kaybolmamış.
- [ ] E3. Sistemin uygulamayı sonlandırması: geliştirici seçeneklerinde "Etkinlikleri saklama" açıkken ana ekrana dön ve geri gel
      → kayıt korunuyor. Ya da `adb shell am kill com.aygforge.cozfis.debug` komutundan sonra uygulamayı aç.
- [ ] E4. Güncelleme: oyunda ilerleme yap, ardından yeni bir APK'yı `adb install -r` ile **üzerine** kur → kayıt korunuyor.
- [ ] E5. Ayarlar › Kaydı dışa aktar › Dosya indir → Android paylaşım sayfası açılıyor. "Dosyalar" veya Drive'a kaydet;
      oluşan `cozyfishing_gunN.json` dosyası boş değil.
- [ ] E6. Ayarlar › Kaydı içe aktar › Dosya seç → Android dosya seçicisi açılıyor. E5'te kaydedilen dosyayı seç →
      onay penceresinde gün ve para doğru görünüyor; yükleyince oyun o kayıtla devam ediyor.
- [ ] E7. Kaydı dışa aktar penceresindeki "Kopyala" düğmesi metni panoya kopyalıyor. Metni içe aktarma kutusuna yapıştırınca kayıt yükleniyor.
- [ ] E8. Fotoğraf modu › Kaydet → paylaşım sayfasından görüntü galeriye veya Dosyalar'a kaydedilebiliyor.

## F. Grafik ve performans
- [ ] F1. Kasaba, iskele, ev, deniz (en az 3 bölge) ve deniz haritası eksiksiz çiziliyor. Siyah veya boş alan, eksik sprite yok.
- [ ] F2. Ansiklopedi açılınca 70 balık görseli ve silüetler görünüyor; açılış 1 saniyeden kısa.
- [ ] F3. 15 dakika kesintisiz oynanınca takılma, ısınmaya bağlı belirgin yavaşlama ya da çökme yok.
- [ ] F4. (İsteğe bağlı) FPS ölçümü: bilgisayarda `chrome://inspect` aç, cihazdaki "CozFis" WebView'ini seç, Console'a şunu yapıştır:
      ```js
      let n=0,t0=performance.now();(function f(){n++;if(performance.now()-t0<5000)requestAnimationFrame(f);else console.log('FPS',n/5)})()
      ```
      Kasabada, denizde ve ansiklopedide sonucu not et (hedef ≥ 55).
- [ ] F5. (İsteğe bağlı) Bellek: `adb shell dumpsys meminfo com.aygforge.cozfis.debug | grep TOTAL` — 15 dakika oynadıktan sonra
      sürekli artmıyor, kabaca sabit kalıyor.

## G. Hata kaydı
- [ ] G1. `adb logcat -d | grep -E "FATAL|AndroidRuntime|Capacitor/Console.*Error"` çıktısında CozFis'e ait kritik hata yok.
