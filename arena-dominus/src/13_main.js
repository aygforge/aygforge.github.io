/* =========================================================================
   Tutorial (skippable first-run guide) + boot
   ========================================================================= */

const Tutorial = {
  active: false, i: 0,
  steps: [
    { s: 'hub', sel: '#topbar .club', t: 'Ludus\'un Hazır', x: 'Kulübünüzü kurdunuz. Üst çubukta kulüp, bütçe, sezon/hafta ve transfer dönemi bilgileri yer alır. Ana Merkez\'de puan tablosu, yaklaşan maçlar ve haberler görünür.' },
    { s: 'squad', sel: '.squad-grid', t: 'As Gladyatörler', x: 'Kadronuz tam 5 gladyatörden oluşur. İlk üç kart (Ön Hat, Sol Kanat, Sağ Kanat) maça çıkan aslar; son ikisi yedektir. İki karta sırayla dokunarak ya da sürükleyerek yer değiştirin.' },
    { s: 'squad', sel: '.gcard[data-gid] .acts', t: 'Gladyatör Özellikleri', x: 'Profil düğmesiyle gladyatörün altı özelliğini, kondisyonunu, sözleşmesini, kariyer istatistiklerini ve keşif tahminine dayanan gizli özelliklerini inceleyin.' },
    { s: 'match', sel: '.tactics', t: 'Maç Öncesi Taktik', x: 'Beş taktikten birini seçin: Dengeli, Saldırgan, Savunmacı, Odaklı Av veya Koruma Düzeni. Her taktiğin hasar, enerji ve yapay zekâ davranışına gerçek etkisi vardır.' },
    { s: 'match', sel: '.match-actions', t: 'Karşılaşmayı Başlatma', x: 'Maç haftalarında "Maça Çık" ile 3v3 dövüşü canlı izleyin. Canlı maçta Hücum, Savunma ve Odaklan komutları verebilir, hızı 1x/2x/4x yapabilir veya sonucu anında simüle edebilirsiniz.' },
    { s: 'hub', sel: '.news', t: 'Maç Sonucu', x: 'Maç bitince sonuç ekranında her gladyatörün hasarı, elemeleri ve durumu gösterilir. Sonuçlar, sakatlıklar ve önemli olaylar haber akışına da düşer.' },
    { s: 'market', sel: '.market-filters', t: 'Transfer Pazarı', x: 'Transfer dönemlerinde (sezon başı + 1. hafta, 15–16. haftalar) gladyatörleri filtreleyin, bonservis teklifi yapın ve sözleşme görüşün. Kadronuz 5 kişiyse önce yer açmanız gerekir.' },
    { s: 'hub', sel: '#btn-next', t: 'Haftayı İlerletme', x: '"Sonraki Hafta" ile takvim ilerler. Maçınız olan haftada oynama ya da simüle etme seçimi size sorulur; maçınızı asla yanlışlıkla kaybetmezsiniz. İyi şanslar, Lanista!' }
  ],
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
      <div class="row"><button class="btn ghost sm" data-a="tutSkip">Rehberi atla</button><span class="right"></span>${this.i > 0 ? '<button class="btn sm" data-a="tutPrev">Geri</button>' : ''}<button class="btn gold sm" data-a="tutNext">${this.i === this.steps.length - 1 ? 'Bitir' : 'İleri'}</button></div></div>`;
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

// ---------------------------------------------------------------- boot
(function boot() {
  if (typeof document === 'undefined') return;
  const start = () => {
    UI.init();
    try { const s = localStorage.getItem('ad_sound'); if (s === '0') Sfx.setOn(false); } catch (e) { }
    SaveManager.init().then(() => Title.show());
    window.addEventListener('error', e => { console.error(e.error || e.message); });
    // keep the save safe if the tab is hidden/closed mid-session
    document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.player >= 0 && !Game.busy) SaveManager.save(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
