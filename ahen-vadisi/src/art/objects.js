// Dünya nesneleri ve efekt sprite'ları (kare dizileri).
import { PB, OUTLINE, hash } from './pixel.js';

const frames = (n, w, h, fn, outline = true) => Array.from({ length: n }, (_, i) => {
  const pb = new PB(w, h);
  fn(pb, i);
  if (outline) pb.outline(OUTLINE);
  return pb;
});

export const OBJECT_SPRITES = {
  waystone: () => frames(4, 16, 28, (pb, i) => {
    pb.ellipse(8, 26, 7, 2, '#2a2a30');
    pb.poly([[3, 26], [4, 6], [8, 1], [12, 6], [13, 26]], '#6a6a78'); pb.poly([[5, 24], [6, 7], [8, 4], [9, 24]], '#8a8a98');
    const g = ['#5ad8ff', '#8ae8ff', '#c0f4ff', '#8ae8ff'][i];
    pb.vline(8, 9, 21, g); pb.hline(6, 10, 13, g); pb.set(6, 17, g); pb.set(10, 17, g); pb.set(8, 7, '#ffffff');
  }),
  altar: () => frames(4, 32, 26, (pb, i) => {
    pb.rect(3, 14, 26, 10, '#6a6470'); pb.rect(1, 12, 30, 3, '#8a8490'); pb.hline(1, 30, 12, '#a8a2ae');
    for (let x = 5; x < 28; x += 6) pb.vline(x, 15, 23, '#4e4854');
    const c = ['#c070ff', '#d090ff', '#e0b0ff', '#d090ff'][i];
    pb.poly([[12, 12], [16, 0 + (i % 2)], [20, 12]], c); pb.vline(16, 3, 10, '#f4e8ff');
    pb.set(7, 18, c); pb.set(25, 18, c);
  }),
  altar_off: () => frames(1, 32, 26, (pb) => {
    pb.rect(3, 14, 26, 10, '#5a5460'); pb.rect(1, 12, 30, 3, '#6a6470');
    pb.poly([[12, 12], [16, 3], [20, 12]], '#4a3a5a');
  }),
  portal: () => frames(4, 20, 20, (pb, i) => {
    const r = 6 + (i % 2);
    pb.ring(10, 10, r + 2, '#3a7ad0', 2); pb.ring(10, 10, r, '#8ad0ff', 1);
    pb.poly([[6, 10], [13, 5], [13, 15]], ['#ffffff', '#e0f4ff', '#c0e8ff', '#e0f4ff'][i]);
  }, false),
  dungeon_gate: () => frames(2, 48, 48, (pb, i) => {
    pb.rect(2, 8, 44, 40, '#3a3640'); pb.poly([[2, 10], [24, 0], [46, 10]], '#4a4652');
    pb.rect(10, 16, 28, 32, i ? '#0a0a12' : '#2a2a34');
    if (!i) { for (let x = 12; x < 38; x += 6) pb.vline(x, 16, 47, '#5a5664'); pb.hline(10, 37, 30, '#5a5664');
      pb.disc(24, 30, 6, '#6a3a8a'); pb.ring(24, 30, 6, '#c070ff'); pb.set(24, 30, '#ffffff'); }
    else { pb.disc(24, 34, 9, '#1a1430'); pb.disc(24, 34, 5, '#3a2a6a'); }
    for (let y = 12; y < 46; y += 6) { pb.rect(3, y, 6, 4, '#4e4a56'); pb.rect(39, y, 6, 4, '#4e4a56'); }
    pb.set(24, 4, '#c070ff');
  }),
  gate_bars: () => frames(1, 16, 16, (pb) => {
    pb.rect(0, 0, 16, 16, '#2a2630');
    for (let x = 1; x < 16; x += 4) { pb.rect(x, 0, 2, 16, '#6a6678'); pb.vline(x, 0, 15, '#8a8698'); }
    pb.rect(0, 3, 16, 2, '#5a5668'); pb.rect(0, 11, 16, 2, '#5a5668');
  }, false),
  herb_healing_herb: () => frames(1, 14, 12, (pb) => {
    pb.ellipse(7, 8, 6, 4, '#2e6a28'); for (let i = 0; i < 5; i++) pb.line(7, 10, 2 + i * 2.5, 3 + (i % 2) * 2, '#4ea040');
    pb.set(4, 4, '#f4f0e8'); pb.set(10, 3, '#f4f0e8'); pb.set(7, 2, '#f0d040');
  }),
  herb_mana_herb: () => frames(1, 14, 12, (pb) => {
    pb.ellipse(7, 8, 6, 4, '#2a4a6a'); for (let i = 0; i < 5; i++) pb.line(7, 10, 2 + i * 2.5, 3 + (i % 2) * 2, '#4a8ad0');
    pb.set(4, 4, '#a0e0ff'); pb.set(10, 3, '#a0e0ff'); pb.set(7, 2, '#ffffff');
  }),
  herb_used: () => frames(1, 14, 12, (pb) => { pb.ellipse(7, 9, 5, 2.5, '#4a4a32'); pb.line(5, 9, 4, 6, '#5a5a3a'); }),
  ore_iron_ore: () => frames(1, 20, 16, (pb) => {
    pb.poly([[1, 15], [3, 5], [9, 1], [16, 3], [19, 15]], '#5a5458'); pb.poly([[4, 13], [5, 6], [9, 3], [14, 5], [16, 13]], '#6e686c');
    for (const [x, y] of [[7, 7], [12, 9], [9, 11], [14, 6]]) { pb.set(x, y, '#c08a5a'); pb.set(x + 1, y, '#e0aa7a'); }
  }),
  ore_hard_ore: () => frames(1, 20, 16, (pb) => {
    pb.poly([[1, 15], [3, 5], [9, 1], [16, 3], [19, 15]], '#3e3a44'); pb.poly([[4, 13], [5, 6], [9, 3], [14, 5], [16, 13]], '#4e4a56');
    for (const [x, y] of [[7, 7], [12, 9], [9, 11], [14, 6]]) { pb.set(x, y, '#d0d4f0'); pb.set(x, y - 1, '#ffffff'); }
  }),
  ore_used: () => frames(1, 20, 16, (pb) => { pb.poly([[2, 15], [5, 9], [12, 8], [18, 15]], '#4a4448'); }),
  track: () => frames(2, 16, 12, (pb, i) => {
    const c = i ? '#f0d060' : '#5a3a22';
    for (const [x, y] of [[3, 8], [9, 3]]) { pb.ellipse(x + 1, y + 1, 1.6, 1.3, c); pb.set(x - 1, y - 1, c); pb.set(x + 1, y - 2, c); pb.set(x + 3, y - 1, c); }
  }, false),
  chest: () => frames(2, 16, 14, (pb, i) => {
    pb.rect(1, 5, 14, 9, '#8a5a32'); pb.rect(1, 5, 14, 2, '#a87040'); pb.hline(1, 14, 9, '#5a3a20'); pb.rect(7, 7, 2, 3, '#e0c060');
    if (i) { pb.rect(1, 1, 14, 4, '#6a4428'); pb.rect(3, 4, 10, 2, '#f0d060'); }
    else pb.poly([[1, 6], [3, 2], [13, 2], [15, 6]], '#9a6a3a');
  }),
  purify: () => frames(2, 18, 26, (pb, i) => {
    pb.ellipse(9, 24, 8, 2, '#1e2a20');
    pb.poly([[3, 24], [4, 6], [9, 2], [14, 6], [15, 24]], '#6a7a6a'); pb.poly([[5, 22], [6, 7], [9, 4], [10, 22]], '#8a9a8a');
    const c = i ? '#7af0ff' : '#3a4a3a';
    pb.disc(9, 12, 3, c); pb.vline(9, 6, 20, i ? '#c0ffff' : '#4a5a4a'); if (i) pb.set(9, 12, '#ffffff');
  }),
  ruin: () => frames(2, 18, 20, (pb, i) => {
    pb.rect(2, 4, 14, 15, '#7a7a6a'); pb.poly([[2, 4], [9, 0], [16, 4]], '#8a8a7a');
    const c = i ? '#f0d060' : '#4a4a3a';
    pb.hline(5, 12, 8, c); pb.hline(5, 10, 11, c); pb.hline(6, 12, 14, c); pb.set(4, 16, '#4a7a3a');
  }),
  checkpoint: () => frames(2, 16, 28, (pb, i) => {
    pb.vline(4, 2, 27, '#6a4628'); pb.poly([[5, 3], [15, 6 + i], [5, 11]], '#c03a3a'); pb.hline(5, 8, 7, '#f0d060');
    pb.ellipse(4, 27, 4, 1, '#2a2a30');
  }),
  campfire: () => frames(4, 16, 18, (pb, i) => {
    pb.line(2, 16, 13, 13, '#5a3a20'); pb.line(2, 13, 13, 16, '#6a4628');
    const h = [8, 10, 9, 11][i];
    pb.poly([[4, 15], [8, 15 - h], [12, 15]], '#e05a20'); pb.poly([[6, 15], [8, 17 - h], [10, 15]], '#f0b030'); pb.set(8, 13, '#fff0a0');
  }, false),
  torch: () => frames(4, 8, 18, (pb, i) => {
    pb.rect(3, 8, 2, 10, '#5a3a20'); pb.rect(2, 7, 4, 2, '#4a4a52');
    const h = [5, 6, 5, 7][i];
    pb.poly([[2, 7], [4, 7 - h], [6, 7]], '#f07a20'); pb.set(4, 5, '#ffe080'); pb.set(4, 4 - (i % 2), '#fff0c0');
  }, false),
  brazier_fire: () => frames(4, 16, 14, (pb, i) => {
    const h = [9, 11, 10, 12][i];
    pb.poly([[2, 13], [5, 13 - h + 3], [8, 13 - h], [11, 13 - h + 2], [14, 13]], '#e05a20'); pb.poly([[5, 13], [8, 15 - h], [11, 13]], '#f0b030');
  }, false),
  smoke: () => frames(1, 8, 8, (pb) => { pb.disc(4, 4, 3.5, '#b8b4b0', 160); pb.disc(3, 3, 1.5, '#d8d4d0', 160); }, false),
  loot_bag: () => frames(1, 12, 12, (pb) => {
    pb.ellipse(6, 8, 5, 4, '#a07a48'); pb.rect(4, 2, 4, 3, '#a07a48'); pb.hline(3, 8, 4, '#5a3a20'); pb.set(5, 7, '#c09a68');
  }),
  shadow: () => frames(1, 16, 6, (pb) => { pb.ellipse(8, 3, 8, 3, '#000000', 90); }, false),
  ring_target: () => frames(1, 32, 14, (pb) => {
    for (let a = 0; a < 40; a++) {
      const t = a / 40 * Math.PI * 2; if ((a % 10) > 6) continue;
      pb.set(16 + Math.cos(t) * 15, 7 + Math.sin(t) * 6, '#ff4a3a'); pb.set(16 + Math.cos(t) * 14, 7 + Math.sin(t) * 5.5, '#ffaa80');
    }
  }, false),
  ring_npc: () => frames(1, 32, 14, (pb) => {
    for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; if ((a % 10) > 6) continue; pb.set(16 + Math.cos(t) * 15, 7 + Math.sin(t) * 6, '#ffe060'); }
  }, false),
  quest_mark: () => frames(2, 8, 12, (pb, i) => {
    const c = i ? '#ffe060' : '#f0c020';
    pb.rect(3, 1, 3, 7, c); pb.rect(3, 9, 3, 2, c);
  }),
  quest_turnin: () => frames(2, 10, 12, (pb, i) => {
    const c = i ? '#ffe060' : '#f0c020';
    pb.ellipse(5, 4, 3.5, 3, c); pb.clear(3, 4, 2, 2); pb.rect(5, 6, 2, 2, c); pb.rect(5, 9, 2, 2, c);
    pb.clear(2, 3, 2, 3); pb.rect(2, 2, 2, 2, c);
  }),
  // ---------------- V2 nesneleri
  ore_ash_ore: () => frames(1, 20, 16, (pb) => {
    pb.poly([[1, 15], [3, 5], [9, 1], [16, 3], [19, 15]], '#2e2a2e'); pb.poly([[4, 13], [5, 6], [9, 3], [14, 5], [16, 13]], '#443e42');
    for (const [x, y] of [[7, 7], [12, 9], [9, 11], [14, 6]]) { pb.set(x, y, '#ff7a2a'); pb.set(x + 1, y, '#ffb040'); }
  }),
  ore_frost_crystal: () => frames(1, 20, 16, (pb) => {
    pb.ellipse(10, 14, 8, 2, '#8aa0b0');
    pb.poly([[4, 14], [6, 5], [8, 1], [10, 6], [11, 14]], '#5ab8e8'); pb.vline(7, 4, 12, '#e0faff');
    pb.poly([[10, 14], [13, 6], [15, 3], [16, 8], [17, 14]], '#9fe0f8'); pb.set(15, 5, '#ffffff');
  }),
  caravan_wreck: () => frames(2, 32, 20, (pb, i) => {
    pb.rect(3, 6, 24, 9, '#3a2e28'); pb.hline(3, 26, 6, '#5a4638'); for (let x = 5; x < 27; x += 5) pb.vline(x, 2, 6, '#2e2420');
    pb.disc(8, 16, 3, '#1e1a1a'); pb.ellipse(23, 17, 3, 2, '#1e1a1a');
    pb.rect(12, 9, 6, 4, i ? '#f0d060' : '#6a4a2a'); pb.set(20, 9, '#ff6a2a'); pb.line(27, 12, 31, 15, '#3a2e28');
  }),
  ember_relic: () => frames(2, 18, 24, (pb, i) => {
    pb.ellipse(9, 22, 8, 2, '#1a1414');
    pb.rect(4, 14, 10, 8, '#3a3034'); pb.rect(3, 13, 12, 2, '#4e4448');
    pb.disc(9, 8, 4.5, i ? '#ffd060' : '#c84a1a'); pb.disc(9, 8, 2.5, i ? '#ffffff' : '#ff8a2a'); pb.ring(9, 8, 5, '#5a4a40');
  }),
  winter_relic: () => frames(2, 14, 14, (pb, i) => {
    pb.ellipse(7, 11, 6, 2.5, '#e8f2f8'); pb.rect(3, 6, 8, 5, '#7a6a5a'); pb.hline(3, 10, 6, '#9a8a7a');
    pb.set(7, 8, i ? '#f0d060' : '#c8b080'); pb.hline(2, 11, 10, '#ffffff');
  }),
  // ---------------- V3 görev nesneleri (kare 0: etkin, kare 1: tamamlandı)
  road_sign: () => frames(2, 16, 24, (pb, i) => {
    pb.ellipse(8, 22, 6, 1.5, '#2a2018');
    if (i) { pb.rect(7, 6, 2, 16, '#6a4628'); pb.rect(1, 5, 14, 6, '#a87a48'); pb.hline(3, 12, 7, '#4a3020'); pb.hline(3, 10, 9, '#4a3020'); pb.poly([[15, 5], [16, 8], [15, 11]], '#a87a48'); }
    else { pb.line(4, 21, 11, 9, '#6a4628'); pb.line(5, 21, 12, 9, '#5a3a20'); pb.poly([[6, 12], [15, 7], [16, 12], [8, 17]], '#8a6a42'); pb.line(9, 13, 14, 10, '#4a3020'); }
  }),
  tree_mark: () => frames(2, 16, 28, (pb, i) => {
    pb.ellipse(8, 26, 7, 2, '#1e1a14');
    pb.rect(4, 0, 8, 26, '#5a4028'); pb.vline(5, 0, 25, '#6e5032'); pb.vline(10, 0, 25, '#4a3420');
    const c = i ? '#f0d060' : '#c8b088';
    pb.line(6, 9, 9, 6, c); pb.line(6, 6, 9, 9, c); pb.hline(6, 9, 13, c); pb.set(7, 15, c);
    pb.poly([[1, 26], [4, 22], [4, 26]], '#4a3420'); pb.poly([[15, 26], [12, 22], [12, 26]], '#4a3420');
  }),
  dry_spring: () => frames(2, 22, 16, (pb, i) => {
    pb.ellipse(11, 9, 10, 6, '#6a6a62'); pb.ellipse(11, 9, 8, 4.5, '#4a4a44');
    for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; pb.disc(11 + Math.cos(t) * 9, 9 + Math.sin(t) * 5.5, 1.4, k % 2 ? '#8a8a80' : '#7a7a70'); }
    if (i) { pb.ellipse(11, 9, 7, 3.6, '#3a7ab8'); pb.hline(8, 12, 8, '#9ad0f0'); pb.set(14, 10, '#c8e8ff'); }
    else { pb.ellipse(11, 9, 7, 3.6, '#2e2620'); pb.set(9, 9, '#5a1e3a'); pb.set(13, 8, '#5a1e3a'); pb.line(8, 10, 12, 8, '#1e1814'); }
  }),
  map_piece: () => frames(2, 16, 12, (pb, i) => {
    pb.ellipse(8, 8, 7, 3.5, i ? '#3a2a1e' : '#6a5032'); pb.ellipse(8, 7, 5, 2.5, i ? '#2a1e16' : '#7a5e3a');
    if (!i) { pb.rect(5, 3, 7, 3, '#e8dcb8'); pb.hline(6, 10, 4, '#8a6a42'); pb.set(11, 3, '#c03a3a'); }
  }, false),
  alchemy_table: () => frames(2, 28, 26, (pb, i) => {
    pb.ellipse(14, 24, 13, 2, '#1e1a14');
    pb.rect(2, 13, 24, 3, '#8a5a32'); pb.rect(3, 16, 2, 8, '#5a3a20'); pb.rect(23, 16, 2, 8, '#5a3a20');
    pb.disc(9, 9, 3.5, '#c8e0e8'); pb.disc(9, 10, 2.2, i ? '#c070ff' : '#7ad050'); pb.rect(8, 2, 2, 5, '#c8e0e8');
    pb.line(10, 3, 17, 6, '#a8c0c8'); pb.rect(16, 7, 5, 6, '#a07a48'); pb.disc(22, 11, 1.5, '#e04848');
    if (i) { pb.set(8, 1, '#e0b0ff'); pb.set(10, 0, '#e0b0ff'); }
  }),
  mine_mechanism: () => frames(2, 26, 28, (pb, i) => {
    pb.ellipse(13, 26, 12, 2, '#1a1614');
    pb.rect(3, 4, 3, 22, '#5a4028'); pb.rect(20, 4, 3, 22, '#5a4028'); pb.rect(3, 3, 20, 3, '#6e5032');
    pb.ring(13, 15, 6, '#8a8a96', 2); pb.disc(13, 15, 2, '#5a5a66');
    for (let k = 0; k < 6; k++) { const t = k / 6 * Math.PI * 2 + (i ? 0.3 : 0); pb.set(13 + Math.cos(t) * 7, 15 + Math.sin(t) * 7, '#8a8a96'); }
    if (i) { pb.vline(13, 6, 9, '#c0a060'); pb.disc(13, 15, 1, '#f0d060'); }
    else { pb.line(15, 8, 19, 2, '#6a6a76'); pb.set(9, 21, '#3a3a44'); pb.set(17, 22, '#3a3a44'); }
  }),
  old_tools: () => frames(2, 22, 14, (pb, i) => {
    pb.ellipse(11, 10, 10, 4, '#5a524a'); pb.ellipse(9, 9, 5, 3, '#6a625a'); pb.ellipse(15, 10, 4, 2.5, '#4a443e');
    if (!i) { pb.line(4, 4, 14, 9, '#6a4628'); pb.poly([[2, 6], [5, 2], [7, 4]], '#9a9aa6'); pb.disc(17, 6, 1.8, '#f0c060'); pb.rect(16, 3, 3, 2, '#5a5a66'); }
  }),
  murky_pool: () => frames(2, 24, 14, (pb, i) => {
    pb.ellipse(12, 7, 11, 6, i ? '#3a6a5a' : '#2a2a20'); pb.ellipse(12, 7, 9, 4.5, i ? '#4a9ab0' : '#3a2a3a');
    if (i) { pb.hline(8, 13, 6, '#a8e0f0'); pb.set(15, 8, '#e0faff'); }
    else { pb.set(8, 6, '#7a3a8a'); pb.set(14, 8, '#7a3a8a'); pb.disc(11, 7, 1.2, '#5a2a4a'); pb.set(16, 5, '#8be06a'); }
  }),
  prayer_stone: () => frames(2, 16, 24, (pb, i) => {
    pb.ellipse(8, 22, 7, 2, '#1e2420');
    pb.poly([[2, 22], [3, 5], [8, 1], [13, 5], [14, 22]], '#7a7a6e'); pb.poly([[4, 21], [5, 6], [8, 3], [9, 21]], '#8e8e82');
    const c = i ? '#7af0ff' : '#4a4a40';
    pb.hline(5, 11, 8, c); pb.hline(5, 10, 11, c); pb.hline(6, 11, 14, c); pb.hline(5, 9, 17, c); pb.set(3, 19, '#4a7a3a');
  }),
  broken_wagon: () => frames(2, 32, 20, (pb, i) => {
    pb.ellipse(16, 18, 15, 2, '#1a1414');
    pb.rect(4, 6, 24, 7, '#7a5232'); pb.hline(4, 27, 6, '#9a6a42'); pb.rect(6, 2, 6, 4, '#c8b088'); pb.rect(14, 3, 5, 3, '#8a6a42');
    pb.disc(9, 15, 3.5, '#4a3020'); pb.disc(9, 15, 1.2, '#8a6a42');
    if (i) { pb.disc(24, 15, 3.5, '#4a3020'); pb.disc(24, 15, 1.2, '#c0a060'); pb.line(28, 10, 31, 12, '#6a4628'); }
    else { pb.ellipse(27, 16, 3, 1.5, '#4a3020'); pb.line(22, 13, 28, 17, '#2a1a10'); pb.set(25, 9, '#ff6a2a'); }
  }),
  fire_trace: () => frames(2, 18, 12, (pb, i) => {
    const c = i ? '#f0d060' : '#2a1a14';
    pb.ellipse(9, 6, 7, 3.5, '#3a2a24'); pb.ellipse(9, 6, 5, 2.4, c);
    pb.set(4, 4, '#ff6a2a'); pb.set(14, 7, '#ff8a2a'); pb.set(9, 3, '#ffd060');
  }, false),
  frost_manuscript: () => frames(2, 18, 18, (pb, i) => {
    pb.ellipse(9, 15, 8, 2.5, '#c8dce8');
    pb.poly([[2, 15], [4, 5], [9, 2], [15, 5], [16, 15]], '#a8d0e8'); pb.poly([[4, 14], [5, 6], [9, 4], [10, 14]], '#c8e8f8');
    if (!i) { pb.rect(6, 7, 6, 6, '#e8dcb8'); pb.hline(7, 11, 9, '#6a5a3a'); pb.hline(7, 10, 11, '#6a5a3a'); }
    pb.set(13, 6, '#ffffff');
  }),
  // V3 olay hedefleri
  caravan: () => frames(2, 40, 26, (pb, i) => {
    pb.ellipse(20, 24, 19, 2, '#1a1414');
    // öküz
    pb.ellipse(33, 15, 6, 4, '#8a6a4a'); pb.disc(38, 13, 2.6, '#7a5a3a'); pb.set(40, 12, '#1a1418'); pb.line(36, 10, 35, 8, '#e8dcc0');
    for (const [x, o] of [[30, 0], [35, 1]]) pb.rect(x, 18 + ((i + o) % 2), 2, 5 - ((i + o) % 2), '#5a3e28');
    // araba
    pb.rect(3, 9, 22, 8, '#8a5a32'); pb.hline(3, 24, 9, '#a87040'); pb.poly([[4, 9], [8, 1], [20, 1], [24, 9]], '#e8dcb8'); pb.line(8, 1, 6, 9, '#c8bc98'); pb.line(14, 1, 14, 9, '#c8bc98');
    pb.line(25, 13, 29, 14, '#5a3a20');
    for (const x of [8, 20]) { pb.disc(x, 19, 3.5, '#4a3020'); pb.disc(x, 19, 1.2, '#8a6a42'); pb.set(x + (i ? 2 : -2), 19, '#8a6a42'); }
  }),
  saplings: () => frames(2, 32, 26, (pb, i) => {
    pb.ellipse(16, 23, 15, 3, '#4a3424');
    for (const [x, h] of [[7, 12], [16, 16], [25, 11]]) {
      pb.vline(x, 23 - h, 22, '#6a4a2a');
      pb.disc(x, 23 - h, 4, i ? '#5fd068' : '#4a9a3e'); pb.disc(x - 1, 22 - h, 2, '#7ae080');
      pb.set(x + 2, 25 - h, '#3a7a2e');
    }
    pb.rect(2, 20, 28, 1, '#8a6a42'); for (let x = 3; x < 30; x += 6) pb.vline(x, 18, 22, '#8a6a42');
  }),
  camp_crates: () => frames(1, 32, 24, (pb) => {
    pb.ellipse(16, 22, 15, 2, '#1a1414');
    pb.rect(2, 10, 11, 11, '#8a5a32'); pb.rect(2, 10, 11, 2, '#a87040'); pb.line(2, 12, 12, 20, '#5a3a20');
    pb.rect(13, 6, 10, 15, '#7a5232'); pb.rect(13, 6, 10, 2, '#9a6a42'); pb.line(13, 8, 22, 20, '#5a3a20');
    pb.ellipse(27, 15, 4, 6, '#6a4a2a'); pb.hline(23, 30, 12, '#3a2a1a'); pb.hline(23, 30, 18, '#3a2a1a');
    pb.rect(5, 4, 6, 6, '#c8b088'); pb.hline(5, 10, 6, '#8a6a42');
  }),
  refugee_tent: () => frames(1, 36, 30, (pb) => {
    pb.ellipse(18, 28, 17, 2, '#1a1414');
    pb.poly([[3, 27], [18, 3], [33, 27]], '#8a7a5a'); pb.poly([[18, 3], [33, 27], [24, 27]], '#6e6046');
    pb.poly([[14, 27], [18, 14], [22, 27]], '#2a2218'); pb.vline(18, 1, 4, '#5a4028');
    pb.rect(1, 24, 7, 3, '#5a6a8a'); pb.rect(28, 25, 7, 2, '#8a4a3a');
  }),
  temple_seal: () => frames(3, 24, 30, (pb, i) => {
    pb.ellipse(12, 28, 10, 2, '#34405a');
    pb.rect(5, 12, 14, 16, '#5a6a80'); pb.rect(4, 10, 16, 3, '#7a8aa0'); pb.hline(4, 19, 10, '#a8c0d8');
    const c = i === 0 ? '#7ad8ff' : i === 1 ? '#ffffff' : '#3a4a5a';
    pb.ring(12, 19, 5, c); pb.line(12, 14, 12, 24, c); pb.line(7, 19, 17, 19, c);
    if (i < 2) { pb.poly([[9, 10], [12, 1], [15, 10]], '#9fe8ff'); pb.vline(12, 3, 9, '#ffffff'); }
    else { pb.poly([[9, 10], [10, 6], [12, 8], [14, 5], [15, 10]], '#5a7a9a'); pb.line(8, 14, 16, 26, '#2a3444'); }
  }),
  frost_gate: () => frames(2, 48, 48, (pb, i) => {
    pb.rect(2, 8, 44, 40, '#4a6a8a'); pb.poly([[2, 10], [24, 0], [46, 10]], '#6a8aa8'); pb.hline(4, 44, 9, '#e8f6ff');
    pb.rect(10, 16, 28, 32, i ? '#0a1420' : '#2a3e56');
    if (!i) { for (let x = 12; x < 38; x += 6) pb.vline(x, 16, 47, '#9fc8e8'); pb.hline(10, 37, 30, '#9fc8e8');
      pb.disc(24, 30, 6, '#3a6a9a'); pb.ring(24, 30, 6, '#9fe8ff'); pb.set(24, 30, '#ffffff'); }
    else { pb.disc(24, 34, 9, '#14243a'); pb.disc(24, 34, 5, '#2a5a8a'); }
    for (let y = 12; y < 46; y += 6) { pb.rect(3, y, 6, 4, '#5a7a9a'); pb.rect(39, y, 6, 4, '#5a7a9a'); }
    pb.poly([[6, 8], [8, 14], [10, 8]], '#e0faff'); pb.poly([[38, 8], [40, 15], [42, 8]], '#e0faff');
    pb.set(24, 4, '#9fe8ff');
  }),
  // ---------------- V3 nesneleri (0: etkin, 1: tamamlandı)
  crypt_gate: () => frames(2, 48, 48, (pb, i) => {
    pb.rect(2, 8, 44, 40, '#26222e'); pb.poly([[2, 10], [24, 0], [46, 10]], '#34303e'); pb.hline(4, 44, 9, '#6a5a82');
    pb.rect(10, 16, 28, 32, i ? '#08060c' : '#1a1622');
    if (!i) { for (let x = 12; x < 38; x += 6) pb.vline(x, 16, 47, '#4a4058'); pb.hline(10, 37, 30, '#4a4058');
      pb.disc(24, 30, 6, '#3a1e5a'); pb.ring(24, 30, 6, '#a070e0'); pb.set(24, 30, '#e0c8ff'); }
    else { pb.disc(24, 34, 9, '#120a1c'); pb.disc(24, 34, 5, '#3a2060'); pb.set(24, 34, '#a070e0'); }
    for (let y = 12; y < 46; y += 6) { pb.rect(3, y, 6, 4, '#34303e'); pb.rect(39, y, 6, 4, '#34303e'); }
    pb.poly([[18, 8], [20, 3], [22, 6], [24, 2], [26, 6], [28, 3], [30, 8]], '#c8a050');   // kırık taç
  }),
  royal_seal_dg: () => frames(3, 24, 30, (pb, i) => {
    pb.ellipse(12, 28, 10, 2, '#141018');
    pb.rect(5, 12, 14, 16, '#3a3446'); pb.rect(4, 10, 16, 3, '#5a4e66'); pb.hline(4, 19, 10, '#8a7a9a');
    const c = i === 0 ? '#a070e0' : i === 1 ? '#ffffff' : '#2e2a38';
    pb.ring(12, 19, 5, c); pb.line(12, 14, 12, 24, c); pb.line(7, 19, 17, 19, c);
    if (i < 2) { pb.poly([[9, 10], [12, 1], [15, 10]], '#c0a0f0'); pb.vline(12, 3, 9, '#ffffff'); }
    else { pb.poly([[9, 10], [10, 6], [12, 8], [14, 5], [15, 10]], '#4a4058'); pb.line(8, 14, 16, 26, '#1a1620'); }
  }),
  crypt_lever: () => frames(3, 20, 26, (pb, i) => {
    pb.ellipse(10, 24, 8, 2, '#141018');
    pb.rect(3, 12, 14, 12, '#34303e'); pb.rect(2, 10, 16, 3, '#4a4458'); pb.hline(2, 17, 10, '#6a5a82');
    const c = i === 2 ? '#3a3448' : i === 1 ? '#ffffff' : '#a070e0';
    pb.ring(10, 18, 3, c); pb.set(10, 18, c);
    if (i < 2) { pb.line(10, 10, 5, 2, '#8a8494'); pb.disc(5, 2, 1.6, '#c8a050'); }
    else { pb.line(10, 10, 15, 2, '#8a8494'); pb.disc(15, 2, 1.6, '#6a6472'); }
  }),
  house_door: () => frames(2, 16, 22, (pb, i) => {
    pb.rect(2, 2, 12, 20, '#3e3228'); pb.rect(3, 3, 10, 19, i ? '#120e10' : '#5a4632');
    if (!i) { pb.vline(8, 3, 21, '#3e3228'); pb.set(11, 12, '#c8a050'); pb.line(4, 6, 12, 18, '#2e2620'); }
    else pb.line(4, 21, 6, 14, '#5a4632');
  }),
  royal_clue: () => frames(2, 16, 14, (pb, i) => {
    pb.ellipse(8, 12, 6, 1.6, '#2a2630');
    pb.rect(3, 6, 10, 6, i ? '#5a4e44' : '#7a5a3a'); pb.hline(3, 12, 6, '#a07a48');
    pb.poly([[5, 6], [6, 2], [8, 4], [10, 1], [11, 6]], i ? '#7a6a40' : '#f0c850'); if (!i) pb.set(8, 3, '#ffffff');
  }),
  old_record: () => frames(2, 14, 12, (pb, i) => {
    pb.poly([[1, 9], [3, 3], [12, 2], [13, 8], [4, 11]], i ? '#8a8270' : '#d8ccb0');
    pb.hline(4, 10, 5, '#5a4e40'); pb.hline(4, 9, 7, '#5a4e40'); if (!i) pb.set(11, 4, '#8a2a2a');
  }),
  black_lock: () => frames(2, 20, 26, (pb, i) => {
    pb.rect(3, 4, 14, 20, '#1e1a26'); pb.rect(4, 5, 12, 18, '#2e2a38'); pb.hline(3, 16, 4, '#6a5a82');
    pb.ring(10, 13, 4, i ? '#c8a050' : '#7a4ac0'); pb.rect(9, 12, 2, 4, i ? '#c8a050' : '#120e18');
    if (!i) { pb.set(10, 8, '#a070e0'); pb.set(6, 20, '#a070e0'); pb.set(14, 20, '#a070e0'); }
  }),
  royal_seal: () => frames(2, 24, 30, (pb, i) => {
    pb.ellipse(12, 28, 10, 2, '#141018');
    pb.rect(5, 12, 14, 16, '#3a3446'); pb.rect(4, 10, 16, 3, '#5a4e66'); pb.hline(4, 19, 10, '#8a7a9a');
    const c = i ? '#c8a050' : '#5a3a7a';
    pb.ring(12, 19, 5, c); pb.line(12, 14, 12, 24, c); pb.line(7, 19, 17, 19, c);
    if (i) { pb.poly([[9, 10], [12, 1], [15, 10]], '#e0c070'); pb.vline(12, 3, 9, '#fff0c0'); }
    else { pb.poly([[9, 10], [10, 6], [12, 8], [14, 5], [15, 10]], '#4a4058'); pb.line(8, 14, 16, 26, '#1a1620'); }
  }),
  marker_stone: () => frames(2, 16, 24, (pb, i) => {
    pb.ellipse(8, 22, 7, 2, '#141018');
    pb.poly([[3, 22], [4, 6], [8, 2], [12, 6], [13, 22]], '#5a5466'); pb.poly([[5, 20], [6, 7], [8, 4], [9, 20]], '#7a748a');
    pb.hline(6, 10, 10, i ? '#c8a050' : '#3a3446'); pb.hline(6, 10, 13, i ? '#c8a050' : '#3a3446');
  }),
  stone_tablet: () => frames(2, 16, 18, (pb, i) => {
    pb.ellipse(8, 16, 6, 1.6, '#141018');
    pb.rect(3, 3, 10, 13, i ? '#5a5250' : '#7a706a'); pb.ellipse(8, 3, 5, 2, i ? '#5a5250' : '#7a706a');
    for (let y = 5; y < 14; y += 2) pb.hline(5, 11, y, '#3e3836'); if (!i) pb.set(11, 4, '#ff8a2a');
  }),
  royal_chest: () => frames(2, 18, 14, (pb, i) => {
    pb.rect(2, 5, 14, 8, '#4a2e3a'); pb.hline(2, 15, 9, '#c8a050'); pb.vline(9, 5, 12, '#c8a050');
    if (!i) { pb.poly([[2, 5], [4, 1], [14, 1], [16, 5]], '#5e3a4a'); pb.set(9, 8, '#ffffff'); }
    else { pb.poly([[2, 5], [3, 0], [15, 0], [16, 5]], '#2e1a24'); pb.rect(4, 3, 10, 2, '#120a10'); }
  }),
  ore_dark_ore: () => frames(1, 20, 16, (pb) => {
    pb.poly([[1, 15], [3, 5], [9, 1], [16, 3], [19, 15]], '#26222c'); pb.poly([[4, 13], [5, 6], [9, 3], [14, 5], [16, 13]], '#3a3444');
    for (const [x, y] of [[7, 7], [12, 9], [9, 11], [14, 6]]) { pb.set(x, y, '#8a6ab0'); pb.set(x + 1, y, '#c0a0f0'); }
  }),
  ore_obsidian_ore: () => frames(1, 20, 16, (pb) => {
    pb.poly([[1, 15], [4, 4], [8, 1], [13, 2], [19, 15]], '#14101a'); pb.poly([[4, 13], [6, 5], [9, 3], [13, 4], [16, 13]], '#2a2434');
    pb.line(7, 5, 11, 12, '#6a5a82'); pb.line(12, 5, 14, 10, '#4a4058'); pb.set(9, 4, '#e0c8ff');
  }),
  ore_soul_crystal: () => frames(1, 20, 16, (pb) => {
    pb.ellipse(10, 14, 8, 2, '#1a1622');
    pb.poly([[4, 14], [6, 5], [8, 1], [10, 6], [11, 14]], '#7a4ac0'); pb.vline(7, 4, 12, '#e0c8ff');
    pb.poly([[10, 14], [13, 6], [15, 3], [16, 8], [17, 14]], '#a070e0'); pb.set(15, 5, '#ffffff');
  }),
  herb_mourning_herb: () => frames(1, 14, 12, (pb) => {
    pb.ellipse(7, 8, 6, 4, '#3a3a40'); for (let i = 0; i < 5; i++) pb.line(7, 10, 2 + i * 2.5, 3 + (i % 2) * 2, '#6a6a78');
    pb.set(4, 4, '#c8c8e0'); pb.set(10, 3, '#c8c8e0'); pb.set(7, 2, '#a070e0');
  }),
  lava_pool: () => frames(3, 32, 18, (pb, i) => {
    pb.ellipse(16, 9, 15, 8, '#2a1410'); pb.ellipse(16, 9, 13, 6.5, '#c8401a');
    for (let k = 0; k < 5; k++) pb.ellipse(6 + k * 5, 7 + ((k + i) % 3), 2, 1, '#ff8a2a');
    pb.set(10 + i * 4, 8, '#ffe070');
  }, false),

};

// -------------------------------------------------------------- efektler
export const EFFECT_SPRITES = {
  slash: () => frames(3, 32, 32, (pb, i) => {
    const a0 = -1.6 + i * 0.5, a1 = a0 + 1.6;
    for (let r = 10; r < 15; r++) for (let t = a0; t < a1; t += 0.03) {
      const fade = (t - a0) / (a1 - a0);
      pb.set(16 + Math.cos(t) * r, 16 + Math.sin(t) * r, r > 12 ? '#ffffff' : '#c0e0ff', Math.round(255 * fade));
    }
  }, false),
  spark: () => frames(3, 16, 16, (pb, i) => {
    const r = 2 + i * 2.5;
    for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; pb.line(8 + Math.cos(t) * r * 0.4, 8 + Math.sin(t) * r * 0.4, 8 + Math.cos(t) * r, 8 + Math.sin(t) * r, i < 2 ? '#fff4c0' : '#f0a040'); }
    if (i === 0) pb.disc(8, 8, 2.5, '#ffffff');
  }, false),
  fireball: () => frames(2, 14, 14, (pb, i) => {
    pb.disc(7, 7, 5.5, '#e04a1a'); pb.disc(7 + i * 0.5, 7, 4, '#f09030'); pb.disc(8, 6, 2.2, '#fff0a0');
    for (let k = 0; k < 4; k++) pb.set(hash(k, i) * 4, 4 + hash(i, k) * 6, '#f0a030');
  }, false),
  ore_bolt: () => frames(2, 10, 10, (pb, i) => { pb.disc(5, 5, 3.5, '#ff8a2a'); pb.disc(5, 5, 2, '#ffe0a0'); pb.set(1 + i, 5, '#ff8a2a'); }, false),
  mist_bolt: () => frames(2, 10, 10, (pb, i) => { pb.disc(5, 5, 3.5, '#3ad0a0'); pb.disc(5, 5, 2, '#c0ffe8'); pb.set(1 + i, 4, '#3ad0a0'); }, false),
  arcane_bolt: () => frames(2, 10, 10, (pb, i) => { pb.disc(5, 5, 3.2, '#7a8aff'); pb.disc(5, 5, 1.8, '#e0e8ff'); pb.set(1 + i, 5, '#a0b0ff'); }, false),
  crimson: () => frames(3, 24, 24, (pb, i) => {
    const r = 4 + i * 3;
    pb.ring(12, 12, r, '#ff3a2a', 2); pb.disc(12, 12, Math.max(1, 5 - i * 2), '#ffd060');
  }, false),
  spirit: () => frames(3, 24, 24, (pb, i) => {
    const r = 4 + i * 3;
    pb.ring(12, 12, r, '#80e0ff', 2); pb.ring(12, 12, Math.max(1, r - 4), '#e0faff', 1);
  }, false),
  ice: () => frames(3, 48, 48, (pb, i) => {
    for (let k = 0; k < 10; k++) {
      const t = k / 10 * Math.PI * 2 + i * 0.2, r = 6 + i * 7 + hash(k, 1) * 4;
      const x = 24 + Math.cos(t) * r, y = 24 + Math.sin(t) * r;
      pb.poly([[x - 2, y + 2], [x, y - 4], [x + 2, y + 2]], '#a0e0ff'); pb.set(x, y - 2, '#ffffff');
    }
    pb.disc(24, 24, Math.max(2, 10 - i * 4), '#e0f8ff', 180);
  }, false),
  meteor: () => frames(2, 20, 28, (pb, i) => {
    for (let k = 0; k < 10; k++) pb.disc(8 - k * 0.4 + hash(k, i) * 2, 6 - k * 0.6, 3 - k * 0.25, k < 4 ? '#f0b030' : '#e05a20', 220 - k * 18);
    pb.disc(10, 18, 7, '#5a3a2a'); pb.disc(9, 17, 5, '#7a4a32'); pb.disc(12, 20, 3, '#f06020'); pb.set(8, 15, '#ffd080');
  }, false),
  explosion: () => frames(4, 48, 48, (pb, i) => {
    const r = 6 + i * 6;
    pb.disc(24, 24, r, i < 2 ? '#f09030' : '#c04a20', i < 3 ? 230 : 120);
    pb.disc(24, 24, r * 0.65, i < 2 ? '#fff0a0' : '#f09030', 220);
    for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; pb.disc(24 + Math.cos(t) * r, 24 + Math.sin(t) * r, 2, '#5a4a4a', 150); }
  }, false),
  levelup: () => frames(4, 32, 64, (pb, i) => {
    for (let y = 0; y < 64; y++) {
      const w = 6 + Math.sin(y * 0.2 + i) * 2;
      pb.hline(16 - w, 16 + w, y, '#ffe060', Math.round(140 * (y / 64)));
    }
    for (let k = 0; k < 8; k++) pb.set(6 + hash(k, i) * 20, hash(i, k) * 60, '#ffffff');
  }, false),
  beam: () => frames(2, 16, 64, (pb, i) => {
    for (let y = 0; y < 64; y++) pb.hline(8 - 3, 8 + 3, y, '#ffffff', Math.round(170 * (y / 64)));
    pb.set(8, 10 + i * 20, '#ffffff');
  }, false),
  sparkle: () => frames(3, 8, 8, (pb, i) => {
    const s = 1 + (i === 1 ? 2 : 1);
    pb.hline(4 - s, 4 + s, 4, '#ffffff'); pb.vline(4, 4 - s, 4 + s, '#ffffff'); pb.set(4, 4, '#fff8c0');
  }, false),
  poison: () => frames(3, 12, 12, (pb, i) => { pb.disc(4, 9 - i * 2, 2, '#7ad050'); pb.disc(8, 7 - i, 1.5, '#a0f070'); }, false),
  stun: () => frames(3, 20, 8, (pb, i) => {
    for (let k = 0; k < 3; k++) { const t = k / 3 * Math.PI * 2 + i * 0.7; const x = 10 + Math.cos(t) * 7, y = 4 + Math.sin(t) * 2.5; pb.set(x, y, '#ffe060'); pb.set(x + 1, y, '#ffffff'); pb.set(x, y - 1, '#ffe060'); }
  }, false),
  aura_iron: () => frames(2, 32, 40, (pb, i) => {
    pb.ellipse(16, 22, 14, 18, '#c0c8d0', 50 + i * 20); pb.ring(16, 22, 14, '#e0e8f0');
  }, false),
  aura_mana: () => frames(2, 32, 40, (pb, i) => { pb.ellipse(16, 22, 14, 18, '#4a8aff', 60 + i * 20); pb.ellipse(16, 22, 13, 17, '#80c0ff', 30); }, false),
  aura_will: () => frames(2, 32, 40, (pb, i) => { pb.ellipse(16, 22, 14, 18, '#ffd060', 60 + i * 20); }, false),
  heal: () => frames(3, 16, 16, (pb, i) => { pb.rect(6, 4 - i, 4, 10, '#7af070'); pb.rect(3, 7 - i, 10, 4, '#7af070'); pb.rect(7, 5 - i, 2, 8, '#d0ffd0'); }, false),
  px: () => frames(1, 2, 2, (pb) => pb.rect(0, 0, 2, 2, '#ffffff'), false),
  soft: () => frames(1, 16, 16, (pb) => { for (let r = 8; r > 0; r--) pb.disc(8, 8, r, '#ffffff', Math.round(255 * (1 - r / 8) * 0.9)); }, false),
  mist: () => frames(1, 48, 24, (pb) => { for (let k = 0; k < 6; k++) pb.ellipse(10 + k * 6, 12 + Math.sin(k) * 3, 10, 6, '#c8d8d0', 22); }, false),
  firefly: () => frames(2, 4, 4, (pb, i) => { pb.rect(1, 1, 2, 2, i ? '#f0ff90' : '#c0e060'); }, false),
  // ---------------- V2 efektleri
  ember_bolt: () => frames(2, 12, 10, (pb, i) => { pb.disc(7, 5, 3.5, '#e04a1a'); pb.disc(7, 5, 2, '#ffd060'); pb.set(2 + i, 5, '#ff8a2a'); pb.set(1, 4 + i, '#8a8480'); }, false),
  frost_bolt: () => frames(2, 12, 10, (pb, i) => { pb.poly([[1, 5], [7, 2], [11, 5], [7, 8]], '#7ad8ff'); pb.line(3, 5, 10, 5, '#ffffff'); pb.set(1 + i, 4, '#c8f0ff'); }, false),
  // V3
  bone_arrow: () => frames(2, 14, 8, (pb, i) => { pb.hline(1, 10, 4, '#d8d0bc'); pb.poly([[10, 2], [13, 4], [10, 6]], '#e8e0cc'); pb.line(1, 2 + i, 3, 4, '#a070e0'); pb.line(1, 6 - i, 3, 4, '#a070e0'); }, false),
  void_bolt: () => frames(2, 12, 12, (pb, i) => { pb.disc(7, 6, 4, '#3a1e5a'); pb.disc(7, 6, 2.4, '#a070e0'); pb.set(7, 6, '#ffffff'); pb.set(2 + i, 5, '#7a4ac0'); pb.set(1, 7 - i, '#5a3a7a'); }, false),
  void_ground: () => frames(3, 32, 16, (pb, i) => {
    pb.ellipse(16, 10, 15, 5, '#140a1e', 210); pb.ellipse(16, 10, 12, 3.5, '#3a1e5a', 220);
    for (let k = 0; k < 6; k++) { const x = 4 + k * 5, h = 2 + ((k + i) % 3) * 2; pb.poly([[x - 1.5, 10], [x, 10 - h], [x + 1.5, 10]], k % 2 ? '#a070e0' : '#e0c8ff'); }
  }, false),
  dark_missile: () => frames(1, 10, 20, (pb) => { pb.poly([[5, 19], [1, 8], [5, 0], [9, 8]], '#2a1a3a'); pb.poly([[5, 17], [3, 8], [5, 3], [7, 8]], '#a070e0'); pb.vline(5, 5, 14, '#e0c8ff'); }, false),
  chain: () => frames(3, 16, 16, (pb, i) => { pb.line(0, 8, 5, 4 + i, '#e0e8ff'); pb.line(5, 4 + i, 10, 12 - i, '#9ab0ff'); pb.line(10, 12 - i, 15, 8, '#e0e8ff'); pb.set(5, 4 + i, '#ffffff'); }, false),
  blade: () => frames(1, 10, 22, (pb) => { pb.rect(4, 0, 2, 14, '#d8e0e8'); pb.vline(4, 0, 13, '#ffffff'); pb.rect(1, 14, 8, 2, '#c0a040'); pb.rect(4, 16, 2, 5, '#5a3a20'); pb.poly([[4, 0], [5, -2], [6, 0]], '#ffffff'); }),
  fire_ground: () => frames(3, 32, 16, (pb, i) => {
    pb.ellipse(16, 10, 15, 5, '#5a1a0a', 200); pb.ellipse(16, 10, 12, 3.5, '#c8401a', 220);
    for (let k = 0; k < 6; k++) { const x = 4 + k * 5, h = 3 + ((k + i) % 3) * 2; pb.poly([[x - 2, 10], [x, 10 - h], [x + 2, 10]], k % 2 ? '#ff8a2a' : '#ffd060'); }
  }, false),
  ice_spike: () => frames(1, 16, 30, (pb) => {
    pb.poly([[3, 0], [8, 29], [13, 0]], '#7ad8ff'); pb.poly([[6, 0], [8, 22], [10, 0]], '#e0faff'); pb.outline('#2a4a6a');
  }, false),
  ash_puff: () => frames(3, 24, 24, (pb, i) => { for (let k = 0; k < 7; k++) { const t = k / 7 * Math.PI * 2; const r = 3 + i * 3; pb.disc(12 + Math.cos(t) * r, 12 + Math.sin(t) * r * 0.7, 3 - i * 0.6, k % 2 ? '#8a8480' : '#5a5250', 200 - i * 50); } if (i === 0) pb.set(12, 12, '#ff7a2a'); }, false),
  shatter: () => frames(3, 28, 28, (pb, i) => { for (let k = 0; k < 9; k++) { const t = k / 9 * Math.PI * 2 + k; const r = 2 + i * 4 + hash(k, 2) * 3; const x = 14 + Math.cos(t) * r, y = 14 + Math.sin(t) * r; pb.poly([[x - 1.5, y + 1.5], [x, y - 2.5], [x + 1.5, y + 1.5]], k % 2 ? '#c8f0ff' : '#7ad8ff'); } }, false),
  frost_mark: () => frames(2, 20, 10, (pb, i) => { pb.ring(10, 5, 4 + i, '#9fe8ff'); pb.set(10, 5, '#ffffff'); pb.set(5, 5, '#e0faff'); pb.set(15, 5, '#e0faff'); }, false),
};

// Telegraf şekilleri ve ışık dokuları canvas ile (yumuşak kenarlı)
export function makeSoftCircle(size, inner = '#ffffff', alpha = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

export function makeVignette(w, h, strength) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.18, w / 2, h / 2, Math.max(w, h) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(4,2,10,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return c;
}

export function makeTelegraphTex(kind) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S; c.height = kind === 'rect' ? 32 : S;
  const ctx = c.getContext('2d');
  if (kind === 'circle') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
  } else if (kind === 'fill') {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'rect') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 2, S, 28);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.strokeRect(1, 2, S - 2, 28);
  } else if (kind === 'ring') {
    ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 8, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
  } else if (kind === 'cone') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(S / 2, S / 2); ctx.arc(S / 2, S / 2, S / 2 - 2, -Math.PI / 3, Math.PI / 3); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
  }
  return c;
}
