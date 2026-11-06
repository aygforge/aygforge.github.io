/* =====================================================================
   11_ui_v2.js : v2.0 arayüzü — mevcut UI.P / UI.A genişletilir, eski paneller korunur
   ===================================================================== */
const knownFish = id => !!(S.ency[id] && S.ency[id].caught);
const inTownLike = () => Game.sceneName === 'Town';
Object.assign(UI.P, {
  Menu() {
    const b = (p, ic, n) => `<button class="btn tile" data-a="openPanel" data-p="${p}">${img(ic, 3)}<span>${n}</span></button>`;
    const html = `<div class="tiles">${b('Inventory', 'bag', 'Envanter')}${b('Journal', 'journal', 'Balıkçı Defteri')}${b('Plan', 'plan', 'Sefer Planı')}${b('Trade', 'trade', 'Ticaret')}${b('Boatyard', 'fleet', 'Tekneler')}${b('Achievements', 'trophy', 'Başarımlar')}${b('Finance', 'finance', 'Mali Günlük')}${b('People', 'people', 'Kasabalılar')}${b('Settings', 'gear', 'Ayarlar')}</div>
      <h4>Diğer</h4><div class="btns left">${[['Encyclopedia', 'book', 'Ansiklopedi'], ['Statistics', 'chart', 'İstatistikler'], ['Orders', 'order', 'İlanlar'], ['Trophies', 'cup_1', 'Kupalar'], ['Records', 'records', 'Rekorlar'], ['Help', 'help', 'Yardım']].map(([p, i, n]) => `<button class="btn sm" data-a="openPanel" data-p="${p}">${img(i, 1, 'ic')} ${n}</button>`).join('')}<button class="btn sm" data-a="photoOpen">${img('camera', 1, 'ic')} Fotoğraf</button><button class="btn sm" data-a="saveQuit">${img('exit', 1, 'ic')} Kaydet ve Ana Menü</button></div>
      <p class="dim small">Kayıt otomatik yapılır. Son kayıt: devir #${S.revision}${S.migratedFrom ? ' · eski kayıt (şema ' + S.migratedFrom + ') güvenle aktarıldı' : ''}.</p>`;
    return { title: 'Menü', icon: 'menu', html, cls: 'wide' };
  },
  /* ---------------- Balıkçı Defteri ---------------- */
  Journal() {
    const tab = this.curTab('jr', 'guide'); let html = '';
    const det = this.sel.jrFish;
    if (det) return this.P.JournalCard.call(this, det);
    if (tab === 'guide') {
      html = REGIONS.map(r => `<h4>${esc(r.name)} <span class="dim">${r.fish_ids.filter(knownFish).length}/${r.fish_ids.length}</span></h4><div class="ency">${r.fish_ids.map(f => { const k = knownFish(f); return `<button class="ecard ${k ? '' : 'lock'}" data-a="jrFish" data-id="${f}">${fishImg(f, 1)}<span>${k ? esc(FISH[f].name_tr) : '???'}</span>${S.journal.fav[f] ? `<i>${img('star', 1, 'ic')}</i>` : ''}</button>`; }).join('')}</div>`).join('');
    }
    if (tab === 'today') {
      const rows = Journal.today(10); const wxl = REGIONS.filter(r => S.world.unlocked[r.id]).map(r => `${esc(r.name)} ${img(S.world.weather[r.id], 1, 'ic')}`).join(' · ');
      html = `<div class="evbox">${SEASON_TR[World.season()]} ${World.seasonDay()}/28 · Olta gücü ${rodOf().power} · Açık bölgeler: ${wxl}</div>` + (rows.length ? rows.map(x => { const f = FISH[x.fid], sp = SPOTS[x.spot]; return `<div class="row">${fishImgAlways(x.fid, 1, 'mini')}<div class="grow"><b>${esc(upTR(f.name_tr))}</b> <span class="badge ${x.p >= .2 ? 'new' : x.p >= .1 ? 'big' : 'rec'}">Av uygunluğu: ${Journal.level(x.p)}</span><div class="small">Bölge: <b>${esc(REGION[x.rid].name)}</b> · Nokta: <b>${esc(sp.name)}</b> · Yem: <b>${esc(BAIT[x.bait].name)}</b> · Mesafe: <b>${BAND_TR[x.band]}</b> · Hava: ${WEATHER_TR[S.world.weather[x.rid]]}${x.fac.season > 1 ? ' · mevsimi' : ''}${x.fac.weather > 1 ? ' · sevdiği hava' : ''}${x.fac.event > 1 ? ' · günün olayı' : ''}</div><div class="dim small">Balık vurduğunda bu türün seçilme olasılığı ≈ %${Math.round(x.p * 100)} (garanti değildir)</div></div><button class="btn sm" data-a="planQuick" data-id="${x.fid}">${img('plan', 1, 'ic')} Hedef</button></div>`; }).join('') : '<p class="dim">Henüz öneri için yeterli keşif yok. Önce birkaç tür yakala!</p>') + '<p class="dim small">Öneriler FishDB ağırlıkları, yem/hava/mevsim/mesafe/olay çarpanları ve olta gücü filtresiyle hesaplanır.</p>';
    }
    if (tab === 'log') {
      const ids = FISH_LIST.filter(f => knownFish(f.id)).map(f => f.id).sort((a, b) => S.ency[b].caught - S.ency[a].caught);
      html = ids.length ? ids.map(f => { const e = S.ency[f], L = S.journal.log[f]; return `<button class="row btnlike wfull" data-a="jrFish" data-id="${f}">${fishImgAlways(f, 1, 'mini')}<div class="grow"><b>${esc(FISH[f].name_tr)}</b> <span class="dim small">×${e.caught}</span><div class="small">İlk: ${L ? 'Gün ' + L.first : (e.firstDay ? 'Gün ' + e.firstDay : 'Bilinmiyor')} · Son: ${L ? 'Gün ' + L.last : 'Bilinmiyor'} · Rekor ${e.maxLen} cm / ${fmtKg(e.maxKg)} kg</div></div><span class="lv">${'★'.repeat(Journal.tier(f))}</span></button>`; }).join('') : '<p class="dim">Henüz av kaydın yok.</p>';
    }
    if (tab === 'missing') {
      html = REGIONS.map(r => { const ms = Mastery.status(r.id), m = S.mastery[r.id] || {}; const miss = r.fish_ids.filter(f => !knownFish(f)); return `<h4>${esc(r.name)} <span class="dim">Keşfedilen: ${ms.disc}/${ms.total}</span> ${img(m.b ? 'badge_b' : 'lock', 1, 'ic')}${img(m.s ? 'badge_s' : 'lock', 1, 'ic')}${img(m.g ? 'badge_g' : 'lock', 1, 'ic')}</h4><div class="small dim">Bronz: 3 noktayı ziyaret et (${ms.spots}/3) · Gümüş: 6 tür → poster · Altın: ${ms.total} tür → tekne süsü</div><div class="fishrow">${miss.length ? miss.map(f => `<span class="hint2" title="${esc(REGION[FISH[f].home_region].name)} · güç ${FISH[f].power}">${fishSilUrl ? `<img class="pix mini" src="${fishSilUrl(f, 1)}" alt="">` : ''}</span>`).join('') : '<span class="ok">Hepsi keşfedildi!</span>'}</div>`; }).join('') + `<p class="dim small">Toplam ustalık: ${Mastery.count()}/21 kademe.</p>`;
    }
    if (tab === 'fav') {
      const ids = Object.keys(S.journal.fav).filter(f => FISH[f]);
      html = (ids.length ? ids.map(f => `<div class="row">${fishImg(f, 1, 'mini')}<div class="grow"><b>${knownFish(f) ? esc(FISH[f].name_tr) : '???'}</b><div class="dim small">${esc(REGION[FISH[f].home_region].name)}</div></div><button class="btn sm" data-a="planQuick" data-id="${f}">Sefer Planına Ekle</button><button class="btn sm" data-a="jrFav" data-id="${f}">Kaldır</button></div>`).join('') : '<p class="dim">Defter favorin yok. Tür kartından yıldızla işaretleyebilirsin.</p>') + '<p class="dim small">Defter favorileri yalnızca av planı içindir; satış korumasıyla (envanterdeki ★) ilgisi yoktur.</p>';
    }
    return { title: 'Balıkçı Defteri', icon: 'journal', tabs: this.tabsHtml('jr', [['guide', 'Tür Rehberi'], ['today', 'Bugünkü Av'], ['log', 'Av Kayıtları'], ['missing', 'Eksik Türler'], ['fav', 'Favoriler']]), html, cls: 'wide' };
  },
  JournalCard(fid) {
    const f = FISH[fid], k = knownFish(fid), e = S.ency[fid], L = S.journal.log[fid], tier = Journal.tier(fid);
    let html = `<button class="btn sm" data-a="jrBack">← Defter</button><div class="row">${fishImg(fid, 2)}<div class="grow"><h3>${k ? esc(f.name_tr) : 'Bilinmeyen tür'}</h3><div class="small">${esc(REGION[f.home_region].name)} sularında · güç ${f.power}</div></div><button class="btn sm" data-a="jrFav" data-id="${fid}">${img(S.journal.fav[fid] ? 'star' : 'starOff', 1, 'ic')} Hedef favorisi</button><button class="btn g sm" data-a="planQuick" data-id="${fid}">Sefer Planına Ekle</button></div>`;
    if (!k) return { title: 'Balıkçı Defteri', icon: 'journal', html: html + '<p class="dim">Bu türü henüz yakalamadın; bilgiler ilk avda açılır.</p>', cls: 'wide' };
    const spots = Journal.spotsOf(fid).map(s => `${esc(s.name)} <span class="dim">(${esc(REGION[s.region_id].name)}, taban %${s.weights[fid]})</span>`).join(' · ');
    html += `<div class="grid3"><div class="kv"><span>Fiyat</span><b>${coin(f.base_price)}</b></div><div class="kv"><span>Güç</span><b>${powerStr(f.power)}</b></div><div class="kv"><span>Mücadele</span><b>${STYLE_TR[fightStyle(fid)]}</b></div><div class="kv"><span>Uygun yem</span><b>${f.favored_baits.map(b => esc(BAIT[b].name)).join(', ')}</b></div><div class="kv"><span>Mesafe</span><b>${BAND_TR[f.preferred_cast_band]}</b></div><div class="kv"><span>Hava / mevsim</span><b>${f.weather_boost ? WEATHER_TR[f.weather_boost] : '—'} / ${f.season_boost ? SEASON_TR[f.season_boost] : '—'}</b></div></div><p class="small">Av noktaları: ${spots}</p>`;
    if (tier >= 2) html += `<h4>Kişisel istatistikler (5+ av)</h4><div class="grid3"><div class="kv"><span>Toplam</span><b>${e.caught}</b></div><div class="kv"><span>İlk keşif</span><b>${L ? 'Gün ' + L.first : 'Gün ' + (e.firstDay || '?')}</b></div><div class="kv"><span>Son av</span><b>${L ? 'Gün ' + L.last : 'Bilinmiyor'}</b></div><div class="kv"><span>Manuel / oto</span><b>${L ? L.manual + ' / ' + L.auto : 'Bilinmiyor'}</b></div><div class="kv"><span>Boy rekoru</span><b>${e.maxLen} cm</b></div><div class="kv"><span>Ağırlık rekoru</span><b>${fmtKg(e.maxKg)} kg</b></div></div>${L && L.n < e.caught ? `<p class="dim small">${e.caught - L.n} av eski sürümden; ayrıntıları kayıtlı değil.</p>` : ''}`;
    else html += '<p class="dim small">5 avda kişisel istatistikler açılır.</p>';
    if (tier >= 3 && L) {
      const bs = Object.entries(L.baits).sort((a, b) => b[1] - a[1]), ss = Object.entries(L.spots).sort((a, b) => b[1] - a[1]);
      html += `<h4>Senin verinle karşılaştırma (12+ av)</h4><div class="grid2"><div>${bs.map(([b, n]) => `<div class="kv"><span>${esc(BAIT[b].name)}</span><b>${n} av · %${Math.round(n / L.n * 100)}</b></div>`).join('') || '<span class="dim">Yem kaydı yok</span>'}</div><div>${ss.map(([sp, n]) => `<div class="kv"><span>${esc(SPOTS[sp].name)}</span><b>${n} av · %${Math.round(n / L.n * 100)}</b></div>`).join('') || '<span class="dim">Nokta kaydı yok</span>'}</div></div><p class="dim small">Bu tablo yalnızca bilgi verir; av olasılıklarını değiştirmez.</p>`;
    } else if (tier >= 2) html += '<p class="dim small">12 avda yem/nokta karşılaştırması açılır.</p>';
    return { title: 'Balıkçı Defteri', icon: 'journal', html, cls: 'wide' };
  },
  /* ---------------- Sefer Planı ---------------- */
  Plan() {
    const G = S.plan.goals;
    let html = `<div class="evbox">${img('plan', 2)} En fazla 3 hedef. Hedefler yalnızca kişisel plandır; ödül veya ceza yoktur. Yalnızca hedefi koyduktan sonraki gerçek avlar (manuel ve otomatik) sayılır.</div>`;
    html += G.length ? G.map((g, i) => `<div class="row">${fishImg(g.fid, 1, 'mini')}<div class="grow"><b>${knownFish(g.fid) ? esc(FISH[g.fid].name_tr) : '???'}</b> <span class="${g.got >= g.target ? 'ok' : 'dim'}">${g.got}/${g.target}</span><div class="bar"><i style="width:${g.got / g.target * 100}%"></i><span>Gün ${g.since}'den beri</span></div></div><div class="step"><button data-a="planT" data-i="${i}" data-d="-1">−</button><b>${g.target}</b><button data-a="planT" data-i="${i}" data-d="1">+</button><button data-a="planT" data-i="${i}" data-d="10">+10</button></div><button class="btn sm r" data-a="planDel" data-i="${i}">Sil</button></div>`).join('') : '<p class="dim">Henüz hedef yok.</p>';
    html += `<label class="kv tg"><input type="checkbox" data-pkeep="1" ${S.plan.keep ? 'checked' : ''}><span>Yeni günde ilerlemeyi koru</span><small class="dim">Kapalıysa her sabah sayaçlar sıfırlanır</small></label>`;
    if (G.length < 3) { const ids = FISH_LIST.filter(f => knownFish(f.id)); html += `<h4>Hedef ekle</h4>${ids.length ? `<div class="optgrid">${ids.map(f => `<button class="opt" data-a="planQuick" data-id="${f.id}">${fishImgAlways(f.id, 1, 'mini')}<b>${esc(f.name_tr)}</b></button>`).join('')}</div>` : '<p class="dim">Keşfettiğin türler burada listelenir.</p>'}<p class="dim small">İlan panosundaki ilanlardan da “Hedefe ekle” ile miktar seçerek hedef oluşturabilirsin.</p>`; }
    return { title: 'Sefer Planı', icon: 'plan', html, cls: 'wide' };
  },
  /* ---------------- Ticaret: akıllı satış ---------------- */
  Trade() {
    const src = Market.sources(!!this.sel.trChest); const plans = SmartSell.plans(src, !!this.sel.trFav); const canSell = Game.sceneName === 'Town';
    let html = `<div class="srcs"><label><input type="checkbox" data-chk="trChest" ${this.sel.trChest ? 'checked' : ''}> Sandığı dahil et</label><label><input type="checkbox" data-chk="trFav" ${this.sel.trFav ? 'checked' : ''}> Favori (★) türleri de göster</label>${canSell ? `<span class="sp"></span><button class="btn sm" data-a="openPanel" data-p="FishMarket">Balık Hali</button><button class="btn sm" data-a="openPanel" data-p="Orders">İlanlar</button><button class="btn sm" data-a="openPanel" data-p="Teahouse">Çay Bahçesi</button>` : ''}</div>`;
    html += plans.length ? plans.map(p => `<div class="order"><div class="oh">${fishImgAlways(p.fid, 1, 'mini')}<b>${esc(FISH[p.fid].name_tr)}</b> <span class="dim">elinde ${p.have}</span><span class="sp"></span><b>${coin(p.total)}</b>${p.total > p.marketOnly ? ` <span class="ok small">+${fmt(p.total - p.marketOnly)} hale göre</span>` : ''}</div>
      <div class="small">${p.alloc.map(a => `${a.kind === 'order' ? img('order', 1, 'ic') : a.kind === 'tea' ? img('teahouse', 1, 'ic') : img('market', 1, 'ic')} ${esc(a.name)}: <b>${a.n}</b> × ${fmt(a.unit)}${a.limit !== Infinity ? ' <span class="dim">(kalan alım ' + a.limit + ')</span>' : ''}`).join('<br>')}</div>
      <div class="of"><span class="dim small">Öneri; onay vermeden satış yapılmaz.</span><span class="sp"></span>${canSell ? `<button class="btn g sm" data-a="smartSell" data-f="${p.fid}">Bu dağılımla sat</button>` : '<span class="dim small">Satış için kasabada ol</span>'}</div></div>`).join('') : '<p class="dim">Satılabilir balığın yok. (Akvaryumdaki balıklar satılabilir stok sayılmaz.)</p>';
    return { title: 'Ticaret · Akıllı Satış', icon: 'trade', html, cls: 'wide' };
  },
  /* ---------------- Mali Günlük ---------------- */
  Finance() {
    const n = this.sel.finN || 7; const rows = S.fin.slice(-n);
    const mx = Math.max(1, ...rows.map(r => Math.max(r.income, r.expense)));
    let html = `<div class="tabs small"><button class="${n === 7 ? 'on' : ''}" data-a="finN" data-n="7">Son 7 gün</button><button class="${n === 30 ? 'on' : ''}" data-a="finN" data-n="30">Son 30 gün</button></div>`;
    if (!rows.length) html += '<p class="dim">Mali günlük, bu sürümde tamamlanan ilk günden itibaren tutulur. Bir gün uyuduğunda ilk kayıt oluşur.</p>';
    else {
      html += `<div class="chart">${rows.map(r => `<div class="col" title="Gün ${r.day}"><i class="inc" style="height:${r.income / mx * 100}%"></i><i class="exp" style="height:${r.expense / mx * 100}%"></i><span>${r.day}</span></div>`).join('')}</div><div class="small"><span class="ok">▮ gelir</span> · <span class="bad">▮ gider</span></div>`;
      const T = k => sum(rows.map(r => r[k] || 0));
      html += `<div class="grid4"><div class="kv"><span>Gelir</span><b>${fmt(T('income'))}</b></div><div class="kv"><span>Gider</span><b>${fmt(T('expense'))}</b></div><div class="kv"><span>Net</span><b class="${T('net') >= 0 ? 'ok' : 'bad'}">${fmt(T('net'))}</b></div><div class="kv"><span>Av (M/O)</span><b>${T('manual')}/${T('auto')}</b></div></div>`;
      html += `<div class="tablewrap"><table class="qt"><tr><th>Gün</th><th>Manuel</th><th>Oto</th><th>Hal</th><th>İlan</th><th>Çay b.</th><th>Ödül</th><th>Yem</th><th>Yakıt</th><th>Ekipman</th><th>Diğer</th><th>Gelir</th><th>Gider</th><th>Net</th></tr>${rows.slice().reverse().map(r => `<tr><td>${r.day}</td><td>${r.manual}</td><td>${r.auto}</td><td>${fmt(r.market)}</td><td>${fmt(r.orders)}</td><td>${fmt(r.tea)}</td><td>${fmt(r.prize)}</td><td>${fmt(r.bait)}</td><td>${fmt(r.fuel)}</td><td>${fmt(r.gear)}</td><td>${fmt(r.other)}</td><td>${fmt(r.income)}</td><td>${fmt(r.expense)}</td><td class="${r.net >= 0 ? 'ok' : 'bad'}">${fmt(r.net)}${r.consistent === false ? ' *' : ''}</td></tr>`).join('')}</table></div><p class="dim small">* Kategorisiz para değişimi (ör. test paneli) içeren gün. Ömür boyu istatistikler İstatistikler panelinde korunur; çay bahçesi geliri bu sürümden itibaren ayrıca izlenir.</p>`;
    }
    return { title: 'Mali Günlük', icon: 'finance', html, cls: 'wide' };
  },
  /* ---------------- Kasabalılar ve rakipler ---------------- */
  People() {
    const shopOf = { zeynep: 'Olta Dükkânı', fatma: 'Fırın', nihat: 'Balık Hali', selin: 'Butik', bora: 'Tekne Atölyesi', kerem: 'Ev Eşyaları', halil: 'Çay Bahçesi', bahar: 'Lokanta · İlan Panosu', hasan: 'Şenlik Meydanı' };
    const town = ['zeynep', 'fatma', 'nihat', 'selin', 'bora', 'kerem', 'hasan', 'halil', 'bahar', 'efe', 'ali', 'mert', 'elif'];
    let html = `<h4>Kasabalılar</h4><div class="optgrid">${town.map(n => `<div class="opt"><img class="pix" style="width:48px" src="${portraitUrl(NPCS[n].look, 2)}" alt=""><b>${esc(NPCS[n].name)}</b><small>${esc(NPCS[n].role)}</small><small class="dim">Bugün: ${esc(V2.routines[n] ? Routine.where(n) : (shopOf[n] ? 'Dükkânında' : 'Kasabada'))}</small></div>`).join('')}</div><p class="dim small">Dükkânlar sahibi nerede olursa olsun her zaman açıktır.</p>`;
    html += '<h4>Rakip balıkçılar</h4>' + RIVALS.map(r => { const P = V2.rivalProfiles[r.id], C = S.rivals[r.id]; return `<div class="row"><img class="pix portrait" style="width:48px" src="${portraitUrl(NPCS[r.id].look, 2)}" alt=""><div class="grow"><b>${esc(r.name)}</b> <span class="dim small">· ${esc(P.title)} · Uzmanlık: ${esc(P.spec)}</span><div class="small">${esc(P.bio)}</div><div class="small">${C ? `Yarışma: <b>${C.comps}</b> · Şampiyonluk: <b>${C.wins}</b> · İlk üç: <b>${C.podiums}</b> · En iyi: <b>${C.best}.</b><br>Son: ${C.hist.slice(-4).reverse().map(h => esc(FEST[h.fest].name) + ' Y' + h.year + ': ' + h.place + '.').join(' · ')}` : '<span class="dim">Eski yarışma kaydı bulunmuyor</span>'}</div></div><span class="lv">${'★'.repeat(Math.round(r.skill * 5))}</span></div>`; }).join('');
    return { title: 'Kasabalılar', icon: 'people', html, cls: 'wide' };
  },
  /* ---------------- Kişisel Av Rekorları ---------------- */
  Records() {
    const top = Records.top();
    const html = `<div class="evbox">${img('records', 2)} En büyük 10 avın (ağırlığa göre). Evdeki Rekor Duvarı'nda 5 tanesini sergileyebilirsin (${S.recWall.length}/5).</div>` + (top.length ? top.map((r, i) => { const on = S.recWall.includes(r.id); return `<div class="row">${fishImgAlways(r.fid, 1, 'mini')}<div class="grow"><b>${i + 1}. ${esc(FISH[r.fid].name_tr)}</b> <span class="small">${r.cm != null ? r.cm + ' cm · ' : ''}${fmtKg(r.kg)} kg</span><div class="small dim">${r.legacy ? 'Eski kayıt: ansiklopedideki ağırlık rekoru (boy rekoru ayrı tutulduğundan birleştirilmedi) · gün, nokta, olta: Bilinmiyor' : `${esc(r.rid ? REGION[r.rid].name : 'Bilinmiyor')} · ${esc(r.spot ? SPOTS[r.spot].name : 'Bilinmiyor')} · Gün ${r.day} · ${r.auto ? 'Otomatik (' + esc(r.dev ? AUTO[r.dev].name : 'cihaz') + ')' : 'Manuel · ' + esc((RODS.find(x => x.id === r.rod) || { name: 'Bilinmiyor' }).name)}`}</div></div><button class="btn sm ${on ? 'r' : ''}" data-a="recWall" data-id="${r.id}">${on ? 'Duvardan indir' : 'Duvara as'}</button></div>`; }).join('') : '<p class="dim">Henüz rekor kaydı yok.</p>') + '<p class="dim small">Balık satılsa da rekor kaydı silinmez.</p>';
    return { title: 'Kişisel Av Rekorları', icon: 'records', html, cls: 'wide' };
  },
  /* ---------------- Akvaryum ---------------- */
  Aquarium(a) {
    const tid = a.tank, M = AQM[tid], T = Aq.tank(tid); if (!T) return { title: 'Akvaryum', html: '<p>Bu akvaryuma sahip değilsin.</p>' };
    const others = V2.aqModels.filter(m => m.id !== tid && Aq.owns(m.id));
    const dst = this.sel.aqDst || 'bag'; const src = this.sel.aqSrc || 'bag';
    const keyName = k => k === 'bag' ? 'Çanta' : k === 'chest' ? 'Sandık' : 'Tekne deposu';
    let html = `<div class="aqwrap"><canvas id="aqc" width="320" height="170" class="pix"></canvas><div class="grow"><b>${esc(M.name)}</b><div class="small">${Aq.total(tid)}/${M.cap} balık · ${Aq.speciesN(tid)}/${M.species} tür</div>
      <div class="small">Dekor: ${V2.aqDecor.filter(d => S.aq.decor.includes(d.id)).map(d => `<button class="btn sm ${T.decor === d.id ? 'on' : ''}" data-a="aqDecorSet" data-id="${d.id}">${esc(d.name)}</button>`).join(' ')}</div>
      <div class="small">Arka plan: <button class="btn sm ${T.bg === 'plain' ? 'on' : ''}" data-a="aqBg" data-v="plain">Açık mavi</button> ${S.ach.aq10 ? `<button class="btn sm ${T.bg === 'ocean' ? 'on' : ''}" data-a="aqBg" data-v="ocean">Okyanus (ödül)</button>` : '<span class="dim">Okyanus arka planı: 10 tür sergile</span>'}</div></div></div>`;
    html += `<h4>Akvaryumdakiler</h4><div class="srcs"><span class="small">Çıkarılan balık:</span>${Aq.sources().map(k => `<button class="btn sm ${dst === k ? 'on' : ''}" data-a="aqDst" data-k="${k}">${keyName(k)}</button>`).join('')}</div>`;
    html += Object.keys(T.fish).length ? Object.entries(T.fish).map(([f, q]) => `<div class="row">${fishImgAlways(f, 1, 'mini')}<div class="grow"><b>${esc(FISH[f].name_tr)}</b> ×${q}</div><button class="btn sm" data-a="aqTake" data-f="${f}" data-n="1">1 çıkar</button><button class="btn sm" data-a="aqTake" data-f="${f}" data-n="${q}">Hepsini çıkar</button>${others.map(o => `<button class="btn sm" data-a="aqMove" data-f="${f}" data-to="${o.id}">→ ${esc(o.name)}</button>`).join('')}</div>`).join('') : '<p class="dim">Akvaryum boş.</p>';
    const sp = Inv.species([src]); const elig = Object.keys(sp).filter(f => AQ_OK.has(f));
    html += `<h4>Balık ekle</h4><div class="srcs"><span class="small">Kaynak:</span>${Aq.sources().map(k => `<button class="btn sm ${src === k ? 'on' : ''}" data-a="aqSrc" data-k="${k}">${keyName(k)} (${Inv.total(k)})</button>`).join('')}</div>`;
    html += elig.length ? elig.map(f => `<div class="row">${fishImgAlways(f, 1, 'mini')}<div class="grow"><b>${esc(FISH[f].name_tr)}</b> <span class="dim">elinde ${sp[f]} · boş yer ${Aq.room(tid, f)}</span></div><button class="btn g sm" data-a="aqPut" data-f="${f}" data-n="1" ${Aq.room(tid, f) ? '' : 'disabled'}>1 ekle</button><button class="btn g sm" data-a="aqPut" data-f="${f}" data-n="${Math.min(sp[f], Aq.room(tid, f))}" ${Aq.room(tid, f) ? '' : 'disabled'}>Sığdığı kadar</button></div>`).join('') : '<p class="dim">Bu kaynakta akvaryuma uygun balık yok.</p>';
    const seen = Object.keys(S.aq.seen).length;
    html += `<h4>Koleksiyon ${seen}/${V2.aqFish.length}</h4><div class="fishrow">${V2.aqFish.map(f => `<span title="${esc(knownFish(f) ? FISH[f].name_tr : '???')}" class="${S.aq.seen[f] ? '' : 'dimimg'}">${fishImg(f, 1, 'mini')}</span>`).join('')}</div><div class="small">${img(S.ach.aq5 ? 'badge_b' : 'lock', 1, 'ic')} 5 tür: Koleksiyon Rozeti · ${img(S.ach.aq10 ? 'badge_s' : 'lock', 1, 'ic')} 10 tür: Okyanus arka planı · ${img(S.ach.aq20 ? 'title' : 'lock', 1, 'ic')} 20 tür: “Deniz Koleksiyoncusu” unvanı</div><p class="dim small">Akvaryumdaki balıklar satılabilir stok sayılmaz. Bakım, besleme veya masraf yoktur.</p>`;
    return { title: M.name, icon: 'aquarium', html, cls: 'wide' };
  }
});
/* ---- mevcut panellerin genişletilmesi ---- */
{
  const P0 = Object.assign({}, UI.P);
  UI.P.HomeGoods = function () {
    const tab = this.curTab('hg', 'decor');
    if (tab === 'decor') { const r = P0.HomeGoods.call(this); r.tabs = this.tabsHtml('hg', [['decor', 'Dekor & Sandık'], ['aq', 'Akvaryumlar']]); return r; }
    let html = V2.aqModels.map(m => `<div class="row">${img('aquarium', 3)}<div class="grow"><b>${esc(m.name)}</b><div class="dim small">${esc(m.desc)} · ${m.cap} balık · en fazla ${m.species} tür</div></div>${Aq.owns(m.id) ? '<span class="ok">Sahipsin · evde</span>' : `<button class="btn g sm" data-a="aqBuy" data-id="${m.id}" ${S.cash < m.price ? 'disabled' : ''}>${coin(m.price)}</button>`}</div>`).join('');
    html += `<h4>Akvaryum dekorları</h4>` + V2.aqDecor.map(d => `<div class="row"><div class="grow"><b>${esc(d.name)}</b> <span class="dim small">yalnızca görsel</span></div>${S.aq.decor.includes(d.id) ? '<span class="ok">Sahipsin</span>' : `<button class="btn g sm" data-a="aqDecorBuy" data-id="${d.id}" ${S.cash < d.price ? 'disabled' : ''}>${coin(d.price)}</button>`}</div>`).join('');
    html += `<h4>Uygun türler (${V2.aqFish.length})</h4><div class="fishrow">${V2.aqFish.map(f => fishImg(f, 1, 'mini')).join('')}</div><p class="dim small">Her modelden bir tane alınabilir; üçüyle toplam 22 balık sergilenir. Akvaryumlar dekor yuvalarını kullanmaz.</p>`;
    return { title: 'Kerem\'in Ev Eşyaları', icon: 'homegoods', npc: 'kerem', tabs: this.tabsHtml('hg', [['decor', 'Dekor & Sandık'], ['aq', 'Akvaryumlar']]), html, cls: 'wide' };
  };
  UI.P.Square = function () {
    const r = P0.Square.call(this);
    const hist = S.compHist.slice().reverse(); const legacy = Object.entries(S.fest).filter(([k, v]) => v.place && !S.compHist.some(h => h.fest + ':' + h.year === k));
    r.html += `<h4>Önceki yarışmalar</h4>${hist.length ? hist.slice(0, 8).map(h => `<div class="row">${img(h.place <= 3 ? 'cup_' + h.place : 'festival', 2)}<div class="grow"><b>${esc(FEST[h.fest].name)}</b> <span class="dim">Yıl ${h.year}</span><div class="small">${h.standings.slice(0, 3).map((x, i) => (i + 1) + '. ' + esc(x.name)).join(' · ')}</div></div><b>${h.place}.</b></div>`).join('') : ''}${legacy.map(([k, v]) => `<div class="row">${img(v.place <= 3 ? 'cup_' + v.place : 'festival', 2)}<div class="grow"><b>${esc(FEST[k.split(':')[0]].name)}</b> <span class="dim">Yıl ${k.split(':')[1]}</span><div class="small dim">Eski yarışma kaydı: yalnızca senin sıran biliniyor</div></div><b>${v.place}.</b></div>`).join('')}${!hist.length && !legacy.length ? '<p class="dim">Henüz yarışma geçmişi yok.</p>' : ''}<div class="btns left"><button class="btn sm" data-a="openPanel" data-p="People">${img('people', 1, 'ic')} Rakip profilleri</button></div>`;
    return r;
  };
  UI.P.Orders = function (a) {
    const r = P0.Orders.call(this, a);
    const extra = this.curTab('ord', 'board') !== 'board' ? '' : Orders.active().filter(o => Orders.remaining(o) > 0).map(o => `<button class="btn sm" data-a="planFromOrder" data-id="${o.id}">${img('plan', 1, 'ic')} ${esc(FISH[o.fishId].name_tr)} hedefi</button>`).join('');
    if (extra) r.html += `<h4>İlanlardan sefer hedefi</h4><div class="btns left">${extra}</div><p class="dim small">Miktarı sen seçersin; ilandaki toplam adet zorunlu hedef olmaz.</p>`;
    return r;
  };
  UI.P.Boatyard = function () {
    const r = P0.Boatyard.call(this);
    if (!inTownLike()) r.html = `<div class="warnbox">Burada yalnızca görüntüleme yapılır; satın alma, aktif tekne ve donanım değişiklikleri için Bora'nın atölyesine (kasaba) git.</div>` + r.html;
    if (this.curTab('yard', 'boats') === 'look' && S.boats.owned.length) {
      const selB = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : (S.boats.active || S.boats.owned[0]); const b = S.boats.byId[selB]; const orn = S.cosmetics.ornaments || [];
      r.html += `<h4>Tekne süsü (Altın bölge ustalığı)</h4><div class="optgrid"><button class="opt ${!b.ornament ? 'on' : ''}" data-a="ornSet" data-id="">Süs yok</button>${REGIONS.map(rg => { const id = 'orn_' + rg.id, own = orn.includes(id); return `<button class="opt ${b.ornament === id ? 'on' : ''} ${own ? '' : 'lock'}" data-a="${own ? 'ornSet' : 'noop'}" data-id="${id}">${img(id, 2)}<b>${esc(V2.ornaments[rg.id])}</b><small>${own ? (b.ornament === id ? 'Takılı' : 'Tak') : esc(rg.name) + ' altın ustalık'}</small></button>`; }).join('')}</div>`;
    }
    return r;
  };
  UI.P.Statistics = function () {
    const r = P0.Statistics.call(this); const s = S.stats;
    r.html = r.html.replace('<div class="btns left">', `<h4>v2</h4><div class="grid3"><div class="kv"><span>Çay bahçesi satışı</span><b>${fmt(s.teaSales || 0)}</b></div><div class="kv"><span>Festival ödülleri</span><b>${fmt(s.prizes || 0)}</b></div><div class="kv"><span>Bölge ustalığı</span><b>${Mastery.count()}/21</b></div><div class="kv"><span>Akvaryum koleksiyonu</span><b>${Object.keys(S.aq.seen).length}/${V2.aqFish.length}</b></div><div class="kv"><span>Mükemmel tasma</span><b>${s.perfectHooks || 0}</b></div><div class="kv"><span>Unvan</span><b>${S.ach.aq20 ? 'Deniz Koleksiyoncusu' : '—'}</b></div></div><div class="btns left"><button class="btn" data-a="openPanel" data-p="Finance">${img('finance', 1, 'ic')} Mali Günlük</button><button class="btn" data-a="openPanel" data-p="Records">${img('records', 1, 'ic')} Rekorlar</button>`);
    return r;
  };
}
/* ---- yeni eylemler ---- */
const townOnly = ['buyBoat', 'setActive', 'buyUp', 'buyAuto', 'mount', 'unmount', 'boatColor', 'buyColor', 'boatName', 'ornSet'];
Object.assign(UI.A, {
  jrFish(d) { this.sel.jrFish = d.id; this.renderPanel(); },
  jrBack() { this.sel.jrFish = null; this.renderPanel(); },
  jrFav(d) { Journal.toggleFav(d.id); this.renderPanel(true); },
  planQuick(d) {
    const g = S.plan.goals.find(x => x.fid === d.id); this._planQ = g ? g.target : 5; this._planF = d.id;
    this.showPlanQty(d.id, null);
  },
  planFromOrder(d) { const o = S.orders.find(x => x.id === d.id); if (!o) return; this._planQ = Math.min(10, Math.max(1, Orders.remaining(o))); this._planF = o.fishId; this.showPlanQty(o.fishId, o); },
  planQ(d) { this._planQ = clamp(this._planQ + (+d.d), 1, 99); this.showPlanQty(this._planF, null); },
  planOk() { const r = Plan.add(this._planF, this._planQ); this.closeModal(); if (r.ok) this.toastNow('Sefer hedefi: ' + FISH[this._planF].name_tr + ' ×' + this._planQ, 'good', 'plan'); else this.toastNow(r.msg, 'warn'); this.refresh(); },
  planT(d) { const g = S.plan.goals[+d.i]; if (g) Plan.setTarget(+d.i, g.target + (+d.d)); },
  planDel(d) { Plan.remove(+d.i); },
  smartSell(d) {
    const src = Market.sources(!!this.sel.trChest); const p = SmartSell.planFor(d.f, Inv.count(src, d.f));
    this.confirm({ title: 'Önerilen dağılımla sat', icon: 'trade', html: `<p><b>${esc(FISH[d.f].name_tr)}</b> × ${p.have}</p><div class="small">${p.alloc.map(a => esc(a.name) + ': ' + a.n + ' × ' + fmt(a.unit)).join('<br>')}</div><div class="price">${img('coin', 2)}<b>+${fmt(p.total)}</b></div>`, ok: 'Onayla ve sat', onOk: () => { const r = SmartSell.execute(d.f, src); if (r.ok) this.toastNow(r.n + ' balık satıldı: +' + fmt(r.income), 'good', 'coin'); else this.toastNow(r.msg, 'warn'); } });
  },
  finN(d) { this.sel.finN = +d.n; this.renderPanel(true); },
  recWall(d) { const r = Records.toggleWall(+d.id); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); this.renderPanel(true); },
  aqBuy(d) { const M = AQM[d.id]; this.buy(M.name, 'aquarium', M.price, M.desc + '. Evindeki akvaryum köşesine yerleşir.', () => Aq.buyModel(d.id)); },
  aqDecorBuy(d) { const D = V2.aqDecor.find(x => x.id === d.id); this.buy(D.name, 'aquarium', D.price, 'Akvaryum dekoru (yalnızca görsel).', () => Aq.buyDecor(d.id)); },
  aqDecorSet(d) { Aq.setDecor(this.args.tank, d.id); this.renderPanel(true); },
  aqBg(d) { Aq.setBg(this.args.tank, d.v); this.renderPanel(true); },
  aqSrc(d) { this.sel.aqSrc = d.k; this.renderPanel(true); },
  aqDst(d) { this.sel.aqDst = d.k; this.renderPanel(true); },
  aqPut(d) { const r = Aq.put(this.args.tank, d.f, +d.n, this.sel.aqSrc || 'bag'); if (!r.ok) this.toastNow(r.msg, 'warn'); },
  aqTake(d) { const r = Aq.take(this.args.tank, d.f, +d.n, this.sel.aqDst || 'bag'); if (!r.ok) this.toastNow(r.msg, 'warn'); },
  aqMove(d) { const r = Aq.move(this.args.tank, d.to, d.f, 1); if (!r.ok) this.toastNow(r.msg, 'warn'); },
  ornSet(d) { const selB = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : S.boats.active; Mastery.setOrnament(selB, d.id || null); },
  gsSave(d) { GearSets.save(+d.i); this.toastNow('Set kaydedildi: ' + S.gearSets[+d.i].name, 'good', 'gearset'); },
  gsApply(d) { const r = GearSets.apply(+d.i); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(S.gearSets[+d.i].name + ' kuşanıldı' + (r.notes.length ? ' · ' + r.notes.join(', ') : ''), r.notes.length ? 'warn' : 'good', 'gearset'); if (this.modal) this.closeModal(); this.refresh(); },
  gsRename(d) { const el = $('gsn' + d.i); if (el) GearSets.rename(+d.i, el.value); this.toastNow('Set adı güncellendi.', 'good'); this.renderPanel(true); },
  polMode(d) { const r = Auto.setPolicy(d.d, { mode: d.m }); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); },
  photoOpen() { Photo.open(); }
});
for (const k of townOnly) { const f = UI.A[k]; if (!f) continue; UI.A[k] = function (d, el) { if (!inTownLike()) { this.toastNow('Bu işlem için kasabadaki Tekne Atölyesi\'ne git.', 'warn', 'yard'); return; } return f.call(this, d, el); }; }
Object.assign(UI, {
  showPlanQty(fid, o) {
    const full = S.plan.goals.length >= 3 && !S.plan.goals.find(g => g.fid === fid);
    this.showModal(`<h3>${img('plan', 2)} Sefer hedefi</h3><div class="row">${fishImg(fid, 2)}<div class="grow"><b>${knownFish(fid) || o ? esc(FISH[fid].name_tr) : '???'}</b>${o ? `<div class="small dim">İlan: ${esc(CUST[o.customerId].name)} · kalan ${Orders.remaining(o)}</div>` : ''}</div></div>${full ? '<p class="warn">Zaten 3 hedefin var; önce birini sil.</p>' : ''}<div class="step big"><button data-a="planQ" data-d="-10">−10</button><button data-a="planQ" data-d="-1">−</button><b>${this._planQ}</b><button data-a="planQ" data-d="1">+</button><button data-a="planQ" data-d="10">+10</button></div><div class="btns"><button class="btn" data-a="mCancel">Vazgeç</button><button class="btn g" data-a="planOk" ${full ? 'disabled' : ''}>Hedefe ekle</button></div>`);
  },
  gearSetsHtml() {
    const editable = !(Fishing.ctx && !['READY', 'OUTCOME'].includes(Fishing.phase));
    return `<h4>Kayıtlı olta setleri</h4>${S.gearSets.map((g, i) => `<div class="row">${img('gearset', 2)}<div class="grow"><input id="gsn${i}" maxlength="16" value="${esc(g.name)}" class="small"><div class="dim small">${g.rod ? ['rod', 'line', 'reel', 'hook'].map(k => { const it = GEAR[k].find(x => x.id === g[k]); return esc(it ? it.name : '?'); }).join(' · ') + ' · ' + esc(BAIT[g.bait || 'basic'].name) : 'Boş set'}</div></div><button class="btn sm" data-a="gsRename" data-i="${i}">Ad</button><button class="btn sm" data-a="gsSave" data-i="${i}">Mevcudu kaydet</button><button class="btn g sm" data-a="gsApply" data-i="${i}" ${g.rod && editable ? '' : 'disabled'}>Kuşan</button></div>`).join('')}<p class="dim small">Setler yalnızca manuel olta ekipmanı içindir. Sahip olmadığın ekipman kuşanılamaz; stokta olmayan ücretli yem yerine temel yem seçilir.</p>`;
  },
  planTracker() {
    const el = $('plantrack'); if (!el) return; const show = S && S.plan && S.plan.goals.length && ['PierFishing', 'BoatFishing'].includes(Game.sceneName) && !Game.photo;
    const html = show ? `<b>SEFER HEDEFLERİ</b>${S.plan.goals.map(g => `<div class="${g.got >= g.target ? 'ok' : ''}">${esc(knownFish(g.fid) ? FISH[g.fid].name_tr : '???')} ${g.got}/${g.target}</div>`).join('')}` : '';
    if (el._h !== html) { el._h = html; el.innerHTML = html; el.style.display = show ? '' : 'none'; }
  }
});
/* olta seti + yem: envanter ekipman sekmesi ve yem seçici */
{
  const inv0 = UI.P.Inventory;
  UI.P.Inventory = function (a) { const r = inv0.call(this, a); if (this.curTab('inv', 'fish') === 'gear') r.html += this.gearSetsHtml(); return r; };
  const bp0 = UI.A.baitPick;
  UI.A.baitPick = function (d) { bp0.call(this, d); if (!this.modal) return; const dl = this.modalEl.querySelector('.dlg'); if (dl) dl.insertAdjacentHTML('beforeend', this.gearSetsHtml()); };
}
/* otomatik olta cihazı başına yem politikası (Tekne Atölyesi donanım bölümü) */
{
  const lo0 = UI.loadoutHtml.bind(UI);
  UI.loadoutHtml = function () {
    let h = lo0(); if (!Object.keys(S.auto.devices).length) return h;
    h += '<h4>Cihaz başına yem politikası</h4>';
    for (const d of Auto.DEV) {
      const dv = S.auto.devices[d]; if (!dv) continue; const p = Auto.policy(d);
      const bsel = (k) => `<select data-pol="${d}" data-pk="${k}">${['<option value="">—</option>'].concat(PAID_BAITS.map(b => `<option value="${b}" ${p[k] === b ? 'selected' : ''}>${esc(BAIT[b].name)} (${S.baitStock[b]})</option>`)).join('')}</select>`;
      const fsel = `<select data-pol="${d}" data-pk="target"><option value="">—</option>${FISH_LIST.filter(f => knownFish(f.id) && f.power <= 4).map(f => `<option value="${f.id}" ${p.target === f.id ? 'selected' : ''}>${esc(f.name_tr)}</option>`).join('')}</select>`;
      h += `<div class="row">${img(d, 2)}<div class="grow"><b>${esc(AUTO[d].name)}</b> <span class="dim small">bugüne kadar ${dv.baitUsed || 0} yem</span><div class="opts">${Object.entries(POLICY_TR).map(([m, n]) => `<button class="${p.mode === m ? 'on' : ''}" data-a="polMode" data-d="${d}" data-m="${m}">${n}</button>`).join('')}</div>
        <div class="small">${p.mode === 'fixed' ? 'Yem: ' + bsel('bait') + ' (yoksa cihaz durur)' : p.mode === 'backup' ? 'Ana: ' + bsel('bait') + ' Yedek: ' + bsel('backup') : p.mode === 'target' ? 'Hedef tür: ' + fsel + ' (uygun yem önceliklenir)' : 'Stoktaki en ucuz ücretli yem kullanılır.'}</div></div></div>`;
    }
    return h + '<p class="dim small">Temel yem otomatikte kullanılamaz; her denemede 1 ücretli yem harcanır, yem yoksa cihaz bekler.</p>';
  };
  const oi0 = UI.onInput.bind(UI);
  UI.onInput = function (e) {
    const t = e.target;
    if (t.dataset.pol) { const r = Auto.setPolicy(t.dataset.pol, { [t.dataset.pk]: t.value || null }); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); return; }
    if (t.dataset.pkeep) { Plan.setKeep(t.checked); return; }
    return oi0(e);
  };
}
/* HUD: fotoğraf düğmesi + sefer takibi */
{
  const hud0 = UI.hud.bind(UI);
  UI.hud = function () { hud0(); if (!this.hudEl || this.hudEl.style.display === 'none') return; const fs = this.hudEl.querySelector('[data-a=fullscreen]'); if (fs && ['Town', 'PierFishing', 'BoatFishing', 'Home'].includes(Game.sceneName)) fs.insertAdjacentHTML('beforebegin', `<button class="hb" data-a="photoOpen" title="Fotoğraf modu">${img('camera', 2)}</button>`); this.planTracker(); };
  const ref0 = UI.refresh.bind(UI);
  UI.refresh = function () { ref0(); this.planTracker(); };
}

/* ---------------- Fotoğraf modu ---------------- */
const Photo = {
  open() {
    if (!['Town', 'PierFishing', 'BoatFishing', 'Home'].includes(Game.sceneName)) { UI.toastNow('Fotoğraf modu kasaba, iskele, ev ve deniz sahnelerinde kullanılabilir.', 'warn', 'camera'); return; }
    if (Fishing.ctx && !['READY', 'OUTCOME'].includes(Fishing.phase)) { UI.toastNow('Balık mücadelesi sürerken fotoğraf modu açılamaz.', 'warn', 'camera'); return; }
    UI.closePanel(true); UI.closeModal();
    const sc = Game.scene; Game.photo = { zoom: 1, px: 160, py: 90, cam0: sc && sc.cam != null ? sc.cam : null }; Game.paused = true; $('frame').classList.add('photo'); this.ui();
  },
  close() { const sc = Game.scene; if (Game.photo && sc && Game.photo.cam0 != null) sc.cam = Game.photo.cam0; Game.photo = null; Game.paused = false; $('frame').classList.remove('photo'); $('photoui').innerHTML = ''; UI.refresh(); },
  pan(dx, dy) {
    const p = Game.photo; if (!p) return;
    if (p.zoom === 2) { p.px = clamp(p.px + dx * 40, 0, 320); p.py = clamp(p.py + dy * 30, 0, 180); }
    else { const sc = Game.scene; const W = Game.sceneName === 'Town' ? TOWN_W : Game.sceneName === 'Home' ? HOME_W : Game.sceneName === 'BoatFishing' ? RW : LW; if (sc && sc.cam != null && p.cam0 != null) sc.cam = clamp(sc.cam + dx * 60, Math.max(0, p.cam0 - 200), Math.min(W - LW, p.cam0 + 200)); }
  },
  label() { const sc = Game.sceneName; const where = sc === 'BoatFishing' ? REGION[Game.scene.rid].name : sc === 'Home' ? 'Ev' : 'Sakin Liman'; return 'GÜN ' + S.day + ' - ' + SEASON_TR[World.season()] + ' - ' + where; },
  ui() {
    const p = Game.photo; $('photoui').innerHTML = `<div class="photobar"><button class="btn" data-ph="l">${img('left', 2)}</button><button class="btn" data-ph="r">${img('right', 2)}</button>${p.zoom === 2 ? `<button class="btn" data-ph="u">▲</button><button class="btn" data-ph="d">▼</button>` : ''}<button class="btn ${p.zoom === 1 ? 'on' : ''}" data-ph="z1">1×</button><button class="btn ${p.zoom === 2 ? 'on' : ''}" data-ph="z2">2×</button><button class="btn ${S.ui.photoLabel ? 'on' : ''}" data-ph="lab">Etiket</button><button class="btn g" data-ph="save">${img('camera', 1, 'ic')} PNG kaydet</button><button class="btn r" data-ph="x">Kapat</button></div>`;
  },
  act(k) {
    const p = Game.photo; if (!p) return;
    if (k === 'l') this.pan(-1, 0); if (k === 'r') this.pan(1, 0); if (k === 'u') this.pan(0, -1); if (k === 'd') this.pan(0, 1);
    if (k === 'z1') p.zoom = 1; if (k === 'z2') p.zoom = 2; if (k === 'lab') { S.ui.photoLabel = !S.ui.photoLabel; Save.soon(); }
    if (k === 'x') { this.close(); return; } if (k === 'save') this.save();
    this.ui();
  },
  /* görünür kareyi (BUF) ölçekleyip etiketle */
  composite(scale) {
    const p = Game.photo; const [c, x] = mkCanvas(LW * scale, LH * scale); x.imageSmoothingEnabled = false;
    if (p.zoom === 2) x.drawImage(BUF, p.px, p.py, 320, 180, 0, 0, c.width, c.height); else x.drawImage(BUF, 0, 0, c.width, c.height);
    return c;
  },
  save() {
    Sound.sfx('shutter');
    let c; try { c = this.composite(2); } catch (e) { UI.toastNow('Görüntü oluşturulamadı.', 'warn'); return; }
    const name = 'cozyfishing_gun' + S.day + '.png';
    try {
      c.toBlob(bl => {
        if (!bl) { this.fallback(c); return; }
        const u = URL.createObjectURL(bl); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 800);
        UI.toastNow('Fotoğraf kaydedildi (indirilenler). Tarayıcı izin vermediyse görüntüye uzun basıp kaydet.', 'good', 'camera'); this.lastUrl = null;
      }, 'image/png');
    } catch (e) { this.fallback(c); }
  },
  fallback(c) { try { const u = c.toDataURL('image/png'); UI.showModal(`<h3>${img('camera', 2)} Fotoğraf</h3><p class="small">Tarayıcın doğrudan indirmeye izin vermedi. Görüntüye uzun basıp “Görüntüyü kaydet”i seçebilirsin.</p><img src="${u}" style="width:100%;image-rendering:pixelated" alt=""><div class="btns"><button class="btn" data-a="mCancel">Kapat</button></div>`, 'wide'); } catch (e) { UI.toastNow('Bu tarayıcı fotoğraf kaydetmeye izin vermiyor.', 'warn'); } }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-ph]'); if (b) { e.preventDefault(); Photo.act(b.dataset.ph); } });
/* akvaryum paneli: yalnızca panel açıkken çalışan canlı önizleme döngüsü */
{
  const rp0 = UI.renderPanel.bind(UI);
  UI.renderPanel = function (keep) {
    rp0(keep);
    if (this.panel !== 'Aquarium' || this._aqLoop) return;
    let last = performance.now();
    const loop = (ts) => {
      const c = $('aqc'); const tank = this.args && Aq.tank(this.args.tank);
      if (this.panel !== 'Aquarium' || !c || !tank) { this._aqLoop = null; return; }
      const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, c.width, c.height);
      try { drawTank(g, this.args.tank + ':ui', 6, 6, c.width - 12, c.height - 12, tank, performance.now() / 1000, 2, dt); } catch (e) { console.error(e); this._aqLoop = null; return; }
      this._aqLoop = requestAnimationFrame(loop);
    };
    this._aqLoop = requestAnimationFrame(loop);
  };
}
/* yardım: v2 bölümleri */
{
  const h0 = UI.P.Help;
  UI.P.Help = function (a) {
    const r = h0.call(this, a);
    r.html = `<h4>v2.0 yenilikleri</h4>
      <p><b>Balıkçı Defteri</b> (Menü): tür rehberi, bugünün gerçek av olasılıklarına göre önerileri (garanti değildir), kişisel av kayıtların (1/5/12 avda yeni ayrıntılar), eksik türler ve hedef favorileri.</p>
      <p><b>Sefer Planı</b>: en fazla 3 tür hedefi (1–99). Yalnızca hedef koyduktan sonraki gerçek avlar sayılır; iskele ve teknede sağ üstte küçük takip kutusu görünür. İlanlardan “hedefi” ile miktarı sen seçerek ekleyebilirsin.</p>
      <p><b>Bölge Ustalığı</b>: her bölgede Bronz (3 nokta ziyareti → rozet), Gümüş (6 tür → poster dekoru), Altın (tüm türler → tekne süsü). Yalnızca görseldir.</p>
      <p><b>Ticaret · Akıllı Satış</b>: hal, ilan ve çay bahçesi fiyatlarını karşılaştırır, limitlere göre dağılım önerir. Onay vermeden satış yapılmaz; ★ favoriler ve akvaryumdaki balıklar hariçtir.</p>
      <p><b>Olta setleri</b>: Envanter → Ekipman & Yem veya yem seçiminde 3 kayıtlı set. <b>Oto yem politikası</b>: Tekne Atölyesi → Otomasyon'da her cihaz için Ekonomik / Sabit / Hedef balık / Yedek yemli.</p>
      <p><b>Akvaryum</b>: Kerem'in dükkânındaki “Akvaryumlar” sekmesi (Küçük 550, Orta 2.200, Büyük 8.500). Evde akvaryuma dokunarak balık ekle/çıkar/taşı. 20 uygun tür; koleksiyon 5/10/20'de ödül.</p>
      <p><b>Mali Günlük</b>: son 30 günün gelir/gider dökümü; festival ödülü ve çay bahçesi geliri ayrı tutulur. <b>Rekorlar</b>: en büyük 10 avın; 5'ini evdeki Rekor Duvarı'na asabilirsin.</p>
      <p><b>Fotoğraf modu</b>: üst çubuktaki fotoğraf makinesi (kasaba, iskele, ev, deniz). Arayüz gizlenir, oyun durur; 1×/2×, kaydırma, etiket ve PNG kaydet. Mücadele sırasında açılmaz.</p>` + r.html;
    return r;
  };
}
