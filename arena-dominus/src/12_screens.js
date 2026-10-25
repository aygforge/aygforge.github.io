/* =========================================================================
   Screens (UIManager views)
   ========================================================================= */

const MF_DEFAULT = { q: '', reg: '', cls: '', amin: 18, amax: 40, omin: 0, pmin: 0, vmax: 0, wmax: 0, con: '', free: false, sort: 'ovr', page: 1 };
UI.mf = { ...MF_DEFAULT };

const Screens = {
  // ------------------------------------------------------------ hub
  hub() {
    const me = GameState.player();
    const lg = S.leagues[me.lg];
    const tbl = Leagues.table(lg);
    const up = Calendar.upcoming(me.id, 4);
    const pend = Game.pendingPlayerMatch();
    const thisWeek = Game.playerFixture();
    const inj = GameState.rosterGlads(me).filter(g => g.injury);
    const exp = GameState.rosterGlads(me).filter(g => g.con && g.con.yrs <= 1);
    const sp = me.sponsor ? Sponsors.progress(me) : null;
    const nextTxt = f => {
      if (f.tbd) return `<div class="row small"><span class="pill">${f.w}. hf</span><span class="muted">${esc(f.tbd)}</span></div>`;
      const opp = S.clubs[f.m.h === me.id ? f.m.a : f.m.h];
      const res = f.m.r ? (f.m.r.w === (f.m.h === me.id ? 0 : 1) ? '<span class="good b">G</span>' : '<span class="bad b">M</span>') : '';
      return `<div class="row small" style="margin:.2rem 0"><span class="pill">${f.w}. hf</span>${H.crest(opp, 20)}<span class="grow ellip">${f.m.h === me.id ? '' : '@ '}${esc(opp.n)}</span><span class="tiny dim">${esc(Calendar.compName(f.comp).split(' · ')[0])}</span>${res}</div>`;
    };
    const pn = S.news.filter(n => n.p).slice(0, 7), wn = S.news.filter(n => !n.p).slice(0, 7);
    const news = arr => arr.length ? arr.map(n => `<div class="news-item ${n.p ? 'p' : ''}"><div class="w">${n.s}. sezon · ${weekLabel(n.w)}</div>${esc(n.t)}</div>`).join('') : '<div class="empty small">Henüz haber yok.</div>';
    let matchCard;
    if (S.week >= SEASON_WEEKS) matchCard = `<p>Sezon tamamlandı. Tarihçe ekranından sezon özetini inceleyin.</p><button class="btn gold" data-a="nextWeek">Yeni Sezona Geç</button>`;
    else if (thisWeek) {
      const opp = S.clubs[thisWeek.m.h === me.id ? thisWeek.m.a : thisWeek.m.h];
      matchCard = `<div class="row">${H.crest(me, 40)}<b class="big">vs</b>${H.crest(opp, 40)}<div class="col gap0 grow" style="min-width:0"><b class="ellip">${esc(opp.n)}</b><span class="tiny muted">${esc(Calendar.compName(thisWeek.comp))}</span><span class="tiny muted">${thisWeek.m.h === me.id ? 'İç saha' : thisWeek.m.nt ? 'Tarafsız saha' : 'Deplasman'} · ${TIERS[opp.tier].s} · ${Leagues.rankOf(opp.id)}. sıra</span></div></div>
        ${thisWeek.m.r ? `<p class="small">Maç oynandı: <b class="${thisWeek.m.r.w === (thisWeek.m.h === me.id ? 0 : 1) ? 'good' : 'bad'}">${thisWeek.m.r.w === (thisWeek.m.h === me.id ? 0 : 1) ? 'Galibiyet' : 'Mağlubiyet'}</b> (${Math.max(thisWeek.m.r.hs, thisWeek.m.r.as)}-${Math.min(thisWeek.m.r.hs, thisWeek.m.r.as)}). Haftayı tamamlamak için Sonraki Hafta'ya basın.</p>` : `<div class="row mt"><button class="btn gold grow" data-a="go" data-s="match">${Art.icon('match', 16)} Maça Git</button></div>`}`;
    } else matchCard = `<p class="small muted">Bu hafta maçınız yok.</p>${up[0] ? nextTxt(up[0]) : ''}`;
    return `<div class="grid hubgrid">
      <div class="col">
        <div class="card"><div class="row">${H.crest(me, 64)}<div class="col gap0 grow" style="min-width:0"><h2 style="margin:0" class="ellip">${esc(me.n)}</h2><span class="small muted">${H.reg(me.reg)} · ${TIERS[me.tier].n}</span><span class="small">Sıra: <b>${Leagues.rankOf(me.id)}.</b> · Hedef: ${esc(me.goal || '-')}</span></div></div>
          <div class="grid g3 mt small"><div><div class="tiny muted">Bütçe</div><b class="gold">${fmtGold(me.budget)}</b></div><div><div class="tiny muted">İtibar</div><b>${Math.round(me.rep)}</b>/100</div><div><div class="tiny muted">Taraftar</div><b>${fmtInt(me.fans)}</b></div></div></div>
        <div class="card"><h3>${Art.icon('match', 16)} ${S.week >= SEASON_WEEKS ? 'Sezon Sonu' : 'Bu Hafta'}</h3>${matchCard}</div>
        <div class="card"><h3>Durum</h3><div class="col small">
          <div class="row">${Art.icon('transfer', 14)} ${Calendar.windowLabel()}</div>
          <div class="row">${Art.icon('injury', 14)} ${inj.length ? inj.map(g => esc(g.n) + ' (' + g.injury.w + ' hf)').join(', ') : 'Sakat gladyatör yok'}</div>
          ${exp.length ? `<div class="row warn">${Art.icon('history', 14)} Sözleşmesi biten: ${exp.map(g => esc(g.n)).join(', ')}</div>` : ''}
          ${S.offers.length ? `<div class="row gold" data-a="go" data-s="market" data-tab="offers" style="cursor:pointer">${Art.icon('coin', 14)} ${S.offers.length} transfer teklifi bekliyor</div>` : ''}
          <div class="row">${Art.icon('sponsors', 14)} ${me.sponsor ? `${esc(me.sponsor.n)}: ${esc(me.sponsor.goal.txt)} — <span class="${sp && sp.ok ? 'good' : 'muted'}">${sp ? esc(sp.cur) : ''}</span>` : `<span class="warn">Hami yok${S.sponsorOffers.length ? ' — teklifleri inceleyin' : ''}</span>`}</div>
          ${me.arrears > 0 ? `<div class="row bad">${Art.icon('finance', 14)} Maaş borcu ${fmtGold(me.arrears)} — Finans ekranına bakın</div>` : ''}
          ${Squad.healthyCount(me) < 3 ? `<div class="row warn">Üç sağlıklı gladyatörünüz yok: eksik pozisyonlar geçici arena dövüşçüsüyle doldurulacak.</div>` : ''}
        </div></div>
      </div>
      <div class="col">
        <div class="card"><h3>${Art.icon('leagues', 16)} ${TIERS[me.tier].s}</h3><table class="t small"><tr><th>#</th><th>Kulüp</th><th class="n">O</th><th class="n">P</th><th>Form</th></tr>
          ${tbl.map(r => { const c = S.clubs[r.cid]; return `<tr class="click ${c.isPlayer ? 'me' : ''} ${r.rank <= 2 && lg.tier > 1 ? 'zone-up' : ''} ${r.rank >= 7 && lg.tier < 6 ? 'zone-down' : ''}" data-a="club" data-c="${c.id}"><td>${r.rank}</td><td><span class="row gap0">${H.crest(c, 18)} <span class="ellip" style="max-width:9rem">${esc(c.n)}</span></span></td><td class="n">${r.p}</td><td class="n b">${r.pts}</td><td>${H.form(r.form)}</td></tr>`; }).join('')}</table></div>
        <div class="card"><h3>Yaklaşan Maçlar</h3>${up.length ? up.map(nextTxt).join('') : '<div class="empty small">Sezonun kalanında maç yok.</div>'}</div>
      </div>
      <div class="col">
        <div class="card news"><h3>${Art.icon('news', 16)} Kulüp Haberleri</h3>${news(pn)}</div>
        <div class="card"><h3>Dünyadan</h3>${news(wn)}</div>
      </div></div>`;
  },

  // ------------------------------------------------------------ squad
  squad() {
    const me = GameState.player();
    const arr = Squad.arrangement(me);
    const card = (gid, idx) => {
      const ace = idx < 3;
      if (gid == null) return `<div class="gcard emptyslot" data-slot="${idx}"><div class="center small" style="text-align:center">Boş slot<br><button class="btn sm mt" data-a="go" data-s="market">Transfer Pazarı</button></div></div>`;
      const g = S.glads[gid];
      return `<div class="gcard ${ace ? 'ace' : ''} ${UI.squadSel === idx ? 'sel' : ''} ${g.injury ? 'injured' : ''}" data-slot="${idx}" data-gid="${gid}">
        <div class="top">${H.por(g, 3.3)}<div class="grow" style="min-width:0"><div class="nm">${esc(g.n)}</div><div class="tiny muted">${H.cls(g.cls)}</div><div class="tiny dim">${g.age} yaş · ${H.reg(g.reg)}</div></div>${H.ovr(g.ovr)}</div>
        <div class="lines"><span>Kondisyon</span><span>${Math.round(g.cond)}</span></div>${H.bar(g.cond, 100, g.cond < 55 ? 'r' : 'g')}
        <div class="lines"><span>Moral</span><span>${Math.round(g.mor)}</span><span>Durum</span><span>${g.injury ? `<span class="bad">${['', 'Hafif', 'Orta', 'Ağır'][g.injury.l]} (${g.injury.w} hf)</span>` : '<span class="good">Sağlıklı</span>'}</span><span>Değer</span><span>${fmtGold(g.val)}</span><span>Maaş</span><span>${fmtGold(g.con.wage)}/hf</span><span>Sözleşme</span><span class="${g.con.yrs <= 1 ? 'warn' : ''}">${g.con.yrs} sezon</span></div>
        <div class="acts"><button class="btn xs" data-a="profile" data-g="${gid}">Profil</button><button class="btn xs" data-a="go" data-s="equipment" data-g="${gid}">Ekipman</button></div></div>`;
    };
    const healthy = Squad.healthyCount(me);
    return `<div class="row mb wrap"><h2 style="margin:0">Kadro <span class="small muted">(${me.roster.length}/5)</span></h2><span class="small muted">İki karta sırayla dokunarak ya da sürükleyerek yer değiştirin. İlk üç kart maça çıkan as gladyatörlerdir.</span>
        <span class="right"></span><button class="btn sm" data-a="autoLineup">Otomatik diz</button><button class="btn sm gold" data-a="go" data-s="match">Maç Merkezi</button></div>
      ${healthy < 3 ? `<div class="card warn small mb">Sadece ${healthy} sağlıklı gladyatörünüz var. Maçta eksik pozisyonlar düşük seviyeli geçici arena dövüşçüsüyle doldurulacak (kalıcı kadro slotu kullanmaz).</div>` : ''}
      <div class="squad-grid">
        ${POSITIONS.map((p, i) => `<div><div class="slotlbl">${p}</div>${card(arr[i], i)}</div>`).join('')}
        <div class="divider"></div>
        ${[3, 4].map(i => `<div><div class="slotlbl bench">Yedek</div>${card(arr[i], i)}</div>`).join('')}
      </div>
      <div class="card mt small"><b>Diziliş:</b> Ön Hat ortadan ilerler, kanatlar yanlardan başlar. Maç başladıktan sonra dövüşçüler serbestçe hareket eder. Murmillo/Secutor gibi kalkanlı sınıflar ön hatta, menzilli Retiarius ve Hoplomachus kanatlarda daha verimlidir. Kondisyonu düşük gladyatörler daha zayıf dövüşür — rotasyon yapın.</div>`;
  },
  after_squad() {
    const me = GameState.player();
    let drag = null;
    $$('.gcard[data-slot]').forEach(el => {
      el.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return;
        drag = { el, x: e.clientX, y: e.clientY, slot: +el.dataset.slot, moved: false, ghost: null, pid: e.pointerId };
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', e => {
        if (!drag || drag.el !== el) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 10 && el.dataset.gid) {
          drag.moved = true;
          const r = el.getBoundingClientRect();
          const gh = el.cloneNode(true); gh.classList.add('ghost-card'); gh.style.width = r.width + 'px'; gh.style.left = r.left + 'px'; gh.style.top = r.top + 'px';
          document.body.appendChild(gh); drag.ghost = gh; drag.ox = r.left; drag.oy = r.top;
        }
        if (drag.moved) {
          drag.ghost.style.left = (drag.ox + dx) + 'px'; drag.ghost.style.top = (drag.oy + dy) + 'px';
          $$('.gcard').forEach(c => c.classList.remove('drop'));
          const over = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.classList && n.classList.contains('gcard') && !n.classList.contains('ghost-card'));
          if (over && over !== el) over.classList.add('drop');
        }
      });
      const end = e => {
        if (!drag || drag.el !== el) return;
        const d = drag; drag = null;
        if (d.ghost) d.ghost.remove();
        $$('.gcard').forEach(c => c.classList.remove('drop'));
        if (d.moved) {
          const over = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.classList && n.classList.contains('gcard') && !n.classList.contains('ghost-card'));
          if (over && over.dataset.slot != null && +over.dataset.slot !== d.slot) Actions.swapSlots(d.slot, +over.dataset.slot);
        } else if (e.type === 'pointerup') Actions.squadTap({ slot: d.slot });
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    });
  },

  // ------------------------------------------------------------ profile
  profile(p) {
    const g = S.glads[p.gid];
    if (!g) return `<div class="card">Gladyatör bulunamadı (emekli olmuş olabilir). <button class="btn sm" data-a="go" data-s="${p.back || 'hub'}">Geri</button></div>`;
    const me = GameState.player();
    const own = g.club === me.id;
    const club = g.club >= 0 ? S.clubs[g.club] : null;
    const C = CLASSES[g.cls];
    const lvl = Scouting.level(g);
    const attr = k => `<div class="attr"><span>${ATTR_NAMES[k]}</span>${H.bar(g[k], 100, k === 'cha' ? 'b' : '')}<b class="n" style="text-align:right">${Math.round(g[k])}</b></div>`;
    const st = (o, label) => `<tr><td>${label}</td><td class="n">${o.m}</td><td class="n">${o.w}</td><td class="n">${o.ko}</td><td class="n">${fmtInt(o.dmg)}</td><td class="n">${fmtInt(o.tk)}</td><td class="n">${o.sv}</td><td class="n">${o.blk}</td></tr>`;
    const eq = ['w', 'a', 'x'].map(s => { const it = S.items[g.eq[s]]; return `<div class="row small"><span class="pill">${SLOT_NAMES[s]}</span>${it ? `<span style="color:${QUALITIES[it.q].c}">${esc(Equipment.name(it))}</span>` : '<span class="dim">Temel sınıf ekipmanı</span>'}</div>`; }).join('');
    const nego = Transfer.nego(g.id);
    let acts = '';
    if (own) {
      acts = `<button class="btn sm" data-a="go" data-s="equipment" data-g="${g.id}">${Art.icon('equipment', 14)} Ekipman</button>
        ${g.con.yrs <= 2 ? `<button class="btn sm gold" data-a="renew" data-g="${g.id}">Sözleşme Uzat</button>` : ''}
        <button class="btn sm primary" data-a="release" data-g="${g.id}">Sözleşmeyi Feshet (${fmtGold(Transfer.releaseCost(g))})</button>`;
    } else {
      const err = Transfer.canBuy(g);
      acts = `<button class="btn sm gold ${err ? 'disabled' : ''}" data-a="nego" data-g="${g.id}">${g.club < 0 ? 'Sözleşme Teklif Et' : 'Transfer Teklifi'}</button>
        <button class="btn sm ${lvl >= 3 || Scouting.reportsLeft() <= 0 ? 'disabled' : ''}" data-a="scoutReport" data-g="${g.id}">${Art.icon('eye', 14)} Keşif Raporu (${fmtGold(Scouting.reportCost())}, ${Scouting.reportsLeft()} hak)</button>
        ${err ? `<div class="tiny warn" style="flex-basis:100%">${esc(err)}</div>` : ''}${nego && nego.msg ? `<div class="tiny muted" style="flex-basis:100%">Son görüşme: ${esc(nego.msg)}</div>` : ''}`;
    }
    return `<div class="row mb"><button class="btn ghost sm" data-a="go" data-s="${p.back || 'squad'}">${Art.icon('back', 14)} Geri</button><h2 style="margin:0" class="grow ellip">${esc(g.n)}</h2>${club ? `<span class="row small" data-a="club" data-c="${club.id}" style="cursor:pointer">${H.crest(club, 22)} ${esc(club.n)}</span>` : '<span class="pill gold">Serbest Gladyatör</span>'}</div>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) minmax(0,1.1fr)">
        <div class="col">
          <div class="card"><div class="row" style="align-items:flex-start">${H.por(g, 6.5)}<div class="col gap0 grow"><div>${H.cls(g.cls)}</div><div class="tiny muted">${C.role}</div><div class="tiny muted">${C.gear}</div><div class="small mt">${g.age} yaş · ${H.reg(g.reg)}</div><div class="row mt">${H.ovr(g.ovr)}<span class="tiny muted">Genel güç</span></div></div></div>
            <div class="kv mt"><span>Tahmini potansiyel</span><span class="gold b">${H.pot(g)}</span><span>Piyasa değeri</span><span>${fmtGold(g.val)}</span><span>Kondisyon</span><span>${Math.round(g.cond)} / 100</span><span>Moral</span><span>${Math.round(g.mor)} / 100</span><span>Sağlık</span><span>${H.inj(g)}</span><span>Keşif bilgisi</span><span>${['Belirsiz', 'Temel', 'İyi', 'Kesin'][lvl]}</span></div>
          </div>
          <div class="card"><h3>Özel Teknik: ${C.sp.name}</h3><div class="small muted">${C.sp.desc}</div><div class="tiny dim mt">Bekleme süresi ~${C.sp.cd} sn · Teknik özelliği etkinliği artırır.</div></div>
        </div>
        <div class="col">
          <div class="card"><h3>Özellikler</h3>${ATTRS.map(attr).join('')}<div class="tiny dim">Karizma savaş hasarını etkilemez; popülerlik, seyirci ilgisi ve ticari değeri belirler.</div></div>
          <div class="card"><h3>Gizli Özellikler <span class="tiny muted">(keşif tahmini)</span></h3><div class="kv"><span>Potansiyel</span><span>${H.pot(g)}</span><span>Sakatlık eğilimi</span><span>${Scouting.trait(g, 'inj')}</span><span>Sadakat</span><span>${Scouting.trait(g, 'loy')}</span><span>Baskı altında</span><span>${Scouting.trait(g, 'clu')}</span><span>Gelişim hızı</span><span>${Scouting.trait(g, 'grow')}</span></div></div>
        </div>
        <div class="col">
          <div class="card"><h3>Sözleşme</h3>${g.con ? `<div class="kv"><span>Haftalık maaş</span><span>${fmtGold(g.con.wage)}</span><span>Kalan süre</span><span>${g.con.yrs} sezon</span><span>Galibiyet bonusu</span><span>${fmtGold(g.con.winB)}</span><span>Şampiyonluk bonusu</span><span>${fmtGold(g.con.titleB)}</span></div>` : `<div class="small muted">Sözleşmesi yok. Beklenen maaş: ~${fmtGold(Transfer.demand(g, me, false).wage)}/hf · ${g.fw} haftadır serbest.</div>`}
            <div class="row wrap mt">${acts}</div></div>
          <div class="card"><h3>Ekipman</h3>${eq}</div>
        </div>
      </div>
      <div class="grid g2 mt">
        <div class="card"><h3>İstatistikler</h3><table class="t small"><tr><th></th><th class="n">Maç</th><th class="n">G</th><th class="n">Eleme</th><th class="n">Hasar</th><th class="n">Alınan</th><th class="n">Ayakta</th><th class="n">Blok</th></tr>${st(g.ss, 'Bu sezon (lig)')}${st(g.cs, 'Kariyer')}</table></div>
        <div class="card"><h3>Başarılar ve Geçmiş</h3>${g.aw.length ? g.aw.slice(-8).reverse().map(a => `<div class="small">${Art.icon('star', 12)} ${a.s}. sezon — ${esc(a.t)}</div>`).join('') : '<div class="small dim">Henüz ödül yok.</div>'}
          <div class="sep"></div><div class="tiny muted">Kulüpler: ${g.hist.map(h => `${h.s}. sz ${esc(H.club(h.c))}`).join(' → ') || '-'}</div></div>
      </div>`;
  },

  // ------------------------------------------------------------ transfer market
  marketList() {
    const f = UI.mf, me = GameState.player();
    const q = f.q.trim().toLocaleLowerCase('tr');
    const out = [];
    for (const id in S.glads) {
      const g = S.glads[id];
      if (g.club === me.id) continue;
      if (f.free && g.club >= 0) continue;
      if (!Scouting.canSee(g)) continue;
      if (q && !g.n.toLocaleLowerCase('tr').includes(q)) continue;
      if (f.reg && g.reg !== f.reg) continue;
      if (f.cls && g.cls !== f.cls) continue;
      if (g.age < f.amin || g.age > f.amax) continue;
      if (f.omin && g.ovr < f.omin) continue;
      if (f.pmin && Scouting.potMid(g) < f.pmin) continue;
      if (f.vmax && g.val > f.vmax) continue;
      const wage = g.con ? g.con.wage : TransferMath.expectedWage(g);
      if (f.wmax && wage > f.wmax) continue;
      if (f.con === 'exp' && !(g.con && g.con.yrs <= 1)) continue;
      out.push(g);
    }
    const key = { ovr: g => -g.ovr, pot: g => -Scouting.potMid(g), age: g => g.age, val: g => -g.val, valA: g => g.val, wage: g => (g.con ? g.con.wage : TransferMath.expectedWage(g)), name: null }[f.sort];
    if (key) out.sort((a, b) => key(a) - key(b) || a.id - b.id); else out.sort((a, b) => a.n.localeCompare(b.n, 'tr'));
    return out;
  },
  market(p) {
    const tab = p.tab || UI.marketTab || 'all';
    UI.marketTab = tab;
    const me = GameState.player();
    const win = Calendar.isWindow();
    const negos = Object.values(S.nego).filter(n => S.glads[n.gid] && (n.win === Transfer.windowId() || n.renew));
    const tabs = `<div class="tabs"><span class="tab ${tab === 'all' ? 'on' : ''}" data-a="marketTab" data-t="all">Pazar</span><span class="tab ${tab === 'free' ? 'on' : ''}" data-a="marketTab" data-t="free">Serbest Gladyatörler</span>
      <span class="tab ${tab === 'offers' ? 'on' : ''}" data-a="marketTab" data-t="offers">Gelen Teklifler ${S.offers.length ? `<span class="n">${S.offers.length}</span>` : ''}</span><span class="tab ${tab === 'nego' ? 'on' : ''}" data-a="marketTab" data-t="nego">Görüşmeler ${negos.length ? `<span class="n">${negos.length}</span>` : ''}</span><span class="tab ${tab === 'log' ? 'on' : ''}" data-a="marketTab" data-t="log">Transfer Geçmişi</span></div>`;
    const head = `<div class="row mb wrap"><h2 style="margin:0">Transfer Pazarı</h2><span class="chip ${win ? 'win' : 'closed'}">${Calendar.windowLabel()}</span><span class="chip">Kadro ${me.roster.length}/5</span><span class="chip">Keşif: ${Scouting.regions().map(r => H.reg(r)).join(', ')}</span><span class="chip">${Scouting.reportsLeft()} rapor hakkı</span></div>`;
    if (tab === 'offers') {
      const rows = S.offers.map(o => { const g = S.glads[o.gid], c = S.clubs[o.from]; if (!g || !c) return ''; return `<div class="card tight row wrap mb">${H.por(g, 2.6)}<div class="grow"><b>${esc(g.n)}</b> <span class="tiny muted">${CLASSES[g.cls].name} · ${Math.round(g.ovr)} · Değer ${fmtGold(g.val)}</span><div class="small">${H.crest(c, 18)} <b>${esc(c.n)}</b> (${TIERS[c.tier].s}) teklif ediyor: <b class="gold">${fmtGold(o.fee)}</b></div></div>
        <button class="btn sm" data-a="offerResp" data-o="${o.id}" data-r="reject">Reddet</button><button class="btn sm" data-a="offerResp" data-o="${o.id}" data-r="counter" ${o.countered ? 'disabled' : ''}>Pazarlık (+%20)</button><button class="btn sm gold" data-a="offerResp" data-o="${o.id}" data-r="accept">Kabul Et</button></div>`; }).join('');
      return head + tabs + (rows || '<div class="card empty">Şu an gelen teklif yok. Yapay zekâ kulüpleri transfer dönemlerinde gladyatörleriniz için teklif yapabilir; onayınız olmadan kimse satılmaz.</div>');
    }
    if (tab === 'nego') {
      const rows = negos.map(n => { const g = S.glads[n.gid]; return `<div class="card tight row wrap mb">${H.por(g, 2.4)}<div class="grow"><b>${esc(g.n)}</b> <span class="tiny muted">${esc(H.club(g.club))}</span><div class="small muted">${n.blocked ? '<span class="bad">Görüşme sona erdi.</span> ' : n.stage === 'contract' ? 'Sözleşme aşaması. ' : 'Bonservis aşaması. '}${esc(n.msg || '')}</div></div>${n.blocked ? '' : `<button class="btn sm gold" data-a="nego" data-g="${g.id}">Devam Et</button>`}</div>`; }).join('');
      return head + tabs + (rows || '<div class="card empty">Aktif görüşme yok.</div>');
    }
    if (tab === 'log') {
      const rows = S.transfers.slice(0, 120).map(t => `<tr class="${t.f === me.id || t.t === me.id ? 'me' : ''}"><td>${t.s}/${t.w}</td><td>${esc(t.n)}</td><td class="n">${t.ovr}</td><td>${t.f >= 0 ? esc(H.club(t.f)) : '<span class="dim">Serbest</span>'}</td><td>${t.t >= 0 ? esc(H.club(t.t)) : '<span class="dim">Serbest</span>'}</td><td>${({ transfer: 'Transfer', free: 'Serbest imza', release: 'Fesih', expire: 'Sözleşme bitti' })[t.ty] || t.ty}</td><td class="n">${t.fee ? fmtGold(t.fee) : '-'}</td></tr>`).join('');
      return head + tabs + `<div class="card"><table class="t small"><tr><th>Sz/Hf</th><th>Gladyatör</th><th class="n">GG</th><th>Nereden</th><th>Nereye</th><th>Tür</th><th class="n">Bedel</th></tr>${rows}</table></div>`;
    }
    if (tab === 'free') UI.mf.free = true; else if (p.tab === 'all') UI.mf.free = false;
    const f = UI.mf;
    const list = this.marketList();
    const per = 40, shown = list.slice(0, per * f.page);
    const opt = (v, cur, t) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${t}</option>`;
    const filters = `<div class="card market-filters mb"><div class="filters">
      <label>Ad<input type="text" data-ch="mf" data-k="q" value="${esc(f.q)}" placeholder="Ara…"></label>
      <label>Bölge<select data-ch="mf" data-k="reg">${opt('', f.reg, 'Tümü')}${REGIONS.map(r => opt(r.id, f.reg, r.name)).join('')}</select></label>
      <label>Sınıf<select data-ch="mf" data-k="cls">${opt('', f.cls, 'Tümü')}${CLASS_IDS.map(c => opt(c, f.cls, CLASSES[c].name)).join('')}</select></label>
      <label>Yaş<div class="row gap0"><input type="number" data-ch="mf" data-k="amin" value="${f.amin}" min="18" max="45" style="width:50%"><input type="number" data-ch="mf" data-k="amax" value="${f.amax}" min="18" max="45" style="width:50%"></div></label>
      <label>Min. genel güç<input type="number" data-ch="mf" data-k="omin" value="${f.omin || ''}" min="0" max="99"></label>
      <label>Min. tah. potansiyel<input type="number" data-ch="mf" data-k="pmin" value="${f.pmin || ''}" min="0" max="99"></label>
      <label>Maks. değer<input type="number" data-ch="mf" data-k="vmax" value="${f.vmax || ''}" min="0" step="500"></label>
      <label>Maks. maaş<input type="number" data-ch="mf" data-k="wmax" value="${f.wmax || ''}" min="0" step="10"></label>
      <label>Sözleşme<select data-ch="mf" data-k="con">${opt('', f.con, 'Tümü')}${opt('exp', f.con, 'Bitmek üzere (≤1)')}</select></label>
      <label>Sırala<select data-ch="mf" data-k="sort">${opt('ovr', f.sort, 'Genel güç')}${opt('pot', f.sort, 'Tahmini potansiyel')}${opt('age', f.sort, 'Yaş (genç)')}${opt('val', f.sort, 'Değer (yüksek)')}${opt('valA', f.sort, 'Değer (düşük)')}${opt('wage', f.sort, 'Maaş (düşük)')}${opt('name', f.sort, 'Ad')}</select></label>
      <label class="row" style="flex-direction:row;align-items:center"><input type="checkbox" data-ch="mfFree" ${f.free ? 'checked' : ''}> Yalnız serbest</label>
      <button class="btn sm ghost" data-a="filterReset">Filtreleri sıfırla</button></div></div>`;
    const rows = shown.map(g => {
      const c = g.club >= 0 ? S.clubs[g.club] : null;
      const wage = g.con ? g.con.wage : TransferMath.expectedWage(g);
      return `<div class="grow-row" data-a="profile" data-g="${g.id}" data-back="market">${H.por(g, 2.3)}<div style="min-width:0"><div class="nm ellip">${esc(g.n)}</div><div class="sub ellip">${c ? esc(c.n) + ' · ' + TIERS[c.tier].s : '<span class="gold">Serbest</span>'}</div></div><div class="small">${H.cls(g.cls)}</div><div>${g.age}</div><div class="small">${H.reg(g.reg)}</div><div>${H.ovr(g.ovr)} <span class="tiny gold">${H.pot(g)}</span></div><div class="small">${fmtGold(g.val)}</div><div class="small">${fmtGold(wage)}</div><div class="small ${g.con && g.con.yrs <= 1 ? 'warn' : ''}">${g.con ? g.con.yrs + ' sz' : '—'}</div></div>`;
    }).join('');
    return head + tabs + filters + `<div class="small muted mb">${fmtInt(list.length)} gladyatör bulundu.</div><div class="grow-list"><div class="grow-row head"><span></span><span>Ad / Kulüp</span><span>Sınıf</span><span>Yaş</span><span>Bölge</span><span>GG · Pot.</span><span>Değer</span><span>Maaş/hf</span><span>Sözl.</span></div>${rows || '<div class="empty">Filtrelere uyan gladyatör yok.</div>'}</div>
      ${list.length > shown.length ? `<div class="center mt"><button class="btn" data-a="marketMore">Daha fazla göster (${list.length - shown.length})</button></div>` : ''}`;
  },

  // ------------------------------------------------------------ leagues
  leagues(p) {
    const me = GameState.player();
    const reg = p.reg || UI.lgReg || me.reg, tier = p.tier || UI.lgTier || me.tier, tab = p.tab || UI.lgTab || 'table';
    UI.lgReg = reg; UI.lgTier = tier; UI.lgTab = tab;
    const lg = S.leagues[GameState.leagueIndex(GameState.regIdx(reg), tier)];
    const tbl = Leagues.table(lg);
    let content;
    if (tab === 'table') {
      content = `<table class="t"><tr><th>#</th><th>Kulüp</th><th class="n">O</th><th class="n">G</th><th class="n">M</th><th class="n">E+</th><th class="n">E-</th><th class="n">Av.</th><th class="n">Puan</th><th>Form</th><th class="n">Kadro</th></tr>
        ${tbl.map(r => { const c = S.clubs[r.cid]; return `<tr class="click ${c.isPlayer ? 'me' : ''} ${r.rank <= 2 && tier > 1 ? 'zone-up' : ''} ${r.rank >= 7 && tier < 6 ? 'zone-down' : ''}" data-a="club" data-c="${c.id}"><td>${r.rank}</td><td><span class="row">${H.crest(c, 22)}<span class="ellip">${esc(c.n)}</span></span></td><td class="n">${r.p}</td><td class="n">${r.w}</td><td class="n">${r.l}</td><td class="n">${r.kf}</td><td class="n">${r.ka}</td><td class="n">${r.kf - r.ka}</td><td class="n b gold">${r.pts}</td><td>${H.form(r.form)}</td><td class="n">${H.ovr(Squad.avgOvr(c))}</td></tr>`; }).join('')}</table>
        <div class="tiny muted mt">Galibiyet 3 puan, beraberlik yok. Eşitlikte: galibiyet, ikili maçlar, eleme averajı, kalan can performansı, itibar. ${tier > 1 ? 'İlk iki kulüp üst lige çıkar. ' : ''}${tier < 6 ? 'Son iki kulüp alt lige düşer.' : ''}</div>`;
    } else {
      const rd = clamp(p.round != null ? +p.round : (UI.lgRound != null ? UI.lgRound : Math.max(0, LEAGUE_WEEKS.findIndex(w => w >= S.week))), 0, 13);
      UI.lgRound = rd;
      content = `<div class="tabs">${LEAGUE_WEEKS.map((w, i) => `<span class="tab ${i === rd ? 'on' : ''}" data-a="leagueRound" data-r="${i}">${i + 1}. maç <span class="tiny">(${w}.hf)</span></span>`).join('')}</div>
        ${lg.rounds[rd].map(m => { const h = S.clubs[m.h], a = S.clubs[m.a]; const r = m.r; return `<div class="card tight row mb ${h.isPlayer || a.isPlayer ? 'me' : ''}" style="${h.isPlayer || a.isPlayer ? 'border-color:var(--gold)' : ''}"><span class="row grow ellip" style="justify-content:flex-end;${r && r.w === 0 ? 'font-weight:700' : ''}">${esc(h.n)} ${H.crest(h, 22)}</span><span class="serif" style="min-width:4rem;text-align:center">${r ? `${r.hs} – ${r.as}` : `${LEAGUE_WEEKS[rd]}. hf`}</span><span class="row grow ellip" style="${r && r.w === 1 ? 'font-weight:700' : ''}">${H.crest(a, 22)} ${esc(a.n)}</span></div>`; }).join('')}
        <div class="tiny muted">Skor: maç sonunda ayakta kalan gladyatör sayısı.</div>`;
    }
    return `<div class="row mb"><h2 style="margin:0">Ligler</h2></div>
      <div class="tabs">${REGIONS.map(r => `<span class="tab ${reg === r.id ? 'on' : ''}" data-a="leaguesReg" data-r="${r.id}">${Art.regionSVG(r.id, 16)} ${r.name}</span>`).join('')}</div>
      <div class="tabs">${[1, 2, 3, 4, 5, 6].map(t => `<span class="tab ${tier === t ? 'on' : ''}" data-a="leaguesTier" data-t="${t}">${t}. ${TIERS[t].s}</span>`).join('')}</div>
      <div class="card"><div class="row mb"><h3 style="margin:0" class="grow">${REGION_BY_ID[reg].name} · ${TIERS[tier].n}</h3><div class="seg"><button class="${tab === 'table' ? 'on' : ''}" data-a="leaguesTab" data-t="table">Puan Tablosu</button><button class="${tab === 'fix' ? 'on' : ''}" data-a="leaguesTab" data-t="fix">Fikstür / Sonuçlar</button></div></div>${content}</div>`;
  },
  clubModal(cid) {
    const c = S.clubs[cid]; if (!c) return;
    const me = GameState.player();
    const rows = GameState.rosterGlads(c).map(g => `<tr class="click" data-a="profile" data-g="${g.id}" data-back="${UI.screen === 'profile' ? 'hub' : UI.screen}"><td><span class="row">${H.por(g, 1.8, [c.crest.c1, c.crest.c2])}<span>${esc(g.n)}${c.lineup.includes(g.id) ? ' <span class="pill gold">As</span>' : ''}</span></span></td><td>${CLASSES[g.cls].name}</td><td class="n">${g.age}</td><td class="n">${H.ovr(g.ovr)}</td><td class="n">${fmtGold(g.val)}</td><td>${g.injury ? '<span class="bad">Sakat</span>' : ''}</td></tr>`).join('');
    const riv = Object.entries(c.riv).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${esc(H.club(+k))} (${v})`).join(', ');
    const hist = c.hist.slice(-5).reverse().map(h => `${h.s}. sz: ${TIERS[h.tier].s} ${h.rank}.`).join(' · ');
    UI.modal(`${esc(c.n)}`, `<div class="row" style="align-items:flex-start">${H.crest(c, 70)}<div class="grow"><div class="small muted">${H.reg(c.reg)} · ${TIERS[c.tier].n} · ${Leagues.rankOf(c.id)}. sıra</div>
      <div class="kv mt"><span>Politika</span><span>${c.isPlayer ? 'Oyuncu kulübü' : POLICIES[c.pol].n + ' — ' + POLICIES[c.pol].desc}</span><span>Sezon hedefi</span><span>${esc(c.goal || '-')}</span><span>Bütçe</span><span>${fmtGold(c.budget)}${c.arrears > 0 ? ` <span class="bad">(borç ${fmtGold(c.arrears)})</span>` : ''}</span><span>İtibar / Taraftar</span><span>${Math.round(c.rep)} · ${fmtInt(c.fans)}</span><span>Tesisler</span><span>Eğitim ${c.fac.train} · Revir ${c.fac.med} · Keşif ${c.fac.scout} · Arena ${c.fac.arena}</span><span>Maaş yükü</span><span>${fmtGold(Economy.wageBill(c))}/hf</span><span>Rekabetler</span><span>${riv || '-'}</span><span>Geçmiş</span><span>${hist || '-'}</span><span>Kupalar</span><span>${c.trophies.length ? c.trophies.slice(-4).map(t => esc(t.s + '. sz ' + t.t)).join(', ') : '-'}</span></div></div></div>
      <div class="sep"></div><table class="t small"><tr><th>Gladyatör</th><th>Sınıf</th><th class="n">Yaş</th><th class="n">GG</th><th class="n">Değer</th><th></th></tr>${rows}</table>
      ${c.id !== me.id && !Scouting.regions().includes(c.reg) ? '<div class="tiny warn mt">Keşif ağınız bu bölgeyi kapsamadığı için bu kulübe teklif yapamazsınız.</div>' : ''}`, '', 'mid');
  },

  // ------------------------------------------------------------ cups
  cups(p) {
    const me = GameState.player();
    const tab = p.tab || UI.cupTab || me.reg;
    UI.cupTab = tab;
    const tabs = `<div class="tabs">${REGIONS.map(r => `<span class="tab ${tab === r.id ? 'on' : ''}" data-a="cupsTab" data-t="${r.id}">${Art.regionSVG(r.id, 16)} ${r.name} Kupası</span>`).join('')}<span class="tab ${tab === 'imp' ? 'on' : ''}" data-a="cupsTab" data-t="imp">${Art.icon('cups', 14)} İmparatorluk Kupası</span><span class="tab ${tab === 'champs' ? 'on' : ''}" data-a="cupsTab" data-t="champs">Şampiyonlar</span></div>`;
    if (tab === 'champs') {
      const rows = S.hist.champs.slice().reverse().map(c => `<tr class="${c.c === me.id ? 'me' : ''}"><td>${c.s}. sezon</td><td>${esc(c.n)}</td><td><span class="row">${H.crest(S.clubs[c.c], 18)} ${esc(c.cn)}</span></td><td class="dim">${esc(c.rn)}</td></tr>`).join('');
      return `<h2>Kupalar</h2>${tabs}<div class="card">${rows ? `<table class="t"><tr><th>Sezon</th><th>Kupa</th><th>Şampiyon</th><th>Finalist</th></tr>${rows}</table>` : '<div class="empty">Henüz tamamlanmış kupa yok.</div>'}</div>`;
    }
    const cup = tab === 'imp' ? S.icup : S.rcups[tab];
    if (!cup) {
      return `<h2>Kupalar</h2>${tabs}<div class="card"><h3>İmparatorluk Kupası</h3><p>İmparatorluk Kupası'na beş bölgenin Altın Kolezyum liglerini <b>önceki sezon</b> ilk iki sırada bitiren 10 kulüp katılır. İlk kariyer sezonunda önceki sezon sonucu bulunmadığından kupa <b>2. sezondan itibaren</b> düzenlenir.</p>
        <p class="small muted">Format: 4 kulüp ön elemede oynar; 2 kazanan, 5 şampiyon ve en iyi ikinciyle (6 seri başı) çeyrek finalde buluşur. Ardından yarı final ve Büyük Kolezyum'da final. Maç haftaları: ${ICUP_WEEKS.join(', ')}.</p></div>`;
    }
    const alive = Cups.alive(cup, me.id);
    const bm = m => {
      const h = S.clubs[m.h], a = S.clubs[m.a]; const r = m.r;
      const sH = r ? (r.w === 0 ? 'w' : 'l') : '', sA = r ? (r.w === 1 ? 'w' : 'l') : '';
      return `<div class="bm ${h.isPlayer || a.isPlayer ? 'me' : ''}"><div class="s ${sH}">${H.crest(h, 15)}<span class="grow ellip">${esc(h.n)}</span><span class="tiny dim">${h.tier}</span>${r ? `<b>${r.hs}</b>` : ''}</div><div class="s ${sA}">${H.crest(a, 15)}<span class="grow ellip">${esc(a.n)}</span><span class="tiny dim">${a.tier}</span>${r ? `<b>${r.as}</b>` : ''}</div></div>`;
    };
    const byes = cup.byes ? `<div class="bround"><h4>Bay geçenler (1.–2. lig)</h4>${cup.byes.map(cid => `<div class="bm"><div class="s">${H.crest(S.clubs[cid], 15)}<span class="ellip">${esc(S.clubs[cid].n)}</span></div></div>`).join('')}</div>` : '';
    const seeds = cup.seeds ? `<div class="bround"><h4>Seri başları</h4>${cup.seeds.map(cid => `<div class="bm"><div class="s">${H.crest(S.clubs[cid], 15)}<span class="ellip">${esc(S.clubs[cid].n)}</span></div></div>`).join('')}</div>` : '';
    return `<h2>Kupalar</h2>${tabs}<div class="card"><div class="row mb wrap"><h3 style="margin:0" class="grow">${esc(cup.name)} · ${cup.season}. sezon</h3>
        ${cup.champ >= 0 ? `<span class="pill gold">${Art.icon('cups', 12)} Şampiyon: ${esc(S.clubs[cup.champ].n)}</span>` : ''}${cup.part.includes(me.id) ? `<span class="pill ${alive ? 'ok' : ''}">${alive ? 'Kupada devam ediyorsunuz' : 'Elendiniz'}</span>` : ''}</div>
        <div class="tiny muted mb">${cup.key === 'imp' ? 'Tek maç eleme. Final tarafsız Büyük Kolezyum\'da oynanır.' : 'Bölgedeki 48 kulübün tamamı katılır. 1. turda 3.–6. lig kulüpleri (32) oynar; 1. ve 2. lig kulüpleri (16) bay geçer. Tek maç eleme; alt lig kulübü ev sahibidir, final tarafsız sahadadır.'} Maç haftaları: ${cup.rounds.map(r => r.wk).join(', ')}.</div>
        <div class="bracket">${byes}${seeds}${cup.rounds.map(rd => `<div class="bround"><h4>${rd.n} · ${rd.wk}. hf</h4>${rd.m.length ? rd.m.map(bm).join('') : '<div class="bm dim">Kura bekleniyor</div>'}</div>`).join('')}</div></div>`;
  },

  // ------------------------------------------------------------ match centre
  match() {
    const me = GameState.player();
    const f = Game.playerFixture();
    const up = Calendar.upcoming(me.id, 3).find(x => !x.tbd && !(x.m && x.m.r));
    const target = f && !f.m.r ? f : null;
    const show = target || (up ? { m: up.m, comp: up.comp, w: up.w } : null);
    const lineup = MatchSystem.lineupGlads(me, 1);
    const tacs = Object.values(TACTICS).map(t => `<div class="tactic ${me.tactic === t.id ? 'on' : ''}" data-a="setTactic" data-t="${t.id}"><b>${t.name}</b><div class="tiny muted">${t.desc}</div></div>`).join('');
    const mine = `<div class="card"><h3>As Kadro & Diziliş</h3>${lineup.map((g, i) => `<div class="row small" style="margin:.25rem 0"><span class="pill" style="min-width:4.6rem;text-align:center">${POSITIONS[i]}</span>${H.por(g, 2.2)}<div class="grow" style="min-width:0"><b class="ellip">${esc(g.n)}</b>${g.temp ? ' <span class="pill">Geçici</span>' : ''}<div class="tiny dim">${CLASSES[g.cls].name} · Kond. ${Math.round(g.cond)} · Moral ${Math.round(g.mor)}</div></div>${H.ovr(g.ovr)}</div>`).join('')}
      <div class="row mt"><button class="btn sm" data-a="go" data-s="squad">Kadroyu Düzenle</button><span class="tiny muted">Ortalama: ${Math.round(Squad.teamOvr(lineup))}</span></div></div>`;
    let opp = '';
    if (show) {
      const oc = S.clubs[show.m.h === me.id ? show.m.a : show.m.h];
      const ol = MatchSystem.lineupGlads(oc, 2);
      const row = Leagues.table(S.leagues[oc.lg]).find(r => r.cid === oc.id);
      const tend = { def: 'Savunmacı / Koruma Düzeni', agg: 'Saldırgan / Odaklı Av', rich: 'Dengeli / Odaklı Av', talent: 'Dengeli', econ: 'Dengeli' }[oc.pol];
      opp = `<div class="card"><h3>Rakip Analizi</h3><div class="row">${H.crest(oc, 44)}<div class="grow"><b>${esc(oc.n)}</b><div class="tiny muted">${TIERS[oc.tier].s} · ${row ? row.rank + '. sıra · ' + row.pts + ' puan' : ''}</div><div>${H.form(row ? row.form : [])}</div></div></div>
        <div class="tiny muted mt">Olası as kadro:</div>${ol.map(g => `<div class="row small" style="margin:.2rem 0">${H.por(g, 1.9, [oc.crest.c1, oc.crest.c2])}<span class="grow ellip">${esc(g.n)}</span><span class="dim">${CLASSES[g.cls].name}</span><span class="tiny dim">K${Math.round(g.cond)}</span>${H.ovr(g.ovr)}</div>`).join('')}
        <div class="kv mt small"><span>Ortalama güç</span><span>${Math.round(Squad.teamOvr(ol))} (siz: ${Math.round(Squad.teamOvr(lineup))})</span><span>Taktik eğilimi</span><span>${tend}</span><span>Kulüp tipi</span><span>${POLICIES[oc.pol].n}</span><span>Ekipman</span><span>${ol.reduce((a, g) => a + ['w', 'a', 'x'].filter(s => g.eq && g.eq[s]).length, 0)} parça</span></div></div>`;
    }
    const header = target ? `<div class="card match-actions mb"><div class="row wrap"><div class="grow"><h3 style="margin:0">${esc(Calendar.compName(target.comp))}</h3><div class="small muted">${target.m.h === me.id ? 'İç saha maçı' : target.m.nt ? 'Tarafsız saha' : 'Deplasman maçı'} · Bu hafta</div></div>
        <button class="btn" data-a="simNow">Sonucu Simüle Et</button><button class="btn gold" data-a="playNow">${Art.icon('play', 14)} Maça Çık (Canlı)</button></div>
        <div class="tiny muted mt">Canlı maçta Hücum, Savunma ve Odaklan komutları verebilirsiniz (komutlar arasında ~8 sn bekleme). Hız: 1x / 2x / 4x ya da sonucu anında simüle edin — kurallar değişmez.</div></div>`
      : `<div class="card match-actions mb small">${f && f.m.r ? 'Bu haftanın maçı oynandı. ' : 'Bu hafta maçınız yok. '}${show ? `Sıradaki maç: <b>${show.w}. hafta</b> — ${esc(Calendar.compName(show.comp))}.` : ''}</div>`;
    return `<h2>Maç Merkezi</h2>${header}<div class="grid g3"><div class="col">${mine}</div><div class="card tactics"><h3>Maç Öncesi Taktik</h3><div class="col">${tacs}</div></div><div class="col">${opp || '<div class="card empty">Yaklaşan rakip yok.</div>'}</div></div>`;
  },

  // ------------------------------------------------------------ facilities & staff
  facilities() {
    const me = GameState.player();
    const fac = FAC_IDS.map(fid => {
      const lv = me.fac[fid], cost = Facilities.cost(me, fid);
      return `<div class="card"><div class="row"><h3 style="margin:0" class="grow">${FACILITIES[fid].name}</h3>${H.stars(lv)}</div>${Art.facilitySVG(fid, lv)}
        <div class="tiny muted mt">${FACILITIES[fid].desc}</div><div class="small mt"><b>Şimdi:</b> ${Facilities.effect(fid, lv)}</div>
        ${lv < 5 ? `<div class="small"><b class="good">Sonraki:</b> ${Facilities.effect(fid, lv + 1)}</div><div class="tiny dim">Bakım: ${fmtGold(FAC.upkeep[lv + 1] * (fid === 'arena' ? 1.3 : 1))}/hf</div><button class="btn sm gold mt ${me.budget < cost || me.arrears > 0 ? 'disabled' : ''}" data-a="facUp" data-f="${fid}" style="width:100%">Yükselt — ${fmtGold(cost)}</button>` : '<div class="pill gold mt">En üst seviye</div>'}</div>`;
    }).join('');
    const staff = STAFF_IDS.map(s => {
      const cur = me.staff[s];
      const cands = (S.staffCands && S.staffCands[s]) || [];
      return `<div class="card"><h3>${STAFF[s].name}</h3><div class="tiny muted">${STAFF[s].desc}</div><div class="row mt"><b class="grow">${esc(cur.n)}</b><span class="pill gold">Kalite ${cur.q}</span><span class="small">${fmtGold(cur.w)}/hf</span></div>
        <div class="tiny dim mt">${s === 'coach' ? `Gelişim katkısı +%${Math.round(cur.q * 0.3)}` : s === 'healer' ? `Kondisyon +${r1(cur.q * 0.06)}/hf · ek iyileşme +%${Math.round(cur.q * 0.3)}` : `Rapor doğruluğu +%${Math.round(cur.q * 0.4)}`}</div>
        <div class="sep"></div><div class="tiny muted">Adaylar (işe alım bedeli = 6 haftalık maaş):</div>${cands.map((c, i) => `<div class="row small" style="margin:.2rem 0"><span class="grow ellip">${esc(c.n)}</span><span class="pill">K ${c.q}</span><span class="tiny">${fmtGold(c.w)}/hf</span><button class="btn xs" data-a="staffHire" data-s="${s}" data-i="${i}">İşe al (${fmtGold(Staff.hireCost(c))})</button></div>`).join('')}</div>`;
    }).join('');
    const tot = `<div class="tiny muted">Toplam bonuslar (tesis + personel, sınırlı): gelişim ×${Progression.growthMult(me).toFixed(2)} · kondisyon +${r1(Staff.condRecovery(me))}/hf · sakatlık riski -%${Math.round(Staff.injReduce(me) * 100)} · rapor doğruluğu +%${Math.round(Staff.scoutAcc(me) * 100)}</div>`;
    return `<h2>Tesisler</h2><div class="grid g4">${fac}</div><h2 class="mt">Personel</h2>${tot}<div class="grid g3 mt">${staff}</div>`;
  },

  // ------------------------------------------------------------ equipment
  equipment(p) {
    const me = GameState.player();
    const tab = p.tab || UI.eqTab || 'shop';
    UI.eqTab = tab;
    const roster = GameState.rosterGlads(me);
    let gid = p.g != null ? +p.g : UI.eqG;
    if (!roster.find(g => g.id === gid)) gid = roster[0] ? roster[0].id : null;
    UI.eqG = gid;
    const g = gid != null ? S.glads[gid] : null;
    const strip = `<div class="row wrap mb">${roster.map(x => `<span class="pick ${x.id === gid ? 'on' : ''}" data-a="eqGlad" data-g="${x.id}" title="${esc(x.n)}">${H.por(x, 2.6)}</span>`).join('')}
      ${g ? `<div class="col gap0"><b>${esc(g.n)}</b><span class="tiny muted">${CLASSES[g.cls].name} · ${g.cls === 'dimachaerus' ? 'kalkan kullanamaz' : CLASSES[g.cls].gear}</span><span class="tiny">${['w', 'a', 'x'].map(s => { const it = S.items[g.eq[s]]; return SLOT_NAMES[s] + ': ' + (it ? `<span style="color:${QUALITIES[it.q].c}">${esc(Equipment.name(it))}</span>` : '<span class="dim">temel</span>'); }).join(' · ')}</span></div>` : ''}</div>`;
    const tabs = `<div class="tabs"><span class="tab ${tab === 'shop' ? 'on' : ''}" data-a="eqTab" data-t="shop">Mağaza</span><span class="tab ${tab === 'inv' ? 'on' : ''}" data-a="eqTab" data-t="inv">Envanter</span><span class="tab ${tab === 'smith' ? 'on' : ''}" data-a="eqTab" data-t="smith">Demirci</span></div>`;
    let body = '';
    const items = Equipment.clubItems(me);
    if (tab === 'shop') {
      const slot = UI.eqSlot || 'w';
      const types = Object.keys(ITEM_TYPES).filter(t => ITEM_TYPES[t].slot === slot && (!g || ITEM_TYPES[t].cls.includes(g.cls)));
      body = `<div class="seg mb">${['w', 'a', 'x'].map(s => `<button class="${slot === s ? 'on' : ''}" data-a="eqSlot" data-s="${s}">${SLOT_NAMES[s]}</button>`).join('')}</div>
        ${types.length ? types.map(t => `<div class="card tight mb"><div class="row"><b class="grow">${ITEM_TYPES[t].n}</b><span class="tiny muted">${esc(ITEM_TYPES[t].desc)}</span></div><div class="tiny dim">Uyumlu: ${ITEM_TYPES[t].cls.map(c => CLASSES[c].name).join(', ')}</div>
          <table class="t small mt"><tr><th>Kalite</th><th>Etki</th><th class="n">Fiyat</th><th></th></tr>${QUALITIES.map(q => { const fake = { t, q: q.id, p: 0 }; const need = Equipment.repNeeded(q.id); const lock = me.rep < need; return `<tr><td style="color:${q.c}" class="b">${q.n}</td><td class="tiny">${Equipment.statLine(fake)}</td><td class="n">${fmtGold(Equipment.price(t, q.id))}</td><td class="n">${lock ? `<span class="tiny dim">İtibar ${need}</span>` : `<button class="btn xs" data-a="eqBuy" data-t="${t}" data-q="${q.id}">Satın al</button>${g ? ` <button class="btn xs gold" data-a="eqBuy" data-t="${t}" data-q="${q.id}" data-eq="1">Al + Tak</button>` : ''}`}</td></tr>`; }).join('')}</table></div>`).join('') : '<div class="empty">Bu gladyatörün sınıfına uygun ürün yok.</div>'}`;
    } else if (tab === 'inv') {
      body = items.length ? `<table class="t small"><tr><th>Ekipman</th><th>Slot</th><th>Etki</th><th>Kullanan</th><th></th></tr>${items.sort((a, b) => b.q - a.q || b.p - a.p).map(it => { const holder = S.glads[it.g]; const fits = g && Equipment.fits(it, g); return `<tr><td style="color:${QUALITIES[it.q].c}" class="b">${esc(Equipment.name(it))}</td><td>${SLOT_NAMES[ITEM_TYPES[it.t].slot]}</td><td class="tiny">${Equipment.statLine(it)}</td><td>${holder ? esc(holder.n) : '<span class="dim">Depoda</span>'}</td><td class="n">${holder ? `<button class="btn xs" data-a="eqUnequip" data-i="${it.id}">Çıkar</button>` : ''} ${g && fits && it.g !== g.id ? `<button class="btn xs gold" data-a="eqEquip" data-i="${it.id}">${esc(g.n.split(' ')[0])}'e tak</button>` : ''} <button class="btn xs ghost" data-a="eqSell" data-i="${it.id}">Sat (${fmtGold(Equipment.sellValue(it))})</button></td></tr>`; }).join('')}</table><div class="tiny muted mt">Ekipmanlar kulübe aittir; gladyatör satılsa da envanterde kalır.</div>` : '<div class="empty">Envanter boş. Mağazadan ekipman satın alın.</div>';
    } else {
      body = items.length ? `<div class="small muted mb">Demirci geliştirmeleri garantilidir; ekipman kırılmaz. Her seviye daha pahalıdır (en fazla +5).</div><table class="t small"><tr><th>Ekipman</th><th>Şimdi</th><th>Sonraki</th><th class="n">Bedel</th><th></th></tr>${items.sort((a, b) => b.q - a.q).map(it => { const nx = { ...it, p: it.p + 1 }; return `<tr><td style="color:${QUALITIES[it.q].c}" class="b">${esc(Equipment.name(it))}</td><td class="tiny">${Equipment.statLine(it)}</td><td class="tiny good">${it.p < 5 ? Equipment.statLine(nx) : '—'}</td><td class="n">${it.p < 5 ? fmtGold(Equipment.upgradeCost(it)) : '—'}</td><td class="n">${it.p < 5 ? `<button class="btn xs gold" data-a="eqUpgrade" data-i="${it.id}">+${it.p + 1} Geliştir</button>` : '<span class="pill gold">+5</span>'}</td></tr>`; }).join('')}</table>` : '<div class="empty">Geliştirilecek ekipman yok.</div>';
    }
    return `<h2>Ekipman</h2>${strip}${tabs}<div class="card">${body}</div>`;
  },

  // ------------------------------------------------------------ sponsors
  sponsors() {
    const me = GameState.player();
    const sp = me.sponsor;
    const cur = sp ? (() => { const pr = Sponsors.progress(me); return `<div class="card mb"><h3>Mevcut Anlaşma: ${esc(sp.n)}</h3><div class="kv"><span>Haftalık ödeme</span><span class="gold">${fmtGold(sp.wk)}</span><span>Sezon hedefi</span><span>${esc(sp.goal.txt)}</span><span>Durum</span><span class="${pr && pr.ok ? 'good' : 'muted'}">${pr ? esc(pr.cur) + (pr.ok ? ' — şu an hedefte' : '') : '-'}</span><span>Başarı ödülü</span><span>${fmtGold(sp.bonus)} (sezon sonunda)</span><span>Kalan süre</span><span>${sp.left} sezon (bu sezon dahil)</span><span>Zorluk</span><span>${Math.round(sp.goal.d * 100)}%</span></div></div>`; })() : '';
    const offers = !sp && S.sponsorOffers.length ? `<h3>Yeni Teklifler <span class="tiny muted">(itibarınıza göre; birini seçin — 1. hafta sonuna kadar geçerli)</span></h3><div class="grid g3">${S.sponsorOffers.map((o, i) => `<div class="offer-card"><h3>${esc(o.n)}</h3><div class="kv small"><span>Haftalık</span><span class="gold b">${fmtGold(o.wk)}</span><span>Hedef</span><span>${esc(o.goal.txt)}</span><span>Zorluk</span><span>${H.bar(o.goal.d * 100, 100, o.goal.d > 0.65 ? 'r' : '')}</span><span>Ödül</span><span>${fmtGold(o.bonus)}</span><span>Süre</span><span>${o.dur} sezon</span><span>Sezonluk toplam</span><span>${fmtGold(o.wk * 30)} + ödül</span></div><button class="btn gold mt" data-a="sponsorAccept" data-i="${i}" style="width:100%">Anlaşmayı İmzala</button></div>`).join('')}</div>` : (!sp ? '<div class="card empty">Şu an teklif yok. Yeni hami teklifleri sezon başında, itibarınıza göre gelir.</div>' : '');
    return `<h2>Hamiler</h2>${cur}${offers}<div class="card mt small muted">Hami türleri: Tüccar Loncası (yüksek haftalık ödeme), Soylu Aile (büyük başarı ödülü, zor hedef), Askerî Vali (galibiyet ve eleme hedefleri), Arenalar Birliği (kupa hedefleri), Halk Meclisi (uzun süreli, ev sahibi galibiyetleri). İtibar arttıkça teklifler büyür.</div>`;
  },

  // ------------------------------------------------------------ finance
  finance() {
    const me = GameState.player();
    const lw = me.lastFin || me.weekFin;
    const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
    const list = (o, names) => Object.keys(names).filter(k => o[k]).map(k => `<div class="row small"><span class="grow muted">${names[k]}</span><b>${fmtGold(o[k])}</b></div>`).join('') || '<div class="tiny dim">—</div>';
    const ref = Economy.refinanceOffer(me);
    const wc = Economy.weeklyCost(me);
    const hist = me.finHist.slice().reverse().map(h => `<tr><td>${h.s}. sezon</td><td class="n good">${fmtGold(sum(h.inc))}</td><td class="n bad">${fmtGold(sum(h.exp))}</td><td class="n">${fmtGold(h.end)}</td></tr>`).join('');
    return `<h2>Finans</h2><div class="grid g4 mb">
      <div class="card"><div class="tiny muted">Bütçe</div><div class="big gold b">${fmtGold(me.budget)}</div></div>
      <div class="card"><div class="tiny muted">Haftalık sabit gider</div><div class="big b">${fmtGold(wc)}</div><div class="tiny dim">Maaş ${fmtGold(Economy.wageBill(me))} · Personel ${fmtGold(Economy.staffBill(me))} · İşletme ${fmtGold(Economy.opsCost(me))}</div></div>
      <div class="card"><div class="tiny muted">Maaş borcu</div><div class="big b ${me.arrears > 0 ? 'bad' : 'good'}">${fmtGold(me.arrears)}</div></div>
      <div class="card"><div class="tiny muted">Yeniden finansman</div>${me.loan ? `<div class="small">Kalan ${me.loan.left} hafta × ${fmtGold(me.loan.wk)}</div>` : ref ? `<div class="small">${fmtGold(ref.amount)} → 20 hafta × ${fmtGold(ref.wk)}</div><button class="btn xs primary mt" data-a="refinance">Kullan</button>` : '<div class="tiny dim">Gerekli değil / bu sezon kullanıldı</div>'}</div></div>
      <div class="grid g3"><div class="card"><h3>Geçen Hafta Gelir</h3>${list(lw.inc, FIN_INC)}<div class="sep"></div><div class="row small"><b class="grow">Toplam</b><b class="good">${fmtGold(sum(lw.inc))}</b></div></div>
        <div class="card"><h3>Geçen Hafta Gider</h3>${list(lw.exp, FIN_EXP)}<div class="sep"></div><div class="row small"><b class="grow">Toplam</b><b class="bad">${fmtGold(sum(lw.exp))}</b></div></div>
        <div class="card"><h3>Bu Sezon</h3>${list(me.seasonFin.inc, FIN_INC)}<div class="sep"></div>${list(me.seasonFin.exp, FIN_EXP)}<div class="sep"></div><div class="row small"><b class="grow">Net</b><b>${fmtGold(sum(me.seasonFin.inc) - sum(me.seasonFin.exp))}</b></div></div></div>
      <div class="grid g2 mt"><div class="card"><h3>Haftalık Kasa Grafiği</h3><canvas id="fincanvas" style="width:100%;height:9rem"></canvas></div>
        <div class="card"><h3>Maaş Yükü</h3>${GameState.rosterGlads(me).map(g => `<div class="row small"><span class="grow">${esc(g.n)}</span><span class="dim">${g.con.yrs} sz</span><b>${fmtGold(g.con.wage)}/hf</b></div>`).join('')}${STAFF_IDS.map(s => `<div class="row small"><span class="grow muted">${STAFF[s].name}</span><b>${fmtGold(me.staff[s].w)}/hf</b></div>`).join('')}
        ${me.lastGate ? `<div class="sep"></div><div class="tiny muted">Son iç saha maçı: ${fmtInt(me.lastGate.att)} / ${fmtInt(me.lastGate.cap)} seyirci · ${fmtGold(me.lastGate.rev)}</div>` : ''}</div></div>
      <div class="card mt"><h3>Sezonluk Finans Geçmişi</h3>${hist ? `<table class="t small"><tr><th>Sezon</th><th class="n">Gelir</th><th class="n">Gider</th><th class="n">Sezon sonu kasa</th></tr>${hist}</table>` : '<div class="tiny dim">İlk sezon tamamlanınca burada görünecek.</div>'}
      <div class="tiny muted mt">Bütçe tükenirse maaşlar borca yazılır, yeni harcamalar durur, moral ve itibar düşer. Borç büyürse gladyatörler sözleşmelerini feshedebilir. Sezonda bir kez kontrollü yeniden finansman kullanılabilir.</div></div>`;
  },
  after_finance() {
    const me = GameState.player();
    const cv = $('#fincanvas'); if (!cv) return;
    const W = cv.clientWidth, Hh = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = Hh * dpr;
    const x = cv.getContext('2d'); x.scale(dpr, dpr);
    const d = (me.weekHist || []).slice(-30);
    if (d.length < 2) { x.fillStyle = '#8a7660'; x.font = '12px sans-serif'; x.fillText('Veri birkaç hafta sonra oluşacak.', 8, 20); return; }
    const max = Math.max(...d.map(p => Math.max(p.inc, p.exp)), 1), bmax = Math.max(...d.map(p => p.b), 1);
    const bw = W / d.length;
    d.forEach((p, i) => {
      x.fillStyle = 'rgba(115,180,95,.75)'; x.fillRect(i * bw + 2, Hh - p.inc / max * Hh * 0.8, bw / 2 - 2, p.inc / max * Hh * 0.8);
      x.fillStyle = 'rgba(217,86,74,.75)'; x.fillRect(i * bw + bw / 2, Hh - p.exp / max * Hh * 0.8, bw / 2 - 2, p.exp / max * Hh * 0.8);
    });
    x.strokeStyle = '#e0b95c'; x.lineWidth = 2; x.beginPath();
    d.forEach((p, i) => { const y = Hh - p.b / bmax * Hh * 0.9; i ? x.lineTo(i * bw + bw / 2, y) : x.moveTo(i * bw + bw / 2, y); });
    x.stroke();
    x.fillStyle = '#b9a68a'; x.font = '10px sans-serif'; x.fillText('Gelir (yeşil) · Gider (kırmızı) · Kasa (altın)', 6, 12);
  },

  // ------------------------------------------------------------ history
  history(p) {
    const me = GameState.player();
    const tab = p.tab || UI.hTab || 'season';
    UI.hTab = tab;
    const tabs = `<div class="tabs">${[['season', 'Sezonlar'], ['champs', 'Lig Şampiyonları'], ['awards', 'Ödüller'], ['retired', 'Emekliler'], ['records', 'Rekorlar'], ['club', 'Kulüp Başarıları']].map(([k, n]) => `<span class="tab ${tab === k ? 'on' : ''}" data-a="histTab" data-t="${k}">${n}</span>`).join('')}</div>`;
    const seasons = S.hist.seasons;
    let body;
    if (tab === 'season') {
      body = seasons.length ? `<table class="t"><tr><th>Sezon</th><th>Kulüp</th><th>Lig</th><th class="n">Sıra</th><th class="n">G-M</th><th class="n">Puan</th><th>Kupa</th><th>İmp. Kupası</th></tr>${seasons.slice().reverse().map(h => h.player ? `<tr><td>${h.s}</td><td>${esc(h.player.n)}</td><td>${TIERS[h.player.tier].s} (${H.reg(h.player.reg)})</td><td class="n b">${h.player.rank}</td><td class="n">${h.player.w}-${h.player.l}</td><td class="n">${h.player.pts}</td><td>${h.player.cup}</td><td>${h.player.imp || '-'}</td></tr>` : '').join('')}</table>` : '<div class="empty">İlk sezon tamamlandığında sezon özetleri burada listelenir.</div>';
      if (S.week >= SEASON_WEEKS) body = `<div class="card mb" style="border-color:var(--gold)"><b>Sezon sona erdi.</b> Üst menüdeki <b>Yeni Sezon</b> düğmesiyle bir sonraki sezona geçin.</div>` + body;
    } else if (tab === 'champs') {
      const reg = UI.hReg || me.reg;
      body = `<div class="tabs">${REGIONS.map(r => `<span class="tab ${reg === r.id ? 'on' : ''}" data-a="histReg" data-r="${r.id}">${r.name}</span>`).join('')}</div>` + (seasons.length ? `<table class="t small"><tr><th>Sezon</th>${[1, 2, 3, 4, 5, 6].map(t => `<th>${TIERS[t].s}</th>`).join('')}<th>Bölge Kupası</th></tr>${seasons.slice().reverse().map(h => `<tr><td>${h.s}</td>${[1, 2, 3, 4, 5, 6].map(t => { const l = h.leagues.find(x => x.id === GameState.leagueIndex(GameState.regIdx(reg), t)); return `<td class="${l && l.c === me.id ? 'gold b' : ''}">${l ? esc(l.cn) : '-'}</td>`; }).join('')}<td>${esc((h.cups.find(c => c.k === 'r_' + reg) || {}).cn || '-')}</td></tr>`).join('')}</table>` : '<div class="empty">Henüz şampiyon yok.</div>');
    } else if (tab === 'awards') {
      const reg = UI.hReg || me.reg;
      body = `<div class="tabs">${REGIONS.map(r => `<span class="tab ${reg === r.id ? 'on' : ''}" data-a="histReg" data-r="${r.id}">${r.name}</span>`).join('')}</div>` + (seasons.length ? seasons.slice().reverse().slice(0, 6).map(h => `<div class="card tight mb"><b>${h.s}. sezon</b><table class="t small"><tr><th>Lig</th><th>Sezonun Gladyatörü</th><th>En Çok Eleyen</th><th>En İyi Savunmacı</th><th>Yükselen Yıldız</th><th>Şampiyon</th></tr>${[1, 2, 3, 4, 5, 6].map(t => { const id = GameState.leagueIndex(GameState.regIdx(reg), t); const a = h.awards[id] || {}; const f = x => x ? `${esc(x.n)} <span class="tiny dim">${esc(H.club(x.cid))} · ${x.v}</span>` : '-'; return `<tr><td>${TIERS[t].s}</td><td>${f(a.mvp)}</td><td>${f(a.ko)}</td><td>${f(a.def)}</td><td>${f(a.star)}</td><td>${a.champ != null ? esc(H.club(a.champ)) : '-'}</td></tr>`; }).join('')}</table></div>`).join('') : '<div class="empty">Ödüller sezon sonunda gerçek istatistiklere göre verilir.</div>');
    } else if (tab === 'retired') {
      const mine = S.hist.retired.filter(r => r.mine), notable = S.hist.retired.filter(r => !r.mine).sort((a, b) => b.peak - a.peak).slice(0, 60);
      const row = r => `<tr><td>${r.s}</td><td>${esc(r.n)}</td><td>${CLASSES[r.cls].name}</td><td class="n">${r.age}</td><td>${esc(r.cn)}</td><td class="n">${r.peak}</td><td class="n">${r.cs.m}</td><td class="n">${r.cs.w}</td><td class="n">${r.cs.ko}</td><td class="n">${r.aw}</td></tr>`;
      const th = `<tr><th>Sezon</th><th>Ad</th><th>Sınıf</th><th class="n">Yaş</th><th>Son kulüp</th><th class="n">Zirve</th><th class="n">Maç</th><th class="n">G</th><th class="n">Eleme</th><th class="n">Ödül</th></tr>`;
      body = `<h3>Kulübümüzden Emekli Olanlar</h3>${mine.length ? `<table class="t small">${th}${mine.slice().reverse().map(row).join('')}</table>` : '<div class="tiny dim mb">Henüz yok.</div>'}<h3 class="mt">Dünyanın Önemli Emeklileri</h3>${notable.length ? `<table class="t small">${th}${notable.map(row).join('')}</table>` : '<div class="tiny dim">Henüz yok.</div>'}<div class="tiny muted mt">Toplam ${fmtInt(S.hist.retired.length)} emekli gladyatörün kariyer kaydı saklanıyor.</div>`;
    } else if (tab === 'records') {
      const R0 = S.hist.records;
      body = `<div class="kv"><span>Bir sezonda en çok eleme</span><span>${R0.koSeason ? `${esc(R0.koSeason.n)} — ${R0.koSeason.v} (${R0.koSeason.s}. sezon)` : '-'}</span><span>En yüksek genel güç</span><span>${R0.topOvr ? `${esc(R0.topOvr.n)} — ${R0.topOvr.v} (${R0.topOvr.s}. sezon)` : '-'}</span><span>En pahalı transfer</span><span>${R0.bigTransfer ? `${esc(R0.bigTransfer.n)} — ${fmtGold(R0.bigTransfer.fee)} (${esc(H.club(R0.bigTransfer.f))} → ${esc(H.club(R0.bigTransfer.t))}, ${R0.bigTransfer.s}. sezon)` : '-'}</span><span>Toplam transfer kaydı</span><span>${fmtInt(S.transfers.length)}</span></div>`;
    } else {
      body = `<div class="kv"><span>Kupalar</span><span>${me.trophies.length ? me.trophies.map(t => esc(t.s + '. sezon — ' + t.t)).join('<br>') : 'Henüz kupa yok'}</span><span>Lig geçmişi</span><span>${me.hist.length ? me.hist.map(h => `${h.s}. sz: ${TIERS[h.tier].s} ${h.rank}.`).join(' · ') : '-'}</span><span>Rekabetler</span><span>${Object.entries(me.riv).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${esc(H.club(+k))} (${v})`).join(', ') || '-'}</span></div>`;
    }
    return `<h2>Kariyer Tarihçesi</h2>${tabs}<div class="card">${body}</div>`;
  },

  // ------------------------------------------------------------ settings
  settings() {
    return `<h2>Ayarlar</h2><div class="grid g2"><div class="card"><h3>Oyun</h3><div class="col">
      <button class="btn" data-a="toggleSound">${Art.icon(S.settings.sound ? 'sound' : 'mute', 16)} Ses: ${S.settings.sound ? 'Açık' : 'Kapalı'}</button>
      <button class="btn" data-a="fullscreen">${Art.icon('full', 16)} Tam Ekran</button>
      <button class="btn" data-a="tutRestart">${Art.icon('info', 16)} Başlangıç Rehberini Göster</button>
      <button class="btn" data-a="go" data-s="hub">${Art.icon('play', 16)} Oyuna Devam</button></div></div>
      <div class="card"><h3>Kayıt</h3><div class="small muted mb">Oyun her hafta, maç, transfer, sözleşme, ekipman ve tesis işleminden sonra otomatik kaydedilir (${({ idb: 'IndexedDB', ls: 'yerel depolama', mem: 'yalnızca bu oturum — dışa aktarmayı kullanın', none: '-' })[SaveManager.mode]}). Son kayıt: ${SaveManager.lastSave ? new Date(SaveManager.lastSave).toLocaleTimeString('tr-TR') : '-'}.</div><div class="col">
      <button class="btn" data-a="saveNow">${Art.icon('save', 16)} Şimdi Kaydet</button>
      <button class="btn" data-a="exportSave">${Art.icon('download', 16)} Kaydı Dışa Aktar (JSON)</button>
      <button class="btn" data-a="importSave">${Art.icon('upload', 16)} Kaydı İçe Aktar</button>
      <button class="btn primary" data-a="settingsNew">Yeni Kariyer</button></div></div></div>
      <div class="card mt tiny muted">Arena Dominus ${GAME_VERSION} · Kayıt sürümü ${SAVE_VERSION}. Tüm görseller kod ile üretilir; oyun çevrimdışı çalışır.</div>`;
  }
};

// ---------------------------------------------------------------- negotiation modal
const Nego = {
  open(gid) {
    const g = S.glads[gid]; if (!g) return;
    const me = GameState.player();
    const renew = g.club === me.id;
    if (!renew) { const err = Transfer.canBuy(g); if (err) { UI.toast(esc(err)); return; } }
    let n = Transfer.nego(g.id);
    if (!n) n = Transfer.startNego(g, renew);
    if (renew && n.stage !== 'contract') n.stage = 'contract';
    UI.modal('', '', '', 'mid');
    this.render(gid);
  },
  render(gid) {
    const g = S.glads[gid]; const me = GameState.player();
    const n = Transfer.nego(gid);
    if (!n) { UI.closeModal(); return; }
    const club = g.club >= 0 ? S.clubs[g.club] : null;
    const renew = g.club === me.id;
    const head = `<div class="row mb">${H.por(g, 3.4)}<div class="grow"><b>${esc(g.n)}</b><div class="tiny muted">${CLASSES[g.cls].name} · ${g.age} yaş · GG ${Math.round(g.ovr)} · Pot. ${H.pot(g)}</div><div class="tiny">${club ? `${esc(club.n)} (${TIERS[club.tier].s})` : 'Serbest gladyatör'} · Değer ${fmtGold(g.val)}</div></div><div class="col gap0" style="text-align:right"><span class="tiny muted">Bütçeniz</span><b class="gold">${fmtGold(me.budget)}</b></div></div>`;
    let body = head, foot = '';
    if (n.blocked) { body += `<div class="card bad">${esc(n.msg)}</div>`; foot = `<button class="btn" data-a="closeModal">Kapat</button>`; }
    else if (n.stage === 'fee') {
      const sugg = Math.round(g.val / 50) * 50;
      body += `<h3>1. Adım — Bonservis Teklifi</h3><p class="small muted">${esc(club.n)} ile bonservis bedeli üzerinde anlaşın. Kulüp itibarınız, ligi, gladyatörün kadrodaki rolü ve kulübün ihtiyaçları kararı etkiler.</p>
        <div class="row wrap"><label class="col small">Bonservis bedeli<input type="number" id="nfee" value="${n.counter || sugg}" min="0" step="50"></label>
        ${[0.8, 1, 1.2, 1.5].map(k => `<button class="btn xs" data-a="negoQuick" data-k="${k}" data-v="${g.val}">%${Math.round(k * 100)} değer</button>`).join('')}</div>
        ${n.msg ? `<div class="card tight mt small">${esc(n.msg)}</div>` : ''}`;
      foot = `<button class="btn ghost" data-a="closeModal">Kapat</button>${n.counter ? `<button class="btn" data-a="negoAcceptCounter" data-g="${gid}">Karşı teklifi kabul et (${fmtGold(n.counter)})</button>` : ''}<button class="btn gold" data-a="negoFee" data-g="${gid}">Teklif Yap</button>`;
    } else {
      const d = Transfer.demand(g, me, renew);
      const wage = n.lastDemand || (renew ? g.con.wage : Math.round(d.wage * 0.9 / 5) * 5);
      body += `<h3>${renew ? 'Sözleşme Uzatma' : (n.fee ? `2. Adım — Sözleşme (bonservis ${fmtGold(n.fee)} kabul edildi)` : 'Sözleşme Görüşmesi')}</h3>
        <p class="small muted">Gladyatör maaşı, süreyi, imza parasını ve bonusları birlikte değerlendirir. Çok düşük teklifler sabrını tüketir.</p>
        <div class="grid g3 small"><label class="col">Haftalık maaş<input type="number" id="nw" value="${wage}" min="1" step="5"></label>
        <label class="col">Süre (sezon)<select id="ny">${[1, 2, 3, 4].map(y => `<option value="${y}" ${y === d.yrs ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
        <label class="col">İmza parası<input type="number" id="ns" value="${Math.round(d.sign * 0.8 / 10) * 10}" min="0" step="10"></label>
        <label class="col">Galibiyet bonusu<input type="number" id="nwb" value="${d.winB}" min="0" step="5"></label>
        <label class="col">Şampiyonluk bonusu<input type="number" id="ntb" value="${d.titleB}" min="0" step="10"></label>
        <div class="col"><span class="tiny muted">Sabır</span>${H.bar(n.pat, 4, n.pat <= 1 ? 'r' : 'g')}<span class="tiny dim">Mevcut maaş: ${g.con ? fmtGold(g.con.wage) : '-'}</span></div></div>
        ${n.msg ? `<div class="card tight mt small">${esc(n.msg)}</div>` : ''}`;
      foot = `<button class="btn ghost" data-a="closeModal">Kapat</button><button class="btn gold" data-a="negoContract" data-g="${gid}">Sözleşme Öner</button>`;
    }
    UI.updateModal(renew ? 'Sözleşme Görüşmesi' : 'Transfer Görüşmesi', body, foot, 'mid');
  }
};

// ---------------------------------------------------------------- actions
const Actions = {
  go(d) { UI.closeAllModals(); UI.go(d.s, d.tab ? { tab: d.tab } : (d.g ? { g: d.g } : {})); },
  closeModal() { UI.closeModal(); },
  closeModalBg(d, el, e) { if (e.target === el) UI.closeModal(); },
  confirmOk(d, el) { const m = el.closest('.modal-bg'); const fn = m && m._ok; if (m) { m._onClose = null; m.remove(); } fn && fn(); },
  nextWeek() { UI.advance(); },
  goMatchCenter() { UI.closeAllModals(); UI.go('match'); },
  flowLive(d, el) { const m = el.closest('.modal-bg'); const f = m._f; m.remove(); UI.playLive(f, () => UI.runWeek()); },
  flowSim(d, el) { const m = el.closest('.modal-bg'); const f = m._f; m.remove(); UI.simulatePlayer(f, () => UI.runWeek()); },
  playNow() { const f = Game.pendingPlayerMatch(); if (f) UI.playLive(f, () => UI.render()); },
  simNow() { const f = Game.pendingPlayerMatch(); if (f) UI.simulatePlayer(f, () => UI.render()); },
  resultContinue() { UI.closeModal(); },
  toggleSound() { S.settings.sound = !S.settings.sound; Sfx.setOn(S.settings.sound); try { localStorage.setItem('ad_sound', S.settings.sound ? '1' : '0'); } catch (e) { } UI.render(); UI.saveSoon(); },
  toggleSoundTitle() { Sfx.setOn(!Sfx.on); try { localStorage.setItem('ad_sound', Sfx.on ? '1' : '0'); } catch (e) { } const b = $('#tsnd'); if (b) b.innerHTML = Art.icon(Sfx.on ? 'sound' : 'mute', 14); },
  async fullscreen() {
    const doc = document, el = doc.documentElement;
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) { await (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); return; }
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!req) throw new Error('unsupported');
      await req.call(el);
      if (!(doc.fullscreenElement || doc.webkitFullscreenElement)) throw new Error('denied');
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { });
    } catch (e) { UI.toast('Tam ekran bu tarayıcıda veya ortamda kullanılamıyor; oyun mevcut alanda devam ediyor.'); }
  },
  // title / setup
  newCareer() {
    SaveManager.meta().then(m => {
      if (m && m.s) UI.confirm('Yeni Kariyer', 'Yeni kariyer başlatıldığında mevcut kayıt, ilk kayıtla birlikte yedek kayda taşınır ve sonra üzerine yazılır. Gerekirse önce kaydı dışa aktarın.', 'Yeni kariyer başlat', () => Title.newCareer());
      else Title.newCareer();
    });
  },
  async continueCareer() {
    UI.busy(true, 'Kariyer yükleniyor', '', 0.5);
    const r = await SaveManager.load();
    UI.busy(false);
    if (!r.ok) { UI.toast('Kayıt yüklenemedi. Dosya bozuk olabilir.'); return; }
    if (r.from === 'backup') UI.toast('Ana kayıt okunamadı; yedek kayıt yüklendi.');
    Sfx.setOn(S.settings.sound !== false);
    UI.enterGame();
  },
  importSaveTitle() { Actions.importSave(); },
  titleBack() { Title.show(); },
  setupNew() { Title.newLudusScreen(); },
  setupExisting() { Title.existingScreen(); },
  setupBack() { Title.modeScreen(); },
  setupReg(d) { Title.setup.reg = d.r; Title.newLudusScreen(); },
  setupCol(d) { Title.setup.crest[d.k] = d.c; Title.newLudusScreen(); },
  setupShape(d) { Title.setup.crest.sh = +d.i; Title.newLudusScreen(); },
  setupSym(d) { Title.setup.crest.sy = +d.i; Title.newLudusScreen(); },
  setupNewConfirm() {
    const st = Title.setup;
    const name = (st.name || '').trim();
    if (name.length < 3) { UI.toast('Kulüp adı en az 3 karakter olmalı.'); return; }
    if (S.clubs.some(c => c.n.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) { UI.toast('Bu isimde bir kulüp zaten var.'); return; }
    if (st.crest.c1 === st.crest.c2) { UI.toast('Arma için iki farklı renk seçin.'); return; }
    const club = WorldGenerator.createNewLudus(st.reg, name, { ...st.crest });
    Title.start(club.id, true);
  },
  setupBrowseReg(d) { Title.setup.browseReg = d.r; Title.setup.pick = -1; Title.existingScreen(); },
  setupBrowseTier(d) { Title.setup.browseTier = +d.t; Title.setup.pick = -1; Title.existingScreen(); },
  setupPick(d) { Title.setup.pick = +d.c; Title.existingScreen(); },
  setupExistingConfirm() { if (Title.setup.pick >= 0) Title.start(Title.setup.pick, false); },
  // squad
  profile(d) { UI.closeAllModals(); UI.go('profile', { gid: +d.g, back: d.back || (UI.screen === 'profile' ? 'squad' : UI.screen) }); },
  squadTap(d) {
    const slot = +d.slot;
    if (UI.squadSel == null) { UI.squadSel = slot; UI.render(); return; }
    if (UI.squadSel === slot) { UI.squadSel = null; UI.render(); return; }
    Actions.swapSlots(UI.squadSel, slot);
  },
  swapSlots(a, b) {
    const me = GameState.player();
    const arr = Squad.arrangement(me);
    const t = arr[a]; arr[a] = arr[b]; arr[b] = t;
    Squad.setArrangement(me, arr);
    UI.squadSel = null;
    const ace = arr.slice(0, 3).map(id => id != null && S.glads[id]).filter(Boolean);
    if (ace.some(g => g.injury)) UI.toast('Uyarı: As kadroda sakat gladyatör var; maçta yedekle değiştirilecek.');
    UI.render(); UI.saveSoon();
  },
  autoLineup() { const me = GameState.player(); ClubAI.pickLineup(me); Squad.setArrangement(me, Squad.arrangement(me)); UI.render(); UI.saveSoon(); UI.toast('Kadro hazır olma durumuna göre dizildi.'); },
  setTactic(d) { GameState.player().tactic = d.t; UI.render(); UI.saveSoon(); },
  // transfers
  nego(d) { Nego.open(+d.g); },
  renew(d) { Nego.open(+d.g); },
  negoQuick(d) { const i = $('#nfee'); if (i) i.value = Math.round(+d.v * +d.k / 50) * 50; },
  negoFee(d) {
    const g = S.glads[+d.g];
    const r = Transfer.bidFee(g, +$('#nfee').value);
    if (!r.ok) { UI.toast(esc(r.msg)); return; }
    Nego.render(g.id); UI.saveSoon();
  },
  negoAcceptCounter(d) { const g = S.glads[+d.g]; const r = Transfer.acceptCounter(g); if (!r.ok) UI.toast(esc(r.msg)); Nego.render(g.id); },
  async negoContract(d) {
    const g = S.glads[+d.g];
    const offer = { wage: +$('#nw').value, yrs: +$('#ny').value, sign: +$('#ns').value, winB: +$('#nwb').value, titleB: +$('#ntb').value };
    const r = Transfer.offerContract(g, offer);
    if (!r.ok) { UI.toast(esc(r.msg)); return; }
    if (r.done) {
      UI.closeAllModals(); Sfx.play('coin');
      UI.toast(g.club === S.player ? `${esc(g.n)} ile anlaşma sağlandı!` : 'İşlem tamamlandı.');
      await UI.saveNow(); UI.render(); return;
    }
    Nego.render(g.id); UI.saveSoon();
  },
  release(d) {
    const g = S.glads[+d.g], me = GameState.player();
    const cost = Transfer.releaseCost(g);
    UI.confirm('Sözleşme Feshi', `${esc(g.n)} ile sözleşme feshedilecek. Kalan yükümlülükler için ${fmtGold(cost)} ödenecek ve gladyatör serbest kalacak. Emin misiniz?`, 'Feshet', async () => {
      const r = Transfer.release(me, g);
      if (!r.ok) { UI.toast(esc(r.msg)); return; }
      await UI.saveNow(); UI.go('squad');
    });
  },
  scoutReport(d) { const g = S.glads[+d.g]; const r = Scouting.report(g); UI.toast(r.ok ? 'Keşif raporu hazırlandı; tahminler netleşti.' : esc(r.msg)); if (r.ok) { UI.render(); UI.saveSoon(); } },
  async offerResp(d) { const r = Transfer.respondOffer(+d.o, d.r); UI.toast(esc(r.msg || (r.ok ? 'Tamam' : 'İşlem başarısız'))); if (r.ok && d.r === 'accept') Sfx.play('coin'); await UI.saveNow(); UI.render(); },
  marketTab(d) { UI.mf.page = 1; UI.go('market', { tab: d.t }); },
  marketMore() { UI.mf.page++; const v = $('#view'), st = v.scrollTop; UI.render(); v.scrollTop = st; },
  filterReset() { UI.mf = { ...MF_DEFAULT, free: UI.marketTab === 'free' }; UI.render(); },
  // leagues & cups
  leaguesReg(d) { UI.go('leagues', { reg: d.r }); },
  leaguesTier(d) { UI.go('leagues', { tier: +d.t }); },
  leaguesTab(d) { UI.go('leagues', { tab: d.t }); },
  leagueRound(d) { UI.go('leagues', { tab: 'fix', round: +d.r }); },
  club(d) { Screens.clubModal(+d.c); },
  cupsTab(d) { UI.go('cups', { tab: d.t }); },
  // facilities & staff
  async facUp(d) { const r = Facilities.upgrade(GameState.player(), d.f); UI.toast(r.ok ? 'Tesis yükseltildi!' : esc(r.msg)); if (r.ok) { Sfx.play('coin'); await UI.saveNow(); } UI.render(); },
  async staffHire(d) { const r = Staff.hire(d.s, +d.i); UI.toast(r.ok ? 'Personel işe alındı.' : esc(r.msg)); if (r.ok) await UI.saveNow(); UI.render(); },
  // equipment
  eqTab(d) { UI.go('equipment', { tab: d.t }); },
  eqGlad(d) { UI.go('equipment', { g: +d.g }); },
  eqSlot(d) { UI.eqSlot = d.s; UI.render(); },
  async eqBuy(d) {
    const me = GameState.player();
    const r = Equipment.buy(me, d.t, +d.q);
    if (!r.ok) { UI.toast(esc(r.msg)); return; }
    if (d.eq && UI.eqG != null) { const e = Equipment.equip(r.item.id, UI.eqG); if (!e.ok) UI.toast(esc(e.msg)); }
    Sfx.play('coin'); UI.toast(`${esc(Equipment.name(r.item))} satın alındı.`); await UI.saveNow(); UI.render();
  },
  async eqEquip(d) { const r = Equipment.equip(+d.i, UI.eqG); if (!r.ok) UI.toast(esc(r.msg)); await UI.saveNow(); UI.render(); },
  async eqUnequip(d) { Equipment.unequip(+d.i); await UI.saveNow(); UI.render(); },
  async eqUpgrade(d) { const r = Equipment.upgrade(GameState.player(), +d.i); UI.toast(r.ok ? 'Demirci işini tamamladı!' : esc(r.msg)); if (r.ok) { Sfx.play('coin'); await UI.saveNow(); } UI.render(); },
  eqSell(d) {
    const it = S.items[+d.i]; if (!it) return;
    UI.confirm('Ekipman Sat', `${esc(Equipment.name(it))} ${fmtGold(Equipment.sellValue(it))} karşılığında satılsın mı?`, 'Sat', async () => { Equipment.sell(GameState.player(), +d.i); await UI.saveNow(); UI.render(); });
  },
  // sponsors & finance
  async sponsorAccept(d) { if (Sponsors.accept(+d.i)) { Sfx.play('coin'); UI.toast('Hami anlaşması imzalandı.'); await UI.saveNow(); } UI.render(); },
  refinance() {
    const me = GameState.player(); const o = Economy.refinanceOffer(me); if (!o) return;
    UI.confirm('Yeniden Finansman', `Sarraflar Loncası ${fmtGold(o.amount)} sağlayacak. 20 hafta boyunca haftada ${fmtGold(o.wk)} (toplam ${fmtGold(o.total)}) geri ödenecek. Kulüp itibarı biraz düşer. Sezonda yalnızca bir kez kullanılabilir.`, 'Kabul et', async () => { Economy.refinance(me); await UI.saveNow(); UI.render(); });
  },
  // history
  histTab(d) { UI.go('history', { tab: d.t }); },
  histReg(d) { UI.hReg = d.r; UI.render(); },
  // settings / save
  async saveNow() { const ok = await UI.saveNow(); UI.toast(ok ? 'Kaydedildi.' : 'Kayıt başarısız! Kaydı dışa aktarmayı deneyin.'); },
  exportSave() { try { const n = SaveManager.exportFile(); UI.toast('Kayıt dosyası indirildi: ' + esc(n)); } catch (e) { UI.toast('Dışa aktarma başarısız: ' + esc(e.message)); } },
  importSave() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      if (f.size > 40 * 1024 * 1024) { UI.toast('Dosya çok büyük.'); return; }
      const rd = new FileReader();
      rd.onload = async () => {
        const r = await SaveManager.importText(String(rd.result));
        if (!r.ok) { UI.toast('İçe aktarma başarısız: ' + esc(r.msg)); return; }
        UI.closeAllModals(); Sfx.setOn(S.settings.sound !== false); UI.toast('Kariyer içe aktarıldı.'); UI.enterGame();
      };
      rd.onerror = () => UI.toast('Dosya okunamadı.');
      rd.readAsText(f);
    };
    inp.click();
  },
  settingsNew() { UI.confirm('Yeni Kariyer', 'Ana menüye dönülecek. Mevcut kariyeriniz kayıtlı kalır; yeni kariyer başlatırsanız onun üzerine yazılır.', 'Ana menü', () => { Battle.close(); UI.closeAllModals(); Title.show(); }); },
  // battle
  bcmd(d) { Battle.command(d.c); },
  bspeed(d) { Battle.setSpeed(d.v === 'sim' ? 'sim' : +d.v); },
  pickTarget(d) { if (Battle.targeting) Battle.pickTarget(+d.i); },
  // tutorial
  tutNext() { Tutorial.next(); }, tutPrev() { Tutorial.prev(); }, tutSkip() { Tutorial.finish(); }, tutRestart() { Tutorial.start(true); }
};

const Changes = {
  setupName(el) { Title.setup.name = el.value; },
  mf(el) {
    const k = el.dataset.k;
    let v = el.value;
    if (['amin', 'amax', 'omin', 'pmin', 'vmax', 'wmax'].includes(k)) v = Math.max(0, +v || 0);
    if (k === 'amin' && !v) v = 18; if (k === 'amax' && !v) v = 45;
    UI.mf[k] = v; UI.mf.page = 1;
    UI.render();
  },
  mfFree(el) { UI.mf.free = el.checked; UI.mf.page = 1; UI.render(); }
};
