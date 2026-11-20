import sys
src = open(sys.argv[1], encoding='utf8').read()
P = [
 ("COZY FISHING — Tam Sürüm", "COZFIS — Tam Sürüm", 1),
 ("Cozy Fishing v", "CozFis v", 3),
 ("'Bu bir Cozy Fishing kaydı değil.'", "'Bu bir CozFis kaydı değil.'", 1),
 ("const title = 'COZY FISHING';", "const title = 'COZFIS';", 1),
 ("r.html.replace('<h4>Ekran</h4>', `${tg('vibrate', 'Titreşim', 'Vuruş ve özel hamle uyarılarında (destekleyen cihazlarda)')}<h4>Ekran</h4>`)", "r.html.replace('<h4 data-sec=\"screen\">', `${tg('vibrate', 'Titreşim', 'Vuruş ve özel hamle uyarılarında (destekleyen cihazlarda)')}<h4 data-sec=\"screen\">`)", 1),
 ("<h4>Ekran</h4>", '<h4 data-sec="screen">Ekran</h4>', 1),
 ("{ const a = ACHS.find(x => x.id === 'species42'); if (a) a.condition_tr = 'Tüm ' + DB.fish.length + ' türü keşfet'; }", "/* species42 koşul metni I18N.bindData içinde dile göre üretilir */", 1),
 ("const upTR = s => String(s).toLocaleUpperCase('tr-TR');", "const upTR = s => I18N.upper(s);", 1),
 ("WEATHER_TR[wx].toLocaleLowerCase('tr-TR')", "I18N.lower(WEATHER_TR[wx])", 1),
 ("const fmt = n => { const s = String(Math.abs(Math.round(n))).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.'); return n < 0 ? '-' + s : s; };",
  "const fmt = n => { const s = String(Math.abs(Math.round(n))).replace(/\\B(?=(\\d{3})+(?!\\d))/g, I18N.num.group); return n < 0 ? '-' + s : s; };", 1),
 ("const fmtKg = n => (n < 10 ? n.toFixed(2) : n.toFixed(1)).replace('.', ',');", "const fmtKg = n => (n < 10 ? n.toFixed(2) : n.toFixed(1)).replace('.', I18N.num.dec);", 1),
 ("const pct = x => '%' + Math.round(x * 100);", "const pct = x => I18N.pct(Math.round(x * 100));", 1),
]
for old, new, n in P:
    c = src.count(old)
    if c != n:
        sys.exit(f'prepatch count mismatch {c}!={n}: {old[:80]}')
    src = src.replace(old, new)
open(sys.argv[2], 'w', encoding='utf8').write(src)
print('prepatch ok')
