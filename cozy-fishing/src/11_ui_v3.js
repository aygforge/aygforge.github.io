/* =====================================================================
   11_ui_v3.js : v3.0 arayüzü — av yöntemi / gün ışığı, hızlı tekrar, çok duraklı harita,
   sefer raporu, kasaba projeleri, deniz yaşamı defteri, misafir daveti, filo yönetimi ve teslimat
   Mevcut UI.P / UI.A genişletilir; eski paneller korunur.
   ===================================================================== */
const stLabel = { active: 'Oyuncunun aktif teknesi', idle: 'Limanda boşta', out: 'NPC seferinde', back: 'Limana döndü · teslimat bekliyor' };
const stIcon = { active: 'boat', idle: 'fleet_idle', out: 'fleet_out', back: 'fleet_back' };
const keyName2 = k => k === 'bag' ? 'Çanta' : k === 'chest' ? 'Ev sandığı' : (BOAT[k.slice(5)] ? BOAT[k.slice(5)].name + ' deposu' : k);
Object.assign(UI.P, {
  /* ---------------- Kasaba projeleri ---------------- */
  Projects() {
    let html = `<div class="evbox">${img('square', 2)} Kasabayı kalıcı olarak geliştiren dört proje. İstediğin kadar parça parça bağış yapabilirsin; tamamlanan proje bir daha para istemez.</div>`;
    for (const P of V3.projects) {
      const st = Projects.st(P.id), left = Projects.left(P.id), done = Projects.done(P.id);
      html += `<div class="order ${done ? 'done2' : ''}"><div class="oh">${img(P.icon, 2)}<b>${esc(P.name)}</b><span class="sp"></span>${done ? `<span class="badge new">Tamamlandı · Gün ${st.done}</span>` : `<span class="dim">Kalan ${coin(left)}</span>`}</div>
        <div class="bar"><i style="width:${st.paid / P.cost * 100}%"></i><span>${fmt(st.paid)} / ${fmt(P.cost)}</span></div>
        <div class="small"><b>Görünüm:</b> ${esc(P.look)}</div><div class="small"><b>Avantaj:</b> ${esc(P.perk)}</div>
        ${done ? '' : `<div class="btns left">${[100, 500, 1000, 5000].map(n => `<button class="btn sm" data-a="projDonate" data-id="${P.id}" data-n="${n}" ${S.cash >= 1 && n <= left + 1e9 ? '' : 'disabled'}>${fmt(Math.min(n, left))}</button>`).join('')}<button class="btn g sm" data-a="projDonate" data-id="${P.id}" data-n="${left}" ${S.cash >= 1 ? '' : 'disabled'}>Kalanı (${fmt(Math.min(left, S.cash))})</button></div>`}</div>`;
    }
    if (Projects.done('lighthouse')) {
      const fc = Projects.st('lighthouse').fc || [];
      html += `<h4>${img('proj_lighthouse', 1, 'ic')} Fener hava tahmini · Gün ${S.day + 1}</h4><div class="srcs">${[0, 1].map(i => `<select data-fc="${i}">${REGIONS.map(r => `<option value="${r.id}" ${fc[i] === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select>`).join('')}</div><div class="grid2">${Projects.forecast().map(f => `<div class="kv"><span>${esc(REGION[f.rid].name)}</span><b>${img(f.wx, 1, 'ic')} ${WEATHER_TR[f.wx]}</b></div>`).join('')}</div><p class="dim small">Tahmin, oyunun gerçek hava üretimiyle aynıdır; tekrar açmak sonucu değiştirmez.</p>`;
    }
    return { title: 'Kasaba Projeleri', icon: 'proj_pier', npc: Game.sceneName === 'Town' ? 'hasan' : null, html, cls: 'wide' };
  },
  /* ---------------- Sefer raporları ---------------- */
  TripLog() {
    const L = S.tripLog.slice().reverse();
    const html = L.length ? L.map((r, i) => `<button class="row btnlike wfull" data-a="tripShow" data-i="${S.tripLog.length - 1 - i}">${img('report', 2)}<div class="grow"><b>Gün ${r.day} · ${esc(r.stops.map(x => REGION[x].name).join(' → '))}</b><div class="small dim">${esc(r.boatName)} · ${V3.dayparts[r.daypart].name} · ${r.manual} manuel + ${r.auto} oto av · yakıt ${fmt(r.fuel)} · tahmini taban değer ${fmt(r.value)}</div></div></button>`).join('') : '<p class="dim">Henüz sefer raporu yok. Tekneyle denize çıkıp limana döndüğünde rapor oluşur.</p>';
    return { title: 'Sefer Raporları (son 10)', icon: 'report', html: html + '<p class="dim small">Raporlardaki satış değeri yalnızca tahmindir; gerçek kazanç balıkları sattığında oluşur.</p>', cls: 'wide' };
  },
  /* ---------------- Filo: iş ilanları ---------------- */
  FleetJobs() {
    const fs = this.sel.fl || (this.sel.fl = {}); const idle = S.boats.owned.filter(b => Fleet.status(b) === 'idle');
    if (!fs.boat || !idle.includes(fs.boat)) fs.boat = idle[0] || null;
    const cand = Fleet.candidates(); Save.soon();
    let html = `<div class="evbox">${img('jobs', 2)} Bugünün adayları (Gün ${S.day}). Liste gün içinde değişmez. Ücret peşin alınır; balıklar dönüşte limandaki teslim kasasından alınır, otomatik satılmaz.</div>`;
    html += `<h4>1. Tekne</h4>` + (idle.length ? `<div class="optgrid">${idle.map(b => { const n = Inv.total('boat:' + b); return `<button class="opt ${fs.boat === b ? 'on' : ''}" data-a="flSel" data-k="boat" data-v="${b}"><img class="pix" style="width:64px" src="${boatThumb(b)}" alt=""><b>${esc(BOAT[b].name)}</b><small>${n ? '<span class="bad">Depoda ' + n + ' balık</span>' : 'Depo boş'}</small></button>`; }).join('')}</div>` : `<p class="dim">${S.boats.owned.length < 2 ? 'Filo için ikinci bir tekne gerekir. Aktif teknen göreve gönderilemez.' : 'Boşta tekne yok (aktif tekne ve görevdekiler hariç).'}</p>`);
    html += `<h4>2. Balıkçı</h4><div class="optgrid">${cand.map(id => { const n = FLEETNPC[id]; const busy = Fleet.busyNpc(id); return `<button class="opt ${fs.npc === id ? 'on' : ''} ${busy ? 'lock' : ''}" data-a="${busy ? 'noop' : 'flSel'}" data-k="npc" data-v="${id}"><img class="pix" style="width:44px" src="${portraitUrl(n.look, 2)}" alt=""><b>${esc(n.name)}</b><small>${esc(n.title)} · ücret ×${String(n.mult.toFixed(2)).replace('.', ',')}</small><small class="dim">${busy ? 'Görevde' : esc(n.desc)}</small></button>`; }).join('')}</div>`;
    if (fs.boat && fs.npc) {
      html += `<h4>3. Bölge</h4><div class="optgrid">${Object.keys(V3.fleetDays).map(rid => { const re = Boats.reach(rid, fs.boat); const pool = re.ok ? Fleet.pool(fs.npc, rid, fs.boat) : []; const c = Fleet.cost(fs.npc, rid); const ok = re.ok && pool.length; return `<button class="opt ${fs.rid === rid ? 'on' : ''} ${ok ? '' : 'lock'}" data-a="${ok ? 'flSel' : 'noop'}" data-k="rid" data-v="${rid}"><b>${esc(REGION[rid].name)}</b><small>${V3.fleetDays[rid]} gün · ${fmt(c.total)} para</small><small class="dim">${!re.ok ? 'Tekne ulaşamaz' : !pool.length ? 'Önce kendin keşfet' : pool.length + ' bilinen tür'}</small></button>`; }).join('')}</div>`;
    }
    if (fs.boat && fs.npc && fs.rid) {
      const c = Fleet.cost(fs.npc, fs.rid); const err = Fleet.check(fs.boat, fs.npc, fs.rid); const pool = Fleet.pool(fs.npc, fs.rid, fs.boat).sort((a, b) => b.w - a.w);
      html += `<h4>4. Onay</h4><div class="grid3"><div class="kv"><span>Yevmiye</span><b>${coin(c.wage)}</b></div><div class="kv"><span>Yakıt</span><b>${coin(c.fuel)}</b></div><div class="kv"><span>Toplam (peşin)</span><b>${coin(c.total)}</b></div><div class="kv"><span>Dönüş</span><b>Gün ${S.day + V3.fleetDays[fs.rid]} başında</b></div><div class="kv"><span>Beklenen av</span><b>2–4 balık</b></div><div class="kv"><span>En yüksek güç</span><b>${Fleet.maxPower(fs.npc, fs.boat)}</b></div></div>
        <div class="fishrow small">${pool.slice(0, 10).map(p => fishImgAlways(p.fid, 1, 'mini')).join('')}</div><p class="dim small">Yalnızca kendi avlarınla keşfettiğin türler gelebilir. NPC yem stoğunu kullanmaz; yeni keşif, rekor veya av sayacı oluşturmaz.</p>
        ${err ? `<div class="warnbox">${esc(err)}</div>` : ''}<div class="btns"><button class="btn" data-a="openPanel" data-p="Boatyard">Geri</button><button class="btn g" data-a="flStart" ${err ? 'disabled' : ''}>${img('fleet_out', 1, 'ic')} Görevlendir (${fmt(c.total)})</button></div>`;
    }
    return { title: 'Balıkçı İş İlanları', icon: 'jobs', html, cls: 'wide' };
  },
  FleetDeliver(a) {
    const m = S.fleet.missions.find(x => x.id === a.id); if (!m || m.status !== 'back') return { title: 'Teslimat', icon: 'crate', html: '<p>Bu teslimat tamamlandı.</p><div class="btns"><button class="btn" data-a="openPanel" data-p="Boatyard">Filo</button></div>' };
    const N = FLEETNPC[m.npc]; const dest = this.sel.flDest || '';
    let html = `<div class="npc"><img class="pix portrait" src="${portraitUrl(N.look, 2)}" alt=""><div><b>${esc(N.name)}</b> <span class="dim">· ${esc(N.title)}</span><p>Tekne: <b>${esc(BOAT[m.boat].name)}</b> · Bölge: <b>${esc(REGION[m.rid].name)}</b> · Sefer süresi: <b>${m.days} gün</b> (Gün ${m.start} → ${m.ret})</p></div></div>`;
    html += `<h4>Yakalanan: ${m.result.n} balık · tahmini taban değer ${coin(m.result.value)}</h4>${Object.entries(m.result.fish).map(([f, q]) => `<div class="row">${fishImgAlways(f, 1, 'mini')}<div class="grow"><b>${q} ${esc(FISH[f].name_tr)}</b> <span class="dim small">taban ${fmt(FISH[f].base_price)} · toplam ${fmt(FISH[f].base_price * q)}</span></div></div>`).join('')}`;
    html += `<h4>Liman Teslim Kasası: ${Fleet.leftN(m)} balık bekliyor</h4><div class="srcs"><span class="small">Hedef depo:</span><button class="btn sm ${!dest ? 'on' : ''}" data-a="flDest" data-k="">Otomatik (çanta → sandık → tekne)</button>${Fleet.destinations().map(k => `<button class="btn sm ${dest === k ? 'on' : ''}" data-a="flDest" data-k="${k}">${esc(keyName2(k))} (${Inv.used(k)}/${Inv.cap(k)})</button>`).join('')}</div>`;
    html += `<div class="btns"><button class="btn" data-a="openPanel" data-p="Boatyard">Filo</button><button class="btn g" data-a="flCollect" data-id="${m.id}" ${Game.sceneName === 'Town' ? '' : 'disabled'}>${img('crate', 1, 'ic')} Balıkları Teslim Al</button></div><p class="dim small">Sığmayan balıklar kaybolmaz; teslim kasasında bekler. Teslimat tamamen alınmadan tekne yeni göreve çıkamaz. Balıklar otomatik paraya çevrilmez.</p>`;
    return { title: 'NPC Teslimatı', icon: 'crate', html, cls: 'wide' };
  }
});
/* ---- mevcut panellerin genişletilmesi ---- */
{
  const P1 = Object.assign({}, UI.P);
  UI.P.Boatyard = function () {
    const tab = this.curTab('yard', 'boats');
    const tabs = this.tabsHtml('yard', [['boats', 'Tekneler'], ['ups', 'Yükseltmeler'], ['auto', 'Otomasyon'], ['look', 'Görünüm'], ['fleet', 'Filo Yönetimi']]);
    if (tab !== 'fleet') { const r = P1.Boatyard.call(this); r.tabs = tabs; if (tab === 'boats' && Game.sceneName === 'Town') r.html += this.guestBtnHtml('bora'); return r; }
    const cap = Fleet.capacity(), used = S.fleet.missions.length; const st = S.fleet.stats;
    let html = `<div class="evbox">${img('fleet_out', 2)} Boştaki teknelerini ücretli balıkçılarla sınırlı görevlere gönder. Kapasite: <b>${used}/${cap}</b> (tekne sayısı − 1, en fazla 3). Görevler yalnızca oyun günü ilerledikçe ilerler.</div>`;
    html += S.boats.owned.length ? S.boats.owned.map(b => {
      const s = Fleet.status(b), m = Fleet.missionOf(b); const N = m && FLEETNPC[m.npc];
      return `<div class="order"><div class="oh"><img class="pix" style="width:72px" src="${boatThumb(b)}" alt=""><b>${esc(BOAT[b].name)}</b>${S.boats.byId[b].name ? ' «' + esc(S.boats.byId[b].name) + '»' : ''}<span class="sp"></span><span class="badge ${s === 'back' ? 'new' : s === 'out' ? 'big' : 'rec'}">${img(stIcon[s], 1, 'ic')} ${stLabel[s]}</span></div>
        ${m ? `<div class="small">${N ? `<img class="pix" style="width:20px;vertical-align:middle" src="${portraitUrl(N.look, 1)}" alt=""> <b>${esc(N.name)}</b> · ` : ''}Hedef: <b>${esc(REGION[m.rid].name)}</b> · ${m.status === 'out' ? 'Kalan: <b>' + Math.max(0, m.ret - S.day) + ' oyun günü</b> (Gün ' + m.ret + ')' : 'Döndü: Gün ' + m.backDay} · Beklenen av: 2–4 balık · Görev ücreti: ${fmt(m.wage + m.fuel)}${m.status === 'back' ? ' · Teslim kasasında ' + Fleet.leftN(m) + ' balık' : ''}</div>` : ''}
        <div class="of"><span class="sp"></span>${s === 'idle' ? `<button class="btn g sm" data-a="flJobs" data-b="${b}" ${cap > used ? '' : 'disabled'}>${img('jobs', 1, 'ic')} Balıkçı Görevlendir</button>` : s === 'out' ? `<button class="btn sm" data-a="flInfo" data-id="${m.id}">Sefer Bilgilerini Gör</button>` : s === 'back' ? `<button class="btn g sm" data-a="flDeliver" data-id="${m.id}">${img('crate', 1, 'ic')} Balıkları Teslim Al</button>` : '<span class="dim small">Aktif tekne göreve gönderilemez</span>'}</div></div>`;
    }).join('') : '<p class="dim">Henüz teknen yok.</p>';
    html += `<h4>Filo istatistikleri</h4><div class="grid3"><div class="kv"><span>Tamamlanan görev</span><b>${st.missions}</b></div><div class="kv"><span>Teslim alınan balık</span><b>${st.fish}</b></div><div class="kv"><span>Getirilen taban değer</span><b>${fmt(st.value)}</b></div><div class="kv"><span>Ödenen yevmiye</span><b>${fmt(st.wages)}</b></div><div class="kv"><span>Filo yakıtı</span><b>${fmt(st.fuel)}</b></div></div>`;
    if (S.fleet.log.length) html += `<h4>Son görevler</h4>` + S.fleet.log.slice().reverse().map(l => `<div class="row small">${img('fleet_back', 1, 'ic')}<div class="grow">Gün ${l.start}–${l.ret} · <b>${esc(FLEETNPC[l.npc].name)}</b> · ${esc(BOAT[l.boat].name)} · ${esc(REGION[l.rid].name)} · ${l.n} balık (${Object.entries(l.fish).map(([f, q]) => q + ' ' + esc(FISH[f].name_tr)).join(', ')}) · değer ${fmt(l.value)} · ücret ${fmt(l.wage + l.fuel)}</div></div>`).join('');
    if (!inTownLike()) html = `<div class="warnbox">Görev başlatma ve teslimat kasabadaki limanda yapılır; burada yalnızca görüntüleme.</div>` + html;
    return { title: 'Bora\'nın Tekne Atölyesi', icon: 'yard', npc: Game.sceneName === 'Town' ? 'bora' : null, tabs, html, cls: 'wide' };
  };
  UI.P.Square = function () { const r = P1.Square.call(this); r.html = `<div class="btns left"><button class="btn g" data-a="openPanel" data-p="Projects">${img('proj_pier', 1, 'ic')} Kasaba Projeleri (${V3.projects.filter(p => Projects.done(p.id)).length}/4)</button></div>` + r.html; return r; };
  UI.P.Dialog = function (a) { const r = P1.Dialog.call(this, a); if (V3.guestNpcs.includes(a.npc)) r.html = r.html.replace('<div class="btns">', this.guestBtnHtml(a.npc) + '<div class="btns">'); return r; };
  UI.P.Journal = function () {
    const tab = this.curTab('jr', 'guide'); if (this.sel.jrFish) return P1.Journal.call(this);
    const tabs = this.tabsHtml('jr', [['guide', 'Tür Rehberi'], ['today', 'Bugünkü Av'], ['log', 'Av Kayıtları'], ['missing', 'Eksik Türler'], ['fav', 'Favoriler'], ['wild', 'Deniz Yaşamı']]);
    if (tab === 'wild') return { title: 'Balıkçı Defteri', icon: 'journal', tabs, html: this.wildHtml(), cls: 'wide' };
    const r = P1.Journal.call(this); r.tabs = tabs; if (tab === 'today') r.html = this.todayHtml(); return r;
  };
  UI.P.People = function () { const r = P1.People.call(this); r.html = (Guests.valid() ? `<div class="evbox">${img('guest', 2)} Bugünkü misafirin: <b>${esc(NPCS[S.guest.npc].name)}</b> · bir sonraki tekne seferine katılacak. <button class="btn sm" data-a="guestCancel">Daveti iptal et</button></div>` : `<div class="dim small">${img('guest', 1, 'ic')} Efe, Ali Dayı, Mert, Elif ve Bora'yı bulundukları yerde konuşarak tekne gezisine davet edebilirsin (yalnızca sosyal).</div>`) + r.html; return r; };
  UI.P.Statistics = function () { const r = P1.Statistics.call(this); const st = S.fleet.stats; r.html = r.html.replace('<h4>v2</h4>', `<h4>v3</h4><div class="grid3"><div class="kv"><span>Deniz yaşamı gözlemi</span><b>${Wildlife.count()}/${V3.wildlife.length}</b></div><div class="kv"><span>Kasaba projeleri</span><b>${V3.projects.filter(p => Projects.done(p.id)).length}/4</b></div><div class="kv"><span>Filo görevleri</span><b>${st.missions} · ${st.fish} balık</b></div><div class="kv"><span>Filo masrafı</span><b>${fmt(st.wages + st.fuel)}</b></div><div class="kv"><span>Misafirli gezi</span><b>${sum(Object.values(S.guestLog))}</b></div><div class="kv"><span>Sefer raporu</span><b>${S.tripLog.length}</b></div></div><h4>v2</h4>`); return r; };
  UI.P.Menu = function () { const r = P1.Menu.call(this); r.html = r.html.replace('<button class="btn sm" data-a="photoOpen">', [['Projects', 'proj_pier', 'Kasaba Projeleri'], ['TripLog', 'report', 'Sefer Raporları']].map(([p, i, n]) => `<button class="btn sm" data-a="openPanel" data-p="${p}">${img(i, 1, 'ic')} ${n}</button>`).join('') + `<button class="btn sm" data-a="flOpen">${img('fleet_out', 1, 'ic')} Filo</button><button class="btn sm" data-a="wildOpen">${img('wild_book', 1, 'ic')} Deniz Yaşamı</button><button class="btn sm" data-a="photoOpen">`); return r; };
  UI.P.Help = function (a) {
    const r = P1.Help.call(this, a);
    r.html = `<h4>v3.0 yenilikleri</h4>
      <p><b>Av yöntemleri</b> (av ekranında ${img('m_float', 1, 'ic')} düğmesi): Şamandıra (klasik, değişmedi) · Dip Oltası (kamış ucunu izle, belirgin bükülünce çek) · Spin (yem durduğunda dokun; 2–3 iyi hareket yeter, sık dokunmak işe yaramaz, en iyisi Metal Sahte Yem). Her türün uygun yöntemi Balıkçı Defteri'nde. Yarışmalarda standart şamandıra kullanılır.</p>
      <p><b>Gün ışığı</b>: Sabah / Gündüz / Akşamüstü. Seferde harita ekranında seçilir ve sefer boyunca sabittir; iskelede av ayarlarından değiştirilir. Bazı türler %12 göreli daha sık görülür; enerji ve hava değişmez.</p>
      <p><b>Çok duraklı sefer</b>: Motorlu tekne ve üstüyle seferde iki ana bölge. Denizdeyken “Rota” ile ikinci durağı seç (yakıtın %90'ı). Limana dönünce tek bir Sefer Raporu çıkar.</p>
      <p><b>Kasaba Projeleri</b> (Şenlik Meydanı · Muhtarlık): İskele, Balık Pazarı, Liman Feneri, Seyir Terası. Parça parça bağışla; tamamlanınca kasaba görünümü değişir ve küçük avantajlar açılır.</p>
      <p><b>Deniz Yaşamı</b>: 24 gerçek canlı. Atışlar ve varışlarda nadiren görülür, Balıkçı Defteri → Deniz Yaşamı'na yazılır. Yakalanmaz, satılmaz.</p>
      <p><b>Misafir</b>: Efe, Ali Dayı, Mert, Elif veya Bora ile konuşup geziye davet et; teknede sohbet eder (ek av veya para vermez).</p>
      <p><b>Filo</b> (Tekne Atölyesi → Filo Yönetimi): İkinci tekneden itibaren boştaki tekneyi günlük adaylardan bir balıkçıyla 2–3 günlük göreve gönder. 2–4 balıkla döner; balıkları limandan teslim al ve normal kanallardan sat.</p>
      <p><b>Hızlı tekrar</b>: av sonucu kartında veya av ekranında ${img('quick', 1, 'ic')}: önceki atış gücüyle tek atış. Bekleme, tasma ve mücadele yine senin elinde.</p>` + r.html;
    return r;
  };
}
/* ---- yardımcı HTML ---- */
Object.assign(UI, {
  guestBtnHtml(npc) {
    if (!S.boats.active) return `<p class="dim small">${img('guest', 1, 'ic')} Bir teknen olduğunda ${esc(NPCS[npc].name)} seni tekne gezisinde yalnız bırakmaz.</p>`;
    if (Guests.valid() && S.guest.npc === npc) return `<div class="evbox">${img('guest', 1, 'ic')} ${esc(NPCS[npc].name)} bir sonraki tekne seferine katılacak. <button class="btn sm" data-a="guestCancel">İptal</button></div>`;
    return `<div class="btns left"><button class="btn sm" data-a="guestInvite" data-npc="${npc}" ${Guests.valid() ? 'disabled' : ''}>${img('guest', 1, 'ic')} ${esc(NPCS[npc].name)}'yı tekne gezisine davet et</button>${Guests.valid() ? `<span class="dim small">Bugün misafirin: ${esc(NPCS[S.guest.npc].name)}</span>` : ''}</div>`;
  },
  wildHtml() {
    const n = Wildlife.count();
    let html = `<div class="evbox">${img('wild_book', 2)} Deniz yaşamı gözlemleri: <b>${n}/${V3.wildlife.length}</b> · ${img(S.ach.wild8 ? 'wild_badge' : 'lock', 1, 'ic')} 8: rozet · ${img(S.ach.wild16 ? 'decor_poster_wild' : 'lock', 1, 'ic')} 16: ev posteri · ${img(S.ach.wild24 ? 'title' : 'lock', 1, 'ic')} 24: unvan</div>`;
    html += REGIONS.map(r => { const L = Wildlife.pool(r.id); return `<h4>${esc(r.name)} <span class="dim">${L.filter(w => S.wild.seen[w.id]).length}/${L.length}</span></h4><div class="ency wildgrid">${L.map(w => { const e = S.wild.seen[w.id]; return `<div class="ecard ${e ? '' : 'lock'}" title="${esc(e ? w.info : 'Henüz gözlenmedi')}"><img class="pix" src="${wildUrl(w.id, 2, !!e)}" alt=""><span><b>${e ? esc(w.name) : '???'}</b></span>${e ? `<small class="dim">${esc(w.info)}</small><small>İlk: Gün ${e.first} · ${esc(REGION[e.rid].name)} · ${e.n} kez</small>` : `<small class="dim">${esc(REGION[w.rid].name)} sularında</small>`}</div>`; }).join('')}</div>`; }).join('');
    return html + `<p class="dim small">Canlılar yakalanmaz, satılmaz, envantere girmez. Karşılaşmalar oyun günü ve av bağlamına göre belirlenir (günde en çok ${Wildlife.DAILY_MAX}).${Projects.done('terrace') ? ' Seyir Terası: karşılaşma ihtimali +%10.' : ''}</p>`;
  },
  /* Bugünkü Av: Yakalama Şansı ve Kazanç Potansiyeli modları (gerçek seçim formülüyle, garanti yok) */
  todayHtml() {
    const mode = this.sel.jrMode || 'chance'; const rows = Journal.today3(mode, 10); const dp = Dayparts.cur();
    let h = `<div class="tabs small"><button class="${mode === 'chance' ? 'on' : ''}" data-a="jrMode" data-m="chance">Yakalama Şansı</button><button class="${mode === 'profit' ? 'on' : ''}" data-a="jrMode" data-m="profit">Kazanç Potansiyeli</button></div>`;
    h += `<div class="evbox">${SEASON_TR[World.season()]} ${World.seasonDay()}/28 · Olta gücü ${rodOf().power} · Gün ışığı: ${V3.dayparts[dp].name} · ${mode === 'profit' ? 'Atış başına tahmini net: vurma × olasılık × en iyi teklif − yem − yakıt payı' : 'Görülme ağırlıklarına göre en yüksek olasılık'}</div>`;
    h += rows.length ? rows.map(x => { const f = FISH[x.fid], sp = SPOTS[x.spot]; return `<div class="row">${fishImgAlways(x.fid, 1, 'mini')}<div class="grow"><b>${esc(upTR(f.name_tr))}</b> <span class="badge ${x.p >= .2 ? 'new' : x.p >= .1 ? 'big' : 'rec'}">Av uygunluğu: ${Journal.level(x.p)}</span><div class="small">${esc(REGION[x.rid].name)} · ${esc(sp.name)} · ${esc(BAIT[x.bait].name)} · ${BAND_TR[x.band]} · ${V3.methods[x.method].short}</div><div class="dim small">Seçilme olasılığı ≈ %${Math.round(x.p * 100)}${mode === 'profit' ? ` · teklif ${fmt(x.unit)} (${esc(x.via)}) · yem ${fmt(x.baitC)} · yakıt payı ${fmt(Math.round(x.fuelC * 10) / 10)} · <b>tahmini ${x.ev >= 0 ? '+' : ''}${(Math.round(x.ev * 10) / 10).toString().replace('.', ',')}/atış</b>` : ''} (garanti değildir)</div></div><button class="btn sm" data-a="planQuick" data-id="${x.fid}">${img('plan', 1, 'ic')} Hedef</button></div>`; }).join('') : '<p class="dim">Henüz öneri için yeterli keşif yok. Önce birkaç tür yakala!</p>';
    return h + '<p class="dim small">Hesap; FishDB ağırlıkları, yem/mevsim/hava/mesafe/olay/gün ışığı/yöntem çarpanları ve olta gücü filtresiyle yapılır. Kazanç modu stoktaki yemleri, yem fiyatını, sefer yakıtını ve aktif ilan/çay bahçesi tekliflerini kullanır; kesin kazanç değildir.</p>';
  },
  showTripReport(rep) {
    const fishRows = Object.entries(rep.fish).sort((a, b) => b[1] - a[1]);
    this.showModal(`<h3>${img('report', 2)} Sefer Raporu · Gün ${rep.day}</h3>
      <div class="grid3"><div class="kv"><span>Tekne</span><b>${esc(rep.boatName)}</b></div><div class="kv"><span>Gün ışığı</span><b>${img(V3.dayparts[rep.daypart].icon, 1, 'ic')} ${V3.dayparts[rep.daypart].name}</b></div><div class="kv"><span>Bölgeler</span><b>${esc(rep.stops.map(x => REGION[x].name).join(' → '))}</b></div>
      <div class="kv"><span>Manuel av</span><b>${rep.manual}</b></div><div class="kv"><span>Otomatik olta</span><b>${rep.auto}</b></div><div class="kv"><span>Harcanan enerji</span><b>${rep.energy}</b></div>
      <div class="kv"><span>Yem maliyeti</span><b>${fmt(rep.baitCost)}</b></div><div class="kv"><span>Yakıt gideri</span><b>${fmt(rep.fuel)}</b></div><div class="kv"><span>Tahmini taban değer</span><b>${coin(rep.value)}</b></div></div>
      <div class="small">Av noktaları: ${rep.spots.map(s => esc(SPOTS[s].name)).join(' · ') || '—'}</div>
      ${fishRows.length ? `<h4>Yakalananlar</h4><div class="fishrow">${fishRows.map(([f, q]) => `<span class="small">${fishImgAlways(f, 1, 'mini')} ${q}× ${esc(FISH[f].name_tr)}</span>`).join(' ')}</div>` : '<p class="dim">Bu seferde balık yakalanmadı.</p>'}
      ${rep.newSp.length ? `<div class="ok small">Yeni türler: ${rep.newSp.map(f => esc(FISH[f].name_tr)).join(', ')}</div>` : ''}${rep.recs.length ? `<div class="small">Kırılan rekorlar: ${rep.recs.map(r => esc(FISH[r.fid].name_tr) + ' ' + r.cm + ' cm').join(', ')}</div>` : ''}
      ${rep.wild.length ? `<div class="small">${img('wild_book', 1, 'ic')} Gözlemler: ${rep.wild.map(w => esc(WILD[w].name)).join(', ')}</div>` : ''}${rep.guest ? `<div class="small">${img('guest', 1, 'ic')} Misafir: ${esc(NPCS[rep.guest].name)}</div>` : ''}
      <p class="dim small">Tahmini değer kasana eklenmez; gerçek kazanç balıkları sattığında oluşur.</p><div class="btns"><button class="btn g" data-a="mCancel">Tamam</button></div>`, 'wide');
  },
  showFleetReturns() {
    const L = S.fleet.missions.filter(m => m.status === 'back' && !m.notified); if (!L.length) return; L.forEach(m => m.notified = true); Save.soon();
    this.showModal(`<h3>${img('fleet_back', 2)} BALIKÇI LİMANA DÖNDÜ!</h3>${L.map(m => { const N = FLEETNPC[m.npc]; return `<div class="order"><div class="oh"><img class="pix" style="width:36px" src="${portraitUrl(N.look, 2)}" alt=""><b>${esc(N.name)}</b><span class="dim small"> · ${esc(BOAT[m.boat].name)} · ${esc(REGION[m.rid].name)} · ${m.days} gün</span></div><div class="small">Yakalanan: <b>${m.result.n} adet</b> · ${Object.entries(m.result.fish).map(([f, q]) => q + ' ' + esc(FISH[f].name_tr) + ' (' + fmt(FISH[f].base_price) + ')').join(', ')} · tahmini toplam ${coin(m.result.value)}</div><div class="of"><span class="sp"></span><button class="btn g sm" data-a="flDeliver" data-id="${m.id}">${img('crate', 1, 'ic')} Balıkları Teslim Al</button></div></div>`; }).join('')}<div class="btns"><button class="btn" data-a="mCancel">Sonra</button></div>`, 'wide');
  }
});
/* Journal: tek geçişte (nokta × yem × mesafe × yöntem) hesap, her tür için en iyi plan */
Journal.today3 = function (mode, limit) {
  const known = new Set(FISH_LIST.filter(f => S.ency[f.id] && S.ency[f.id].caught).map(f => f.id)); if (!known.size) return [];
  const rp = rodOf().power; const dp = Dayparts.cur(); const casts = Math.max(1, Math.floor(CORE.daily_energy / rodOf().energy)); const best = {};
  const baits = BAITS.filter(b => b.id === 'basic' || (mode === 'chance' ? true : S.baitStock[b.id] > 0));
  const offer = fid => { let u = FISH[fid].base_price, via = 'Balık Hali'; for (const o of Orders.active()) if (o.fishId === fid && Orders.remaining(o) > 0 && o.unitPrice > u) { u = o.unitPrice; via = 'İlan · ' + CUST[o.customerId].name; } if (Tea.special() === fid && Tea.left() > 0 && Tea.price(fid) > u) { u = Tea.price(fid); via = 'Çay Bahçesi'; } return { u, via }; };
  const offers = {}; for (const f of known) offers[f] = offer(f);
  for (const sp of SPOT_LIST) {
    if (!S.world.unlocked[sp.region_id]) continue; if (!Object.keys(sp.weights).some(f => known.has(f))) continue;
    const fuelC = sp.region_id === 'sakin_liman' ? 0 : REGION[sp.region_id].trip_fuel_cost / casts;
    for (const b of baits) for (const band of ['near', 'mid', 'far']) for (const m of METHOD_IDS) {
      const w = Selector.weights(sp.id, { rodPower: rp, bait: b.id, band, method: m, daypart: dp });
      const baitC = b.id === 'basic' ? 0 : BAIT[b.id].purchase_price;
      for (const x of w.list) {
        if (!known.has(x.id)) continue; const of = offers[x.id];
        const ev = sp.base_bite_chance * x.p * of.u - baitC - fuelC; const score = mode === 'profit' ? ev : x.p;
        const cur = best[x.id]; if (!cur || score > cur.score + 1e-9) best[x.id] = { fid: x.id, spot: sp.id, rid: sp.region_id, bait: b.id, band, method: m, p: x.p, fac: x.fac, unit: of.u, via: of.via, baitC, fuelC, ev, score };
      }
    }
  }
  return Object.values(best).sort((a, b) => b.score - a.score).slice(0, limit || 10);
};
/* ---- av ekranı: yöntem / gün ışığı ayarı, hızlı tekrar, rota ---- */
{
  const fb0 = UI.fishBar.bind(UI);
  UI.fishBar = function (sc) {
    fb0(sc);
    const br = this.bottom.querySelector('.br'); const bb = $('baitBtn');
    if (br && bb) bb.insertAdjacentHTML('beforebegin', `<button class="btn" id="fishSetBtn" data-a="fishSet" title="Av yöntemi ve gün ışığı"></button><button class="btn" id="quickBtn" data-a="quickCast" title="Önceki atışı tekrarla" style="display:none">${img('quick', 2)}<span class="lbl">Tekrar</span></button>`);
    const bl = this.bottom.querySelector('.bl');
    if (bl && Game.sceneName === 'BoatFishing' && S.trip && Trips.maxStops(S.trip.boat) > 1) bl.insertAdjacentHTML('beforeend', `<button class="btn" id="routeBtn" data-a="nextStop" title="İkinci durak">${img('route', 2)}<span class="lbl">Rota</span></button>`);
    this.fishBarUpdate();
  };
  const fu0 = UI.fishBarUpdate.bind(UI);
  UI.fishBarUpdate = function () {
    fu0(); const ph = Fishing.phase;
    const fsb = $('fishSetBtn'); if (fsb) { const m = Fishing.castMethod(); const h = img(V3.methods[m].icon, 2) + `<span class="lbl">${V3.methods[m].short}</span>`; if (fsb._h !== h) { fsb._h = h; fsb.innerHTML = h; } fsb.disabled = ph !== 'READY'; }
    const qb = $('quickBtn'); if (qb) qb.style.display = (ph === 'READY' && S.lastCast && S.quickCast) ? '' : 'none';
    const rb = $('routeBtn'); if (rb) rb.style.display = (S.trip && Trips.canAddStop() && ph === 'READY') ? '' : 'none';
  };
  const sc0 = UI.showCatch.bind(UI);
  UI.showCatch = function (c, storage) { sc0(c, storage); if (!storage && S.quickCast && S.lastCast) { const b = this.modalEl.querySelector('[data-a=catchClose]'); if (b) b.insertAdjacentHTML('beforebegin', `<button class="btn" data-a="quickCastCard">${img('quick', 1, 'ic')} Önceki Atışı Tekrarla</button>`); } };
  /* deniz haritası paneli */
  const mp0 = UI.mapPanel.bind(UI);
  UI.mapPanel = function (sc) {
    if (sc.travel) return mp0(sc);
    if (sc.leg && S.trip) {
      const R = REGION[sc.sel]; const t = S.trip; const re = Boats.reach(R.id, t.boat); const c = Trips.legCost(R.id); const cur = Trips.cur();
      const bad = R.id === cur ? 'Zaten bu bölgedesin.' : t.stops.includes(R.id) ? 'Bu bölge bu seferde ziyaret edildi.' : !re.ok ? 'Bu tekne ulaşamaz: ' + re.miss.join(', ') : S.cash < c ? 'Yakıt için para yetmiyor.' : null;
      this.sceneui.innerHTML = `<div class="mapinfo scroll"><h3>${img('route', 2)} İkinci durak</h3><div class="small">Sefer: <b>${esc(t.stops.map(x => REGION[x].name).join(' → '))}</b> · ${V3.dayparts[t.daypart].name} (sabit)</div>
        <div class="kv"><span>Seçilen bölge</span><b>${esc(R.name)} ${img(S.world.weather[R.id], 1, 'ic')}</b></div><div class="kv"><span>Geçiş yakıtı (%90)</span><b>${coin(c)}</b></div>
        <div class="dim small">Enerji, çanta ve tekne deposu, otomatik av sayacı ve gün ışığı korunur. İkinci bölgeden sonra limana dönmelisin.</div>${bad ? `<div class="bad">✗ ${esc(bad)}</div>` : '<div class="ok">✓ Gidilebilir</div>'}
        <div class="btns"><button class="btn" data-a="mapBackSea">${img('boat', 1, 'ic')} Denize geri</button><button class="btn" data-a="mapBack">${img('home', 1, 'ic')} Limana Dön</button><button class="btn g" data-a="depart" ${bad ? 'disabled' : ''}>Yola Çık (${fmt(c)})</button></div></div>`;
      return;
    }
    mp0(sc); const box = this.sceneui.querySelector('.mapinfo'); if (!box) return; const bid = S.boats.active;
    const dpHtml = `<div class="kv"><span>Gün ışığı</span><b>${DAYPART_IDS.map(d => `<button class="btn sm ${S.daypart === d ? 'on' : ''}" data-a="dpSel" data-v="${d}">${img(V3.dayparts[d].icon, 1, 'ic')} ${V3.dayparts[d].name}</button>`).join('')}</b></div>`;
    const ms = bid ? Trips.maxStops(bid) : 1; const info = `<div class="dim small">${img('route', 1, 'ic')} ${bid ? esc(BOAT[bid].name) + ': ' + (ms > 1 ? 'bir seferde en fazla 2 ana bölge (ikinci durak %90 yakıt)' : 'tek bölgelik sefer') : ''}${Guests.valid() ? ' · Misafir: ' + esc(NPCS[S.guest.npc].name) : ''}</div>`;
    const fc = Projects.forecast(); const fcHtml = fc.length ? `<div class="small">${img('proj_lighthouse', 1, 'ic')} Yarın: ${fc.map(f => esc(REGION[f.rid].name) + ' ' + WEATHER_TR[f.wx]).join(' · ')}</div>` : '';
    const btns = box.querySelector('.btns'); if (btns) btns.insertAdjacentHTML('beforebegin', dpHtml + info + fcHtml);
    const cyc = box.querySelector('[data-a=cycleBoat]'); if (cyc && S.boats.owned.filter(b => !Fleet.onMission(b)).length < 2) cyc.remove();
  };
}
/* ---- eylemler ---- */
Object.assign(UI.A, {
  fishSet() {
    if (Fishing.phase !== 'READY') return; const comp = Comp.active() && Game.sceneName === 'PierFishing'; const atSea = !!S.trip;
    const m = Methods.cur(), dp = Dayparts.cur();
    this.showModal(`<h3>${img(V3.methods[m].icon, 2)} Av ayarları</h3>${comp ? '<div class="warnbox">Yarışmada standart şamandıralı av ve gündüz kuralları uygulanır.</div>' : ''}
      <h4>Av yöntemi</h4><div class="optgrid">${METHOD_IDS.map(id => `<button class="opt ${m === id ? 'on' : ''} ${comp ? 'lock' : ''}" data-a="${comp ? 'noop' : 'setMethod'}" data-m="${id}">${img(V3.methods[id].icon, 2)}<b>${V3.methods[id].name}</b><small>${esc(V3.methods[id].desc)}</small></button>`).join('')}</div>
      <h4>Gün ışığı</h4>${atSea ? `<p class="small">${img(V3.dayparts[dp].icon, 1, 'ic')} <b>${V3.dayparts[dp].name}</b> — sefer boyunca sabit (limanda değişir).</p>` : `<div class="optgrid">${DAYPART_IDS.map(id => `<button class="opt ${dp === id ? 'on' : ''} ${comp ? 'lock' : ''}" data-a="${comp ? 'noop' : 'setDaypart'}" data-v="${id}">${img(V3.dayparts[id].icon, 2)}<b>${V3.dayparts[id].name}</b><small>${esc(V3.dayparts[id].desc)}</small></button>`).join('')}</div>`}
      <label class="kv tg"><input type="checkbox" data-qc="1" ${S.quickCast ? 'checked' : ''}><span>Hızlı tekrar atış düğmesini göster</span></label>
      <p class="dim small">Yöntem ve gün ışığı enerji maliyetini değiştirmez; çarpanlar yalnızca göreli tür ağırlığıdır, hiçbir türü garanti etmez.</p><div class="btns"><button class="btn g" data-a="mCancel">Tamam</button></div>`, 'wide');
  },
  setMethod(d) { const r = Methods.set(d.m); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); this.closeModal(); this.fishBarUpdate(); if (r.ok) this.toastNow('Yöntem: ' + V3.methods[d.m].name, 'good', V3.methods[d.m].icon); },
  setDaypart(d) { const r = Dayparts.set(d.v); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); this.closeModal(); if (r.ok) this.toastNow('Gün ışığı: ' + V3.dayparts[d.v].name, 'good', V3.dayparts[d.v].icon); },
  dpSel(d) { const r = Dayparts.set(d.v); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); if (Game.sceneName === 'SeaMap') this.mapPanel(Game.scene); },
  quickCast() { Fishing.quickCast(); this.fishBarUpdate(); },
  quickCastCard() { this.closeModal(); Fishing.resultClosed(); this.fishBarUpdate(); Fishing.quickCast(); this.fishBarUpdate(); },
  nextStop() { if (Fishing.locked() || !S.trip) return; if (!Trips.canAddStop()) { this.toastNow('Bu seferde başka durak eklenemez.', 'warn'); return; } go('SeaMap', {}); },
  mapBackSea() { go('BoatFishing', { rid: Trips.cur() }); },
  tripShow(d) { const r = S.tripLog[+d.i]; if (r) this.showTripReport(r); },
  projDonate(d) { const P = PROJ[d.id]; const amt = Math.min(+d.n, Projects.left(d.id), S.cash); if (amt <= 0) { this.toastNow('Bağış için paran yok.', 'warn'); return; } this.confirm({ title: P.name, icon: P.icon, price: amt, text: fmt(amt) + ' para bağışlanacak. Kalan: ' + fmt(Projects.left(d.id) - amt) + '.', ok: 'Bağışla', onOk: () => { const r = Projects.donate(d.id, amt); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); else if (r.ok) { this.toastNow('Bağış: ' + fmt(r.amt), 'good', 'coin'); if (r.done) this.closePanel(); } } }); },
  jrMode(d) { this.sel.jrMode = d.m; this.renderPanel(true); },
  wildOpen() { this.tab.jr = 'wild'; this.sel.jrFish = null; this.openPanel('Journal'); },
  guestInvite(d) { const r = Guests.invite(d.npc); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(NPCS[d.npc].name + ' bir sonraki tekne gezine katılacak!', 'good', 'guest'); this.renderPanel(true); },
  guestCancel() { Guests.cancel(); this.renderPanel(true); },
  flOpen() { this.tab.yard = 'fleet'; this.openPanel('Boatyard'); },
  flJobs(d) { if (!inTownLike()) { this.toastNow('Görevlendirme için kasabadaki limana git.', 'warn'); return; } this.sel.fl = { boat: d.b }; this.openPanel('FleetJobs'); },
  flSel(d) { const fs = this.sel.fl || (this.sel.fl = {}); fs[d.k] = d.v; this.renderPanel(true); },
  flStart() {
    const fs = this.sel.fl || {}; const c = Fleet.cost(fs.npc, fs.rid); const N = FLEETNPC[fs.npc];
    this.confirm({ title: 'Görevi onayla', icon: 'fleet_out', price: c.total, html: `<p><b>${esc(N.name)}</b> · ${esc(BOAT[fs.boat].name)} · ${esc(REGION[fs.rid].name)}</p><p class="small">${V3.fleetDays[fs.rid]} oyun günü sonra (Gün ${S.day + V3.fleetDays[fs.rid]} başında) 2–4 balıkla döner. Ücret yalnızca bir kez, şimdi alınır.</p>`, ok: 'Görevlendir', onOk: () => { const r = Fleet.start(fs.boat, fs.npc, fs.rid); if (!r.ok) this.toastNow(r.msg, 'warn'); else { this.toastNow(N.name + ' ' + REGION[fs.rid].name + ' yolunda!', 'good', 'fleet_out'); this.sel.fl = {}; this.tab.yard = 'fleet'; this.openPanel('Boatyard'); } } });
  },
  flInfo(d) { const m = S.fleet.missions.find(x => x.id === d.id); if (!m) return; const N = FLEETNPC[m.npc]; this.confirm({ title: 'Sefer bilgisi', icon: 'fleet_out', html: `<div class="npc"><img class="pix portrait" src="${portraitUrl(N.look, 2)}" alt=""><div><b>${esc(N.name)}</b> · ${esc(N.title)}<p>${esc(BOAT[m.boat].name)} → ${esc(REGION[m.rid].name)}</p></div></div><div class="grid2"><div class="kv"><span>Çıkış</span><b>Gün ${m.start}</b></div><div class="kv"><span>Dönüş</span><b>Gün ${m.ret} başında</b></div><div class="kv"><span>Kalan</span><b>${Math.max(0, m.ret - S.day)} oyun günü</b></div><div class="kv"><span>Ödenen</span><b>${fmt(m.wage)} + ${fmt(m.fuel)} yakıt</b></div></div><p class="dim small">Görevler gerçek zamanla değil, yalnızca uyuyup yeni güne geçince ilerler. Tekne görevdeyken kullanılamaz.</p>`, ok: 'Tamam', cancel: 'Kapat' }); },
  flDeliver(d) { this.closeModal(); this.sel.flDest = ''; this.openPanel('FleetDeliver', { id: d.id }); },
  flDest(d) { this.sel.flDest = d.k; this.renderPanel(true); },
  flCollect(d) { const r = Fleet.collect(d.id, this.sel.flDest || null); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(r.n + ' balık teslim alındı' + (r.done ? '. Tekne yeniden kullanılabilir.' : ' · kasada ' + r.left + ' balık bekliyor.'), r.done ? 'good' : 'warn', 'crate'); if (r.ok && r.done) { this.tab.yard = 'fleet'; this.openPanel('Boatyard'); } }
});
{
  const oi0 = UI.onInput.bind(UI);
  UI.onInput = function (e) { const t = e.target; if (t.dataset.fc != null) { Projects.setForecast(+t.dataset.fc, t.value); this.renderPanel(true); return; } if (t.dataset.qc) { S.quickCast = t.checked; Save.soon(); this.fishBarUpdate(); return; } return oi0(e); };
}
