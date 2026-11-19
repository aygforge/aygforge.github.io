# VARNETH — Oyun Tasarımı (Alpha 0.1 uygulaması)

Bu belge, spesifikasyonun koda nasıl yansıdığını ve sayısal başlangıç değerlerini özetler. Tüm sayılar
`shared/data/*` ve `shared/formulas.js` içinde merkezîdir.

## Dünya
* 10 bölge veri olarak tanımlı (`shared/data/regions.js`); Alpha'da 3'ü oynanabilir (Kırık Çayırlar 1–10,
  Yeşilgölge Korusu 11–20, Paslı Ocaklar 21–30), diğer 7'si haritada "keşfedilmedi" olarak görünür.
* 6 farm noktası, bölge bossu, elit + nadir şampiyon havuzları, bölgesel malzemeler, ana görev zinciri ve
  Mühür Parçası (hikâye kaydı) her bölgenin verisinde. Yeni bölge = yeni veri girdisi + arka plan; savaş motoru değişmez.
* Düşman seviyesi bölge bandının dışına çıkmaz; düşük seviyeli avcı bandın alt ucuyla karşılaşır, güçlenen
  avcı eski bölgeleri çok hızlı temizler (XP düşüşü: 5+ seviye fark sonrası kademeli).

## Savaş motoru (`shared/combat/sim.js`)
* Gerçek zamanlı yan görünüm, 640 birimlik saha, 50 ms sabit adım, iki ayrı seed'li RNG akışı (savaş + ganimet).
* Oyuncu durum makinesi: IDLE, ACQUIRE_TARGET, APPROACH, REPOSITION, BASIC_ATTACK, CAST_SKILL, EVADE_TELEGRAPH,
  HIT_REACTION, DYING, RESPAWN (+ TRAVEL: paketler arası koşu / parallax kaydırma).
* Savaşçı yakına girer; Avcı/Büyücü menzil korur ve yaklaşana karşı kısa geri çekilmeler yapar (kite bütçesi).
* Telegraf edilen saldırılar (daire/çizgi/koni → zemin aralığı): AI kaçış süresi yetiyorsa çıkar, yetmiyorsa
  "telegraph" kurallı savunma yeteneğini (Demir İrade / Geri Sıçrama / Büyü Kalkanı) kullanır.
* Bosslar: HP eşiklerinde faz, yardımcı çağırma, öfkelenme, "yardımcılar ölene kadar kalkan" ve kısa savunma +
  ardından büyük alan patlaması; 150 sn sonra sert öfke (sırf dayanıklılıkla uzatılamaz).
* Ölüm: ekipman kaybı yok, 4 sn yeniden doğma. Farm'da 5 dk içinde 3 ölüm → oyuncu kuralı: güvenli bölgeye çekil /
  durdur / devam. Boss'ta ölüm = başarısız; zindanda 3 ölüm = başarısız.

## Sınıflar
6 aktif + 3 pasif beceri, 3 uzmanlık ağacı × 8 düğüm (ilk 5 satır Alpha'da açık, 3 satır Sv 32/45/60 gelecek içerik).
4 aktif + 2 pasif yuva, 3 kayıtlı build, her 2 seviyede 1 puan (Sv 30: 15), altınla sıfırlama.
Otomasyon: her aktif becerinin koşul listesi (VEYA) — "2+ düşman", "can < %50", "hedef boss/elit", "tehlikeli
saldırı geliyor" vb.; öncelik = yuva sırası. Seviye atlayınca yeni beceriler boş yuvalara otomatik yerleşir.

| | Kaynak | Rol |
|---|---|---|
| Savaşçı | Öfke (vuruşla dolar) | Dayanıklı yakın dövüş, en yüksek can/zırh |
| Avcı | Odak | Uzak menzil, kritik, zehir, mesafe kontrolü |
| Büyücü | Mana | Alan/element hasarı, en hızlı farm, en kırılgan |

## Formüller (özet)
* Seviye ölçeği `scale(L) = (1+0.15(L−1))·1.035^(L−1)` (tekrarlı çarpımla hesaplanır; motorlar arası deterministik).
* XP: öldürme `6 + 4·L^1.2`; sonraki seviye `14·L^1.45 · öldürmeXP(L)`. Sv 30'da ilerleme durur, XP biriktirilmez.
* Zırh azaltma `A/(A + 60·scale(saldıranSv))` ≤ %75. Üst sınırlar: kritik %60, kritik hasar ×3.5, saldırı hızı +%100,
  can çalma %8, kaçınma %40, direnç %75, bekleme azaltma %30.
* Ganimet: normal düşman %4 ekipman; nadirlik ağırlıkları 60/28/9/2.5/0.45/0.045/0.005; seviyeye göre üst sınır
  (Sv<4: Nadir, Sv<8: Epik, Sv≥8 veya boss: Efsanevi; Mitik Sv40+, Kadim Sv60+ boss — Alpha'da düşmez).
* Upgrade +1..+10: altın `60·scale(iSv)·çarpan[u]·(1+0.15·nadirlik)` + kademeli malzeme; asla başarısız olmaz,
  temel değer +%8/seviye (yüzde affix'ler büyümez).
* Reforge/Polish maliyeti her denemede artar (+%25 / +%15 ve malzeme basamağı).
* Pazar: ilan ücreti %2 (iade yok), komisyon %5 (ekonomiden altın çıkar), 10 aktif ilan, 12/24/48 saat.

## Eşyalar
88 temel eşya (≥60 şartı): 29 silah/ikinci el, 30 sınıf zırhı, 9 kemer/takı, 12 set parçası (3 set × 4), 8 benzersiz.
17 affix; çelişen gruplar (fiziksel/büyü hasarı) ve sınıfa işe yaramayan affix'ler engellenir.
Benzersiz etkilerin hepsi savaş kodunda: Kızıl Cellat, Engerek'in Fısıltısı, Fırtına Asası, Köklerin Tacı,
Kor Kalbi, Kırık Mühür, Değirmen Taşı, Ocak Bekçisinin Eli. Set 4-parça bonusları da savaş kodunda.

## Ekonomi kuralları
* Normal kazanılan her eşya (kuşanılmış, +10, reforge/polish, üretilmiş, el değiştirmiş) serbestçe satılır;
  benzersiz kimlik ve tüm özellikler korunur. İstisna: başlangıç ekipmanı (sistem ödülü, karaktere bağlı).
* Offline: en fazla 8 saat, XP %40, yalnızca **karaktere bağlı** yardımcı malzeme %30; altın/ekipman yok.
  Bağlı malzemeler sadece simya iksirlerine girer; ticari ekipman üretimi/geliştirmesi hesap kasası ister.

## Görev & koleksiyon
Bölge başına 4 ana görev (12), 12 kontrat şablonu (3 aktif), haftalık 4 büyük av, birikimli günlük özel av (≤7,
şampiyon çağırır, seri yok), 24 başarım, canavar ansiklopedisi, benzersiz/set kataloğu + hedef listesi + kaynaklar,
boss sayacı, kişisel istatistikler, mühür parçaları.

## Denge durumu (bkz. BALANCE_REPORT.txt)
* Normal düşman ortalama öldürme süresi 2.5–7 sn (başlangıç hedefi 3–8 sn).
* Bosslar 45–105 sn; Nadir ekipmanla her sınıf her bossu ≥%90 kazanıyor. Gelişmiş ekipmanla Büyücü
  (Köklerin Efendisi %10) ve Savaşçı (Ocak Bekçisi %30) zorlanıyor — bilinçli "ekipmanını yükselt" eşiği,
  ancak izlenmeli.
* Zindan: tüm sınıflar Normal ve Kahraman'ı tamamlıyor (106–280 sn).
* Sv 1→30 tahmini aktif farm: Savaşçı ~23.5 sa, Avcı ~21.5 sa, Büyücü ~17.5 sa (görev XP'si hariç).
  Büyücü farm hızında ~%25–30 önde, boss dayanıklılığında geride; sonraki sürümde daraltılmalı.
