// Kaynak JSON'ları (birebir) file:// açılışında da çalışsın diye JS içine gömer.
// Kullanım: node tools/embed-sources.js  (dumen/ klasöründen)
// Çıktı: src/data/source/sources.js — içerik JSON dosyalarının metninin kendisidir.
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data', 'source');
const fish = fs.readFileSync(path.join(dir, 'Dumen_FishDB_2026-11-02.json'), 'utf8');
const item = fs.readFileSync(path.join(dir, 'Dumen_ItemDB_2026-11-02.json'), 'utf8');
JSON.parse(fish); JSON.parse(item);
const out = `// OTOMATİK ÜRETİLDİ — elle düzenleme. Kaynak: tools/embed-sources.js
// İçerik, aynı klasördeki iki JSON dosyasının birebir metnidir (testler eşitliği doğrular).
(function (D) {
  'use strict';
  D.SourceText = {
    FishDB: ${JSON.stringify(fish)},
    ItemDB: ${JSON.stringify(item)}
  };
  D.FishDBSource = D.deepFreeze(JSON.parse(D.SourceText.FishDB));
  D.ItemDBSource = D.deepFreeze(JSON.parse(D.SourceText.ItemDB));
})(globalThis.DUMEN);
`;
fs.writeFileSync(path.join(dir, 'sources.js'), out);
console.log('sources.js yazıldı', out.length, 'bayt');
