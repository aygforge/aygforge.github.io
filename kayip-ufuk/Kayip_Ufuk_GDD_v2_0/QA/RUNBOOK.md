# QA Runbook v2.0

Statik kontrol: `python QA/audit_v20.py`.

Bu denetim JSON ID'leri, atlas yerleşim koordinatları, sprite kimlikleri, harita RLE boyutları ve tarif referanslarını doğrular; uygulama, browser, animasyon kalitesi veya gameplay testi değildir.

İleride 92 runtime kabul testi `Contracts/AcceptanceTests.json` ve 28 görsel kabul testi `Art/AssetAcceptanceTests.json` temel alınır. Bunları sonuç kanıtlarıyla birlikte çalıştırmadan "tam sürüm hazır" denemez.

**Önerilen uygulanma sırası:** G0 statik veri → G1 boot/sahne → G2 sprite PNG/ses → G3 sistemler → G4 iki bağımsız kurtuluş yolu → G5 mobil perf → G6 IndexedDB/sürüm geçişleri → G7 QA kapatılması. Kalıcı insan NPC ve modüler ev duvarları kapsam dışıdır.
