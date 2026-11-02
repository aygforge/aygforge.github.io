// Atomik işlem çatısı: doğrula → hesapla → uygula (taslak üzerinde) → değişmezleri kontrol et → commit.
// Başarısızlıkta hiçbir kısmi değişiklik kalmaz. Aynı txId ikinci kez işlenmez (idempotency).
(function (D) {
  'use strict';
  const MAX_RECENT = 600;

  function checkInvariants(s) {
    for (const [k, v] of Object.entries(s.wallet)) {
      if (!D.isInt(v) || v < 0) D.fail('Geçersiz cüzdan değeri: ' + k + '=' + v, 'INVARIANT');
    }
    for (const [k, v] of Object.entries(s.inv.items)) {
      if (!D.isInt(v) || v < 0) D.fail('Geçersiz stok: ' + k + '=' + v, 'INVARIANT');
      if (v === 0) delete s.inv.items[k];
    }
    for (const [k, v] of Object.entries(s.inv.trash)) {
      if (!D.isInt(v) || v < 0) D.fail('Geçersiz çöp stoku: ' + k, 'INVARIANT');
      if (v === 0) delete s.inv.trash[k];
    }
    const ids = new Set();
    for (const f of s.inv.fish) {
      if (ids.has(f.instanceId)) D.fail('Çift balık örneği: ' + f.instanceId, 'INVARIANT');
      ids.add(f.instanceId);
    }
    for (const c of s.inv.chests) {
      if (ids.has(c.instanceId)) D.fail('Çift sandık örneği: ' + c.instanceId, 'INVARIANT');
      ids.add(c.instanceId);
    }
  }

  const Tx = {
    checkInvariants,
    hasProcessed(state, txId) { return state.tx.recent.includes(txId) || !!state.tx.once[txId]; },
    // fn(draft, ctx) → sonuç objesi. once: true ise txId kalıcı olarak saklanır.
    run(state, txId, fn, opts) {
      opts = opts || {};
      if (!txId) throw new Error('txId gerekli');
      if (Tx.hasProcessed(state, txId)) return { ok: false, duplicate: true, txId, message: 'Bu işlem zaten yapıldı.' };
      const draft = D.clone(state);
      const ctx = { events: [], txId, toasts: [] };
      let result;
      try {
        result = fn(draft, ctx) || {};
        checkInvariants(draft);
      } catch (e) {
        if (e instanceof D.TxError) return { ok: false, txId, message: e.userMessage, code: e.code };
        console.error('[Tx]', txId, e);
        return { ok: false, txId, message: 'Beklenmeyen hata: ' + e.message, code: 'EXCEPTION' };
      }
      if (opts.once) draft.tx.once[txId] = 1;
      else {
        draft.tx.recent.push(txId);
        if (draft.tx.recent.length > MAX_RECENT) draft.tx.recent.splice(0, draft.tx.recent.length - MAX_RECENT);
      }
      draft.tx.count = (draft.tx.count || 0) + 1;
      return Object.assign({ ok: true, txId, state: draft, events: ctx.events }, result);
    }
  };
  D.Tx = Tx;
})(globalThis.DUMEN);
