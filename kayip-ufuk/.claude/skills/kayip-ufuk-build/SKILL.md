---
name: kayip-ufuk-build
description: Kayıp Ufuk tam sürüm HTML5/Canvas2D oyununu v2.0 GDD ve 31 JSON veritabanına birebir bağlı kalarak geliştirir; crafting, dünya, mağara, balıkçılık, tarım, kayıt ve iki final özellikleri üzerinde çalışırken kullanılır.
---

# Kayıp Ufuk — oyun sistemi kurma becerisi

Kaynak: `Kayip_Ufuk_GDD_v2_0/`. Gerçek uygulamayı `src/` ve `dist/` içinde üret. `ProductionTruth_v2.0.json` ve `ContentIndex_v2.0.json` öncelikli; kaynak DB kimliklerini koru.

## Başlarken
1. `pwd`, `ls`, sonra `README_BASLANGIC.md`, `ProductionTruth_v2.0.json`, güncel `Docs/` ve ilgili `DB/` dosyalarını **fiilen oku**. Eski sürüm yamalarını tekrar uygulama.
2. `python tools/preflight.py` çalıştır. Başarısızsa ID/kaynak hatalarını çözmeden üretime devam etme.
3. İlgili sistem için `Contracts/ImplementationContract.json` (özellikle `modules`, `publicContracts`, `mainGameLoopOrder`) ve `IntegrationMilestones.json` dosyalarını incele. `.claude/skills/kayip-ufuk-build/references/milestone-gates.md` dosyasını kullan.
4. Testi oluştur; gerçek davranışı kodla; otomatik testi çalıştır; `reports/STATUS.md` güncelle.

## Kesin tasarım
- 179 item, 183 tarif (114 item/60 build/9 upgrade), 58 yapı, 38 POI, 12 puzzle, 15 günlük, 20 garantili plan, 25 canlı, 12 ürün, 8 ustalık, 2 bağımsız final.
- Yalnız adada yaşama, insan NPC yok, canlı telsiz konuşması yok. Dört hazır ev modeli; modüler duvar/çatı/zemin inşası yok.
- Fiziksel kara ve mağara geometrisi `Maps/*.json` RLE’den okunur. Seed, yalnızca değişken yan loot ve dolgu kaynakları etkiler.
- `StateStore` atomik işlemleri sürdürür: loot, üretim girdisi, depoya aktarma, upgrade, crop, XP, POI ödülü idempotent.
- Tek 18-dakika oyun saati, pause ve offline yok. Daily ticks bir kere işlenir; uyku ve yükleme tekrar ödül vermemeli.
- GDD v1.5 63 başlangıç lif garantisi ve dört sabit başlangıç tohumu korunur; bunları JSON'dan oku, yeniden hardcode etme.
- Radyo anteni ve güneş/jeneratör alternatifleri bağımsız. Sal ile fener adacığına geçilebilir; büyük tekne radyo için ön koşul olamaz.

## Gereken çalışma kanıtı
Gerçek çalışan modül/test kodu, gerekirse sahne ekran görüntüsü, `reports/STATUS.md`. İçerik kapsamını azaltarak 'tamamlandı' deme; çalıştırılamayan QA'yı NOT_RUN tut.

## Destekleyici kaynak
[Milestone kalite kapıları](references/milestone-gates.md)
