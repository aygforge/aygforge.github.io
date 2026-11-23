// Kalıcı yükseltmeler, Codex ve Ayarlar ekranları.
import { h, icon, fmt } from '../dom.js';
import { T } from '../../data/strings.js';
import { UPGRADES, UPGRADE_BRANCHES, UPGRADE_BY_ID } from '../../data/upgrades.js';
import { journalTab, recordsTab } from './x1ui.js';
import { HARBORS, HARBOR_TYPES, REGIONS } from '../../data/harbors.js';
import { CODEX_EVENTS, EVENT_CATEGORIES, CHAINS } from '../../data/events.js';
import { CREW, CREW_CLASSES } from '../../data/crew.js';
import { PETS } from '../../data/pets.js';
import { TRADE_GOODS, GOOD_GROUPS } from '../../data/goods.js';
import { ACHIEVEMENTS } from '../../data/achievements.js';
import { canBuyUpgrade, upgradeVisible, legendStatus } from '../../systems/ProgressionSystem.js';
import { crewPortraitURL, petPortraitURL } from '../../rendering/Characters.js';
import { toggleFullscreen } from '../Stage.js';

function header(ui, title, extra = null) {
  return h('div.metaHead', {}, h('button.btn', { onTap: () => ui.go(ui.core.run && !ui.core.run.ended ? 'game' : 'menu') }, '◂ ', ui.core.run && !ui.core.run.ended ? 'Oyuna dön' : T.back), h('h1', {}, title), extra);
}

export function renderUpgrades(ui) {
  ui.renderer.setScene('menu', { level: 1 });
  const meta = ui.core.meta;
  const branches = Object.entries(UPGRADE_BRANCHES).filter(([id, b]) => !b.hidden || meta.solaraHired);
  const cols = branches.map(([bid, b]) => h('div.upCol.panel', {},
    h('h3', {}, icon(b.icon, 'big'), ' ', b.name),
    ...UPGRADES.filter((u) => u.branch === bid && upgradeVisible(meta, u)).map((u) => {
      const owned = meta.upgrades.includes(u.id);
      const chk = canBuyUpgrade(meta, u.id);
      return h(`div.upCard${owned ? '.owned' : chk.ok ? '.can' : ''}`, {},
        h('b', {}, u.name),
        h('small', {}, u.effect),
        u.req ? h('small.req', {}, `Önkoşul: ${UPGRADE_BY_ID[u.req].name}`) : null,
        u.needsSolara ? h('small.req', {}, 'Solara en az bir kez işe alındı ✓') : null,
        u.needMysteries ? h('small.req', {}, `Dal koşulu: Codex'te ${u.needMysteries} gizem eventi (${legendStatus(meta).mysteries}/${u.needMysteries})`) : null,
        u.needMysteryChain ? h('small.req', {}, `Koşul: bir gizemli zincir tamamla (${legendStatus(meta).chains ? '✓' : '✗'})`) : null,
        owned ? h('div.owned', {}, '✔ Alındı') : h('button.btn.sm' + (chk.ok ? '.primary' : '.locked'), { onTap: async () => {
          if (!chk.ok) return ui.toast(chk.reason, 'warn');
          const ok = await ui.confirm(`${u.name} — ${u.cost} XP harcansın mı?`, { title: 'Kalıcı yükseltme', ok: 'Satın al' });
          if (ok) { const r = ui.core.buyUpgrade(u.id); if (r.ok) ui.audio.play('achievement'); }
        } }, icon('star'), ` ${u.cost} XP`),
      );
    }),
  ));
  return h('div.screen.meta', {},
    header(ui, T.upgrades, h('div.xpBox', {}, icon('star', 'big'), h('div', {}, h('b', {}, fmt(meta.xpAvailable)), h('small', {}, `harcanabilir · toplam ${fmt(meta.xpTotalEarned)} · harcanan ${fmt(meta.xpSpent)}`)))),
    h('div.upGrid', { 'data-scroll': 'upg' }, ...cols),
    !meta.solaraHired ? h('p.hiddenHint', {}, 'Bir dal hâlâ gizli… Güneş tapınağının rahibesini bulanlar onu görebilir.') : null,
  );
}

const CODEX_TABS = [
  ['harbors', 'Limanlar'], ['events', 'Olaylar'], ['crew', 'Tayfa'], ['pets', 'Hayvanlar'], ['goods', 'Mallar'], ['ach', 'Başarımlar'], ['stats', 'İstatistik'],
  ['journal', 'Denizci Günlüğü'],
  ['records', 'Sonsuz Deniz'],
];

export function renderCodex(ui) {
  ui.renderer.setScene('menu', { level: 1 });
  const meta = ui.core.meta;
  const cx = meta.codex;
  const tabs = [...CODEX_TABS];
  if (cx.oldFriends) tabs.push(['oldfriends', 'Eski Dostlar']);
  const tab = ui.sub.codexTab || 'harbors';
  let body;
  if (tab === 'harbors') {
    body = Object.values(REGIONS).map((r) => h('div.cxRegion', {}, h('h3', { style: { color: r.color } }, `${r.id}. ${r.name}`),
      h('div.cxGrid', {}, ...HARBORS.filter((x) => x.region === r.id).map((hb) => {
        const v = cx.harbors[hb.id];
        const rev = cx.revealed[hb.id];
        const locked = HARBOR_TYPES[hb.type].locked && !meta.upgrades.includes(HARBOR_TYPES[hb.type].locked);
        return h(`div.cxCell${v ? '.on' : rev ? '.half' : ''}`, { onTap: () => (v || rev) && ui.showHarbor(hb.id, true) }, icon(v || rev ? HARBOR_TYPES[hb.type].icon : 'info', 'big'), h('b', {}, v || rev ? hb.name : '???'), h('small', {}, v ? HARBOR_TYPES[hb.type].name : rev ? 'Haritadan biliniyor' : locked ? `Kilitli (${HARBOR_TYPES[hb.type].name})` : 'Keşfedilmedi'));
      }))));
    body.unshift(h('p.cxCount', {}, `Keşfedilen: ${Object.keys(cx.harbors).length}/45 · Liman tipleri: ${Object.keys(cx.harborTypes).length}/8`));
  } else if (tab === 'events') {
    const groups = Object.keys(EVENT_CATEGORIES).filter((c) => c !== 'chain').map((c) => {
      const list = CODEX_EVENTS.filter((e) => e.cat === c && !e.egg);
      if (!list.length) return null;
      return h('div.cxRegion', {}, h('h3', { style: { color: EVENT_CATEGORIES[c].color } }, `${EVENT_CATEGORIES[c].name} (${list.filter((e) => cx.events[e.id]).length}/${list.length})`),
        h('div.cxList', {}, ...list.map((e) => h(`div.cxEv${cx.events[e.id] ? '.on' : ''}`, {}, cx.events[e.id] ? e.title : '???'))));
    });
    const chains = Object.values(CHAINS).map((c) => h(`div.cxEv${cx.events[c.start] ? '.on' : ''}`, {}, cx.events[c.start] ? `${c.name} (${c.steps} adım)` : '???'));
    const eggs = CODEX_EVENTS.filter((e) => e.egg);
    const eggBox = h('div.cxRegion', {}, h('h3', {}, `Gizli Deniz Hikâyeleri (${eggs.filter((e) => cx.events[e.id]).length}/${eggs.length})`),
      h('div.cxList', {}, ...eggs.map((e) => h(`div.cxEv${cx.events[e.id] ? '.on' : ''}`, {}, cx.events[e.id] ? e.title : '??? ❔'))));
    body = [...groups, h('div.cxRegion', {}, h('h3', {}, 'Zincirler'), h('div.cxList', {}, ...chains)), eggBox];
    const notes = [];
    if (cx.notes.flyingFish) notes.push('Uçan Balıklar: gümüş kanatlı balıklar yelkenleri aştı.');
    if (cx.notes.ghostCaptain) notes.push('Hayalet Kaptan: madalyon sahibine ulaştı; yeşil ışık sonsuza dek söndü.');
    if (cx.notes.princess) notes.push("Kayıp Prenses: İsadora, Kraliçe Elena'nın kızıydı.");
    if (notes.length) body.push(h('div.cxRegion', {}, h('h3', {}, 'Koleksiyon sayfaları'), ...notes.map((n) => h('p', {}, '✦ ', n))));
  } else if (tab === 'crew') {
    body = [h('p.cxCount', {}, `Tanışılan: ${Object.keys(cx.crewMet).length}/30 · İşe alınan: ${Object.keys(cx.crewHired).length}/30`),
      h('div.cxGrid.crew', {}, ...CREW.map((c) => {
        const met = cx.crewMet[c.id];
        return h(`div.cxCell${cx.crewHired[c.id] ? '.on' : met ? '.half' : ''}`, { onTap: () => met && ui.showCrew(c.id) },
          met ? h('img.portrait', { src: crewPortraitURL(c.id, 3) }) : h('div.silh', {}, '?'),
          h('b', {}, met ? c.name : '???'), h('small', { style: { color: CREW_CLASSES[c.cls].color } }, CREW_CLASSES[c.cls].name));
      }))];
  } else if (tab === 'pets') {
    body = [h('div.cxGrid.crew', {}, ...PETS.map((p) => {
      const met = p.id in cx.pets;
      const had = cx.pets[p.id];
      return h(`div.cxCell${had ? '.on' : met ? '.half' : ''}`, { onTap: () => (met || had) && ui.showPet(p.id) },
        met || had ? h('img.portrait.petp', { src: petPortraitURL(p.id, 3) }) : h('div.silh', {}, '?'),
        h('b', {}, met || had ? p.name : '???'), h('small', {}, met || had ? p.species : 'Henüz görülmedi'));
    }))];
  } else if (tab === 'goods') {
    body = [h('div.cxGrid', {}, ...TRADE_GOODS.map((g) => h(`div.cxCell${cx.goods[g.id] ? '.on' : ''}`, { onTap: () => cx.goods[g.id] && ui.showGood(g.id) }, icon(g.id, 'big'), h('b', {}, cx.goods[g.id] ? g.name : '???'), h('small', {}, GOOD_GROUPS[g.group]))))];
  } else if (tab === 'ach') {
    body = ACHIEVEMENTS.map((a) => {
      const on = meta.achievements.includes(a.id);
      return h(`div.achRow${on ? '.on' : ''}`, {}, icon(on ? 'star' : 'lock', 'big'), ' ', h('b', {}, on || !a.secret ? a.name : '???'), h('small', {}, ' — ', on || !a.secret ? a.desc : 'Gizli başarım'));
    });
  } else if (tab === 'stats') {
    const s = meta.stats;
    body = [h('div.statsList', {},
      ...[['Toplam run', s.runs], ['Tamamlanan', s.completed], ['Batan', s.sunk], ['En çok liman', s.bestHarbors], ['Toplam kazanılan altın', fmt(s.totalGoldEarned)], ['Bir run\'da en yüksek altın', fmt(s.bestGold)], ['Çözülen olay', s.totalEvents], ['Toplam XP', fmt(meta.xpTotalEarned)], ['Harcanan XP', fmt(meta.xpSpent)], ['Açılan yükseltme', `${meta.upgrades.length}/20`], ['Başarımlar', `${meta.achievements.length}/${ACHIEVEMENTS.length}`]]
        .map(([k, v]) => h('div.xprow', {}, h('span', {}, k), h('b', {}, v))))];
  } else if (tab === 'journal') {
    body = [journalTab(ui.core.meta)];
  } else if (tab === 'records') {
    body = [recordsTab(ui.core.meta)];
  } else if (tab === 'oldfriends') {
    body = [h('div.oldFriendsPage', {},
      h('div.cinePets', {}, h('img.cinePet', { src: petPortraitURL('PET_TARCIN', 7) }), h('img.cinePet.flip', { src: petPortraitURL('PET_ZIPIR', 7) })),
      h('h2', {}, 'Eski Dostlar'),
      h('p', {}, 'Tarçın siyahtır, bisküvi sever, kuyruğu hiç durmaz.'),
      h('p', {}, 'Zıpır griydir, iki gözü de görmez ama güvertede hiçbir şeye çarpmaz; belki denizi hissediyordur.'),
      h('p.small', {}, 'Bazı şeyler ayrılmaz.'),
    )];
  }
  return h('div.screen.meta', {},
    header(ui, T.codex),
    h('div.tabs.codexTabs', {}, ...tabs.map(([id, name]) => h(`button.tab${tab === id ? '.on' : ''}`, { onTap: () => { ui.sub.codexTab = id; ui.render(); } }, name))),
    h('div.cxBody.panel', { 'data-scroll': 'cx-' + tab }, ...body),
  );
}

export function renderSettings(ui) {
  ui.renderer.setScene('menu', { level: 1 });
  const core = ui.core;
  const s = core.settings;
  const slider = (key, label) => {
    const val = h('b', {}, Math.round(s[key] * 100) + '%');
    const input = h('input.range', { type: 'range', min: 0, max: 100, value: Math.round(s[key] * 100) });
    input.addEventListener('input', () => {
      s[key] = Number(input.value) / 100;
      val.textContent = input.value + '%';
      ui.audio.applyVolumes();
    });
    input.addEventListener('change', () => { core.saveSettings(); ui.audio.play('click'); });
    return h('div.setRow', {}, h('span', {}, label), input, val);
  };
  const toggle = (key, label, desc) => h('div.setRow', {}, h('span', {}, label, desc ? h('small', {}, desc) : null),
    h(`button.toggle${s[key] ? '.on' : ''}`, { onTap: () => { s[key] = !s[key]; core.saveSettings(); ui.render(); } }, s[key] ? 'Açık' : 'Kapalı'));
  const exportSave = () => {
    const str = core.exportSave();
    const ta = h('textarea.saveText', { readOnly: true }, str);
    ui.sheet(h('div', {}, h('p', {}, 'Bu metni güvenli bir yere kopyala. İçe aktarırken aynı metni yapıştır.'), ta,
      h('button.btn', { onTap: () => { ta.select(); try { navigator.clipboard.writeText(str).then(() => ui.toast('Kopyalandı', 'good')); } catch { document.execCommand('copy'); ui.toast('Kopyalandı', 'good'); } } }, 'Panoya kopyala'),
      h('button.btn', { onTap: () => { const a = document.createElement('a'); a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(str); a.download = 'tides-of-fortune-kayit.txt'; a.click(); } }, 'Dosya olarak indir')), { title: 'Kaydı dışa aktar' });
  };
  const importSave = () => {
    const ta = h('textarea.saveText', { placeholder: 'TOF1:…' });
    ui.sheet(h('div', {}, h('p', {}, 'Dışa aktarılmış kayıt metnini yapıştır. Mevcut ilerlemenin üzerine yazılır.'), ta), {
      title: 'Kaydı içe aktar',
      actions: [{ label: 'İçe aktar', primary: true, onTap: () => { const r = core.importSave(ta.value); ui.toast(r.ok ? 'Kayıt yüklendi.' : r.reason, r.ok ? 'good' : 'warn'); } }],
    });
  };
  const reset = async () => {
    if (!(await ui.confirm(T.confirmReset1, { title: 'Tüm ilerlemeyi sıfırla', ok: 'Devam', danger: true }))) return;
    if (!(await ui.confirm(T.confirmReset2, { title: 'Son onay', ok: 'Her şeyi sil', danger: true }))) return;
    core.resetAll();
    ui.toast('Tüm ilerleme silindi.', 'warn');
    ui.go('menu');
  };
  const abandon = async () => {
    if (!(await ui.confirm('Aktif run terk edilsin mi? Şimdiye kadarki XP kalıcı hesabına aktarılır.', { danger: true, ok: 'Terk et' }))) return;
    core.abandonRun();
    ui.go('game');
  };
  return h('div.screen.meta', {},
    header(ui, T.settings),
    h('div.setBody.panel', { 'data-scroll': 'set' },
      h('h3', {}, 'Ses'),
      slider('master', 'Genel ses'), slider('music', 'Müzik'), slider('sfx', 'Ses efektleri'),
      h('h3', {}, 'Görüntü ve performans'),
      toggle('reduceMotion', 'Animasyonları azalt', 'Kaydırma ve sallanma efektleri yavaşlar'),
      toggle('fps30', '30 FPS modu', 'Pil ve ısınma için'),
      h('div.setRow', {}, h('span', {}, 'Tam ekran'), h('button.toggle', { onTap: toggleFullscreen }, 'Değiştir')),
      h('h3', {}, 'Eğitim'),
      h('div.setRow', {}, h('span', {}, 'İlk oyun eğitimi', h('small', {}, core.meta.tutorialDone ? 'Tamamlandı. Yeniden açarsan bir sonraki yeni run\'da baştan gösterilir.' : 'Bir sonraki yeni run\'da gösterilecek.')),
        h('button.toggle' + (core.meta.tutorialDone ? '' : '.on'), { onTap: () => { if (core.meta.tutorialDone) { core.tutorialReset(); ui.toast('Eğitim bir sonraki yeni run\'da gösterilecek.', 'good'); } else core.tutorialFinish(true); ui.render(); } }, core.meta.tutorialDone ? 'Yeniden göster' : 'Açık')),
      h('h3', {}, 'Kayıt'),
      h('div.setRow', {}, h('span', {}, 'Otomatik kayıt', h('small', {}, 'Her karar ve liman işleminden sonra cihazına kaydedilir')), h('b', {}, 'Açık')),
      h('div.setBtns', {}, h('button.btn', { onTap: exportSave }, 'Dışa aktar'), h('button.btn', { onTap: importSave }, 'İçe aktar')),
      core.hasActiveRun() ? h('div.setBtns', {}, h('button.btn.danger', { onTap: abandon }, 'Aktif run\'ı terk et')) : null,
      h('div.setBtns', {}, h('button.btn.danger', { onTap: reset }, 'Tüm ilerlemeyi sıfırla')),
      h('p.small', {}, 'Tides of Fortune · Font: Jersey 10 (SIL OFL 1.1). Tüm görseller ve sesler oyun içinde prosedürel olarak üretilir.'),
    ),
  );
}
