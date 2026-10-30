/* =========================================================================
   Screens (UIManager views)
   ========================================================================= */

const MF_DEFAULT = { q: '', reg: '', cls: '', amin: 18, amax: 40, omin: 0, pmin: 0, vmax: 0, wmax: 0, con: '', free: false, sort: 'ovr', page: 1 };
UI.mf = { ...MF_DEFAULT };
const wk = () => tx('hf', 'wk');
const seasonTxt = n => tx(n + '. sezon', 'Season ' + n);
const rankTxt = n => tx(n + '. sıra', 'pos. ' + n);

const Screens = {
  // ------------------------------------------------------------ hub
  hub() {
    const me = GameState.player();
    const lg = S.leagues[me.lg];
    const tbl = Leagues.table(lg);
    const up = Calendar.upcoming(me.id, 4);
    const thisWeek = Game.playerFixture();
    const inj = GameState.rosterGlads(me).filter(g => g.injury);
    const exp = GameState.rosterGlads(me).filter(g => g.con && g.con.yrs <= 1);
    const sp = me.sponsor ? Sponsors.progress(me) : null;
    const wkPill = w => `<span class="pill">${tx(w + '. hf', 'Wk ' + w)}</span>`;
    const nextTxt = f => {
      if (f.tbd) return `<div class="row small">${wkPill(f.w)}<span class="muted">${esc(f.tbd)}</span></div>`;
      const opp = S.clubs[f.m.h === me.id ? f.m.a : f.m.h];
      const res = f.m.r ? (f.m.r.w === (f.m.h === me.id ? 0 : 1) ? `<span class="good b">${tx('G', 'W')}</span>` : `<span class="bad b">${tx('M', 'L')}</span>`) : '';
      return `<div class="row small" style="margin:.2rem 0">${wkPill(f.w)}${H.crest(opp, 20)}<span class="grow ellip">${f.m.h === me.id ? '' : '@ '}${esc(opp.n)}</span><span class="tiny dim">${esc(Calendar.compName(f.comp).split(' · ')[0])}</span>${res}</div>`;
    };
    const pn = S.news.filter(n => n.p).slice(0, 7), wn = S.news.filter(n => !n.p).slice(0, 7);
    const news = arr => arr.length ? arr.map(n => `<div class="news-item ${n.p ? 'p' : ''}"><div class="w">${seasonTxt(n.s)} · ${weekLabel(n.w)}</div>${esc(txt(n.t))}</div>`).join('') : `<div class="empty small">${tx('Henüz haber yok.', 'No news yet.')}</div>`;
    let matchCard;
    if (S.week >= SEASON_WEEKS) matchCard = `<p>${tx('Sezon tamamlandı. Tarihçe ekranından sezon özetini inceleyin.', 'The season is complete. Review the summary on the History screen.')}</p><button class="btn gold" data-a="nextWeek">${tx('Yeni Sezona Geç', 'Start New Season')}</button>`;
    else if (thisWeek) {
      const opp = S.clubs[thisWeek.m.h === me.id ? thisWeek.m.a : thisWeek.m.h];
      const won = thisWeek.m.r && thisWeek.m.r.w === (thisWeek.m.h === me.id ? 0 : 1);
      matchCard = `<div class="row">${H.crest(me, 40)}<b class="big">vs</b>${H.crest(opp, 40)}<div class="col gap0 grow" style="min-width:0"><b class="ellip">${esc(opp.n)}</b><span class="tiny muted">${esc(Calendar.compName(thisWeek.comp))}</span><span class="tiny muted">${thisWeek.m.h === me.id ? tx('İç saha', 'Home') : thisWeek.m.nt ? tx('Tarafsız saha', 'Neutral venue') : tx('Deplasman', 'Away')} · ${TIERS[opp.tier].s} · ${rankTxt(Leagues.rankOf(opp.id))}</span></div></div>
        ${thisWeek.m.r ? `<p class="small">${tx('Maç oynandı:', 'Match played:')} <b class="${won ? 'good' : 'bad'}">${won ? tx('Galibiyet', 'Win') : tx('Mağlubiyet', 'Defeat')}</b> (${Math.max(thisWeek.m.r.hs, thisWeek.m.r.as)}-${Math.min(thisWeek.m.r.hs, thisWeek.m.r.as)}). ${tx("Haftayı tamamlamak için Sonraki Hafta'ya basın.", 'Press Next Week to finish the week.')}</p>` : `<div class="row mt"><button class="btn gold grow" data-a="go" data-s="match">${Art.icon('match', 16)} ${tx('Maça Git', 'Go to Match')}</button></div>`}`;
    } else matchCard = `<p class="small muted">${tx('Bu hafta maçınız yok.', 'No match for you this week.')}</p>${up[0] ? nextTxt(up[0]) : ''}`;
    return `<div class="grid hubgrid">
      <div class="col">
        <div class="card"><div class="row">${H.crest(me, 64)}<div class="col gap0 grow" style="min-width:0"><h2 style="margin:0" class="ellip">${esc(me.n)}</h2><span class="small muted">${H.reg(me.reg)} · ${TIERS[me.tier].n}</span><span class="small">${tx('Sıra', 'Position')}: <b>${Leagues.rankOf(me.id)}.</b> · ${tx('Hedef', 'Goal')}: ${esc(H.goal(me.goal))}</span></div></div>
          <div class="grid g3 mt small"><div><div class="tiny muted">${tx('Bütçe', 'Budget')}</div><b class="gold">${fmtGold(me.budget)}</b></div><div><div class="tiny muted">${tx('İtibar', 'Reputation')}</div><b>${Math.round(me.rep)}</b>/100</div><div><div class="tiny muted">${tx('Taraftar', 'Fans')}</div><b>${fmtInt(me.fans)}</b></div></div></div>
        <div class="card"><h3>${Art.icon('match', 16)} ${S.week >= SEASON_WEEKS ? tx('Sezon Sonu', 'Season End') : tx('Bu Hafta', 'This Week')}</h3>${matchCard}</div>
        <div class="card"><h3>${tx('Durum', 'Status')}</h3><div class="col small">
          <div class="row">${Art.icon('transfer', 14)} ${Calendar.windowLabel()}</div>
          <div class="row">${Art.icon('injury', 14)} ${inj.length ? inj.map(g => esc(g.n) + ' (' + g.injury.w + ' ' + wk() + ')').join(', ') : tx('Sakat gladyatör yok', 'No injured gladiators')}</div>
          ${exp.length ? `<div class="row warn">${Art.icon('history', 14)} ${tx('Sözleşmesi biten', 'Contract expiring')}: ${exp.map(g => esc(g.n)).join(', ')}</div>` : ''}
          ${S.offers.length ? `<div class="row gold" data-a="go" data-s="market" data-tab="offers" style="cursor:pointer">${Art.icon('coin', 14)} ${tx(S.offers.length + ' transfer teklifi bekliyor', S.offers.length + ' transfer offer(s) waiting')}</div>` : ''}
          <div class="row">${Art.icon('sponsors', 14)} ${me.sponsor ? `${esc(SPONSOR_TYPES[me.sponsor.t].n)}: ${esc(Sponsors.goalText(me.sponsor.goal))} — <span class="${sp && sp.ok ? 'good' : 'muted'}">${sp ? esc(sp.cur) : ''}</span>` : `<span class="warn">${tx('Hami yok', 'No patron')}${S.sponsorOffers.length ? tx(' — teklifleri inceleyin', ' — review the offers') : ''}</span>`}</div>
          ${me.arrears > 0 ? `<div class="row bad">${Art.icon('finance', 14)} ${tx(`Maaş borcu ${fmtGold(me.arrears)} — Finans ekranına bakın`, `Wage arrears ${fmtGold(me.arrears)} — see the Finance screen`)}</div>` : ''}
          ${Squad.healthyCount(me) < 3 ? `<div class="row warn">${tx('Üç sağlıklı gladyatörünüz yok: eksik pozisyonlar geçici arena dövüşçüsüyle doldurulacak.', 'You do not have three healthy gladiators: empty positions will be filled by temporary arena fighters.')}</div>` : ''}
        </div></div>
      </div>
      <div class="col">
        <div class="card"><h3>${Art.icon('leagues', 16)} ${TIERS[me.tier].s}</h3><table class="t small"><tr><th>#</th><th>${tx('Kulüp', 'Club')}</th><th class="n">${tx('O', 'P')}</th><th class="n">${tx('P', 'Pts')}</th><th>Form</th></tr>
          ${tbl.map(r => { const c = S.clubs[r.cid]; return `<tr class="click ${c.isPlayer ? 'me' : ''} ${r.rank <= 2 && lg.tier > 1 ? 'zone-up' : ''} ${r.rank >= 7 && lg.tier < 6 ? 'zone-down' : ''}" data-a="club" data-c="${c.id}"><td>${r.rank}</td><td><span class="row gap0">${H.crest(c, 18)} <span class="ellip" style="max-width:9rem">${esc(c.n)}</span></span></td><td class="n">${r.p}</td><td class="n b">${r.pts}</td><td>${H.form(r.form)}</td></tr>`; }).join('')}</table></div>
        <div class="card"><h3>${tx('Yaklaşan Maçlar', 'Upcoming Matches')}</h3>${up.length ? up.map(nextTxt).join('') : `<div class="empty small">${tx('Sezonun kalanında maç yok.', 'No more matches this season.')}</div>`}</div>
      </div>
      <div class="col">
        <div class="card news"><h3>${Art.icon('news', 16)} ${tx('Kulüp Haberleri', 'Club News')}</h3>${news(pn)}</div>
        <div class="card"><h3>${tx('Dünyadan', 'Around the World')}</h3>${news(wn)}</div>
      </div></div>`;
  },

  // ------------------------------------------------------------ squad
  squad() {
    const me = GameState.player();
    const arr = Squad.arrangement(me);
    const card = (gid, idx) => {
      const ace = idx < 3;
      if (gid == null) return `<div class="gcard emptyslot" data-slot="${idx}"><div class="center small" style="text-align:center">${tx('Boş slot', 'Empty slot')}<br><button class="btn sm mt" data-a="go" data-s="market">${tx('Transfer Pazarı', 'Transfer Market')}</button></div></div>`;
      const g = S.glads[gid];
      return `<div class="gcard ${ace ? 'ace' : ''} ${UI.squadSel === idx ? 'sel' : ''} ${g.injury ? 'injured' : ''}" data-slot="${idx}" data-gid="${gid}">
        <div class="top">${H.por(g, 3.3)}<div class="grow" style="min-width:0"><div class="nm">${esc(g.n)}</div><div class="tiny muted">${H.cls(g.cls)}</div><div class="tiny dim">${tx(g.age + ' yaş', 'Age ' + g.age)} · ${H.reg(g.reg)}</div></div>${H.ovr(g.ovr)}</div>
        <div class="lines"><span>${tx('Kondisyon', 'Condition')}</span><span>${Math.round(g.cond)}</span></div>${H.bar(g.cond, 100, g.cond < 55 ? 'r' : 'g')}
        <div class="lines"><span>${tx('Moral', 'Morale')}</span><span>${Math.round(g.mor)}</span><span>${tx('Durum', 'Status')}</span><span>${g.injury ? `<span class="bad">${H.injName(g.injury.l)} (${g.injury.w} ${wk()})</span>` : `<span class="good">${tx('Sağlıklı', 'Healthy')}</span>`}</span><span>${tx('Değer', 'Value')}</span><span>${fmtGold(g.val)}</span><span>${tx('Maaş', 'Wage')}</span><span>${fmtGold(g.con.wage)}/${wk()}</span><span>${tx('Sözleşme', 'Contract')}</span><span class="${g.con.yrs <= 1 ? 'warn' : ''}">${H.con(g)}</span></div>
        <div class="acts"><button class="btn xs" data-a="profile" data-g="${gid}">${tx('Profil', 'Profile')}</button><button class="btn xs" data-a="go" data-s="equipment" data-g="${gid}">${tx('Ekipman', 'Equipment')}</button></div></div>`;
    };
    const healthy = Squad.healthyCount(me);
    return `<div class="row mb wrap"><h2 style="margin:0">${tx('Kadro', 'Squad')} <span class="small muted">(${me.roster.length}/5)</span></h2><span class="small muted">${tx('İki karta sırayla dokunarak ya da sürükleyerek yer değiştirin. İlk üç kart maça çıkan as gladyatörlerdir.', 'Tap two cards in turn or drag to swap them. The first three cards are the starting gladiators.')}</span>
        <span class="right"></span><button class="btn sm" data-a="autoLineup">${tx('Otomatik diz', 'Auto arrange')}</button><button class="btn sm gold" data-a="go" data-s="match">${tx('Maç Merkezi', 'Match Centre')}</button></div>
      ${healthy < 3 ? `<div class="card warn small mb">${tx(`Sadece ${healthy} sağlıklı gladyatörünüz var. Maçta eksik pozisyonlar düşük seviyeli geçici arena dövüşçüsüyle doldurulacak (kalıcı kadro slotu kullanmaz).`, `You only have ${healthy} healthy gladiator(s). Empty positions will be filled by low-level temporary arena fighters (they do not take a squad slot).`)}</div>` : ''}
      <div class="squad-grid">
        ${POSITIONS.map((p, i) => `<div><div class="slotlbl">${p}</div>${card(arr[i], i)}</div>`).join('')}
        <div class="divider"></div>
        ${[3, 4].map(i => `<div><div class="slotlbl bench">${tx('Yedek', 'Reserve')}</div>${card(arr[i], i)}</div>`).join('')}
      </div>
      <div class="card mt small">${tx('<b>Diziliş:</b> Ön Hat ortadan ilerler, kanatlar yanlardan başlar. Maç başladıktan sonra dövüşçüler serbestçe hareket eder. Murmillo/Secutor gibi kalkanlı sınıflar ön hatta, menzilli Retiarius ve Hoplomachus kanatlarda daha verimlidir. Kondisyonu düşük gladyatörler daha zayıf dövüşür — rotasyon yapın.', '<b>Formation:</b> the Front Line advances through the centre, the wings start on the flanks. Once the match begins fighters move freely. Shield classes like Murmillo/Secutor work best up front, while the reach of Retiarius and Hoplomachus suits the wings. Gladiators in poor condition fight worse — rotate your squad.')}</div>`;
  },
  after_squad() {
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
    if (!g) return `<div class="card">${tx('Gladyatör bulunamadı (emekli olmuş olabilir).', 'Gladiator not found (he may have retired).')} <button class="btn sm" data-a="go" data-s="${p.back || 'hub'}">${tx('Geri', 'Back')}</button></div>`;
    const me = GameState.player();
    const own = g.club === me.id;
    const club = g.club >= 0 ? S.clubs[g.club] : null;
    const C = CLASSES[g.cls];
    const lvl = Scouting.level(g);
    const attr = k => `<div class="attr"><span>${ATTR_NAMES[k]}</span>${H.bar(g[k], 100, k === 'cha' ? 'b' : '')}<b class="n" style="text-align:right">${Math.round(g[k])}</b></div>`;
    const st = (o, label) => `<tr><td>${label}</td><td class="n">${o.m}</td><td class="n">${o.w}</td><td class="n">${o.ko}</td><td class="n">${fmtInt(o.dmg)}</td><td class="n">${fmtInt(o.tk)}</td><td class="n">${o.sv}</td><td class="n">${o.blk}</td></tr>`;
    const eq = ['w', 'a', 'x'].map(s => { const it = S.items[g.eq[s]]; return `<div class="row small"><span class="pill">${SLOT_NAMES[s]}</span>${it ? `<span style="color:${QUALITIES[it.q].c}">${esc(Equipment.name(it))}</span>` : `<span class="dim">${tx('Temel sınıf ekipmanı', 'Basic class gear')}</span>`}</div>`; }).join('');
    const nego = Transfer.nego(g.id);
    let acts = '';
    if (own) {
      acts = `<button class="btn sm" data-a="go" data-s="equipment" data-g="${g.id}">${Art.icon('equipment', 14)} ${tx('Ekipman', 'Equipment')}</button>
        ${g.con.yrs <= 2 ? `<button class="btn sm gold" data-a="renew" data-g="${g.id}">${tx('Sözleşme Uzat', 'Extend Contract')}</button>` : ''}
        <button class="btn sm primary" data-a="release" data-g="${g.id}">${tx('Sözleşmeyi Feshet', 'Release')} (${fmtGold(Transfer.releaseCost(g))})</button>`;
    } else {
      const err = Transfer.canBuy(g);
      acts = `<button class="btn sm gold ${err ? 'disabled' : ''}" data-a="nego" data-g="${g.id}">${g.club < 0 ? tx('Sözleşme Teklif Et', 'Offer Contract') : tx('Transfer Teklifi', 'Make Transfer Bid')}</button>
        <button class="btn sm ${lvl >= 3 || Scouting.reportsLeft() <= 0 ? 'disabled' : ''}" data-a="scoutReport" data-g="${g.id}">${Art.icon('eye', 14)} ${tx('Keşif Raporu', 'Scout Report')} (${fmtGold(Scouting.reportCost())}, ${tx(Scouting.reportsLeft() + ' hak', Scouting.reportsLeft() + ' left')})</button>
        ${err ? `<div class="tiny warn" style="flex-basis:100%">${esc(err)}</div>` : ''}${nego && nego.msg ? `<div class="tiny muted" style="flex-basis:100%">${tx('Son görüşme', 'Last talks')}: ${esc(txt(nego.msg))}</div>` : ''}`;
    }
    const scoutLvl = [tx('Belirsiz', 'Unknown'), tx('Temel', 'Basic'), tx('İyi', 'Good'), tx('Kesin', 'Precise')][lvl];
    return `<div class="row mb"><button class="btn ghost sm" data-a="go" data-s="${p.back || 'squad'}">${Art.icon('back', 14)} ${tx('Geri', 'Back')}</button><h2 style="margin:0" class="grow ellip">${esc(g.n)}</h2>${club ? `<span class="row small" data-a="club" data-c="${club.id}" style="cursor:pointer">${H.crest(club, 22)} ${esc(club.n)}</span>` : `<span class="pill gold">${tx('Serbest Gladyatör', 'Free Agent')}</span>`}</div>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) minmax(0,1.1fr)">
        <div class="col">
          <div class="card"><div class="row" style="align-items:flex-start">${H.por(g, 6.5)}<div class="col gap0 grow"><div>${H.cls(g.cls)}</div><div class="tiny muted">${C.role}</div><div class="tiny muted">${C.gear}</div><div class="small mt">${tx(g.age + ' yaş', 'Age ' + g.age)} · ${H.reg(g.reg)}</div><div class="row mt">${H.ovr(g.ovr)}<span class="tiny muted">${tx('Genel güç', 'Overall')}</span></div></div></div>
            <div class="kv mt"><span>${tx('Tahmini potansiyel', 'Estimated potential')}</span><span class="gold b">${H.pot(g)}</span><span>${tx('Piyasa değeri', 'Market value')}</span><span>${fmtGold(g.val)}</span><span>${tx('Kondisyon', 'Condition')}</span><span>${Math.round(g.cond)} / 100</span><span>${tx('Moral', 'Morale')}</span><span>${Math.round(g.mor)} / 100</span><span>${tx('Sağlık', 'Health')}</span><span>${H.inj(g)}</span><span>${tx('Keşif bilgisi', 'Scouting knowledge')}</span><span>${scoutLvl}</span></div>
          </div>
          <div class="card"><h3>${tx('Özel Teknik', 'Special Technique')}: ${C.sp.name}</h3><div class="small muted">${C.sp.desc}</div><div class="tiny dim mt">${tx(`Bekleme süresi ~${C.sp.cd} sn · Teknik özelliği etkinliği artırır.`, `Cooldown ~${C.sp.cd}s · Technique increases its effect.`)}</div></div>
        </div>
        <div class="col">
          <div class="card"><h3>${tx('Özellikler', 'Attributes')}</h3>${ATTRS.map(attr).join('')}<div class="tiny dim">${tx('Karizma savaş hasarını etkilemez; popülerlik, seyirci ilgisi ve ticari değeri belirler.', 'Charisma does not affect combat damage; it drives popularity, crowd interest and commercial value.')}</div></div>
          <div class="card"><h3>${tx('Gizli Özellikler', 'Hidden Attributes')} <span class="tiny muted">${tx('(keşif tahmini)', '(scouting estimate)')}</span></h3><div class="kv"><span>${tx('Potansiyel', 'Potential')}</span><span>${H.pot(g)}</span><span>${tx('Sakatlık eğilimi', 'Injury proneness')}</span><span>${Scouting.trait(g, 'inj')}</span><span>${tx('Sadakat', 'Loyalty')}</span><span>${Scouting.trait(g, 'loy')}</span><span>${tx('Baskı altında', 'Under pressure')}</span><span>${Scouting.trait(g, 'clu')}</span><span>${tx('Gelişim hızı', 'Development speed')}</span><span>${Scouting.trait(g, 'grow')}</span></div></div>
        </div>
        <div class="col">
          <div class="card"><h3>${tx('Sözleşme', 'Contract')}</h3>${g.con ? `<div class="kv"><span>${tx('Haftalık maaş', 'Weekly wage')}</span><span>${fmtGold(g.con.wage)}</span><span>${tx('Kalan süre', 'Remaining')}</span><span>${H.con(g)}</span><span>${tx('Galibiyet bonusu', 'Win bonus')}</span><span>${fmtGold(g.con.winB)}</span><span>${tx('Şampiyonluk bonusu', 'Title bonus')}</span><span>${fmtGold(g.con.titleB)}</span></div>` : `<div class="small muted">${tx(`Sözleşmesi yok. Beklenen maaş: ~${fmtGold(Transfer.demand(g, me, false).wage)}/hf · ${g.fw} haftadır serbest.`, `No contract. Expected wage: ~${fmtGold(Transfer.demand(g, me, false).wage)}/wk · free for ${g.fw} weeks.`)}</div>`}
            <div class="row wrap mt">${acts}</div></div>
          <div class="card"><h3>${tx('Ekipman', 'Equipment')}</h3>${eq}</div>
        </div>
      </div>
      <div class="grid g2 mt">
        <div class="card"><h3>${tx('İstatistikler', 'Statistics')}</h3><table class="t small"><tr><th></th><th class="n">${tx('Maç', 'Apps')}</th><th class="n">${tx('G', 'W')}</th><th class="n">${tx('Eleme', 'Elims')}</th><th class="n">${tx('Hasar', 'Damage')}</th><th class="n">${tx('Alınan', 'Taken')}</th><th class="n">${tx('Ayakta', 'Survived')}</th><th class="n">${tx('Blok', 'Blocks')}</th></tr>${st(g.ss, tx('Bu sezon (lig)', 'This season (league)'))}${st(g.cs, tx('Kariyer', 'Career'))}</table></div>
        <div class="card"><h3>${tx('Başarılar ve Geçmiş', 'Honours and History')}</h3>${g.aw.length ? g.aw.slice(-8).reverse().map(a => `<div class="small">${Art.icon('star', 12)} ${seasonTxt(a.s)} — ${esc(txt(a.t))}</div>`).join('') : `<div class="small dim">${tx('Henüz ödül yok.', 'No honours yet.')}</div>`}
          <div class="sep"></div><div class="tiny muted">${tx('Kulüpler', 'Clubs')}: ${g.hist.map(h => `${tx(h.s + '. sz', 'S' + h.s)} ${esc(H.club(h.c))}`).join(' → ') || '-'}</div></div>
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
    const free = tx('Serbest', 'Free');
    const tabs = `<div class="tabs"><span class="tab ${tab === 'all' ? 'on' : ''}" data-a="marketTab" data-t="all">${tx('Pazar', 'Market')}</span><span class="tab ${tab === 'free' ? 'on' : ''}" data-a="marketTab" data-t="free">${tx('Serbest Gladyatörler', 'Free Agents')}</span>
      <span class="tab ${tab === 'offers' ? 'on' : ''}" data-a="marketTab" data-t="offers">${tx('Gelen Teklifler', 'Incoming Offers')} ${S.offers.length ? `<span class="n">${S.offers.length}</span>` : ''}</span><span class="tab ${tab === 'nego' ? 'on' : ''}" data-a="marketTab" data-t="nego">${tx('Görüşmeler', 'Negotiations')} ${negos.length ? `<span class="n">${negos.length}</span>` : ''}</span><span class="tab ${tab === 'log' ? 'on' : ''}" data-a="marketTab" data-t="log">${tx('Transfer Geçmişi', 'Transfer History')}</span></div>`;
    const head = `<div class="row mb wrap"><h2 style="margin:0">${tx('Transfer Pazarı', 'Transfer Market')}</h2><span class="chip ${win ? 'win' : 'closed'}">${Calendar.windowLabel()}</span><span class="chip">${tx('Kadro', 'Squad')} ${me.roster.length}/5</span><span class="chip">${tx('Keşif', 'Scouting')}: ${Scouting.regions().map(r => H.reg(r)).join(', ')}</span><span class="chip">${tx(Scouting.reportsLeft() + ' rapor hakkı', Scouting.reportsLeft() + ' report(s) left')}</span></div>`;
    if (tab === 'offers') {
      const rows = S.offers.map(o => { const g = S.glads[o.gid], c = S.clubs[o.from]; if (!g || !c) return ''; return `<div class="card tight row wrap mb">${H.por(g, 2.6)}<div class="grow"><b>${esc(g.n)}</b> <span class="tiny muted">${CLASSES[g.cls].name} · ${Math.round(g.ovr)} · ${tx('Değer', 'Value')} ${fmtGold(g.val)}</span><div class="small">${H.crest(c, 18)} <b>${esc(c.n)}</b> (${TIERS[c.tier].s}) ${tx('teklif ediyor', 'offers')}: <b class="gold">${fmtGold(o.fee)}</b></div></div>
        <button class="btn sm" data-a="offerResp" data-o="${o.id}" data-r="reject">${tx('Reddet', 'Reject')}</button><button class="btn sm" data-a="offerResp" data-o="${o.id}" data-r="counter" ${o.countered ? 'disabled' : ''}>${tx('Pazarlık (+%20)', 'Negotiate (+20%)')}</button><button class="btn sm gold" data-a="offerResp" data-o="${o.id}" data-r="accept">${tx('Kabul Et', 'Accept')}</button></div>`; }).join('');
      return head + tabs + (rows || `<div class="card empty">${tx('Şu an gelen teklif yok. Yapay zekâ kulüpleri transfer dönemlerinde gladyatörleriniz için teklif yapabilir; onayınız olmadan kimse satılmaz.', 'No incoming offers right now. AI clubs may bid for your gladiators during transfer windows; nobody is sold without your approval.')}</div>`);
    }
    if (tab === 'nego') {
      const rows = negos.map(n => { const g = S.glads[n.gid]; return `<div class="card tight row wrap mb">${H.por(g, 2.4)}<div class="grow"><b>${esc(g.n)}</b> <span class="tiny muted">${esc(H.club(g.club))}</span><div class="small muted">${n.blocked ? `<span class="bad">${tx('Görüşme sona erdi.', 'Talks ended.')}</span> ` : n.stage === 'contract' ? tx('Sözleşme aşaması. ', 'Contract stage. ') : tx('Bonservis aşaması. ', 'Fee stage. ')}${esc(txt(n.msg))}</div></div>${n.blocked ? '' : `<button class="btn sm gold" data-a="nego" data-g="${g.id}">${tx('Devam Et', 'Continue')}</button>`}</div>`; }).join('');
      return head + tabs + (rows || `<div class="card empty">${tx('Aktif görüşme yok.', 'No active negotiations.')}</div>`);
    }
    if (tab === 'log') {
      const ty = { transfer: tx('Transfer', 'Transfer'), free: tx('Serbest imza', 'Free signing'), release: tx('Fesih', 'Released'), expire: tx('Sözleşme bitti', 'Contract expired') };
      const rows = S.transfers.slice(0, 120).map(t => `<tr class="${t.f === me.id || t.t === me.id ? 'me' : ''}"><td>${t.s}/${t.w}</td><td>${esc(t.n)}</td><td class="n">${t.ovr}</td><td>${t.f >= 0 ? esc(H.club(t.f)) : `<span class="dim">${free}</span>`}</td><td>${t.t >= 0 ? esc(H.club(t.t)) : `<span class="dim">${free}</span>`}</td><td>${ty[t.ty] || t.ty}</td><td class="n">${t.fee ? fmtGold(t.fee) : '-'}</td></tr>`).join('');
      return head + tabs + `<div class="card"><table class="t small"><tr><th>${tx('Sz/Hf', 'S/Wk')}</th><th>${tx('Gladyatör', 'Gladiator')}</th><th class="n">${tx('GG', 'OVR')}</th><th>${tx('Nereden', 'From')}</th><th>${tx('Nereye', 'To')}</th><th>${tx('Tür', 'Type')}</th><th class="n">${tx('Bedel', 'Fee')}</th></tr>${rows}</table></div>`;
    }
    if (tab === 'free') UI.mf.free = true; else if (p.tab === 'all') UI.mf.free = false;
    const f = UI.mf;
    const list = this.marketList();
    const per = 40, shown = list.slice(0, per * f.page);
    const opt = (v, cur, t) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${t}</option>`;
    const all = tx('Tümü', 'All');
    const filters = `<div class="card market-filters mb"><div class="filters">
      <label>${tx('Ad', 'Name')}<input type="text" data-ch="mf" data-k="q" value="${esc(f.q)}" placeholder="${tx('Ara…', 'Search…')}"></label>
      <label>${tx('Bölge', 'Region')}<select data-ch="mf" data-k="reg">${opt('', f.reg, all)}${REGIONS.map(r => opt(r.id, f.reg, r.name)).join('')}</select></label>
      <label>${tx('Sınıf', 'Class')}<select data-ch="mf" data-k="cls">${opt('', f.cls, all)}${CLASS_IDS.map(c => opt(c, f.cls, CLASSES[c].name)).join('')}</select></label>
      <label>${tx('Yaş', 'Age')}<div class="row gap0"><input type="number" data-ch="mf" data-k="amin" value="${f.amin}" min="18" max="45" style="width:50%"><input type="number" data-ch="mf" data-k="amax" value="${f.amax}" min="18" max="45" style="width:50%"></div></label>
      <label>${tx('Min. genel güç', 'Min. overall')}<input type="number" data-ch="mf" data-k="omin" value="${f.omin || ''}" min="0" max="99"></label>
      <label>${tx('Min. tah. potansiyel', 'Min. est. potential')}<input type="number" data-ch="mf" data-k="pmin" value="${f.pmin || ''}" min="0" max="99"></label>
      <label>${tx('Maks. değer', 'Max. value')}<input type="number" data-ch="mf" data-k="vmax" value="${f.vmax || ''}" min="0" step="500"></label>
      <label>${tx('Maks. maaş', 'Max. wage')}<input type="number" data-ch="mf" data-k="wmax" value="${f.wmax || ''}" min="0" step="10"></label>
      <label>${tx('Sözleşme', 'Contract')}<select data-ch="mf" data-k="con">${opt('', f.con, all)}${opt('exp', f.con, tx('Bitmek üzere (≤1)', 'Expiring (≤1)'))}</select></label>
      <label>${tx('Sırala', 'Sort by')}<select data-ch="mf" data-k="sort">${opt('ovr', f.sort, tx('Genel güç', 'Overall'))}${opt('pot', f.sort, tx('Tahmini potansiyel', 'Estimated potential'))}${opt('age', f.sort, tx('Yaş (genç)', 'Age (youngest)'))}${opt('val', f.sort, tx('Değer (yüksek)', 'Value (high)'))}${opt('valA', f.sort, tx('Değer (düşük)', 'Value (low)'))}${opt('wage', f.sort, tx('Maaş (düşük)', 'Wage (low)'))}${opt('name', f.sort, tx('Ad', 'Name'))}</select></label>
      <label class="row" style="flex-direction:row;align-items:center"><input type="checkbox" data-ch="mfFree" ${f.free ? 'checked' : ''}> ${tx('Yalnız serbest', 'Free agents only')}</label>
      <button class="btn sm ghost" data-a="filterReset">${tx('Filtreleri sıfırla', 'Reset filters')}</button></div></div>`;
    const rows = shown.map(g => {
      const c = g.club >= 0 ? S.clubs[g.club] : null;
      const wage = g.con ? g.con.wage : TransferMath.expectedWage(g);
      return `<div class="grow-row" data-a="profile" data-g="${g.id}" data-back="market">${H.por(g, 2.3)}<div style="min-width:0"><div class="nm ellip">${esc(g.n)}</div><div class="sub ellip">${c ? esc(c.n) + ' · ' + TIERS[c.tier].s : `<span class="gold">${free}</span>`}</div></div><div class="small">${H.cls(g.cls)}</div><div>${g.age}</div><div class="small">${H.reg(g.reg)}</div><div>${H.ovr(g.ovr)} <span class="tiny gold">${H.pot(g)}</span></div><div class="small">${fmtGold(g.val)}</div><div class="small">${fmtGold(wage)}</div><div class="small ${g.con && g.con.yrs <= 1 ? 'warn' : ''}">${g.con ? g.con.yrs + ' ' + tx('sz', 'yr') : '—'}</div></div>`;
    }).join('');
    return head + tabs + filters + `<div class="small muted mb">${tx(fmtInt(list.length) + ' gladyatör bulundu.', fmtInt(list.length) + ' gladiators found.')}</div><div class="grow-list"><div class="grow-row head"><span></span><span>${tx('Ad / Kulüp', 'Name / Club')}</span><span>${tx('Sınıf', 'Class')}</span><span>${tx('Yaş', 'Age')}</span><span>${tx('Bölge', 'Region')}</span><span>${tx('GG · Pot.', 'OVR · Pot.')}</span><span>${tx('Değer', 'Value')}</span><span>${tx('Maaş/hf', 'Wage/wk')}</span><span>${tx('Sözl.', 'Contr.')}</span></div>${rows || `<div class="empty">${tx('Filtrelere uyan gladyatör yok.', 'No gladiators match the filters.')}</div>`}</div>
      ${list.length > shown.length ? `<div class="center mt"><button class="btn" data-a="marketMore">${tx('Daha fazla göster', 'Show more')} (${list.length - shown.length})</button></div>` : ''}`;
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
      content = `<table class="t"><tr><th>#</th><th>${tx('Kulüp', 'Club')}</th><th class="n">${tx('O', 'P')}</th><th class="n">${tx('G', 'W')}</th><th class="n">${tx('M', 'L')}</th><th class="n">${tx('E+', 'E+')}</th><th class="n">${tx('E-', 'E-')}</th><th class="n">${tx('Av.', 'Diff')}</th><th class="n">${tx('Puan', 'Pts')}</th><th>Form</th><th class="n">${tx('Kadro', 'Squad')}</th></tr>
        ${tbl.map(r => { const c = S.clubs[r.cid]; return `<tr class="click ${c.isPlayer ? 'me' : ''} ${r.rank <= 2 && tier > 1 ? 'zone-up' : ''} ${r.rank >= 7 && tier < 6 ? 'zone-down' : ''}" data-a="club" data-c="${c.id}"><td>${r.rank}</td><td><span class="row">${H.crest(c, 22)}<span class="ellip">${esc(c.n)}</span></span></td><td class="n">${r.p}</td><td class="n">${r.w}</td><td class="n">${r.l}</td><td class="n">${r.kf}</td><td class="n">${r.ka}</td><td class="n">${r.kf - r.ka}</td><td class="n b gold">${r.pts}</td><td>${H.form(r.form)}</td><td class="n">${H.ovr(Squad.avgOvr(c))}</td></tr>`; }).join('')}</table>
        <div class="tiny muted mt">${tx('Galibiyet 3 puan, beraberlik yok. Eşitlikte: galibiyet, ikili maçlar, eleme averajı, kalan can performansı, itibar.', 'A win is worth 3 points; there are no draws. Ties are broken by wins, head-to-head, elimination difference, remaining health, then reputation. E+/E- = eliminations for/against.')} ${tier > 1 ? tx('İlk iki kulüp üst lige çıkar. ', 'The top two are promoted. ') : ''}${tier < 6 ? tx('Son iki kulüp alt lige düşer.', 'The bottom two are relegated.') : ''}</div>`;
    } else {
      const rd = clamp(p.round != null ? +p.round : (UI.lgRound != null ? UI.lgRound : Math.max(0, LEAGUE_WEEKS.findIndex(w => w >= S.week))), 0, 13);
      UI.lgRound = rd;
      content = `<div class="tabs">${LEAGUE_WEEKS.map((w, i) => `<span class="tab ${i === rd ? 'on' : ''}" data-a="leagueRound" data-r="${i}">${tx((i + 1) + '. maç', 'Match ' + (i + 1))} <span class="tiny">(${tx(w + '.hf', 'wk ' + w)})</span></span>`).join('')}</div>
        ${lg.rounds[rd].map(m => { const h = S.clubs[m.h], a = S.clubs[m.a]; const r = m.r; return `<div class="card tight row mb ${h.isPlayer || a.isPlayer ? 'me' : ''}" style="${h.isPlayer || a.isPlayer ? 'border-color:var(--gold)' : ''}"><span class="row grow ellip" style="justify-content:flex-end;${r && r.w === 0 ? 'font-weight:700' : ''}">${esc(h.n)} ${H.crest(h, 22)}</span><span class="serif" style="min-width:4rem;text-align:center">${r ? `${r.hs} – ${r.as}` : tx(`${LEAGUE_WEEKS[rd]}. hf`, `Wk ${LEAGUE_WEEKS[rd]}`)}</span><span class="row grow ellip" style="${r && r.w === 1 ? 'font-weight:700' : ''}">${H.crest(a, 22)} ${esc(a.n)}</span></div>`; }).join('')}
        <div class="tiny muted">${tx('Skor: maç sonunda ayakta kalan gladyatör sayısı.', 'Score: gladiators still standing at the end of the match.')}</div>`;
    }
    return `<div class="row mb"><h2 style="margin:0">${tx('Ligler', 'Leagues')}</h2></div>
      <div class="tabs">${REGIONS.map(r => `<span class="tab ${reg === r.id ? 'on' : ''}" data-a="leaguesReg" data-r="${r.id}">${Art.regionSVG(r.id, 16)} ${r.name}</span>`).join('')}</div>
      <div class="tabs">${[1, 2, 3, 4, 5, 6].map(t => `<span class="tab ${tier === t ? 'on' : ''}" data-a="leaguesTier" data-t="${t}">${t}. ${TIERS[t].s}</span>`).join('')}</div>
      <div class="card"><div class="row mb"><h3 style="margin:0" class="grow">${REGION_BY_ID[reg].name} · ${TIERS[tier].n}</h3><div class="seg"><button class="${tab === 'table' ? 'on' : ''}" data-a="leaguesTab" data-t="table">${tx('Puan Tablosu', 'Table')}</button><button class="${tab === 'fix' ? 'on' : ''}" data-a="leaguesTab" data-t="fix">${tx('Fikstür / Sonuçlar', 'Fixtures / Results')}</button></div></div>${content}</div>`;
  },
  clubModal(cid) {
    const c = S.clubs[cid]; if (!c) return;
    const me = GameState.player();
    const rows = GameState.rosterGlads(c).map(g => `<tr class="click" data-a="profile" data-g="${g.id}" data-back="${UI.screen === 'profile' ? 'hub' : UI.screen}"><td><span class="row">${H.por(g, 1.8, [c.crest.c1, c.crest.c2])}<span>${esc(g.n)}${c.lineup.includes(g.id) ? ` <span class="pill gold">${tx('As', 'Starter')}</span>` : ''}</span></span></td><td>${CLASSES[g.cls].name}</td><td class="n">${g.age}</td><td class="n">${H.ovr(g.ovr)}</td><td class="n">${fmtGold(g.val)}</td><td>${g.injury ? `<span class="bad">${tx('Sakat', 'Injured')}</span>` : ''}</td></tr>`).join('');
    const riv = Object.entries(c.riv).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${esc(H.club(+k))} (${v})`).join(', ');
    const hist = c.hist.slice(-5).reverse().map(h => `${tx(h.s + '. sz', 'S' + h.s)}: ${TIERS[h.tier].s} ${h.rank}.`).join(' · ');
    UI.modal(`${esc(c.n)}`, `<div class="row" style="align-items:flex-start">${H.crest(c, 70)}<div class="grow"><div class="small muted">${H.reg(c.reg)} · ${TIERS[c.tier].n} · ${rankTxt(Leagues.rankOf(c.id))}</div>
      <div class="kv mt"><span>${tx('Politika', 'Policy')}</span><span>${c.isPlayer ? tx('Oyuncu kulübü', 'Your club') : POLICIES[c.pol].n + ' — ' + POLICIES[c.pol].desc}</span><span>${tx('Sezon hedefi', 'Season goal')}</span><span>${esc(H.goal(c.goal))}</span><span>${tx('Bütçe', 'Budget')}</span><span>${fmtGold(c.budget)}${c.arrears > 0 ? ` <span class="bad">(${tx('borç', 'arrears')} ${fmtGold(c.arrears)})</span>` : ''}</span><span>${tx('İtibar / Taraftar', 'Reputation / Fans')}</span><span>${Math.round(c.rep)} · ${fmtInt(c.fans)}</span><span>${tx('Tesisler', 'Facilities')}</span><span>${tx('Eğitim', 'Training')} ${c.fac.train} · ${tx('Revir', 'Infirmary')} ${c.fac.med} · ${tx('Keşif', 'Scouting')} ${c.fac.scout} · Arena ${c.fac.arena}</span><span>${tx('Maaş yükü', 'Wage bill')}</span><span>${fmtGold(Economy.wageBill(c))}/${wk()}</span><span>${tx('Rekabetler', 'Rivalries')}</span><span>${riv || '-'}</span><span>${tx('Geçmiş', 'History')}</span><span>${hist || '-'}</span><span>${tx('Kupalar', 'Trophies')}</span><span>${c.trophies.length ? c.trophies.slice(-4).map(t => esc(tx(t.s + '. sz ', 'S' + t.s + ' ') + txt(t.t))).join(', ') : '-'}</span></div></div></div>
      <div class="sep"></div><table class="t small"><tr><th>${tx('Gladyatör', 'Gladiator')}</th><th>${tx('Sınıf', 'Class')}</th><th class="n">${tx('Yaş', 'Age')}</th><th class="n">${tx('GG', 'OVR')}</th><th class="n">${tx('Değer', 'Value')}</th><th></th></tr>${rows}</table>
      ${c.id !== me.id && !Scouting.regions().includes(c.reg) ? `<div class="tiny warn mt">${tx('Keşif ağınız bu bölgeyi kapsamadığı için bu kulübe teklif yapamazsınız.', 'Your scouting network does not cover this region, so you cannot bid for this club\'s gladiators.')}</div>` : ''}`, '', 'mid');
  },

  // ------------------------------------------------------------ cups
  cups(p) {
    const me = GameState.player();
    const tab = p.tab || UI.cupTab || me.reg;
    UI.cupTab = tab;
    const tabs = `<div class="tabs">${REGIONS.map(r => `<span class="tab ${tab === r.id ? 'on' : ''}" data-a="cupsTab" data-t="${r.id}">${Art.regionSVG(r.id, 16)} ${Cups.nameOf('r_' + r.id)}</span>`).join('')}<span class="tab ${tab === 'imp' ? 'on' : ''}" data-a="cupsTab" data-t="imp">${Art.icon('cups', 14)} ${Cups.nameOf('imp')}</span><span class="tab ${tab === 'champs' ? 'on' : ''}" data-a="cupsTab" data-t="champs">${tx('Şampiyonlar', 'Winners')}</span></div>`;
    const title = `<h2>${tx('Kupalar', 'Cups')}</h2>`;
    if (tab === 'champs') {
      const rows = S.hist.champs.slice().reverse().map(c => `<tr class="${c.c === me.id ? 'me' : ''}"><td>${seasonTxt(c.s)}</td><td>${esc(Cups.nameOf(c.k))}</td><td><span class="row">${H.crest(S.clubs[c.c], 18)} ${esc(S.clubs[c.c] ? S.clubs[c.c].n : c.cn)}</span></td><td class="dim">${esc(c.r >= 0 && S.clubs[c.r] ? S.clubs[c.r].n : c.rn)}</td></tr>`).join('');
      return `${title}${tabs}<div class="card">${rows ? `<table class="t"><tr><th>${tx('Sezon', 'Season')}</th><th>${tx('Kupa', 'Cup')}</th><th>${tx('Şampiyon', 'Winner')}</th><th>${tx('Finalist', 'Runner-up')}</th></tr>${rows}</table>` : `<div class="empty">${tx('Henüz tamamlanmış kupa yok.', 'No cup has been completed yet.')}</div>`}</div>`;
    }
    const cup = tab === 'imp' ? S.icup : S.rcups[tab];
    if (!cup) {
      return `${title}${tabs}<div class="card"><h3>${Cups.nameOf('imp')}</h3><p>${tx("İmparatorluk Kupası'na beş bölgenin Altın Kolezyum liglerini <b>önceki sezon</b> ilk iki sırada bitiren 10 kulüp katılır. İlk kariyer sezonunda önceki sezon sonucu bulunmadığından kupa <b>2. sezondan itibaren</b> düzenlenir.", "The Imperial Cup is contested by the 10 clubs that finished in the top two of the five Golden Colosseum leagues <b>the previous season</b>. Since there is no previous season in the first year of a career, the cup is held <b>from season 2 onwards</b>.")}</p>
        <p class="small muted">${tx(`Format: 4 kulüp ön elemede oynar; 2 kazanan, 5 şampiyon ve en iyi ikinciyle (6 seri başı) çeyrek finalde buluşur. Ardından yarı final ve Büyük Kolezyum'da final. Maç haftaları: ${ICUP_WEEKS.join(', ')}.`, `Format: 4 clubs play a qualifier; the 2 winners join the 5 champions and the best runner-up (6 seeds) in the quarter-finals, followed by the semi-finals and the final in the Grand Colosseum. Match weeks: ${ICUP_WEEKS.join(', ')}.`)}</p></div>`;
    }
    const alive = Cups.alive(cup, me.id);
    const tierLbl = t => tx(t + '.lig', 'T' + t);
    const bm = m => {
      const h = S.clubs[m.h], a = S.clubs[m.a]; const r = m.r;
      const sH = r ? (r.w === 0 ? 'w' : 'l') : '', sA = r ? (r.w === 1 ? 'w' : 'l') : '';
      return `<div class="bm ${h.isPlayer || a.isPlayer ? 'me' : ''}"><div class="s ${sH}">${H.crest(h, 15)}<span class="grow ellip">${esc(h.n)}</span><span class="tiny dim" title="${tx('Lig seviyesi', 'League tier')}">${tierLbl(h.tier)}</span>${r ? `<b>${r.hs}</b>` : ''}</div><div class="s ${sA}">${H.crest(a, 15)}<span class="grow ellip">${esc(a.n)}</span><span class="tiny dim" title="${tx('Lig seviyesi', 'League tier')}">${tierLbl(a.tier)}</span>${r ? `<b>${r.as}</b>` : ''}</div></div>`;
    };
    const plain = cid => `<div class="bm"><div class="s">${H.crest(S.clubs[cid], 15)}<span class="ellip">${esc(S.clubs[cid].n)}</span></div></div>`;
    const byes = cup.byes ? `<div class="bround"><h4>${tx('Bay geçenler (1.–2. lig)', 'Byes (tiers 1–2)')}</h4>${cup.byes.map(plain).join('')}</div>` : '';
    const seeds = cup.seeds ? `<div class="bround"><h4>${tx('Seri başları', 'Seeds')}</h4>${cup.seeds.map(plain).join('')}</div>` : '';
    return `${title}${tabs}<div class="card"><div class="row mb wrap"><h3 style="margin:0" class="grow">${esc(Cups.nameOf(cup))} · ${seasonTxt(cup.season)}</h3>
        ${cup.champ >= 0 ? `<span class="pill gold">${Art.icon('cups', 12)} ${tx('Şampiyon', 'Winner')}: ${esc(S.clubs[cup.champ].n)}</span>` : ''}${cup.part.includes(me.id) ? `<span class="pill ${alive ? 'ok' : ''}">${alive ? tx('Kupada devam ediyorsunuz', 'Still in the cup') : tx('Elendiniz', 'Eliminated')}</span>` : ''}</div>
        <div class="tiny muted mb">${cup.key === 'imp' ? tx("Tek maç eleme. Final tarafsız Büyük Kolezyum'da oynanır.", 'Single-match knockout. The final is played at the neutral Grand Colosseum.') : tx('Bölgedeki 48 kulübün tamamı katılır. 1. turda 3.–6. lig kulüpleri (32) oynar; 1. ve 2. lig kulüpleri (16) bay geçer. Tek maç eleme; alt lig kulübü ev sahibidir, final tarafsız sahadadır.', 'All 48 clubs of the region take part. Tiers 3–6 (32 clubs) play round 1; tiers 1–2 (16 clubs) get a bye. Single-match knockout; the lower-tier club hosts and the final is on neutral ground.')} ${tx('Maç haftaları', 'Match weeks')}: ${cup.rounds.map(r => r.wk).join(', ')}.</div>
        <div class="bracket">${byes}${seeds}${cup.rounds.map((rd, k) => `<div class="bround"><h4>${cup.key === 'imp' ? ICUP_ROUNDS[k] : RCUP_ROUNDS[k]} · ${tx(rd.wk + '. hf', 'wk ' + rd.wk)}</h4>${rd.m.length ? rd.m.map(bm).join('') : `<div class="bm dim">${tx('Kura bekleniyor', 'Awaiting draw')}</div>`}</div>`).join('')}</div></div>`;
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
    const mine = `<div class="card"><h3>${tx('As Kadro & Diziliş', 'Starters & Formation')}</h3>${lineup.map((g, i) => `<div class="row small" style="margin:.25rem 0"><span class="pill" style="min-width:4.6rem;text-align:center">${POSITIONS[i]}</span>${H.por(g, 2.2)}<div class="grow" style="min-width:0"><b class="ellip">${esc(g.n)}</b>${g.temp ? ` <span class="pill">${tx('Geçici', 'Temporary')}</span>` : ''}<div class="tiny dim">${CLASSES[g.cls].name} · ${tx('Kond.', 'Cond.')} ${Math.round(g.cond)} · ${tx('Moral', 'Morale')} ${Math.round(g.mor)}</div></div>${H.ovr(g.ovr)}</div>`).join('')}
      <div class="row mt"><button class="btn sm" data-a="go" data-s="squad">${tx('Kadroyu Düzenle', 'Edit Squad')}</button><span class="tiny muted">${tx('Ortalama', 'Average')}: ${Math.round(Squad.teamOvr(lineup))}</span></div></div>`;
    let opp = '';
    if (show) {
      const oc = S.clubs[show.m.h === me.id ? show.m.a : show.m.h];
      const ol = MatchSystem.lineupGlads(oc, 2);
      const row = Leagues.table(S.leagues[oc.lg]).find(r => r.cid === oc.id);
      const tend = { def: `${TACTICS.defensive.name} / ${TACTICS.guard.name}`, agg: `${TACTICS.aggressive.name} / ${TACTICS.focus.name}`, rich: `${TACTICS.balanced.name} / ${TACTICS.focus.name}`, talent: TACTICS.balanced.name, econ: TACTICS.balanced.name }[oc.pol];
      opp = `<div class="card"><h3>${tx('Rakip Analizi', 'Opponent Analysis')}</h3><div class="row">${H.crest(oc, 44)}<div class="grow"><b>${esc(oc.n)}</b><div class="tiny muted">${TIERS[oc.tier].s} · ${row ? rankTxt(row.rank) + ' · ' + row.pts + ' ' + tx('puan', 'pts') : ''}</div><div>${H.form(row ? row.form : [])}</div></div></div>
        <div class="tiny muted mt">${tx('Olası as kadro', 'Likely starters')}:</div>${ol.map(g => `<div class="row small" style="margin:.2rem 0">${H.por(g, 1.9, [oc.crest.c1, oc.crest.c2])}<span class="grow ellip">${esc(g.n)}</span><span class="dim">${CLASSES[g.cls].name}</span><span class="tiny dim">${tx('K', 'C')}${Math.round(g.cond)}</span>${H.ovr(g.ovr)}</div>`).join('')}
        <div class="kv mt small"><span>${tx('Ortalama güç', 'Average overall')}</span><span>${Math.round(Squad.teamOvr(ol))} (${tx('siz', 'you')}: ${Math.round(Squad.teamOvr(lineup))})</span><span>${tx('Taktik eğilimi', 'Tactical tendency')}</span><span>${tend}</span><span>${tx('Kulüp tipi', 'Club type')}</span><span>${POLICIES[oc.pol].n}</span><span>${tx('Ekipman', 'Equipment')}</span><span>${tx(ol.reduce((a, g) => a + ['w', 'a', 'x'].filter(s => g.eq && g.eq[s]).length, 0) + ' parça', ol.reduce((a, g) => a + ['w', 'a', 'x'].filter(s => g.eq && g.eq[s]).length, 0) + ' item(s)')}</span></div></div>`;
    }
    const header = target ? `<div class="card match-actions mb"><div class="row wrap"><div class="grow"><h3 style="margin:0">${esc(Calendar.compName(target.comp))}</h3><div class="small muted">${target.m.h === me.id ? tx('İç saha maçı', 'Home match') : target.m.nt ? tx('Tarafsız saha', 'Neutral venue') : tx('Deplasman maçı', 'Away match')} · ${tx('Bu hafta', 'This week')}</div></div>
        <button class="btn" data-a="simNow">${tx('Sonucu Simüle Et', 'Simulate Result')}</button><button class="btn gold" data-a="playNow">${Art.icon('play', 14)} ${tx('Maça Çık (Canlı)', 'Fight (Live)')}</button></div>
        <div class="tiny muted mt">${tx('Canlı maçta Hücum, Savunma ve Odaklan komutları verebilirsiniz (komutlar arasında ~8 sn bekleme). Hız: 1x / 2x / 4x ya da sonucu anında simüle edin — kurallar değişmez.', 'In a live match you can give Attack, Defend and Focus commands (~8 s cooldown between commands). Speed: 1x / 2x / 4x, or simulate the result instantly — the rules never change.')}</div></div>`
      : `<div class="card match-actions mb small">${f && f.m.r ? tx('Bu haftanın maçı oynandı. ', "This week's match has been played. ") : tx('Bu hafta maçınız yok. ', 'No match for you this week. ')}${show ? `${tx('Sıradaki maç', 'Next match')}: <b>${weekLabel(show.w)}</b> — ${esc(Calendar.compName(show.comp))}.` : ''}</div>`;
    return `<h2>${tx('Maç Merkezi', 'Match Centre')}</h2>${header}<div class="grid g3"><div class="col">${mine}</div><div class="card tactics"><h3>${tx('Maç Öncesi Taktik', 'Pre-match Tactic')}</h3><div class="col">${tacs}</div></div><div class="col">${opp || `<div class="card empty">${tx('Yaklaşan rakip yok.', 'No upcoming opponent.')}</div>`}</div></div>`;
  },

  // ------------------------------------------------------------ facilities & staff
  facilities() {
    const me = GameState.player();
    const fac = FAC_IDS.map(fid => {
      const lv = me.fac[fid], cost = Facilities.cost(me, fid);
      return `<div class="card"><div class="row"><h3 style="margin:0" class="grow">${FACILITIES[fid].name}</h3>${H.stars(lv)}</div>${Art.facilitySVG(fid, lv)}
        <div class="tiny muted mt">${FACILITIES[fid].desc}</div><div class="small mt"><b>${tx('Şimdi', 'Now')}:</b> ${Facilities.effect(fid, lv)}</div>
        ${lv < 5 ? `<div class="small"><b class="good">${tx('Sonraki', 'Next')}:</b> ${Facilities.effect(fid, lv + 1)}</div><div class="tiny dim">${tx('Bakım', 'Upkeep')}: ${fmtGold(FAC.upkeep[lv + 1] * (fid === 'arena' ? 1.3 : 1))}/${wk()}</div><button class="btn sm gold mt ${me.budget < cost || me.arrears > 0 ? 'disabled' : ''}" data-a="facUp" data-f="${fid}" style="width:100%">${tx('Yükselt', 'Upgrade')} — ${fmtGold(cost)}</button>` : `<div class="pill gold mt">${tx('En üst seviye', 'Maximum level')}</div>`}</div>`;
    }).join('');
    const staff = STAFF_IDS.map(s => {
      const cur = me.staff[s];
      const cands = (S.staffCands && S.staffCands[s]) || [];
      const effect = s === 'coach' ? tx(`Gelişim katkısı +%${Math.round(cur.q * 0.3)}`, `Development +${Math.round(cur.q * 0.3)}%`) : s === 'healer' ? tx(`Kondisyon +${r1(cur.q * 0.06)}/hf · ek iyileşme +%${Math.round(cur.q * 0.3)}`, `Condition +${r1(cur.q * 0.06)}/wk · extra healing +${Math.round(cur.q * 0.3)}%`) : tx(`Rapor doğruluğu +%${Math.round(cur.q * 0.4)}`, `Report accuracy +${Math.round(cur.q * 0.4)}%`);
      return `<div class="card"><h3>${STAFF[s].name}</h3><div class="tiny muted">${STAFF[s].desc}</div><div class="row mt"><b class="grow">${esc(cur.n)}</b><span class="pill gold">${tx('Kalite', 'Quality')} ${cur.q}</span><span class="small">${fmtGold(cur.w)}/${wk()}</span></div>
        <div class="tiny dim mt">${effect}</div>
        <div class="sep"></div><div class="tiny muted">${tx('Adaylar (işe alım bedeli = 6 haftalık maaş)', 'Candidates (hiring fee = 6 weeks of wages)')}:</div>${cands.map((c, i) => `<div class="row small" style="margin:.2rem 0"><span class="grow ellip">${esc(c.n)}</span><span class="pill">${tx('K', 'Q')} ${c.q}</span><span class="tiny">${fmtGold(c.w)}/${wk()}</span><button class="btn xs" data-a="staffHire" data-s="${s}" data-i="${i}">${tx('İşe al', 'Hire')} (${fmtGold(Staff.hireCost(c))})</button></div>`).join('')}</div>`;
    }).join('');
    const tot = `<div class="tiny muted">${tx(`Toplam bonuslar (tesis + personel, sınırlı): gelişim ×${Progression.growthMult(me).toFixed(2)} · kondisyon +${r1(Staff.condRecovery(me))}/hf · sakatlık riski -%${Math.round(Staff.injReduce(me) * 100)} · rapor doğruluğu +%${Math.round(Staff.scoutAcc(me) * 100)}`, `Total bonuses (facilities + staff, capped): development ×${Progression.growthMult(me).toFixed(2)} · condition +${r1(Staff.condRecovery(me))}/wk · injury risk -${Math.round(Staff.injReduce(me) * 100)}% · report accuracy +${Math.round(Staff.scoutAcc(me) * 100)}%`)}</div>`;
    return `<h2>${tx('Tesisler', 'Facilities')}</h2><div class="grid g4">${fac}</div><h2 class="mt">${tx('Personel', 'Staff')}</h2>${tot}<div class="grid g3 mt">${staff}</div>`;
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
      ${g ? `<div class="col gap0"><b>${esc(g.n)}</b><span class="tiny muted">${CLASSES[g.cls].name} · ${g.cls === 'dimachaerus' ? tx('kalkan kullanamaz', 'cannot use a shield') : CLASSES[g.cls].gear}</span><span class="tiny">${['w', 'a', 'x'].map(s => { const it = S.items[g.eq[s]]; return SLOT_NAMES[s] + ': ' + (it ? `<span style="color:${QUALITIES[it.q].c}">${esc(Equipment.name(it))}</span>` : `<span class="dim">${tx('temel', 'basic')}</span>`); }).join(' · ')}</span></div>` : ''}</div>`;
    const tabs = `<div class="tabs"><span class="tab ${tab === 'shop' ? 'on' : ''}" data-a="eqTab" data-t="shop">${tx('Mağaza', 'Shop')}</span><span class="tab ${tab === 'inv' ? 'on' : ''}" data-a="eqTab" data-t="inv">${tx('Envanter', 'Inventory')}</span><span class="tab ${tab === 'smith' ? 'on' : ''}" data-a="eqTab" data-t="smith">${tx('Demirci', 'Blacksmith')}</span></div>`;
    let body = '';
    const items = Equipment.clubItems(me);
    const thItem = tx('Ekipman', 'Item');
    if (tab === 'shop') {
      const slot = UI.eqSlot || 'w';
      const types = Object.keys(ITEM_TYPES).filter(t => ITEM_TYPES[t].slot === slot && (!g || ITEM_TYPES[t].cls.includes(g.cls)));
      body = `<div class="seg mb">${['w', 'a', 'x'].map(s => `<button class="${slot === s ? 'on' : ''}" data-a="eqSlot" data-s="${s}">${SLOT_NAMES[s]}</button>`).join('')}</div>
        ${types.length ? types.map(t => `<div class="card tight mb"><div class="row"><b class="grow">${ITEM_TYPES[t].n}</b><span class="tiny muted">${esc(ITEM_TYPES[t].desc)}</span></div><div class="tiny dim">${tx('Uyumlu', 'Fits')}: ${ITEM_TYPES[t].cls.map(c => CLASSES[c].name).join(', ')}</div>
          <table class="t small mt"><tr><th>${tx('Kalite', 'Quality')}</th><th>${tx('Etki', 'Effect')}</th><th class="n">${tx('Fiyat', 'Price')}</th><th></th></tr>${QUALITIES.map(q => { const fake = { t, q: q.id, p: 0 }; const need = Equipment.repNeeded(q.id); const lock = me.rep < need; return `<tr><td style="color:${q.c}" class="b">${q.n}</td><td class="tiny">${Equipment.statLine(fake)}</td><td class="n">${fmtGold(Equipment.price(t, q.id))}</td><td class="n">${lock ? `<span class="tiny dim">${tx('İtibar', 'Reputation')} ${need}</span>` : `<button class="btn xs" data-a="eqBuy" data-t="${t}" data-q="${q.id}">${tx('Satın al', 'Buy')}</button>${g ? ` <button class="btn xs gold" data-a="eqBuy" data-t="${t}" data-q="${q.id}" data-eq="1">${tx('Al + Tak', 'Buy + Equip')}</button>` : ''}`}</td></tr>`; }).join('')}</table></div>`).join('') : `<div class="empty">${tx('Bu gladyatörün sınıfına uygun ürün yok.', 'No items fit this gladiator\'s class.')}</div>`}`;
    } else if (tab === 'inv') {
      body = items.length ? `<table class="t small"><tr><th>${thItem}</th><th>${tx('Slot', 'Slot')}</th><th>${tx('Etki', 'Effect')}</th><th>${tx('Kullanan', 'Used by')}</th><th></th></tr>${items.sort((a, b) => b.q - a.q || b.p - a.p).map(it => { const holder = S.glads[it.g]; const fits = g && Equipment.fits(it, g); return `<tr><td style="color:${QUALITIES[it.q].c}" class="b">${esc(Equipment.name(it))}</td><td>${SLOT_NAMES[ITEM_TYPES[it.t].slot]}</td><td class="tiny">${Equipment.statLine(it)}</td><td>${holder ? esc(holder.n) : `<span class="dim">${tx('Depoda', 'In storage')}</span>`}</td><td class="n">${holder ? `<button class="btn xs" data-a="eqUnequip" data-i="${it.id}">${tx('Çıkar', 'Unequip')}</button>` : ''} ${g && fits && it.g !== g.id ? `<button class="btn xs gold" data-a="eqEquip" data-i="${it.id}">${tx(esc(g.n.split(' ')[0]) + "'e tak", 'Equip on ' + esc(g.n.split(' ')[0]))}</button>` : ''} <button class="btn xs ghost" data-a="eqSell" data-i="${it.id}">${tx('Sat', 'Sell')} (${fmtGold(Equipment.sellValue(it))})</button></td></tr>`; }).join('')}</table><div class="tiny muted mt">${tx('Ekipmanlar kulübe aittir; gladyatör satılsa da envanterde kalır.', 'Equipment belongs to the club and stays in the inventory if a gladiator is sold.')}</div>` : `<div class="empty">${tx('Envanter boş. Mağazadan ekipman satın alın.', 'The inventory is empty. Buy equipment in the shop.')}</div>`;
    } else {
      body = items.length ? `<div class="small muted mb">${tx('Demirci geliştirmeleri garantilidir; ekipman kırılmaz. Her seviye daha pahalıdır (en fazla +5).', 'Blacksmith upgrades always succeed and never break the item. Each level costs more (up to +5).')}</div><table class="t small"><tr><th>${thItem}</th><th>${tx('Şimdi', 'Now')}</th><th>${tx('Sonraki', 'Next')}</th><th class="n">${tx('Bedel', 'Cost')}</th><th></th></tr>${items.sort((a, b) => b.q - a.q).map(it => { const nx = { ...it, p: it.p + 1 }; return `<tr><td style="color:${QUALITIES[it.q].c}" class="b">${esc(Equipment.name(it))}</td><td class="tiny">${Equipment.statLine(it)}</td><td class="tiny good">${it.p < 5 ? Equipment.statLine(nx) : '—'}</td><td class="n">${it.p < 5 ? fmtGold(Equipment.upgradeCost(it)) : '—'}</td><td class="n">${it.p < 5 ? `<button class="btn xs gold" data-a="eqUpgrade" data-i="${it.id}">+${it.p + 1} ${tx('Geliştir', 'Upgrade')}</button>` : '<span class="pill gold">+5</span>'}</td></tr>`; }).join('')}</table>` : `<div class="empty">${tx('Geliştirilecek ekipman yok.', 'No equipment to upgrade.')}</div>`;
    }
    return `<h2>${tx('Ekipman', 'Equipment')}</h2>${strip}${tabs}<div class="card">${body}</div>`;
  },

  // ------------------------------------------------------------ sponsors
  sponsors() {
    const me = GameState.player();
    const sp = me.sponsor;
    const seasons = n => tx(n + ' sezon', n + ' season' + (n > 1 ? 's' : ''));
    const cur = sp ? (() => { const pr = Sponsors.progress(me); return `<div class="card mb"><h3>${tx('Mevcut Anlaşma', 'Current Deal')}: ${esc(SPONSOR_TYPES[sp.t].n)}</h3><div class="kv"><span>${tx('Haftalık ödeme', 'Weekly payment')}</span><span class="gold">${fmtGold(sp.wk)}</span><span>${tx('Sezon hedefi', 'Season target')}</span><span>${esc(Sponsors.goalText(sp.goal))}</span><span>${tx('Durum', 'Progress')}</span><span class="${pr && pr.ok ? 'good' : 'muted'}">${pr ? esc(pr.cur) + (pr.ok ? tx(' — şu an hedefte', ' — currently on target') : '') : '-'}</span><span>${tx('Başarı ödülü', 'Success reward')}</span><span>${fmtGold(sp.bonus)} ${tx('(sezon sonunda)', '(at season end)')}</span><span>${tx('Kalan süre', 'Remaining')}</span><span>${seasons(sp.left)} ${tx('(bu sezon dahil)', '(including this one)')}</span><span>${tx('Zorluk', 'Difficulty')}</span><span>${Math.round(sp.goal.d * 100)}%</span></div></div>`; })() : '';
    const offers = !sp && S.sponsorOffers.length ? `<h3>${tx('Yeni Teklifler', 'New Offers')} <span class="tiny muted">${tx('(itibarınıza göre; birini seçin — 1. hafta sonuna kadar geçerli)', '(based on your reputation; choose one — valid until the end of week 1)')}</span></h3><div class="grid g3">${S.sponsorOffers.map((o, i) => `<div class="offer-card"><h3>${esc(SPONSOR_TYPES[o.t].n)}</h3><div class="kv small"><span>${tx('Haftalık', 'Weekly')}</span><span class="gold b">${fmtGold(o.wk)}</span><span>${tx('Hedef', 'Target')}</span><span>${esc(Sponsors.goalText(o.goal))}</span><span>${tx('Zorluk', 'Difficulty')}</span><span>${H.bar(o.goal.d * 100, 100, o.goal.d > 0.65 ? 'r' : '')}</span><span>${tx('Ödül', 'Reward')}</span><span>${fmtGold(o.bonus)}</span><span>${tx('Süre', 'Length')}</span><span>${seasons(o.dur)}</span><span>${tx('Sezonluk toplam', 'Per season')}</span><span>${fmtGold(o.wk * 30)} + ${tx('ödül', 'reward')}</span></div><button class="btn gold mt" data-a="sponsorAccept" data-i="${i}" style="width:100%">${tx('Anlaşmayı İmzala', 'Sign the Deal')}</button></div>`).join('')}</div>` : (!sp ? `<div class="card empty">${tx('Şu an teklif yok. Yeni hami teklifleri sezon başında, itibarınıza göre gelir.', 'No offers right now. New patron offers arrive at the start of each season, based on your reputation.')}</div>` : '');
    return `<h2>${tx('Hamiler', 'Patrons')}</h2>${cur}${offers}<div class="card mt small muted">${tx('Hami türleri: Tüccar Loncası (yüksek haftalık ödeme), Soylu Aile (büyük başarı ödülü, zor hedef), Askerî Vali (galibiyet ve eleme hedefleri), Arenalar Birliği (kupa hedefleri), Halk Meclisi (uzun süreli, ev sahibi galibiyetleri). İtibar arttıkça teklifler büyür.', "Patron types: Merchants' Guild (high weekly payment), Noble Family (big success reward, hard target), Military Governor (win and elimination targets), Arenas Union (cup targets), People's Assembly (long deals, home wins). Offers grow with your reputation.")}</div>`;
  },

  // ------------------------------------------------------------ finance
  finance() {
    const me = GameState.player();
    const lw = me.lastFin || me.weekFin;
    const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
    const list = (o, names) => Object.keys(names).filter(k => o[k]).map(k => `<div class="row small"><span class="grow muted">${names[k]}</span><b>${fmtGold(o[k])}</b></div>`).join('') || '<div class="tiny dim">—</div>';
    const ref = Economy.refinanceOffer(me);
    const wc = Economy.weeklyCost(me);
    const total = tx('Toplam', 'Total');
    const hist = me.finHist.slice().reverse().map(h => `<tr><td>${seasonTxt(h.s)}</td><td class="n good">${fmtGold(sum(h.inc))}</td><td class="n bad">${fmtGold(sum(h.exp))}</td><td class="n">${fmtGold(h.end)}</td></tr>`).join('');
    return `<h2>${tx('Finans', 'Finance')}</h2><div class="grid g4 mb">
      <div class="card"><div class="tiny muted">${tx('Bütçe', 'Budget')}</div><div class="big gold b">${fmtGold(me.budget)}</div></div>
      <div class="card"><div class="tiny muted">${tx('Haftalık sabit gider', 'Weekly fixed costs')}</div><div class="big b">${fmtGold(wc)}</div><div class="tiny dim">${tx('Maaş', 'Wages')} ${fmtGold(Economy.wageBill(me))} · ${tx('Personel', 'Staff')} ${fmtGold(Economy.staffBill(me))} · ${tx('İşletme', 'Operations')} ${fmtGold(Economy.opsCost(me))}</div></div>
      <div class="card"><div class="tiny muted">${tx('Maaş borcu', 'Wage arrears')}</div><div class="big b ${me.arrears > 0 ? 'bad' : 'good'}">${fmtGold(me.arrears)}</div></div>
      <div class="card"><div class="tiny muted">${tx('Yeniden finansman', 'Refinancing')}</div>${me.loan ? `<div class="small">${tx(`Kalan ${me.loan.left} hafta`, `${me.loan.left} weeks left`)} × ${fmtGold(me.loan.wk)}</div>` : ref ? `<div class="small">${fmtGold(ref.amount)} → ${tx('20 hafta', '20 weeks')} × ${fmtGold(ref.wk)}</div><button class="btn xs primary mt" data-a="refinance">${tx('Kullan', 'Use')}</button>` : `<div class="tiny dim">${tx('Gerekli değil / bu sezon kullanıldı', 'Not needed / already used this season')}</div>`}</div></div>
      <div class="grid g3"><div class="card"><h3>${tx('Geçen Hafta Gelir', 'Last Week Income')}</h3>${list(lw.inc, FIN_INC)}<div class="sep"></div><div class="row small"><b class="grow">${total}</b><b class="good">${fmtGold(sum(lw.inc))}</b></div></div>
        <div class="card"><h3>${tx('Geçen Hafta Gider', 'Last Week Expenses')}</h3>${list(lw.exp, FIN_EXP)}<div class="sep"></div><div class="row small"><b class="grow">${total}</b><b class="bad">${fmtGold(sum(lw.exp))}</b></div></div>
        <div class="card"><h3>${tx('Bu Sezon', 'This Season')}</h3>${list(me.seasonFin.inc, FIN_INC)}<div class="sep"></div>${list(me.seasonFin.exp, FIN_EXP)}<div class="sep"></div><div class="row small"><b class="grow">Net</b><b>${fmtGold(sum(me.seasonFin.inc) - sum(me.seasonFin.exp))}</b></div></div></div>
      <div class="grid g2 mt"><div class="card"><h3>${tx('Haftalık Kasa Grafiği', 'Weekly Cash Chart')}</h3><canvas id="fincanvas" style="width:100%;height:9rem"></canvas></div>
        <div class="card"><h3>${tx('Maaş Yükü', 'Wage Bill')}</h3>${GameState.rosterGlads(me).map(g => `<div class="row small"><span class="grow">${esc(g.n)}</span><span class="dim">${g.con.yrs} ${tx('sz', 'yr')}</span><b>${fmtGold(g.con.wage)}/${wk()}</b></div>`).join('')}${STAFF_IDS.map(s => `<div class="row small"><span class="grow muted">${STAFF[s].name}</span><b>${fmtGold(me.staff[s].w)}/${wk()}</b></div>`).join('')}
        ${me.lastGate ? `<div class="sep"></div><div class="tiny muted">${tx('Son iç saha maçı', 'Last home match')}: ${fmtInt(me.lastGate.att)} / ${fmtInt(me.lastGate.cap)} ${tx('seyirci', 'spectators')} · ${fmtGold(me.lastGate.rev)}</div>` : ''}</div></div>
      <div class="card mt"><h3>${tx('Sezonluk Finans Geçmişi', 'Season Finance History')}</h3>${hist ? `<table class="t small"><tr><th>${tx('Sezon', 'Season')}</th><th class="n">${tx('Gelir', 'Income')}</th><th class="n">${tx('Gider', 'Expenses')}</th><th class="n">${tx('Sezon sonu kasa', 'Closing balance')}</th></tr>${hist}</table>` : `<div class="tiny dim">${tx('İlk sezon tamamlanınca burada görünecek.', 'Appears here once the first season is complete.')}</div>`}
      <div class="tiny muted mt">${tx('Bütçe tükenirse maaşlar borca yazılır, yeni harcamalar durur, moral ve itibar düşer. Borç büyürse gladyatörler sözleşmelerini feshedebilir. Sezonda bir kez kontrollü yeniden finansman kullanılabilir.', 'If the budget runs out, wages go into arrears, new spending stops, and morale and reputation fall. If arrears grow, gladiators may terminate their contracts. Controlled refinancing can be used once per season.')}</div></div>`;
  },
  after_finance() {
    const me = GameState.player();
    const cv = $('#fincanvas'); if (!cv) return;
    const W = cv.clientWidth, Hh = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = Hh * dpr;
    const x = cv.getContext('2d'); x.scale(dpr, dpr);
    const d = (me.weekHist || []).slice(-30);
    if (d.length < 2) { x.fillStyle = '#8a7660'; x.font = '12px sans-serif'; x.fillText(tx('Veri birkaç hafta sonra oluşacak.', 'Data appears after a few weeks.'), 8, 20); return; }
    const max = Math.max(...d.map(p => Math.max(p.inc, p.exp)), 1), bmax = Math.max(...d.map(p => p.b), 1);
    const bw = W / d.length;
    d.forEach((p, i) => {
      x.fillStyle = 'rgba(115,180,95,.75)'; x.fillRect(i * bw + 2, Hh - p.inc / max * Hh * 0.8, bw / 2 - 2, p.inc / max * Hh * 0.8);
      x.fillStyle = 'rgba(217,86,74,.75)'; x.fillRect(i * bw + bw / 2, Hh - p.exp / max * Hh * 0.8, bw / 2 - 2, p.exp / max * Hh * 0.8);
    });
    x.strokeStyle = '#e0b95c'; x.lineWidth = 2; x.beginPath();
    d.forEach((p, i) => { const y = Hh - p.b / bmax * Hh * 0.9; i ? x.lineTo(i * bw + bw / 2, y) : x.moveTo(i * bw + bw / 2, y); });
    x.stroke();
    x.fillStyle = '#b9a68a'; x.font = '10px sans-serif'; x.fillText(tx('Gelir (yeşil) · Gider (kırmızı) · Kasa (altın)', 'Income (green) · Expenses (red) · Balance (gold)'), 6, 12);
  },

  // ------------------------------------------------------------ history
  history(p) {
    const me = GameState.player();
    const tab = p.tab || UI.hTab || 'season';
    UI.hTab = tab;
    const tabs = `<div class="tabs">${[['season', tx('Sezonlar', 'Seasons')], ['champs', tx('Lig Şampiyonları', 'League Champions')], ['awards', tx('Ödüller', 'Awards')], ['retired', tx('Emekliler', 'Retired')], ['records', tx('Rekorlar', 'Records')], ['club', tx('Kulüp Başarıları', 'Club Honours')]].map(([k, n]) => `<span class="tab ${tab === k ? 'on' : ''}" data-a="histTab" data-t="${k}">${n}</span>`).join('')}</div>`;
    const seasons = S.hist.seasons;
    const clubName = (cid, fallback) => S.clubs[cid] ? S.clubs[cid].n : (fallback || '-');
    let body;
    if (tab === 'season') {
      body = seasons.length ? `<table class="t"><tr><th>${tx('Sezon', 'Season')}</th><th>${tx('Kulüp', 'Club')}</th><th>${tx('Lig', 'League')}</th><th class="n">${tx('Sıra', 'Pos')}</th><th class="n">${tx('G-M', 'W-L')}</th><th class="n">${tx('Puan', 'Pts')}</th><th>${tx('Kupa', 'Cup')}</th><th>${tx('İmp. Kupası', 'Imp. Cup')}</th></tr>${seasons.slice().reverse().map(h => h.player ? `<tr><td>${h.s}</td><td>${esc(clubName(h.player.c, h.player.n))}</td><td>${TIERS[h.player.tier].s} (${H.reg(h.player.reg)})</td><td class="n b">${h.player.rank}</td><td class="n">${h.player.w}-${h.player.l}</td><td class="n">${h.player.pts}</td><td>${esc(txt(h.player.cup))}</td><td>${h.player.imp ? esc(txt(h.player.imp)) : '-'}</td></tr>` : '').join('')}</table>` : `<div class="empty">${tx('İlk sezon tamamlandığında sezon özetleri burada listelenir.', 'Season summaries will be listed here once the first season is complete.')}</div>`;
      if (S.week >= SEASON_WEEKS) body = `<div class="card mb" style="border-color:var(--gold)">${tx('<b>Sezon sona erdi.</b> Üst menüdeki <b>Yeni Sezon</b> düğmesiyle bir sonraki sezona geçin.', '<b>The season is over.</b> Use the <b>New Season</b> button at the top to move to the next season.')}</div>` + body;
    } else if (tab === 'champs') {
      const reg = UI.hReg || me.reg;
      body = `<div class="tabs">${REGIONS.map(r => `<span class="tab ${reg === r.id ? 'on' : ''}" data-a="histReg" data-r="${r.id}">${r.name}</span>`).join('')}</div>` + (seasons.length ? `<table class="t small"><tr><th>${tx('Sezon', 'Season')}</th>${[1, 2, 3, 4, 5, 6].map(t => `<th>${TIERS[t].s}</th>`).join('')}<th>${tx('Bölge Kupası', 'Regional Cup')}</th></tr>${seasons.slice().reverse().map(h => `<tr><td>${h.s}</td>${[1, 2, 3, 4, 5, 6].map(t => { const l = h.leagues.find(x => x.id === GameState.leagueIndex(GameState.regIdx(reg), t)); return `<td class="${l && l.c === me.id ? 'gold b' : ''}">${l ? esc(clubName(l.c, l.cn)) : '-'}</td>`; }).join('')}<td>${(() => { const c = h.cups.find(c => c.k === 'r_' + reg); return c && c.c >= 0 ? esc(clubName(c.c, c.cn)) : '-'; })()}</td></tr>`).join('')}</table>` : `<div class="empty">${tx('Henüz şampiyon yok.', 'No champions yet.')}</div>`);
    } else if (tab === 'awards') {
      const reg = UI.hReg || me.reg;
      body = `<div class="tabs">${REGIONS.map(r => `<span class="tab ${reg === r.id ? 'on' : ''}" data-a="histReg" data-r="${r.id}">${r.name}</span>`).join('')}</div>` + (seasons.length ? seasons.slice().reverse().slice(0, 6).map(h => `<div class="card tight mb"><b>${seasonTxt(h.s)}</b><table class="t small"><tr><th>${tx('Lig', 'League')}</th><th>${AWARD_NAMES.mvp}</th><th>${AWARD_NAMES.ko}</th><th>${AWARD_NAMES.def}</th><th>${AWARD_NAMES.star}</th><th>${tx('Şampiyon', 'Champion')}</th></tr>${[1, 2, 3, 4, 5, 6].map(t => { const id = GameState.leagueIndex(GameState.regIdx(reg), t); const a = h.awards[id] || {}; const f = x => x ? `${esc(x.n)} <span class="tiny dim">${esc(H.club(x.cid))} · ${x.v}</span>` : '-'; return `<tr><td>${TIERS[t].s}</td><td>${f(a.mvp)}</td><td>${f(a.ko)}</td><td>${f(a.def)}</td><td>${f(a.star)}</td><td>${a.champ != null ? esc(H.club(a.champ)) : '-'}</td></tr>`; }).join('')}</table></div>`).join('') : `<div class="empty">${tx('Ödüller sezon sonunda gerçek istatistiklere göre verilir.', 'Awards are given at the end of each season based on real statistics.')}</div>`);
    } else if (tab === 'retired') {
      const mine = S.hist.retired.filter(r => r.mine), notable = S.hist.retired.filter(r => !r.mine).sort((a, b) => b.peak - a.peak).slice(0, 60);
      const row = r => `<tr><td>${r.s}</td><td>${esc(r.n)}</td><td>${CLASSES[r.cls].name}</td><td class="n">${r.age}</td><td>${esc(r.c >= 0 ? clubName(r.c, r.cn) : tx('Serbest', 'Free agent'))}</td><td class="n">${r.peak}</td><td class="n">${r.cs.m}</td><td class="n">${r.cs.w}</td><td class="n">${r.cs.ko}</td><td class="n">${r.aw}</td></tr>`;
      const th = `<tr><th>${tx('Sezon', 'Season')}</th><th>${tx('Ad', 'Name')}</th><th>${tx('Sınıf', 'Class')}</th><th class="n">${tx('Yaş', 'Age')}</th><th>${tx('Son kulüp', 'Last club')}</th><th class="n">${tx('Zirve', 'Peak')}</th><th class="n">${tx('Maç', 'Apps')}</th><th class="n">${tx('G', 'W')}</th><th class="n">${tx('Eleme', 'Elims')}</th><th class="n">${tx('Ödül', 'Awards')}</th></tr>`;
      const none = tx('Henüz yok.', 'None yet.');
      body = `<h3>${tx('Kulübümüzden Emekli Olanlar', 'Retired From Our Club')}</h3>${mine.length ? `<table class="t small">${th}${mine.slice().reverse().map(row).join('')}</table>` : `<div class="tiny dim mb">${none}</div>`}<h3 class="mt">${tx('Dünyanın Önemli Emeklileri', 'Notable Retirements')}</h3>${notable.length ? `<table class="t small">${th}${notable.map(row).join('')}</table>` : `<div class="tiny dim">${none}</div>`}<div class="tiny muted mt">${tx(`Toplam ${fmtInt(S.hist.retired.length)} emekli gladyatörün kariyer kaydı saklanıyor.`, `Career records of ${fmtInt(S.hist.retired.length)} retired gladiators are kept.`)}</div>`;
    } else if (tab === 'records') {
      const R0 = S.hist.records;
      body = `<div class="kv"><span>${tx('Bir sezonda en çok eleme', 'Most eliminations in a season')}</span><span>${R0.koSeason ? `${esc(R0.koSeason.n)} — ${R0.koSeason.v} (${seasonTxt(R0.koSeason.s)})` : '-'}</span><span>${tx('En yüksek genel güç', 'Highest overall')}</span><span>${R0.topOvr ? `${esc(R0.topOvr.n)} — ${R0.topOvr.v} (${seasonTxt(R0.topOvr.s)})` : '-'}</span><span>${tx('En pahalı transfer', 'Record transfer')}</span><span>${R0.bigTransfer ? `${esc(R0.bigTransfer.n)} — ${fmtGold(R0.bigTransfer.fee)} (${esc(H.club(R0.bigTransfer.f))} → ${esc(H.club(R0.bigTransfer.t))}, ${seasonTxt(R0.bigTransfer.s)})` : '-'}</span><span>${tx('Toplam transfer kaydı', 'Transfers on record')}</span><span>${fmtInt(S.transfers.length)}</span></div>`;
    } else {
      body = `<div class="kv"><span>${tx('Kupalar', 'Trophies')}</span><span>${me.trophies.length ? me.trophies.map(t => esc(seasonTxt(t.s) + ' — ' + txt(t.t))).join('<br>') : tx('Henüz kupa yok', 'No trophies yet')}</span><span>${tx('Lig geçmişi', 'League history')}</span><span>${me.hist.length ? me.hist.map(h => `${tx(h.s + '. sz', 'S' + h.s)}: ${TIERS[h.tier].s} ${h.rank}.`).join(' · ') : '-'}</span><span>${tx('Rekabetler', 'Rivalries')}</span><span>${Object.entries(me.riv).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${esc(H.club(+k))} (${v})`).join(', ') || '-'}</span></div>`;
    }
    return `<h2>${tx('Kariyer Tarihçesi', 'Career History')}</h2>${tabs}<div class="card">${body}</div>`;
  },

  // ------------------------------------------------------------ settings
  settings() {
    const mode = { idb: 'IndexedDB', ls: tx('yerel depolama', 'local storage'), mem: tx('yalnızca bu oturum — dışa aktarmayı kullanın', 'this session only — use export'), none: '-' }[SaveManager.mode];
    return `<h2>${tx('Ayarlar', 'Settings')}</h2><div class="grid g2"><div class="card"><h3>${tx('Oyun', 'Game')}</h3><div class="col">
      <div class="row"><span class="grow">${tx('Dil', 'Language')}</span><div class="seg"><button class="${I18N.lang === 'tr' ? 'on' : ''}" data-a="setLang" data-l="tr">Türkçe</button><button class="${I18N.lang === 'en' ? 'on' : ''}" data-a="setLang" data-l="en">English</button></div></div>
      <button class="btn" data-a="toggleSound">${Art.icon(S.settings.sound ? 'sound' : 'mute', 16)} ${tx('Ses', 'Sound')}: ${S.settings.sound ? tx('Açık', 'On') : tx('Kapalı', 'Off')}</button>
      <button class="btn" data-a="fullscreen">${Art.icon('full', 16)} ${tx('Tam Ekran', 'Fullscreen')}</button>
      <button class="btn" data-a="tutRestart">${Art.icon('info', 16)} ${tx('Başlangıç Rehberini Göster', 'Show the Tutorial')}</button>
      <button class="btn" data-a="go" data-s="hub">${Art.icon('play', 16)} ${tx('Oyuna Devam', 'Back to Game')}</button></div></div>
      <div class="card"><h3>${tx('Kayıt', 'Saving')}</h3><div class="small muted mb">${tx(`Oyun her hafta, maç, transfer, sözleşme, ekipman ve tesis işleminden sonra otomatik kaydedilir (${mode}).`, `The game saves automatically after every week, match, transfer, contract, equipment and facility action (${mode}).`)} ${tx('Son kayıt', 'Last save')}: ${SaveManager.lastSave ? new Date(SaveManager.lastSave).toLocaleTimeString(I18N.lang === 'en' ? 'en-GB' : 'tr-TR') : '-'}.</div><div class="col">
      <button class="btn" data-a="saveNow">${Art.icon('save', 16)} ${tx('Şimdi Kaydet', 'Save Now')}</button>
      <button class="btn" data-a="exportSave">${Art.icon('download', 16)} ${tx('Kaydı Dışa Aktar (JSON)', 'Export Save (JSON)')}</button>
      <button class="btn" data-a="importSave">${Art.icon('upload', 16)} ${tx('Kaydı İçe Aktar', 'Import Save')}</button>
      <button class="btn primary" data-a="settingsNew">${tx('Yeni Kariyer', 'New Career')}</button></div></div></div>
      <div class="card mt tiny muted">Arena Dominus ${GAME_VERSION} · ${tx('Kayıt sürümü', 'Save version')} ${SAVE_VERSION}. ${tx('Tüm görseller kod ile üretilir; oyun çevrimdışı çalışır.', 'All visuals are generated in code; the game works offline.')}</div>`;
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
    const close = `<button class="btn ghost" data-a="closeModal">${tx('Kapat', 'Close')}</button>`;
    const head = `<div class="row mb">${H.por(g, 3.4)}<div class="grow"><b>${esc(g.n)}</b><div class="tiny muted">${CLASSES[g.cls].name} · ${tx(g.age + ' yaş', 'age ' + g.age)} · ${tx('GG', 'OVR')} ${Math.round(g.ovr)} · Pot. ${H.pot(g)}</div><div class="tiny">${club ? `${esc(club.n)} (${TIERS[club.tier].s})` : tx('Serbest gladyatör', 'Free agent')} · ${tx('Değer', 'Value')} ${fmtGold(g.val)}</div></div><div class="col gap0" style="text-align:right"><span class="tiny muted">${tx('Bütçeniz', 'Your budget')}</span><b class="gold">${fmtGold(me.budget)}</b></div></div>`;
    const msg = n.msg ? `<div class="card tight mt small">${esc(txt(n.msg))}</div>` : '';
    let body = head, foot = '';
    if (n.blocked) { body += `<div class="card bad">${esc(txt(n.msg))}</div>`; foot = close; }
    else if (n.stage === 'fee') {
      const sugg = Math.round(g.val / 50) * 50;
      body += `<h3>${tx('1. Adım — Bonservis Teklifi', 'Step 1 — Transfer Fee')}</h3><p class="small muted">${tx(`${esc(club.n)} ile bonservis bedeli üzerinde anlaşın. Kulüp itibarınız, ligi, gladyatörün kadrodaki rolü ve kulübün ihtiyaçları kararı etkiler.`, `Agree a transfer fee with ${esc(club.n)}. Your reputation, their league, the gladiator's role in their squad and the club's needs all affect the decision.`)}</p>
        <div class="row wrap"><label class="col small">${tx('Bonservis bedeli', 'Transfer fee')}<input type="number" id="nfee" value="${n.counter || sugg}" min="0" step="50"></label>
        ${[0.8, 1, 1.2, 1.5].map(k => `<button class="btn xs" data-a="negoQuick" data-k="${k}" data-v="${g.val}">${tx('%' + Math.round(k * 100) + ' değer', Math.round(k * 100) + '% value')}</button>`).join('')}</div>${msg}`;
      foot = `${close}${n.counter ? `<button class="btn" data-a="negoAcceptCounter" data-g="${gid}">${tx('Karşı teklifi kabul et', 'Accept counter-offer')} (${fmtGold(n.counter)})</button>` : ''}<button class="btn gold" data-a="negoFee" data-g="${gid}">${tx('Teklif Yap', 'Make Offer')}</button>`;
    } else {
      const d = Transfer.demand(g, me, renew);
      const wage = n.lastDemand || (renew ? g.con.wage : Math.round(d.wage * 0.9 / 5) * 5);
      body += `<h3>${renew ? tx('Sözleşme Uzatma', 'Contract Extension') : (n.fee ? tx(`2. Adım — Sözleşme (bonservis ${fmtGold(n.fee)} kabul edildi)`, `Step 2 — Contract (fee of ${fmtGold(n.fee)} agreed)`) : tx('Sözleşme Görüşmesi', 'Contract Talks'))}</h3>
        <p class="small muted">${tx('Gladyatör maaşı, süreyi, imza parasını ve bonusları birlikte değerlendirir. Çok düşük teklifler sabrını tüketir.', 'The gladiator weighs wage, length, signing bonus and bonuses together. Very low offers wear out his patience.')}</p>
        <div class="grid g3 small"><label class="col">${tx('Haftalık maaş', 'Weekly wage')}<input type="number" id="nw" value="${wage}" min="1" step="5"></label>
        <label class="col">${tx('Süre (sezon)', 'Length (seasons)')}<select id="ny">${[1, 2, 3, 4].map(y => `<option value="${y}" ${y === d.yrs ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
        <label class="col">${tx('İmza parası', 'Signing bonus')}<input type="number" id="ns" value="${Math.round(d.sign * 0.8 / 10) * 10}" min="0" step="10"></label>
        <label class="col">${tx('Galibiyet bonusu', 'Win bonus')}<input type="number" id="nwb" value="${d.winB}" min="0" step="5"></label>
        <label class="col">${tx('Şampiyonluk bonusu', 'Title bonus')}<input type="number" id="ntb" value="${d.titleB}" min="0" step="10"></label>
        <div class="col"><span class="tiny muted">${tx('Sabır', 'Patience')}</span>${H.bar(n.pat, 4, n.pat <= 1 ? 'r' : 'g')}<span class="tiny dim">${tx('Mevcut maaş', 'Current wage')}: ${g.con ? fmtGold(g.con.wage) : '-'}</span></div></div>${msg}`;
      foot = `${close}<button class="btn gold" data-a="negoContract" data-g="${gid}">${tx('Sözleşme Öner', 'Offer Contract')}</button>`;
    }
    UI.updateModal(renew ? tx('Sözleşme Görüşmesi', 'Contract Talks') : tx('Transfer Görüşmesi', 'Transfer Talks'), body, foot, 'mid');
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
    } catch (e) { UI.toast(tx('Tam ekran bu tarayıcıda veya ortamda kullanılamıyor; oyun mevcut alanda devam ediyor.', 'Fullscreen is not available in this browser or environment; the game continues in the current area.')); }
  },
  // title / setup
  newCareer() {
    SaveManager.meta().then(m => {
      if (m && m.s) UI.confirm(tx('Yeni Kariyer', 'New Career'), tx('Yeni kariyer başlatıldığında mevcut kayıt, ilk kayıtla birlikte yedek kayda taşınır ve sonra üzerine yazılır. Gerekirse önce kaydı dışa aktarın.', 'Starting a new career moves your current save to the backup slot when the new one is first saved, and then overwrites it. Export your save first if needed.'), tx('Yeni kariyer başlat', 'Start new career'), () => Title.newCareer());
      else Title.newCareer();
    });
  },
  async continueCareer() {
    UI.busy(true, tx('Kariyer yükleniyor', 'Loading career'), '', 0.5);
    const r = await SaveManager.load();
    UI.busy(false);
    if (!r.ok) { UI.toast(tx('Kayıt yüklenemedi. Dosya bozuk olabilir.', 'The save could not be loaded. The file may be corrupt.')); return; }
    if (r.from === 'backup') UI.toast(tx('Ana kayıt okunamadı; yedek kayıt yüklendi.', 'The main save could not be read; the backup was loaded.'));
    Sfx.setOn(S.settings.sound !== false);
    UI.enterGame();
  },
  importSaveTitle() { Actions.importSave(); },
  titleBack() { Title.show(); },
  langScreen() { Title.langScreen(); },
  pickLang(d) { I18N.set(d.l); Title.show(); },
  setLang(d) { I18N.set(d.l); UI.render(); UI.toast(tx('Dil: Türkçe', 'Language: English')); },
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
    if (name.length < 3) { UI.toast(tx('Kulüp adı en az 3 karakter olmalı.', 'The club name must be at least 3 characters.')); return; }
    if (S.clubs.some(c => [c.n, c.nt, c.ne].some(x => x && x.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')))) { UI.toast(tx('Bu isimde bir kulüp zaten var.', 'A club with this name already exists.')); return; }
    if (st.crest.c1 === st.crest.c2) { UI.toast(tx('Arma için iki farklı renk seçin.', 'Choose two different colours for the crest.')); return; }
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
    if (ace.some(g => g.injury)) UI.toast(tx('Uyarı: As kadroda sakat gladyatör var; maçta yedekle değiştirilecek.', 'Warning: an injured gladiator is among the starters; a reserve will replace him in the match.'));
    UI.render(); UI.saveSoon();
  },
  autoLineup() { const me = GameState.player(); ClubAI.pickLineup(me); Squad.setArrangement(me, Squad.arrangement(me)); UI.render(); UI.saveSoon(); UI.toast(tx('Kadro hazır olma durumuna göre dizildi.', 'Squad arranged by readiness.')); },
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
      UI.toast(g.club === S.player ? tx(`${esc(g.n)} ile anlaşma sağlandı!`, `Deal agreed with ${esc(g.n)}!`) : tx('İşlem tamamlandı.', 'Done.'));
      await UI.saveNow(); UI.render(); return;
    }
    Nego.render(g.id); UI.saveSoon();
  },
  release(d) {
    const g = S.glads[+d.g], me = GameState.player();
    const cost = Transfer.releaseCost(g);
    UI.confirm(tx('Sözleşme Feshi', 'Release Gladiator'), tx(`${esc(g.n)} ile sözleşme feshedilecek. Kalan yükümlülükler için ${fmtGold(cost)} ödenecek ve gladyatör serbest kalacak. Emin misiniz?`, `${esc(g.n)}'s contract will be terminated. ${fmtGold(cost)} will be paid for the remaining obligations and he will become a free agent. Are you sure?`), tx('Feshet', 'Release'), async () => {
      const r = Transfer.release(me, g);
      if (!r.ok) { UI.toast(esc(r.msg)); return; }
      await UI.saveNow(); UI.go('squad');
    });
  },
  scoutReport(d) { const g = S.glads[+d.g]; const r = Scouting.report(g); UI.toast(r.ok ? tx('Keşif raporu hazırlandı; tahminler netleşti.', 'Scout report ready; the estimates are now more precise.') : esc(r.msg)); if (r.ok) { UI.render(); UI.saveSoon(); } },
  async offerResp(d) { const r = Transfer.respondOffer(+d.o, d.r); UI.toast(esc(r.msg || (r.ok ? tx('Tamam', 'OK') : tx('İşlem başarısız', 'Action failed')))); if (r.ok && d.r === 'accept') Sfx.play('coin'); await UI.saveNow(); UI.render(); },
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
  async facUp(d) { const r = Facilities.upgrade(GameState.player(), d.f); UI.toast(r.ok ? tx('Tesis yükseltildi!', 'Facility upgraded!') : esc(r.msg)); if (r.ok) { Sfx.play('coin'); await UI.saveNow(); } UI.render(); },
  async staffHire(d) { const r = Staff.hire(d.s, +d.i); UI.toast(r.ok ? tx('Personel işe alındı.', 'Staff member hired.') : esc(r.msg)); if (r.ok) await UI.saveNow(); UI.render(); },
  // equipment
  eqTab(d) { UI.go('equipment', { tab: d.t }); },
  eqGlad(d) { UI.go('equipment', { g: +d.g }); },
  eqSlot(d) { UI.eqSlot = d.s; UI.render(); },
  async eqBuy(d) {
    const me = GameState.player();
    const r = Equipment.buy(me, d.t, +d.q);
    if (!r.ok) { UI.toast(esc(r.msg)); return; }
    if (d.eq && UI.eqG != null) { const e = Equipment.equip(r.item.id, UI.eqG); if (!e.ok) UI.toast(esc(e.msg)); }
    Sfx.play('coin'); UI.toast(tx(`${esc(Equipment.name(r.item))} satın alındı.`, `Bought ${esc(Equipment.name(r.item))}.`)); await UI.saveNow(); UI.render();
  },
  async eqEquip(d) { const r = Equipment.equip(+d.i, UI.eqG); if (!r.ok) UI.toast(esc(r.msg)); await UI.saveNow(); UI.render(); },
  async eqUnequip(d) { Equipment.unequip(+d.i); await UI.saveNow(); UI.render(); },
  async eqUpgrade(d) { const r = Equipment.upgrade(GameState.player(), +d.i); UI.toast(r.ok ? tx('Demirci işini tamamladı!', 'The blacksmith has finished the job!') : esc(r.msg)); if (r.ok) { Sfx.play('coin'); await UI.saveNow(); } UI.render(); },
  eqSell(d) {
    const it = S.items[+d.i]; if (!it) return;
    UI.confirm(tx('Ekipman Sat', 'Sell Equipment'), tx(`${esc(Equipment.name(it))} ${fmtGold(Equipment.sellValue(it))} karşılığında satılsın mı?`, `Sell ${esc(Equipment.name(it))} for ${fmtGold(Equipment.sellValue(it))}?`), tx('Sat', 'Sell'), async () => { Equipment.sell(GameState.player(), +d.i); await UI.saveNow(); UI.render(); });
  },
  // sponsors & finance
  async sponsorAccept(d) { if (Sponsors.accept(+d.i)) { Sfx.play('coin'); UI.toast(tx('Hami anlaşması imzalandı.', 'Patron deal signed.')); await UI.saveNow(); } UI.render(); },
  refinance() {
    const me = GameState.player(); const o = Economy.refinanceOffer(me); if (!o) return;
    UI.confirm(tx('Yeniden Finansman', 'Refinancing'), tx(`Sarraflar Loncası ${fmtGold(o.amount)} sağlayacak. 20 hafta boyunca haftada ${fmtGold(o.wk)} (toplam ${fmtGold(o.total)}) geri ödenecek. Kulüp itibarı biraz düşer. Sezonda yalnızca bir kez kullanılabilir.`, `The Moneylenders' Guild will provide ${fmtGold(o.amount)}. It is repaid at ${fmtGold(o.wk)} per week for 20 weeks (${fmtGold(o.total)} in total). Club reputation drops slightly. Usable only once per season.`), tx('Kabul et', 'Accept'), async () => { Economy.refinance(me); await UI.saveNow(); UI.render(); });
  },
  // history
  histTab(d) { UI.go('history', { tab: d.t }); },
  histReg(d) { UI.hReg = d.r; UI.render(); },
  // settings / save
  async saveNow() { const ok = await UI.saveNow(); UI.toast(ok ? tx('Kaydedildi.', 'Saved.') : tx('Kayıt başarısız! Kaydı dışa aktarmayı deneyin.', 'Save failed! Try exporting the save.')); },
  exportSave() { try { const n = SaveManager.exportFile(); UI.toast(tx('Kayıt dosyası indirildi: ', 'Save file downloaded: ') + esc(n)); } catch (e) { UI.toast(tx('Dışa aktarma başarısız: ', 'Export failed: ') + esc(e.message)); } },
  importSave() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      if (f.size > 40 * 1024 * 1024) { UI.toast(tx('Dosya çok büyük.', 'The file is too large.')); return; }
      const rd = new FileReader();
      rd.onload = async () => {
        const r = await SaveManager.importText(String(rd.result));
        if (!r.ok) { UI.toast(tx('İçe aktarma başarısız: ', 'Import failed: ') + esc(r.msg)); return; }
        UI.closeAllModals(); Sfx.setOn(S.settings.sound !== false); UI.toast(tx('Kariyer içe aktarıldı.', 'Career imported.')); UI.enterGame();
      };
      rd.onerror = () => UI.toast(tx('Dosya okunamadı.', 'The file could not be read.'));
      rd.readAsText(f);
    };
    inp.click();
  },
  settingsNew() { UI.confirm(tx('Yeni Kariyer', 'New Career'), tx('Ana menüye dönülecek. Mevcut kariyeriniz kayıtlı kalır; yeni kariyer başlatırsanız onun üzerine yazılır.', 'You will return to the main menu. Your current career stays saved; starting a new career will overwrite it.'), tx('Ana menü', 'Main menu'), () => { Battle.close(); UI.closeAllModals(); Title.show(); }); },
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
