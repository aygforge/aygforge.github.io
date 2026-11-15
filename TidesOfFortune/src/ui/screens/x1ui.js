// Yaşayan Denizler arayüzü: sözleşme panosu, fraksiyon itibarı, Sonsuz Deniz göstergesi,
// Denizci Günlüğü (Codex) ve Sonsuz Deniz rekorları.
import { h, icon } from '../dom.js';
import * as X1 from '../../systems/X1System.js';
import { EVENT_BY_ID, CHAINS, EVENT_CATEGORIES } from '../../data/events.js';
import { X1_STANDALONE } from '../../data/events_x1.js';
import { HARBOR_BY_ID } from '../../data/harbors.js';

const FINAL_NAMES = {
  CH_X1_RED_CAPTAIN: { defeat: 'Kaptanı yen', peace: 'Barış yap', alliance: 'İttifak kur' },
  CH_X1_GUILD_SEAL: { expose: 'Yolsuzluğu ortaya çıkar', sell: 'Belgeleri sat', guild: 'Loncanın tarafını tut' },
  CH_X1_LIGHTKEEPER: { rescue: 'Bekçiyi kurtar', relight: 'Feneri yeniden yak', abandon: 'Feneri terk et' },
  CH_X1_GROOT_LEGACY: { restore: 'Eski gemiyi onar', salvage: 'Parçaları kurtar', memorial: 'Anısına bırak' },
};
const ECHO_NAMES = { CH_X1_RED_CAPTAIN: 'Kızıl Amblem', CH_X1_GUILD_SEAL: 'Eski Bir Mührün Hikâyesi', CH_X1_LIGHTKEEPER: 'Feneri Anlatan Denizci', CH_X1_GROOT_LEGACY: 'Atölyenin Hatırası' };

/** Fraksiyon itibar çubuğu (−3..+3) */
export function repBar(v) {
  return h('span.repBar', {}, ...[-3, -2, -1, 0, 1, 2, 3].map((k) => h(`i${k === 0 ? '.zero' : ''}${(v > 0 && k > 0 && k <= v) || (v < 0 && k < 0 && k >= v) ? (v > 0 ? '.pos' : '.neg') : ''}`)));
}

export function factionPanel(run) {
  return h('div.factions', {}, h('div.secTitle', {}, icon('flag'), ' Deniz fraksiyonları (bu sefere özel)'),
    ...Object.values(X1.FACTIONS).map((f) => {
      const v = X1.rep(run, f.id);
      return h('div.facRow', {}, h('span.facDot', { style: { background: f.color } }), h('b', {}, f.name), repBar(v), h('small.n', {}, `${v > 0 ? '+' : ''}${v} · ${X1.REP_NAMES[v]}`));
    }));
}

export function contractsPanel(ui) {
  const core = ui.core;
  const run = core.run;
  const visit = run.visit;
  const x = run.x1;
  const offers = visit.contracts || [];
  const cap = X1.contractCap(run);
  const offerCards = offers.map((o, i) => {
    const d = X1.CONTRACTS[o.type];
    const f = d.faction ? X1.FACTIONS[d.faction] : null;
    return h(`div.contractCard${o.taken ? '.taken' : ''}`, {},
      h('div.cHead', {}, icon(d.icon, 'big'), h('b', {}, d.name)),
      f ? h('small.cFac', { style: { color: f.color } }, f.name) : h('small.cFac', {}, 'Bağımsız'),
      h('small', {}, d.desc),
      h('div.cStats', {}, h('span', {}, icon('coin'), h('b.n', {}, ` ${o.gold}`)), h('span', {}, icon('star'), h('b.n', {}, ` ${d.xp} XP`)), h('span', {}, icon('clock'), h('b.n', {}, ` ${d.arrivals}`), ' varış'), d.cargo ? h('span', {}, icon('crate'), ' 1 yer') : h('span', {}, 'Kargo yok')),
      o.taken ? h('div.cDone', {}, 'Kabul edildi') : h('button.btn.sm.primary', { onTap: () => { const r = core.acceptContract(i); if (!r.ok) ui.toast(r.reason, 'warn'); else { ui.audio.play('page'); ui.toast(`Sözleşme kabul edildi: ${d.name}`, 'good'); } } }, 'Kabul et'),
    );
  });
  const active = x.contracts.map((c) => {
    const d = X1.CONTRACTS[c.type];
    const left = Math.max(0, c.deadline - run.stats.harborsReached);
    const note = d.escort ? 'Bu yolculukta konvoya eşlik et' : d.salvage && c.needFind ? 'Batığı bul (yolculukta karşına çıkar)' : d.dest ? `Teslim: ${d.dest.map((t) => ({ trade: 'ticaret', military: 'askerî', fishing: 'balıkçı', pirate: 'korsan', fog: 'sisli', mystery: 'gizemli ada' }[t] || t)).join(' / ')} limanı` : '';
    return h('div.activeContract', {}, icon(d.icon), h('b', {}, ` ${d.name}`), h('small', {}, ` · ${note} · `, h('b.n', {}, `${left}`), ' varış kaldı'));
  });
  return h('div', {},
    h('div.secTitle', {}, icon('scroll'), ' Sözleşme Panosu ', h('small', {}, `(aktif `, h('b.n', {}, `${x.contracts.length}/${cap}`), ')')),
    offers.length ? h('div.contractGrid', {}, ...offerCards) : h('p.small', {}, 'Bu limanda şu an sözleşme teklifi yok.'),
    active.length ? h('div.secTitle', {}, 'Taşınan sözleşmeler') : null,
    ...active,
    factionPanel(run),
    h('p.small', {}, 'Görev kargoları satılamaz ve ambarda yer kaplar. Süre dolarken uygun limana yetişemezsen fraksiyonun teslimat gemisiyle buluşup ödülün %70\'ini alabilirsin.'),
  );
}

/** Sonsuz Deniz göstergesi (küçük çipler) */
export function endlessChips(run) {
  if (!X1.endlessOn(run)) return [];
  const e = run.x1.endless;
  const d = X1.depthOf(run);
  const c = e.cond ? X1.CONDITIONS[e.cond] : null;
  return [
    h('span.chip.endless', {}, icon('wave'), ' Sonsuz Deniz · Ek liman ', h('b.n', {}, e.extra)),
    d ? h('span.chip.depth', {}, 'Derinlik ', h('b', {}, X1.DEPTHS[d].name)) : null,
    c ? h('span.chip.cond', { title: c.desc }, icon('fog'), ' ', c.name) : null,
  ].filter(Boolean);
}

// ───────── Codex: Denizci Günlüğü ─────────
export function journalTab(meta) {
  const x = meta.x1 || { outcomes: {}, finals: {}, echoes: {} };
  const rows = X1_STANDALONE.map((id) => {
    const ev = EVENT_BY_ID[id];
    const seen = meta.codex.events[id];
    if (!seen) return h('div.jRow.unseen', {}, h('b', {}, '???'), h('small', {}, ` ${EVENT_CATEGORIES[ev.cat].name}`));
    const o = x.outcomes[id] || {};
    const marks = ev.options.flatMap((op, i) => {
      const k = `o${i}`;
      const out = [];
      out.push(h(`span.jo${o[`${k}|w`] ? '.ok' : ''}`, { title: op.label }, o[`${k}|w`] ? `✓ ${op.label}` : '???'));
      if (op.lose) out.push(h(`span.jo.lose${o[`${k}|l`] ? '.ok' : ''}`, {}, o[`${k}|l`] ? `✗ ${op.label}` : '???'));
      return out;
    });
    if ((ev.auto || []).length) marks.push(h(`span.jo${o.auto ? '.ok' : ''}`, {}, o.auto ? '★ Özel çözüm' : '???'));
    return h('div.jRow', {}, h('b', { style: { color: EVENT_CATEGORIES[ev.cat].color } }, ev.title), h('div.jMarks', {}, ...marks));
  });
  const found = X1_STANDALONE.filter((id) => meta.codex.events[id]).length;
  const chains = Object.values(CHAINS).filter((c) => c.x1).map((c) => {
    const f = x.finals[c.id] || [];
    return h('div.jRow', {}, h('b', {}, c.name), h('div.jMarks', {}, ...c.finals.map((fid) => h(`span.jo${f.includes(fid) ? '.ok' : ''}`, {}, f.includes(fid) ? `✓ ${FINAL_NAMES[c.id][fid]}` : '??? (alternatif son)'))),
      x.echoes[c.id] ? h('small.echo', {}, '↺ Hikâye Yankısı: ', ECHO_NAMES[c.id]) : f.length ? h('small.echo', {}, '↺ Bir sonraki seferde yankısına rastlayabilirsin…') : null);
  });
  return h('div.journal', {},
    h('p.small', {}, 'Her karşılaşmanın gördüğün sonuçları burada saklanır. Görmediklerin ', h('b', {}, '???'), ' olarak kalır; aynı olayla tekrar karşılaşmak yeni bir sonuç keşfettirebilir.'),
    h('div.secTitle', {}, 'Yaşayan Denizler olayları ', h('small.n', {}, `${found}/25`)),
    ...rows,
    h('div.secTitle', {}, 'Hikâye zincirleri ve alternatif sonlar'),
    ...chains,
  );
}

export function recordsTab(meta) {
  const r = meta.x1?.records || {};
  const cos = meta.x1?.cosmetics || {};
  const row = (k, v) => h('div.recRow', {}, h('span', {}, k), h('b.n', {}, v));
  return h('div.records', {},
    h('div.secTitle', {}, icon('wave'), ' Sonsuz Deniz rekorları'),
    row('En uzun sefer (liman)', r.longestHarbors || 0),
    row('En yüksek Sonsuz Deniz skoru', r.bestScore || 0),
    row('En fazla ek liman', r.maxExtra || 0),
    row('Ulaşılan en derin seviye', r.maxDepth ? ['', 'I', 'II', 'III', 'IV', 'V'][r.maxDepth] : '—'),
    row('Bir seferde en çok sözleşme', r.mostContracts || 0),
    row('En yüksek ticaret kârı', r.bestProfit || 0),
    row('Bir seferde en çok zincir', r.mostChains || 0),
    row('Güvenli bitiş / batış', `${r.endlessSafe || 0} / ${r.endlessSunk || 0}`),
    h('div.secTitle', {}, 'Kozmetikler'),
    row('Özel kaptan bayrağı (12 ek liman)', cos.flag ? 'Açık' : 'Kilitli'),
    row('Dekoratif kıç süsü (20 ek liman)', cos.stern ? 'Açık' : 'Kilitli'),
    h('div.secTitle', {}, 'Tamamlanan sözleşme türleri'),
    ...Object.values(X1.CONTRACTS).map((c) => row(c.name, meta.x1?.contractTypes?.[c.id] || 0)),
  );
}

void HARBOR_BY_ID;
