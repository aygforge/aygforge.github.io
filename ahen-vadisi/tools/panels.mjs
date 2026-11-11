// Arayüz panellerinin ekran görüntüleri (görsel inceleme)
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const url = process.argv[2] || 'http://localhost:5173/?dev=1';
const out = join(tmpdir(), 'ahen-panels');
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + e.stack));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const shot = (n) => p.screenshot({ path: `${out}-${n}.png` });
await p.goto(url);
await p.waitForSelector('[data-testid=menu-play]');
await shot('menu');
await p.tap('[data-testid=menu-play]'); await p.waitForTimeout(200);
await p.tap('[data-testid=create-char]'); await p.tap('[data-testid=class-mage]');
await p.fill('[data-testid=name-input]', 'Panelci'); await p.tap('[data-testid=create-confirm]');
await p.waitForTimeout(1500);
await p.evaluate(async () => {
  const a = window.__AHEN;
  const { gainExp } = await import('/src/systems/character.js');
  const { createItem } = await import('/src/systems/loot.js');
  const { addItem, addStack } = await import('/src/systems/inventory.js');
  gainExp(a.char, 12000);
  a.char.gold = 25000;
  for (const [t, r] of [['M04', 'R'], ['O05', 'U'], ['H05', 'R'], ['C07', 'R'], ['M08', 'L'], ['A04', 'E'], ['R04', 'R'], ['W03', 'R'], ['B05', 'U']]) addItem(a.char, createItem(t, r, a.rng));
  for (const m of ['iron', 'hardening_stone', 'healing_herb', 'empty_bottle', 'mana_herb', 'hp_m', 'mp_m', 'wolf_pelt']) addStack(a.char.bag, m, 12);
  a.char.quests.m01 = { s: 'active', p: [3], used: [] };
  a.changed('inventory');
});
await p.waitForTimeout(500);
for (const tab of ['inventory', 'character', 'skills', 'quests', 'map', 'settings']) {
  await p.evaluate((t) => { window.__AHEN.ui?.closePanel?.(); }, tab);
  await p.tap('[data-testid=btn-inventory]').catch(() => {});
  await p.waitForTimeout(300);
  const tabs = await p.$$('.tab');
  const idx = ['inventory', 'character', 'skills', 'quests', 'map', 'settings'].indexOf(tab);
  if (tabs[idx]) { await tabs[idx].scrollIntoViewIfNeeded(); await tabs[idx].tap(); }
  await p.waitForTimeout(400);
  await shot('tab-' + tab);
  if (tab === 'inventory') {
    const cells = await p.$$('.pb .grid .cell img');
    if (cells[0]) { await cells[0].tap(); await p.waitForTimeout(300); await shot('itemcard'); await p.tap('.card .acts .btn.ghost:last-child'); }
  }
  await p.tap('.xbtn');
  await p.waitForTimeout(200);
}
// NPC'ler
for (const [npc, svc] of [['boran', 'upgrade'], ['mira', 'shop'], ['elin', 'craft_healer'], ['keeper', 'storage'], ['hunter', 'contracts'], ['sage', 'reset_skills'], ['muhtar', 'quests']]) {
  await p.evaluate((n) => window.__AHEN.world && import('/src/core/events.js').then(({ bus }) => bus.emit('openNpc', n)), npc);
  await p.waitForTimeout(400);
  const btn = await p.$(`[data-testid=svc-${svc}]`);
  if (btn) await btn.tap();
  await p.waitForTimeout(300);
  await shot('npc-' + npc);
  if (npc === 'boran') { const up = await p.$('[data-testid=do-upgrade]'); if (up) { await up.tap(); await p.waitForTimeout(500); await shot('npc-boran-up'); } }
  if (npc === 'muhtar') { const t = await p.$('[data-testid=turnin-m01]'); if (t) { await t.tap(); await p.waitForTimeout(600); await shot('npc-muhtar-done'); } }
  await p.tap('.xbtn'); await p.waitForTimeout(200);
}
console.log(errs.join('\n') || 'hata yok');
await b.close();
