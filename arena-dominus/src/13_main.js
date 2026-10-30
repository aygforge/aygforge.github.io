/* =========================================================================
   Tutorial (skippable first-run guide) + boot
   ========================================================================= */

const Tutorial = {
  active: false, i: 0,
  get steps() {
    return [
      { s: 'hub', sel: '#topbar .club', t: tx("Ludus'un Hazır", 'Your Ludus Is Ready'), x: tx("Kulübünüzü kurdunuz. Üst çubukta kulüp, bütçe, sezon/hafta ve transfer dönemi bilgileri yer alır. Ana Merkez'de puan tablosu, yaklaşan maçlar ve haberler görünür.", 'Your club is set up. The top bar shows the club, budget, season/week and transfer window. The Home screen shows the table, upcoming matches and news.') },
      { s: 'squad', sel: '.squad-grid', t: tx('As Gladyatörler', 'Starting Gladiators'), x: tx('Kadronuz tam 5 gladyatörden oluşur. İlk üç kart (Ön Hat, Sol Kanat, Sağ Kanat) maça çıkan aslar; son ikisi yedektir. İki karta sırayla dokunarak ya da sürükleyerek yer değiştirin.', 'Your squad has exactly 5 gladiators. The first three cards (Front Line, Left Wing, Right Wing) are the starters; the last two are reserves. Tap two cards in turn or drag to swap them.') },
      { s: 'squad', sel: '.gcard[data-gid] .acts', t: tx('Gladyatör Özellikleri', 'Gladiator Attributes'), x: tx('Profil düğmesiyle gladyatörün altı özelliğini, kondisyonunu, sözleşmesini, kariyer istatistiklerini ve keşif tahminine dayanan gizli özelliklerini inceleyin.', 'Use the Profile button to see a gladiator\'s six attributes, condition, contract, career statistics and the scouting estimates of his hidden attributes.') },
      { s: 'match', sel: '.tactics', t: tx('Maç Öncesi Taktik', 'Pre-match Tactic'), x: tx('Beş taktikten birini seçin: Dengeli, Saldırgan, Savunmacı, Odaklı Av veya Koruma Düzeni. Her taktiğin hasar, enerji ve yapay zekâ davranışına gerçek etkisi vardır.', 'Choose one of five tactics: Balanced, Aggressive, Defensive, Focused Hunt or Guard Formation. Each one really changes damage, energy use and AI behaviour.') },
      { s: 'match', sel: '.match-actions', t: tx('Karşılaşmayı Başlatma', 'Starting a Match'), x: tx('Maç haftalarında "Maça Çık" ile 3v3 dövüşü canlı izleyin. Canlı maçta Hücum, Savunma ve Odaklan komutları verebilir, hızı 1x/2x/4x yapabilir veya sonucu anında simüle edebilirsiniz.', 'In match weeks, use "Fight (Live)" to watch the 3v3 battle. During a live match you can order Attack, Defend and Focus, switch speed between 1x/2x/4x, or simulate the result instantly.') },
      { s: 'hub', sel: '.news', t: tx('Maç Sonucu', 'Match Result'), x: tx('Maç bitince sonuç ekranında her gladyatörün hasarı, elemeleri ve durumu gösterilir. Sonuçlar, sakatlıklar ve önemli olaylar haber akışına da düşer.', 'After a match the result screen shows each gladiator\'s damage, eliminations and status. Results, injuries and key events also appear in the news feed.') },
      { s: 'market', sel: '.market-filters', t: tx('Transfer Pazarı', 'Transfer Market'), x: tx('Transfer dönemlerinde (sezon başı + 1. hafta, 15–16. haftalar) gladyatörleri filtreleyin, bonservis teklifi yapın ve sözleşme görüşün. Kadronuz 5 kişiyse önce yer açmanız gerekir.', 'During transfer windows (pre-season + week 1, weeks 15–16) filter gladiators, bid transfer fees and negotiate contracts. If your squad has 5 gladiators you must free a place first.') },
      { s: 'hub', sel: '#btn-next', t: tx('Haftayı İlerletme', 'Advancing the Week'), x: tx('"Sonraki Hafta" ile takvim ilerler. Maçınız olan haftada oynama ya da simüle etme seçimi size sorulur; maçınızı asla yanlışlıkla kaybetmezsiniz. İyi şanslar, Lanista!', '"Next Week" moves the calendar forward. In a match week you are always asked whether to play or simulate, so you never forfeit a match by accident. Good luck, Lanista!') }
    ];
  },
  start(force) {
    if (!force && S.flags.tut) return;
    this.active = true; this.i = 0;
    $('#tut').hidden = false;
    this.show();
  },
  show() {
    const st = this.steps[this.i];
    if (UI.screen !== st.s) UI.go(st.s);
    const t = $('#tut');
    t.innerHTML = `<div class="hl" id="tut-hl"></div><div class="bubble" id="tut-b"><div class="row"><b class="gold grow">${st.t}</b><span class="tiny muted">${this.i + 1}/${this.steps.length}</span></div><p class="small">${st.x}</p>
      <div class="row"><button class="btn ghost sm" data-a="tutSkip">${tx('Rehberi atla', 'Skip tutorial')}</button><span class="right"></span>${this.i > 0 ? `<button class="btn sm" data-a="tutPrev">${tx('Geri', 'Back')}</button>` : ''}<button class="btn gold sm" data-a="tutNext">${this.i === this.steps.length - 1 ? tx('Bitir', 'Finish') : tx('İleri', 'Next')}</button></div></div>`;
    this.position();
  },
  position() {
    if (!this.active) return;
    const st = this.steps[this.i];
    const hl = $('#tut-hl'), b = $('#tut-b');
    if (!hl || !b) return;
    const el = $(st.sel);
    const W = innerWidth, Hh = innerHeight;
    if (!el) { hl.style.display = 'none'; b.style.left = (W - b.offsetWidth) / 2 + 'px'; b.style.top = (Hh - b.offsetHeight) / 2 + 'px'; return; }
    const r = el.getBoundingClientRect();
    hl.style.display = 'block';
    hl.style.left = (r.left - 4) + 'px'; hl.style.top = (r.top - 4) + 'px'; hl.style.width = (Math.min(r.width, W) + 8) + 'px'; hl.style.height = (Math.min(r.height, Hh * 0.8) + 8) + 'px';
    const bw = b.offsetWidth, bh = b.offsetHeight;
    let x = clamp(r.left + r.width / 2 - bw / 2, 8, W - bw - 8);
    let y = r.bottom + 12;
    if (y + bh > Hh - 8) y = r.top - bh - 12;
    if (y < 8) y = clamp(Hh - bh - 12, 8, Hh);
    b.style.left = x + 'px'; b.style.top = y + 'px';
  },
  next() { if (this.i >= this.steps.length - 1) return this.finish(); this.i++; this.show(); },
  prev() { if (this.i > 0) { this.i--; this.show(); } },
  finish() {
    this.active = false;
    $('#tut').hidden = true; $('#tut').innerHTML = '';
    if (S) { S.flags.tut = 1; UI.saveSoon(); }
    UI.go('hub');
  }
};

// ---------------------------------------------------------------- language switching
I18N.set = function (l) {
  I18N.lang = l === 'en' ? 'en' : 'tr';
  try { localStorage.setItem('ad_lang', I18N.lang); } catch (e) { }
  if (typeof document !== 'undefined') document.documentElement.lang = I18N.lang;
  GameState.applyLang();
};

// ---------------------------------------------------------------- boot
(function boot() {
  if (typeof document === 'undefined') return;
  const start = () => {
    UI.init();
    try { const s = localStorage.getItem('ad_sound'); if (s === '0') Sfx.setOn(false); } catch (e) { }
    SaveManager.init().then(() => Title.langScreen());
    window.addEventListener('error', e => { console.error(e.error || e.message); });
    // keep the save safe if the tab is hidden/closed mid-session
    document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.player >= 0 && !Game.busy) SaveManager.save(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
