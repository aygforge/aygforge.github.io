// NPCDB + DialogueDB. Kanonik NPC'ler: Martı, Don Zıpırleone, Müfettiş Tarçov, Komplo Teorisyeni, Hurdacı Hasan, Rüstem.
// Kaya Usta ve Kropi Usta: önceki sürümden yardımcı roller (GDD'de tam kilitli değil — CANON_GAPS.md).
// Fabrika ve Market görevlileri için isim uydurulmadı (GDD §18.6): rol adlarıyla anılırlar.
(function (D) {
  'use strict';
  D.NPCDB = D.deepFreeze({
    player: { name: 'Sen', role: 'Balıkçı' },
    marti: { name: 'Martı', role: 'Teknenin gayriresmî sahibi', canonical: true, givesQuests: false },
    rustem: { name: 'Rüstem Aga', role: 'Balık Pazarı', canonical: true },
    hasan: { name: 'Hurdacı Hasan', role: 'Hurda & craft ustası', canonical: true },
    zip: { name: 'Don Zıpırleone', role: 'Tamamen yasal iş insanı (kedi)', canonical: true },
    tarcov: { name: 'Müfettiş Tarçov', role: 'Müfettiş (köpek)', canonical: true },
    komplo: { name: 'Komplo Teorisyeni', role: 'Gerçeğin peşinde', canonical: true },
    kaya: { name: 'Kaya Usta', role: 'Denizin Defteri', canonical: false, note: 'Önceki sürümden yardımcı; GDD\'de tam kilitli değil.' },
    kropi: { name: 'Kropi Usta', role: 'Tekne Atölyesi', canonical: false, note: 'Önceki sürümden yardımcı; GDD\'de tam kilitli değil.' },
    factory: { name: 'Geri Dönüşümcü', role: 'Geri Dönüşüm Fabrikası', canonical: false },
    market: { name: 'Ahmet', role: 'Market', canonical: false },
    baskan: { name: 'Belediye Başkanı', role: 'Belediye', canonical: false },
    tekir: { name: 'Tekir', role: 'Don Zıpırleone\'nin sağ kolu', canonical: false }
  });

  // Rutin konuşmalar (görev vermeyen). Sırayla döner; tekrarı azaltmak için index kayıtta tutulur.
  D.IdleLines = D.deepFreeze({
    marti: [
      'Ben bu tekneye konmadım. Tekne benim altıma park etti.',
      'O balık kaçmadı. Stratejik geri çekildi.',
      'Simit var mı? Yok mu? O zaman konuşmamız bitmiştir.',
      'Bugün rüzgâr doğudan. Ben de doğudanım. Tesadüf mü?',
      'Teknene bir yıldız veriyorum. Beş üzerinden. Sorma neden.',
      'Rüstem bana "hırsız" diyor. Ben ona "tedarikçi" diyorum.',
      'Bir gün ben de balık tutacağım. Gagamla. Bekle ve gör.',
      'Denizde ne var biliyor musun? Su. Ve balık. Ve benim hayallerim.',
      'Kraken diye bir şey yok. Olsa bana haber verirlerdi.',
      'Teknene bakıyorum, sonra sana bakıyorum. İkiniz de yamalısınız.',
      'Bu kayık dalgada sallanıyor. Ben sallanmıyorum. Ben sabitim.',
      'Kayığın kaptanı benim. Sen sadece kürekçisin. Kürek de benim.',
      'Dalga geldi, gitti. Ben kaldım. Sadakat budur.',
      'Su soğuk mu? Bilmem. Ayaklarımı ıslatmam, imajım var.',
      'Bu kayığı kimse çalamaz. Çünkü önce beni geçmesi lazım. Ve ben simit istiyorum.'
    ],
    marti_success: ['Vay! Bunu ben yakalasam daha iyi olurdu ama yine de vay.', 'Bu balığın fotoğrafını çekin, ben de kadraja gireceğim.', 'İşte bu! Simitle kutlayalım. Senin simitinle.'],
    marti_fail: ['O balık kaçmadı. Stratejik geri çekildi.', 'Misina koptu ama gurur sağlam. Değil mi? Değil mi?', 'Dert etme, ben de dün bir patatesi kaçırdım.'],
    rustem: ['Taze balık, taze para! Bayat balık? Fabrikaya, kardeşim.', 'Bu tezgâhta kırk yıldır balık satıyorum. Martı kırk bir yıldır çalıyor.', 'Bir balığın tazeliği gözünden belli olur. Senin gözünden de yorgunluk.', 'Bugün buz bedava! Yarın değil. Yarın hiç değil.'],
    hasan: ['Pas, metalin bilgeliğidir.', 'Bu dişliyi görüyor musun? Ben de görmüyorum, gözlüğümü kaybettim.', 'Bir hurdacı hiçbir şeyi atmaz. Karım bunu sevmiyor.', 'Bana çöp getir, sana olta yapayım. Adil ticaret!'],
    zip: ['Burada her şey tamamen yasal. Özellikle yasal olmayan kısımlar.', 'Miyav Puanı mı? Hiç duymadım. Kaç tane var sende?', 'Ben bir iş insanıyım. İşim de insanlarla. Ve balıklarla. Ve sorulmayan sorularla.', 'Kapıyı çalmadan girdin. Bunu severim. Bir dahakine çal.'],
    tarcov: ['Rozetime bak. Hayır, alçaktan bak. Ben kısa boyluyum.', 'Her şeyi not ediyorum. Şu an da not ediyorum.', 'Bu kasabada bir şeyler dönüyor. Muhtemelen o çark.'],
    komplo: ['Ufuk çizgisi hep aynı yükseklikte. Neden? NEDEN?', 'Bu kasabadaki herkes aynı yürüyüş animasyonunu kullanıyor. Fark ettin mi?', 'Balıklar konuşmuyor çünkü ses kayıtları bitmedi.', 'Folyo şapka sadece moda değil. Aynı zamanda moda.'],
    kaya: ['Denizin Defteri hiçbir balığı unutmaz. Ben de unutmam. Ama gözlüğümü unuturum.', 'Her balığın bir hikâyesi vardır. Bazılarınınki çok uzundur, kısalt derim.', 'Bir bölgenin bütün balıklarını kaydet; deniz sana teşekkür eder.'],
    kropi: ['Tekne dediğin su almaz. Az alır. Kabul edilebilir miktarda alır.', 'Her yeni seviye, yeni bir deniz demek.', 'Çekici bana uzat. Hayır, o kerpeten. Neyse, o da olur.'],
    factory: ['Bayat balık bizim işimiz. Koku da bizim işimiz. Maaş az.', 'Bant hiç durmaz. Bir kere durdu, Hasan dans ediyor sandık.', 'Taze balığını burada değerlendirirsen Rüstem\'den az kazanırsın. Söylemiş olayım.'],
    market: ['Hoş geldin! Yem rafı solda, olta rafı sağda, martı yasak.', 'Bir olta bir kez alınır. Ama yem? Yem sonsuzdur.', 'Bu sandıkta en iyi yemler var. Bakmak bedava, koklamak da.', 'Fiş ister misin? Ben de istemem.'],
    baskan: ['Belediyemiz halkın hizmetinde! Özellikle de tekne izni almak isteyen halkın.', 'Bu rozet çok önemli. Ne anlama geldiğini unuttum ama çok önemli.', 'Saat mi? Belediyenin saati hiç geç kalmaz. Çünkü hiç ilerlemez.', 'Kasabamızın sloganı: "Balık var, umut var, simit de var."'],
    tekir: ['Don meşgul. Ben de meşgulüm. Hepimiz çok meşgulüz.', 'Bu sandığın içinde ne var diye sorma. Kedi kumu. Resmî olarak kedi kumu.', 'Patron sağ kolunu kaybetmesin diye ben buradayım. Sol kolunun da kim olduğunu bilmiyorum.', 'Gözlerim kısık, çünkü her şeyi görüyorum. Bir de uykum var.']
  });

  // Hikâye diyalogları (QuestDB adımları buradan referans verir). Satır: [konuşan, metin]. {choice:[...]} seçim.
  D.DialogueDB = D.deepFreeze({
    // ---------- Tarçov × Zıpırleone (erken, 5 bölüm) ----------
    T1_tarcov: [['tarcov', 'Dur! Kımıldama. Ben Müfettiş Tarçov. Rozetime alçaktan bak lütfen.'], ['player', 'Merhaba?'], ['tarcov', 'Bu kasabada bir kedi var. Takım elbiseli. Adı Don Zıpırleone. Hakkında soruşturma başlattım.'], ['tarcov', 'Liman Sokağı\'ndaki Karanlık Mahalle\'de, mekânının önünde şüpheli sandıklar gördüm. Git bir bak. Ben... buradan izleyeceğim. Kedilerle aram iyi değil.']],
    T1_inspect: [['player', 'Sandıkların üstünde "BALIK DEĞİLDİR" yazıyor.'], ['player', 'İçinden mırıltı geliyor. Ve bir de... radyo? Kedi radyosu mu bu?'], ['marti', '(uzaktan) Ben bir şey görmedim! Simit verirseniz daha da az görürüm!']],
    T1_zip: [['zip', 'Ahh, yeni balıkçımız. Sandıklarıma bakıyordun. Merak güzel bir şey. Bazen de tehlikeli.'], ['zip', 'İçlerinde ne mi var? Kedi kumu. Hukuken tamamen kedi kumu.'], ['zip', 'O kısa boylu köpeğe söyle: Don Zıpırleone dürüst bir iş insanıdır. Ve köpekleri hiç sevmez.']],
    T2_tarcov: [['tarcov', 'Kasabada "Miyav Puanı" diye bir şey dolaşıyor. Para mı? Puan mı? Kupon mu? Kimse bilmiyor!'], ['tarcov', 'Kasabalılara sor. Rüstem\'e, Hasan\'a, Kaya Usta\'ya. Her şeyi not alacağım.']],
    T2_rustem: [['rustem', 'Miyav Puanı mı? Kedilerin parasıdır! Bir kere bir kedi bana üç Miyav verdi, bir hamsi aldı. Zarar ettim.']],
    T2_hasan: [['hasan', 'Miyav Puanı bir metal türüdür. Paslanmaz. Çünkü yoktur. Yani... var mı? Bilmiyorum, bana sorma.']],
    T2_kaya: [['kaya', 'Defterime göre Miyav Puanı, bir balık ölçü birimidir. Bir miyav, yaklaşık bir kedinin bir balığa bakış süresidir.']],
    T2_zip: [['zip', 'Herkese sormuşsun. Herkes başka şey söylemiş. Güzel. Kafa karışıklığı en sağlam kasadır.'], ['zip', 'Miyav Puanı... diyelim ki dostluğun ölçüsü. Al, sana birkaç tane. Dostluk başlangıcı.'], ['zip', 'Ama bir şart: bana bir Nadir ya da daha iyi bir balık getir. Dostluğu besle.']],
    T2_zip_done: [['zip', 'Mükemmel. Bu balık tam benim gibi: seçkin ve biraz kaygan. Al bakalım Miyavlarını.'], ['tarcov', '(kapı aralığından) Not ediyorum: "Rüşvet balık cinsinden."']],
    T3_tarcov: [['tarcov', 'Komplo Teorisyeni denen adam kasabanın düzenini bozuyor. "Oyun", "ekran", "kodlar" diye bağırıyor.'], ['tarcov', 'Ona resmî bir uyarı vereceğim. Sen de tanık ol. Resmî tanık. Rozetli olmayan tanık.']],
    T3_komplo: [['tarcov', 'Sayın Teorisyen! Kasaba düzenine ve oyunun işleyişine karışmamanız için resmen uyarıyorum!'], ['komplo', '"Oyunun işleyişi" dedi. Duydunuz mu? OYUNUN!'], ['komplo', 'Bu uyarı bile önceden programlanmış, Müfettiş. Senin replik kutun bu cümleyle açılıyor. Ben gördüm.'], ['tarcov', '...Not ediyorum: "Şahıs, repliğimi biliyordu." Bu çok rahatsız edici.']],
    T4_tarcov: [['tarcov', 'Kanıt lazım. Zıpırleone\'nin malları denizden geliyor olabilir. Paslı Sanayi Kanalı\'na git, oltayla bir sandık çıkar.'], ['tarcov', 'Kanalda ne bulursan getir. Hangisi olursa. Ben kanaldan korkmuyorum, sadece... tüylerim ıslanıyor.']],
    T4_return: [['player', 'Bir sandık çıkardım ama içinden sadece hurda çıkıyor.'], ['tarcov', 'Hmm. Teneke. Paslı. Kedi tüyü yok. Kanıt... yok.'], ['tarcov', 'Elimde sadece bu mühürlü delil kasası kaldı. Sende dursun. Mührü ben buradayken açılamaz, yasa böyle.'], { choice: [
      { label: 'Tarçov\'a hak ver: "Bir şeyler dönüyor."', set: { sideTarcov: true }, reply: [['tarcov', 'Bir müfettişin en iyi dostu, şüpheci bir balıkçıdır. Teşekkürler.']] },
      { label: 'Zıpırleone\'yi savun: "Kanıt yoksa suç da yok."', set: { sideZip: true }, reply: [['tarcov', 'Hukuken haklısın. Ahlaken... not ediyorum.'], ['zip', '(uzaktan) Bunu duydum ve takdir ettim.']] }
    ] }],
    T5_tarcov: [['tarcov', 'Kanıt yok. Dava kapandı. Kasabadan ayrılıyorum.'], ['tarcov', 'Ama unutma: bir çark döndüğünde, birileri hep kazanır. Genelde çarkın sahibi.'], ['tarcov', 'Elveda, balıkçı. Rozetime son kez alçaktan bak.'], ['marti', 'Gidiyor mu? Sonunda! Bir köpek daha az, bir simit daha çok.']],
    T5_zip: [['zip', 'Köpek gitti. Hava da güzelleşti, fark ettin mi?'], ['zip', 'Seni arka duvardaki tamamen yasal Kara Pazar Çarkı ile tanıştırayım. Günde bir kez bedava çevirebilirsin.'], ['zip', 'Ödüller mi? Coin, yem, materyal, bazen bir sandık... ve Miyav. Her şey kayıt dışı. Yani kayıtlı. Yani... çevir işte.']],
    // ---------- Komplo Teorisyeni (3 bölüm) ----------
    K1_komplo: [['komplo', 'Psst. Sen. Balıklara hiç dikkatli baktın mı?'], ['komplo', 'Memur Kefal\'in kravatı var. Kravat! Denizde! Bu balıklar normal değil.'], ['komplo', 'Bence bir veritabanından kaçtılar. Her birinin bir kimlik numarası var. EL_03 gibi. Kanıtla bana: Tembel Sazlıklar\'dan bir balık yakala.']],
    K1_done: [['komplo', 'Pijama! Ya da kamuflaj! Ya da yoga! Gördün mü? Hiçbiri normal değil!'], ['komplo', 'Al, bu Anneanne Gözlüğü. Hamleleri önceden görmeni sağlar. Anneannem de veritabanını görürdü.']],
    K2_komplo: [['komplo', 'Kasabanın açısı yanlış. Her şey hep aynı açıdan görünüyor. Sanki biri bizi yandan çiziyor.'], ['komplo', 'Üç şeyi incele: benim çatımdaki eğri anten, belediyenin hiç ilerlemeyen saati ve belediyenin arkası olmayan yan cephesi.']],
    K2_lamp: [['player', 'Çatıdaki anten gerçekten eğri. Ama gölgesi... dimdik.'], ['komplo', '(içeriden) GÖLGESİ DİMDİK! Not et!']],
    K2_cloud: [['player', 'Belediyenin saati hep aynı dakikayı gösteriyor. Ne ileri gidiyor ne geri.'], ['marti', 'O saat bana göre çalışıyor. Ben de hiç acele etmem.']],
    K2_facade: [['player', 'Belediyenin yanından arkasına bakmaya çalıştım. Arkası... yok gibi.'], ['komplo', '(uzaktan) Arkası yok! Çünkü kimse arkasını çizmedi!']],
    K2_done: [['komplo', 'Üç kanıt! Tarçov\'un uyarısından beri daha da eminim. Acil durum butonu al; belki bir gün bu simülasyondan çıkarız.'], ['komplo', 'Çalışmıyor tabii. Ama misina gerilimini düşürüyor. Tuhaf, değil mi?']],
    K3_komplo: [['komplo', 'Şimdi dikkatlice dinle. Arkanı dönme. Ekrana bak.'], ['komplo', 'Evet, SANA. Ekranın öbür tarafındakine. Parmağının ucundakine.'], ['komplo', 'Şu ana kadar {fishCaught} balık yakaladın ve {playMin} dakikadır buradasın. Bunu nereden biliyorum? Çünkü O da biliyor.'], ['komplo', 'Bizi izliyorlar. Daha doğrusu SEN izliyorsun. Ve bu çok... tatlı aslında.'], { choice: [
      { label: '"Ben sadece balık tutmaya geldim."', reply: [['komplo', 'Herkes öyle der. Sonra bir bakmışsın, 88 türü defterine yazmışsın.']] },
      { label: '"Peki, bizi kim çiziyor?"', reply: [['komplo', 'Bermuda\'daki bir balık. Oyun Geliştiricisi Balığı. Koordinatları bende.']] }
    ] }, ['komplo', 'Al bu koordinatları. Bermuda Girdabı. Teknen yeterince iyi olunca oraya git. Ve şu folyo şapkayı tak, her ihtimale karşı.']],
    // ---------- Don Zıpırleone orta oyun (5 bölüm) ----------
    Z1_zip: [['zip', 'Dostum. Artık sana güveniyorum. Neredeyse. Bir test yapalım: Sessiz Miyav Anlaşması.'], ['zip', 'Bana Yakamoz Koyu\'ndan iki balık getir. Ve kimseye söyleme. Kimseye. Martıya bile.']],
    Z1_done: [['zip', 'Getirdin. Ve martı hiçbir şey bilmiyor gibi görünüyor. Mükemmel.'], ['marti', '(tepeden) Ben her şeyi biliyorum ama kimse sormuyor.'], { choice: [
      { label: '(Hiçbir şey söyleme.)', set: { zipSilent: true }, reply: [['zip', '...Sessizlik. En sevdiğim dil. Al bu şapkayı, yazlık ama sağlam.']] },
      { label: '"Martı biliyor bence."', reply: [['zip', 'Martı her şeyi bilir, kimse inanmaz. Sorun yok. Al bu şapkayı.']] }
    ] }],
    Z2_zip: [['zip', 'Bu akşam gizli bir toplantı var. Yanlışlıkla seni de davet ettim. Yani... gel.'], ['zip', 'Önce bir şart: Titrek Buzullar\'dan bir balık yakala. Toplantıda "soğuk delil" gerekiyor. Neden? Sorma.']],
    Z2_meeting: [['zip', 'Toplantıyı açıyorum. Gündem madde 1: Kedi maması fiyatları.'], ['zip', 'Gündem madde 2: Martı neden hep tekneye konuyor?'], ['zip', 'Gündem madde 3: Gizli toplantının gizli olmaması.'], { choice: [
      { label: 'Madde 1\'e oy ver.', reply: [['zip', 'Kabul edildi. Mama fiyatları... aynen kalacak. Toplantı başarılı.']] },
      { label: 'Madde 2\'ye oy ver.', reply: [['zip', 'Kabul. Martıyı bir komisyon araştıracak. Komisyon başkanı: martı.']] },
      { label: '"Bu toplantı hiç gizli değil."', reply: [['zip', 'Madde 3 kendini çözdü. Tebrikler, toplantıyı bitirdin.']] }
    ] }, ['zip', 'Hediyen: Köstekli Saat. Dedemin dedesinden. Ya da bir pazardan. Önemli değil.']],
    Z3_zip: [['zip', 'Bir defterim kayboldu. Çok önemli bir defter. İş defteri. Kesinlikle iş defteri.'], ['zip', 'Son gördüğümde Batık Korsan Mezarlığı\'ndaydı. Oltayla bir sandık çıkar, belki içindedir.']],
    Z3_done: [['player', 'Sandığın içinde bir defter vardı. İçinde... şiirler var. Balık şiirleri.'], ['player', '"Ey uskumru, gözlerin ne kadar da gümüş / sen olmasan bu deniz bir çay kaşığı kadar küçük."'], ['zip', '...Bunları okumadın. Okusaydın da beğenmezdin. Beğendin mi?'], { choice: [
      { label: '"Çok güzeldi, Don."', reply: [['zip', 'Bunu bir sır olarak sakla. Al şu Uğurlu Kitabı. İçinde şiir yok. Sanırım.']] },
      { label: '"Kafiye biraz zayıf."', reply: [['zip', 'Eleştiri... sanatı büyütür. Al şu Uğurlu Kitabı ve git.']] }
    ] }],
    Z4_zip: [['zip', 'Ciddi bir mesele. Yıllar önce birine Miyav borçlandım. O biri şimdi kapıda.'], ['zip', 'Borcu kapatmama yardım et: 40 Miyav ve bana bir Epik ya da daha iyi balık lazım. Kimse bilmesin.']],
    Z4_done: [['zip', 'Borç kapandı. Kapıdaki gölge gitti. Aslında o gölge benim eski şapkamdı, ama olsun.'], ['zip', 'Sana Kaçak Yem veriyorum. Efsanevi balıkları çeker ama balıkları hırçınlaştırır. Tıpkı kira gibi.']],
    Z5_zip: [['zip', 'Son iş. Kapının arkasındaki mekân. Orayı açmak için birkaç şey lazım.'], ['zip', 'Kaynar Kazan\'dan bir balık, yeşil bölgede yakalanmış bir hazine, tekneye takılı bir Kara Pazar parçası ve kapı tamiri için 1.500 coin.']],
    Z5_done: [['zip', 'Hepsi tamam. Kapı... açılıyor.'], ['zip', 'Burası Arka Oda. Ailemin gizli kulübü. Şiir geceleri, eski hatıralar, ve kimsenin bilmediği güzel şeyler.'], ['zip', 'Artık sen de ailedensin. Al şu Eski Kumanda\'yı; bir balığın hamlesini iptal eder. Dedem televizyonu bununla iptal ederdi.']],
    // Arka Oda şiir gecesi
    poem: [
      [['zip', '"Ey hamsi, ey ince belli gümüş / bir kedinin rüyasında sen hep yüzersin."'], ['marti', '(pencereden) Benim hakkımda şiir yok mu?']],
      [['zip', '"Bermuda döner, ben dönmem / bir balık sevdim, adını bilmem."'], ['zip', 'Bu çok kişisel. Lütfen alkışlama. Peki, alkışla.']],
      [['zip', '"Rüstem\'in tezgâhı, Hasan\'ın pası / bu kasabanın en güzel hâli, martının yası."'], ['zip', 'Martı yasta değil aslında. Kafiye için.']],
      [['zip', '"Kraken uyur, deniz susar / bir balıkçı gelir, oltası susar."'], ['zip', 'Bu şiiri yazdıktan sonra üç gün uyuyamadım.']]
    ]
  });
})(globalThis.DUMEN);
