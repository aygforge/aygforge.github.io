// Hayvanlara özel GEMİ İÇİ olaylar. Havuzda değil: yolculuk kuyruğu kurulurken, gemide uygun hayvan varsa
// normal bir slotun yerine konur (olay yoğunluğu ve tempo değişmez). Etkiler bilinçli olarak küçüktür.
const P = (o) => ({ cat: 'pet', pool: false, tier: 1, deck: true, ...o });

export const PET_DECK_EVENTS = [
  // ───────── TARÇIN ─────────
  P({ id: 'EVT_PET2_TARCIN_OVERBOARD', title: 'Tarçın Denizde!', tags: ['pet', 'sea'], cond: { pet: 'PET_TARCIN' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'dog'] },
    text: `Tarçın küpeşteye konan bir martıyı kovalarken ayağı kaydı ve suya düştü! Kuyruğunu sallayarak yüzmeye çalışıyor ama gemi ondan uzaklaşıyor.`,
    options: [
      { label: 'Halat at', icon: 'rope', chance: 70, bonus: [{ crew: 'CREW_BJORN', add: 20 }, { crew: 'CREW_FINN', add: 15 }],
        win: { text: `Tarçın halatı dişleriyle yakaladı. Güverteye çıkınca silkelenip herkesi ıslattı.`, fx: { xp: 5 } },
        lose: { text: `Halat iki kez kısa geldi. Sonunda Tarçın'ı kepçeyle aldınız ama koşuşturmada bir sandık devrildi.`, fx: { cargoLoss: 8 } } },
      { label: 'Mira dalsın', icon: 'dive', req: { crew: 'CREW_MIRA' },
        win: { text: `Mira tek kulaçta Tarçın'a ulaştı. Tarçın o günden sonra Mira'nın peşinden ayrılmadı.`, fx: { xp: 10 } } },
      { label: 'Sandal indir', icon: 'boat',
        win: { text: `Sandal indirildi; Tarçın sevinçle sandala atladı. Biraz zaman kaybettiniz ama herkes güldü.`, fx: { xp: 5 } } },
    ] }),
  P({ id: 'EVT_PET2_TARCIN_STOWAWAY', title: 'Ambardaki Kaçak', tags: ['pet'], cond: { pet: 'PET_TARCIN' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'dog'] },
    text: `Tarçın ambarın kapağının başında durmadan havlıyor. Aşağıda, çuvalların arasında titreyen bir miço saklanıyordu.`,
    options: [
      { label: 'Gemide kalsın', icon: 'heart',
        win: { text: `Çocuk mutfağa yardım etmeye başladı. Tayfanın keyfi yerine geldi.`, fx: { xp: 10, luckBuff: { add: 5, events: 2 } } } },
      { label: 'Limanda teslim et', icon: 'anchor',
        win: { text: `Liman yetkilileri kaçak çocuğu arayan ailesinden bir ödül bıraktı.`, fx: { goldR: 35 } } },
      { label: 'Tarçın\'la oynasın', icon: 'dog',
        win: { text: `Çocuk ve Tarçın bütün gün güvertede koşturdu. Kimse onları ayırmaya kıyamadı.`, fx: { xp: 5 } } },
    ] }),

  // ───────── ZIPIR ─────────
  P({ id: 'EVT_PET2_ZIPIR_RATS', title: 'Ambarda Fareler', tags: ['pet'], cond: { pet: 'PET_ZIPIR' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'cat'] },
    text: `Ambardan tıkırtılar geliyor; çuvallar kemirilmeye başlamış. Zıpır kulaklarını dikti, görmeyen gözleriyle karanlığa döndü.`,
    options: [
      { label: 'Zıpır avlasın', icon: 'cat',
        win: { text: `Zıpır sessizce aşağı süzüldü. Gece boyu tıkırtı kesildi; sabah kapının önünde iki fare vardı.`, fx: { fixSpoiled: true, xp: 5 } } },
      { label: 'Pita tuzak kursun', icon: 'hand', req: { crew: 'CREW_PITA' },
        win: { text: `Pita peynirli tuzaklar kurdu, yakaladığı fareleri bir balıkçıya sattı bile.`, fx: { goldR: 20 } } },
      { label: 'Görmezden gel', icon: 'no', tags: ['pass'],
        win: { text: `Fareler bir süre daha ziyafet çekti.`, fx: { cargoSpoil: 2 } } },
    ] }),
  P({ id: 'EVT_PET2_ZIPIR_NEST', title: 'Gözcü Yerinde Bir Kedi', tags: ['pet'], cond: { pet: 'PET_ZIPIR' },
    art: { sky: 'day', sea: 'choppy', obj: ['deckView', 'cat'] },
    text: `Zıpır direğe tırmanıp gözcü sepetine kurulmuş, inmiyor. Rüzgâr sertleşiyor ve direk sallanıyor.`,
    options: [
      { label: 'Tırman ve indir', icon: 'hand', chance: 65, bonus: [{ crew: 'CREW_TOBIAS', add: 20 }],
        win: { text: `Zıpır'ı koltuğunun altına alıp indin. Sepetteyken uzakta bir şey görmüş gibiydi.`, fx: { reveal: 1, xp: 5 } },
        lose: { text: `Halat elinden kaydı, düşerken bir kasnağı kırdın. Zıpır kendi indi; seni süzdü.`, fx: { hullRaw: -5 } } },
      { label: 'Balıkla kandır', icon: 'gift', req: { cargoGood: 'GOOD_FISH' },
        win: { text: `Balık kokusunu alan Zıpır, direğin tepesinden bir kedi zarafetiyle süzülüp indi.`, fx: { cargoRemove: 'GOOD_FISH', cargoRemoveQty: 1, xp: 5 } } },
      { label: 'Bekle', icon: 'anchor',
        win: { text: `Zıpır akşama kadar orada kaldı ve tam fırtına dinerken kendiliğinden indi. Sanki biliyordu.`, fx: { luckBuff: { add: 10, events: 1 } } } },
    ] }),

  // ───────── ESKİ DOSTLAR (ikisi birlikte) ─────────
  P({ id: 'EVT_PET2_OLD_FRIENDS_PLAY', title: 'Güvertede Kovalamaca', tags: ['pet'], cond: { pet: 'PET_ZIPIR' }, cond2: { pet: 'PET_TARCIN' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'dog', 'cat'] },
    text: `Tarçın bir ipin ucunu kaptı, Zıpır da peşine düştü. İkisi güvertede tur atıyor; tayfa işi gücü bırakıp onları izliyor.`,
    options: [
      { label: 'Bırak oynasınlar', icon: 'heart',
        win: [
          { w: 60, text: `Kovalamaca bir varil devrilene kadar sürdü. Sonra ikisi aynı güneşli köşede kıvrılıp uyudu. Tayfa günlerdir bu kadar gülmemişti.`, fx: { xp: 10, luckBuff: { add: 10, events: 2 } } },
          { w: 40, text: `Tarçın bir fıçıya çarptı; içinden unutulmuş bir kese yuvarlandı. Zıpır keseyi patisiyle sana itti.`, fx: { goldR: 40, xp: 5 } },
        ] },
      { label: 'İşe dönün', icon: 'no',
        win: { text: `Tayfa homurdanarak işe döndü. Tarçın ipi bıraktı, Zıpır esnedi.`, fx: {} } },
    ] }),

  // ───────── PAPAĞANLAR / MAYMUN ─────────
  P({ id: 'EVT_PET2_KIRMIZI_HAT', title: 'Kaptanın Şapkası', tags: ['pet'], cond: { pet: 'PET_KIRMIZI' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'parrot'] },
    text: `Kaptan Kırmızı senin şapkanı kapıp direğin tepesine uçtu. "Kaptan benim! Kaptan benim!" diye bağırıyor.`,
    options: [
      { label: 'Fıstıkla kandır', icon: 'gift', cost: { gold: 5 },
        win: { text: `Kırmızı fıstığı görünce şapkayı bıraktı. Şapka tam başına kondu; tayfa alkışladı.`, fx: { xp: 5 } } },
      { label: 'Şarkıyla eşlik et', icon: 'parrot',
        win: { text: `Bir denizci türküsü tutturdun; Kırmızı her nakaratı tekrarladı. Tayfa gün boyu şarkıyla çalıştı.`, fx: { luckBuff: { add: 8, events: 2 } } } },
      { label: 'Kovala', icon: 'hand', chance: 45,
        win: { text: `Halatlara tırmanıp şapkanı geri aldın. Kırmızı bir süre küs kaldı.`, fx: { xp: 5 } },
        lose: { text: `Şapka denize düştü. Kırmızı bunu çok komik buldu.`, fx: { gold: -15 } } },
    ] }),
  P({ id: 'EVT_PET2_GECEYARISI_OMEN', title: 'Kabaran Tüyler', tags: ['pet', 'night'], cond: { pet: 'PET_GECEYARISI' },
    art: { sky: 'night', sea: 'calm', obj: ['deckView', 'parrot'] },
    text: `Gece Yarısı bütün tüylerini kabartmış, dümene doğru bakıp tek bir notayı tekrarlıyor. Tayfa huzursuz.`,
    options: [
      { label: 'Uyarıya kulak ver', icon: 'eye',
        win: { text: `Yelkenleri erkenden toplayıp halatları iki kat bağladınız. Ne geliyorsa hazırsınız.`, fx: { luckBuff: { add: 15, events: 1 }, reveal: 1 } } },
      { label: 'Örtüyle üstünü ört', icon: 'no',
        win: { text: `Kafesin üstüne bir örtü attın. Sessizlik… ama tayfanın gözü hâlâ ufukta.`, fx: {} } },
    ] }),
  P({ id: 'EVT_PET2_CUCE_COMPASS', title: 'Pusula Hırsızı', tags: ['pet'], cond: { pet: 'PET_CUCE' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'monkey'] },
    text: `Dümenin yanındaki pusula yok! Cüce Kaptan onu direğin tepesine taşımış, parlayan iğneyi büyülenmiş gibi izliyor.`,
    options: [
      { label: 'Kovala', icon: 'hand', chance: 55,
        win: { text: `Pusulayı geri aldın. Cüce Kaptan iğnenin hep aynı yeri gösterdiğine çok şaşırmıştı.`, fx: { xp: 5 } },
        lose: { text: `Kovalamaca sırasında rota biraz şaştı; geri dönmek zaman ve erzak yedi.`, fx: { gold: -20 } } },
      { label: 'Muzla takas et', icon: 'gift', cost: { gold: 8 },
        win: { text: `Muz pusuladan daha ilginçti. Takas tamam.`, fx: { xp: 5 } } },
      { label: 'Yedek pusulayı kullan', icon: 'compass',
        win: { text: `Yedek pusulayla devam ettiniz. Akşam Cüce Kaptan pusulayı yastığının altına bırakmıştı.`, fx: {} } },
    ] }),

  // ───────── YENİ HAYVANLAR ─────────
  P({ id: 'EVT_PET2_MARTI_GIFT', title: 'Kaşif\'in Hediyesi', tags: ['pet', 'sea'], cond: { pet: 'PET_MARTI' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'parrot'] },
    text: `Kaşif dalıp çıktı ve gagasında parlayan bir şeyle güverteye kondu. Bırakmadan önce bir balık istiyor gibi.`,
    options: [
      { label: 'Bir balık ver', icon: 'gift', req: { cargoGood: 'GOOD_FISH' },
        win: [
          { w: 60, text: `Gagasındaki eski bir altın yüzüktü!`, fx: { cargoRemove: 'GOOD_FISH', cargoRemoveQty: 1, goldR: 55 } },
          { w: 40, text: `Batık bir geminin işlemeli düğmesi. Bir koleksiyoncu iyi para verir.`, fx: { cargoRemove: 'GOOD_FISH', cargoRemoveQty: 1, cargoAdd: { good: 'GOOD_ANTIQUE', qty: 1 } } },
        ] },
      { label: 'Başını okşa', icon: 'heart',
        win: [
          { w: 55, text: `Kaşif hediyeyi önüne bıraktı: birkaç parlak bozukluk.`, fx: { goldR: 15 } },
          { w: 45, text: `Kaşif hediyesini geri aldı ve denize uçtu. Akşam yine geldi; gururu kırılmıştı ama affetti.`, fx: { xp: 5 } },
        ] },
    ] }),
  P({ id: 'EVT_PET2_KAPLUMBAGA_SHELL', title: 'Kabuktaki Çizikler', tags: ['pet'], cond: { pet: 'PET_KAPLUMBAGA' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView'] },
    text: `Bilge güneşlenirken yosunları kurudu; kabuğunda kazınmış eski bir harita belirdi. Kim, ne zaman kazıdı?`,
    options: [
      { label: 'Haritayı kopyala', icon: 'chart',
        win: { text: `Çizikler önündeki akıntıları ve bir sığlığı gösteriyordu.`, fx: { reveal: 2, xpExplore: 10 } } },
      { label: 'Kabuğunu temizle', icon: 'heart',
        win: { text: `Bilge gözlerini kısıp keyifle uzandı. Tayfa yaşlı kaplumbağanın uğur getirdiğine inanıyor.`, fx: { luckBuff: { add: 10, events: 1 } } } },
    ] }),
  P({ id: 'EVT_PET2_GELINCIK_TUNNEL', title: 'Fındık Kayboldu', tags: ['pet'], cond: { pet: 'PET_GELINCIK' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView'] },
    text: `Fındık sandıkların arasına dalıp saatlerdir çıkmadı. Ambarın dibinden tırmalama sesleri geliyor.`,
    options: [
      { label: 'Peşinden git', icon: 'eye',
        win: [
          { w: 45, text: `Gemi kurulduğundan beri kimsenin bilmediği gizli bir bölme! İçinde eski bir kese.`, fx: { goldR: 45, xp: 5 } },
          { w: 30, text: `Fındık bir fare yuvasını dağıtmış. Çürümeye başlayan çuvalları erkenden ayırdınız.`, fx: { fixSpoiled: true, xp: 5 } },
          { w: 25, text: `Fındık… Hamid'in tespihini, Pita'nın kaşığını ve senin eldivenini bir köşeye istiflemiş.`, fx: { xp: 5 } },
        ] },
      { label: 'Kendisi gelir', icon: 'anchor',
        win: { text: `Akşam Fındık ağzında birkaç bozuklukla geri döndü ve hemen uyudu.`, fx: { goldR: 12 } } },
    ] }),
  P({ id: 'EVT_PET2_AHTAPOT_LADLE', title: 'Kepçe Hırsızı', tags: ['pet'], cond: { pet: 'PET_AHTAPOT' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView'] },
    text: `Mürekkep fıçısından çıkmış, aşçının kepçesini kapıp güvertede sekiz kolla kaçıyor. Ardında mürekkep izleri var.`,
    options: [
      { label: 'Kepçeyi geri al', icon: 'hand', chance: 60,
        win: { text: `Kepçeyi geri aldınız. Mürekkep bir süre fıçısında küs bekledi.`, fx: { xp: 5 } },
        lose: { text: `Mürekkep bir bulut püskürttü; güverte ve iki çuval kapkara oldu.`, fx: { cargoSpoil: 1 } } },
      { label: 'Fıçıya balık at', icon: 'gift', req: { cargoGood: 'GOOD_FISH' },
        win: { text: `Balığı görünce kepçeyi bırakıp fıçısına döndü. Aşçı bile güldü.`, fx: { cargoRemove: 'GOOD_FISH', cargoRemoveQty: 1, xp: 5, luckBuff: { add: 5, events: 1 } } } },
      { label: 'Oyununa izin ver', icon: 'heart',
        win: { text: `Mürekkep kepçeyle fıçıda dibe dalıp çıktı; dipte biriken birkaç sikke güverteye saçıldı.`, fx: { goldR: 18 } } },
    ] }),
];
