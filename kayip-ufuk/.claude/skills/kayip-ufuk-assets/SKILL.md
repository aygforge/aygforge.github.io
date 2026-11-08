---
name: kayip-ufuk-assets
description: Kayıp Ufuk canlı modern pixel art görsellerini, animasyon sprite'larını, 24 atlas PNG sayfasını ve özgün seslerini üretir; AssetCatalog/AtlasLayout'a uymayan görselleri önlemek ve görsel doğrulama yapmak için kullanılır.
---

# Kayıp Ufuk — özgün sanat üretim becerisi

**Kaynak tekliği:** `Art/SpriteCatalog.json` (3180 kayıt) ve `Art/AtlasLayout.json` (24×1024×1024 RGBA atlas), `Art/ArtDirection.json`, `Art/AvatarRig.json`, `Art/AudioManifest.json`.

1. Önce `Kayip_Ufuk_GDD_v2_0/ProductionTruth_v2.0.json` ve yukarıdaki gerçek dosyaları oku. `DB/AssetManifest.json` ile `Art/` dosyaları farklıysa `Art/` runtime sprite eşlemesi esas.
2. Planlı atlaslardaki her `spriteId` için bounding rect ve `pageId` bilgisine göre özgün pixel-art çizimini **gerçek RGBA PNG** sayfasına yerleştir. Görseli runtime'da üretmeye karar verirsen aynı atlas çıktısını derleme sırasında oluşturacak gerçek generator kodu teslim et.
3. 32×32 karo, 32×48 karakter; dört yön, keskin piksel büyütme, ortak palet ve çapa noktaları. 16 klip / 322 temel poz, saç/giysi/equipment varyasyonları; yüzme/dalış/olta/uyku için ayrı hareket.
4. Evler (4 hazır ev + inşa aşamaları + tavan görünürlüğü), 58 yapı, 179 ayırt edilir item ikonu, 25 tür animasyonu, 12 mahsul büyüme evresi, 38 POI, deniz/su/hava efektleri ve dokunmatik HUD görsel sistemini eksiksiz üret.
5. Tek sembolün değiştirilmiş rengiyle 3180 varlığı sahte tamamlama sayma. Boş sayfa, emoji, eksik çapa, farklı atlas koordinatı, karelerin tamamında aynı poz, yer tutucu siluet finalde kabul edilmez. Gerekli özgün sprite'ların sanat kalitesini gerçek PNG örnekleriyle kontrol et.
6. `assets/audio/` altındaki 63 tetikleyici için özgün ses dosyası veya çalışan yerel WebAudio synthesis haritası üret; sessiz fallback varsa kullanıcının bunu görebilmesi gerekir; dış ağ koşulu olamaz.
7. `python tools/validate_delivery.py` ile atlas dosyası/PNG başlıklarını denetle. 28 test `Art/AssetAcceptanceTests.json` içinde; gerçek tarayıcı kanıtı yoksa 'PASS' deme.

Ayrıntı: [atlas ve kalite notları](references/atlas-quality.md).
