'use strict';
/* start.js : tüm modüller yüklendikten sonra çekirdek atlasları bekler, ardından özgün boot() akışını başlatır.
   Atlas yüklenemezse (dosya yok / file:// kirlenmesi) oyun prosedürel çizimle aynen açılır.
   Ayrıca sahne geçişlerinde (go) ilgili çevre gruplarını önceden yükler — oyun mantığına dokunmaz. */
(() => {
  const AM = AssetManager;
  const season = d => (typeof World !== 'undefined' && S) ? World.season(d) : 'spring';
  function prefetch(name, params) {
    if (!AM.enabled || !S) return;
    const s = season();
    if (['MainMenu', 'Town', 'Home', 'PierFishing', 'Shore', 'EndDay'].includes(name)) AM.want('season_' + s);
    if (name === 'EndDay') AM.want('season_' + season(S.day + 1));                    // ertesi gün mevsim değişebilir
    if (name === 'SeaMap' || name === 'Town') for (const r of REGIONS) if (name === 'SeaMap' || r.id === S.regionId) AM.want('region_' + r.id + '_' + s);
    if (name === 'BoatFishing' && params && params.rid) AM.want('region_' + params.rid + '_' + s);
  }
  const _go = go;
  go = function (name, params) { try { prefetch(name, params); } catch (e) { } return _go(name, params); };
  (async () => {
    const t0 = performance.now();
    let r = null;
    try { r = await AM.load(); } catch (e) { console.warn('[AssetManager] yükleme hatası, prosedürel mod', e); AM.disable('load error'); }
    window.__COZFIS_START = { assetsMs: Math.round(performance.now() - t0), assets: r };
    await boot();
    try { if (S) { AM.want('season_' + season()); if (S.regionId) AM.want('region_' + S.regionId + '_' + season()); } } catch (e) { }
  })();
})();
