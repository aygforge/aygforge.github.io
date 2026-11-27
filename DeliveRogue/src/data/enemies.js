// data/enemies.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).

/** Enemy archetypes. hp[] indexed by chapter tier (C1-3, C4-6, C7-9, C10-12). */
export const ENEMY_DB = {
  COF_N_BeanBandit: { id: 'COF_N_BeanBandit', short: 'BB', name: 'Bean Bandit', role: 'Normal', arch: 'Runner', ai: 'runner',
    hp: [26, 32, 38, 46], speed: 72, half: 7, act: 175, leash: 300, dmg: 8, range: 22, windup: 0.28, cd: 1.0, w: 22, h: 24,
    desc: 'Maskeli hızlı bir kahve çekirdeği. Hızla yaklaşır ve kısa menzilli saldırır. Yana kaçarak atlatılabilir.' },
  COF_N_LatteImp: { id: 'COF_N_LatteImp', short: 'LI', name: 'Latte Imp', role: 'Normal', arch: 'Disruptor', ai: 'imp',
    hp: [28, 34, 40, 48], speed: 54, half: 7, act: 185, leash: 300, dmg: 4, range: 150, windup: 0.4, cd: 2.6, w: 22, h: 24,
    desc: 'Latte sıçratan küçük şeytan. Kaçış yoluna yavaşlatan süt köpüğü birikintileri bırakır.' },
  COF_N_SugarSprite: { id: 'COF_N_SugarSprite', short: 'SS', name: 'Sugar Sprite', role: 'Normal', arch: 'Swarm', ai: 'swarm',
    hp: [24, 28, 34, 42], speed: 74, half: 5, act: 170, leash: 280, dmg: 4, range: 12, windup: 0, cd: 0.8, w: 16, h: 18,
    desc: 'Kanatlı şeker küpü. Tek başına zayıf ama sürü hâlinde tehlikeli.' },
  COF_N_BaristaGoblin: { id: 'COF_N_BaristaGoblin', short: 'BG', name: 'Barista Goblin', role: 'Normal', arch: 'Bruiser', ai: 'bruiser',
    hp: [36, 42, 50, 60], speed: 46, half: 8, act: 165, leash: 280, dmg: 16, range: 30, windup: 0.75, cd: 1.6, w: 26, h: 28,
    desc: 'Portafiltre sallayan iri goblin. Saldırmadan önce belirgin şekilde güç toplar; saldırıdan sonra savunmasızdır (+%50 hasar alır).' },
  COF_N_DripCultist: { id: 'COF_N_DripCultist', short: 'DC', name: 'Drip Cultist', role: 'Normal', arch: 'Caster', ai: 'caster',
    hp: [30, 36, 44, 52], speed: 44, half: 7, act: 200, leash: 320, dmg: 7, range: 175, windup: 0.35, cd: 1.8, w: 22, h: 28,
    desc: 'Filtre kahve tarikatçısı. Mesafeyi korur, kahve mermileri fırlatır. Her üçüncü saldırısı parlayan üçlü atıştır.' },
  COF_N_MugMimic: { id: 'COF_N_MugMimic', short: 'MM', name: 'Mug Mimic', role: 'Normal', arch: 'Disruptor', ai: 'mimic',
    hp: [34, 38, 42, 50], speed: 62, half: 7, act: 64, leash: 260, dmg: 10, range: 20, windup: 0.5, cd: 1.1, w: 20, h: 20,
    desc: 'Masum görünen bir kupa... ta ki yaklaşana kadar! Ünlem işaretini görünce iniş noktasından uzaklaş.' },
  COF_N_CreamDrifter: { id: 'COF_N_CreamDrifter', short: 'CD', name: 'Cream Drifter', role: 'Normal', arch: 'Tank', ai: 'tank',
    hp: [50, 56, 64, 74], speed: 30, half: 13, act: 160, leash: 240, dmg: 10, range: 16, windup: 0, cd: 1.0, w: 40, h: 34,
    desc: 'Dev krem şanti yığını. Yavaş ama çok dayanıklı; koridoru doldurur, temas edince iter.' },
  COF_E_GrinderKnight: { id: 'COF_E_GrinderKnight', short: 'GK', name: 'Grinder Knight', role: 'Elite', arch: 'Bruiser', ai: 'knight',
    hp: [160, 170, 190, 230], speed: 44, half: 11, act: 210, leash: 340, dmg: 18, range: 32, windup: 0.6, cd: 1.4, w: 36, h: 42, elite: true,
    desc: 'Kahve değirmeni miğferli zırhlı şövalye. Kırmızı şeritle hücumunu işaret eder; duvara çarparsa sersemler ve fazla hasar alır. Hücumu paketi de sarsar.' },
  COF_E_SteamJugger: { id: 'COF_E_SteamJugger', short: 'SJ', name: 'Steam Jugger', role: 'Elite', arch: 'Tank', ai: 'jugger',
    hp: [240, 250, 260, 280], speed: 26, half: 14, act: 220, leash: 320, dmg: 12, range: 34, windup: 0.8, cd: 3.4, w: 46, h: 46, elite: true,
    desc: 'Zırhlı buhar kazanı canavarı. İşaretli bölgelere buhar püskürtür — buhar hem seni hem paketi yakar. Uyarı halkalarından uzak dur.' },
  COF_B_LatteArtDragon: { id: 'COF_B_LatteArtDragon', short: 'LD', name: 'Latte Art Dragon', role: 'Boss', arch: 'Boss', ai: 'boss', boss: true,
    hp: [1400, 1400, 1400, 1400], speed: 34, half: 24, act: 9999, leash: 1e9, dmg: 0, range: 0, windup: 0, cd: 1, w: 84, h: 78,
    desc: 'Coffee District\'in son bekçisi. Kahve nefesini yelpaze gibi püskürtür, buhar patlamaları ve kafein yağmuru yağdırır. Can %70 ve %30\'a inince öfkelenir; ikinci evrede şeker perileri çağırır.' },
};
export const ENEMY_ORDER = ['COF_N_BeanBandit', 'COF_N_SugarSprite', 'COF_N_LatteImp', 'COF_N_BaristaGoblin', 'COF_N_DripCultist', 'COF_N_CreamDrifter', 'COF_N_MugMimic', 'COF_E_GrinderKnight', 'COF_E_SteamJugger', 'COF_B_LatteArtDragon'];
export const ENEMY_SHORT = {}; for (const k in ENEMY_DB) ENEMY_SHORT[ENEMY_DB[k].short] = k;
/** Chapter in which each enemy is introduced (placement validation). */
export const ENEMY_INTRO = { BB: 1, SS: 2, LI: 3, BG: 4, DC: 5, CD: 6, GK: 7, MM: 8, SJ: 10, LD: 12 };
