// Maps character appearance + equipped items to layered sprite sheets.
import { BASE_BY_ID } from '../../shared/data/items.js';
import { APPEARANCE } from '../../shared/data/classes.js';

const hexToInt = (h) => parseInt(h.replace('#', ''), 16);
const CAPE = { warrior: 0x8a2a2a, ranger: 0x3e6a34, mage: 0x3a3a8a };

function armorKey(cls, item) {
  const b = item && BASE_BY_ID[item.base_id];
  const fam = { warrior: 'plate', ranger: 'leather', mage: 'cloth' }[cls];
  const names = { plate: ['plate_iron', 'plate_steel', 'plate_blood'], leather: ['leather_brown', 'leather_dark', 'leather_green'], cloth: ['cloth_blue', 'cloth_violet', 'cloth_arcane'] }[fam];
  if (!b || b.family !== fam) return names[0];
  if (b.set) return names[2];
  return b.tier >= 2 ? names[1] : names[0];
}

function helmetKey(cls, item) {
  const b = item && BASE_BY_ID[item.base_id];
  if (!b) return null;
  if (b.unique === 'u_roots') return 'crown_roots';
  const names = { warrior: ['helm_iron', 'helm_steel', 'helm_blood'], ranger: ['hood_brown', 'hood_dark', 'hood_green'], mage: ['hat_blue', 'hat_violet', 'hat_arcane'] }[cls];
  if (b.set) return names[2];
  return b.tier >= 2 ? names[1] : names[0];
}

function weaponKey(cls, item, off = false) {
  const b = item && BASE_BY_ID[item.base_id];
  if (!b) return null;
  const v = b.tier >= 2 ? 'b' : 'a';
  const f = b.family;
  if (off) {
    if (f === 'shield') return b.unique === 'u_millstone' ? 'shield_stone' : `shield_${v}`;
    if (f === 'tome') return `tome_${v}`;
    if (f === 'orb') return 'orb_a';
    if (f === 'sword' || f === 'axe' || f === 'dagger') return `off_${f}_${v}`;
    return null;
  }
  if (b.unique === 'u_crimson') return 'greatsword_blood';
  if (b.unique === 'u_viper') return 'bow_green';
  if (b.unique === 'u_storm') return 'staff_storm';
  if (['sword', 'axe', 'greatsword', 'bow', 'crossbow', 'dagger', 'staff', 'wand'].includes(f)) return `${f}_${v}`;
  return null;
}

// Returns ordered layers [{tex, tint}] (back to front)
export function heroLayers(cls, appearance = {}, equipped = {}) {
  const ap = appearance || {};
  const skin = hexToInt(APPEARANCE.skins[ap.skin | 0] || APPEARANCE.skins[0]);
  const hair = hexToInt(APPEARANCE.hairColors[ap.hairColor | 0] || APPEARANCE.hairColors[0]);
  const style = ['short', 'long', 'ponytail', 'shaved', 'braided'][ap.hair | 0] || 'short';
  const L = [];
  const k = (n) => `hero_${cls}_${n}`;
  if ((ap.cosmetic | 0) === 3) L.push({ tex: k('cape'), tint: CAPE[cls] });
  const off = weaponKey(cls, equipped.offhand, true);
  if (off) L.push({ tex: k('weapon_' + off) });
  L.push({ tex: k('body'), tint: skin });
  L.push({ tex: k('armor_' + armorKey(cls, equipped.chest)) });
  if ((ap.cosmetic | 0) === 1) L.push({ tex: k('face_scar') });
  if ((ap.cosmetic | 0) === 2) L.push({ tex: k('face_paint') });
  const helm = helmetKey(cls, equipped.head);
  if (helm) L.push({ tex: k('helmet_' + helm) });
  else L.push({ tex: k('hair_' + style), tint: hair });
  const main = weaponKey(cls, equipped.mainhand);
  if (main) L.push({ tex: k('weapon_' + main) });
  return { layers: L, scaleX: (ap.body | 0) === 1 ? 0.93 : 1.04 };
}
