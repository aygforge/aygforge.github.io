// Başkent finali: Kraliyet Sınavı (174 olay düğümüne dahil değildir).
import { par, spawn, prop, mv, run, set, say, think, wait, pose, face, shake, flash, sfx, fx, give, glow, emote, heroDraw, heroBack, heroTo, banner, coins, dark, tw } from '../engine/choreo.js';

export const FINAL = {
  id: 'EV_FINAL', t: 'Kraliyet Sınavı', cat: 'special', where: 'town', tags: ['final', 'royal'], reg: [1, 2, 3, 4, 5],
  txt: 'Altıntaç\'ın büyük meydanında kral tahtında oturuyor. Önünde parlak zırhıyla Kraliyet Şampiyonu bekliyor. Bir tellal bağırıyor: "Krallığın Kılıcı olmak isteyen, sınavı geçmeli!"',
  setup: [prop('thr', 'throne', 0, -200), spawn('kg', 'king', 0, -196, { pose: 'sit', dir: 'down' }), spawn('hd', 'herald', -40, -170), spawn('ch', 'champion', 0, -160), spawn('g1', 'guard', -60, -150, { dir: 'right' }), spawn('g2', 'guard', 60, -150, { dir: 'left' })],
  appr: [o_scroll()],
  intro: [par(sfx('fanfare'), pose('hd', 'horn')), say('hd', 'Sınav başlasın!'), say('kg', 'Göster bize, gezgin: neyin uğruna yürüdün?', 1.8), par(pose('ch', 'ready'), sfx('draw'))],
  opts: [
    { k: 'champ', l: 'Kraliyet Şampiyonuyla dövüş', ic: 'sword', fight: { foes: [['ch', 'B_CHAMPION']] }, win: { t: 'Şampiyonun kılıcı yere düştü. Meydan sessizleşti, sonra coşkuyla patladı. Kral ayağa kalktı: "Krallığın yeni Kılıcı!"', fx: { capital: 1, gold: [150, 200], xp: 40 } }, lose: { t: 'Şampiyonun kılıcı son darbeyi indirdi. Meydan sessizliğe büründü.' } },
    { k: 'favor', l: 'Kraliyet takdirnameni sun', ic: 'scroll', req: { flag: 'royalFavor' }, hint: 'Kraliyet görevleri, zincirler veya Kıdemli Muhafız sınavıyla kazanılır', win: { t: 'Kral takdirnameleri okudu. "Krallığa hizmetin kılıçtan daha keskin." Şampiyon eğildi ve kral seni Krallığın Kılıcı ilan etti.', fx: { capital: 1, gold: [100, 140], xp: 30 } } },
    { k: 'seal', l: 'Kraliyet Mührü ve dostluk mektuplarını sun', ic: 'crown', req: { item: 'Q_SEAL', flag: 'royalFriend' }, consume: 'Q_SEAL', hint: 'Gerçek Kraliyet Mührü ve krallığın dostluğu gerekir', win: { t: 'Kral mührü tanıdı: "Kayıp mührümüz! Ve bunca dostluk mektubu..." Sınav bir tören oldu.', fx: { capital: 1, gold: [90, 120], xp: 30 } } },
  ],
  act: {
    champ: [heroDraw(), mv('ch', 0, -46, 0.8), say('ch', 'Kılıcını kaldır!')],
    favor: [heroTo(0, -60, 1.0), pose('hero', 'kneel'), give('hero', 'kg', 'letter'), think('kg', '...')],
    seal: [heroTo(0, -60, 1.0), pose('hero', 'kneel'), give('hero', 'kg', 'q_seal'), par(glow('kg', '#ffd76a'), sfx('chime'))],
  },
  out: {
    '*.win': [pose('hero', 'idle'), par(pose('kg', 'idle'), mv('kg', 0, -150, 1.0)), say('kg', 'Krallığın Kılıcı!'), par(sfx('fanfare'), sfx('cheer'), fx('confetti', { x: 0, y: -60 }, 40), pose('ch', 'kneel'), pose('g1', 'salute'), pose('g2', 'salute')), coins('kg', 'hero', 12), banner('KRALLIĞIN KILICI'), glow('kg', null, 0), heroBack()],
  },
};
function o_scroll() { return { type: 'scroll', dy: 110, dur: 2.4 }; }
