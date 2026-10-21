// Haritalar, savaş, boss telegrafları — tarayıcıda senaryo testi (debug API ile hızlandırılmış)
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/?dev=1';
const cls = process.argv[3] || 'mage';
const out = '/tmp/claude-0/sc-' + cls;
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + e.stack));
const shot = (n) => p.screenshot({ path: `${out}-${n}.png` });
const ev = (fn, arg) => p.evaluate(fn, arg);
await p.goto(url);
await p.waitForSelector('[data-testid=menu-play]', { timeout: 30000 });
await p.tap('[data-testid=menu-play]'); await p.waitForTimeout(200);
await p.tap('[data-testid=create-char]'); await p.tap('[data-testid=class-' + cls + ']');
await p.fill('[data-testid=name-input]', 'Senaryo'); await p.tap('[data-testid=create-confirm]');
await p.waitForTimeout(1500);
const waitMap = async (id) => { try { await p.waitForFunction((id) => window.__AHEN.world?.mapId === id && window.__AHEN.world.player, id, { timeout: 15000 }); } catch (e) { console.log('HARİTA BEKLEME HATASI', id, errs.join('\n')); await shot('fail-' + id); throw e; } await p.waitForTimeout(800); };
const fight = async (enemyId, ms = 8000) => ev(async ([enemyId, ms]) => {
  const w = window.__AHEN.world;
  const e = w.enemies.filter(x => !x.dead && x.tpl.id === enemyId).sort((a,b)=>Math.hypot(a.x-w.player.x,a.y-w.player.y)-Math.hypot(b.x-w.player.x,b.y-w.player.y))[0];
  if (!e) return 'yok';
  const hp0 = e.hp; w.player.selectTarget(e);
  const t0 = performance.now();
  while (performance.now() - t0 < ms && !e.dead) {
    await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < 4; i++) w.player.useSkill(i);
    const st = window.__AHEN.stats(); if (window.__AHEN.char.hp < st.maxHp * 0.6) window.__AHEN.char.hp = st.maxHp; window.__AHEN.char.mp = st.maxMp;
  }
  return { enemy: enemyId, hp0, hp: e.hp, dead: e.dead, secs: ((performance.now()-t0)/1000).toFixed(1), php: Math.round(window.__AHEN.char.hp) };
}, [enemyId, ms]);
// orman
await ev(() => window.__AHEN.world.changeMap('forest', 'from_village')); await waitMap('forest');
await shot('forest');
console.log('rat', JSON.stringify(await fight('meadow_rat', 9000)));
await ev(() => { const { gainExp } = window.__AHEN_DBG || {}; });
// seviye ve ekipman (dev)
await ev(() => { const a = window.__AHEN; a.char.level = 11; a.char.skills.ice_blast = 1; a.char.skills.mana_shield = 1; a.char.skills.whirlwind = 1; a.char.skills.iron_skin = 1; a.changed('level'); });
console.log('wolf', JSON.stringify(await fight('gray_wolf', 9000)));
await shot('forest-fight');
// Alfa kurt yanına ışınlan
await ev(() => { const w = window.__AHEN.world; const al = w.enemies.find(e => e.tpl.id === 'alpha_wolf'); w.player.x = al.x - 120; w.player.y = al.y; });
await p.waitForTimeout(500);
const alpha = fight('alpha_wolf', 14000);
await p.waitForTimeout(6000); await shot('alpha');
console.log('alpha', JSON.stringify(await alpha));
// maden
await ev(() => window.__AHEN.world.changeMap('mine', 'from_forest')); await waitMap('mine'); await shot('mine');
console.log('goblin', JSON.stringify(await fight('pick_goblin', 8000)));
// bataklık
await ev(() => window.__AHEN.world.changeMap('swamp', 'from_mine')); await waitMap('swamp'); await shot('swamp');
// dungeon
await ev(() => { const a = window.__AHEN; a.char.world.dungeonUnlocked = true; a.char.level = 20; a.changed('level'); a.world.changeMap('dungeon', null, { enterDungeon: true }); });
await waitMap('dungeon'); await shot('dungeon');
await ev(() => { const w = window.__AHEN.world; const g = w.enemies.find(e => e.tpl.id === 'mine_golem'); w.player.x = g.x - 150; w.player.y = g.y + 60; });
const golem = fight('mine_golem', 16000);
await p.waitForTimeout(7000); await shot('golem');
console.log('golem', JSON.stringify(await golem));
console.log('stats', JSON.stringify(await ev(() => ({ fps: window.__AHEN.game.loop.actualFps, lvl: window.__AHEN.char.level, gold: window.__AHEN.char.gold, bag: window.__AHEN.char.bag.slots.filter(Boolean).map(s => s.tid + (s.q ? 'x' + s.q : ':' + s.r)) }))));
console.log(errs.join('\n') || 'hata yok');
await b.close();
