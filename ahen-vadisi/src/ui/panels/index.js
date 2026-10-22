// Panel yönlendirici + seyahat, ölüm ve hikâye sonu ekranları
import { h } from '../dom.js';
import { ui } from '../ui.js';
import { app } from '../../core/app.js';
import { bus } from '../../core/events.js';
import { WAYSTONES } from '../../data/maps/index.js';
import { openGameMenu } from './gameMenu.js';
import { openNpc } from './npc.js';
import { act } from '../actions.js';
import { sound } from '../../audio/sound.js';

export function openPanel(name) {
  if (!app.world) return;
  if (['inventory', 'character', 'skills', 'quests', 'map', 'settings'].includes(name)) openGameMenu(name);
}

export function bindPanelEvents() {
  bus.on('openNpc', (id) => openNpc(id));
  bus.on('openTravel', (id) => openTravel(id));
  bus.on('playerDied', (info) => showDeath(info));
  bus.on('storyComplete', (part) => showStoryEnd(part));
}

// fromId: dokunulan Yol Taşı; { scroll: true }: Dönüş Parşömeni (ücretsiz, parşömen seçimde tüketilir)
function openTravel(from) {
  const ch = app.char;
  const scroll = typeof from === 'object' && !!from?.scroll;
  const fromId = scroll ? null : from;
  const box = h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, scroll ? 'Dönüş Parşömeni' : 'Yol Taşı — Hızlı Seyahat'),
    h('p', { class: 'small muted' }, scroll ? 'Keşfettiğin bir Yol Taşı\'na ücretsiz dön. Parşömen seçince tükenir.' : 'Keşfettiğin Yol Taşlarının bulunduğu bölge girişine ışınlanırsın.'),
    h('div', { class: 'list' }, Object.entries(WAYSTONES).map(([id, ws]) => {
      const known = ch.world.waystones.includes(id);
      const here = id === fromId;
      return h('div', { class: 'li' }, h('div', { class: 'grow' }, h('b', {}, ws.name), h('div', { class: 'tiny muted' }, known ? (scroll || !ws.cost ? 'Ücretsiz' : `${ws.cost} Gold`) : 'Keşfedilmedi')),
        h('button', { class: 'btn small green' + (known && !here ? '' : ' dis'), onTap: () => { ui.closeModal(); act.travel(id, { scroll }); } }, here ? 'Buradasın' : 'Git'));
    })),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Kapat')));
  ui.modal(box);
}

function showDeath(info) {
  setTimeout(() => {
    const box = h('div', { class: 'death frame' },
      h('h2', {}, 'BAYILDIN'),
      h('p', { class: 'small' }, 'EXP veya eşya kaybı yok. Kuşanılı ekipman 10 dayanıklılık kaybetti.'),
      info.dungeon ? h('p', { class: 'small gold' }, 'Dungeon: Son kontrol noktasından devam edeceksin. Boss savaşı sıfırlanır, temizlenen bölümler korunur.') : h('p', { class: 'small muted' }, 'Bölgenin güvenli noktasında yeniden doğacaksın.'),
      h('button', { class: 'btn green', 'data-testid': 'respawn', onTap: () => { sound.play('click'); ui.closeModal(); app.world.respawn(); } }, 'Yeniden Doğ'));
    ui.modal(box, { dismiss: false });
  }, 900);
}

function showStoryEnd(part) {
  const v3 = part === 'v3';
  const box = h('div', { class: 'dlg frame', style: { textAlign: 'center' } },
    h('h3', { class: 't', style: { fontSize: '1.5rem' } }, v3 ? 'Kayıp Tahtın Varisi' : 'Vadinin Koruyucusu'),
    h('p', {}, v3 ? 'Kayıp Kral düştü; kırık taç sustu ve Ölü Krallık\'ın ölüleri sonunda uykuya döndü. Kara Taht artık boş — ve hür.'
      : 'Maden Golemi sustu, sisler dağıldı ve Karaağaç yeniden huzura kavuştu. Ahen Vadisi seni asla unutmayacak.'),
    h('p', { class: 'small gold' }, v3 ? 'V3 ana hikâyesi tamamlandı! Lv.40\'ta Gezgin Bilge\'nin Ustalık II görevi açılır; Karanlık Mahzen\'e sınırsız girebilirsin.'
      : 'Ana hikâye tamamlandı! Derin Ocak\'a sınırsız girebilir, Legendary avına devam edebilirsin.'),
    h('button', { class: 'btn green', onTap: () => ui.closeModal() }, 'Maceraya devam'));
  sound.play('victory');
  ui.modal(box);
}
