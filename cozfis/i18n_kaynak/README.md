# CozFis i18n kaynakları

Bu klasör, `CozFis_Multilanguage_v1.html` dosyasını üreten yerelleştirme hattının kaynaklarıdır. Oyunu oynamak için gerekmez; yeni metin eklerken veya çeviri düzeltirken kullanılır.

- `ceviriler/*.txt` — Çeviri kaynakları (`@anahtar` + `en/es/de/fr/pt` satırları). `⟦n⟧` HTML etiketi yer tutucusu, `⟦n|metin⟧` çevrilecek `title/placeholder` özniteliği, `{n}` parametre, `{n|tekil|çoğul}` çoğul seçimidir. `=` satırı “kaynakla aynı kalsın” demektir.
- `araclar/prepatch.py` — Kaynak koda uygulanan küçük ön yamalar (marka adı, `upTR`, sayı biçimi).
- `araclar/build.js` — acorn ile oyuncuya dönük dizgeleri bulur; `catalog.json` + `occs.json` üretir (anahtar = modül + metin özeti).
- `araclar/transform.js` — Dizgeleri `_t('anahtar', [parametreler])` çağrılarına çevirir; yükleme anında değerlendirilen tablolar için tembel getter / `_LA` üretir.
- `araclar/mkwork.py` — Çevirmen için iş dosyaları (`work/NN.txt`) + JSON veri alanlarının anahtarları (`d.fish.<id>.name` …).
- `araclar/assemble.py` — Çevirileri doğrular (etiket/parametre eşleşmesi), `LOCALE_DATA` sözlüğünü gömer, `postpatch.json` yamalarını uygular ve tek HTML'i yazar.
- `araclar/i18n_runtime.js` — Oyuna gömülen `I18N` çekirdeği.
- `araclar/*test*.js, snap.js, checkall.sh, fontcheck.js, overflow.js` — Playwright tabanlı QA betikleri.

Sıra: `prepatch.py → build.js → transform.js → mkwork.py → (çeviri) → assemble.py`.
