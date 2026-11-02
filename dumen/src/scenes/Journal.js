// İlan Panosu + Not Defteri: siparişler (Yeni / Aktif / Teslime hazır / Bitti / Süresi geçti), ana görevler, hikâyeler, günlükler.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  const STATE_TR = { AVAILABLE: 'Yeni', ACTIVE: 'Aktif', COMPLETABLE: 'Teslime hazır', COMPLETED: 'Bitti', EXPIRED: 'Süresi geçti', ABANDONED: 'Bırakıldı', LOCKED: 'Kilitli' };
  const rewardText = (list) => D.Inv.describe(list.map((r) => (r.type === 'coin' ? { id: 'CUR_COIN', n: r.n } : r.type === 'miyav' ? { id: 'CUR_MIYAV', n: r.n } : r.type === 'scrap' ? { id: 'CUR_SCRAP', n: r.n } : r.type === 'cosmetic' ? { cosmetic: r.id } : r.type === 'rel' ? { rel: r.npc, n: r.n } : { id: r.id, n: r.n || 1 }))).join(', ');
  const orderDesc = (tpl) => {
    const sp = tpl.spec;
    switch (tpl.kind) {
      case 'fish': return sp.n + ' × ' + D.FishDBSource.FishDB[sp.fishId].name;
      case 'rarity': return sp.n + ' × ' + D.RARITY_TR[sp.rarityMin] + '+ balık' + (sp.region ? ' (' + D.RegionDB[sp.region].name + ')' : '');
      case 'regionSet': return D.RegionDB[sp.region].name + '\'dan ' + sp.n + ' farklı tür';
      case 'size': return sp.n + ' × ' + sp.label + ' boy ' + D.RegionDB[sp.region].name + ' balığı';
      case 'behavior': return sp.n + ' × ' + D.BEHAVIOR_TR[sp.behavior] + ' davranışlı balık';
      case 'chest': return sp.n + ' sandık yakala' + (sp.region ? ' (' + D.RegionDB[sp.region].name + ')' : '') + ' — kabulden sonra';
      case 'trash': return sp.n + ' çöp teslim et';
      case 'green': return sp.n + ' hazineyi YEŞİL bölgede yakala — kabulden sonra';
      case 'noBait': return 'Yemsiz ' + sp.n + ' balık — kabulden sonra';
      default: return '';
    }
  };
  D.Scenes.orderDesc = orderDesc;

  D.Scenes.openJournal = (tab) => {
    let cur = tab || 'notes';
    const m = D.UI.modal({
      title: 'İlan Panosu & Not Defteri', width: D.UI.view.W - 140, height: D.UI.view.H - 110, scroll: false,
      body: (b) => {
        const render = () => {
          D.UI.clear(b);
          const s = D.Game.state;
          const nComp = Object.values(s.orders).filter((o) => D.Quests.orderState(s, o) === 'COMPLETABLE').length;
          const mainComp = D.QuestDB.main.filter((q) => D.Quests.mainState(s, q) === 'COMPLETABLE').length;
          const dComp = s.daily.list.filter((d) => !d.claimed && d.prog >= D.dailyTplById[d.tpl].spec.n).length;
          b.append(h('div', { class: 'tabs' }, [['board', 'İlan Panosu (' + s.board.offers.length + ')'], ['notes', 'Not Defteri' + (nComp ? ' ✓' + nComp : '')], ['main', 'Ana Görevler' + (mainComp ? ' ✓' + mainComp : '')], ['story', 'Hikâyeler'], ['daily', 'Günlük' + (dComp ? ' ✓' + dComp : '')]].map(([id, l]) => { const t = h('button', { class: 'tab' + (cur === id ? ' on' : ''), type: 'button' }, l); t.addEventListener('click', () => { cur = id; render(); }); return t; })));
          const list = h('div', { class: 'list scroll grow' });
          if (cur === 'board') {
            list.append(h('div', { class: 'small muted' }, 'Evinin yanındaki pano. Süreli ilanlar daha çok öder. Kabul edilen sipariş Not Defteri\'ne taşınır; uygun balıklar otomatik ayrılır (yanlışlıkla satılmaz). Yeni ilanlar ' + D.fmtTime(Math.max(0, s.board.nextRefreshAt - s.clock.playTime)) + ' sonra.'));
            if (!s.board.offers.length) list.append(h('div', { class: 'muted center' }, 'Panoda ilan yok.'));
            for (const off of s.board.offers) {
              const tpl = D.orderTplById[off.tpl];
              list.append(h('div', { class: 'card' }, h('div', { class: 'col grow', style: { gap: '4px' } }, h('div', { class: 'ttl' }, tpl.title), h('div', { class: 'meta' }, tpl.client + ' · ' + orderDesc(tpl) + (tpl.timed ? ' · Süreli: ' + D.fmtTime(tpl.timed) : ' · süresiz')), h('div', { class: 'meta ok' }, 'Ödül: ' + rewardText(tpl.rewards))),
                btn('Kabul Et', () => D.UI.act('acceptOrder', { oid: off.oid }, () => { D.Audio.sfx('quest'); render(); }, 'Not Defteri\'ne eklendi'), { cls: 'green' })));
            }
          } else if (cur === 'notes') {
            const orders = Object.values(s.orders).sort((a, b2) => (b2.acceptedAt || 0) - (a.acceptedAt || 0));
            const act = orders.filter((o) => o.state === 'ACTIVE'), old = orders.filter((o) => o.state !== 'ACTIVE').slice(0, 12);
            if (!act.length) list.append(h('div', { class: 'muted center' }, 'Aktif sipariş yok. Panodan sipariş al.'));
            for (const o of act.concat(old)) {
              const tpl = D.orderTplById[o.tpl]; const stt = D.Quests.orderState(s, o); const pr = D.Quests.orderProgress(s, o);
              const left = o.expiresAt ? Math.max(0, o.expiresAt - s.clock.playTime) : null;
              list.append(h('div', { class: 'card' + (stt === 'ACTIVE' || stt === 'COMPLETABLE' ? '' : ' dis') }, h('div', { class: 'col grow', style: { gap: '4px' } },
                h('div', { class: 'ttl' }, tpl.title, ' ', h('span', { class: 'chip' }, STATE_TR[stt])),
                h('div', { class: 'meta' }, orderDesc(tpl) + ' · ' + pr.have + '/' + pr.n + (left != null && stt === 'ACTIVE' || stt === 'COMPLETABLE' && left != null ? ' · kalan ' + D.fmtTime(left) : '')),
                h('div', { class: 'meta ok' }, 'Ödül: ' + rewardText(tpl.rewards))),
                stt === 'COMPLETABLE' ? btn('Teslim Et', () => D.UI.act('deliverOrder', { oid: o.oid }, (r) => { D.Panels.rewardsModal('Sipariş tamamlandı!', r.rewards); render(); }), { cls: 'green' }) : null,
                stt === 'ACTIVE' ? btn('Bırak', () => D.UI.confirm('Siparişi bırak?', 'Ayrılmış balıklar serbest kalır.', () => D.UI.act('abandonOrder', { oid: o.oid }, render)), { cls: 'small red' }) : null));
            }
          } else if (cur === 'main') {
            for (const q of D.QuestDB.main) {
              const stt = D.Quests.mainState(s, q);
              list.append(h('div', { class: 'card' + (stt === 'LOCKED' ? ' dis' : '') }, h('div', { class: 'col grow', style: { gap: '4px' } }, h('div', { class: 'ttl' }, q.title, ' ', h('span', { class: 'chip' }, STATE_TR[stt])), h('div', { class: 'meta' }, q.desc + ' · ' + D.Quests.mainProgressText(s, q)), h('div', { class: 'meta ok' }, 'Ödül: ' + rewardText(q.rewards))),
                stt === 'COMPLETABLE' ? btn('Ödülü Al', () => D.UI.act('claimMain', { id: q.id }, (r) => { D.Panels.rewardsModal(q.title, r.rewards); render(); }), { cls: 'green' }) : null));
            }
          } else if (cur === 'story') {
            for (const chain of ['tarcov', 'komplo', 'zip']) {
              list.append(h('h3', null, D.CHAIN_TR[chain]));
              for (const ch of D.QuestDB.story.filter((c) => c.chain === chain)) {
                const r = s.quests[ch.id]; const stt = r ? r.state : 'LOCKED';
                const steps = ch.steps.map((st, i) => h('div', { class: 'tiny ' + (r && (i < r.step || stt === 'COMPLETED') ? 'ok' : r && i === r.step ? 'b' : 'muted') }, (r && (i < r.step || stt === 'COMPLETED') ? '✓ ' : r && i === r.step ? '▸ ' : '· ') + st.text + (r && i === r.step && (st.t === 'catch' || st.t === 'chest' || st.t === 'green') ? ' (' + r.prog + '/' + st.n + ')' : '')));
                list.append(h('div', { class: 'card' + (stt === 'LOCKED' ? ' dis' : '') }, h('div', { class: 'col grow', style: { gap: '3px' } }, h('div', { class: 'ttl' }, ch.no + '. ' + ch.title, ' ', h('span', { class: 'chip' }, STATE_TR[stt])), h('div', { class: 'meta' }, stt === 'LOCKED' ? 'Koşul: ' + ch.unlock.map(D.Quests.condText).join(', ') : ch.summary), stt === 'LOCKED' ? null : steps, h('div', { class: 'meta ok' }, 'Ödül: ' + rewardText(ch.rewards)))));
              }
            }
          } else if (cur === 'daily') {
            list.append(h('div', { class: 'small muted' }, 'Günlük görevler yerel takvim gününde yenilenir (' + s.daily.dayKey + '). Cihaz saati geri alınırsa yeni hak verilmez.'));
            for (const d of s.daily.list) {
              const tpl = D.dailyTplById[d.tpl]; const done = d.prog >= tpl.spec.n;
              list.append(h('div', { class: 'card' + (d.claimed ? ' dis' : '') }, h('div', { class: 'col grow' }, h('div', { class: 'ttl' }, D.Quests.dailyTitle(d)), h('div', { class: 'prog' }, h('i', { style: { width: Math.min(100, (d.prog / tpl.spec.n) * 100) + '%' } })), h('div', { class: 'meta' }, d.prog + '/' + tpl.spec.n + ' · Ödül: ' + rewardText(tpl.rewards))),
                d.claimed ? h('span', { class: 'ok' }, 'Alındı') : btn('Al', () => D.UI.act('claimDaily', { id: d.id }, (r) => { D.Panels.rewardsModal('Günlük görev', r.rewards); render(); }), { cls: 'green', disabled: !done })));
            }
          }
          b.append(list);
        };
        render();
      }
    });
    return m;
  };
})(globalThis.DUMEN);
