// 7.4 Hazineler ve ganimet fırsatları — 12 olay
import { o, par, spawn, prop, rm, mv, run, set, tw, say, think, wait, pose, face, shake, flash, sfx, weather, fx, txt, coins, give, open, st, hit, lunge, fall, flee, fade, appear, glow, emote, proj, jump, scroll, cam, call, auto, spin, dark, quake, heroDraw, heroBack, pay, gain, heroTo, heroHurt, strike } from '../../engine/choreo.js';

export default [
  {
    id: 'EV_T01', t: 'Yol Kenarındaki İpek Kesesi', cat: 'treasure', reg: [1, 2, 3, 4, 5], tags: ['pouch'],
    txt: 'Çimenlerin arasında altın işlemeli ipek bir kese parlıyor. Ağır görünüyor. Etrafta kimse yok... ya da öyle görünüyor.',
    setup: [prop('pu', 'pouch', 14, -150, { silk: 1 }), prop('bu', 'bush', 40, -165)],
    intro: [par(fx('sparkle', 'pu', 6), sfx('chime'))],
    opts: [
      { k: 'take', l: 'Keseyi al', ic: 'hand', chance: 70, win: { t: 'Kese gerçekten altın doluydu! Bugün şanslı günün.', fx: { gold: [30, 50] } }, lose: { t: 'Keseye eğildiğinde çalılardan bir yankesici fırladı ve kendi keseni kaptı! Tuzakmış.', fx: { goldPct: -0.2 } } },
      { k: 'wait', l: 'Önce etrafı gözle', ic: 'eye', chk: { s: 'agi', dc: 9 }, win: { t: 'Çalılarda saklanan yankesiciyi gördün. Kaçarken keseyi de bıraktı.', fx: { gold: [25, 40], xp: 6 } }, lose: { t: 'Etrafı gözlerken bir karga keseyi kaptı ve uçtu!', fx: {} } },
      { k: 'leave', l: 'Sahibine bırak', ic: 'holy', win: { t: 'Keseyi bir taşın üstüne, görünür bir yere koydun. Kendini iyi hissettin.', fx: { xp: 6, buff: { luck: 10, legs: 2 } } } },
    ],
    act: {
      take: [heroTo(10, -46, 0.8), pose('hero', 'kneel'), wait(0.4)],
      wait: [think('hero', 'Bu kadar kolay olamaz...'), face('hero', 'right'), wait(0.6)],
      leave: [heroTo(10, -46, 0.8), pose('hero', 'kneel'), mv('pu', 0, -54, 0.4), pose('hero', 'idle')],
    },
    out: {
      'take.win': [pose('hero', 'idle'), rm('pu'), auto(), heroBack()],
      'take.lose': [spawn('pp', 'bandit', 40, -60, { look: { hat: 'hood', color: '#4a3a2a' } }), run('pp', 16, -46, 0.3), par(coins('hero', 'pp', 4), pose('hero', 'idle')), par(flee('pp', 'right'), rm('pu')), emote('hero', '💢'), heroBack()],
      'wait.win': [spawn('pp', 'bandit', 40, -60, { look: { hat: 'hood', color: '#4a3a2a' } }), say('hero', 'Çalının arkasındaki, çık oradan!'), flee('pp', 'right'), heroTo(10, -46, 0.6), rm('pu'), auto(), heroBack()],
      'wait.lose': [spawn('cr', 'crow', -60, -100, { fly: 1 }), mv('cr', 14, -50, 0.6, { fly: 1 }), rm('pu'), flee('cr', 'up', { fly: 1 }), emote('hero', '💢')],
      'leave.win': [par(glow('hero', '#ffe27a'), fx('light', 'hero', 6)), glow('hero', null, 0), heroBack()],
    },
  },
  {
    id: 'EV_T02', t: 'Kilitli Demir Sandık', cat: 'treasure', reg: [1, 2, 3, 4, 5], tags: ['chest', 'lock'],
    txt: 'Yolun ortasında, sanki bir arabadan düşmüş gibi duran demir kuşaklı ağır bir sandık. Üç kilidi var.',
    setup: [prop('ch', 'chestIron', 0, -150)],
    intro: [think('hero', 'Üç kilit... içinde ne olabilir?')],
    opts: [
      { k: 'pick', l: 'Maymuncukla aç', ic: 'pick', req: { item: 'C_LOCKPICK' }, consume: 'C_LOCKPICK', win: { t: 'Kilitler bir bir açıldı. Sandık hazineyle doluydu!', fx: { gold: [35, 55], loot: 'rare', xp: 10 } } },
      { k: 'smash', l: 'Silahınla kır', ic: 'axe', chk: { s: 'atk', dc: 14 }, win: { t: 'Kilitler parçalandı. İçinde değerli eşyalar vardı.', fx: { gold: [25, 40], loot: 'any', xp: 8 } }, lose: { t: 'Silahın sekti ve elin uyuştu. Sandık kımıldamadı bile.', fx: { hp: -6 } } },
      { k: 'carry', l: 'Sandığı kasabaya taşı', ic: 'hand', win: { t: 'Sandığı sırtına aldın. Ağırdı; ama bir sonraki kasabada çilingir onu senin için açacak.', fx: { hp: -8, gold: [30, 45], xp: 5 } } },
    ],
    act: {
      pick: [heroTo(0, -38, 0.8), pose('hero', 'kneel'), give('hero', 'ch', 'c_pick'), par(sfx('click'), wait(0.4)), par(sfx('click'), wait(0.4)), sfx('click')],
      smash: [heroTo(0, -32, 0.8), heroDraw(), par(strike('ch'), sfx('metal'), fx('spark', 'ch', 10)), par(strike('ch'), sfx('metal'), fx('spark', 'ch', 10))],
      carry: [heroTo(0, -38, 0.8), set('ch', { alpha: 0 }), set('hero', { carry: 'chest' }), par(emote('hero', '💧'), heroTo(0, -60, 1.2))],
    },
    out: {
      'pick.win': [pose('hero', 'idle'), open('ch'), par(fx('sparkle', 'ch', 16), sfx('chest')), auto(), heroBack()],
      'smash.win': [open('ch', 'broken'), par(fx('sparkle', 'ch', 12), sfx('chest')), auto(), pose('hero', 'idle'), heroBack()],
      'smash.lose': [par(emote('hero', '💢'), heroHurt(0)), pose('hero', 'idle'), heroBack()],
      'carry.win': [auto(), set('hero', { carry: null }), heroBack()],
    },
  },
  {
    id: 'EV_T03', t: 'Kırık Heykelin Hazinesi', cat: 'treasure', reg: [2, 3, 4, 5], tags: ['statue'],
    txt: 'Kafası düşmüş bir kral heykeli. Boynundaki oyukta bir şey parlıyor. Yere düşmüş kafa ise sanki sana bakıp gülümsüyor.',
    setup: [prop('stt', 'statueBroken', -20, -170), prop('hd', 'statueHead', 10, -150)],
    intro: [par(fx('sparkle', { x: -20, y: -78 }, 6)), think('hero', 'Boynunda bir şey var.')],
    opts: [
      { k: 'climb', l: 'Heykele tırman', ic: 'boot', chk: { s: 'agi', dc: 10 }, win: { t: 'Oyuktan eski bir kraliyet sikkesi kesesi çıkardın.', fx: { gold: [30, 45], xp: 8 } }, lose: { t: 'Heykelin kolu kırıldı ve seninle birlikte yere düştü.', fx: { hp: -10 } } },
      { k: 'head', l: 'Kafayı yerine koy', ic: 'hand', chk: { s: 'atk', dc: 12 }, win: { t: 'Kafayı kaldırıp boyna yerleştirdin. Heykelin gözleri parladı ve kaidesindeki bir çekmece açıldı!', fx: { loot: 'rare', xp: 12 } }, lose: { t: 'Kafa çok ağırdı; ayağına düştü.', fx: { hp: -8 } } },
      { k: 'pass', l: 'Kralı rahat bırak', ic: 'boot', tags: ['pass'], win: { t: 'Heykel hâlâ gülümsüyordu.', fx: {} } },
    ],
    act: {
      climb: [heroTo(-14, -50, 0.8), set('hero', { climb: 1 }), mv('hero', -18, -70, 1.0)],
      head: [heroTo(6, -44, 0.6), set('hd', { alpha: 0 }), set('hero', { carry: 'head' }), heroTo(-14, -54, 1.0)],
      pass: [heroTo(20, -40, 0.8)],
    },
    out: {
      'pass.win': [say('hd', '...', 1), emote('hd', '♪')],
      'climb.win': [set('hero', { climb: 0 }), auto(), heroBack()],
      'climb.lose': [par(sfx('crumble'), fx('stone', 'hero', 12)), set('hero', { climb: 0 }), tw('hero', { y: -44 }, 0.3), heroHurt(2), heroBack()],
      'head.win': [set('hero', { carry: null }), st('stt', 'whole'), par(glow('stt', '#ffe27a'), sfx('rune')), prop('dr', 'chest', -20, -50), open('dr'), auto(), glow('stt', null, 0), heroBack()],
      'head.lose': [set('hero', { carry: null }), set('hd', { alpha: 1 }), heroHurt(1), heroBack()],
    },
  },
  {
    id: 'EV_T04', t: 'Vadideki Kayıp Kalkan', cat: 'treasure', reg: [2, 3], tags: ['shield'],
    txt: 'Yamaçtan aşağıda, bir derenin kenarında güneşte parlayan bir kalkan görüyorsun. Üzerinde bilinmeyen bir şövalye arması var.',
    setup: [prop('sh', 'shield', -50, -150, { glint: 1 }), prop('dr', 'stream', -60, -160)],
    intro: [par(fx('sparkle', 'sh', 8), sfx('chime'))],
    opts: [
      { k: 'fetch', l: 'Yamaçtan in ve al', ic: 'boot', chk: { s: 'agi', dc: 9 }, win: { t: 'Kalkanı aldın. Sağlam bir parça; armasını tanıyan biri iyi para verir. Ama önce senin işine yarar.', fx: { perm: { def: 1 }, gold: [10, 20], xp: 6 } }, lose: { t: 'Yamaçtan yuvarlandın ama kalkanı yine de aldın.', fx: { hp: -9, perm: { def: 1 } } } },
      { k: 'arms', l: 'Armayı incele', ic: 'eye', chk: { s: 'talk', dc: 10 }, win: { t: 'Bu Kayıp Şövalye Aldric\'in arması! Kalkanın iç cebinde eski bir mektup var.', fx: { xp: 8, gold: [15, 25], flag: 'aldricShield' } }, lose: { t: 'Armayı tanıyamadın.', fx: {} } },
    ],
    act: {
      fetch: [heroTo(-30, -30, 0.8), jump('hero', 6), heroTo(-46, -44, 0.6), set('sh', { alpha: 0 }), set('hero', { carry: 'shield' })],
      arms: [heroTo(-40, -40, 1), pose('hero', 'kneel'), wait(0.6)],
    },
    out: {
      'fetch.win': [set('hero', { carry: null }), give('sh', 'hero', 'shield'), auto(), heroBack()],
      'fetch.lose': [par(tw('hero', { x: -50, y: -40 }, 0.4), fx('dust', 'hero', 12)), heroHurt(2), set('hero', { carry: null }), heroBack()],
      'arms.win': [pose('hero', 'idle'), give('sh', 'hero', 'letter'), auto(), heroBack()],
      'arms.lose': [pose('hero', 'idle'), heroBack()],
    },
  },
  {
    id: 'EV_T05', t: 'Mantarların Altındaki Kasa', cat: 'treasure', reg: [1, 2, 4], lanes: { forest: 1.5, wild: 1.3 }, tags: ['mushroom'],
    txt: 'Dev mantarlardan oluşmuş bir halka. Ortadaki toprak kabarmış; altında demir bir kasanın kapağı görünüyor. Mantarlar hafifçe parlıyor.',
    setup: [prop('m1', 'mushroomBig', -24, -150), prop('m2', 'mushroomBig', 24, -152), prop('m3', 'mushroomBig', 0, -175), prop('sf', 'safe', 0, -158, { buried: 1 })],
    intro: [par(fx('spore', { x: 0, y: -48 }, 10), sfx('hum'))],
    opts: [
      { k: 'dig', l: 'Kasayı kaz', ic: 'hand', chance: 60, win: { t: 'Kasanın içinde eski bir simyacının iksirleri ve altını vardı!', fx: { gold: [20, 30], item: ['C_POTION_L', 'C_FIRE', 'C_CHARM'], xp: 8 } }, lose: { t: 'Mantarlar spor püskürttü; başın döndü ve kendine geldiğinde saatler geçmişti.', fx: { hp: -8, buff: { agi: -2, legs: 1 } } } },
      { k: 'cut', l: 'Önce mantarları kes', ic: 'axe', req: { opens: 'chop' }, win: { t: 'Mantarları keserek halkayı bozdun; kasayı güvenle açtın.', fx: { gold: [25, 35], item: ['C_POTION', 'C_HERB'], xp: 8 } } },
      { k: 'pick', l: 'Parlayan mantarları topla', ic: 'herb', win: { t: 'Parlak mantarlar şifacıların aradığı türdendi.', fx: { item: 'C_HERB', gold: [5, 10] } } },
    ],
    act: {
      dig: [heroTo(0, -40, 0.8), pose('hero', 'dig'), par(fx('dust', 'sf', 12), sfx('dig'))],
      cut: [heroTo(-14, -42, 0.6), par(strike('m1'), fx('spore', 'm1', 8), rm('m1')), heroTo(14, -42, 0.5), par(strike('m2'), fx('spore', 'm2', 8), rm('m2')), heroTo(0, -40, 0.4), pose('hero', 'dig')],
      pick: [heroTo(-14, -42, 0.6), pose('hero', 'kneel'), fx('sparkle', 'm1', 6), pose('hero', 'idle')],
    },
    out: {
      'dig.win': [pose('hero', 'idle'), set('sf', { buried: 0 }), open('sf'), auto(), heroBack()],
      'dig.lose': [par(fx('spore', 'hero', 30), sfx('poof')), pose('hero', 'down'), dark(0.4, 0.4), wait(0.8), dark(0, 0.6), pose('hero', 'idle'), heroBack()],
      'cut.win': [pose('hero', 'idle'), set('sf', { buried: 0 }), open('sf'), auto(), heroBack()],
      'pick.win': [auto(), heroBack()],
    },
  },
  {
    id: 'EV_T06', t: 'Terk Edilmiş Savaş Zırhı', cat: 'treasure', reg: [2, 3, 4], tags: ['armor'],
    txt: 'Bir ağaca dayanmış, eksiksiz bir zırh takımı. Sanki sahibi onu çıkarıp gitmiş. Göğüs plakasında küçük bir delik var.',
    setup: [prop('ar', 'armorStand', 24, -160), prop('tr', 'tree', 40, -180)],
    intro: [think('hero', 'Sahibine ne oldu acaba?')],
    opts: [
      { k: 'take', l: 'Zırhı al', ic: 'shield', win: { t: 'Zırhı söküp çantaya yerleştirdin. Ağır ama sağlam.', fx: { loot: 'armor', xp: 5 } } },
      { k: 'search', l: 'Etrafta sahibini ara', ic: 'eye', chance: 50, win: { t: 'Ağacın arkasında yaralı bir şövalye buldun. Onu iyileştirince zırhını sana hediye etti.', fx: { loot: 'armor', xp: 12, lose: 'cons' } }, lose: { t: 'Hiç kimse yoktu. Döndüğünde zırh da gitmişti!', fx: {} } },
    ],
    act: {
      take: [heroTo(18, -50, 0.8), set('ar', { empty: 1 }), give('ar', 'hero', 'a_heavy')],
      search: [heroTo(46, -80, 1), set('hero', { alpha: 0.5 }), wait(0.8)],
    },
    out: {
      'take.win': [auto(), heroBack()],
      'search.win': [set('hero', { alpha: 1 }), spawn('kn', 'knight', 46, -84, { pose: 'sit' }), give('hero', 'kn', 'c_potion'), par(fx('heal', 'kn', 10), pose('kn', 'idle')), say('kn', 'Hayatımı borçluyum. Zırhım senin olsun.'), set('ar', { empty: 1 }), auto(), heroBack()],
      'search.lose': [set('hero', { alpha: 1 }), set('ar', { alpha: 0 }), emote('hero', '?'), heroBack()],
    },
  },
  {
    id: 'EV_T07', t: 'Yıpranmış Hazine Haritası', cat: 'treasure', reg: [1, 2, 3, 4, 5], tags: ['map'],
    txt: 'Rüzgâr ayaklarının dibine yıpranmış bir parşömen getirdi. Bir hazine haritası! Çarpı işareti... tam da bu tepenin ardını gösteriyor.',
    setup: [prop('hl', 'hill', 50, -170)],
    appr: [scroll(80, 2), par(prop('mp', 'scroll', -40, -30), tw('mp', { x: -4, y: -10 }, 1.2), sfx('wind'), fx('leaf', { x: -30, y: -20 }, 8))],
    intro: [pose('hero', 'kneel'), set('mp', { alpha: 0 }), give('mp', 'hero', 'q_map'), pose('hero', 'idle'), think('hero', 'Çarpı... tepenin ardında!')],
    opts: [
      { k: 'follow', l: 'Haritayı takip et', ic: 'map', chance: 65, win: { t: 'Tepenin ardında, bir ağacın dibinde gömülü sandığı buldun!', fx: { gold: [30, 50], loot: 'any', xp: 10 } }, lose: { t: 'Çarpının olduğu yer çoktan kazılmıştı. Birisi senden önce davranmış.', fx: { xp: 3 } } },
      { k: 'keep', l: 'Haritayı sakla', ic: 'scroll', win: { t: 'Haritayı katlayıp sakladın; daha uygun bir zamanda kullanırsın.', fx: { item: 'Q_MAP' } } },
    ],
    act: {
      follow: [heroTo(40, -60, 1.2), heroTo(56, -100, 1), pose('hero', 'dig'), par(fx('dust', 'hero', 16), sfx('dig'))],
      keep: [say('hero', 'Bunu sonra kullanırım.')],
    },
    out: {
      'follow.win': [pose('hero', 'idle'), prop('ch', 'chest', 56, -110), open('ch'), auto(), heroBack()],
      'follow.lose': [pose('hero', 'idle'), prop('hole', 'hole', 56, -110), think('hero', 'Boş. Elbette.'), heroBack()],
      'keep.win': [],
    },
  },
  {
    id: 'EV_T08', t: 'Şans Getiren Yüzük', cat: 'treasure', reg: [1, 2, 3, 4, 5], tags: ['ring'],
    txt: 'Bir kuyu kenarında, taşın arasına sıkışmış bir yüzük. Üzerindeki taş yonca şeklinde. Tam o anda bir kara kedi önünden geçti.',
    setup: [prop('wl', 'well', -24, -160), prop('rg', 'ring', -10, -150)],
    appr: [scroll(110, 2.4), spawn('cat', 'cat', 60, -30, { dir: 'left' }), run('cat', -70, -30, 1.4), rm('cat')],
    intro: [par(fx('sparkle', 'rg', 6), sfx('chime')), think('hero', 'Kara kedi... yonca yüzük... hangisi kazanır?')],
    opts: [
      { k: 'wear', l: 'Yüzüğü tak', ic: 'ring', chance: 50, win: { t: 'Yüzük parmağına tam oturdu ve hafifçe ısındı. Şans seninle!', fx: { item: 'X_RING' } }, lose: { t: 'Yüzük parmağında sıkıştı ve kararmaya başladı. Kara kedinin laneti mi? Çıkarana kadar parmağın morardı.', fx: { hp: -5, buff: { luck: -10, legs: 2 } } } },
      { k: 'sell', l: 'Yüzüğü satmak için sakla', ic: 'coin', win: { t: 'Yüzüğü kesene attın; bir kuyumcu iyi para verir.', fx: { gold: [25, 40] } } },
    ],
    act: {
      wear: [heroTo(-6, -44, 0.6), pose('hero', 'kneel'), set('rg', { alpha: 0 }), pose('hero', 'idle'), think('hero', 'Bakalım...')],
      sell: [heroTo(-6, -44, 0.6), pose('hero', 'kneel'), set('rg', { alpha: 0 }), pose('hero', 'idle')],
    },
    out: {
      'wear.win': [par(glow('hero', '#7aff9a'), fx('sparkle', 'hero', 14), sfx('chime')), glow('hero', null, 0), heroBack()],
      'wear.lose': [par(glow('hero', '#6a2a6a'), fx('curse', 'hero', 10)), heroHurt(0), glow('hero', null, 0), say({ x: 60, y: -40 }, 'Miyav.'), heroBack()],
      'sell.win': [auto(), heroBack()],
    },
  },
  {
    id: 'EV_T09', t: 'Deri Torbadaki İksirler', cat: 'treasure', reg: [1, 2, 3, 4, 5], tags: ['potion'],
    txt: 'Bir ağaç dalına asılı deri bir torba. İçinden renk renk şişelerin şıngırtısı geliyor. Torbanın üstünde "Simyacı Morven — dokunma!" yazıyor.',
    setup: [prop('tr', 'tree', 30, -170), prop('bag', 'satchel', 22, -158, { hang: 1 })],
    intro: [par(sfx('clink'), fx('sparkle', 'bag', 4))],
    opts: [
      { k: 'take', l: 'Torbayı al', ic: 'hand', win: { t: 'Torbada üç şişe vardı. Etiketsiz olanlardan birini denemek riskli ama ikisi tanıdık.', fx: { item: ['C_POTION', 'C_POTION'], xp: 3 } } },
      { k: 'taste', l: 'Etiketsiz şişeyi iç', ic: 'potion', chance: 50, win: { t: 'Kalbin güçlü çarptı; vücudun kalıcı olarak güçlendi!', fx: { perm: { maxHp: 6 }, hpPct: 0.3, xp: 6 } }, lose: { t: 'Dilin mor oldu ve bir süre tavuk gibi gıdakladın. Pek de iyi hissetmiyorsun.', fx: { hp: -10 } } },
      { k: 'leave', l: 'Simyacıya saygı göster', ic: 'holy', win: { t: 'Torbayı bıraktın. Az sonra simyacı Morven koşarak geldi ve dürüstlüğüne bir iksir ile karşılık verdi.', fx: { item: 'C_POTION_L', xp: 6 } } },
    ],
    act: {
      take: [heroTo(18, -48, 0.7), set('bag', { alpha: 0 }), give('bag', 'hero', 'c_potion')],
      taste: [heroTo(18, -48, 0.7), set('bag', { alpha: 0 }), give('bag', 'hero', 'c_potion'), pose('hero', 'drink'), sfx('gulp'), wait(0.6)],
      leave: [heroTo(-10, -40, 0.7), spawn('mv', 'wizard', -70, -50, { dir: 'right', look: { color: '#6a3a8a' } }), run('mv', -24, -44, 1), say('mv', 'Torbam! Dokunmadın mı? Ne dürüst bir yolcu!')],
    },
    out: {
      'take.win': [auto(), heroBack()],
      'taste.win': [pose('hero', 'idle'), par(glow('hero', '#ff6a6a'), fx('heal', 'hero', 20), sfx('heal')), glow('hero', null, 0), heroBack()],
      'taste.lose': [pose('hero', 'idle'), par(tw('hero', { tint: '#9a5ac8' }, 0.3), say('hero', 'Gıdak! Gıdak!')), heroHurt(1), tw('hero', { tint: null }, 0.3), heroBack()],
      'leave.win': [give('mv', 'hero', 'c_potionL'), set('bag', { alpha: 0 }), flee('mv', 'left'), heroBack()],
    },
  },
  {
    id: 'EV_T10', t: 'Toprağa Gömülü Kraliyet Mührü', cat: 'treasure', reg: [3, 4, 5], lanes: { royal: 1.6 }, tags: ['seal', 'royal'], cond: { notItem: 'Q_SEAL' },
    txt: 'Yağmurun açtığı bir yarıkta toprağa gömülü altın bir şey parlıyor: üzerinde taç ve kartal olan bir mühür! Yanında yarı çürümüş bir haberci çantası.',
    setup: [prop('sl', 'seal', -14, -150, { buried: 1 }), prop('bg', 'satchel', 10, -155)],
    intro: [par(fx('sparkle', 'sl', 8), sfx('chime')), think('hero', 'Bu... gerçek bir kraliyet mührü mü?')],
    opts: [
      { k: 'keep', l: 'Mührü al', ic: 'crown', win: { t: 'Mührü temizleyip sakladın. Kraliyet kapıları bu mühürle açılabilir.', fx: { item: 'Q_SEAL', xp: 8 } } },
      { k: 'satchel', l: 'Çantayı incele', ic: 'eye', win: { t: 'Çantada habercinin son mektubu ve ödülü vardı. Mührü de aldın.', fx: { item: 'Q_SEAL', gold: [15, 25], xp: 10 } } },
    ],
    act: {
      keep: [heroTo(-10, -44, 0.6), pose('hero', 'dig'), par(fx('dust', 'sl', 8)), set('sl', { buried: 0, alpha: 0 }), give('sl', 'hero', 'q_seal')],
      satchel: [heroTo(4, -44, 0.6), pose('hero', 'kneel'), give('bg', 'hero', 'letter'), heroTo(-10, -44, 0.4), set('sl', { alpha: 0 }), give('sl', 'hero', 'q_seal')],
    },
    out: {
      'keep.win': [pose('hero', 'idle'), par(glow('hero', '#ffd76a'), fx('sparkle', 'hero', 10)), glow('hero', null, 0), heroBack()],
      'satchel.win': [pose('hero', 'idle'), auto(), heroBack()],
    },
  },
  {
    id: 'EV_T11', t: 'Kayıp Kervan Ganimeti', cat: 'treasure', reg: [2, 3, 4], lanes: { trade: 1.4 }, tags: ['wreck', 'loot'],
    txt: 'Yolun hemen dışında haydutların alelacele sakladığı bir ganimet yığını: dallarla örtülmüş sandıklar ve çuvallar. Yakınlarda taze ayak izleri var.',
    setup: [prop('br', 'brushPile', 30, -160), prop('c1', 'crate', 26, -158), prop('c2', 'sack', 40, -162)],
    intro: [think('hero', 'Haydutlar her an dönebilir...')],
    opts: [
      { k: 'quick', l: 'Hızlıca birkaç şey al', ic: 'hand', win: { t: 'Bir çuval ve küçük bir sandığı kaptın ve uzaklaştın.', fx: { gold: [20, 30], loot: 'cons' } } },
      { k: 'all', l: 'Hepsini taşımaya çalış', ic: 'bag', chance: 45, win: { t: 'Haydutlar dönmedi! Bütün ganimeti aldın.', fx: { gold: [45, 70], loot: 'any', xp: 6 } }, lose: { t: 'Tam yüklenirken haydutlar döndü! Kavga etmek zorunda kaldın.', fx: { hp: -10, gold: [15, 20] } } },
      { k: 'report', l: 'Kasaba muhafızlarına bildir', ic: 'crown', win: { t: 'Ganimeti yerini işaretleyip bıraktın. Kasabada muhafızlar ödül verecek.', fx: { gold: [25, 35], xp: 8 } } },
    ],
    act: {
      quick: [heroTo(20, -50, 0.7), rm('c1'), set('hero', { carry: 'crate' }), heroTo(-10, -60, 0.6)],
      all: [heroTo(20, -50, 0.7), rm('c1'), rm('c2'), set('hero', { carry: 'pile' }), par(emote('hero', '💧'), heroTo(0, -56, 1.2))],
      report: [heroTo(20, -50, 0.7), prop('mk', 'marker', 14, -56), heroBack()],
    },
    out: {
      'quick.win': [set('hero', { carry: null }), auto(), heroBack()],
      'all.win': [set('hero', { carry: null }), auto(), heroBack()],
      'all.lose': [spawn('b1', 'bandit', 60, -70, { dir: 'left' }), run('b1', 14, -56, 0.5), par(say('b1', 'Hırsız!'), set('hero', { carry: null })), par(strike('b1'), lunge('b1', 'hero')), heroHurt(1), flee('b1', 'right'), auto(), heroBack()],
      'report.win': [],
    },
  },
  {
    id: 'EV_T12', t: 'Uçurum Kenarındaki Kolye', cat: 'treasure', reg: [2, 3, 5], lanes: { mountain: 1.6 }, tags: ['necklace', 'cliff'],
    txt: 'Uçurumun kenarındaki bir çıkıntıda, bir dala takılmış zümrüt bir kolye sallanıyor. Rüzgâr giderek sertleşiyor.',
    setup: [prop('cl', 'cliffEdge', -40, -160), prop('nk', 'necklace', -54, -150, { hang: 1 })],
    intro: [par(fx('sparkle', 'nk', 6), sfx('wind'))],
    opts: [
      { k: 'reach', l: 'Uzanıp al', ic: 'hand', chk: { s: 'agi', dc: 11 }, win: { t: 'Parmak uçlarınla kolyeyi yakaladın. Zümrüt güneşte parladı.', fx: { gold: [35, 55], xp: 8 } }, lose: { t: 'Ayağının altındaki taş kaydı! Son anda tutundun ama kolye boşluğa düştü.', fx: { hp: -12 } } },
      { k: 'spear', l: 'Mızrakla çek', ic: 'spear', req: { wfam: 'spear' }, win: { t: 'Mızrağının ucuyla kolyeyi güvenle çektin.', fx: { gold: [35, 55], xp: 8 } } },
      { k: 'leave', l: 'Rüzgâr çok sert', ic: 'boot', tags: ['pass'], win: { t: 'Hiçbir mücevher hayatına değmez.', fx: {} } },
    ],
    act: {
      reach: [heroTo(-34, -46, 0.8), pose('hero', 'reach'), par(sfx('wind'), fx('leaf', 'hero', 6)), wait(0.6)],
      spear: [heroTo(-30, -46, 0.8), pose('hero', 'reach'), wait(0.5), tw('nk', { x: -34, y: -48 }, 0.6), set('nk', { alpha: 0 })],
      leave: [heroTo(10, -40, 0.8)],
    },
    out: {
      'leave.win': [par(sfx('wind'), tw('nk', { y: 40, alpha: 0 }, 1.6)), think('hero', 'Rüzgâr onu aldı. Hayatım daha değerli.')],
      'reach.win': [pose('hero', 'idle'), set('nk', { alpha: 0 }), give('nk', 'hero', 'necklace'), auto(), heroBack()],
      'reach.lose': [par(fx('stone', 'hero', 10), sfx('crumble'), shake(3, 0.3)), heroHurt(2), tw('nk', { y: 40, alpha: 0 }, 0.8), pose('hero', 'idle'), heroBack()],
      'spear.win': [pose('hero', 'idle'), give('nk', 'hero', 'necklace'), auto(), heroBack()],
    },
  },
];
