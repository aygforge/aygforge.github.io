// Ayarlar: ses/müzik/titreşim/azaltılmış hareket/yüksek kontrast/düşük güç/arayüz boyutu/dil hazırlığı/tam ekran,
// kayıt bilgisi, dışa/içe aktarma, iki onaylı silme, ?debug=1 geliştirici paneli.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  D.Scenes.applySettings = () => {
    const st = D.Game.settings;
    document.getElementById('stage').classList.toggle('hc', !!st.highContrast);
    document.getElementById('stage').classList.toggle('rm', !!st.reducedMotion);
    D.Audio.applySettings();
  };
  D.Scenes.openSettings = () => {
    const m = D.UI.modal({
      title: 'Ayarlar', width: 1600, height: D.UI.view.H - 110,
      body: (b) => {
        const render = () => {
          D.UI.clear(b);
          const st = D.Game.settings; const s = D.Game.state;
          const save = () => { D.Game.saveSettings(); D.Scenes.applySettings(); };
          const slider = (key, label) => { const r = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: st[key] }); r.addEventListener('input', () => { st[key] = +r.value; save(); }); return h('div', { class: 'row' }, h('span', { style: { width: '320px' } }, label), r, h('span', { class: 'small' }, Math.round(st[key] * 100) + '%')); };
          const toggle = (key, label) => { const c = h('input', { type: 'checkbox' }); c.checked = !!st[key]; c.style.width = '50px'; c.style.height = '50px'; c.addEventListener('change', () => { st[key] = c.checked; save(); if (key === 'lowPower') D.UI.layout(); }); return h('label', { class: 'toggle' }, c, label); };
          b.append(h('h3', null, 'Ses ve dokunuş'), slider('music', 'Müzik'), slider('sfx', 'Ses efektleri'), h('div', { class: 'row wrap' }, toggle('mute', 'Tüm sesi kapat'), toggle('haptics', 'Titreşim')),
            h('h3', null, 'Erişilebilirlik ve performans'), h('div', { class: 'row wrap' }, toggle('reducedMotion', 'Azaltılmış hareket'), toggle('highContrast', 'Yüksek kontrast'), toggle('lowPower', 'Düşük güç (30 FPS, 1× çözünürlük)')),
            h('div', { class: 'row' }, h('span', null, 'Arayüz boyutu'), ...[1, 1.15, 1.3].map((v) => btn(Math.round(v * 100) + '%', () => { st.uiScale = v; save(); D.UI.layout(); D.SM.rebuild(); render(); }, { cls: 'small ' + (st.uiScale === v ? 'green' : '') }))),
            h('div', { class: 'row' }, h('span', null, 'Dil'), h('select', { disabled: true }, h('option', null, 'Türkçe')), h('span', { class: 'tiny muted' }, 'İçerik verileri yerelleştirmeye hazır; bu sürümde yalnız Türkçe.')),
            h('h3', null, 'Ekran'), h('div', { class: 'row wrap' }, btn(D.UI.fullscreen.active() ? 'Tam Ekrandan Çık' : 'Tam Ekran', async () => { await D.UI.fullscreen.toggle(); setTimeout(render, 300); }, { cls: 'wood' }), h('span', { class: 'tiny muted' }, D.UI.fullscreen.supported() ? 'Tam ekran dokunmayla açılır; tarayıcı izin vermezse bilgi verilir.' : 'Bu tarayıcı tam ekran API\'sini desteklemiyor (iOS Safari: Ana Ekrana Ekle).')));
          if (s) {
            b.append(h('h3', null, 'Kayıt'), h('div', { class: 'kv' }, h('b', null, 'Sürüm'), h('span', null, 'Oyun v' + D.VERSION + ' · kayıt şeması v' + s.schemaVersion), h('b', null, 'Son kayıt'), h('span', null, new Date(s.savedAt).toLocaleString('tr-TR')), h('b', null, 'Aktif oyun süresi'), h('span', null, D.fmtTime(s.clock.playTime)), h('b', null, 'Yakalanan'), h('span', null, s.stats.fishCaught + ' balık · ' + Object.keys(s.collection).length + '/88 tür'), h('b', null, 'Seed'), h('span', null, String(s.seed))),
              h('div', { class: 'row wrap' },
                btn('Şimdi Kaydet', () => { if (D.Game.saveNow()) D.UI.toast('Kaydedildi', 'good'); else D.UI.toast('Kayıt yazılamadı (tarayıcı depolaması kapalı olabilir).', 'bad'); }, { cls: 'green' }),
                btn('Dışa Aktar (dosya)', () => { const txt = D.Save.exportText(D.Game.state); const a = h('a', { href: URL.createObjectURL(new Blob([txt], { type: 'application/json' })), download: 'dumen-kayit-' + new Date().toISOString().slice(0, 10) + '.json' }); document.body.append(a); a.click(); a.remove(); }, {}),
                btn('Panoya Kopyala', async () => { try { await navigator.clipboard.writeText(D.Save.exportText(D.Game.state)); D.UI.toast('Kayıt metni kopyalandı', 'good'); } catch (e) { D.UI.toast('Kopyalanamadı; dosya ile dışa aktar.', 'bad'); } }, {}),
                btn('Kaydı Sil…', () => D.UI.confirm('Kayıt silinsin mi?', 'Tüm ilerlemen silinecek.', () => D.UI.confirm('Son onay', 'Gerçekten silinsin mi? (Geri alınamaz.)', () => { D.Save.wipe(); D.Game.state = null; D.UI.closeAll(); D.SM.go('menu'); }, { yesLabel: 'Evet, sil', cls: 'red' }), { yesLabel: 'Devam', cls: 'yellow' }), { cls: 'red' })));
          }
          const ta = h('textarea', { placeholder: 'Dışa aktarılmış kayıt metnini buraya yapıştır…' });
          const file = h('input', { type: 'file', accept: '.json,application/json' });
          const doImport = (txt) => {
            try { const ns = D.Save.importText(txt); D.UI.confirm('İçe aktar?', 'Mevcut kayıt bu kayıtla değiştirilecek (eski kayıt yedeklenir).', () => { D.Game.state = ns; D.Game.saveNow(); D.UI.closeAll(); D.SM.go('town'); D.UI.toast('Kayıt yüklendi', 'good'); }); }
            catch (e) { D.UI.toast('Geçersiz kayıt: ' + e.message, 'bad', 4000); }
          };
          file.addEventListener('change', () => { const f = file.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => doImport(String(rd.result)); rd.readAsText(f); });
          b.append(h('h3', null, 'İçe aktar'), h('div', { class: 'row wrap' }, file, btn('Metinden Yükle', () => doImport(ta.value), { cls: 'small' })), ta);
          if (D.Game.debug && s) b.append(D.Scenes.debugPanel(render));
          b.append(h('div', { class: 'tiny muted', style: { marginTop: '20px' } }, 'Reklam: bu sürümde gerçek reklam SDK\'sı yok; reklamlı çark hakları devre dışıdır. Oyun internet bağlantısı olmadan çalışır.'));
        };
        render();
      }
    });
    return m;
  };
  // Yalnız ?debug=1 — üretim oynanışını bozmaz, açıkça işaretlidir.
  D.Scenes.debugPanel = (rerender) => {
    const r = D.dataReport || D.Validate.run();
    const dbg = (fn, msg) => { const res = D.Game.act('setFlagDebug', { debug: true, fn }); D.UI.toast(res.ok ? 'DEBUG: ' + msg : res.message, res.ok ? 'gold' : 'bad'); rerender(); D.SM.rebuild(); };
    return h('div', { class: 'col debug-only', style: { padding: '16px', marginTop: '20px' } },
      h('h3', null, 'DEBUG (yalnız ?debug=1)'),
      h('div', { class: 'tiny' }, 'Veri doğrulama: ' + (r.ok ? 'OK' : r.errors.length + ' hata') + ' · balık ' + r.facts.fishCount + ' · eşya ' + r.facts.itemCount + ' · legendary ' + r.facts.legendary + ' · boss ' + r.facts.boss + ' · sipariş şablonu ' + r.facts.orders),
      h('div', { class: 'row wrap' },
        btn('+5000 coin', () => dbg((s) => { s.wallet.CUR_COIN += 5000; }, 'coin'), { cls: 'small' }),
        btn('+200 Miyav', () => dbg((s) => { s.wallet.CUR_MIYAV += 200; }, 'miyav'), { cls: 'small' }),
        btn('Tüm materyaller +20', () => dbg((s) => { for (const id of Object.keys(D.ItemDBSource.ItemDB)) if (D.ItemDBSource.ItemDB[id].category === 'material') s.inv.items[id] = (s.inv.items[id] || 0) + 20; }, 'materyal'), { cls: 'small' }),
        btn('Tüm özel eşya +1', () => dbg((s) => { for (let i = 1; i <= 25; i++) { const id = 'SPC_' + D.pad2(i); s.inv.items[id] = (s.inv.items[id] || 0) + 1; } }, 'özel'), { cls: 'small' }),
        btn('Tekne +1', () => dbg((s) => { if (s.boat.level < 10) s.boat.level++; s.inv.items.TCK_BOATYARD_PERMIT = 1; D.Actions.syncRegions(s); }, 'tekne'), { cls: 'small' }),
        btn('Bermuda koordinatı', () => dbg((s) => { s.flags.bermudaCoords = true; D.Actions.syncRegions(s); }, 'bayrak'), { cls: 'small' }),
        btn('Tazelik +10 dk', () => dbg((s) => { s.clock.playTime += 600; }, 'zaman'), { cls: 'small' }),
        btn('Hikâye adımını geç', () => dbg((s) => { const ch = D.Quests.activeChapters(s)[0]; if (ch) D.Quests.advanceStep(s, ch, { events: [] }); }, 'hikâye'), { cls: 'small' })));
  };
})(globalThis.DUMEN);
