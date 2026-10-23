// Ayarlar + otomatik iksir + kayıt yedekleme / geri yükleme
import { h, clear, fmt } from '../dom.js';
import { ui } from '../ui.js';
import { app } from '../../core/app.js';
import { bus } from '../../core/events.js';
import { exportJson, encodeBackupCode, decodeBackupCode, wrap } from '../../save/serialize.js';
import { CLASSES } from '../../data/classes.js';
import { sound } from '../../audio/sound.js';
import { requestFullscreen } from '../screen.js';
import { onlineBox } from './online.js';

function toggle(on, fn, testid) {
  const t = h('button', { class: 'tog' + (on ? ' on' : ''), 'data-testid': testid, onTap: () => { const v = !t.classList.contains('on'); t.classList.toggle('on', v); sound.play('click'); fn(v); } });
  return t;
}
function range(v, fn) {
  const r = h('input', { type: 'range', min: 0, max: 100, value: Math.round(v * 100) });
  r.addEventListener('change', () => fn(r.value / 100));
  return r;
}
function select(opts, v, fn) {
  const s = h('select', { class: 'sel' }, opts.map(([val, label]) => h('option', { value: val, ...(val === v ? { selected: true } : {}) }, label)));
  s.addEventListener('change', () => fn(s.value));
  return s;
}

export function settingsTab(rerender) {
  const s = app.settings;
  const set = (patch) => app.setSettings(patch);
  const ch = app.char;
  const ap = ch?.autoPotion;
  const general = h('div', { class: 'set box' },
    h('span', {}, 'Ses'), toggle(s.sound, (v) => set({ sound: v }), 'set-sound'),
    h('span', {}, 'Müzik'), toggle(s.music, (v) => set({ music: v })),
    h('span', {}, 'Efekt ses düzeyi'), range(s.sfxVol, (v) => set({ sfxVol: v })),
    h('span', {}, 'Müzik ses düzeyi'), range(s.musicVol, (v) => set({ musicVol: v })),
    h('span', {}, 'Ortam sesi'), range(s.ambientVol, (v) => set({ ambientVol: v })),
    h('span', {}, 'Düşük performans modu (30 FPS, daha az efekt)'), toggle(s.lowPerf, (v) => set({ lowPerf: v })),
    h('span', {}, 'Kamera'), select([['yakin', 'Yakın'], ['normal', 'Normal'], ['uzak', 'Uzak']], s.zoom, (v) => set({ zoom: v })),
    h('span', {}, 'Joystick boyutu'), select([['normal', 'Normal'], ['big', 'Büyük']], s.joystickSize, (v) => { set({ joystickSize: v }); bus.emit('hudRebuild'); }),
    h('span', {}, 'Kahraman görünümü'), select([['sprite', 'Animasyonlu sprite'], ['gear', 'Ekipman görünür (piksel)']], s.heroLook || 'sprite', (v) => { set({ heroLook: v }); bus.emit('heroLook'); }),
    h('span', {}, 'Görev yön okları'), toggle(s.questGuide !== false, (v) => set({ questGuide: v })),
    h('span', {}, 'Hasar sayıları'), toggle(s.damageNumbers, (v) => set({ damageNumbers: v })),
    h('span', {}, 'Ekran sarsıntısı'), toggle(s.shake, (v) => set({ shake: v })),
    h('span', {}, 'FPS göster'), toggle(s.showFps, (v) => set({ showFps: v })),
    h('span', {}, 'Tam ekran'), h('button', { class: 'btn small', onTap: () => requestFullscreen() }, 'Tam ekrana geç'));
  const potion = ap ? h('div', { class: 'set box' },
    h('span', { class: 'gold' }, 'Otomatik iksir'), h('span', { class: 'tiny muted' }, 'Yalnız iksir içer; savaşmaz.'),
    h('span', {}, 'HP iksiri, HP şu yüzdenin altına inince'), h('div', { class: 'row' }, toggle(ap.hpOn, (v) => { ap.hpOn = v; app.requestSave('settings'); }, 'auto-hp'), select([20, 30, 35, 40, 50, 60].map((x) => [String(x), '%' + x]), String(ap.hpPct), (v) => { ap.hpPct = +v; app.requestSave('settings'); })),
    h('span', {}, 'MP iksiri, MP şu yüzdenin altına inince'), h('div', { class: 'row' }, toggle(ap.mpOn, (v) => { ap.mpOn = v; app.requestSave('settings'); }), select([15, 25, 35, 50].map((x) => [String(x), '%' + x]), String(ap.mpPct), (v) => { ap.mpPct = +v; app.requestSave('settings'); }))) : null;
  const backup = saveSafetyBox();
  const exit = h('div', { class: 'row box' },
    h('button', { class: 'btn red', onTap: () => ui.confirm({ title: 'Ana menü', text: 'Oyun kaydedilip ana menüye dönülecek.', ok: 'Dön', onOk: () => bus.emit('exitToMenu') }) }, 'Ana menüye dön'),
    h('span', { class: 'tiny muted grow' }, `Ahen Vadisi V${__GAME_VERSION__} · İlerleme otomatik kaydedilir (durum: Kayıt Güvenliği).`));
  void rerender;
  const credits = h('div', { class: 'box col small' },
    h('b', { class: 'gold' }, 'Emeği geçenler'),
    h('div', {}, 'Karakter ve Cevher Rahibi sprite\'ları: LuizMelo (luizmelo.itch.io) — Fantasy Warrior, Wizard Pack, Huntress 2, Evil Wizard 2 ve 3 (CC0); iskelet: Skeleton Sprite Pack.'),
    h('div', { class: 'muted' }, 'Diğer tüm görseller, sesler ve müzik oyun içinde procedural olarak üretilir.'));
  return h('div', { class: 'col grow scroll' }, general, potion, backup, onlineBox(), credits, exit);
}

// ------------------------------------------------------------------ Kayıt Güvenliği (oyun içi ve ana menü)
const fmtTime = (t) => (t ? new Date(t).toLocaleString('tr-TR') : '—');
export function saveStatusRows() {
  const r = app.repo, info = r.storageInfo();
  const tech = info.mode === 'idb' ? (r.useMirror ? 'IndexedDB (birincil) + localStorage aynası' : 'IndexedDB')
    : info.mode === 'local' ? 'localStorage (IndexedDB açılamadı)' : info.mode === 'memory' ? 'YALNIZ GEÇİCİ BELLEK' : 'açılmadı';
  const pers = info.persisted === true ? 'açık (tarayıcı bu siteyi otomatik silmez)' : info.persisted === false ? 'tarayıcı izin vermedi' : 'tarayıcı desteklemiyor';
  const w = info.lastWrite;
  const lastLine = !w ? 'Bu oturumda henüz kayıt yapılmadı'
    : w.persistent ? `${fmtTime(w.persistentAt)} (${[w.idb && 'IndexedDB', w.mirror && 'ayna', w.local && 'localStorage'].filter(Boolean).join(' + ')})`
    : 'KALICI KAYIT YAPILAMADI — yalnız geçici bellekte';
  const rows = [
    ['Son başarılı kalıcı kayıt', lastLine, w && !w.persistent ? 'r-warn' : ''],
    ['Kayıt teknolojisi', tech, info.mode === 'memory' ? 'r-warn' : ''],
    ['Kalıcı depolama izni', pers, ''],
    ['Son yedek (kod/dosya)', app.profile.lastExportAt ? fmtTime(app.profile.lastExportAt) : 'henüz alınmadı', app.profile.lastExportAt ? '' : 'r-warn'],
  ];
  if (info.openError) rows.push(['Depolama hatası', info.openError.text, 'r-warn']);
  if (r.readOnly) rows.push(['Durum', 'Salt okunur — kaydın üzerine yazılmıyor (sayfayı yenile)', 'r-warn']);
  if (app.save.error) rows.push(['Son kayıt denemesi', `HATALI: ${app.save.error.message}`, 'r-warn']);
  if (info.degraded && w?.persistent) rows.push(['Uyarı', 'IndexedDB yazılamadı; kayıt yalnız aynaya (localStorage) gitti', 'r-warn']);
  return rows;
}

export function saveSafetyBox() {
  const statusEl = h('div', { class: 'col', 'data-testid': 'save-status' });
  const render = () => {
    clear(statusEl);
    for (const [k, v, cls] of saveStatusRows()) statusEl.append(h('div', { class: 'row small' }, h('span', { class: 'muted', style: { minWidth: '150px' } }, k), h('b', { class: cls === 'r-warn' ? 'warn' : '' }, v)));
  };
  render();
  const memoryOnly = app.repo.storageInfo().memoryOnly;
  return h('div', { class: 'col box', 'data-testid': 'save-safety' },
    h('h3', { class: 't' }, 'Kayıt Güvenliği'),
    memoryOnly ? h('p', { class: 'small warn' }, 'Kayıt yalnız geçici bellekte tutuluyor: tarayıcı sekmesi kapanınca ilerleme kaybolur. Hemen "Yedek kodunu kopyala" ile yedek al.') : null,
    statusEl,
    h('div', { class: 'row', style: { flexWrap: 'wrap' } },
      h('button', { class: 'btn green small', onTap: async () => {
        await app.flushSave('manual'); render();
        const ok = !app.save.error && app.save.persistent;
        bus.emit('toast', { text: ok ? 'Oyun kalıcı olarak kaydedildi' : app.repo.readOnly ? 'Salt okunur: kayıt yapılmadı' : 'Kalıcı kayıt doğrulanamadı — yedek al', kind: ok ? 'ok' : 'warn' });
      } }, 'Şimdi kaydet'),
      h('button', { class: 'btn small green', 'data-testid': 'copy-code', onTap: () => copyBackupCode() }, 'Yedek kodunu kopyala'),
      h('button', { class: 'btn small', 'data-testid': 'paste-code', onTap: () => pasteBackupCode() }, 'Yedek kodu yapıştır')),
    h('div', { class: 'row', style: { flexWrap: 'wrap' } },
      h('button', { class: 'btn small', 'data-testid': 'export', onTap: () => exportSave() }, 'Yedeği dışa aktar (JSON)'),
      h('button', { class: 'btn small', onTap: () => importSave() }, 'Yedeği içe aktar'),
      h('button', { class: 'btn small', 'data-testid': 'snapshots', onTap: () => snapshots() }, 'Önceki kayıtlar'),
      h('button', { class: 'btn small', 'data-testid': 'find-lost', onTap: () => findLost() }, 'Kayıp karakter ara')),
    h('p', { class: 'tiny muted' }, 'Kayıt bu tarayıcıda, bu sitenin deposunda tutulur (isteğe bağlı bulut kaydı: Çevrimiçi bölümü). itch.io gibi gömülü sayfalarda ya da Brave/Safari gibi gizlilik ayarı sıkı tarayıcılarda depolama silinebilir veya farklı bir adrese bağlanabilir. Yedek kodunu ara sıra kopyalayıp bir nota ya da kendine mesaja yapıştır: başka tarayıcıda ya da cihazda da aynı kodla devam edebilirsin.'));
}

function markExported() {
  app.profile.lastExportAt = Date.now();
  return app.flushSave('export');
}

export function exportSave() {
  markExported().then(() => {
    const text = exportJson(app.profile);
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ahen-vadisi-yedek-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    bus.emit('toast', { text: 'Yedek dosyası indirildi', kind: 'ok' });
  });
}

// Mevcut profili, üzerine yazmadan önce kurtarma kopyası olarak saklayıp yenisiyle değiştirir.
async function replaceProfile(profile, tag) {
  try { await app.repo.writeRaw(`rescue_${Date.now()}_before_${tag}`, wrap(app.profile)); } catch { /* */ }
  app.repo.readOnly = false;
  app.profile = profile;
  await app.repo.save(app.profile, { forceSnapshot: true });
  bus.emit('profileReplaced');
}

// after: yükleme bittikten sonra (ör. çevrimiçi katmanın bulut özetini güncellemesi)
export function confirmImport(r, tag, after = null) {
  if (!r.ok) { ui.alert('İçe aktarma başarısız', r.msg); return; }
  const names = r.profile.characters.filter(Boolean).map((c) => `${c.name} Lv.${c.level}`).join(', ') || 'karakter yok';
  ui.confirm({
    title: 'Yedeği yükle', danger: true, ok: 'Yükle',
    text: `Bu cihazdaki profil yedekteki profille değiştirilecek: ${names}. (Şu anki profilin ayrıca bir kurtarma kopyası saklanır.) Emin misin?`,
    onOk: async () => { await replaceProfile(r.profile, tag); after?.(); },
  });
}

export function importSave() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json,.txt';
  inp.onchange = async () => {
    const f = inp.files?.[0];
    if (!f) return;
    confirmImport(await decodeBackupCode(await f.text()), 'import');
  };
  inp.click();
}

export async function copyBackupCode() {
  await markExported();
  const code = await encodeBackupCode(app.profile);
  let copied = false;
  try { await navigator.clipboard.writeText(code); copied = true; } catch { /* itch iframe vb.: elle kopyalama */ }
  const ta = h('textarea', { readonly: true, rows: 5, 'data-testid': 'code-output', style: { width: '100%', fontSize: '10px', wordBreak: 'break-all' } });
  ta.value = code;
  const copyBtn = h('button', { class: 'btn small', onTap: () => {
    ta.focus(); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* */ }
    bus.emit('toast', { text: ok ? 'Kod kopyalandı' : 'Kodu seçip elle kopyala', kind: ok ? 'ok' : 'info' });
  } }, 'Tekrar kopyala');
  ui.modal(h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Yedek kodu'),
    h('p', { class: 'small' }, copied ? 'Kod panoya kopyalandı. Bir nota ya da kendine mesaja yapıştırıp sakla.' : 'Kodu seç ve kopyala; bir nota ya da kendine mesaja yapıştırıp sakla.'),
    ta,
    h('p', { class: 'tiny muted' }, `Bütün karakterlerin, ortak depo ve ayarlar bu koddadır (${fmt(code.length)} karakter). Geri yüklemek için: Ayarlar ve Yedek → "Yedek kodu yapıştır".`),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, copyBtn, h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Tamam'))));
  setTimeout(() => { ta.focus(); ta.select(); }, 50);
}

export function pasteBackupCode() {
  const ta = h('textarea', { rows: 5, placeholder: 'AHV1 ile başlayan yedek kodunu buraya yapıştır', 'data-testid': 'code-input', style: { width: '100%', fontSize: '10px' } });
  ui.modal(h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Yedek kodunu yükle'), ta,
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Vazgeç'),
      h('button', { class: 'btn green', 'data-testid': 'code-ok', onTap: async () => {
        const r = await decodeBackupCode(ta.value);
        if (!r.ok) { bus.emit('toast', { text: r.msg, kind: 'warn' }); return; }
        ui.closeModal();
        confirmImport(r, 'code');
      } }, 'Devam'))));
  setTimeout(() => ta.focus(), 50);
}

const SNAP_NAMES = {
  profile: 'Güncel kayıt', mirror: 'Yedek ayna (localStorage)', snap_0: 'Önceki sağlam kayıt 1', snap_1: 'Önceki sağlam kayıt 2',
  v2_backup: 'V2 yedeği (V3 geçişinden önce)', v1_backup: 'V1 yedeği (V2 geçişinden önce)',
};
function snapName(s) {
  if (s.key.startsWith('hist_')) return 'Oturum geçmişi';
  if (s.key.startsWith('rescue_')) return 'Kurtarma kopyası';
  if (s.src === 'ls' && s.key !== 'mirror') return `Eski yerel kayıt (${SNAP_NAMES[s.key] || s.key})`;
  return SNAP_NAMES[s.key] || s.key;
}

export async function snapshots() {
  const list = await app.repo.listSnapshots();
  const box = h('div', { class: 'dlg frame scroll', style: { maxHeight: '90vh' } }, h('h3', { class: 't' }, 'Kayıt kurtarma'),
    h('p', { class: 'small muted' }, 'Oyun kaydını birkaç kopya halinde saklar (önceki sağlam kayıtlar, oturum geçmişi, yedek ayna, kurtarma kopyaları). Bir sorun olursa birine dönebilirsin; şu anki ilerleme de ayrıca saklanır.'),
    h('div', { class: 'list' }, list.map((s) => h('div', { class: 'li' },
      h('div', { class: 'grow small' }, h('b', {}, snapName(s)), h('div', { class: 'tiny muted' }, `${s.savedAt ? new Date(s.savedAt).toLocaleString('tr-TR') : '?'} · ${s.ok ? (s.chars.join(', ') || 'karakter yok') + (s.repaired ? ' (onarılarak)' : '') : 'OKUNAMADI: ' + s.msg}`)),
      !(s.key === 'profile' && s.src === 'idb') && s.ok ? h('button', { class: 'btn small', onTap: () => ui.confirm({ title: 'Geri yükle', danger: true, text: 'Bu kayıt geri yüklenecek. Şu anki ilerleme ayrıca bir kurtarma kopyası olarak saklanır.', ok: 'Geri yükle', onOk: async () => { const r = await app.repo.restoreSnapshot(s.key, s.src); if (r.ok) { app.profile = r.profile; bus.emit('profileReplaced'); } else ui.alert('Geri yüklenemedi', r.msg || ''); } }) }, 'Geri yükle') : null))),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Kapat')));
  ui.modal(box);
  void clear;
}

export async function findLost() {
  const all = await app.repo.candidates();
  const list = app.repo._recoverable(all, app.profile);
  if (!list.length) { ui.alert('Kayıp karakter yok', 'Bu cihazdaki kayıt kopyalarında, şu anki profilde olmayan ya da daha ileri bir karakter bulunamadı.'); return; }
  showRecovery(list);
}

// Başka bir kayıt kopyasında bulunan (bu profilde olmayan ya da daha ileri) karakterleri geri getirme penceresi
// auto: açılışta kendiliğinden gösterildi; 'Kapat' bu karakter/seviye kopyalarını bir daha kendiliğinden göstermez
// (Ayarlar → "Kayıp karakter ara" her zaman hepsini listeler)
export function showRecovery(list, { auto = false } = {}) {
  const rows = list.map((x) => {
    const c = x.char;
    const btn = h('button', { class: 'btn small green', onTap: async () => {
      if (btn.classList.contains('dis')) return;
      const r = await app.recoverCharacter(x);
      if (r.ok) { btn.textContent = 'Geri yüklendi ✔'; btn.classList.add('dis'); bus.emit('toast', { text: `${c.name} geri yüklendi`, kind: 'ok' }); }
      else bus.emit('toast', { text: r.msg || 'Geri yüklenemedi', kind: 'warn' });
    } }, x.replaces ? 'Bu ilerlemeyi geri yükle' : 'Geri yükle');
    return h('div', { class: 'li' }, h('div', { class: 'grow small' }, h('b', {}, `${c.name} — ${CLASSES[c.cls]?.name || c.cls} Lv.${c.level}`),
      h('div', { class: 'tiny muted' }, `${x.savedAt ? new Date(x.savedAt).toLocaleString('tr-TR') : ''} · ${fmt(c.gold || 0)} Gold${x.replaces ? ' · şu anki halinden daha ileri' : ''}`)), btn);
  });
  ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '90vh' } }, h('h3', { class: 't' }, 'Kayıp karakter bulundu'),
    h('p', { class: 'small' }, 'Cihazdaki eski kayıt kopyalarında bu profilde olmayan ya da daha ileri karakterler var. Geri yüklemek istediklerini seç (boş yuvaya ya da aynı karakterin yerine geçer).'),
    h('div', { class: 'list' }, rows),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn ghost', 'data-testid': 'recovery-close', onTap: () => {
      ui.closeModal();
      if (auto) {
        app.profile.recoverDismissed = [...new Set([...(app.profile.recoverDismissed || []), ...list.map((x) => `${x.char.id}:${x.char.level}`)])];
        app.requestSave('recoverDismiss');
      }
      bus.emit('charsChanged');
    } }, 'Kapat'))));
}
