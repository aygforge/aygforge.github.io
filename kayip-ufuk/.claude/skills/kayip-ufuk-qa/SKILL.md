---
name: kayip-ufuk-qa
description: Kayıp Ufuk HTML5 survival tam sürümünü referans JSON, 92 oyun kabul testi, 28 görsel testi, IndexedDB idempotans ve iki kurtuluş finali açısından doğrular; kanıta dayalı eksik raporu hazırlar.
---

# Kayıp Ufuk — test ve denetim becerisi

## Kurallar
- İlk `python tools/preflight.py`: kaynak paketini ve 79 statik GDD testini doğrular. Bu, oyunun runtime testi değildir.
- Oyun üretildiyse `python tools/validate_delivery.py`: dist, lokal kaynaklar, atlaslar, PNG boyutları ve rapor dosyaları. Başarısız kontrolü gizleme.
- Referans 92 test `Kayip_Ufuk_GDD_v2_0/Contracts/AcceptanceTests.json`; 28 görsel test `Kayip_Ufuk_GDD_v2_0/Art/AssetAcceptanceTests.json`. Hepsini gerçek test koşusu ve kanıtıyla işaretle; otomatik çalıştırılamayan manuel testleri `NOT_RUN` bırak.
- Android Chrome veya masaüstünde mobil emülasyon Playwright ile konsol ve ekran görüntüsü kaydet. `http://localhost` üstünden giriş ekranı, hareket/etkileşim, cihaz yatay, fullscreen ve FPS profillerini gözle.
- Çifte sandık açma, üretim escrow, envanter dolu craft claim, mevcut yapı upgrade UID'si, içindeki sandık eşyaları, günlük tarım/tuzağın tekil gerçekleşmesi, iki sekme çakışması, transfer sırasında kayıt ve cihaz yeniden başlatma senaryolarını kontrol et.
- Deterministik tohumlarda 63 başlangıç lifi, dört sabit tohum, tüm ana POI erişimi, sal rotaları ve iki finali izle.
- Final sonrası adaya dönüş ve telsiz SOS sonrası 2 oyun gününün işleyişini doğrula.
- Sonuçları `reports/test-results.json`, `reports/STATUS.md`, `reports/evidence/` altında gerçek kanıt referanslarıyla kaydet. `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED` dışında gizemli durumlar kullanma. Bilinmeyeni 'PASS' diye işaretleme.

Detay için [test raporu formatı](references/test-report.md).
