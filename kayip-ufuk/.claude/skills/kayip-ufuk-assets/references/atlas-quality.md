# Pixel art atlas üretim kalite notları

- 24 sayfanın gerçek dosya yolu `Art/AtlasLayout.json.pages[].plannedPngPath` alanında bulunur. Dosya adı tahmin etmeyin.
- Sprite rectangle koordinatları `sprites[spriteId]` içinde; padding ve çakışma kuralları referans testlerinde doğrulanmış. Yerleşim dosyasına göre çiz; runtime lookup `spriteId` ile yapılır.
- Her sprite'ı ilgili kimlik ve davranışına göre ayırt edilir çiz; animasyon kareleri zaman içinde tutarlı hareket gösterir. Sabit resimleri oynatma olarak yeniden adlandırma.
- 1024×1024 RGBA 24 sayfa, çözülmüş hâlde yaklaşık 96 MiB eder. Hepsini sürekli VRAM/CPU RAM'de tutma; yüklemeyi sahneye göre yönet.
- Pixel art ölçeklemesinde imageSmoothing=false, UI'da yeterli kontrast; Android yatay ekranda nesne seçilebilirliği ve 48 CSS px dokunma hedefleri.
- Işık/gece/yağmur için ayrı procedural katmanlar kullanabilirsin; ana dünya spritesız boş kutulara dönüşmemeli.
- Görsel üretim şartını yerine getiremediysen rapora `NOT_DONE` yaz. 3180 atlas slotunun sadece planlanması üretim sayılmaz.
