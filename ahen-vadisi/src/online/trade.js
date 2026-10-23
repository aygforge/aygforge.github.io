// Ticaret (istemci): oyun sunucusu aracılığıyla iki oyuncu arasında eşya / malzeme / altın takası.
// Kurallar ve hep-ya-hiç uygulama: src/systems/trade.js. Arayüz: src/ui/panels/trade.js.
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { net } from './gameServer.js';
import { sanitizeOffer, canTrade, applyTrade, canGive, emptyOffer } from '../systems/trade.js';

const toast = (text, kind = 'info') => bus.emit('toast', { text, kind });

export const trade = {
  session: null,       // { id, with: {uid, nick}, mine, theirs, lock, conf, phase }
  incoming: null,      // bekleyen istek { from, nick }
  draft: emptyOffer(), // henüz gönderilmemiş benim teklifim (sunucu durumu gelene kadar)

  send(op, extra = {}) { return net.send({ t: 'trade', op, ...extra }); },

  request(uid) {
    if (!net.ready) return { ok: false, msg: 'Ticaret için oyun sunucusuna bağlı olmalısın' };
    if (this.session) return { ok: false, msg: 'Zaten bir ticaret açık' };
    this.send('req', { to: uid });
    return { ok: true };
  },
  answer(ok) {
    const inv = this.incoming;
    this.incoming = null;
    if (inv) this.send('ans', { from: inv.from, ok: !!ok });
    bus.emit('trade', 'incoming');
  },
  cancel() { if (this.session) this.send('cancel', { id: this.session.id }); },

  // teklifimi güncelle (eşya uid'leri, istifler, altın) — her değişiklik iki tarafın kilidini açar
  setOffer(offer) {
    const s = this.session;
    if (!s || s.phase !== 'open') return { ok: false };
    const ch = app.char;
    const clean = sanitizeOffer(offer);
    const g = canGive(ch, clean);
    if (!g.ok) return g;
    this.draft = clean;
    this.send('offer', { id: s.id, offer: clean });
    return { ok: true };
  },
  lock(on = true) { if (this.session) this.send('lock', { id: this.session.id, on: !!on }); },
  confirm() { if (this.session) this.send('confirm', { id: this.session.id }); },

  onMessage(m) {
    switch (m.op) {
      case 'req':
        this.incoming = { from: m.from, nick: m.nick };
        bus.emit('tradeRequest', this.incoming);
        bus.emit('trade', 'incoming');
        return;
      case 'sent': toast(`${m.nick} oyuncusuna ticaret isteği gönderildi`, 'info'); return;
      case 'declined': toast(`${m.nick} ticaret isteğini reddetti`, 'info'); return;
      case 'err': toast(m.msg, 'warn'); return;
      case 'open':
        this.session = { id: m.id, with: m.with, mine: emptyOffer(), theirs: emptyOffer(), lock: {}, conf: {}, phase: 'open' };
        this.draft = emptyOffer();
        bus.emit('tradeOpen', this.session);
        return;
      case 'state': {
        const s = this.session;
        if (!s || s.id !== m.id) return;
        s.mine = sanitizeOffer(m.mine); s.theirs = sanitizeOffer(m.theirs);
        s.lock = m.lock || {}; s.conf = m.conf || {};
        bus.emit('trade', 'state');
        return;
      }
      case 'prep': {
        const s = this.session;
        if (!s || s.id !== m.id) return;
        s.phase = 'prep';
        const r = app.char ? canTrade(app.char, sanitizeOffer(m.give), sanitizeOffer(m.get)) : { ok: false, msg: 'Karakter yok' };
        this.send('ready', { id: m.id, ok: r.ok, msg: r.msg || '' });
        bus.emit('trade', 'state');
        return;
      }
      case 'exec': {
        const ch = app.char;
        const r = ch ? applyTrade(ch, sanitizeOffer(m.give), sanitizeOffer(m.get)) : { ok: false, msg: 'Karakter yok' };
        this.session = null;
        if (r.ok) {
          toast(`Ticaret tamamlandı (${m.get.items?.length || 0} eşya, ${m.get.stacks?.length || 0} malzeme, ${m.get.gold || 0} Gold alındı)`, 'ok');
          app.changed('inventory');
          app.flushSave('trade');
        } else toast('Ticaret uygulanamadı: ' + r.msg, 'warn');
        bus.emit('trade', 'done');
        return;
      }
      case 'cancel':
        if (!this.session || (m.id && this.session.id !== m.id)) return;
        this.session = null;
        toast(m.msg || 'Ticaret iptal edildi', 'info');
        bus.emit('trade', 'cancel');
        return;
      default: return;
    }
  },
};

net.onTrade = (m) => trade.onMessage(m);
