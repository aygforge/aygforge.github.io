// 7.8 Absürt ve eğlenceli olaylar — 8 olay
import { o, par, spawn, prop, rm, mv, run, set, tw, say, think, wait, pose, face, shake, flash, sfx, weather, fx, txt, coins, give, open, st, hit, lunge, fall, flee, fade, appear, glow, emote, proj, jump, scroll, cam, call, auto, spin, dark, quake, heroDraw, heroBack, pay, gain, heroTo, heroHurt, strike } from '../../engine/choreo.js';

export default [
  {
    id: 'EV_A01', t: 'Vergi Toplayan Kaz', cat: 'absurd', reg: [1, 2, 3, 5], tags: ['goose', 'tax'],
    txt: 'Boynuna küçük bir kese bağlanmış beyaz bir kaz yolu kesti. Kanatlarını açtı ve tıslayarak gagasıyla keseyi gösterdi. Kesenin üstünde "KAZ VERGİSİ" yazıyor.',
    setup: [spawn('gs', 'goose', 0, -150, { pouch: 1 }), prop('sg', 'sign', -30, -165, { text: 'KAZ VERGİSİ' })],
    intro: [par(pose('gs', 'wings'), sfx('honk')), say('gs', 'HONK!', 0.8), say('gs', 'HOOOONK!', 0.8)],
    opts: [
      { k: 'pay', l: 'Vergiyi öde (2 altın)', ic: 'coin', cost: { gold: 2 }, win: { t: 'Keseye iki altın attın. Kaz onaylarcasına başını salladı ve kenara çekildi. Ne kadar resmî bir kaz.', fx: { xp: 3 } } },
      { k: 'refuse', l: 'Kaza boyun eğme', ic: 'shield', chk: { s: 'def', dc: 10 }, win: { t: 'Kazın gagası zırhından sekti. Saygıyla geri çekildi ve keseyi sana bıraktı: önceki "vergi mükellefleri"nin altınları!', fx: { gold: [12, 22], xp: 5 } }, lose: { t: 'Kaz seni bir kilometre kovaladı. Baldırların morardı.', fx: { hp: -6 } } },
      { k: 'bread', l: 'Kaza ekmek ver', ic: 'bread', chance: 70, win: { t: 'Kaz ekmeği yedi ve seni yeni bir dost olarak kabul etti. Bir süre arkandan "honk" diyerek yürüdü.', fx: { xp: 4, buff: { luck: 5, legs: 2 } } }, lose: { t: 'Kaz ekmeği yedi... ve yine de vergiyi istedi. Ödedin.', fx: { gold: -2 } } },
    ],
    act: {
      pay: [heroTo(0, -34, 0.6), pose('hero', 'kneel'), pay('gs', 2), pose('hero', 'idle'), par(pose('gs', 'idle'), emote('gs', '✓'))],
      refuse: [pose('hero', 'guard'), par(run('gs', 0, -14, 0.3), sfx('honk')), par(lunge('gs', 'hero'), sfx('clang'))],
      bread: [pose('hero', 'kneel'), proj('hero', 'gs', 'bread', 0.4), par(pose('gs', 'eat'), sfx('munch')), pose('hero', 'idle')],
    },
    out: {
      'pay.win': [mv('gs', -26, -56, 0.8), say('gs', 'honk.', 0.8)],
      'refuse.win': [par(pose('gs', 'idle'), mv('gs', 0, -46, 0.4), emote('gs', '!')), give('gs', 'hero', 'bag'), auto(), say('gs', 'honk...'), flee('gs', 'left')],
      'refuse.lose': [par(run('hero', 30, 30, 0.6), run('gs', 26, 20, 0.6), sfx('honk')), heroHurt(1), par(run('hero', -20, -20, 0.6), run('gs', -16, -10, 0.6)), flee('gs', 'left'), heroBack()],
      'bread.win': [par(emote('gs', '♥'), sfx('honk')), set('gs', { follow: 1 }), heroTo(0, -50, 1), flee('gs', 'left')],
      'bread.lose': [say('gs', 'HONK.'), pay('gs', 2), mv('gs', -26, -56, 0.8)],
    },
  },
  {
    id: 'EV_A02', t: 'Dünyanın En Tehlikeli Tavşanı', cat: 'absurd', reg: [1, 2, 3, 4, 5], tags: ['rabbit', 'beast'],
    txt: 'Yolun kenarında bir yığın kırık kalkan, paslı kılıç ve kaçarken düşürülmüş miğfer. Ortalarında küçük, beyaz, sevimli bir tavşan havuç kemiriyor. Bir tabela: "KAÇIN!!!"',
    setup: [prop('pile', 'armorPile', -20, -160), prop('sg', 'sign', 30, -160, { text: 'KAÇIN!!!' }), spawn('rb', 'rabbit', 0, -150, { tint: '#ffffff', eyes: 'red' })],
    intro: [par(sfx('munch')), think('hero', 'Bu mu? Bu minik şey mi?'), par(set('rb', { eyes: 'glow' }), emote('rb', '💢'))],
    opts: [
      { k: 'fight', l: 'Savaş (ne olabilir ki?)', ic: 'sword', fight: { foes: [['rb', 'B_RABBIT']] }, win: { t: 'Tavşanla destansı bir savaş verdin. Sonunda havucunu bırakıp kaçtı. Kalkan yığınından istediğini alabilirsin.', fx: { xp: 12, loot: 'armor', gold: [10, 20] } }, lose: { t: 'Bir tavşan tarafından yenildin. Bunu kimseye anlatma.' } },
      { k: 'carrot', l: 'Ona bir havuç daha ver', ic: 'bread', win: { t: 'Tavşan havucu aldı, burnunu kıpırdattı ve seni geçirdi. Belki de tüm sorun açlıkmış.', fx: { xp: 6 } } },
      { k: 'run', l: 'Tabelaya uy: KAÇ!', ic: 'boot', chk: { s: 'agi', dc: 13 }, win: { t: 'Arkana bakmadan koştun. Tavşanın tısladığını duydun.', fx: { xp: 3 } }, lose: { t: 'Tavşan seni yakaladı. Ne olduğunu tam hatırlamıyorsun ama her yerin ısırık izi.', fx: { hp: -16 } } },
    ],
    act: {
      fight: [heroDraw(), say('hero', 'Gel bakalım, ufaklık.'), par(jump('rb', 10), sfx('hiss'))],
      carrot: [pose('hero', 'kneel'), proj('hero', 'rb', 'carrot', 0.4), par(sfx('munch'), set('rb', { eyes: 'red' }), emote('rb', '♥')), pose('hero', 'idle')],
      run: [say('hero', 'Aaaah!', 0.6), run('hero', -40, -20, 0.4)],
    },
    out: {
      'fight.win': [heroTo(-14, -50, 0.6), auto(), heroBack()],
      'carrot.win': [mv('rb', 30, -50, 0.6), heroTo(-10, -60, 0.8)],
      'run.win': [run('hero', -30, -110, 0.6)],
      'run.lose': [par(run('rb', -38, -16, 0.2), sfx('hiss')), par(shake(3, 0.6), fx('dust', 'hero', 20), heroHurt(3)), mv('rb', 0, -50, 0.6), heroBack()],
    },
  },
  {
    id: 'EV_A03', t: 'Kendi Kendine Konuşan Zırh', cat: 'absurd', reg: [1, 2, 3, 4, 5], tags: ['armor', 'talk'],
    txt: 'Yolun kenarında boş bir zırh takımı oturmuş, miğferinin vizörü açılıp kapanarak konuşuyor: "...ve sonra ben dedim ki, ejderha olsa ne yazar! Ha, merhaba! Sen kimsin?"',
    setup: [spawn('ar', 'livingArmor', -18, -158, { pose: 'sit', dir: 'down' })],
    intro: [say('ar', 'Yüz yıldır burada oturuyorum. Sahibim tuvalete gitti ve hiç dönmedi.', 2), say('ar', 'Beni giymek ister misin? Çok iyi bir zırhım!', 1.8)],
    opts: [
      { k: 'wear', l: 'Zırhı dene', ic: 'shield', chance: 55, win: { t: 'Zırh tam üstüne oturdu ve neşeyle şakımaya başladı. Biraz geveze ama inanılmaz sağlam!', fx: { item: 'A_MED_2', xp: 6 } }, lose: { t: 'Zırh seni bir saat boyunca "eski güzel günler" hikâyeleriyle sıktı ve sonra üstünden atladı. Kulakların çınlıyor.', fx: { hp: -3, xp: 4 } } },
      { k: 'talk', l: 'Hikâyelerini dinle', ic: 'ear', win: { t: 'Zırh, sahibinin hazinesini nereye gömdüğünü anlattı (dördüncü kez). Bu sefer dikkatli dinledin!', fx: { gold: [20, 35], xp: 6 } } },
      { k: 'help', l: 'Sahibini aramasına yardım et', ic: 'eye', win: { t: 'Biraz ileride bir taşın üstünde paslı bir miğfer bulduk: "Sahibim değil ama... kardeş!" Zırh duygulandı ve sana bir kalkan yadigârı verdi.', fx: { perm: { def: 1 }, xp: 8 } } },
    ],
    act: {
      wear: [heroTo(-10, -44, 0.6), say('ar', 'Kollarını kaldır! Şimdi bacak!'), par(set('ar', { alpha: 0 }), set('hero', { armorTalk: 1 }), sfx('metal'))],
      talk: [pose('hero', 'sit'), say('ar', '...ve hazineyi üçüncü meşenin altına gömdü!', 2), pose('hero', 'idle'), heroTo(40, -80, 1.2), pose('hero', 'dig'), fx('dust', 'hero', 12)],
      help: [heroTo(30, -90, 1), prop('hm', 'helmet', 36, -100), say('hero', 'Bu mu?'), mv('ar', 24, -84, 1.2)],
    },
    out: {
      'wear.win': [say('hero', 'Vay, gerçekten sağlam!'), say('hero', '(Zırh: Ve sonra ejderha...)', 1.6), set('hero', { armorTalk: 0 }), heroBack()],
      'wear.lose': [say('hero', '(Zırh: ...ve kral bana dedi ki...)', 1.6), par(set('hero', { armorTalk: 0 }), set('ar', { alpha: 1, x: -30, y: -40 }), sfx('metal')), say('ar', 'Sen beni hak etmiyorsun!'), heroBack()],
      'talk.win': [pose('hero', 'idle'), auto(), heroBack()],
      'help.win': [say('ar', 'Kardeş!!'), give('ar', 'hero', 'shield'), heroBack()],
    },
  },
  {
    id: 'EV_A04', t: 'Uyuyan Nöbetçi', cat: 'absurd', reg: [1, 2, 3, 4, 5], lanes: { royal: 1.3 }, tags: ['guard', 'sleep'],
    txt: 'Bir kapı nöbetçisi mızrağına yaslanmış, ayakta horlayarak uyuyor. Horlaması o kadar güçlü ki miğferi zıplıyor. Yanında bir anahtar halkası sallanıyor.',
    setup: [prop('gt', 'gatehouse', 0, -175), spawn('gd', 'soldier', -16, -160, { pose: 'sleepStand' })],
    intro: [par(emote('gd', 'zzz', 1.6), sfx('snore')), par(jump('gd', 2), sfx('snore'))],
    opts: [
      { k: 'sneak', l: 'Sessizce geç', ic: 'boot', chk: { s: 'agi', dc: 9 }, win: { t: 'Parmak uçlarında geçtin; nöbetçi uykusunda "beş dakika daha anne" diye mırıldandı.', fx: { xp: 4 } }, lose: { t: 'Bir tahta gıcırdadı ve nöbetçi uyandı: "UYUMUYORDUM!" Geçiş harcını ödedin.', fx: { gold: -10 } } },
      { k: 'keys', l: 'Anahtarları al', ic: 'hand', chance: 50, win: { t: 'Anahtarlar kulenin deposunu açtı: birkaç kraliyet erzakı senin oldu. Nöbetçi hâlâ horluyor.', fx: { item: ['C_POTION', 'C_BANDAGE'], gold: [10, 15] } }, lose: { t: 'Anahtarlar şıngırdadı. Nöbetçi uyandı ve seni ceza defterine yazdı.', fx: { gold: -18 } } },
      { k: 'wake', l: 'Onu uyandır (iyilik yap)', ic: 'talk', win: { t: 'Nöbetçiyi uyandırıp komutan geldiğini fısıldadın. Hemen dikildi. Komutan gelince nöbetçi övüldü; sana gizlice teşekkür edip bir kese verdi.', fx: { gold: [12, 20], xp: 6 } } },
    ],
    act: {
      sneak: [heroTo(14, -44, 1.0, { crouch: 1 }), heroTo(10, -90, 1.0, { crouch: 1 })],
      keys: [heroTo(-6, -44, 0.8, { crouch: 1 }), pose('hero', 'reach'), sfx('jingle'), wait(0.4)],
      wake: [heroTo(-6, -44, 0.6), say('hero', 'Psst! Komutan geliyor!'), par(pose('gd', 'idle'), jump('gd', 6), emote('gd', '!')), say('gd', 'UYUMUYORDUM!')],
    },
    out: {
      'sneak.win': [say('gd', '...beş dakika daha anne...', 1.6)],
      'sneak.lose': [par(sfx('creak'), pose('gd', 'idle'), jump('gd', 6)), say('gd', 'UYUMUYORDUM! Harç!'), pay('gd', 4), heroBack()],
      'keys.win': [pose('hero', 'idle'), give('gd', 'hero', 'key'), st('gt', 'open'), auto(), heroBack()],
      'keys.lose': [pose('hero', 'idle'), par(pose('gd', 'idle'), emote('gd', '💢')), say('gd', 'Hırsız! Ceza!'), pay('gd', 5), heroBack()],
      'wake.win': [spawn('cm', 'officer', 0, -80), say('cm', 'Aferin nöbetçi, uyanık ve dikkatli!'), rm('cm'), coins('gd', 'hero', 4), sfx('coins'), heroBack()],
    },
  },
  {
    id: 'EV_A05', t: 'Ters Yön Gösteren Tabela', cat: 'absurd', reg: [1, 2, 3, 4, 5], tags: ['sign', 'shortcut'],
    txt: 'Bir yol tabelası: "Kasaba ←" Ama ok sağı gösteriyor. Altında başka bir tabela: "Üstteki tabela yalan söylüyor." Onun da altında: "İkisi de yalan söylüyor."',
    setup: [prop('sg', 'signStack', 0, -155)],
    intro: [think('hero', 'Bu... bir mantık bilmecesi mi?'), par(spin('sg', 0.1, 0.4), sfx('creak'))],
    opts: [
      { k: 'left', l: 'Sola git', ic: 'map', chance: 50, win: { t: 'Sol yol bir kısayolmuş! Tabelayı kim diktiyse çok komik biri.', fx: { skipNext: 1, xp: 6 } }, lose: { t: 'Sol yol bir çıkmaz sokakmış. Geri döndün.', fx: { hp: -3, extra: 1 } } },
      { k: 'think', l: 'Mantıkla çöz', ic: 'scroll', chk: { s: 'talk', dc: 11 }, win: { t: 'Üç tabelanın birbirini çürüttüğünü fark ettin: demek ki doğru yol ortada! Ve gerçekten de ortada bir patika vardı, üstelik birinin sakladığı bir keseyle.', fx: { skipNext: 1, gold: [10, 20], xp: 8 } }, lose: { t: 'Kafan karıştı ve bir süre tabelaya bakakaldın.', fx: {} } },
      { k: 'fix', l: 'Tabelayı düzelt', ic: 'hand', win: { t: 'Tabelayı doğru yöne çevirdin. Arkandan gelen yolcular sana minnettar olacak (umarım).', fx: { xp: 5, buff: { luck: 5, legs: 2 } } } },
    ],
    act: {
      left: [heroTo(-46, -50, 1.2)],
      think: [think('hero', 'Eğer üstteki yalansa... ve alttaki de...', 1.8), think('hero', 'Demek ki... ORTA!')],
      fix: [heroTo(0, -44, 0.6), par(spin('sg', 0.5, 0.6), sfx('creak'))],
    },
    out: {
      'left.win': [heroTo(-30, -110, 0.8)],
      'left.lose': [prop('wall', 'deadEnd', -50, -80), think('hero', 'Elbette.'), heroBack()],
      'think.win': [heroTo(0, -80, 1), prop('bg', 'pouch', 4, -86), auto(), rm('bg'), heroTo(0, -110, 0.6)],
      'think.lose': [emote('hero', '?'), wait(0.8)],
      'fix.win': [say('sg', '"Kasaba →" (artık doğru)', 1.4), heroBack()],
    },
  },
  {
    id: 'EV_A06', t: 'Şarkı Söyleyen Eşek', cat: 'absurd', reg: [1, 2, 3, 5], lanes: { trade: 1.4 }, tags: ['donkey', 'music'],
    txt: 'Yolun ortasında bir eşek, gözlerini kapamış, şaşırtıcı derecede güzel bir sesle aria söylüyor. Sahibi yanında elinde şapkasıyla para topluyor.',
    setup: [spawn('dk', 'donkey', -6, -155, { dir: 'down' }), spawn('ow', 'farmer', 20, -158, { prop: 'hat' })],
    intro: [par(pose('dk', 'sing'), sfx('aria'), fx('note', 'dk', 12)), say('dk', '♪ Laaaa-ii-aaa ♪', 1.6)],
    opts: [
      { k: 'tip', l: 'Şapkaya altın at', ic: 'coin', cost: { gold: 4 }, win: { t: 'Eşek senin için özel bir şarkı söyledi. Ruhun öyle hafifledi ki yolun daha kısa geldi.', fx: { hpPct: 0.15, buff: { def: 1, legs: 2 }, xp: 3 } } },
      { k: 'duet', l: 'Düet yap', ic: 'note', chk: { s: 'talk', dc: 11 }, win: { t: 'Sen ve eşek mükemmel bir düet yaptınız! Kalabalık toplandı ve şapka doldu; sahibi kazancı seninle paylaştı.', fx: { gold: [20, 35], xp: 8 } }, lose: { t: 'Eşek sesinin kötü olduğunu düşünüp sana tekme attı.', fx: { hp: -7 } } },
      { k: 'buy', l: 'Eşeği satın almayı teklif et', ic: 'bag', chance: 20, win: { t: 'Sahibi gülerek kabul etmedi ama eşeğin plaklarından... yani ezgilerinden birini öğretti. Ve bir kese.', fx: { gold: [10, 15], xp: 5 } }, lose: { t: '"Eşeğim satılık değil!" Sahibi seni şapkasıyla dövdü.', fx: { hp: -2 } } },
    ],
    act: {
      tip: [heroTo(14, -44, 0.6), pay('ow', 2), par(pose('dk', 'sing'), sfx('aria'), fx('note', 'dk', 16)), say('dk', '♪ Gezgiiin kahramaaan ♪', 1.8)],
      duet: [heroTo(-20, -44, 0.6), par(say('hero', '♪ Laaa ♪', 1), say('dk', '♪ Iiiaaa ♪', 1), fx('note', 'hero', 10), fx('note', 'dk', 10), sfx('aria'))],
      buy: [heroTo(14, -44, 0.6), say('hero', 'Bu eşek kaç para?')],
    },
    out: {
      'tip.win': [par(fx('heal', 'hero', 10), sfx('heal')), heroBack()],
      'duet.win': [spawn('c1', 'villager', -60, -30, { dir: 'right' }), spawn('c2', 'villagerF', 60, -30, { dir: 'left' }), par(sfx('cheer'), jump('c1', 4), jump('c2', 4), coins('c1', 'ow', 3), coins('c2', 'ow', 3)), coins('ow', 'hero', 6), par(flee('c1', 'left'), flee('c2', 'right')), heroBack()],
      'duet.lose': [par(lunge('dk', 'hero'), sfx('bray')), heroHurt(1), heroBack()],
      'buy.win': [say('ow', 'Hahaha! Satılık değil ama al bakalım.'), coins('ow', 'hero', 4), heroBack()],
      'buy.lose': [say('ow', 'Satılık değil!'), lunge('ow', 'hero'), heroHurt(0), heroBack()],
    },
  },
  {
    id: 'EV_A07', t: 'Tava Taşıyan Şövalye', cat: 'absurd', reg: [1, 2, 3, 4, 5], tags: ['knight', 'duel'],
    txt: 'Tencere miğferli, tava kalkanlı, kepçe kılıçlı bir "şövalye" yolu kesti. "Ben Sör Tencere! Bu yoldan geçmek isteyen benimle düello etmeli!"',
    setup: [spawn('sk', 'potKnight', 0, -158, { dir: 'down' })],
    intro: [par(pose('sk', 'pose'), sfx('pan')), say('sk', 'Hazır ol, yabancı! Tavam acımasızdır!', 1.6)],
    opts: [
      { k: 'duel', l: 'Düelloyu kabul et', ic: 'sword', chk: { s: 'atk', dc: 8 }, win: { t: 'Kepçesini havaya uçurdun. Sör Tencere diz çöktü: "Sen gerçek bir şövalyesin!" Ve sana en değerli hazinesini verdi: büyükannesinin yahni tarifiyle birlikte bir iksir.', fx: { item: 'C_POTION', xp: 6 } }, lose: { t: 'Tava kafana "DONGG" diye indi. Kulakların hâlâ çınlıyor.', fx: { hp: -5, xp: 3 } } },
      { k: 'yield', l: 'Teslim ol', ic: 'flag', win: { t: '"Merhametliyim!" dedi Sör Tencere ve seni zafer çorbasına davet etti.', fx: { hpPct: 0.2, xp: 2 } } },
      { k: 'knight', l: 'Onu şövalye ilan et', ic: 'crown', chk: { s: 'talk', dc: 9 }, win: { t: 'Kılıcını omzuna dokundurdun: "Seni Sör Tencere, Mutfakların Koruyucusu ilan ediyorum!" Gözyaşlarıyla sana bütün birikimini verdi.', fx: { gold: [15, 25], xp: 8 } }, lose: { t: '"Sen bir kral değilsin!" diye bağırdı ve kepçesiyle başına vurdu.', fx: { hp: -3 } } },
    ],
    act: {
      duel: [heroDraw(), par(lunge('hero', 'sk'), lunge('sk', 'hero'), sfx('pan'))],
      yield: [pose('hero', 'kneel'), say('hero', 'Teslim oluyorum, Sör Tencere.')],
      knight: [pose('hero', 'ready'), heroTo(0, -38, 0.6), par(pose('sk', 'kneel'), sfx('draw')), say('hero', 'Seni Mutfakların Koruyucusu ilan ediyorum!', 1.6)],
    },
    out: {
      'duel.win': [par(proj('sk', { x: 60, y: -120 }, 'ladle', 0.6), sfx('pan')), pose('sk', 'kneel'), say('sk', 'Sen gerçek bir şövalyesin!'), give('sk', 'hero', 'c_potion'), heroBack()],
      'duel.lose': [par(lunge('sk', 'hero'), sfx('gong'), shake(2, 0.3)), par(emote('hero', '✸'), heroHurt(0)), heroBack()],
      'yield.win': [pose('hero', 'idle'), prop('pot', 'cauldron', 20, -40), say('sk', 'Zafer çorbası!'), par(fx('heal', 'hero', 12), sfx('heal')), heroBack()],
      'knight.win': [say('sk', 'Bu... bu en güzel günüm!'), coins('sk', 'hero', 6), sfx('coins'), flee('sk', 'down'), heroBack()],
      'knight.lose': [pose('sk', 'idle'), say('sk', 'Sen kral değilsin!'), lunge('sk', 'hero'), heroHurt(0), heroBack()],
    },
  },
  {
    id: 'EV_A08', t: 'Sahte Ejderha Gösterisi', cat: 'absurd', reg: [1, 2, 3, 5], lanes: { trade: 1.3 }, tags: ['dragon', 'show', 'scam'],
    txt: 'Kocaman yeşil bir "ejderha" ağaçların arasından başını uzattı ve bir çatırtıyla sendeledi. Kumaş bacaklarının altından iki çift çizme görünüyor. "ROOOAAR! Altınını ver yoksa... seni yakarım!"',
    setup: [spawn('dr', 'dragonPuppet', 0, -160)],
    appr: [scroll(110, 2.4), par(sfx('roar'), shake(1, 0.3), jump('dr', 4))],
    intro: [say('dr', 'ROOOAAR! Altınını ver!', 1.4), say({ x: 10, y: -40 }, '(fısıltı: Daha korkunç ol, Ahmet!)', 1.4)],
    opts: [
      { k: 'play', l: 'Korkmuş numarası yap', ic: 'talk', win: { t: '"Ahh! Ejderha! Al bütün altınımı!" dedin ve bir altın attın. Kostümün içindeki iki çocuk o kadar sevindi ki sana yaptıkları tahta kılıcı hediye ettiler... ve annelerinin pastasını.', fx: { gold: -1, hpPct: 0.2, xp: 6 } } },
      { k: 'pull', l: 'Kostümü çek', ic: 'hand', win: { t: 'Kostümü çektin: iki utanmış köylü genci! Özür dilediler ve gösteriyle kazandıkları paranın bir kısmını sana verdiler.', fx: { gold: [8, 15], xp: 4 } } },
      { k: 'fight', l: '"Ejderha"yla savaş', ic: 'sword', chk: { s: 'agi', dc: 8 }, win: { t: 'Kılıcın düz tarafıyla kuyruğa vurdun; ejderha ikiye ayrıldı ve iki genç çığlık atarak kaçtı. Geride bir sepet elma kaldı.', fx: { hpPct: 0.1, gold: [5, 10], xp: 5 } }, lose: { t: 'Kuyruğa takılıp düştün. Ejderha da seninle birlikte devrildi. Herkes güldü.', fx: { hp: -3, xp: 4 } } },
    ],
    act: {
      play: [par(pose('hero', 'cower'), say('hero', 'Ahh! Ejderha! Al altınımı!')), proj('hero', 'dr', 'coin', 0.4), par(jump('dr', 6), sfx('cheer'))],
      pull: [heroTo(4, -40, 0.6), pose('hero', 'pull'), par(st('dr', 'unmasked'), sfx('rip'))],
      fight: [heroDraw(), run('hero', 6, -38, 0.3), strike('dr')],
    },
    out: {
      'play.win': [pose('hero', 'idle'), st('dr', 'unmasked'), spawn('k1', 'child', -6, -52), spawn('k2', 'child', 10, -52, { look: { color: '#3a6a9a' } }), say('k1', 'Korktu! Gerçekten korktu!'), give('k2', 'hero', 'bread'), par(flee('k1', 'left'), flee('k2', 'right')), heroBack()],
      'pull.win': [pose('hero', 'idle'), spawn('k1', 'villager', -6, -52), spawn('k2', 'villager', 10, -52), say('k1', 'Özür dileriz efendim!'), coins('k1', 'hero', 4), sfx('coins'), par(flee('k1', 'left'), flee('k2', 'right')), heroBack()],
      'fight.win': [st('dr', 'split'), par(sfx('rip'), fx('cloth', 'dr', 14)), spawn('k1', 'villager', -10, -52), spawn('k2', 'villager', 14, -52), par(flee('k1', 'left'), flee('k2', 'right')), prop('ap', 'basket', 0, -50), auto(), heroBack()],
      'fight.lose': [par(pose('hero', 'down'), tw('dr', { rot: 0.8 }, 0.4), sfx('crash')), say({ x: 10, y: -40 }, 'Hahaha!'), pose('hero', 'idle'), heroBack()],
    },
  },
];
