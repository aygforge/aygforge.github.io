// Çevrimiçi (test) arayüzü: giriş/kayıt, bulut kaydı, liderlik tablosu, hata/öneri bildirimi, sunucu ayarı.
// Ayarlar sekmesinde ve ana menüde aynı kutu kullanılır; durum değişince (bus 'online') kendini yeniler.
import { h, clear, fmt } from '../dom.js';
import { ui } from '../ui.js';
import { bus } from '../../core/events.js';
import { online } from '../../online/index.js';
import { validateConfig, shareCode, parseShareCode } from '../../online/config.js';
import { summarize } from '../../online/cloud.js';
import { CLASSES } from '../../data/classes.js';
import { app } from '../../core/app.js';
import { confirmImport } from './settings.js';

const fmtTime = (t) => (t ? new Date(t).toLocaleString('tr-TR') : '—');
const chars = (sum) => (sum || []).map((c) => `${c.name} Lv.${c.level}`).join(', ') || 'karakter yok';
const toast = (text, kind = 'info') => bus.emit('toast', { text, kind });

// Düğme: çalışırken kilitlenir (çift dokunma ile çift istek olmaz)
function actBtn(label, cls, testid, fn) {
  const b = h('button', { class: 'btn small ' + cls, 'data-testid': testid, onTap: async () => {
    if (b.classList.contains('dis')) return;
    b.classList.add('dis');
    try { await fn(); } finally { b.classList.remove('dis'); }
  } }, label);
  return b;
}

export function onlineBox() {
  const box = h('div', { class: 'col box', 'data-testid': 'online-box' });
  const render = () => {
    if (!box.isConnected && box.dataset.mounted) { off(); return; }
    box.dataset.mounted = '1';
    clear(box);
    box.append(h('h3', { class: 't' }, 'Çevrimiçi (test)'));
    const status = h('div', { class: 'col small', 'data-testid': 'online-status' });
    const row = (k, v, warn) => status.append(h('div', { class: 'row small' }, h('span', { class: 'muted', style: { minWidth: '120px' } }, k), h('b', { class: warn ? 'warn' : '' }, v)));
    box.append(status);
    if (!online.configured) {
      row('Durum', 'Sunucu ayarlanmadı');
      box.append(h('p', { class: 'tiny muted' }, 'Bulut kaydı, liderlik tablosu ve hata bildirimi için ücretsiz bir Supabase projesi gerekir. Sunucuyu kuran kişi sana bir "sunucu kodu" (AHO1:…) verirse buraya gir. Oyun çevrimiçi olmadan da tamamen çalışır.'),
        h('div', { class: 'row', style: { flexWrap: 'wrap' } }, h('button', { class: 'btn small', 'data-testid': 'online-server', onTap: () => serverModal() }, 'Sunucu ayarı')));
      return;
    }
    if (!online.loggedIn) {
      row('Durum', 'Giriş yapılmadı');
      box.append(
        h('div', { class: 'row', style: { flexWrap: 'wrap' } },
          h('button', { class: 'btn small green', 'data-testid': 'online-login', onTap: () => authModal('login') }, 'Giriş yap'),
          h('button', { class: 'btn small', 'data-testid': 'online-register', onTap: () => authModal('register') }, 'Kayıt ol'),
          h('button', { class: 'btn small', 'data-testid': 'online-board', onTap: () => boardModal() }, 'Liderlik tablosu'),
          h('button', { class: 'btn small', 'data-testid': 'online-feedback', onTap: () => feedbackModal() }, 'Hata/öneri bildir'),
          online.source === 'local' ? h('button', { class: 'btn small ghost', onTap: () => serverModal() }, 'Sunucu ayarı') : null),
        h('p', { class: 'tiny muted' }, 'Giriş yapınca ilerlemen buluta da yedeklenir; başka cihazda aynı hesapla "Buluttan yükle" ile devam edebilirsin.'));
      return;
    }
    const meta = online.cloudMeta;
    row('Oyuncu', `${online.nickname || '—'} (${online.api.user?.email || ''})`);
    row('Bulut kaydı', meta ? `${fmtTime(meta.updated_at)} · ${chars(meta.summary)}` : online.metaLoaded ? 'henüz yok' : 'okunuyor…');
    if (online.lastError) row('Son hata', online.lastError, true);
    const auto = h('button', { class: 'btn small' + (online.autoSync ? ' green' : ''), 'data-testid': 'online-auto', onTap: () => online.setAutoSync(!online.autoSync) }, online.autoSync ? 'Otomatik bulut kaydı: açık' : 'Otomatik bulut kaydı: kapalı');
    box.append(
      h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        actBtn('Buluta kaydet', 'green', 'online-upload', () => uploadFlow()),
        actBtn('Buluttan yükle', '', 'online-restore', () => restoreFlow()),
        auto),
      h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        h('button', { class: 'btn small', 'data-testid': 'online-board', onTap: () => boardModal() }, 'Liderlik tablosu'),
        h('button', { class: 'btn small', 'data-testid': 'online-feedback', onTap: () => feedbackModal() }, 'Hata/öneri bildir'),
        online.source === 'local' ? h('button', { class: 'btn small ghost', onTap: () => shareModal() }, 'Sunucu kodunu paylaş') : null,
        actBtn('Çıkış yap', 'ghost', 'online-logout', () => online.logout())),
      h('p', { class: 'tiny muted' }, 'Yerel kayıt her zaman asıldır. Otomatik bulut kaydı en sık 3 dakikada bir yapılır ve bulutta bu cihazda olmayan ya da daha ileri bir karakter varsa yapılmaz (sorulur). Buluttan yükleme yalnız onayınla yapılır; şu anki profilin kurtarma kopyası saklanır.'));
  };
  const off = bus.on('online', render);
  render();
  return box;
}

// Ana menüden: kutu bir pencerede
export function openOnline() {
  ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '92vh' } }, onlineBox(),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Kapat'))));
}

async function uploadFlow() {
  await app.flushSave('cloud');
  const r = await online.upload();
  if (r.ok) return;
  if (r.reason === 'behind') {
    ui.confirm({
      title: 'Bulut kaydı daha ileride', danger: true, ok: 'Yine de buluta yaz',
      text: `${r.msg} Bu cihazdaki profili buluta yazarsan buluttaki bu ilerleme kaybolur. Önce "Buluttan yükle" ile devam etmen önerilir.`,
      onOk: async () => { const f = await online.upload({ force: true }); if (!f.ok) toast(f.msg, 'warn'); },
    });
    return;
  }
  toast(r.msg || 'Buluta yazılamadı', 'warn');
}

async function restoreFlow() {
  const r = await online.fetchCloudSave();
  if (!r.ok) { toast(r.msg, 'warn'); return; }
  const local = summarize(app.profile);
  ui.modal(h('div', { class: 'dlg frame', 'data-testid': 'online-compare' }, h('h3', { class: 't' }, 'Buluttan yükle'),
    h('p', { class: 'small' }, `Bulut (${fmtTime(r.updatedAt)}): ${chars(summarize(r.profile))}`),
    h('p', { class: 'small' }, `Bu cihaz: ${chars(local)}`),
    h('p', { class: 'tiny muted' }, 'Yüklersen bu cihazdaki profil buluttakiyle değiştirilir; şu anki profilin bir kurtarma kopyası saklanır (Ayarlar → Önceki kayıtlar).'),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Vazgeç'),
      h('button', { class: 'btn green', 'data-testid': 'online-restore-next', onTap: () => { ui.closeModal(); confirmImport(r, 'cloud', () => online.afterRestore(summarize(r.profile))); } }, 'Devam'))));
}

function authModal(mode) {
  const email = h('input', { class: 'name', type: 'email', placeholder: 'E-posta', autocomplete: 'email', 'data-testid': 'online-email' });
  const pass = h('input', { class: 'name', type: 'password', placeholder: 'Şifre (en az 6 karakter)', autocomplete: mode === 'login' ? 'current-password' : 'new-password', 'data-testid': 'online-pass' });
  const nick = mode === 'register' ? h('input', { class: 'name', maxlength: 16, placeholder: 'Takma ad (liderlik tablosunda görünür)', 'data-testid': 'online-nick' }) : null;
  const msg = h('p', { class: 'small warn', 'data-testid': 'online-auth-msg' });
  const submit = actBtn(mode === 'login' ? 'Giriş yap' : 'Kayıt ol', 'green', 'online-submit', async () => {
    msg.textContent = '';
    const e = email.value.trim(), p = pass.value, n = nick?.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(e)) { msg.textContent = 'Geçerli bir e-posta gir'; return; }
    if (p.length < 6) { msg.textContent = 'Şifre en az 6 karakter olmalı'; return; }
    if (nick && !/^[\p{L}\p{N}_ .-]{3,16}$/u.test(n)) { msg.textContent = 'Takma ad 3–16 karakter (harf, rakam, boşluk, _ . -)'; return; }
    const r = mode === 'login' ? await online.login(e, p) : await online.register(e, p, n);
    if (!r.ok) { msg.textContent = r.msg; return; }
    ui.closeModal();
    toast(mode === 'login' ? `Hoş geldin, ${online.nickname || 'oyuncu'}` : 'Hesap oluşturuldu', 'ok');
    if (r.warn) toast(r.warn, 'warn');
    // girişte bulutta kayıt varsa ve bu cihazda karakter yoksa: yüklemeyi öner
    if (online.cloudMeta?.summary?.length && !summarize(app.profile).length) restoreFlow();
  });
  ui.modal(h('div', { class: 'dlg frame', 'data-testid': 'online-auth' }, h('h3', { class: 't' }, mode === 'login' ? 'Çevrimiçi giriş' : 'Çevrimiçi hesap oluştur'),
    email, pass, nick, msg,
    h('p', { class: 'tiny muted' }, 'Hesap yalnız bulut kaydı ve liderlik için kullanılır. Şifreni başka yerde kullandığın bir şifre yapma (test sunucusu).'),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Vazgeç'), submit)));
  setTimeout(() => email.focus(), 50);
}

async function boardModal() {
  const body = h('div', { class: 'col scroll', style: { maxHeight: '60vh' }, 'data-testid': 'online-board-list' }, h('p', { class: 'small muted' }, 'Yükleniyor…'));
  ui.modal(h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Liderlik tablosu'), body,
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Kapat'))));
  const r = await online.leaderboard();
  clear(body);
  if (!r.ok) { body.append(h('p', { class: 'small warn' }, r.msg)); return; }
  if (!r.rows.length) { body.append(h('p', { class: 'small muted' }, 'Henüz kimse yok. Buluta kaydeden oyuncular burada görünür.')); return; }
  r.rows.forEach((x, i) => body.append(h('div', { class: 'row small', 'data-testid': 'board-row' },
    h('b', { style: { minWidth: '26px' } }, `${i + 1}.`),
    h('span', { class: 'grow' }, h('b', {}, x.char_name), ` (${CLASSES[x.cls]?.name || x.cls}) · ${x.nickname}`),
    h('span', {}, `Lv.${x.level} · ${fmt(x.kills)} öldürme · ${x.boss_kills} boss · ${x.quests} görev`))));
}

function feedbackModal() {
  const ta = h('textarea', { rows: 5, maxlength: 2000, placeholder: 'Ne oldu? Nerede, hangi karakterle? (harita, seviye ve sürüm otomatik eklenir)', 'data-testid': 'online-feedback-text', style: { width: '100%' } });
  const msg = h('p', { class: 'small warn' });
  ui.modal(h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Hata / öneri bildir'), ta, msg,
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Vazgeç'),
      actBtn('Gönder', 'green', 'online-feedback-send', async () => {
        const t = ta.value.trim();
        if (t.length < 3) { msg.textContent = 'Birkaç kelime yaz'; return; }
        const r = await online.feedback(t);
        if (!r.ok) { msg.textContent = r.msg; return; }
        ui.closeModal();
        toast('Teşekkürler! Bildirim gönderildi.', 'ok');
      }))));
  setTimeout(() => ta.focus(), 50);
}

function serverModal() {
  const code = h('input', { class: 'name', placeholder: 'Sunucu kodu (AHO1:…)', 'data-testid': 'online-share-code' });
  const url = h('input', { class: 'name', placeholder: 'Proje adresi: https://xxxx.supabase.co', 'data-testid': 'online-url' });
  const key = h('input', { class: 'name', placeholder: 'Publishable / anon public anahtar', 'data-testid': 'online-key' });
  const msg = h('p', { class: 'small warn' });
  ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '92vh' } }, h('h3', { class: 't' }, 'Sunucu ayarı'),
    h('p', { class: 'small' }, 'Arkadaşın sana sunucu kodu verdiyse yalnız onu yapıştır. Sunucuyu sen kurduysan proje adresini ve herkese açık anahtarı gir (kurulum: docs/ONLINE_KURULUM.md).'),
    code, h('p', { class: 'tiny muted' }, 'ya da'), url, key, msg,
    h('p', { class: 'tiny muted' }, 'Ayar yalnız bu tarayıcıda saklanır. Gizli (secret / service_role) anahtarı ASLA girme — oyun onu reddeder.'),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Vazgeç'),
      h('button', { class: 'btn green', 'data-testid': 'online-server-ok', onTap: () => {
        const v = code.value.trim() ? parseShareCode(code.value) : validateConfig({ url: url.value, anonKey: key.value });
        if (!v.ok) { msg.textContent = v.msg; return; }
        online.setLocalConfig(v.cfg);
        ui.closeModal();
        toast('Sunucu ayarlandı', 'ok');
      } }, 'Kaydet'))));
}

function shareModal() {
  const ta = h('textarea', { readonly: true, rows: 3, style: { width: '100%', fontSize: '10px', wordBreak: 'break-all' } });
  ta.value = shareCode(online.cfg);
  ui.modal(h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Sunucu kodu'),
    h('p', { class: 'small' }, 'Bu kodu arkadaşlarına gönder: Ayarlar → Çevrimiçi → Sunucu ayarı → yapıştır. Kod yalnız sunucu adresini ve herkese açık anahtarı içerir; hesap bilgisi içermez.'),
    ta, h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Tamam'))));
  setTimeout(() => { ta.focus(); ta.select(); }, 50);
}
