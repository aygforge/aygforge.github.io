/*
 * Mahjong: Zen Journey — debug tools, only installed with ?debug=1.
 * Level jump, free-tile / coordinate overlays, available-match list, layout
 * hash, solution playback and the in-browser 500-level validation.
 */
(function (root) {
  'use strict';
  const Core = root.MJCore, A = root.MJAssets, V = root.MJValidator;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let lastReport = null;

  function install(app) {
    const fab = document.createElement('button');
    fab.className = 'dbg-fab';
    fab.setAttribute('aria-label', 'Hata ayıklama paneli');
    fab.innerHTML = A.ICONS.bug;
    fab.addEventListener('click', () => open(app));
    document.getElementById('app').appendChild(fab);
    root.MJDebugState = { lastReport: () => lastReport };
  }

  function info(app) {
    const s = app.session;
    if (!s || app.screen !== 'game') return 'Oynanan bölüm yok.';
    const lv = s.level;
    const sig = Core.layoutSignature(lv.tiles);
    const b = Core.layoutBounds(lv.tiles);
    const free = s.st.freeList();
    const pairs = s.availablePairs();
    const lines = [
      `Bölüm ${s.levelNo}  aile=${Core.FAMILIES[lv.family]}  taş=${s.n}  katman=${b.layers}`,
      `hash=${sig.hash}  ızgara=${b.spanX / 2}x${b.spanY / 2}`,
      `kalan=${s.remaining}  serbest=${free.length}  hamle=${s.moves}  ipucu=${s.hints}  karıştırma=${s.shuffles}  geri alma=${s.undos}`,
      `şimdi kazanılsa yıldız: ${s.stars()}`,
      `mevcut eşleşmeler (${pairs.length}):`
    ];
    for (const [a, c] of pairs.slice(0, 40)) {
      const ta = s.tiles[a], tc = s.tiles[c];
      lines.push(`  #${a}(${ta.x},${ta.y},${ta.z}) + #${c}(${tc.x},${tc.y},${tc.z})  ${Core.faceInfo(s.faces[a]).label} / ${Core.faceInfo(s.faces[c]).label}`);
    }
    return lines.join('\n');
  }

  function reportHTML(rep) {
    if (!rep) return '';
    const S = rep.summary;
    const rows = V.CHECKS.map((k) => `<tr><td>${k}</td><td>${S.passCounts[k]} / ${S.total}</td></tr>`).join('');
    const fails = S.failed.length ? S.failed.slice(0, 20).map((f) => `Bölüm ${f.n}: ${esc(f.errors.join('; '))}`).join('\n') : 'yok';
    return `<table>${rows}<tr><td><b>tamamen geçerli</b></td><td><b>${S.passed} / ${S.total}</b></td></tr><tr><td>benzersiz hash</td><td>${S.uniqueHashes}</td></tr><tr><td>benzersiz geometri</td><td>${S.uniqueGeometries}</td></tr><tr><td>toplam taş</td><td>${S.totalTiles}</td></tr><tr><td>en küçük taş genişliği @360x640</td><td>${S.minMobileTileWidth}px</td></tr></table><pre>hatalar: ${fails}</pre>`;
  }

  function open(app) {
    const r = app.renderer;
    const el = app.ui.open(`<div class="modal-head"><h2>Hata Ayıklama</h2><button class="icon-btn" data-m="close" data-icon="close" aria-label="Kapat"></button></div>
      <div class="dbg">
        <div class="row"><input type="number" min="1" max="500" value="${app.levelNo}" data-lv><button class="btn small primary" data-m="go">Bölüme git</button><button class="btn small" data-m="unlock">Tümünü aç</button></div>
        <div class="row"><button class="btn small" data-m="free">Serbest taşları ${r.debug.free ? 'gizle' : 'göster'}</button><button class="btn small" data-m="coords">Koordinatları ${r.debug.coords ? 'gizle' : 'göster'}</button></div>
        <div class="row"><button class="btn small" data-m="play">Kayıtlı çözümü oynat</button><button class="btn small" data-m="solve">Buradan otomatik çöz</button><button class="btn small" data-m="win">Anında kazan</button></div>
        <pre data-info>${esc(info(app))}</pre>
        <div class="row"><button class="btn small primary" data-m="validate">500 bölümün hepsini doğrula</button><span data-prog></span></div>
        <div data-report>${reportHTML(lastReport)}</div>
      </div>`, {
      actions: {
        close: () => app.ui.close(),
        go: () => {
          const n = Math.max(1, Math.min(500, parseInt(el.querySelector('[data-lv]').value, 10) || 1));
          const d = app.save.data;
          d.progress.unlocked = Math.max(d.progress.unlocked, n);
          for (let w = 0; w <= Core.levelMeta(n).world; w++) if (!d.seen.worlds.includes(w)) d.seen.worlds.push(w);
          app.save.save();
          app.ui.closeNow();
          app.startLevel(n, { resume: false, skipIntro: true });
        },
        unlock: () => { app.save.data.progress.unlocked = 500; app.save.save(); app.ui.toast('Tüm bölümler açıldı'); },
        free: () => { r.debug.free = !r.debug.free; r.invalidate(); app.ui.close(); },
        coords: () => { r.debug.coords = !r.debug.coords; r.invalidate(); app.ui.close(); },
        play: () => { app.ui.closeNow(); app.playSolution(false, 180); },
        solve: () => { app.ui.closeNow(); app.playSolution(true, 180); },
        win: () => { app.ui.closeNow(); app.playSolution(false, 1); },
        validate: () => {
          const prog = el.querySelector('[data-prog]');
          V.validateAllAsync(root.MJ_LEVELS, (k) => { prog.textContent = `${k} / 500`; }).then((rep) => {
            lastReport = rep;
            root.MJLastValidation = rep.summary;
            prog.textContent = `bitti: ${rep.summary.passed} / 500 geçerli`;
            el.querySelector('[data-report]').innerHTML = reportHTML(rep);
          });
        }
      }
    });
  }

  root.MJDebug = { install, open };
}(typeof globalThis !== 'undefined' ? globalThis : this));
