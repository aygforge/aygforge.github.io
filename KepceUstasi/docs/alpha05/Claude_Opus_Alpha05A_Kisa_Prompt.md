# Claude Opus — Kepçe Ustası Alpha 0.5A (KISA UYGULAMA PROMPTU)

**Mevcut çalışan Alpha 0.4C kaynak projesini temel al. Oyunu sıfırdan yazma.** Ekteki `Alpha05A_Level_21_30.json` verisini ve `Alpha05A_Mantarli_Omlet_Teknik_GDD.md` dosyasını oku. Bunlar önceki 0.4C veri sözleşmesinden geliştirilmiş tasarım dosyalarıdır; gerçek kodun JSON şemasını önce kısaca kontrol edip gereken küçük adaptasyonu yap.

**Görev:** Mantarlı Omlet **L21–30** ekle. Her level'ın JSON'daki adı, 3–6 normal dalgası, dalga sonunda bir yetenek seçimi, tarif hedefi, düşman kompozisyonu, spawn ve final tipini uygula. L25 mini boss, L23/L24/L27/L29 çift final, L30 Koca Mantar boss; finalden sonra yetenek yok.

**Yeni davranışlar:** Mantar koruyucu kendi 3./6. enemy action'ında uygun yakındaki müttefiğe +2 kalkan verir (hedefte max3, koruyucu başına max2 pulse, faz başına tek kalkan olayı). Soğan 2 kabukla başlar; kırıldıktan **sonraki** fazlarda [1,2] hareket düzenine geçer. Koca Mantar 72 HP+4 kalkan, HP ≤ %50 olunca **bir kez** 2 normal mantar çağırır ve hareketi [1,2] olur; 3. düşman eylemlerinde toplam max2 shield pulse uygular. Boss ölünce zafer anında kapanır; bekleyen eylem ve ödüller tekrarlanmaz. Tam kurallar GDD/JSON'dadır.

**Dokunma:** L1–20 ve 0.4C içerikleri, Matter.js kepçe, hibrit tencere, tek Şef, 24 yetenek, dört ekipman, enerji, iki dungeon, ekonomi, kayıt, reklam/IAP köprüleri. Yeni şef, yeni meta ekranı, ağır animasyon, yeni dungeon veya 0.5B sistemi ekleme. Yeni sprite'lar sade pixel art, basit ikon/poz yeterli.

**Kısa doğrulama:** `npm run build`; ilgili birim testleri (kalkan, kabuk, çift final, boss çağırma, snapshot ve tek ödül); en fazla **3 kısa smoke koşusu**. 100+ seed, kapsamlı simülasyon, uzun performans veya denge raporu üretme. Bir hata çıkarsa sadece ilgili testi tekrar et.

**Teslim:** Kaynak proje ZIP + web build ZIP + en çok 10 satırlık değişiklik/test özeti. Kodun tamamını sohbete dökme. Test edilmeyen gerçek Android cihazı test edilmiş gibi gösterme.
