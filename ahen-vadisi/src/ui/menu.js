// Ana menü ve karakter seçme/oluşturma ekranları
import { h, clear, fmt } from './dom.js';
import { ui } from './ui.js';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { drawMenuScene } from '../art/scenery.js';
import { humanSheet, playerLook } from '../art/characters.js';
import { CLASSES } from '../data/classes.js';
import { MAPS } from '../data/maps/index.js';
import { createCharacter, validateName } from '../systems/character.js';
import { computeStats } from '../systems/stats.js';
import { exportSave, importSave } from './panels/settings.js';
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
  const scr = h('div', { class: 'screen', id: 'menu' }, bg, box, h('div', { class: 'ver' }, 'V1.0 · Procedural pixel art & ses · Çevrimdışı oynanabilir'));
  ui.layers.screen.appendChild(scr);
  sound.setTheme('menu');
  if (app.loadInfo?.source && app.loadInfo.source !== 'profile') {
    ui.alert('Kayıt kurtarıldı', 'Ana kayıt okunamadı; önceki sağlam kayıttan kurtarıldı. İlerlemenin bir kısmı geri alınmış olabilir.');
  } else if (app.loadInfo?.corrupt) {
    ui.alert('Kayıt okunamadı', 'Kayıt dosyası bozuk görünüyor ve kurtarılamadı. Bir JSON yedeğin varsa Ayarlar ve Yedek menüsünden içe aktarabilirsin.');
  }
  if (isIOS() && !isStandalone() && !sessionStorage.getItem('iosHint')) {
    try { sessionStorage.setItem('iosHint', '1'); } catch { /* */ }
    bus.emit('toast', { text: 'iPhone: Tam ekran için Paylaş → "Ana Ekrana Ekle"' });
  }
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
    h('p', { class: 'small' }, '• Oyun otomatik kaydedilir. Ayarlar\'dan JSON yedek alabilirsin.'),
    h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Anladım')));
}

function menuSettings() {
  const s = app.settings;
  ui.modal(h('div', { class: 'dlg frame' },
    h('h3', { class: 't' }, 'Ayarlar ve Yedek'),
    h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Ses'), h('button', { class: 'btn small', onTap: (e) => { app.setSettings({ sound: !app.settings.sound }); e.target.textContent = app.settings.sound ? 'Açık' : 'Kapalı'; } }, s.sound ? 'Açık' : 'Kapalı')),
    h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Müzik'), h('button', { class: 'btn small', onTap: (e) => { app.setSettings({ music: !app.settings.music }); e.target.textContent = app.settings.music ? 'Açık' : 'Kapalı'; } }, s.music ? 'Açık' : 'Kapalı')),
    h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Düşük performans (30 FPS)'), h('button', { class: 'btn small', onTap: (e) => { app.setSettings({ lowPerf: !app.settings.lowPerf }); e.target.textContent = app.settings.lowPerf ? 'Açık' : 'Kapalı'; } }, s.lowPerf ? 'Açık' : 'Kapalı')),
    h('div', { class: 'row' }, h('button', { class: 'btn small', onTap: () => exportSave() }, 'Yedeği dışa aktar'), h('button', { class: 'btn small', onTap: () => importSave() }, 'Yedeği içe aktar')),
    h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Kapat')));
}

function previewCanvas(cls, equipment, scale = 4) {
  return humanSheet(playerLook(cls, equipment))[0].toCanvas(scale);
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
