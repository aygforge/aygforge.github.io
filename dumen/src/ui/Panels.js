// Paylaşılan paneller: eşya kartı/detayı, balık satırı, sandık açma (+şifre bulmacası), ödül penceresi, ekipman statları.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  const P = {};
  let SOURCES = null;
  P.sources = (id) => { if (!SOURCES) SOURCES = D.Validate.run().facts.sources; return SOURCES[id] || []; };

  P.gearStats = (id, regionCode) => {
    const ib = D.ItemBalanceDB[id]; const out = [];
    if (ib.slot === 'rod') {
      out.push(['İp dayanımı', '×' + ib.ls.toFixed(2)], ['Sarma hızı', '×' + ib.rs.toFixed(2)], ['Kontrol', '+' + Math.round(ib.ct * 100) + '%'], ['İnat hasarı', '×' + ib.sd.toFixed(2)], ['Hazine zamanlama', '+' + Math.round(ib.tb * 100) + '%'], ['Nadir balık desteği', '+' + Math.round(ib.rh * 100) + '%']);
      if (ib.reelTension !== 1) out.push(['Sarma gerilimi', '×' + ib.reelTension.toFixed(2) + ' (riskli)']);
      for (const [r, b] of Object.entries(ib.regionBonus || {})) out.push(['Bölge bonusu', D.RegionDB[r].name + ': ' + [b.sd ? 'İnat hasarı ×' + b.sd : '', b.ls ? 'dayanım ×' + b.ls : '', b.ct ? 'kontrol +' + Math.round(b.ct * 100) + '%' : '', b.envImmune ? 'çevre cezası yok' : ''].filter(Boolean).join(', ')]);
    } else if (['line', 'hook', 'float'].includes(ib.slot)) {
      const m = ib.mods; const T = { ls: (v) => ['İp dayanımı', '+' + v], ct: (v) => ['Kontrol', (v > 0 ? '+' : '') + Math.round(v * 100) + '%'], sd: (v) => ['İnat hasarı', '+' + Math.round(v * 100) + '%'], treasure: (v) => ['Hazine şansı', '+' + Math.round(v * 100) + '%'], trash: (v) => ['Çöp şansı', Math.round(v * 100) + '%'], wait: (v) => ['Bekleme', Math.round(v * 100) + '%'], heavyBias: (v) => ['Ağır balık', '×' + v], clarity: () => ['Görüş', 'sahte parıltıları gösterir'], rarityHint: () => ['Siluet', 'nadirlik çerçevesi'], ghostReveal: () => ['Hayalet hamleler', 'sinyali görünür'], escapeSlip: (v) => ['Kayma', '%' + Math.round(v * 100) + ' hamlede'], coldImmune: () => ['Soğuk', 'sarma cezası yok'] };
      for (const [k, v] of Object.entries(m)) if (T[k]) out.push(T[k](v));
      if (!out.length) out.push(['Etki', 'Standart (bonus yok)']);
    } else if (ib.slot === 'bait') {
      out.push(['Bekleme', '×' + ib.wait]); if (ib.rare !== 1) out.push(['Nadir+', '×' + ib.rare]); if (ib.leg !== 1) out.push(['Efsanevi/Boss', '×' + ib.leg + ' (tavan %12)']);
      if (ib.region) out.push(['Bölge yemi', D.RegionDB[ib.region].name + ': Sıradışı+ ×' + ib.regionMult + ', çöp −%30']);
      if (ib.favorite) out.push(['Favori', D.FishDBSource.FishDB[ib.favorite].name + ' ×' + ib.favoriteMult]);
      if (ib.suspicious) out.push(['Şüpheli', 'Her atışta rastgele etki']);
      out.push(['Tüketim', 'Atış başına 1 adet (sonuçtan bağımsız)']);
    }
    return out;
  };

  P.itemDetail = (id) => {
    const s = D.Game.state; const ib = D.ItemBalanceDB[id]; const src = D.ItemDBSource.ItemDB[id];
    D.UI.modal({
      title: src.name, width: 1300,
      body: (b) => {
        b.append(h('div', { class: 'row' }, D.UI.itemIcon(id, 180), h('div', { class: 'col grow' },
          h('div', null, h('span', { class: 'chip' }, D.CATEGORY_TR[src.category]), ' ', h('span', { class: 'tiny muted' }, 'ID: ' + id)),
          h('div', { class: 'b' }, 'Sahip olunan: ' + D.fmt(D.Inv.count(s, id))),
          ib.role ? h('div', null, ib.role) : null,
          src.effect ? h('div', null, h('b', null, 'Kaynak etki: '), '“' + src.effect + '”') : null,
          ib.mech ? h('div', { class: 'small' }, h('b', null, 'Bu sürümdeki mekanik: '), ib.mech) : null,
          ib.kind ? h('div', { class: 'small muted' }, 'Tür: ' + { passive: 'Pasif (takılıyken sürekli)', charge: 'Şarjlı (takılıyken mücadele/sefer başına 1, tükenmez)', consumable: 'Tüketilir (kullanınca 1 adet düşer)' }[ib.kind]) : null)));
        const st = P.gearStats(id);
        if (st.length) b.append(h('div', { class: 'kv' }, st.flatMap(([k, v]) => [h('b', null, k), h('span', null, v)])));
        b.append(h('h3', null, 'Nereden bulunur?'), h('div', { class: 'small' }, P.sources(id).join(' · ') || '—'));
        if (src.buyPrice == null && ib.price != null) b.append(h('div', { class: 'tiny muted' }, 'Kaynakta fiyat bilinmiyor; ' + D.fmt(ib.price) + ' coin bu sürümün denge değeridir.'));
      }
    });
  };

  P.itemCard = (id, opts) => {
    opts = opts || {};
    const s = D.Game.state;
    const card = h('div', { class: 'card' + (opts.sel ? ' sel' : '') + (opts.dis ? ' dis' : '') },
      D.UI.itemIcon(id, 92),
      h('div', { class: 'col grow', style: { gap: '2px' } }, h('div', { class: 'ttl' }, D.itemName(id)), h('div', { class: 'meta' }, opts.meta != null ? opts.meta : D.CATEGORY_TR[D.Inv.cat(id)] + ' · ×' + D.fmt(D.Inv.count(s, id)))),
      ...(opts.right || []));
    if (opts.info !== false) card.append(btn('i', () => P.itemDetail(id), { cls: 'small round', aria: 'Bilgi' }));
    return card;
  };

  P.fishRow = (f, opts) => {
    opts = opts || {};
    const s = D.Game.state; const b = D.FishBalanceDB[f.fishId]; const src = D.FishDBSource.FishDB[f.fishId];
    const fr = D.Econ.freshness(s, f);
    const left = D.Econ.freshLeft(s, f);
    const tags = [];
    if (f.questProtected) tags.push(h('span', { class: 'chip' }, 'Görevde'));
    if (f.locked) tags.push(h('span', { class: 'chip' }, 'Korumada'));
    return h('div', { class: 'card' + (opts.sel ? ' sel' : '') + (opts.dis ? ' dis' : ''), onclick: opts.onclick || null },
      D.UI.fishIcon(f.fishId, 120),
      h('div', { class: 'col grow', style: { gap: '2px' } },
        h('div', { class: 'ttl' }, src.name),
        h('div', { class: 'meta row wrap', style: { gap: '8px' } }, D.UI.rarityBadge(b.rarity), f.size + ' cm · ' + D.Econ.sizeLabel(f.fishId, f.size), h('span', { class: 'fresh-' + fr }, D.EconomyConfig.freshness[fr].label + (left > 0 ? ' (' + D.fmtTime(left) + ')' : '')), ...tags)),
      ...(opts.right || []));
  };

  P.rewardsModal = (title, got, extra) => {
    D.Audio.sfx('quest');
    D.UI.modal({ title, width: 1100, body: (b) => { if (extra) b.append(extra); b.append(D.UI.rewardList(got)); }, actions: [{ label: 'Harika!', cls: 'green' }] });
  };

  // Sandık: koşul, açma, animasyon (animasyon ödülden ayrı; ödül tx sonucu)
  P.chestPanel = (inst, after) => {
    const s = D.Game.state; const C = D.ChestDB[inst.chestId];
    const reqs = [];
    if (C.key) reqs.push([D.itemName(C.key) + ' (1 adet harcanır)', (s.inv.items[C.key] || 0) > 0]);
    if (C.req && C.req.item) reqs.push([C.req.text + ' (sende ' + (s.inv.items[C.req.item] || 0) + ')', (s.inv.items[C.req.item] || 0) >= C.req.n]);
    if (C.req && C.req.flag) reqs.push([C.req.text, !!s.flags[C.req.flag]]);
    if (C.req && C.req.puzzle) reqs.push([C.req.text, true]);
    const can = reqs.every((r) => r[1]);
    const m = D.UI.modal({
      title: D.itemName(inst.chestId), width: 1150,
      body: (b) => {
        b.append(h('div', { class: 'row' }, D.UI.itemIcon(inst.chestId, 200), h('div', { class: 'col grow' },
          h('div', null, inst.quality === 'gold' ? '✦ Altın kalite (yeşil bölgede yakalandı): +1 ödül, coin ×1.25' : 'Normal kalite'),
          h('div', { class: 'small' }, 'Bölgeler: ' + (C.regions.length ? C.regions.map((r) => (r === '*' ? 'Tüm bölgeler' : D.RegionDB[r].name)).join(', ') : 'Hikâye ödülü')),
          reqs.length ? h('div', { class: 'col' }, reqs.map(([t, ok]) => h('div', { class: ok ? 'ok' : 'no' }, (ok ? '✓ ' : '✗ ') + t))) : h('div', { class: 'ok' }, '✓ Anahtar gerekmez'),
          !can && C.key ? h('div', { class: 'small' }, 'Anahtar: ' + P.sources(C.key).join(' · ')) : null)));
      },
      actions: [{ label: 'Kapat' }, {
        label: C.req && C.req.puzzle ? 'Şifreyi Çöz' : 'Aç', cls: 'green', fn: (mm) => {
          if (!can) { D.UI.toast('Koşullar eksik.', 'bad'); return true; }
          if (C.req && C.req.puzzle) { mm.close(); P.codePuzzle(inst, after); return true; }
          const r = D.Game.act('openChest', { instanceId: inst.instanceId });
          if (!r.ok) { D.UI.toast(r.message, 'bad'); return true; }
          mm.close(); P.chestOpenAnim(inst.chestId, r.rewards, after); return true;
        }
      }]
    });
    return m;
  };
  P.chestOpenAnim = (chestId, got, after) => {
    D.Audio.sfx('chest');
    const wrap = h('div', { class: 'center col', style: { alignItems: 'center' } });
    const cv = D.UI.canvas(320, 260, () => {});
    wrap.append(cv);
    const ctx = cv.getContext('2d'); let t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, 320, 260);
      ctx.save(); ctx.translate(160, 150 + Math.sin(Math.min(t, 0.6) * 30) * (0.6 - Math.min(t, 0.6)) * 10);
      if (t > 0.6) { ctx.fillStyle = D.Art.rg(ctx, 0, -40, 4, 160, ['rgba(255,230,140,0.85)', 'rgba(255,230,140,0)']); ctx.fillRect(-160, -150, 320, 260); }
      D.ItemArt.draw(ctx, chestId, 0, 0, 220); ctx.restore();
      if (t < 1.5 && wrap.isConnected) requestAnimationFrame(draw);
    };
    draw();
    const list = D.UI.rewardList(got); list.style.opacity = '0'; list.style.transition = 'opacity .3s'; setTimeout(() => { list.style.opacity = '1'; }, 650);
    wrap.append(list);
    D.UI.modal({ title: D.itemName(chestId) + ' açıldı!', width: 1100, body: (b) => b.append(wrap), actions: [{ label: 'Topla', cls: 'green' }], onClose: after });
  };
  // Şifreli Kasa: 3 haneli kod (1–6), her denemede "doğru yer" ve "doğru rakam yanlış yer" ipucu.
  P.codePuzzle = (inst, after) => {
    const code = D.Actions.chestCode(D.Game.state, inst.instanceId);
    let guess = [], history = [];
    const m = D.UI.modal({
      title: 'Şifreli Kasa', width: 1200,
      body: (b) => {
        const disp = h('div', { class: 'row center', style: { fontSize: '1.8em', fontWeight: 900, letterSpacing: '12px' } });
        const hist = h('div', { class: 'col small' });
        const keys = h('div', { class: 'row wrap center' });
        const redraw = () => { disp.textContent = (guess.join('') + '___').slice(0, 3); UI2.clear(hist); history.slice(-6).forEach(([g, a, bb]) => hist.append(h('div', null, g + ' → ● ' + a + ' doğru yer · ○ ' + bb + ' yanlış yer'))); };
        const UI2 = D.UI;
        for (let d = 1; d <= 6; d++) keys.append(btn(String(d), () => { if (guess.length < 3) { guess.push(d); redraw(); D.Audio.sfx('tick'); } }, { cls: 'big' }));
        keys.append(btn('Sil', () => { guess.pop(); redraw(); }, { cls: 'red' }));
        keys.append(btn('Dene', () => {
          if (guess.length < 3) return;
          const g = guess.join(''); let a = 0, bb = 0; const cc = code.split(''), gg = g.split('');
          for (let i = 0; i < 3; i++) if (gg[i] === cc[i]) { a++; cc[i] = gg[i] = null; }
          for (let i = 0; i < 3; i++) if (gg[i] != null) { const j = cc.indexOf(gg[i]); if (j >= 0) { bb++; cc[j] = null; } }
          history.push([g, a, bb]); guess = [];
          if (a === 3) {
            const r = D.Game.act('openChest', { instanceId: inst.instanceId, code: g });
            if (r.ok) { m.close(); P.chestOpenAnim(inst.chestId, r.rewards, after); return; }
            D.UI.toast(r.message, 'bad');
          }
          redraw();
        }, { cls: 'green big' }));
        b.append(h('p', { class: 'small' }, 'Kasa 1–6 arası rakamlardan 3 haneli bir kod ister. Her denemede ipucu alırsın. Deneme sınırı yok; kapatırsan kasa kaybolmaz.'), disp, keys, hist);
        redraw();
      }
    });
  };
  D.Panels = P;
})(globalThis.DUMEN);
