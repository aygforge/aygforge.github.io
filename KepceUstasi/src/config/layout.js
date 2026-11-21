// Portrait layout: ÜST savaş alanı ve ALT tencere alanı; oranlar ekran yüksekliğine göre esner.
import { POT_GEOM } from '../systems/PotPhysics.js';

export const GAME_W = 540;

export function gameHeightFor(viewW, viewH) {
  const aspect = viewH / Math.max(1, viewW);
  return Math.round(Math.max(960, Math.min(1220, GAME_W * aspect)));
}

export function computeLayout(H) {
  const W = GAME_W;
  const hud = 56;
  const divider = 34;
  const battleTop = hud;
  const battleBottom = Math.round(H * 0.485);
  const potAreaTop = battleBottom + divider;
  const stoveH = Math.max(46, Math.round((H - 960) * 0.35) + 46);
  const floorBottom = H - stoveH; // bottom of the pot wall
  const potRimY = floorBottom - POT_GEOM.wall - POT_GEOM.D;
  const potX = Math.round((W - POT_GEOM.W) / 2);
  return {
    W,
    H,
    hud,
    battle: { top: battleTop, bottom: battleBottom, h: battleBottom - battleTop },
    field: { left: 22, right: W - 22, top: battleTop + 64, bottom: battleBottom - 34 },
    divider: { top: battleBottom, h: divider },
    potArea: { top: potAreaTop, bottom: H },
    pot: { x: potX, y: potRimY },
    railY: Math.max(potAreaTop + 8, potRimY - 112),
    stove: { top: floorBottom, h: stoveH },
  };
}

// normalised battle coords -> screen
export function fieldToScreen(L, x, y) {
  return {
    x: L.field.left + x * (L.field.right - L.field.left),
    y: L.field.top + y * (L.field.bottom - L.field.top),
  };
}
