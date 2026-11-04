// Martı replikleri — kullanıcının verdiği Replikler.txt birebir (kategori adları dahil). Oyun içi kullanım:
//   kasaba: genel_konusma + ingiltere_brighton + simit_ve_balik_hayali + absurt_atasozleri + oyuncuyla_konusma
//   ana menü: main_menu · kaçan/başarısız av: failed_fishing · yükleme ekranı: loading_*
(function (D) {
  'use strict';
  D.MartiLinesSource = D.deepFreeze({
    "genel_konusma": [
      "Bak kaptan, o elindeki simidi denize atarsan külahları değişiriz. O susamlar milli servet!",
      "Kanımda susam seviyesi kritik eşiğin altına düştü. Acil gevrek takviyesi lazım, over!",
      "Simit yuvarlaktır, dünya da yuvarlak... Bu bir tesadüf mü? Sanmıyorum. Evrenin sırrı susamda gizli azizim.",
      "Rüyamda simit ağaçları gördüm. Dallarında demli çaylar yetişiyordu. Beni uyandırma, geri yatıcam.",
      "Şu martı halimle vegan olacaktım az kalsın, sonra simidi keşfettim. Karbonhidratın kutsal gücü adına!",
      "Hey! Şu iskeledeki çocuk simidinin kenarını mı attı? Tut beni kaptan, dalışa geçiyorum! GÖK MAVİ, SİMİT SICAK!",
      "Simit dediğin pekmezle yıkanır, ateşle kurulanır. Tıpkı Brighton'daki eski günlerim gibi... Şaka şaka, orada sadece yağmur vardı.",
      "Bana balık verme, balık tutmayı da öğretme. Bana balığı simidin arasına koyup ver!",
      "Sence yengeçler yan yan yürürken ileri gittiklerini mi sanıyorlar? Felsefi bir çıkmazdayım.",
      "Deniz anaları... Ne kadar gereksiz canlılar değil mi? Ne simit yerler, ne futbol bilirler. Sadece jöle gibi yüzüyorlar.",
      "Bu teknenin motoru 'pat pat' diye mi çalışıyor yoksa bana mı ritim tutuyor? Sanki arkada bir tekno parti var.",
      "Geçen gün bir kediyle bakıştık. 'Miyav' dedi. 'Gak' dedim. Anlaşamadık. Diplomatik kriz çıktı."
    ],
    "ingiltere_brighton": [
      "Logodaki martı var ya? Hah işte o Sir Jonathan Seagull. Büyük büyük dedem olur. O gaga yapısı genetik bizde, asalet akıyor asalet!",
      "Bizim Brighton bu hafta ne yaptı acaba? Premier Lig'in havası da bir başka oluyor.",
      "Dedem hep derdi ki: 'Evlat, topa kafa atma, canın acır. Git hakemin kafasına kon.' Vizyoner adamdı rahmetli.",
      "Ofsayt diye bir şey olmasa şu an ben de sahada olabilirdim. Kanat oyuncusu olarak doğmuşum ama kader bizi bu iskeleye attı.",
      "Maviler! Beyazlar! Brighton! Ve... Susamlar! Pardon, tezahürat karıştı.",
      "İngiltere'de martı olmak zor zanaat. Herkes Fish and Chips yiyor. Yağlı, vıcık vıcık... Simidin asaleti nerede, o nerede?",
      "Bizim oralarda hava hep griydi. Burada güneş var ama benim ruhum 'British Grey'. Neyse, D vitamini bedava en azından.",
      "Soldan uçmaya o kadar alışmışım ki, geçen gün kargalarla kafa kafaya çarpışıyorduk. Trafik kuralları evrensel olmalı!"
    ],
    "simit_ve_balik_hayali": [
      "Kaptan bak şimdi strateji şu: Sen bir istavrit tutuyorsun, ben bir simit çalıyorum... Pardon, 'ödünç alıyorum'. Sonra bunları birleştiriyoruz.",
      "Michelin yıldızlı şefler halt etmiş. Simit arası hamsi... Bunu bulan tarihe geçer.",
      "Fish and Chips öldü, yaşasın Simit and Fish! Kraliçe bunu duysa tahtı bırakır buraya yerleşirdi.",
      "Hayatımda tek bir eksiğim var: Çıtır bir simidin içinde bana göz kırpan ızgara bir levrek.",
      "Kaptan bak, bilimsel konuşuyorum: Hamside fosfor var, simitte karbonhidrat. Bunları birleştirirsek atomu parçalamış kadar enerji açığa çıkar.",
      "Şu denize bak... Milyonlarca balık, ekmeksiz yüzüyor. Yazık değil mi? Çıplak gibiler resmen.",
      "Geçen gün bir istavrite sordum, 'Hayatından memnun musun?' dedim. 'Abi beni susama bulasalar sesim çıkmaz' dedi."
    ],
    "absurt_atasozleri": [
      "Komşu komşunun külüne muhtaçtır diyorlar. Yalan! Komşu komşunun simidinin kenarındaki o yanık, kıtır kısma muhtaçtır.",
      "Gülü seven dikenine katlanırmış. Ben simidi seviyorum, susamına katlanıyorum. Dişimin arasına kaçıyor namussuzlar.",
      "Sakla samanı gelir zamanı... Kim uyduruyor bunları? Saman yenmez ki! Sakla simidi, yumuşasın.",
      "Bir elin nesi var, iki elin sesi var. Peki ya iki kanadın nesi var? Rüzgarı var ama elinde simit tutamıyor işte!",
      "Dost acı söyler... Ama simitçi amca tatlı bağırır: 'Taze taze!' İşte gerçek dost odur.",
      "Ayağını yorganına göre uzat demişler. Ben ayağımı tekne direğine göre uzatıyorum, yine de üşüyorum."
    ],
    "oyuncuyla_konusma": [
      "Hey, oradaki! Evet, ekranın başındaki. Fareyi öyle sallayıp durma, başım döndü!",
      "Beni sadece bir oyun karakteri sanıyorsun ama yanılıyorsun. Ben dijital bir gurmeyim.",
      "Oyunun grafikleri güzelmiş ha. Tüylerim ne kadar parlak çıkıyor, şu çözünürlüğe bak!",
      "Beni buradan 'Sesi Kapat' butonuyla susturabileceğini sanıyorsan yanılıyorsun. Ben rüyalarına girer yine susam isterim!",
      "O oltayı öyle tutarsan ancak denizanası tutarsın. Bilek hareketini yaparken biraz esnek ol.",
      "Kaptan, radyoyu açsana. Mümkünse klasik müzik olsun. Simit yerken Vivaldi dinlemek sindirimi kolaylaştırıyor.",
      "Teknenin boyası mı dökülmüş? Yok canım, o benim imzam. Sanat eseri bıraktım oraya."
    ],
    "main_menu": [
      "Şu 'Oyuna Başla' butonuna basmak için Kraliyet Ailesi'nden yazılı izin mi bekliyoruz? Hadi, tüylerim ağardı burada!",
      "Ayarlar menüsünde 'Sınırsız Susam' seçeneği var mı diye baktım. Yapımcı eklemeyi unutmuş. Eksi puan!",
      "Arkada çalan müziği duyuyor musun? Beni gaza getiriyor. Sanki Wembley Stadyumu'nda maça çıkıyor gibiyim.",
      "Mouse'u üzerimde gezdirip durma, gıdıklanıyorum! Onun yerine şu tekneye tıkla da rızkımızın peşine düşelim.",
      "Kaptan, ben burada beklerken yaşlanıyorum. Martı ömrü kısa olur derler, istatistikleri zorluyorsun şu an.",
      "Çıkış butonuna basmayı aklından bile geçirme. Daha simit yemedik. Sözleşmemizde 'günde en az 3 simit' maddesi var."
    ],
    "failed_fishing": [
      "Kaptan, kova o kadar boş ki içine bağırsam yankı yapar. 'Eko... Eko...' Duydun mu? Açlığımın sesi o.",
      "Tebrikler! Denizdeki ekolojik dengeyi korudun. Bir tane bile balığı incitmedin. Greenpeace sana madalya takmalı.",
      "Brighton'da bir söz vardır: 'Balık yoksa Fish and Chips de yoktur.' Burada ise durum daha vahim: 'Balık yoksa simit arası hava var.'",
      "Sana 'rastgele' demiştim, 'boş gele' değil. Aksanım yüzünden yanlış mı anladın evlat?",
      "Gözlerime bak kaptan... Bu gözlerdeki hayal kırıklığını görüyor musun?",
      "Sanırım balıklar senin geldiğini görünce grup toplantısına girdiler. Neyse, fırıncı açık mıdır?",
      "Oltanın ucuna yem takmayı unuttun değil mi? İtiraf et. Aramızda kalacak."
    ],
    "loading_genel": [
      "Balık tutarken sessiz olmana gerek yok. Balıklar suyun altında zaten hiçbir şey duymuyor.",
      "Kasabanın meydanındaki heykel var ya? Aslında o bana benzetilmeye çalışılmış ama bütçe yetmemiş.",
      "Biz martılar aslında uçaklardan daha aerodinamiğiz. Sadece yakıt olarak simit kullandığımız için bazen motor teklemesi yapıyoruz.",
      "Bu kasaba 1800'lerde bir simitçi tarafından kurulmuş. Şaka şaka, bilmiyorum. Ama kurulduysa sebebi kesin simittir.",
      "Kasabanın lodosu meşhurdur. Ağzını açık tutarsan, rüzgarın taşıdığı susamlar direkt midene gider.",
      "Eğer oltana bir şey takılmıyorsa, denize simit at. Balık gelmezse bile ben gelirim. Kazan-Kazan durumu."
    ],
    "loading_insaat": [
      "Oyun yükleniyor... Pikselleri tek tek gagala yerine taşıyorum, az sabret. Kolay mı sanıyorsun bu işi?",
      "Bu yükleme ekranı neden bu kadar uzun sürdü? Kesin arkada kodlar birbirine dolandı, tıpkı senin misinalar gibi.",
      "Şu an kasabanın kaplamalarını boyuyoruz. Islak zemin, basma. Kayıp düşersen tazminat ödemem.",
      "Bilgisayarın biraz ısınıyor mu ne? Olsun, fanın sıcaklığıyla simit ısıtırız. Enerji tasarrufu.",
      "%99'da takılırsak panik yapma. Ben gidip modemi gagalayıp gelirim, düzelir."
    ],
    "loading_asci": [
      "İyi bir simit, yere düştüğünde 'tok' bir ses çıkarmalıdır. Eğer 'çat' sesi geliyorsa bayattır.",
      "Balıkları kızartmadan önce onlara güzel sözler söyle. Lezzeti %20 artıyor, bizzat denedim.",
      "Bu oyunda açlık barı yok ama benim var. Ekranın köşesinde görünmüyor çünkü sığmadı.",
      "Çayın yanına simit gider, simidin yanına peynir gider... Sonuçta hepsi benim mideme gider.",
      "İngiltere'de balığa sirke dökerler. Barbarlık! Balığa limon sıkılır, simide banılır."
    ],
    "loading_aristokrat": [
      "Büyük büyük dedem Sir Jonathan, Titanik'e bilet almıştı ama son anda simit yemek için iskelede kaldı.",
      "Bir martıya simit atarken asla direkt kafasına nişan almayın. Biz kaleci değiliz, beyefendiyiz.",
      "Kraliçe'nin corgi köpekleri var ya? Hah, işte onlarla aynı mamayı yiyordum bir zamanlar. Simidin yanından geçemez.",
      "Bu kasabanın belediye başkanı geçen gün gizlice diyet bisküvi yerken görüldü. Skandal!",
      "Burası Küçükçekmece mi yoksa Brighton Sahili mi bazen karıştırıyorum."
    ],
    "loading_coach": [
      "Kaptan, 4-4-2 oynayacağız. 4 istavrit, 4 lüfer, 2 de palamut. Defansta sağlam dur.",
      "O kaçan balık ofsayttı zaten. Çizgiyi geçmemişti. Hakem benim, ben ne dersem o.",
      "Kanatlarım ağrıyor sanma, bunlar hep kondisyon çalışması. Rüzgara karşı uçmak kolay değil.",
      "Denizdeki dalgalar bize tezahürat yapıyor sandım, meğer fırtına geliyormuş.",
      "Balık sezonu açıldı. Bonservisi elinde olan hamsileri takıma katmamız lazım."
    ],
    "loading_bilim": [
      "Aerodinamik kanunlarına göre bir martının o göbekle uçamaması lazım. Ama simit bizi motive ediyor.",
      "İnsan vücudunun %70'i sudur. Benim vücudumun %70'i susam, %30'u ise saf karizma.",
      "Hava durumu parçalı bulutlu ve simit yağışlı gösteriyor. Şemsiyeni almayı unutma.",
      "Martılar eskiden dinozorlarmış. T-Rex'in kollarının neden kısa olduğunu buldum: Simide uzanamasın diye.",
      "Bir simit + Bir çay = Sonsuz mutluluk. Bu denklemi Einstein bile çözemedi, ben çözdüm."
    ]
  });
  // Kategorileri sırayla karıştırarak tek liste (art arda aynı türden replik gelmesin)
  D.interleaveLines = (...lists) => { const out = []; const n = Math.max(...lists.map((l) => l.length)); for (let i = 0; i < n; i++) for (const l of lists) if (l[i] != null) out.push(l[i]); return out; };
})(globalThis.DUMEN);
