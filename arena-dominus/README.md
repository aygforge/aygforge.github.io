# Arena Dominus

Tek dosyalık (`index.html`) mobil öncelikli HTML5 gladyatör menajerlik oyunu. Türkçe ve İngilizce oynanabilir: dil, oyun açılışında seçilir ve Ayarlar'dan değiştirilebilir. İnternet bağlantısı veya harici dosya gerektirmez; itch.io'ya doğrudan `index.html` olarak yüklenebilir.

## Geliştirme

Kaynak kod `src/` altındaki modüllerdedir; `index.html` bunlardan üretilir:

```
node tools/build.js          # src/ -> index.html
node tools/combat-test.js    # savaş dengesi ölçümü
node tools/season-sim.js 4   # 4 sezonluk başsız dünya simülasyonu + değişmez kontrolleri
node tools/player-sim.js active 3
node tools/transfer-test.js
node tools/i18n-test.js     # kayıtlı metinlerin İngilizce karşılıkları
GLANG=en node tools/browser-test.js   # Playwright ile uçtan uca test (Chromium), GLANG=tr|en
```
