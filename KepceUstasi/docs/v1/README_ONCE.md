# KEPÇE USTASI V1.0 — TEK PROMPT TESLİMİ

Bu paket **oyun kodu değildir**; mevcut çalışan Alpha 0.5A.1 kaynak kodunun gerçek V1.0'a genişletilmesini sağlamak için hazırlanmış **tek geliştirme promptu ve hazır level verisidir**.

## Claude Opus'a verilecekler
1. **GÜNCEL çalışan Alpha 0.5A.1 kaynak ZIP'i** (veya o sürümü içeren repo).
2. **`Kepce_Ustasi_V1_Master_OneShot_Prompt.md`** — yalnız bir ana prompt.
3. **`Kepce_Ustasi_V1_Compact_Content.json`** — ek istek değil, doğrudan kullanılacak hazır oyun verisi.

İki son dosyayı birlikte yükleyip Claude'a "Ekli master promptu uygula; Alpha 0.5A.1 kaynağını temel al; ekli JSON'u veri olarak entegre et" demen yeterli.

## Tasarım özeti
- 1–30 arasındaki mevcut level, savaş fiziği ve kayıt aynen korunur.
- JSON **31–120** aralığındaki 90 yeni level ve dokuz yeni yemek chapter'ını tanımlar.
- 90 stage, **405 normal dalga**, **90 final karşılaşması** ve 126 final düşmanı (tek/çift/üçlü/boss) içerir.
- Normal stage için 3–6 dalga + final ve dalga başına bir kart seçimi.
- Dört dungeon: Altın Mutfak, Malzeme Deposu, Boss Mutfağı, Sonsuz Kazan Kulesi.
- 4 ekipman slotu: Common, Uncommon, Rare, Epic, Legendary; garanti üretim/forge sistemi.
- 24 mevcut run yeteneği, dalgalar arası yağ mühimmatı ve tekrar vuran düşmanlar korunur.
- **5 enerji/run**, maksimum 30, 12 dakikada +1, günde iki ödüllü reklamlı tamamlama.
- Monetizasyon ve Android hazırlığı ayrıntılı; gerçek AdMob/Play Console kimliği olmadan üretim SDK'sı sahte başarılı gösterilmez.
- Opus limitine özen: binlerce simülasyon, kapsamlı raporlar ve oyun dışı araştırma YOK.

## İçerik veri biçimi
JSON `ch[]` chapter tanımları, `st[]` level tanımlarıdır. Her `w` normal dalgası üç düşman sayısından oluşur; sayıların indeksleri o chapter'ın `e[]` düşman sırasına karşılık gelir. Bu, savaşın lane/şerit sistemine döneceği anlamına gelmez.

## Sınırlamalar
Güncel Alpha 0.5A.1 kaynak ZIP'i bu ChatGPT mesajında bulunmadığından, **kodla birebir şema uyumluluğu henüz test edilmedi**; master prompt Opus'a uyarlama görevi verir. Hazır veri, gerçek oyuncu zorluğuyla kalibre edilmiş nihai ölçüm değildir. Android AAB ve reklamlar için dış SDK, hesap ve imzalama ayarları gerekebilir.
