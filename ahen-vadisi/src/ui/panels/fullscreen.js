// "Tam ekrana geç": tarayıcı izin veriyorsa doğrudan tam ekran; vermiyorsa (iPhone Safari, izin verilmemiş iframe)
// oyunu ana ekrana uygulama olarak ekleme yolunu anlatan pencere. Oyunun kendi adresi = oyun sunucusu (Render
// derlenmiş oyunu da sunar), itch.io'daki gömülü sayfa ana ekrana eklenince tam ekran açılmaz.
import { h } from '../dom.js';
import { ui } from '../ui.js';
import { online } from '../../online/index.js';
import { requestFullscreen, isIOS, isStandalone, inFrame } from '../screen.js';
import { copyBackupCode } from './settings.js';

// online.json → gameServer (wss://adres) → https://adres/
export function gameHomeUrl() {
  const gs = String(online.cfg?.gameServer || '').trim();
  const m = /^wss?:\/\/([^/]+)/i.exec(gs);
  if (!m) return null;
  const secure = /^wss:/i.test(gs);
  return `${secure ? 'https' : 'http'}://${m[1]}/`;
}

export async function goFullscreen() {
  if (await requestFullscreen()) return true;
  fullscreenHelp();
  return false;
}

export function fullscreenHelp() {
  const home = gameHomeUrl();
  const atHome = !!home && !inFrame() && location.origin === new URL(home).origin;
  const ios = isIOS();
  const step = (n, ...c) => h('div', { class: 'row small', style: { alignItems: 'flex-start' } }, h('b', { class: 'gold', style: { minWidth: '18px' } }, n + '.'), h('div', { class: 'grow', style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, ...c));
  const link = home && !atHome
    ? h('a', { class: 'btn green small', href: home, target: '_blank', rel: 'noopener', 'data-testid': 'fs-open-home', style: { textDecoration: 'none', alignSelf: 'flex-start' } }, 'Oyunu kendi adresinde aç')
    : null;
  const urlText = home && !atHome ? h('div', { class: 'tiny muted', style: { userSelect: 'text', WebkitUserSelect: 'text', wordBreak: 'break-all' } }, `Açılmazsa bu adresi Safari'ye yaz: ${home}`) : null;
  const body = [];
  if (ios && isStandalone()) {
    body.push(h('p', { class: 'small' }, 'Oyun zaten ana ekran uygulaması olarak açık; Safari çubukları yok.'));
  } else if (ios) {
    body.push(h('p', { class: 'small' }, 'iPhone\'da Safari, web sayfalarının tam ekrana geçmesine izin vermiyor (itch.io dahil; bu bir Apple kısıtı). Safari çubukları olmadan oynamanın tek yolu oyunu ana ekrana uygulama olarak eklemek:'));
    let n = 1;
    if (!atHome) {
      body.push(step(n++, h('div', {}, home ? 'Oyunu kendi adresinde Safari\'de aç (itch.io sayfası ana ekrana eklenirse yine Safari içinde açılır):' : 'Oyunun kendi adresini Safari\'de aç.'), link, urlText));
    }
    body.push(step(n++, h('div', {}, 'Safari\'de ', h('b', {}, 'Paylaş'), ' düğmesine (kare ve yukarı ok) dokun → ', h('b', {}, 'Ana Ekrana Ekle'), ' → ', h('b', {}, 'Ekle'), '.')));
    body.push(step(n++, h('div', {}, 'Ana ekrandaki ', h('b', {}, 'Ahen Vadisi'), ' simgesiyle aç: oyun tam ekran açılır.')));
    body.push(h('p', { class: 'tiny warn' }, 'Ana ekran uygulamasının kaydı ayrı tutulur. Karakterini taşımak için uygulamada Ayarlar ve Yedek → Çevrimiçi\'den aynı hesapla giriş yapıp "Buluttan yükle" de, ya da şimdi yedek kodunu kopyalayıp uygulamada "Yedek kodu yapıştır" ile yükle.'));
    body.push(h('button', { class: 'btn small', style: { alignSelf: 'flex-start' }, onTap: () => copyBackupCode() }, 'Yedek kodunu kopyala'));
    if (home && !atHome) body.push(h('p', { class: 'tiny muted' }, 'Sunucu bir süredir boştaysa ilk açılış yaklaşık 1 dakika sürebilir; sonraki açılışlar hızlıdır.'));
  } else {
    body.push(h('p', { class: 'small' }, 'Tarayıcı bu sayfanın tam ekrana geçmesine izin vermedi.'));
    if (inFrame()) body.push(h('p', { class: 'small' }, 'itch.io\'da oyun çerçevesinin altındaki tam ekran düğmesini (⛶) kullanabilirsin.'));
    if (link) body.push(h('p', { class: 'small' }, 'Ya da oyunu kendi adresinde açıp tarayıcı menüsünden "Ana ekrana ekle" de; oradan tam ekran açılır.'), link, urlText);
  }
  ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '92%' }, 'data-testid': 'fullscreen-help' },
    h('h3', { class: 't' }, 'Tam ekran'),
    ...body,
    h('button', { class: 'btn', onTap: () => ui.closeModal() }, 'Kapat')));
}
