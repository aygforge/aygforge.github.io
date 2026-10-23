// Parti arayüzü (Faz 1): kur / kodla katıl / davet et, üyeler (sınıf, seviye, harita, can), yanına git, lideri takip,
// parti sohbeti ve gelen davet penceresi. Durum değişince (bus 'party' / 'online') açık pencere kendini yeniler.
import { h, clear } from '../dom.js';
import { ui } from '../ui.js';
import { bus } from '../../core/events.js';
import { app } from '../../core/app.js';
import { CLASSES } from '../../data/classes.js';
import { online } from '../../online/index.js';
import { partyGame, mapName } from '../../online/partyGame.js';
import { PARTY_MAX } from '../../online/party.js';
import { openOnline } from './online.js';

const toast = (text, kind = 'info') => bus.emit('toast', { text, kind });
const clsName = (c) => CLASSES[c]?.name || c || '?';

// pencere açıkken olaylarla yenilenen gövde
function live(render, events = ['party', 'online']) {
  const box = h('div', { class: 'col' });
  const draw = () => {
    if (box.dataset.mounted && !box.isConnected) { offs.forEach((f) => f()); return; }
    box.dataset.mounted = '1';
    clear(box);
    render(box);
  };
  const offs = events.map((e) => bus.on(e, draw));
  draw();
  return box;
}

export function openParty() {
  if (online.configured && !online.players) online.loadPlayers();
  const body = live((box) => renderParty(box));
  ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '92vh', minWidth: 'min(480px, 92vw)' }, 'data-testid': 'party-dlg' },
    h('h3', { class: 't' }, 'Parti'), body,
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Kapat'))));
}

function renderParty(box) {
  if (!online.configured || !online.loggedIn) {
    box.append(h('p', { class: 'small' }, 'Parti kurmak ve arkadaşlarınla birlikte gezmek için çevrimiçi hesapla giriş yap.'),
      h('button', { class: 'btn green', onTap: () => { ui.closeModal(); openOnline(); } }, 'Çevrimiçi giriş'));
    return;
  }
  const pg = partyGame;
  pg.ensure();
  const p = pg.party;
  // gelen davetler
  for (const inv of pg.invites) {
    box.append(h('div', { class: 'row small box', 'data-testid': 'party-invite-row' },
      h('span', { class: 'grow' }, h('b', {}, inv.nick), ' seni partiye çağırıyor'),
      h('button', { class: 'btn small green', 'data-testid': 'invite-accept', onTap: () => { const r = pg.answer(inv, true); if (!r.ok) toast(r.msg, 'warn'); } }, 'Katıl'),
      h('button', { class: 'btn small ghost', 'data-testid': 'invite-decline', onTap: () => pg.answer(inv, false) }, 'Reddet')));
  }
  if (!p.inParty) {
    const code = h('input', { class: 'name', maxlength: 8, placeholder: 'Parti kodu (ör. K7M2QX)', 'data-testid': 'party-code', style: { textTransform: 'uppercase', maxWidth: '170px' } });
    box.append(
      h('p', { class: 'small' }, `Partide en çok ${PARTY_MAX} kişi olur. Parti arkadaşların haritada görünür, nerede olduklarını görürsün, `
        + 'yanlarına gidebilir ve sohbet edebilirsin. Herkes yine kendi dünyasında savaşır (birlikte savaş sonraki aşamada).'),
      h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        h('button', { class: 'btn green', 'data-testid': 'party-create', onTap: () => { const r = pg.create(); if (!r.ok) toast(r.msg, 'warn'); } }, 'Parti kur'),
        code,
        h('button', { class: 'btn', 'data-testid': 'party-join', onTap: () => { const r = pg.join(code.value); if (!r.ok) toast(r.msg, 'warn'); } }, 'Kodla katıl')));
  } else {
    const st = { in: 'bağlı', joining: 'bağlanıyor…', error: 'bağlantı hatası — tekrar deneniyor' }[p.status] || p.status;
    box.append(h('div', { class: 'row small', 'data-testid': 'party-status' },
      h('span', { class: 'grow' }, 'Parti kodu: ', h('b', { class: 'gold', 'data-testid': 'party-code-show', style: { letterSpacing: '2px' } }, p.code), ` · ${st}`)));
    const list = h('div', { class: 'col', 'data-testid': 'party-members' });
    for (const m of p.members) list.append(memberRow(m));
    box.append(list,
      h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        h('button', { class: 'btn small green', 'data-testid': 'party-chat-open', onTap: () => openChat() }, 'Sohbet'),
        h('button', { class: 'btn small' + (pg.follow ? ' green' : ''), 'data-testid': 'party-follow', onTap: () => pg.setFollow(!pg.follow) }, pg.follow ? 'Lideri takip et: açık' : 'Lideri takip et: kapalı'),
        h('button', { class: 'btn small red', 'data-testid': 'party-leave', onTap: () => pg.leave() }, 'Partiden ayrıl')),
      h('p', { class: 'tiny muted' }, 'Kodu arkadaşına söyle ya da aşağıdan davet et. "Lideri takip et" açıksa lider başka bölgeye geçince sen de (keşfettiysen) peşinden gidersin.'));
  }
  // davet edilebilecek çevrimiçi oyuncular
  const me = pg.me();
  const inParty = new Set((p.members || []).map((m) => m.uid));
  const others = (online.players || []).filter((x) => x.user_id && x.user_id !== me?.uid);
  box.append(h('h4', { class: 't', style: { marginTop: '6px' } }, 'Çevrimiçi oyuncular'));
  if (!online.players) box.append(h('p', { class: 'small muted' }, 'Yükleniyor…'));
  else if (!others.length) box.append(h('p', { class: 'small muted' }, 'Şu an oyunda başka kimse yok.'));
  for (const x of others) {
    box.append(h('div', { class: 'row small', 'data-testid': 'party-online-row' },
      h('span', { class: 'grow' }, h('b', {}, x.nickname), x.char_name ? ` — ${x.char_name} (${clsName(x.cls)}) Lv.${x.level}` : '', ` · ${mapName(x.map)}`),
      inParty.has(x.user_id) ? h('span', { class: 'tiny muted' }, 'partide')
        : h('button', { class: 'btn small', 'data-testid': 'party-invite', onTap: () => { const r = pg.invite(x.user_id); toast(r.ok ? `${x.nickname} davet edildi` : r.msg, r.ok ? 'ok' : 'warn'); } }, 'Davet et')));
  }
}

function memberRow(m) {
  const st = m.st;
  const info = m.self ? partyGame.stateNow() : st;
  const where = info ? `${mapName(info.m)}${info.dg ? ' (dungeon)' : ''}` : 'konum bekleniyor';
  const stale = !m.self && !m.fresh;
  const go = !m.self && partyGame.canGoTo(m);
  return h('div', { class: 'row small box', 'data-testid': 'party-member', style: { opacity: stale ? 0.6 : 1 } },
    h('span', { class: 'grow' },
      m.leader ? h('b', { class: 'gold', title: 'Lider' }, '★ ') : null,
      h('b', {}, m.nick), m.self ? ' (sen)' : '',
      info ? ` — ${info.n || ''} (${clsName(info.cls)}) Lv.${info.lv}` : '',
      h('div', { class: 'tiny muted' }, where + (info ? ` · Can %${info.hp}${info.d ? ' · bayıldı' : ''}` : '') + (stale ? ' · bağlantı bekleniyor' : ''))),
    m.self ? null : h('button', {
      class: 'btn small' + (go.ok ? ' green' : ' dis'), 'data-testid': 'party-goto', title: go.ok ? '' : go.msg,
      onTap: () => { const c = partyGame.canGoTo(m); if (!c.ok) { toast(c.msg, 'warn'); return; } ui.closeModal(); partyGame.goTo(m); },
    }, info && app.world && info.m === app.world.mapId ? 'Yanına git' : 'Bölgesine git'));
}

export function openChat() {
  const input = h('input', { class: 'name', maxlength: 120, placeholder: 'Mesaj yaz…', 'data-testid': 'party-chat-input', style: { flex: '1 1 auto' } });
  const send = () => {
    const r = partyGame.chat(input.value);
    if (!r.ok) { toast(r.msg, 'warn'); return; }
    input.value = '';
    input.focus();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  const log = live((box) => {
    const p = partyGame.party;
    if (!p?.inParty) { box.append(h('p', { class: 'small muted' }, 'Partide değilsin.')); return; }
    if (!p.chat.length) box.append(h('p', { class: 'small muted' }, 'Henüz mesaj yok.'));
    for (const c of p.chat.slice(-30)) box.append(h('div', { class: 'small', 'data-testid': 'party-chat-line' }, h('b', { style: { color: c.self ? '#ffd86a' : '#9df0b0' } }, c.nick + ': '), c.text));
    setTimeout(() => { box.parentElement && (box.parentElement.scrollTop = 1e9); }, 0);
  }, ['party']);
  ui.modal(h('div', { class: 'dlg frame', 'data-testid': 'party-chat' }, h('h3', { class: 't' }, 'Parti sohbeti'),
    h('div', { class: 'scroll', style: { maxHeight: '45vh', minHeight: '80px' } }, log),
    h('div', { class: 'row' }, input, h('button', { class: 'btn green', 'data-testid': 'party-chat-send', onTap: send }, 'Gönder')),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Kapat'))));
  setTimeout(() => input.focus(), 50);
}

// gelen davet: oyunda ve başka pencere açık değilse hemen sor; değilse bildirim + Parti düğmesinde rozet
export function bindPartyUi() {
  bus.on('partyInvite', (inv) => {
    if (!app.world) return;
    if (ui.isOpen()) { toast(`${inv.nick} seni partiye çağırıyor — Parti düğmesine dokun`, 'level'); return; }
    const cur = partyGame.invites.find((x) => x.from === inv.from);
    if (!cur) return;
    ui.modal(h('div', { class: 'dlg frame', 'data-testid': 'invite-dlg' }, h('h3', { class: 't' }, 'Parti daveti'),
      h('p', {}, h('b', {}, inv.nick), ' seni partisine çağırıyor.'),
      partyGame.party?.inParty ? h('p', { class: 'small muted' }, 'Kabul edersen şu anki partinden ayrılırsın.') : null,
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        h('button', { class: 'btn ghost', 'data-testid': 'invite-decline', onTap: () => { ui.closeModal(); partyGame.answer(cur, false); } }, 'Reddet'),
        h('button', { class: 'btn green', 'data-testid': 'invite-accept', onTap: () => { ui.closeModal(); const r = partyGame.answer(cur, true); if (!r.ok) toast(r.msg, 'warn'); } }, 'Katıl'))));
  });
}
