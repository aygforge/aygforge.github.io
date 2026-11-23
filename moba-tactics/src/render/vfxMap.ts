/** Maps simulation event keys to generated VFX sprites. scale is relative to radius when r is given. */
export const VFX_FOR: Record<string, { key: string; base?: number; tint?: number; follow?: boolean }> = {
  shield: { key: 'shieldBubble' }, shieldWall: { key: 'shieldBubble', tint: 0xaad4ff },
  impact: { key: 'hitSpark', base: 2 }, quake: { key: 'quake' }, tectonic: { key: 'quake', tint: 0xffb070 }, rockskin: { key: 'shieldBubble', tint: 0xc0a080 },
  chainPull: { key: 'hitSpark', base: 2, tint: 0xc080ff }, curseBind: { key: 'voidBurst', base: 0.8 }, ironCircle: { key: 'voidBurst' },
  axeCleave: { key: 'wideSlash' }, bloodSlash: { key: 'bloodSlash' }, frenzy: { key: 'bloodNova', base: 0.8 },
  parry: { key: 'hitSpark', base: 2.5, tint: 0xc0ffff }, parryStance: { key: 'shieldBubble', tint: 0x80ffe0 }, thrust: { key: 'slash', tint: 0xc0ffff }, duelMark: { key: 'voidBurst', base: 0.8, tint: 0x60ffe0 },
  lifeDrain: { key: 'bloodSlash' }, bloodRite: { key: 'bloodNova' },
  emberBurst: { key: 'fireExplosion' }, fireExplosion: { key: 'fireExplosion' }, burn: { key: 'smallBoom' }, crimsonRainArea: { key: 'telegraph', tint: 0xff6020 }, meteor: { key: 'fireExplosion' },
  frostRoot: { key: 'frostRoot' }, freezeBurst: { key: 'iceBurst' }, frozen: { key: 'frostRoot', base: 1.4 },
  echoSeal: { key: 'voidBurst', base: 0.7 }, riftMarkGround: { key: 'telegraph', tint: 0xb060ff }, riftBurst: { key: 'voidBurst' }, sealBreak: { key: 'voidBurst' },
  shadowStrike: { key: 'shadowPuff' }, shadowPuff: { key: 'shadowPuff' }, smoke: { key: 'smoke' }, lastWhisper: { key: 'riftSlash', base: 2, tint: 0xb060ff },
  plagueHarvest: { key: 'poisonBurst', base: 2 }, poisonBurst: { key: 'poisonBurst' },
  riftOut: { key: 'shadowPuff', tint: 0x40f0ff }, riftIn: { key: 'voidBurst', base: 0.6, tint: 0x40f0ff }, echoSlash: { key: 'riftSlash' }, echoSlash2: { key: 'riftSlash', base: 1.3 }, riftDash: { key: 'riftSlash' },
  hawk: { key: 'hawk', base: 1.5 }, dawnHit: { key: 'explosion', tint: 0xffffa0 },
  roll: { key: 'smoke', base: 0.6 }, arrowStorm: { key: 'levelUp', tint: 0xffb040 },
  smallBoom: { key: 'smallBoom' }, bombFuse: { key: 'telegraph', tint: 0xffa030 }, explosion: { key: 'explosion' }, bigExplosion: { key: 'bigExplosion' },
  summonPuff: { key: 'smoke', base: 0.6 }, wolfBite: { key: 'bloodSlash', base: 0.8 }, howl: { key: 'quake', base: 0.7, tint: 0xffd040 }, summonBig: { key: 'quake', tint: 0xa0ff80 },
  soulGather: { key: 'soulWisp' }, boneRise: { key: 'deathPuff', tint: 0xa0ffb0 }, graveCurse: { key: 'voidBurst', base: 0.8, tint: 0x60ff90 }, boneConsume: { key: 'deathPuff' },
  runeBuild: { key: 'runeBuild' }, overload: { key: 'levelUp', tint: 0x40f0d0 },
  star: { key: 'levelUp', base: 0.7 }, speedbuff: { key: 'speedBuff' },
  bloodTele: { key: 'telegraph', tint: 0xff2040 }, bloodNova: { key: 'bloodNova' }, titanTele: { key: 'telegraph', tint: 0x40e0ff }, titanSlam: { key: 'titanSlam' },
};

export const ZONE_FOR: Record<string, { key: string; tint?: number }> = {
  flameRoad: { key: 'flameGround' }, frozenGround: { key: 'frostGround' }, winterPrison: { key: 'frostGround', tint: 0xc0e8ff }, poisonCloud: { key: 'poisonGround' },
  fortress: { key: 'fortressGround' }, hawkEye: { key: 'hawkGround' }, fuse: { key: 'p_bomb' },
};
