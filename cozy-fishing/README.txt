COZY FISHING — Tam Sürüm (tek dosya, çevrimdışı)
================================================

ÇALIŞTIRMA
- v3.0: cozyfishing_v3.html dosyasını açın (yenilikler için CHANGES_v3.md). cozyfishing_v2.html v2, index.html v1 sürümüdür.
- index.html dosyasını herhangi bir modern tarayıcıda açın (çift tıklama / file:// yeterli).
- İnternet bağlantısı gerekmez. Tüm oyun verisi (70 balık, 21 av noktası, 4 tekne, 40 başarım,
  13 NPC'nin koşullu diyalogları, 4 mevsim şenliği), tüm piksel sanat ve tüm sesler dosyanın içinde üretilir.
- itch.io: ZIP'i "HTML" proje olarak yükleyin, "This file will be played in the browser" seçin,
  oranı 16:9 (ör. 960×540) ayarlayın ve "Fullscreen button" seçeneğini açın.

GENİŞLEME (v1.1)
- Kasaba: Fırın (günlük atıştırmalık), Butik (kıyafet/şapka), Ev Eşyaları (dekor, sandık),
  Şenlik Meydanı (yarışmalar), Çay Bahçesi (günün balığı ×1,5). İskelede 3 balıkçı NPC.
- Her bölgede 10 tür (FishDB v1.2). Her mevsimin 14–15. günleri şenlik ve 8 atışlık yarışma;
  ilk üçe giren kupa ve ödül kazanır, kupalar evdeki Kupa Dolabı'nda sergilenir.
- Mücadele: mükemmel tasma, ◀ ▶ ile yön karşılama, zıplamada gevşetme, ustalık kombosu,
  balık yorgunluğu ve tür bazlı mücadele karakterleri.

KONTROLLER
- Dokunmatik (yatay ekran): alttaki düğmeler; binalara / nesnelere dokunarak yürüme.
  OLTA AT: basılı tut, güç çubuğu dolar, bırak = atış. Mücadelede ◀ ▶ = oltayı yatır. Parmağı düğmeden kaydırmak = ücretsiz iptal.
  Şamandıra dalınca 1,6 sn içinde dokun. Mücadelede basılı tut = sar (gerilim artar), bırak = gevşet.
- Klavye: ←/→ veya A/D yürü/sür · Boşluk olta at/çek · E veya Enter etkileşim · I envanter ·
  1/2/3 av noktası (teknede) · Esc kapat/iptal · F3 QA/test paneli.

KAYIT
- Otomatik kayıt: IndexedDB (yoksa localStorage). Ayarlar → Dışa/İçe Aktar ile JSON yedek alınabilir.
- Her uykuda bir "gün yedeği" tutulur; bozuk kayıt silinmez, ana menüde uyarı ve yedekten yükleme sunulur.

QA / TEST
- F3 veya adres sonuna ?debug=1 ekleyerek test paneli açılır. "Tüm testleri çalıştır" kabul
  testlerini kum havuzunda (gerçek kaydı bozmadan) çalıştırır. Hile düğmeleri isteğe bağlıdır;
  normal ilerleme için gerekmez.

KAYNAK
- Oyun, CozyFishing_Tam_Surum_GDD_v1.0.md, CozyFishing_FishDB_v1.1.json ve
  CozyFishing_GameConfig_v1.0.json tasarım paketinden üretilmiştir.

GELİŞTİRİCİ NOTU
- Kaynak kod src/ klasöründe modüller halinde durur (01_core … 12_main). `python3 build.py`
  komutu JSON verilerini ve tüm modülleri tek index.html dosyasına gömer ve bu ZIP'i yeniden üretir.
