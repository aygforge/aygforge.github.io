# Kayıp Ufuk v2.0 — Üretime Hazırlık ve Tek Kaynak Paket

**Bu pakette oynanabilir oyun, PNG/WAV assetleri veya tamamlanmış runtime QA yoktur.** Tam sürüm üretimini yönetmek için kaynak GDD, veri tabanları, dünya haritaları, varlık sözleşmesi ve kalite kapıları bulunur.

Önce `Docs/Kayip_Ufuk_GDD_v2.0_Tek_Kaynak_Tam_Surum.md` → `ProductionTruth_v2.0.json` → `ContentIndex_v2.0.json` dosyalarını oku. Geliştirirken `DB/` ve `Maps/` tek kaynak; `Contracts/` uygulama/sahne testleri; `Art/` görsel/ses sözleşmesidir. Önceki ZIP dosyaları ve uygulanmış yamalar tekrar kullanılmaz.

## Güncel sayılar

- 179 eşya, 183 tarif ({'item': 114, 'upgrade': 9, 'build': 60}), 58 yapı.
- 38 keşif, 12 bulmaca, 15 günlük, 20 özel plan.
- 3180 planlı sprite, 24 planlı atlas; henüz gerçek görsel üretilmedi.
- 92 runtime ve 28 görsel kabul testi henüz çalıştırılmadı.

## Denetim

`python QA/audit_v20.py` komutuyla **statik veri ve atlas sözleşmesi** kontrol edilir. Sonuç `QA/Validation_v2.0.json` içinde yer alır. Oyunun çalıştığını kanıtlamaz.

## Son durum

GDD ve içerik **kodlamaya esas teşkil edecek şekilde donduruldu**. Ancak `GO_FOR_IMPLEMENTATION` ≠ `GO_FOR_RELEASE`: PNG/ses üretimi, oyun kodu, cihaz testleri ve iki finalin gerçek oynanması bekliyor.
