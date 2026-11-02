// Oyun durumu sahibi: state (kayıt) + settings + act() + zaman/bakım + otomatik kayıt.
(function (D) {
  'use strict';
  const Game = {
    state: null,
    settings: null,
    debug: false,
    active: false, // aktif oyun saati akıyor mu (menü dışında ve sekme görünürken)
    _saveTimer: null,
    _maintAcc: 0,
    lastResult: null,

    init(opts) {
      opts = opts || {};
      this.debug = !!opts.debug;
      this.settings = D.Save.loadSettings();
    },
    newGame(seed) {
      seed = seed == null ? (Math.floor(Math.random() * 4294967295) >>> 0) : seed >>> 0;
      this.state = D.Save.newState(seed);
      this.state.wallet.CUR_COIN = D.EconomyConfig.startCoins;
      this.act('maintenance', { dayKey: D.Clock.dayKey(this.state), forceBoard: true });
      this.saveNow();
      return this.state;
    },
    loadSaved() {
      const r = D.Save.load();
      if (r.state) {
        this.state = r.state;
        this.act('maintenance', { dayKey: D.Clock.dayKey(this.state) });
      }
      return r;
    },
    act(name, payload) {
      const a = D.Actions[name];
      if (!a) throw new Error('Bilinmeyen eylem: ' + name);
      payload = payload || {};
      if (!this.state) return { ok: false, message: 'Oyun yüklenmedi.' };
      const txId = a.txId(this.state, payload);
      const once = a.once ? a.once(this.state, payload) : false;
      const res = D.Tx.run(this.state, txId, (draft, ctx) => {
        const r = a.run(draft, payload, ctx);
        D.Actions.after(draft, ctx);
        return r;
      }, { once });
      if (res.ok) {
        this.state = res.state;
        delete res.state;
        this.scheduleSave();
        D.bus.emit('state', { action: name, result: res });
        for (const ev of res.events || []) D.bus.emit('gameEvent', ev);
      } else {
        D.bus.emit('txFail', { action: name, result: res });
      }
      this.lastResult = res;
      return res;
    },
    // Her karede çağrılır (dt sn).
    tick(dt) {
      if (!this.state || !this.active) return;
      D.Clock.tick(this.state, dt);
      this._maintAcc += dt;
      if (this._maintAcc >= 1) {
        this._maintAcc = 0;
        const s = this.state;
        const dk = D.Clock.dayKey(s);
        const due = s.daily.dayKey !== dk || s.clock.playTime >= s.board.nextRefreshAt ||
          Object.values(s.orders).some((o) => o.state === 'ACTIVE' && o.expiresAt && s.clock.playTime > o.expiresAt);
        if (due) this.act('maintenance', { dayKey: dk });
        if (Math.floor(s.clock.playTime) % 15 === 0) this.scheduleSave();
      }
    },
    scheduleSave() {
      if (this._saveTimer) return;
      this._saveTimer = setTimeout(() => { this._saveTimer = null; this.saveNow(); }, 300);
    },
    saveNow() {
      if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
      if (!this.state) return false;
      const ok = D.Save.write(this.state);
      if (!ok) D.bus.emit('saveFail', {});
      return ok;
    },
    saveSettings() { D.Save.saveSettings(this.settings); D.bus.emit('settings', this.settings); }
  };
  D.Game = Game;
})(globalThis.DUMEN);
