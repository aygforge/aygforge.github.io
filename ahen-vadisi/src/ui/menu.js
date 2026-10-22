// Ana menü ve karakter seçme/oluşturma ekranları
import { h, clear, fmt } from './dom.js';
import { ui } from './ui.js';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { drawMenuScene } from '../art/scenery.js';
import { humanSheet, playerLook } from '../art/characters.js';
import { packPreviewCanvas } from '../art/spriteRuntime.js';
import { CLASSES } from '../data/classes.js';
import { MAPS } from '../data/maps/index.js';
import { createCharacter, validateName } from '../systems/character.js';
import { computeStats } from '../systems/stats.js';
import { importSave, showRecovery, copyBackupCode, pasteBackupCode, snapshots, saveSafetyBox } from './panels/settings.js';
import { sound } from '../audio/sound.js';
import { isIOS, isStandalone } from './screen.js';

export function showMainMenu(onPlay) {
  clear(ui.layers.screen);
  const bg = h('canvas', { class: 'bg', width: 320, height: 180 });
  let t = 0;
  const ctx = bg.getContext('2d');
  const paint = () => { ctx.imageSmoothingEnabled = false; drawMenuScene(t).drawTo(ctx, 0, 0, 1); };
  paint();
  const timer = setInterval(() => { t += 0.25; if (!bg.isConnected) { clearInterval(timer); return; } paint(); }, 250);
  const hasChars = app.profile.characters.some(Boolean);
  const box = h('div', { class: 'menu-box' },
    h('h1', { class: 'title' }, 'AHEN VADİSİ'),
    h('p', { class: 'sub' }, 'Karaağaç\'tan Derin Ocak\'a uzanan bir eski usul macera'),
    h('button', { class: 'btn green', 'data-testid': 'menu-play', onTap: () => { sound.init(); sound.play('click'); showCharSelect(onPlay); } }, hasChars ? 'Oyna' : 'Yeni Oyun'),
    h('button', { class: 'btn', onTap: () => { sound.init(); howTo(); } }, 'Nasıl Oynanır?'),
    h('button', { class: 'btn', onTap: () => { sound.init(); menuSettings(); } }, 'Ayarlar ve Yedek'));
  const scr = h('div', { class: 'screen', id: 'menu' }, bg, box, h('div', { class: 'ver' }, `V${__GAME_VERSION__} · Procedural pixel art & ses · Çevrimdışı oynanabilir`));
  ui.layers.screen.appendChild(scr);
  sound.setTheme('menu');
  saveNotices();
  if (isIOS() && !isStandalone() && !sessionStorage.getItem('iosHint')) {
    try { sessionStorage.setItem('iosHint', '1'); } catch { /* */ }
    bus.emit('toast', { text: 'iPhone: Tam ekran için Paylaş → "Ana Ekrana Ekle"' });
  }
}

// Kayıt durumu bildirimleri (oturum başına bir kez): daha yeni sürüm, okuma hatası, kurtarma/onarım, kayıp karakter, yedek hatırlatma
let noticesShown = false;
function saveNotices() {
  if (noticesShown) return;
  noticesShown = true;
  const li = app.loadInfo || {};
  if (li.newer) {
    ui.modal(h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Oyunun yeni sürümü var'),
      h('p', { class: 'small' }, 'Bu cihazdaki kayıt oyunun daha yeni bir sürümüyle yapılmış; açtığın sayfa eski (önbellekteki) sürüm. Kaydın korunuyor — bu sürüm ona dokunmaz.'),
      h('p', { class: 'small gold' }, 'Sayfayı yenile (itch.io\'da sayfayı yeniden yükle). Gerekirse tarayıcı önbelleğini temizlemeden yalnızca sayfayı yenilemen yeterli.'),
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn green', onTap: () => location.reload() }, 'Sayfayı yenile'))), { dismiss: false });
    return;
  }
  if (li.error) {
    const kind = li.errorKind?.text || String(li.error?.message || li.error);
    ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '92vh' }, 'data-testid': 'storage-error' }, h('h3', { class: 't' }, 'Kayıt deposu okunamadı'),
      h('p', { class: 'small' }, `Hata türü: ${kind}.`),
      h('p', { class: 'small' }, 'Bu, karakterlerinin silindiği anlamına gelmez. Kaydının üzerine yanlışlıkla boş bir profil yazılmaması için oyun şu an KAYIT YAPMADAN açıldı.'),
      h('p', { class: 'small' }, 'Önce sayfayı yenile. Olmazsa yedek kodunu/dosyanı yükleyebilir ya da bu cihazdaki önceki kayıt kopyalarına bakabilirsin. Yeni bir oyuna başlamak istersen kaydı açabilirsin; eski veri kurtarma kopyalarında kalmaya devam eder.'),
      h('div', { class: 'row', style: { justifyContent: 'flex-end', flexWrap: 'wrap' } },
        h('button', { class: 'btn green', onTap: () => location.reload() }, 'Sayfayı yenile'),
        h('button', { class: 'btn', onTap: () => pasteBackupCode() }, 'Yedek kodu yapıştır'),
        h('button', { class: 'btn', onTap: () => importSave() }, 'Yedek dosyası yükle'),
        h('button', { class: 'btn', onTap: () => snapshots() }, 'Önceki kayıtlar'),
        h('button', { class: 'btn red', onTap: () => { app.repo.readOnly = false; ui.closeModal(); } }, 'Yine de kaydı aç'))), { dismiss: false });
    return;
  }
  if (li.storageError) {
    ui.alert('IndexedDB açılamadı', `${li.storageError.text}. Karakterlerin yedek aynadan (localStorage) yüklendi; kayıtlar şimdilik oraya yazılıyor. Ayarlar → Kayıt Güvenliği'nden yedek kodu almanı öneririz.`);
  }
  if (li.repaired) {
    ui.alert('Kayıt onarıldı', `Kaydında küçük bir tutarsızlık bulundu ve onarıldı; karakterlerin korunuyor. Onarılmadan önceki kopya ayrıca saklandı. (${(li.fixes || []).slice(0, 3).join('; ')})`);
  } else if (li.source && li.source !== 'profile' && li.source !== 'mirror') {
    ui.alert('Kayıt kurtarıldı', 'Ana kayıt okunamadı; en yeni sağlam kopyadan kurtarıldı. İlerlemenin son birkaç dakikası geri alınmış olabilir.');
  } else if (li.corrupt) {
    ui.alert('Kayıt okunamadı', 'Kayıt okunamadı ama silinmedi: ham kopyası kurtarma kaydı olarak saklandı. Bir yedeğin varsa Ayarlar ve Yedek → "Yedeği içe aktar" ile yükleyebilirsin.');
  }
  const dismissed = new Set(app.profile.recoverDismissed || []);
  const rec = (li.recoverable || []).filter((x) => x.char.level >= 2 && !dismissed.has(`${x.char.id}:${x.char.level}`));
  if (rec.length) {
    setTimeout(() => showRecovery(rec, { auto: true }), li.repaired || li.corrupt ? 600 : 0);
  } else if (app.profile.characters.some(Boolean) && !app.profile.notices?.v4backup) {
    v4BackupNotice();
  } else if (app.profile.characters.some(Boolean) && Date.now() - (app.profile.lastExportAt || 0) > 3 * 86400000) {
    bus.emit('toast', { text: 'İpucu: İlerlemeni korumak için ara sıra Ayarlar ve Yedek → "Yedek kodunu kopyala".', kind: 'info' });
  }
}

// V4 ilk girişte bir kez: kısa yedek hatırlatması (oynanışı kesmez; kapatılabilir, bir daha gösterilmez)
function v4BackupNotice() {
  app.profile.notices = app.profile.notices || {};
  app.profile.notices.v4backup = Date.now();
  app.requestSave('notice');
  ui.modal(h('div', { class: 'dlg frame', 'data-testid': 'v4-notice' }, h('h3', { class: 't' }, 'Gökyarık güncellemesi'),
    h('p', { class: 'small' }, 'Karakterlerin, eşyaların ve ilerlemen aynen korunuyor. Artık 5 karakter yuvası, Okçu ve Ölü Çağıran sınıfları ve Lv.50 içeriği var.'),
    h('p', { class: 'small gold' }, 'Kaydın bu tarayıcıda tutulur. İlerlemeni güvenceye almak için şimdi bir yedek kodu almanı öneririz.'),
    h('div', { class: 'row', style: { justifyContent: 'flex-end', flexWrap: 'wrap' } },
      h('button', { class: 'btn ghost', 'data-testid': 'v4-later', onTap: () => ui.closeModal() }, 'Daha sonra'),
      h('button', { class: 'btn green', onTap: () => { ui.closeModal(); copyBackupCode(); } }, 'Yedek kodunu kopyala'))));
}

function howTo() {
  ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '90vh' } },
    h('h3', { class: 't' }, 'Nasıl Oynanır?'),
    h('p', { class: 'small' }, '• Sol alttaki joystick ile yürü. Joystick her zaman önceliklidir ve otomatik yaklaşmayı anında durdurur.'),
    h('p', { class: 'small' }, '• Bir düşmana dokun: hedef seçilir, karakterin yaklaşır ve menzile girince normal saldırıyı otomatik sürdürür. Hedef ölünce yeni hedef otomatik seçilmez.'),
    h('p', { class: 'small' }, '• Sağ alttaki beceri butonları manueldir; bekleme süresi ve MP harcar. Büyük kılıç butonu aktif saldırıdır: her basışta en yakın düşmana vurursun, basılı tutunca vurmaya devam edersin. Küçük kırmızı OTO butonu otomatik normal saldırıyı açar/kapatır.'),
    h('p', { class: 'small' }, '• NPC, cevher, bitki ve görev nesnelerine dokun; karakter yaklaşıp etkileşime girer.'),
    h('p', { class: 'small' }, '• Kırmızı/turuncu yer işaretleri büyük saldırıların uyarısıdır — işaretli alandan çık!'),
    h('p', { class: 'small' }, '• Klavye: WASD/oklar hareket, 1-4 beceri, Q/E iksir, Tab hedef, Boşluk saldırı aç/kapa, I/C/K/J/M menüler.'),
    h('p', { class: 'small' }, '• Oyun otomatik kaydedilir (tarayıcıda). Ayarlar → Kayıt Güvenliği\'nden yedek kodu ya da JSON yedek alabilirsin.'),
    h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Anladım')));
}

function menuSettings() {
  const s = app.settings;
  ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '92vh' } },
    h('h3', { class: 't' }, 'Ayarlar ve Yedek'),
    h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Ses'), h('button', { class: 'btn small', onTap: (e) => { app.setSettings({ sound: !app.settings.sound }); e.target.textContent = app.settings.sound ? 'Açık' : 'Kapalı'; } }, s.sound ? 'Açık' : 'Kapalı')),
    h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Müzik'), h('button', { class: 'btn small', onTap: (e) => { app.setSettings({ music: !app.settings.music }); e.target.textContent = app.settings.music ? 'Açık' : 'Kapalı'; } }, s.music ? 'Açık' : 'Kapalı')),
    h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Düşük performans (30 FPS)'), h('button', { class: 'btn small', onTap: (e) => { app.setSettings({ lowPerf: !app.settings.lowPerf }); e.target.textContent = app.settings.lowPerf ? 'Açık' : 'Kapalı'; } }, s.lowPerf ? 'Açık' : 'Kapalı')),
    saveSafetyBox(),
    h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Kapat')));
}

function previewCanvas(cls, equipment, scale = 4) {
  return packPreviewCanvas('hero_' + cls, 30 * scale) || humanSheet(playerLook(cls, equipment))[0].toCanvas(scale);
}

export function showCharSelect(onPlay) {
  clear(ui.layers.screen);
  let sel = app.profile.characters.findIndex(Boolean);
  if (sel < 0) sel = 0;
  const slotsEl = h('div', { class: 'slots' });
  const actions = h('div', { class: 'row', style: { flexWrap: 'wrap', justifyContent: 'center' } });
  const render = () => {
    clear(slotsEl); clear(actions);
    app.profile.characters.forEach((c, i) => {
      const card = h('div', { class: 'slot-card frame ia' + (i === sel ? ' sel' : '') + (c ? '' : ' empty'), 'data-testid': 'slot-' + i, onTap: () => { sound.play('click'); sel = i; render(); } });
      if (c) {
        card.append(previewCanvas(c.cls, c.equipment), h('div', { class: 'nm' }, c.name),
          h('div', { class: 'small' }, `${CLASSES[c.cls].name} · Seviye ${c.level}`),
          h('div', { class: 'tiny muted' }, `${MAPS[c.world.map]?.name || ''} · ${fmt(c.gold)} Gold`),
          c.titles?.length ? h('div', { class: 'tiny r-L' }, c.titles[0]) : null);
      } else card.append(h('div', { style: { fontSize: '2.4rem' } }, '+'), h('div', {}, 'Boş yuva'), h('div', { class: 'tiny' }, 'Yeni karakter oluştur'));
      slotsEl.appendChild(card);
    });
    const c = app.profile.characters[sel];
    actions.append(h('button', { class: 'btn ghost', onTap: () => showMainMenu(onPlay) }, '‹ Geri'));
    if (c) {
      actions.append(
        h('button', { class: 'btn red small', onTap: () => deleteChar(sel, render) }, 'Sil'),
        h('button', { class: 'btn green', 'data-testid': 'enter-world', style: { minWidth: '200px' }, onTap: () => { sound.play('click'); onPlay(sel); } }, 'Oyuna Gir'));
    } else actions.append(h('button', { class: 'btn green', 'data-testid': 'create-char', style: { minWidth: '200px' }, onTap: () => showCreate(sel, onPlay) }, 'Karakter Oluştur'));
  };
  render();
  ui.layers.screen.appendChild(h('div', { class: 'screen', id: 'charsel' },
    h('h3', { class: 't', style: { fontSize: '1.5rem', margin: 0 } }, 'Karakter Seç'), slotsEl, actions,
    h('div', { class: 'tiny muted' }, 'Ortak depo bu profildeki bütün karakterler arasında paylaşılır.')));
}

function deleteChar(i, render) {
  const c = app.profile.characters[i];
  const input = h('input', { class: 'name', placeholder: c.name });
  ui.modal(h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Karakteri sil'),
    h('p', { class: 'small' }, `"${c.name}" kalıcı olarak silinecek. Onaylamak için ismini yaz.`), input,
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Vazgeç'),
      h('button', { class: 'btn red', onTap: async () => {
        if (input.value.trim() !== c.name) { bus.emit('toast', { text: 'İsim eşleşmedi', kind: 'warn' }); return; }
        // bilinçli silme kaydedilir: kurtarma listesi ve ilerleme koruması bu karakteri geri getirmeye çalışmaz
        app.profile.deletedChars = [...new Set([...(app.profile.deletedChars || []), c.id])];
        app.profile.characters[i] = null;
        await app.flushSave('delete');
        ui.closeModal(); render();
      } }, 'Sil'))));
}

function showCreate(slot, onPlay) {
  clear(ui.layers.screen);
  let cls = 'warrior';
  const cards = h('div', { class: 'class-pick' });
  const nameIn = h('input', { class: 'name', maxlength: 14, placeholder: 'Karakter adı', 'data-testid': 'name-input', autocomplete: 'off', spellcheck: 'false' });
  nameIn.addEventListener('keydown', (e) => e.stopPropagation());
  const err = h('div', { class: 'small bad' });
  const render = () => {
    clear(cards);
    for (const id of ['warrior', 'mage']) {
      const c = CLASSES[id];
      const kit = Object.fromEntries(c.starterKit.map((tid) => [tid.startsWith('C') ? 'chest' : 'weapon', { tid }]));
      const fake = { cls: id, level: 1, alloc: { str: 0, dex: 0, int: 0, vit: 0 }, skills: {}, equipment: { weapon: { tid: c.starterKit[0], p: 0, d: 100, b: [] }, chest: { tid: c.starterKit[1], p: 0, d: 100, b: [] } } };
      const st = computeStats(fake);
      cards.appendChild(h('div', { class: 'class-card frame ia' + (cls === id ? ' sel' : ''), 'data-testid': 'class-' + id, onTap: () => { sound.play('click'); cls = id; render(); } },
        previewCanvas(id, kit, 3),
        h('div', { class: 'grow' },
          h('div', { class: 'gold', style: { fontFamily: 'var(--title)', fontSize: '1.25rem' } }, `${c.name} `, h('span', { class: 'tiny muted' }, `(${c.latin})`)),
          h('div', { class: 'small' }, c.desc),
          h('div', { class: 'tiny muted' }, `STR ${c.base.str} · DEX ${c.base.dex} · INT ${c.base.int} · VIT ${c.base.vit} · HP ${st.maxHp} · MP ${st.maxMp}`),
          h('div', { class: 'tiny muted' }, c.suggested))));
    }
  };
  render();
  const create = () => {
    const v = validateName(nameIn.value);
    if (!v.ok) { err.textContent = v.msg; sound.play('error'); return; }
    if (app.profile.characters.some((c) => c && c.name.toLocaleLowerCase('tr') === v.name.toLocaleLowerCase('tr'))) { err.textContent = 'Bu isim zaten kullanılıyor'; return; }
    const ch = createCharacter({ name: v.name, cls, slot }, app.rng);
    app.profile.characters[slot] = ch;
    app.flushSave('create');
    sound.play('levelup');
    onPlay(slot);
  };
  ui.layers.screen.appendChild(h('div', { class: 'screen', id: 'charsel' },
    h('h3', { class: 't', style: { fontSize: '1.4rem', margin: 0 } }, 'Yeni Karakter'),
    cards,
    h('div', { class: 'col', style: { width: 'min(460px, 90vw)' } }, nameIn, err),
    h('div', { class: 'row' }, h('button', { class: 'btn ghost', onTap: () => showCharSelect(onPlay) }, '‹ Geri'),
      h('button', { class: 'btn green', 'data-testid': 'create-confirm', style: { minWidth: '200px' }, onTap: create }, 'Oluştur ve Başla')),
    h('div', { class: 'tiny muted' }, 'Sabit sınıf sistemi: alt sınıf yoktur. Seviye 20\'de Ustalık I açılır.')));
}
