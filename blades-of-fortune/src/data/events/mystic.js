// 7.7 Gizemli ve fantastik karşılaşmalar — 8 olay
import { o, par, spawn, prop, rm, mv, run, set, tw, say, think, wait, pose, face, shake, flash, sfx, weather, fx, txt, coins, give, open, st, hit, lunge, fall, flee, fade, appear, glow, emote, proj, jump, scroll, cam, call, auto, spin, dark, quake, heroDraw, heroBack, pay, gain, heroTo, heroHurt, strike } from '../../engine/choreo.js';

export default [
  {
    id: 'EV_M01', t: 'Yolun Ortasındaki Işık Küresi', cat: 'mystic', reg: [1, 2, 3, 4, 5], tags: ['orb', 'magic'],
    txt: 'Yolun tam ortasında, yerden bir karış yukarıda süzülen mavi bir ışık küresi. Uğulduyor ve sen yaklaştıkça rengi değişiyor.',
    setup: [spawn('orb', 'orb', 0, -150, { color: '#7ac8ff' })],
    intro: [par(sfx('hum'), fx('magic', 'orb', 8)), set('orb', { color: '#ffd27a' })],
    opts: [
      { k: 'touch', l: 'Küreye dokun', ic: 'hand', chance: 55, bonus: [{ opens: 'mystic', add: 25 }], win: { t: 'Küre parmak uçlarından içine aktı. Damarların ışıkla doldu: kalıcı olarak daha güçlüsün!', fx: { perm: { atk: 1 }, xp: 10 } }, lose: { t: 'Küre patladı ve seni bir şimşek gibi çarptı.', fx: { hp: -14 } } },
      { k: 'capture', l: 'Bir şişeye hapset', ic: 'potion', chance: 60, win: { t: 'Küreyi boş bir iksir şişesine çektin. Şişe sıcacık parlıyor; bir şifacı buna servet öder.', fx: { item: 'C_POTION_L', gold: [10, 20], xp: 6 } }, lose: { t: 'Küre şişeyi parçaladı ve uçup gitti.', fx: { hp: -4 } } },
      { k: 'around', l: 'Etrafından dolan', ic: 'boot', tags: ['pass'], win: { t: 'Küre seni gözüyle (?) takip etti ama sen uzaklaştın.', fx: {} } },
    ],
    act: {
      touch: [heroTo(0, -38, 0.8), pose('hero', 'reach'), par(glow('hero', '#ffd27a'), sfx('zap'))],
      capture: [heroTo(0, -38, 0.8), pose('hero', 'reach'), give('hero', 'orb', 'c_potion')],
      around: [heroTo(-30, -40, 0.8), mv('orb', -10, -50, 0.8), heroTo(-30, -90, 0.8)],
    },
    out: {
      'touch.win': [pose('hero', 'idle'), par(tw('orb', { x: 0, y: -12, alpha: 0, scale: 0.2 }, 0.8), fx('magic', 'hero', 24), sfx('chime')), glow('hero', null, 0), heroBack()],
      'touch.lose': [par(flash('#bfe0ff', 0.2), fx('spark', 'hero', 20), sfx('thunder'), tw('orb', { alpha: 0, scale: 2 }, 0.3)), heroHurt(3), glow('hero', null, 0), pose('hero', 'idle'), heroBack()],
      'capture.win': [pose('hero', 'idle'), tw('orb', { x: 0, y: -14, scale: 0.2, alpha: 0 }, 0.6), give({ x: 0, y: -14 }, 'hero', 'c_potionL'), auto(), heroBack()],
      'capture.lose': [par(sfx('glass'), fx('glass', 'hero', 10), flee('orb', 'up', { fly: 1 })), heroHurt(0), pose('hero', 'idle'), heroBack()],
      'around.win': [tw('orb', { alpha: 0 }, 1)],
    },
  },
  {
    id: 'EV_M02', t: 'Konuşan Ağaç', cat: 'mystic', reg: [1, 2], lanes: { forest: 1.6 }, tags: ['tree', 'talk'],
    txt: 'Yaşlı bir ağacın gövdesinde bir yüz belirdi: kabuk gözler, yosun sakal. "Hmmm... uzun zamandır kimse benimle konuşmadı, küçük yürüyen şey."',
    setup: [prop('tree', 'talkingTree', -30, -170)],
    intro: [par(st('tree', 'awake'), sfx('creak'), fx('leaf', 'tree', 8)), say('tree', 'Bana bir hikâye anlat... ya da bir bilmeceyi bil...', 2)],
    opts: [
      { k: 'riddle', l: 'Bilmecesini dinle', ic: 'scroll', chk: { s: 'talk', dc: 11 }, win: { t: '"Kökleri görünmez, ağaçtan yüksek..." — "Dağ!" Ağaç gürültüyle güldü ve dallarından altın yapraklar döktü.', fx: { gold: [25, 40], xp: 10 } }, lose: { t: 'Cevabını bilemedin. Ağaç hayal kırıklığıyla bir meşe palamudunu kafana bıraktı.', fx: { hp: -3 } } },
      { k: 'story', l: 'Ona bir hikâye anlat', ic: 'talk', win: { t: 'Ağaç hikâyeni dinlerken uykuya daldı. Kökleri arasından sana şifalı bir özsu sızdırdı.', fx: { hpPct: 0.3, xp: 6 } } },
      { k: 'water', l: 'Köklerini sula', ic: 'water', win: { t: 'Matarandaki suyu köklerine döktün. Ağaç minnetle titredi ve bir dalını sana uzattı: içinde bir tılsım vardı.', fx: { item: 'C_CHARM', xp: 6 } } },
    ],
    act: {
      riddle: [say('tree', 'Kökleri görünmez, ağaçtan yüksek; ne büyür ne ölür...', 2.2), think('hero', 'Hmm...'), say('hero', 'Dağ!')],
      story: [pose('hero', 'sit'), say('hero', 'Bir zamanlar küçük bir köyde...'), wait(0.6), par(st('tree', 'sleep'), emote('tree', 'zzz', 1.6))],
      water: [heroTo(-20, -60, 0.8), pose('hero', 'pour'), par(fx('water', 'tree', 10), sfx('pour')), pose('hero', 'idle')],
    },
    out: {
      'riddle.win': [say('tree', 'HOHOHO! Doğru!'), par(fx('goldleaf', 'tree', 20), sfx('coins')), auto(), heroBack()],
      'riddle.lose': [say('tree', 'Hmmm... yanlış.'), proj('tree', 'hero', 'nut', 0.4), heroHurt(0), heroBack()],
      'story.win': [pose('hero', 'idle'), par(fx('heal', 'hero', 14), sfx('heal')), heroBack()],
      'water.win': [say('tree', 'Ahhh... teşekkürler, yürüyen şey.'), give('tree', 'hero', 'c_charm'), heroBack()],
    },
  },
  {
    id: 'EV_M03', t: 'Fısıldayan Taş', cat: 'mystic', reg: [2, 3, 4], tags: ['stone', 'curse'],
    txt: 'Üzerinde silinmiş yazılar olan siyah bir dikili taş. Yaklaştıkça adını fısıldıyor: senin adını. "Bana dokun... sırlarımı vereyim..."',
    setup: [prop('ws', 'standingStone', 20, -160, { dark: 1 })],
    appr: [dark(0.2, 0.8), scroll(110, 2.4), par(sfx('whisper'), fx('mist', 'ws', 8))],
    intro: [say('ws', 'Gel... gel...', 1.6)],
    opts: [
      { k: 'touch', l: 'Taşa dokun', ic: 'hand', chance: 45, bonus: [{ item: 'C_CHARM', add: 30 }], win: { t: 'Taş zihnine eski bir savaş tekniği aktardı. Gözlerin bir an kara parladı.', fx: { perm: { agi: 1 }, xp: 12 } }, lose: { t: 'Taş gücünden bir parçanı emdi. Bitkin düştün.', fx: { hp: -10, perm: { maxHp: -3 } } } },
      { k: 'charm', l: 'Tılsımla sesini sustur', ic: 'charm', req: { item: 'C_CHARM' }, consume: 'C_CHARM', win: { t: 'Tılsım taşa değince fısıltılar çığlığa dönüştü ve sustu. Taşın dibinde adakların bıraktığı altınlar parladı.', fx: { gold: [30, 50], xp: 10 } } },
      { k: 'leave', l: 'Kulaklarını kapat ve geç', ic: 'boot', chk: { s: 'def', dc: 9 }, win: { t: 'Fısıltılara direndin ve yürüdün.', fx: { xp: 4 } }, lose: { t: 'Fısıltılar kafanda yankılandı; başın ağrıyor.', fx: { hp: -6 } } },
    ],
    act: {
      touch: [heroTo(14, -46, 0.8), pose('hero', 'reach'), par(glow('ws', '#6a2aff'), sfx('whisper'))],
      charm: [heroTo(14, -46, 0.8), give('hero', 'ws', 'c_charm'), par(flash('#ffffff', 0.2), sfx('shatter'), fx('light', 'ws', 18))],
      leave: [pose('hero', 'cover'), heroTo(-20, -80, 1.6), pose('hero', 'idle')],
    },
    out: {
      'touch.win': [par(fx('magic', 'hero', 18), glow('hero', '#6a2aff')), glow('ws', null, 0), glow('hero', null, 0), pose('hero', 'idle'), dark(0, 0.8), heroBack()],
      'touch.lose': [par(fx('curse', 'hero', 18), heroHurt(2)), glow('ws', null, 0), pose('hero', 'idle'), dark(0, 0.8), heroBack()],
      'charm.win': [set('ws', { dark: 0 }), prop('gl', 'sparkle', 20, -46), auto(), rm('gl'), dark(0, 0.8), heroBack()],
      'leave.win': [dark(0, 0.8)],
      'leave.lose': [par(fx('curse', 'hero', 8), heroHurt(1)), dark(0, 0.8)],
    },
  },
  {
    id: 'EV_M04', t: 'Gizemli Büyücü', cat: 'mystic', reg: [1, 2, 3, 4, 5], tags: ['wizard', 'magic'],
    txt: 'Yolun üzerinde bir duman bulutu patladı ve içinden yıldızlı cübbeli bir büyücü çıktı. Asası parlıyor. "Aha! Kader seni bana getirdi, savaşçı. Bir dileğini yerine getireceğim... bedeli karşılığında."',
    setup: [spawn('wz', 'wizard', 0, -150, { alpha: 0 })],
    appr: [scroll(100, 2.2), par(fx('smoke', { x: 0, y: -50 }, 30), sfx('poof'), flash('#c8a8ff', 0.15)), par(appear('wz', 0.4), glow('wz', '#c8a8ff'))],
    intro: [par(pose('wz', 'cast'), fx('magic', 'wz', 10), sfx('chime')), say('wz', 'Güç mü, servet mi, yoksa bilgi mi?', 1.8)],
    opts: [
      { k: 'power', l: 'Güç (25 altın)', ic: 'sword', cost: { gold: 25 }, win: { t: 'Büyücü asasıyla silahına dokundu. Silahın bir süre büyülü bir ışıkla parlayacak.', fx: { buff: { atk: 4, legs: 3 } } } },
      { k: 'wealth', l: 'Servet (şansını dene)', ic: 'coin', chance: 40, win: { t: 'Büyücü parmaklarını şıklattı ve keseni altınla doldurdu!', fx: { gold: [40, 70] } }, lose: { t: 'Büyücü şıklattı... ve keseni kurbağaya çevirdi. Kurbağa zıplayıp kaçtı, içindeki altınların bir kısmıyla.', fx: { goldPct: -0.2 } } },
      { k: 'knowledge', l: 'Bilgi (sonraki yolları göster)', ic: 'eye', win: { t: 'Büyücü gözlerine dokundu: bir süre rotaların gerçek tehlikesini görebileceksin.', fx: { sight: 3, xp: 6 } } },
    ],
    act: {
      power: [pay('wz', 5), par(pose('wz', 'cast'), proj('wz', 'hero', 'magic', 0.5), sfx('zap'))],
      wealth: [par(pose('wz', 'cast'), sfx('snap'), fx('sparkle', 'hero', 10))],
      knowledge: [par(pose('wz', 'cast'), proj('wz', 'hero', 'magic', 0.5)), par(glow('hero', '#c8a8ff'), sfx('chime'))],
    },
    out: {
      'power.win': [par(glow('hero', '#9ad8ff'), fx('magic', 'hero', 16)), glow('hero', null, 0), par(fx('smoke', 'wz', 30), sfx('poof'), fade('wz', 0, 0.3))],
      'wealth.win': [coins('wz', 'hero', 10), sfx('coins'), par(fx('smoke', 'wz', 30), sfx('poof'), fade('wz', 0, 0.3))],
      'wealth.lose': [spawn('fr', 'frog', 0, -10), say('fr', 'Vrak!'), par(flee('fr', 'right'), coins('hero', { x: 60, y: 0 }, 3)), say('wz', 'Hıhı... olur böyle.'), par(fx('smoke', 'wz', 30), sfx('poof'), fade('wz', 0, 0.3))],
      'knowledge.win': [glow('hero', null, 0), par(fx('smoke', 'wz', 30), sfx('poof'), fade('wz', 0, 0.3))],
    },
  },
  {
    id: 'EV_M05', t: 'Gece Çalan Çan', cat: 'mystic', reg: [2, 4], tags: ['bell', 'night', 'undead'], cond: { night: 1 },
    txt: 'Gece yarısı. Yolun kenarında, hiçbir kuleye bağlı olmayan bronz bir çan kendi kendine çalmaya başladı. Her vuruşta etraftaki gölgeler uzuyor.',
    setup: [prop('bell', 'bell', 20, -160)],
    appr: [dark(0.55, 0.8), scroll(110, 2.4), par(spin('bell', 0.15, 0.6), sfx('bell'), fx('ring', 'bell', 6))],
    intro: [par(sfx('bell'), spin('bell', 0.15, 0.6)), think('hero', 'Bu çan... kimi çağırıyor?')],
    opts: [
      { k: 'silence', l: 'Çanı sustur', ic: 'hand', chk: { s: 'atk', dc: 12 }, win: { t: 'Çanın dilini tuttun. Gölgeler geri çekildi; çanın içinde eski bir mühür parlıyordu.', fx: { gold: [20, 35], xp: 10 } }, lose: { t: 'Çan son bir kez çaldı; gölgelerden bir el göğsüne dokundu ve buz gibi bir acı hissettin.', fx: { hp: -12 } } },
      { k: 'ring', l: 'Sen de çal', ic: 'note', chance: 40, win: { t: 'Çanı üç kez çaldın. Gölgeler eğildi: ölüler senin selamını kabul etti ve bir hediye bıraktı.', fx: { loot: 'acc', xp: 12 } }, lose: { t: 'Çaldın ve iki hayalet yerden yükseldi!', fx: { hp: -10 } } },
      { k: 'run', l: 'Sesten uzaklaş', ic: 'boot', tags: ['pass'], win: { t: 'Çan sesleri arkanda kaybolana kadar yürüdün.', fx: {} } },
    ],
    act: {
      silence: [heroTo(14, -50, 0.7), pose('hero', 'reach'), par(shake(2, 0.6), sfx('bell'))],
      ring: [heroTo(14, -50, 0.7), par(spin('bell', 0.3, 0.4), sfx('bell')), par(spin('bell', 0.3, 0.4), sfx('bell')), par(spin('bell', 0.3, 0.4), sfx('bell'))],
      run: [heroTo(-20, -60, 1.0)],
    },
    out: {
      'silence.win': [pose('hero', 'idle'), dark(0.2, 0.8), prop('gl', 'sparkle', 20, -58), auto(), rm('gl'), heroBack()],
      'silence.lose': [spawn('sh', 'ghost', 40, -60, { alpha: 0 }), appear('sh', 0.3), lunge('sh', 'hero'), heroHurt(2), fade('sh'), pose('hero', 'idle'), dark(0.2, 0.8), heroBack()],
      'ring.win': [spawn('sh', 'ghost', 40, -50, { alpha: 0 }), tw('sh', { alpha: 0.6 }, 0.6), pose('sh', 'bow'), give('sh', 'hero', 'ring'), fade('sh'), dark(0.2, 0.8), heroBack()],
      'ring.lose': [spawn('g1', 'ghost', 40, -60, { alpha: 0 }), spawn('g2', 'ghost', -10, -60, { alpha: 0 }), par(appear('g1', 0.3), appear('g2', 0.3)), par(lunge('g1', 'hero'), lunge('g2', 'hero')), heroHurt(2), par(fade('g1'), fade('g2')), dark(0.2, 0.8), heroBack()],
      'run.win': [dark(0.2, 0.8)],
    },
  },
  {
    id: 'EV_M06', t: 'Yol Kenarındaki Kehanet', cat: 'mystic', reg: [1, 2, 3, 4, 5], tags: ['fortune', 'witch'],
    txt: 'Bir kervan arabasının önünde yaşlı bir falcı kristal küresine eğilmiş. "Senin yolunu gördüm, savaşçı. İster misin bilmeyi?"',
    setup: [prop('wg', 'wagon', 30, -175, { colorful: 1 }), prop('tb', 'table', 10, -158), spawn('ft', 'fortune', 14, -168, { dir: 'down' })],
    intro: [par(glow('tb', '#c8a8ff'), sfx('hum')), say('ft', 'Üç altın, bir kehanet.')],
    opts: [
      { k: 'fortune', l: 'Falına baktır', ic: 'eye', cost: { gold: 3 }, chance: 60, win: { t: '"Kılıcın kırılmayacak, yolun parlak." Kehanet içini güvenle doldurdu.', fx: { buff: { luck: 10, atk: 1, legs: 3 }, xp: 4 } }, lose: { t: '"Karanlık bir gölge görüyorum..." Kehanet içini huzursuz etti.', fx: { buff: { luck: -5, legs: 2 } } } },
      { k: 'cheat', l: 'Hile yaptığını kanıtla', ic: 'talk', chk: { s: 'talk', dc: 12 }, win: { t: 'Masanın altındaki ayna düzeneğini buldun! Falcı kahkaha attı: "Zekisin. Al, gerçek bir kehanet: bir sonraki yolda hazine var."', fx: { item: 'Q_MAP', xp: 8 } }, lose: { t: 'Hiçbir hile bulamadın. Falcı alındı ve seni lanetledi... şaka mıydı?', fx: { buff: { luck: -5, legs: 2 } } } },
      { k: 'pass', l: 'Geleceği bilmek istemem', ic: 'boot', tags: ['pass'], win: { t: '"Akıllıca," dedi falcı. "Gelecek bilenleri sevmez."', fx: {} } },
    ],
    act: {
      fortune: [heroTo(6, -44, 0.7), pay('ft', 2), par(glow('tb', '#ffffff'), fx('magic', 'tb', 14), sfx('chime')), wait(0.6)],
      cheat: [heroTo(6, -44, 0.7), pose('hero', 'kneel'), think('hero', 'Masanın altında bir şey var...'), pose('hero', 'idle')],
      pass: [heroTo(-20, -60, 0.8)],
    },
    out: {
      'fortune.win': [say('ft', 'Kılıcın kırılmayacak, yolun parlak.'), glow('tb', null, 0), par(glow('hero', '#ffe27a'), fx('sparkle', 'hero', 8)), glow('hero', null, 0), heroBack()],
      'fortune.lose': [say('ft', 'Karanlık bir gölge görüyorum...'), glow('tb', '#6a2a6a'), wait(0.6), glow('tb', null, 0), heroBack()],
      'cheat.win': [say('ft', 'Hahaha! Zekisin!'), give('ft', 'hero', 'q_map'), glow('tb', null, 0), heroBack()],
      'cheat.lose': [say('ft', 'Hakaret! Lanet olsun sana!'), par(fx('curse', 'hero', 6)), glow('tb', null, 0), heroBack()],
      'pass.win': [say('ft', 'Akıllıca.')],
    },
  },
  {
    id: 'EV_M07', t: 'Gölgeli Yolcu', cat: 'mystic', reg: [3, 4, 5], tags: ['shadow', 'mystery'],
    txt: 'Bir süredir biri seni takip ediyor. Dönünce kimse yok. Ama yere düşen gölgen... iki tane. Gölgelerden biri sana el sallıyor.',
    setup: [],
    appr: [scroll(60, 1.6), dark(0.25, 0.8), spawn('sh', 'shadow', 14, 10, { alpha: 0 }), tw('sh', { alpha: 0.7 }, 1), face('hero', 'down')],
    intro: [say('sh', 'Seninle bir süre yürüyebilir miyim?', 1.8)],
    opts: [
      { k: 'accept', l: 'Kabul et', ic: 'talk', chance: 60, win: { t: 'Gölge bir süre seninle yürüdü ve sana karanlıkta görmeyi öğretti. Sonra güneşe karışıp kayboldu.', fx: { perm: { agi: 1 }, buff: { agi: 2, legs: 2 }, xp: 10 } }, lose: { t: 'Gölge seninle yürüdükçe ağırlaştın. Sonunda ondan kurtuldun ama bitkindin.', fx: { hp: -12 } } },
      { k: 'light', l: 'Fenerle aydınlat', ic: 'sun', win: { t: 'Işığı tuttuğun anda gölge çığlık atıp dağıldı. Geride bir kese bıraktı: belki başka bir yolcudan çaldığı.', fx: { gold: [20, 30], xp: 6 } } },
      { k: 'fight', l: 'Gölgeye saldır', ic: 'sword', fight: { foes: [['sh', 'E_GHOST']] }, win: { t: 'Gölge kılıcının altında dağıldı. Garip bir hafiflik hissettin.', fx: { xp: 9, gold: [10, 20] } }, lose: { t: 'Gölge seni yuttu.' } },
    ],
    act: {
      accept: [par(mv('hero', 0, -60, 2), mv('sh', 14, -50, 2)), say('sh', 'Karanlığa iyi bak... o da sana bakar.', 2)],
      light: [prop('ln', 'lanternGlow', -4, -6), par(flash('#ffe2a0', 0.25), dark(0, 0.4), sfx('whoosh'))],
      fight: [face('hero', 'down'), heroDraw()],
    },
    out: {
      'accept.win': [par(fade('sh', 0, 1.6), fx('light', 'sh', 10)), dark(0, 0.8), heroBack()],
      'accept.lose': [par(tw('hero', { tint: '#3a3a5a' }, 1)), heroHurt(1), fade('sh', 0, 1), tw('hero', { tint: null }, 0.6), dark(0, 0.8), heroBack()],
      'light.win': [par(fade('sh', 0, 0.3), fx('smoke', 'sh', 14)), prop('bg', 'pouch', 14, 6), auto(), rm('bg'), rm('ln'), heroBack()],
      'fight.win': [dark(0, 0.8), face('hero', 'up'), heroBack()],
    },
  },
  {
    id: 'EV_M08', t: 'Zamanı Unutturan Sandık', cat: 'mystic', reg: [2, 3, 4, 5], tags: ['chest', 'time'],
    txt: 'Kum saati oymalarıyla süslü küçük bir sandık. Üstünde: "Beni açan, aldığını bulur; ama bir şeyini unutur." İçinden tik-tak sesleri geliyor.',
    setup: [prop('tc', 'chestTime', 0, -150)],
    intro: [par(sfx('tick'), fx('sand', 'tc', 6))],
    opts: [
      { k: 'open', l: 'Sandığı aç', ic: 'hand', win: { t: 'Sandık açıldı ve zaman bir an durdu. Kendine geldiğinde kesen dolmuştu... ama son yolun ve yorgunluğunu tümüyle unutmuştun.', fx: { gold: [35, 55], hpPct: 0.25, extra: 1 } } },
      { k: 'pick', l: 'Maymuncukla aralık aç', ic: 'pick', req: { item: 'C_LOCKPICK' }, consume: 'C_LOCKPICK', win: { t: 'Sandığı sadece bir parmak araladın: zaman büyüsü sızdı ama sen hazineyi çekip aldın.', fx: { gold: [30, 45], loot: 'rare', xp: 10 } } },
      { k: 'leave', l: 'Unutmak istemem', ic: 'boot', tags: ['pass'], win: { t: 'Tik-taklar arkanda kaldı.', fx: {} } },
    ],
    act: {
      open: [heroTo(0, -38, 0.6), open('tc'), par(flash('#e8d8a0', 0.4), sfx('chime'), o('timestop', { dur: 1.2 })), wait(1.2)],
      pick: [heroTo(0, -38, 0.6), pose('hero', 'kneel'), give('hero', 'tc', 'c_pick'), par(st('tc', 'ajar'), fx('sand', 'tc', 14), sfx('click'))],
      leave: [heroTo(20, -50, 0.8)],
    },
    out: {
      'leave.win': [par(sfx('tick'), fx('sand', 'tc', 8)), say('tc', 'Tik... tak...', 1.2)],
      'open.win': [say('hero', 'Ne... ne oldu? Neredeyim?'), auto(), heroBack()],
      'pick.win': [pose('hero', 'idle'), auto(), heroBack()],
    },
  },
];
