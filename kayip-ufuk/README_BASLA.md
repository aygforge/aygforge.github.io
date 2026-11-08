# Kayıp Ufuk — Claude Opus Tam Sürüm Başlangıç Paketi

**Bu arşiv çalışan oyun değildir.** Çalışan oyunu ürettirmek için GDD v2.0, Claude Code proje becerileri, 1 tek mesaj promptu, statik veri/teslim kontrol araçları içerir.

## Hızlı kullanım

1. Bu ZIP'i boş bir proje dizinine çıkarın.
2. `Kayip_Ufuk_GDD_v2_0/` klasörü, `CLAUDE.md`, `.claude/skills/` ve `PROMPT_TEK_MESAJ.txt` aynı proje kökünde kalmalı.
3. Proje klasöründe Claude Code ile **Opus** modelini açın; `PROMPT_TEK_MESAJ.txt` içeriğini ilk mesaj olarak yapıştırın veya bu dosyayı okunmasını isteyin.
4. Ortam Python içeriyorsa `python tools/preflight.py` ile GDD 79/79 statik kontrolünü yeniden çalıştırın.
5. Uygulama oluşturulduktan sonra `python tools/validate_delivery.py` ile PNG/HTML/test ön kontrolünü yürütün. Kaynakların 79/79 geçmesi oyun kabulü anlamına gelmez.

Ayrıntılı açıklama: `KURULUM_VE_EKLEME_REHBERI.md`.

## Gerçek skill komutları

- `/kayip-ufuk-build`
- `/kayip-ufuk-assets`
- `/kayip-ufuk-qa`

## Kesin içerik

`Kayip_Ufuk_GDD_v2_0/`: 179 item, 183 tarif, 58 yapı, 38 POI, 12 bulmaca, 15 günlük, 20 plan, 25 canlı (10 balık), 12 mahsul, 8 ustalık, 2 final; 31 DB; 7 RLE harita; 24 atlas sayfasının koordinat **planı**. GERÇEK PNG atlasları henüz yok.

## Diğer eski ZIP'ler

v0.9-v1.9 ayrı paketleri eklemeyin; v2.0 tüm geçmiş düzeltmeleri içerir. Ayrı beceri ZIP'i bu birleşik paketle birlikte tekrar eklemeye gerek yoktur.
