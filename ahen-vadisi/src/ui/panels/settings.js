// Ayarlar + otomatik iksir + kayıt yedekleme / geri yükleme
import { h, clear } from '../dom.js';
import { ui } from '../ui.js';
import { app } from '../../core/app.js';
import { bus } from '../../core/events.js';
import { exportJson, importJson } from '../../save/serialize.js';
import { sound } from '../../audio/sound.js';
import { requestFullscreen } from '../screen.js';

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
  const saveInfo = h('div', { class: 'small muted' });
  const updInfo = () => {
    saveInfo.textContent = app.save.error ? `Son kayıt HATALI: ${app.save.error.message}` : app.save.lastAt ? `Son kayıt: ${new Date(app.save.lastAt).toLocaleTimeString('tr-TR')} · depolama: ${app.repo.mode === 'idb' ? 'IndexedDB' : app.repo.mode}` : 'Henüz kaydedilmedi';
  };
  updInfo();
  const general = h('div', { class: 'set box' },
    h('span', {}, 'Ses'), toggle(s.sound, (v) => set({ sound: v }), 'set-sound'),
    h('span', {}, 'Müzik'), toggle(s.music, (v) => set({ music: v })),
    h('span', {}, 'Efekt ses düzeyi'), range(s.sfxVol, (v) => set({ sfxVol: v })),
    h('span', {}, 'Müzik ses düzeyi'), range(s.musicVol, (v) => set({ musicVol: v })),
    h('span', {}, 'Ortam sesi'), range(s.ambientVol, (v) => set({ ambientVol: v })),
    h('span', {}, 'Düşük performans modu (30 FPS, daha az efekt)'), toggle(s.lowPerf, (v) => set({ lowPerf: v })),
    h('span', {}, 'Kamera'), select([['yakin', 'Yakın'], ['normal', 'Normal'], ['uzak', 'Uzak']], s.zoom, (v) => set({ zoom: v })),
    h('span', {}, 'Joystick boyutu'), select([['normal', 'Normal'], ['big', 'Büyük']], s.joystickSize, (v) => { set({ joystickSize: v }); bus.emit('hudRebuild'); }),
    h('span', {}, 'Görev yön okları'), toggle(s.questGuide !== false, (v) => set({ questGuide: v })),
    h('span', {}, 'Hasar sayıları'), toggle(s.damageNumbers, (v) => set({ damageNumbers: v })),
    h('span', {}, 'Ekran sarsıntısı'), toggle(s.shake, (v) => set({ shake: v })),
    h('span', {}, 'FPS göster'), toggle(s.showFps, (v) => set({ showFps: v })),
    h('span', {}, 'Tam ekran'), h('button', { class: 'btn small', onTap: () => requestFullscreen() }, 'Tam ekrana geç'));
  const potion = ap ? h('div', { class: 'set box' },
    h('span', { class: 'gold' }, 'Otomatik iksir'), h('span', { class: 'tiny muted' }, 'Yalnız iksir içer; savaşmaz.'),
    h('span', {}, 'HP iksiri, HP şu yüzdenin altına inince'), h('div', { class: 'row' }, toggle(ap.hpOn, (v) => { ap.hpOn = v; app.requestSave('settings'); }, 'auto-hp'), select([20, 30, 35, 40, 50, 60].map((x) => [String(x), '%' + x]), String(ap.hpPct), (v) => { ap.hpPct = +v; app.requestSave('settings'); })),
    h('span', {}, 'MP iksiri, MP şu yüzdenin altına inince'), h('div', { class: 'row' }, toggle(ap.mpOn, (v) => { ap.mpOn = v; app.requestSave('settings'); }), select([15, 25, 35, 50].map((x) => [String(x), '%' + x]), String(ap.mpPct), (v) => { ap.mpPct = +v; app.requestSave('settings'); }))) : null;
  const backup = h('div', { class: 'col box' },
    h('h3', { class: 't' }, 'Kayıt ve yedekleme'),
    saveInfo,
    h('div', { class: 'row', style: { flexWrap: 'wrap' } },
      h('button', { class: 'btn green small', onTap: async () => { await app.flushSave('manual'); updInfo(); bus.emit('toast', { text: 'Oyun kaydedildi', kind: 'ok' }); } }, 'Şimdi kaydet'),
      h('button', { class: 'btn small', 'data-testid': 'export', onTap: () => exportSave() }, 'Yedeği dışa aktar (JSON)'),
      h('button', { class: 'btn small', onTap: () => importSave() }, 'Yedeği içe aktar'),
      h('button', { class: 'btn small', onTap: () => snapshots() }, 'Önceki kayıtlar')),
    h('p', { class: 'tiny muted' }, 'Tarayıcı verileri silinirse yerel kayıt kaybolabilir. Düzenli olarak JSON yedeği almanı öneririz.'));
  const exit = h('div', { class: 'row box' },
    h('button', { class: 'btn red', onTap: () => ui.confirm({ title: 'Ana menü', text: 'Oyun kaydedilip ana menüye dönülecek.', ok: 'Dön', onOk: () => bus.emit('exitToMenu') }) }, 'Ana menüye dön'),
    h('span', { class: 'tiny muted grow' }, 'Ahen Vadisi V1 · Tüm ilerleme otomatik kaydedilir.'));
  void rerender;
  const credits = h('div', { class: 'box col small' },
    h('b', { class: 'gold' }, 'Emeği geçenler'),
    h('div', {}, 'Karakter ve Cevher Rahibi sprite\'ları: LuizMelo (luizmelo.itch.io) — Fantasy Warrior, Wizard Pack, Evil Wizard 2 (CC0).'),
    h('div', { class: 'muted' }, 'Diğer tüm görseller, sesler ve müzik oyun içinde procedural olarak üretilir.'));
  return h('div', { class: 'col grow scroll' }, general, potion, backup, credits, exit);
}

export function exportSave() {
  app.flushSave('export').then(() => {
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

export function importSave() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    const f = inp.files?.[0];
    if (!f) return;
    const text = await f.text();
    const r = importJson(text);
    if (!r.ok) { ui.alert('İçe aktarma başarısız', r.msg); return; }
    ui.confirm({
      title: 'Yedeği yükle', danger: true, ok: 'Yükle',
      text: `Mevcut profil bu yedekle değiştirilecek: ${r.profile.characters.filter(Boolean).map((c) => `${c.name} Lv.${c.level}`).join(', ') || 'karakter yok'}. Emin misin?`,
      onOk: async () => {
        app.profile = r.profile;
        await app.repo.save(app.profile, { forceSnapshot: true });
        bus.emit('profileReplaced');
      },
    });
  };
  inp.click();
}

async function snapshots() {
  const list = await app.repo.listSnapshots();
  const names = { profile: 'Güncel kayıt', snap_0: 'Önceki sağlam kayıt 1', snap_1: 'Önceki sağlam kayıt 2' };
  const box = h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Kayıt kurtarma'),
    h('p', { class: 'small muted' }, 'Oyun, son iki sağlam kaydı otomatik saklar. Bir sorun olursa önceki kayda dönebilirsin.'),
    h('div', { class: 'list' }, list.map((s) => h('div', { class: 'li' },
      h('div', { class: 'grow small' }, h('b', {}, names[s.key]), h('div', { class: 'tiny muted' }, `${new Date(s.savedAt).toLocaleString('tr-TR')} · ${s.ok ? s.chars.join(', ') || 'karakter yok' : 'BOZUK: ' + s.msg}`)),
      s.key !== 'profile' && s.ok ? h('button', { class: 'btn small', onTap: () => ui.confirm({ title: 'Geri yükle', danger: true, text: 'Bu kayıt geri yüklenecek. Güncel ilerleme önceki kayıtlara taşınır.', ok: 'Geri yükle', onOk: async () => { const r = await app.repo.restoreSnapshot(s.key); if (r.ok) { app.profile = r.profile; bus.emit('profileReplaced'); } } }) }, 'Geri yükle') : null))),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Kapat')));
  ui.modal(box);
  void clear;
}
