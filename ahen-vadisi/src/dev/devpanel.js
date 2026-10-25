// Geliştirici paneli — yalnızca ?dev=1 ile açıkça etkinleştirildiğinde görünür.
// Denge testi araçlarıdır; normal oyuncu deneyiminde bulunmaz.
import { h, clear } from '../ui/dom.js';
import { ui } from '../ui/ui.js';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { ITEM_LIST, ITEMS } from '../data/items.js';
import { ENEMIES } from '../data/enemies.js';
import { MAPS } from '../data/maps/index.js';
import { ALL_QUESTS } from '../data/quests.js';
import { cumulativeXp, TILE, MAX_LEVEL } from '../data/constants.js';
import { DUNGEON_INFO, unlockDungeon, exitRun } from '../systems/dungeon.js';
import { gainExp } from '../systems/character.js';
import { createItem, rollKillLoot } from '../systems/loot.js';
import { addItem, addStack } from '../systems/inventory.js';
import { estimateNormalDps } from '../systems/combat.js';
import { questStatus, acceptQuest } from '../systems/quests.js';
import { Rng } from '../core/rng.js';

export function devEnabled() {
  try { return new URLSearchParams(location.search).get('dev') === '1'; } catch { return false; }
}

export function mountDevButton() {
  const b = h('button', { class: 'devbtn', 'data-testid': 'dev-open', onTap: () => openDev() }, 'DEV');
  ui.layers.top.appendChild(b);
}

function openDev() {
  const out = h('pre');
  const log = (s) => { out.textContent = typeof s === 'string' ? s : JSON.stringify(s, null, 1); };
  const ch = app.char, w = app.world;
  const sel = (opts) => h('select', { class: 'sel' }, opts.map(([v, l]) => h('option', { value: v }, l)));
  const itemSel = sel(ITEM_LIST.map((t) => [t.id, `${t.id} ${t.name} [${t.rarity}]`]));
  const rarSel = sel([['', 'kanonik'], ['N', 'N'], ['U', 'U'], ['R', 'R'], ['E', 'E']]);
  const srcSel = sel(Object.values(ENEMIES).filter((e) => e.lootTable).map((e) => [e.id, e.name]));
  const mapSel = sel(Object.keys(MAPS).map((k) => [k, MAPS[k].name]));
  const lvlIn = h('input', { class: 'name', type: 'number', value: ch?.level || 1, style: { width: '90px' } });
  const box = h('div', { class: 'panel frame dev', style: { inset: '4%' } },
    h('div', { class: 'ph' }, h('h3', { class: 't grow' }, 'Geliştirici Paneli'), h('button', { class: 'xbtn', onTap: () => ui.closeModal() }, '×')),
    h('div', { class: 'pb scroll' },
      h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        'Seviye', lvlIn, h('button', { class: 'btn small', onTap: () => {
          const L = Math.max(1, Math.min(MAX_LEVEL, +lvlIn.value));
          if (L > ch.level) gainExp(ch, cumulativeXp(L) - cumulativeXp(ch.level) - ch.exp);
          app.changed('level'); log(`Seviye ${ch.level}`);
        } }, 'Seviyeye çık'),
        h('button', { class: 'btn small', onTap: () => { ch.gold += 10000; app.changed('inventory'); log(`Gold ${ch.gold}`); } }, '+10.000 Gold')),
      h('div', { class: 'row', style: { flexWrap: 'wrap' } }, itemSel, rarSel, h('button', { class: 'btn small', onTap: () => {
        const t = ITEMS[itemSel.value];
        const r = rarSel.value && t.allowedRarities.includes(rarSel.value) ? rarSel.value : t.rarity;
        const inst = createItem(t.id, r, app.rng, { src: 'dev' });
        log(addItem(ch, inst)); app.changed('inventory');
      } }, 'Eşya oluştur'),
        h('button', { class: 'btn small', onTap: () => { for (const m of ['iron', 'hardening_stone', 'altar_crystal', 'ancient_core', 'empty_bottle', 'healing_herb', 'mana_herb', 'hp_l', 'mp_l']) addStack(ch.bag, m, 20); app.changed('inventory'); log('Materyaller eklendi'); } }, 'Materyal paketi'),
        h('button', { class: 'btn small', onTap: () => { for (const m of ['ash_steel', 'frost_essence', 'ember_core', 'mastery_book', 'hp_xl', 'mp_xl']) addStack(ch.bag, m, 10); app.changed('inventory'); log('V2 materyalleri eklendi'); } }, 'V2 materyal paketi')),
      h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        h('button', { class: 'btn small red', onTap: () => spawnNear('alpha_wolf') }, 'Alfa Kurt doğur'),
        h('button', { class: 'btn small red', onTap: () => spawnNear('mine_golem') }, 'Maden Golemi doğur'),
        h('button', { class: 'btn small', onTap: () => spawnNear('bandit_captain') }, 'Elit doğur'),
        h('button', { class: 'btn small red', onTap: () => spawnNear('ash_giant') }, 'Kül Devi doğur'),
        h('button', { class: 'btn small', onTap: () => spawnNear('ash_butcher') }, 'Kül Kasabı'),
        h('button', { class: 'btn small', onTap: () => spawnNear('ice_warden') }, 'Buz Gardiyanı'),
        h('button', { class: 'btn small', onTap: () => { for (let i = 0; i < 30; i++) spawnNear(['gray_wolf', 'pick_goblin', 'cave_bat', 'forest_raider'][i % 4], 6); log('Stres testi: 30 yaratık'); } }, 'Stres: 30 yaratık')),
      h('div', { class: 'row', style: { flexWrap: 'wrap' } }, mapSel, h('button', { class: 'btn small', onTap: () => {
        if (DUNGEON_INFO[mapSel.value]) { unlockDungeon(ch, mapSel.value); ui.closeModal(); w.changeMap(mapSel.value, null, { enterDungeon: true }); }
        else { ui.closeModal(); w.changeMap(mapSel.value, Object.keys(MAPS[mapSel.value].entries)[0]); }
      } }, 'Haritaya git'),
        h('button', { class: 'btn small', onTap: () => { for (const d of Object.keys(DUNGEON_INFO)) { unlockDungeon(ch, d); exitRun(ch, d); } log('Zindan kilitleri açık, koşular sıfırlandı'); } }, 'Zindanları sıfırla/aç')),
      h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        h('button', { class: 'btn small', onTap: () => {
          const st = app.stats();
          const t = w.player.target;
          log({ stats: st, dpsLast10s: w.combat.dps().toFixed(1), estNormalDpsVsTarget: t ? estimateNormalDps(st, t).toFixed(1) : null });
        } }, 'Stat / DPS'),
        srcSel, h('button', { class: 'btn small', onTap: () => {
          const r = new Rng(Date.now() & 0xffffff), n = ENEMIES[srcSel.value].kind === 'boss' ? 100000 : 50000;
          const c = { N: 0, U: 0, R: 0, E: 0, L: 0, none: 0 };
          for (let i = 0; i < n; i++) { const res = rollKillLoot(srcSel.value, { cls: ch.cls }, r); if (res.equipment[0]) c[res.equipment[0].r]++; else c.none++; }
          log(`${ENEMIES[srcSel.value].name} × ${n}\n` + Object.entries(c).map(([k, v]) => `${k}: ${v} (%${(v / n * 100).toFixed(3)})`).join('\n'));
        } }, 'Loot simüle et')),
      h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        h('button', { class: 'btn small', onTap: () => log(ALL_QUESTS.map((q) => `${q.id} ${q.name}: ${questStatus(ch, q)} ${JSON.stringify(ch.quests[q.id]?.p || '')}`).join('\n')) }, 'Görev durumları'),
        h('button', { class: 'btn small', onTap: () => log({ dungeon: ch.dungeon, runs: ch.runs, flags: ch.world.flags, unlocked: ch.world.dungeonUnlocked, elite: ch.world.elite, boss: ch.world.bossRespawnAt, active: ch.world.activeTime.toFixed(0) }) }, 'Dünya durumu'),
        h('button', { class: 'btn small red', onTap: () => { app.repo.failNext = 1; app.requestSave('devFail', true); log('Bir sonraki kayıt bilerek başarısız olacak; otomatik yeniden deneme beklenir.'); } }, 'Kayıt hatası simüle et'),
        h('button', { class: 'btn small', onTap: () => log({ fps: app.game.loop.actualFps.toFixed(1), mem: performance.memory ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'n/a', enemies: w.enemies.length, objects: w.children.list.length }) }, 'Performans')),
      out));
  ui.modal(box);

  function spawnNear(id, spread = 3) {
    const p = w.player;
    for (let k = 0; k < 20; k++) {
      const a = Math.random() * Math.PI * 2, d = (2 + Math.random() * spread) * TILE;
      const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (!w.grid.blockedAt(x, y)) {
        const e = w.spawner.spawnEnemy(id, x, y, { leashR: 20 * TILE });
        if (ENEMIES[id].kind === 'boss') e.killId = `dev:${id}:${Date.now()}`;
        if (id === 'mine_golem' || id === 'frozen_guardian') w.spawner.golem = e;
        log(`${ENEMIES[id].name} doğdu`);
        return e;
      }
    }
    return null;
  }
  void clear; void bus;
}

// Otomasyon / test kısayolları (yalnız ?dev=1): gerçek sistem fonksiyonlarını çağırır
export function installDevHooks() {
  window.__AHEN_BUS = bus;
  window.__AHEN_OPEN = (name) => import('../ui/panels/index.js').then((m) => m.openPanel(name));
  window.__AHEN_CLOSE = () => ui.closePanel();
  window.__AHEN_UI = ui;
  app.devTools = {
    levelTo(L) {
      const ch = app.char;
      L = Math.max(1, Math.min(MAX_LEVEL, L));
      if (L > ch.level) gainExp(ch, cumulativeXp(L) - cumulativeXp(ch.level) - ch.exp);
      app.changed('level');
      return ch.level;
    },
    accept(id) { const r = acceptQuest(app.char, id); app.changed('quest'); return { ok: r.ok, msg: r.msg }; },
    unlockDungeon(id) { unlockDungeon(app.char, id); },
    addStack(id, n) { addStack(app.char.bag, id, n); app.changed('inventory'); },
  };
}
