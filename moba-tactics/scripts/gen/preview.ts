import { writeFileSync } from 'node:fs';
import { PC } from './canvas';
import { encodePNG } from './png';
import { CHAMP_ART, renderFrame, ANIMS } from './champions';
const out = process.argv[2];
const ids = Object.keys(CHAMP_ART);
const which = process.argv[3] ?? 'dirs';
const cols = which === 'dirs' ? 4 : 9;
const sheet = new PC(cols * 48 + 4, ids.length * 48 + 4);
sheet.rect(0, 0, sheet.w, sheet.h, [70, 110, 60, 255]);
ids.forEach((id, r) => {
  if (which === 'dirs') (['down', 'right', 'up', 'left'] as const).forEach((d, ci) => sheet.blit(renderFrame(CHAMP_ART[id], 'idle', d, 0), ci * 48 + 2, r * 48 + 2));
  else Object.keys(ANIMS).forEach((a, ci) => sheet.blit(renderFrame(CHAMP_ART[id], a, which as any, Math.min(ANIMS[a] - 1, Math.floor(ANIMS[a] / 2))), ci * 48 + 2, r * 48 + 2));
});
writeFileSync(out, encodePNG(sheet.w, sheet.h, sheet.scaled(2).d.length ? sheet.d : sheet.d));
const big = sheet.scaled(3);
writeFileSync(out.replace('.png', '_x3.png'), encodePNG(big.w, big.h, big.d));
