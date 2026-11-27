# KEPÇE USTASI — V1.0 COMPLETE PLAYABLE GAME
## CLAUDE OPUS | MASTER ONE-SHOT DEVELOPMENT PROMPT

**Dil:** Türkçe. **Stüdyo:** Ayg Forge. **Görev:** ÇALIŞAN Alpha 0.5A.1 kaynağını, mevcut çalışır sistemleri bozmadan, 120 levellik, 12 chapter'lı, dört dungeon modlu, kalıcı ilerlemeli, monetizasyona/Android'e hazırlanmış **gerçek oynanabilir V1.0** sürümüne genişlet. Bu bir konsept raporu değildir. **Sıfırdan oyun yazma.** Önce eklenmiş kaynak projeyi aç; mevcut oyun mimarisi otoritedir.

## 0. GİRDİ / ÇIKIŞ / KULLANIM LİMİTİ — ZORUNLU

**Girdi A:** Kullanıcının vereceği GÜNCEL **Alpha 0.5A.1 kaynak ZIP'i** veya bu sürümü içeren repo/branch (önceki geliştirmeler `ccr-7f1e58ef-ivufd8` branch'ine gönderildi; en son commit'i doğrula). **Alpha 0.1, 0.3, 0.4B veya 0.5A kodunu yanlışlıkla temel alma.** Claude Artifact URL'si kaynak ağacının yerine geçmez.

**Girdi B:** Bu promptla birlikte verilen `Kepce_Ustasi_V1_Compact_Content.json`. Bu dosya 31–120 arasındaki **90 yeni stage**, dokuz chapter, düşman/boss tanımları ve **405 normal dalganın** önceden hazırlanmış *tasarım verisidir*. **Senden kapsamlı level tasarımı analizi yapmanı değil, bu veriyi mevcut oyuna entegre etmeni istiyorum.** Veri dosyasındaki isim, sayılar ve dalgalar başlangıç hedefidir; mevcut çalışma kodunun şemasına güvenli adaptör yaz. `st` veri listesi L31–L120 aralığı içindir; L1–L30'u SAKIN yeniden üretme veya değiştirme.

**Limit ekonomisi:** Uzun ön analiz, rakip oyun araştırması, binlerce seed simülasyonu, 100 sayfalık rapor, sürekli bağımsız denge araştırması, her sistem için yeni mimari yazımı veya yüzlerce ekran görüntüsü **YASAK**. Kodu mümkün olan en kısa yoldan geliştir. İşini kendi içinde sırayla tamamla; ayrı kullanıcı promptları isteme. `npm test`, `npm run build`, yeni işlevleri kapsayan hedefli testler ve az sayıda smoke koşusu yeterlidir. Teknik zorunluluk dışında tekrar tekrar büyük benchmark çalıştırma. Kodun tamamını sohbet mesajına dökme.

**Teslim sözleşmesi:** (1) eksiksiz kaynak ZIP, (2) çalışır `dist/` web/itch.io ZIP, (3) varsa derlenebilir Capacitor Android projesi + doğrulanmış AAB/debug APK veya imza/SDK yoksa dürüst durum notu, (4) `README_RELEASE.md`, (5) `CHANGELOG_V1.md`, (6) kısa test sonucu, (7) eksik kalan noktalar açıkça. Projenin hangi kısmının gerçekten uygulandığını iddia etmeden önce kontrol et. Bu, tam V1.0 geliştirme hedefidir; önemli sistemleri maket, dev-only buton veya yalnızca JSON ile geçiştirme.

## 1. KESİNLİKLE BOZULMAYACAK MEVCUT OYUN

- **Tek isimsiz Şef.** Karakter seçimi, yeni şefler veya pasif karakter sınıfları ekleme.
- **Portrait 9:16 / 19.5:9 / 20:9.** ÜST savaş: Şef solda, sebze düşmanlar sağdan sola; ALT: Matter.js ile fiziksel yağ topçukları ve salınımlı kepçe. Tek dokunuşla gerçek yakalama, rastgele/sahte yakalama yok.
- Mevcut hibrit tencere, Alpha 0.3 yakalama fiziği, salınım, 24 **çalışan** geçici run yeteneği, 3 yağ türü (normal, büyük, soğuk), saldırı/bonus mermi zincir sınırları ve 24 yeteneğin gerçek etkileri bozulmaz. İhtiyaç yoksa yeni yetenek/yağ türü yazma.
- Tur sırası: kepçe/yakalanan ammo → Şef'in otomatik saldırısı → hedef/ölüm/tava/chain → düşman eylemi → yeni wave; canlı düşmanlar **yalnız düşman fazında** hareket eder. Şeritli savaş yaratma.
- **Alpha 0.5A.1 düşman teması:** Boss olmayan normal/elit/çağrılmış düşman vurunca SİLİNMEZ; HP/kalkan/kabuk korunur; bir adım geri çekilir, SONRAKİ düşman eyleminde bir adım yaklaşır (o anda VURMAZ), BİR SONRAKİ eylemde hâlâ hayattaysa tekrar vurur ve geri çekilir. Donma o eylemi erteler, tek fazda çift vuruş olmaz. Mini/chapter boss'ların kendi temas ve hareket mantığı korunur.
- **Alpha 0.5A.1 mühimmat:** Yakalanan yağlar `pendingAmmo` kuyruğunda doğru tür ve sırayla saklanır, Şef'in hemen altında simgeleri (6'dan fazlası `+N`) görünür; hedef yoksa ammo azalmaz; yeni dalgada varsa yetenek seçimi SONRASI, yeni kepçe açılmadan kalan ammo otomatik ateşlenir. Final zaferinde kalan ammo temizlenir. BONUS mermi fiziksel ammo sayılmaz.
- **Enerji:** HER campaign ve dungeon run girişinde **5** (ASLA 10'a dönme), maksimum 30, her 12 dakikada +1, gün başına 2 adet oyuncu talebiyle reklamlı 30'a tamamlama, L1–L3 ilk zafer için mevcut +5 iade. Run restore/yeniden açılışta çift kesinti yok.
- L1–L20 Alpha 0.4C; L21–L30 Alpha 0.5A'nın mevcut **30 stage ID'si, adı, düşman davranışları, tarif, dalga, final, yıldız, ödül ve açılımları** aynen korunur. L30 Koca Mantar (72 HP+4 kalkan; iki faz, max 2 summon) değişmez.
- Mevcut dört ekipman yuvası (Yağ Silahı, Kepçe, Önlük, Tava), Common/Uncommon/Rare ve craft maliyetleri (40 parça+120 bahşiş; ardından 60+260), SG hesaplama, iki dungeon, 6 kalıcı upgrade hattı, kayıt ve geri uyumluluk korunur.
- Menü minimalist restoran atmosferi: OYNA en görünür düğme. Otomatik savaş ekranı, tek şef, üst/alt yerleşim, 360×640 sınırı, ses/kayıt/çevrimdışı çalışma bozulmaz. Yabancı oyunların telifli varlıklarını kopyalama.

## 2. BİRİNCİL OYUN: 120 GERÇEK LEVEL / 12 YEMEK CHAPTER'I

| Chapter | Oynanabilir level | Yemek | Ana final |
|---|---|---|---|
| 1 | 1–10 | Menemen | Dev Domates (MEVCUT) |
| 2 | 11–20 | Patates Kızartması | Patates Kral (MEVCUT) |
| 3 | 21–30 | Mantarlı Omlet | Koca Mantar (MEVCUT) |
| 4 | 31–40 | Sebzeli Makarna | Spagetti Kralı |
| 5 | 41–50 | Tava Pizzası | Hamur Devi |
| 6 | 51–60 | Acılı Noodle | Acı Noodle Ejderi |
| 7 | 61–70 | Sebze Güveci | Güveç Golemi |
| 8 | 71–80 | Şefin Özel Tavası | Tava Muhafızı |
| 9 | 81–90 | Çıtır Börek | Kat Kat Börek |
| 10 | 91–100 | Sokak Dürümü | Dev Dürüm |
| 11 | 101–110 | Baharatlı Köri | Köri Sultanı |
| 12 | 111–120 | Büyük Şef Ziyafeti | Ziyafet Efendisi |

Her level **ayrı bir run** ve yalnızca o level'ın kendine özgü 3–6 normal dalgası + finali var. Her normal dalgadan sonra mevcut 3 kartlı seçim, finalden sonra kart yok. L35/45/55/65/75/85/95/105/115 mini boss; her chapter'ın 4./9. stage'lerinde çift final; bazı 6. stage'lerde üç elit final ve kısa kalabalık koşu. **Çift/üçlü finalde hepsi ölmeden zafer yok; chapter boss ölünce bekleyen summon'lar yok sayılarak tek zafer olayı.** Korunan `pendingAmmo` bütün normal dalgalardan devam eder. Öldürülen düşman tarif sayacına bir kez gider; boss yenilince tarif eksik olsa bile servis vardır; tam tarif ve can kaybı yıldız derecesini belirler.

### 2.1 Hazır JSON'u entegre et — gereksiz tasarım çalışması yapma

`Kepce_Ustasi_V1_Compact_Content.json` alan sözleşmesi:
- `ch[]`: 4–12 chapter tanımları. `i` chapter sıra numarası, `id` kararlı chapter kimliği, `n` Türkçe başlık, `ingredients[]` tarif anahtarları; `e[]` düşman ID/özellikleri (`trait`, `move`, `hp`, `shield`, `shell`, `contact`); `b` chapter boss, `m` mini boss.
- `st[]`: 90 stage. `l` 31–120 level ID, `c` chapter numarası, `n` stage adı, `i` karşılaşma kimliği, `w` normal dalga dizisi, `f` final, `r` tarif, `p` önerilen Şef Gücü, `g` temel bahşiş, `h` normal düşman HP ölçeği, `s` spawn profili, `o` büyük yağ olasılığı çarpanı.
- `w`: Her iç dizi tam **üç tam sayı**; aynı chapter'daki `ch[].e[]` düşman sırasına karşılık gelen sayılardır. Örneğin `[2,1,0]` birinci düşmandan iki, ikinci düşmandan bir tane demektir. **Bu sayılar lane/şerit DEĞİLDİR.** Düşmanlar yine aynı serbest yatay alanda hareket edecek.
- `f`: `[tip, [[enemyIndex, hp, shield], ...]]`; `tip`: `B` ana boss, `M` mini boss, `D` çift elit, `T` üçlü elit, `E` tek elit. `enemyIndex=-1` ilgili chapter boss'u (`ch[].b`), `enemyIndex=-2` ilgili chapter mini boss'u (`ch[].m`) kullanır. Diğer indexler ilgili `ch[].e[]` düşmanına bakar. `B/M` için `hp` ve `shield` verilmişse aynen kullan. Final düşmanını ayrıca normal HP çarpanına SOKMA.
- `r`: `[malzeme1, malzeme2, malzeme3]` tarif hedefleri, `ch[].ingredients[]` sırasına göre. `0` istenmeyen malzeme demektir. Tarif hedefi wave içindeki mevcut malzeme sayısını aşmaz. `g`: baz bahşiş, ilk temizleme bonusu `round(g*0.5)`, yıldız çarpanı mevcut 1 / 1.15 / 1.30. `o`: yalnız `1.2` ise büyük yağın olasılığına çarpan; tahsis her zaman gerçek toplara ve kapasiteye yansır.
- `h` yalnız normal düşman **temel HP'sine bir kez** uygulanır. Kabuk, harici kalkan, final `hp`, boss özel HP'si ve mevcut global chapter katsayıları ikinci kez uygulanmaz. Çifte HP ölçeği veya erken stage'lerde savunulamaz HP yığını üretme.
- `s`: `standard` = ilgili chapter normal spawn profili, `near` = daha yakın baskı, `varied` = üç yatay derinlikte (ama lane yok) farklı doğumlar.
- `b.phases[]` ve `e[].trait`: Aşağıdaki gerçek mekanik sözlüğüne uyarlanacak. Bunları oyuncuya görünür etkisi bulunmayan yazı etiketlerine dönüştürme.

### 2.2 Yeni düşman davranış sözleşmesi (veri odaklı, tek EnemyDirector)

Yeni mekanikler mevcut düşman eylem ve CombatResolver otoritesini kullanmalı. **Yeni bir savaş motoru yazma.** Bütün etkiler deterministik, sınırlı ve snapshot'a dahil. Davranış etiketleri şu gerçek etkileri taşır:

- `split_once_on_death`: Ölen spiral düşman yalnız bir kez en fazla iki küçük 2 HP'li spiral çağırır; bu küçükler tekrar bölünmez, aynı düşman toplamı için tarif çifte sayılmaz (küçük minyonun tarif katkısı 0).
- `buff_ally_step_every3_max2`, `ally_speed_buff_every3_max2`, `ally_forward_plus1_once`: En yakın uygun müttefik için belirtilen eylemde **gelecek düşman fazına uygulanacak** en fazla +1 hareket; düşman başına toplam iki pulse veya bir kere. Aynı fazda iki kez temas tetiklemez.
- `guard`, `ally_shield_every3_max2`, `shield_refresh_once`: En yakın uygun müttefike +2 kalkan (hedef üst sınırı 3), pulse en fazla iki; `shield_refresh_once` yalnız kendi kalkanını bir kez +2 yeniler. Eski Koruyucu Mantar kuralını değiştirme.
- `sprinter`, `wave_runner`, `swarm`: Düşman `move[]` sırası ile tur sonunda ilerler; `[1,2]` dönüşümlü, `[1,1,2]` üçlü döngüdür. Tur dışı sürekli hareket yok.
- `shell_slow`, `layered_shell_three_hits`, `heavy_armor`: Ayrı `shellHP` veya `shield`, var olan **harici kalkan → kabuk → HP** sırasıyla hasar alır; kırılma tek sefer ve görünür; birden fazla kabuk fazı gerekiyorsa en fazla 3 katman, sonsuz yenileme yok.
- `spicy_contact`: Temas hasarı 2; mevcut boss olmayan düşmanın **vur → geri çekil → yaklaş → vur** döngüsünü aynen uygula.
- `ally_heal_1_every3_max2`: En fazla iki kez yaşayan uygun müttefike +1 HP, başlangıç maksimumunu aşmaz.
- `first_hit_guard_once`: İlk gerçek doğrudan isabetin 1 hasarını önler (uygun `guardUsed` bayrağıyla). Bonus tetikleme sayılmaz; sonraki isabetler normaldir.
- `target_priority_taunt`: Şef'in mevcut tehlike/mesafe hedeflemesini tamamen bozmaz; hedefler aynı tehlikedeyse önce bu düşmanı seçer. Başka düşmanı hedef alamama gibi hard-lock yok.
- `every3rd_hit_reduced_by1_min0`: Her üçüncü gerçek isabette gelen hasarı 1 azaltır, minimum 0; boss bağışıklığı uydurma.
- `existing_guard`, `existing_armor`: MEVCUT mantar koruyucu/zırhlı patates davranışını tekrar kullan; eski düşmanların global istatistiklerini değiştirme.

**Boss fazları:** Her boss'un `b.phases[]` özelliğini bağla: belirli HP eşiğinde bir kere 2 minyon çağırma, bir kere kalkan yenileme, `[1]→[1,2]` hızlanma, telegraph sonrası hızlı adım gibi. Hepsi maksimum iki summon/eşik olayı, en fazla iki kalkan pulse ile sınırlandırılır. Boss'un çağırması veya arka plan eylemi zaferden sonra gerçekleşmez. Bir boss mekanik etiketi güvenli uyarlanamıyorsa onu görmezden gelmek yerine basit fakat görünür, testli, tek seferlik aynı niyette alternatif uygula ve kısa changelog'a yaz.

**Düşman canı için korunacak ölçek:** Kompakt JSON `h` katsayısı L31=~1,013 ve L120=~3,20 aralığındadır. Bu **kasıtlıdır**: geç oyunda 9 kat normal HP artışı yerine ekipman/silah seviyeleriyle makul süreli normal dalgalar oluşturur. Chapter `e[].hp` üstüne yalnızca bir kez uygula; mevcut `EnemyDirector` içindeki başka global HP ölçeğini ikinci kez uygulama. Kalkan/kabuk değerlerini `h` ile çarpma.

**Boss fazları için kesin eşleme:** Spagetti Kralı %60'ta iki spiral çağırır, %30'da bir kez +3 kalkan alır. Hamur Devi %50'de bir kez +4 kabuk, %25'te `[1,2]` yürüyüşe geçer. Acı Noodle Ejderi her üçüncü hareket öncesi 2-adımlık atağını küçük ikonla haber verir, %50'de iki noodle çağırır. Güveç Golemi %65'te mevcut kalkanını kırıp `[1,2]` hareketine geçer, %35'te bir havuç çağırır. Tava Muhafızı %66'da bir kez +3 kalkan, %33'te iki soslu domates çağırır. Kat Kat Börek başlangıç kabuğu bitince `[1,2]` hızlanır, %35'te iki susam çağırır. Dev Dürüm %50'de iki turşu çağırır, %25'te `[1,2]` hızlanır. Köri Sultanı %60'ta varsa iki canlı müttefiğe +2 kalkan, yoksa kendine +2 kalkan (bir kez); %30 sonrası dondurma en fazla her üç boss eyleminde bir hareket atlattırabilir. Ziyafet Efendisi %66'da iki kraliyet noodle çağırır; %33'te bir kez +4 kalkan alıp `[1,2]` yürüyüşe geçer. **Her eşik bir kez tetiklenir; boss öldüyse bekleyen faz olayı çalışmaz.**

**Önemli zorluk ilkesi:** Geç oyun boss HP'leri `106 → ... → 897` ve referans Şef Gücü `288 (L40) → 1777 (L120)` birer PLANLAMA HEDEFİDİR. Oyuncunun ekipmanı gelişirken gerçek atış hasarı da artmalı. L120 boss'unda sadece HP yükselterek 30–40 turluk savaş üretme. Uygun kalıcı silah ilerlemesiyle boss savaşını yaklaşık **6–12 etkili kepçe turunda** mümkün kıl; otomatik oyuncu botu sonuçları yerine gerçek hasar profilini temel alan küçük hedefli hesaplama yeterli.

## 3. KALICI PROGRESSION / ŞEF GÜCÜ / SOFTWALL–HARDWALL

**Şef Gücü**, mevcut sistem gibi yalnızca gerçek kalıcı HP, silah, kepçe, tava, ekipman ve upgrade değerlerinden hesaplanır; savaş sırasında gizli güç çarpanı, parayla geçilen kapı, SG düşük diye level kilidi oluşturma. Mevcut SG ağırlıklarıyla uyumlu biçimde genişlet. 120 level'daki referans eşikleri: L10=138, L20=183, L30=216, L40=288, L50=342, L60=455, L70=538, L80=716, L90=848, L100=1128, L110=1335, L120=1777. Diğer ara seviyeler JSON `p` alanından gelir.

- Chapter sonları softwall; L20/40/60/80/100/120 ek güç baskılı **hardwall**. Bunlar SG tabanlı otomatik giriş engeli değildir. Oyuncu iyi kepçeyle ve doğru kart kombinasyonuyla eksik güçte de kazanabilir.
- Kaynak dungeon'ları ihtiyaç öncesi açılır: Altın Mutfak L7, Malzeme Deposu L15, Boss Mutfağı L25, Kazan Kulesi L35. Eşya için gerekli kaynak, o eşyanın aşacağı engelden SONRA açılmaz.
- **Hedef hazırlık:** softwall ~2–4 hazırlık koşusu, hardwall ~4–8 kaynak koşusu (mevcut ekipman ve oyuncu becerisine göre değişir). Sonsuz grind/ödül tavanı yaratma; garantili malzeme biriktirme yolu sun. Mevcut oyuncunun eski craft ve bahşiş miktarını yeniden değerleme/silme.
- Mevcut altı kalıcı geliştirme hattının Lv1–6 etkileri ve eski satın alımları korunur. İstersen veri tablosuyla L30 sonrası Lv7–12, L60 sonrası Lv13–20 genişlet; ancak kepçe geometrisi ve maksimum HP aşırı büyüyüp fizik/savaş hissini bozmasın. Ek yükseltme bütçesi esas olarak ekipman geliştirme sisteminden karşılanmalı.

### 3.1 Ekipman — dört slotu KORU, iki yeni nadirlik ekle

**Mevcut:** Common / Uncommon / Rare ve mevcut tüm pasifler/maliyetler aynen kalır. Ekipmanlar envanterde düzensiz yüzlerce kopya olarak biriktirilmez; **her slotta tek geliştirilen eşya + seviyeler** vardır. Rastgele loot box ve zorunlu gacha yok.

**Yeni:** Epic ve Legendary, eşyaların her biri için **görünür, gerçek** etki ve `enhanceLevel` 0–30. Oyuncunun mevcut Rare ekipmanı Epic'e yükseltilebilir; Common'dan başlamak zorunda değildir. Geçişlerin atomik yapısı, yeterli kaynak kontrolü, `runId` tek ödül kuralı korunur.

| Nadirlik | Açılım | İlgili slot için prensip | Garanti maliyet |
|---|---|---|---|
| Epic | L35 temizlenince | Silah gerçek normal yağ **taban hasarı +1**; Kepçe mevcut fiziksel genişliğine ek **+%3** (toplam Rare'e göre); Önlük Rare'e ek **+1 maks HP**; Tava mevcut 5 öldürme bonusuna ek **her 4. öldürmede** 1 non-proc bonus | Rare→Epic: **140 parça +2 boss mührü +900 bahşiş** |
| Legendary | L70 temizlenince | Silah Epic'e ek **+1 taban hasarı**; Kepçe Epic'e ek **+%3**; Önlük Epic'e ek **+1 HP**; Tava Epic'e göre **her 3. öldürmede** 1 non-proc bonus | Epic→Legendary: **280 parça +6 boss mührü +4.000 bahşiş** |

Bu efektler mevcut Uncommon/Rare etkilerinin üstüne net şekilde **eklenir**, yanlışlıkla iki ayrı bonus mermi kaynağı bir mermiyi döngüye sokmaz. Kepçe tüm kaynaklardan genişlediğinde gerçek Matter çarpışmasına uygulanır, ama etkili ağız için toplam çarpan güvenli üst sınır (örn. +%35) korunur.

**Forging/enhancement:** 4 slotta 0–30 güçlendirme seviyesi; 5'er seviyede Silah için +1 normal gerçek atış hasarı, Önlük için kontrollü +1 HP, Kepçe için +1 kapasite /10 seviye (en fazla 15), Tava için sadece mevcut bonus sıklığını veya en fazla ek 1 yağ katkısını iyileştir. Her upgrade malzeme ve bahşiş tüketir; maliyet veri odaklı kademelenir (örnek temel: `round(45 * 1.16^oldLevel)` bahşiş + `ceil((oldLevel+1)/3)*5` parça); L30'a ulaşmak mümkün ama haftalar sürebilen bir hedef. Gelir ölçeğini ve L40/L80/L120 boss DPS'sini dengelemek için **öncelikle bu gerçek silah hasarı** kullan; SG puanını hasara çevirmek için gizli combat çarpanı ekleme. Yeni kademeleri aşırı maliyetli yapıp monetizasyon şartına bağlama. Sıfırdan dört Legendary zorunluluğu yok.

**Boss mührü:** Boss Mutfağı haftalık ilk 3 zafer için 2'şer mühür; Kazan Kulesi 15./30./... kat kilometre taşında ilk kez küçük ek mühür. Hiçbir geliştirme yalnızca rastgele düşen eşya gerektirmez. Yanlışlıkla iki kez craft veya çift mühür verilmez.

## 4. DUNGEON / GÜNLÜK VE HAFTALIK OYUN DÖNGÜSÜ

Dört mod **aynı** RunController, EnemyDirector, PotPhysics, CombatResolver, Abilities, SaveService ve üst-alt portrait sahnesini yeniden kullanır. Ayrı fizik/savaş motoru yaratma.

**A. Altın Mutfak (MEVCUT, L7):** 4 dalga + final; günde ilk 2 zaferde **240 bahşiş** temel; sonra 120. Geç chapter için bahşiş ödülünü açılan en yüksek level'a göre makul artan bir çarpanla kademelendir (L1–30 eskisi korunur). Başarısızlıkta günlük yüksek ödül hakkı eksilmez. Giriş 5 enerji.

**B. Malzeme Deposu (MEVCUT, L15):** 4 dalga + final; günde ilk 2 zaferde **18 parça** temel, sonra 8. İlk temizleme +10 parça bir kez. L15 birinci temizleme +18 hikâye hibesi saklıdır. L31 sonrası depo ödüllerini her on level'da +4 parça/ilk iki ödül olarak kademelendir, tekrar ödülünü bunun %40–50'sine çıkar. Giriş 5 enerji.

**C. Boss Mutfağı (YENİ, L25):** 3 bölüm boss'uyla art arda mücadele, aralarda yeni kart seçimi; her hafta **ilk 3 zafer** tam ödül (zafer başına 2 boss mührü + makul bahşiş), sonraki zaferler daha düşük, pozitif bahşiş ama 0 mühür. Haftalık sıfırlama Pazartesi 00:00 UTC. Boss havuzu erişilen chapter boss'larından ve mevcut mekaniklerden kurulur; L25'te henüz yenilmeyen chapter boss'una zorunlu giriş yok. 5 enerji; ödül yalnız zaferde. Son boss ölünce tek zafer; summon'lar temizlenmek zorunda değil.

**D. Sonsuz Kazan Kulesi (YENİ, L35):** İlerleme kaydedilen 100 katlık yükselen challenge, sonsuz devam için 100+ katlarda formülle artan karşılaşmalar. Her deneme **5 katlık bir blok** (5 enerji); son temizlenmiş 5'lik checkpoint korunur, her blok 1–4 normal/özel dalga + final gibi aynı combat loop ile gerçek anlamda oynanır. İlk temizlenen 5/10/15/… kilometre taşlarında bahşiş/parça; her 15. katta ilk kez 1 boss mührü. Tekrar temizlikte küçük bahşiş, aynı milestone ödülü yeniden verilmez. Haftalık basit kişisel ilerleme hedefi var, çevrimdışı sahte global leaderboard YOK. İleri kat sayısını UI kolayca sayfalayabilsin; sonsuz katları veri olarak diske yüz bin satır yazma.

**Günlük görevler:** 3 basit görev (örn. 3 normal run, 10 normal düşman pişir, 1 dungeon tamamla), UTC gün başında idempotent reset, ufak bahşiş/parça ödülü. **Haftalık görevler:** 3 görev (Boss Mutfağı, Kule ve toplam 10 run gibi); görevler görsel panelde küçük yer kaplar. Görev ödülü yalnızca bir kez; sahte bildirim, push/arka plan işi, sunucu veya sıralama gerekmiyor.

## 5. ENERJİ / ÖDÜL / KAYIT / REKLAM / IAP

- **5 enerji/run; maksimum 30; 12 dakikada +1.** Uygulama kapalıyken son güvenilir timestamp'e göre yenile, negatif süre, saat geri alma ve restore durumlarında negatif/sonsuz enerji üretme. Offline saat manipülasyonunun %100 önlenemeyeceğini kabul et. UTC gün sınırında 2 ayrı reklama bağlı enerji dolum hakkı: **mevcudu 30'a TAMAMLA**, üzerine +30 EKLEME. Başarısız/atlanmış reklamda hak tüketme. Devam edilen aynı run'dan tekrar enerji çekme. Günlük dungeon yüksek ödül hakkı ile iki enerji reklam hakkı farklı sayaçtır.
- Normal level girişleri, dungeon'lar, Kule blokları aynı 5 giriş bedelini kullanır. L1–L3 ilk zafer +5 iade (tek sefer). Kayıpta enerji iade edilmez; ağ/çökme veya snapshot dönüşü çift ceza yok. Enerji olmadığında donanımdaki etkin menüler, ekipman ve görevler erişilebilir.
- **Monetizasyon:** Yalnız sonuç ekranı/menü arası uygun geçişte interstitial (ilk 2 tamamlanan run'da yok, en fazla 2 tamamlanan run'da 1 ve en az 5 dk aralık); savaş/dalga/kart seçiminde asla reklam yok. İsteğe bağlı rewarded: günde 2 tam enerji, sonuç ekranında +%40 bahşiş, run başına 1 kez 2 HP'li devam, bir ekstra yetenek reroll. IAP: interstitial kaldırma (rewarded butonları isteğe bağlı kalır), başlangıç kaynak paketi, bahşiş paketi, kozmetik. Enerjiyi bitirdi diye zorla satın alma modalı, imkânsız ücretsiz duvar ve abartılı pop-up yok.
- Android gerçek reklam sağlayıcısı bağlanabiliyorsa **Google Mobile Ads/AdMob test reklam birimleri** ve onay akışı ile entegre et. Gerçek publisher ID verilmediyse kodda açık `needsConfiguration` tut; WEB sürümünde reklamı izlemiş gibi **sahte ödül verme**. Gerçek ödül yalnız `onUserEarnedReward`/doğrulanmış sağlayıcı callback'i sonrasında ve ödül event ID'siyle bir kez; üretim ortamında sunucu varsa SSV doğrulaması tercih edilir. AdMob Unit ID/AdMob App ID veya Play Console bilgilerini UYDURMA.
- IAP için Google Play Billing ile ürün ID'leri **konfigürasyon** üzerinden bağlansın; gerçek ürün/mağaza aktif değilse fiyat, satın alma başarısı ve kalıcı hak sahte gösterilmesin. Mükerrer satın alma, geri yükleme ve satın alma başarısızlığı senaryoları kontrol edilsin. Üretim güvenliğinde satın alma doğrulamasının sunucu gerektirebildiği raporda dürüstçe belirt.
- Android izinleri/veri güvenliği beyanına yardımcı `PRIVACY_NOTES.md` (hangi SDK hangi veri erişimi, kullanıcının dolduracağı Play Console alanları). Onay gerekli bölgelerde rıza/UMP akışını entegrasyon planına dahil et. Web'de ağ olmadan çekirdek oyun çalışır.

## 6. ANDROID / GÖRSELLER / DİL / SES / UX

- V1.0'ın tamamı **mobil portrait**; 360×640 ve uzun 20:9 cihazlarda HUD, şef altındaki yağ kuyruğu, yetenek kartları, boss canları, ekipman, enerji ve 120 level seçimi KIRPILMAMALI. 120 level seçiminde chapter bazlı 10'luk sayfalama; 120 tuşu tek panelde sıkıştırma.
- Her chapter mutfak arka planı mevcut restoran atmosferi üzerine hafif renk/tema farkı taşır; en az dokuz yeni ana boss için özgün sade 16-bit pixel sprite, her yeni düşman ailesi için okunabilir küçük sprite/siluet üret. Ağır sprite-sheet animasyon, 3D veya karakter sınıfı YOK. Recolored placeholder ile tamamen aynı düşman görünümü yaratma; önemli trait'lerde kalkan/kabuk/hız/şifa ikonları görünsün. İkonlar kısa hasar/ölüm feedback'iyle uyumlu, 60 FPS hedefli.
- Başlangıç/level seçimi, chapter ilerlemesi, sonuç/yıldız, dungeon seçimi, ekipman/craft, görevler, enerji, mağaza ve ayar menüleri gerçekten açılabilir ve dokunmatik kullanılabilir olsun. Basit, ayrık menüler; restoran yönetimi/yerleştirme/kasaba dekorasyonu YOK.
- Dil: Türkçe tüm V1.0 UI ve içerikte eksiksiz. İngilizce için ana UI/önemli savaş metinleri/chapter/level adları ve menülerin anahtar tabanlı çeviri katmanını ekle; çeviri eksikse TR fallback, ekranda ham key gösterme. Şişkin altı dilli sahte çeviri ekleme.
- Özgün basit savaş sesleri, farklı boss uyarı sesi ve kısa zafer kaydı; mevcut ses sistemi ve tercihleri korunur. Uzun otomatik reklam/müzik yüklemeleri yasak.
- Capacitor Android projesi oluştur/güncelle. **2026-11-24 itibarıyla Google Play yeni uygulamaları Android 16 / targetSdk API 36+ bekliyor**; hedef API 36 veya o tarihteki güncel zorunlu gereksinimi kullan. Native proje gradle, ikon, uygulama etiketi, splash, orientation, safe-area, Android geri tuşu, pause, WebView network/offline davranışı ile çalışsın. Paket ID'si kullanıcı tarafından onaylanmadıysa `com.aygforge.kepceustasi` geçici öneri olarak belgelensin, imza/kalıcı yayın ID'si kullanıcı kararı olmadan geri dönüşsüz sabitlenmesin.
- Web `npm run build` ile temiz `dist/`; Android SDK/keystore yoksa AAB oluşturduğunu **iddia etme**, bunun yerine açılabilir native proje + kesin build/keystore komutlarını ver. Release imzalı AAB/Play yayını, developer hesabı ve Play Console ayarları kullanıcı bağlantısı olmadan otomatik tamamlanamaz.

## 7. KAYIT GEÇİŞİ / GERİYE UYUMLULUK — KRİTİK

- Alpha 0.1 → 0.5A.1'e kadar elde edilmiş **bahşiş, tüm kalıcı upgrade, ekipman nadirliği, ekipman parçası, enerji/zaman damgası, satın alma hakları, yıldızlar, tamamlanan level'lar, açık dungeon ve run snapshot** korunur. V1.0 için yeni alanlar varsayılanlarla idempotent eklenir; ikinci migration'da çift kaynak/ekipman/ödül verilmez.
- L1–L30'ın orijinal `levelId`, chapter, level başarı ve ilk temizleme kayıtları değişmez. Eski yarım koşu yeni level şemasına dönüştürülemiyorsa oyuncuya güvenli çıkış + giriş enerjisi iadesi sun, fakat sessizce run silip enerji kaybettirme. Yeni snapshot'ta boss fazı, minyonlar, `pendingAmmo` sırayla, temas geri çekilme/sonraki eylem durumu, RNG, tüm ilerleme ve hak sayaçları korunur.
- Tek ödül otoritesi `runId` + idempotent ledger; craft idempotent/atomik; maksimum HP değişikliği anlık canı mantıklı sınırda tutar; geri ödeme sonrası negatif bahşiş/materyal oluşmaz. İlk cleared level, dungeon ve kule milestone ödüllerinin tek-seferlik kilidi ayrıdır.
- Snapshot geri yüklemede iki salınım, iki mermi kuyruğu, iki düşman hareketi, çift enerji veya çift reklam ödülü olmaz. Günlük sayaçlar UTC, haftalık UTC Pazartesi 00:00 kuralıyla güvenli yenilenir.

## 8. ZORUNLU KISA QA / TESLİM KAPILARI

**Veri bütünlüğü (hızlı; fizik simülasyonu değildir):** 120 benzersiz stage ID; mevcut ilk 30 ID/değer korunmuş; 90 yeni level 31..120; 12 chapter; her level 3–6 dalga + final; her wave'de yalnız tanımlı düşman ve pozitif sayı; her level tarifini karşılayabilecek malzeme; her onuncu level chapter boss; 5. level mini; çift/üçlü final tek ödül; 120. level bitişi gerçek sonuç ekranı ve tüm oyunu tamamladı işareti. JSON adaptörü, kontrolünü otomatik testte gösterir.

**Oynanış hedefli testler:** Mevcut 118 test korunur (eski tasarım beklentileri gerekirse güncellenir, test silinmez). Yeni düşmanlardan bir kalkan/sürat/bölünme; boss HP eşiği ve max summon; karşılaşma sonunda hedefe bağlı ammo kuyruğunun taşınması; boss olmayan düşmanın tekrar temas döngüsü; L40/80/120 final; ekipman Epic/Legendary gerçek etkileri; her run 5 enerji; dungeon hakları; kule checkpoint; eski save migration; iki reklam hakkı/gerçek callback olmadan sıfır ödül; iade edilmiş IAP hakkının geri yüklenmesi. Birkaç kısa smoke: L31, L40, L60, L80, L120, Boss Mutfağı ve Kule ilk 5 katı; hepsini otomatik baştan 120 kez oynama gerekmez.

**Teknik:** `npm test` + `npm run build` + mümkünse var olan kısa `npm run test:e2e` (çok zaman alıyorsa değişen UI için 360×640 ve 390×844 yerleşim smoke). 100+, 1.000+ seed simülasyonu ve ayrıntılı kıyaslama raporu YOK. Test gerçekten çalıştırılmadıysa 'geçti' demek YASAK.

**Oynanış kalitesi:** 120 level yalnız HP arttırılmış tek kopya değil: chapter başına yeni düşman mekanikleri, farklı uzunluk, rush/swarm/support/near spawn, mini/çift/üçlü final ve farklı boss fazları gerçekten oynanır. Topçukların boyutu/renkleri ve Şef altındaki ammo görünümü korunur. Enerji sistemi oyuncuyu menüden kilitlemez, reklam yokken enerji doğal dolar. Kalıcı güç artışının silah hasarı/yakalama/HP'de gözlenebilir sonucu vardır. Oyuncu tüm level'lara gerçek oyun akışıyla sırayla erişebilir.

## 9. İŞ SIRASI — AYNI PROMPT İÇİNDE BİTİR

1. Mevcut Alpha 0.5A.1 dosyalarını aç ve hangi sistemlerin otorite olduğunu birkaç dakikalık hedefli incelemeyle belirle. Sıfırdan refactor YOK.
2. Kompakt veri adaptörünü yaz; stage L31–120 + düşmanlar + 9 yeni boss + özgün görseller. İlk 30 korunur.
3. 120 chapter/level seçimi ve ödül/açılım kayıtlarını bağla. 5 enerji/run ve eski mühimmat/düşman davranışları korunur.
4. Epic/Legendary + enhancement + mevcut SG ve kaynak ekonomisine bağla; Boss Mutfağı + Kazan Kulesi + günlük/haftalık görevleri entegre et.
5. Android/web build, TR/EN temel localization, monetizasyon sağlayıcıları için gerçek/konfigürasyon ayrımını yap; UI/ikon/boss okunurluğunu bitir.
6. Hızlı veri validasyonu, hedefli test, build ve seçili smoke koşularını yap. Hata varsa yalnız ilgili kısmı düzelt. Kaynak + web + native proje dosyalarını paketle.
7. Tek mesajda teslim bağlantıları, test satırları, henüz doğrulanmamış SDK/Play Console ihtiyaçları ve varsa eksikler. **Uzun analiz raporu yazma.**

**ÖNCELİK KURALI:** Hiçbir eski özelliği feda ederek '120 level tamamlandı' deme. Kaynak sınırı oluşursa daha az analiz, daha az kozmetik, daha az dış bağımlılık kullan; **gerçek çalışan oyun içeriği, eski kayıt güvenliği, 5 enerji, mevcut ammo/contact mekanikleri ve tüm 120 stage** birinci önceliktir. Uygulanmayan mod/SDK/görev varsa bunu saklama, sahte tamamlanmış V1.0 ilan etme. Kullanıcıdan ek karar/yeniden prompt istemeden mevcut verilerle elinden gelen tam uygulamayı yap.
