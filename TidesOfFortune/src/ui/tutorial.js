// İlk oyun eğitimi: oyuncu her adımı KENDİSİ uygular. Hedef düğme parlayan bir halkayla gösterilir,
// yanında kısa bir açıklama balonu durur; eylem yapılınca bir sonraki adıma geçilir.
// Eğitimi tamamlayan ya da atlayan oyuncuya bir daha gösterilmez (meta.tutorialDone).
import { h, clear } from './dom.js';
import { PH } from '../presentation/EncounterDirector.js';
import * as Ship from '../systems/ShipSystem.js';
import * as Trade from '../systems/TradeSystem.js';
import { GOOD_BY_ID } from '../data/goods.js';
import { CREW_BY_ID } from '../data/crew.js';
import { PET_BY_ID } from '../data/pets.js';

const STEPS = ['welcome', 'items', 'trade', 'depart', 'sail', 'sell', 'crew', 'pets', 'done'];
const NUM = (s) => STEPS.indexOf(s);

export class Tutorial {
  constructor(ui, stage) {
    this.ui = ui;
    this.stage = stage;
    const stageEl = stage.el;
    this.stageEl = stageEl;
    this.layer = h('div.tutLayer', {});
    this.ring = h('div.tutRing', {});
    this.bubble = h('div.tutBubble', {});
    this.layer.append(this.ring, this.bubble);
    stageEl.appendChild(this.layer);
    this.key = null;
    this.timer = setInterval(() => this.tick(), 180);
  }

  get core() { return this.ui.core; }

  /** Şu anki adımın görünümü: { target, text, buttons, center } ya da null (gösterilecek bir şey yok) */
  view() {
    const ui = this.ui;
    const core = this.core;
    const run = core.run;
    if (!run || run.ended || !run.tutorial || core.meta.tutorialDone || ui.view !== 'game' || ui.sub.mapOpen) return null;
    if (document.querySelector('.cinematic')) return null;
    // açık bir pencere varken (item ayrıntısı, onay) balon gizlenir; deniz yolu seçimi hariç
    if (document.querySelector('#overlay .modal') && !document.querySelector('.laneCard')) return null;
    const t = run.tutorial;
    const step = t.step;
    const G = core.G;
    const visit = run.visit;
    const tab = ui.sub.harborTab || 'trade';
    const inHarbor = run.phase === 'harbor' && visit;
    const go = (s) => { core.tutorialStep(s); return null; };
    const tabTarget = (id, label) => ({ target: `.harbor .tabs [data-tab="${id}"]`, text: label });
    const skipBtn = { label: 'Eğitimi atla', cls: '.ghost', on: () => this.skip() };

    switch (step) {
      case 'welcome': {
        if (!inHarbor) return run.phase === 'arrival' ? { text: 'Hoş geldin Kaptan! Varış notlarını oku ve limana gir.', target: '.arrival .apActions .btn.primary', small: true, place: 'top' } : null;
        return {
          center: true,
          title: 'Hoş geldin, Kaptan!',
          text: 'Paslı Martı ilk seferine hazır. Birkaç dakikada oyunun temelini birlikte uygulayarak öğrenelim: item seçmek, mal alıp satmak, yolculuk, tayfa ve hayvan.',
          buttons: [{ label: 'Başlayalım', cls: '.primary', on: () => { ui.sub.harborTab = 'items'; ui.sub.panelHidden = false; core.tutorialStep('items'); } }, skipBtn],
        };
      }
      case 'items': {
        if (!inHarbor) return null;
        const slots = Ship.itemSlots(G);
        if (visit.starterPicks <= 0 || run.items.length >= slots) return go('trade');
        if (tab !== 'items') return tabTarget('items', 'İlk limanda 3 item ÜCRETSİZ. "İtem Seç" sekmesini aç.');
        return {
          target: '.items .card:not(.bought) .cact .btn:not(.locked)',
          text: `Bir item seç (kalan ücretsiz seçim: ${visit.starterPicks}). Itemler yolda şansını artırır ya da kayıpları önler; her birinin sınırlı kullanım hakkı vardır. Kartın üstüne dokunursan ayrıntıyı görürsün.`,
          step: 1,
        };
      }
      case 'trade': {
        if (!inHarbor) return null;
        const free = Ship.cargoFree(G);
        const affordable = visit.market.some((m) => m.stock > 0 && Trade.buyPrice(G, visit.harborId, m.good) <= run.gold);
        const bought = run.cargo.some((l) => l.boughtVisit === visit.key);
        if (free <= 0 || (bought && !affordable)) return go('depart');
        if (tab !== 'trade') return tabTarget('trade', 'Şimdi ticaret: "Mal Al/Sat" sekmesini aç.');
        if (!affordable) return { text: 'Altının şu an başka mal almaya yetmiyor. Sorun değil: aldığın mallarla yola çıkabilirsin.', buttons: [{ label: 'Devam', cls: '.primary', on: () => core.tutorialStep('depart') }], step: 2 };
        return {
          target: () => [...document.querySelectorAll('.trade .trow:not(.lot) .tbtns')].find((x) => x.querySelector('.btn:not(.locked)')),
          text: `Ambarında ${free} boş yer var: en fazla bu kadar mal alabilirsin. "Al" bir birim, "×N" alabildiğin kadar alır. Ucuz aldığını başka limanda pahalıya satarsan kâr edersin.`,
          buttons: bought ? [{ label: 'Yeterli, devam', cls: '.primary', on: () => core.tutorialStep('depart') }] : [],
          step: 2,
        };
      }
      case 'depart': {
        if (run.phase === 'voyage') return go('sail');
        if (!inHarbor) return null;
        if (document.querySelector('.laneCard')) {
          return { target: '.laneCard', text: 'Deniz yolunu seç. Her yolun tehlikesi, uzunluğu ve rıhtım söylentileri farklıdır. Varacağın liman varana kadar gizli kalır.', step: 3 };
        }
        return { target: '.departBtn', text: 'Hazırsın! Sonraki limana yelken açma zamanı.', step: 3 };
      }
      case 'sail': {
        if (run.phase === 'harbor' && visit && visit.idx >= 1) return go('sell');
        if (run.phase === 'arrival') return { text: 'Limana vardın! Varış notlarını oku ve limana gir.', target: '.arrival .apActions .btn.primary', small: true, place: 'top' };
        if (run.phase !== 'voyage') return null;
        const d = ui.director;
        if (d.phase === PH.DECISION && document.querySelector('.optCard')) {
          return { target: '.encWrap .optCard:not(.locked)', text: 'Yolda bir olay! Seçeneklerden birini seç. Yüzde, başarı şansıdır; "Kesin" her zaman başarılır. Bazı seçenekler item, tayfa ya da altın ister.', step: 4 };
        }
        if (d.phase === PH.OUTCOME && document.querySelector('.contBtn')) {
          t.sawEvent = true;
          return { target: '.contBtn', text: 'Sonuç: kazanç ya da kayıp burada yazar. "Devam" ile yola devam et.', step: 4 };
        }
        if (d.phase === PH.SAIL || d.phase === PH.RESUME) {
          return { text: t.sawEvent ? 'Yolculuk sürüyor. Limana varınca mallarını satabileceksin.' : 'Yolculuktasın! Yolda başına bir şeyler gelebilir: korsanlar, fırtınalar, fırsatlar… Geldiğinde nasıl karar vereceğini göstereceğim.', small: true, step: 4 };
        }
        return null;
      }
      case 'sell': {
        if (!inHarbor) return null;
        const sellable = run.cargo.filter((l) => Trade.canSellHere(G, l).ok && !GOOD_BY_ID[l.good].questItem && l.boughtVisit !== visit.key);
        const sold = Object.values(visit.soldUnits || {}).some((n) => n > 0);
        if (sold || !sellable.length) return go('crew');
        if (tab !== 'trade') return tabTarget('trade', 'Yeni limana vardın! "Mal Al/Sat" sekmesinde ambarındaki mallara bak.');
        const best = sellable.map((l) => Trade.lotSellPrice(G, l) - l.cost).sort((a, b) => b - a)[0];
        return {
          target: '.trade .trow.lot .tbtns',
          text: best > 0
            ? '"Kâr/birim" yeşilse kârla satarsın, kırmızıysa zararına. Kârlı malı sat; zarardakini fiyatı daha iyi bir limana saklayabilirsin. Kârın her 10 altını 1 XP eder.'
            : 'Bu limanda mallarının fiyatı düşük (kırmızı = zarar). Ya şimdi satıp yer açarsın ya da daha iyi bir limana saklarsın. Ticarette fiyatlar limandan limana değişir.',
          buttons: best > 0 ? [] : [{ label: 'Saklayacağım', on: () => core.tutorialStep('crew') }],
          step: 5,
        };
      }
      case 'crew': {
        if (!inHarbor) return null;
        if (run.crew.length >= 1) return go('pets');
        if (!visit.crew.length) return go('pets');
        if (tab !== 'crew') return tabTarget('crew', 'Gemine tayfa alabilirsin. "Tayfa" sekmesini aç.');
        const id = visit.crew[0];
        return { target: '.crew .crewcard .cact .btn', text: `Her tayfanın pasif bir becerisi var (örneğin ${CREW_BY_ID[id].name}: ${CREW_BY_ID[id].title}). Eğitim hediyesi: ilk tayfan ücretsiz! İşe al.`, step: 6 };
      }
      case 'pets': {
        if (!inHarbor) return null;
        if (run.pets.length >= 1 || !visit.pet || visit.petBought) return go('done');
        if (tab !== 'pets') return tabTarget('pets', 'Bir de hayvan! "Hayvan" sekmesini aç.');
        return { target: '.pets .card .cact .btn', text: `Hayvanlar küçük ama işe yarar bonuslar verir. ${PET_BY_ID[visit.pet].name}: ${PET_BY_ID[visit.pet].passive} Bu da hediye!`, step: 7 };
      }
      case 'done':
        return {
          center: true,
          title: 'Eğitim tamam!',
          text: 'Artık rotanı sen çiziyorsun. Hedef: Büyük Liman. Gemini tersanede onar ve yükselt; ucuza alıp pahalıya sat. Batarsan bile kazandığın XP kalıcı yükseltmelere harcanır.',
          buttons: [{ label: 'Denize açıl!', cls: '.primary', on: () => { core.tutorialFinish(false); ui.audio?.play?.('achievement'); } }],
        };
      default:
        return null;
    }
  }

  skip() {
    this.ui.confirm('Eğitimi atlamak istiyor musun? Ayarlar\'dan istediğin zaman yeniden açabilirsin.', { title: 'Eğitimi atla', ok: 'Atla' }).then((y) => y && this.core.tutorialFinish(true));
  }

  /** Sahne koordinatı (1280×720) → ölçeklenmiş sahne içindeki dikdörtgen */
  rectOf(el) {
    const sr = this.stageEl.getBoundingClientRect();
    const k = this.stage.scale || sr.width / (this.stage.W || 1280);
    const r = el.getBoundingClientRect();
    return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
  }

  tick() {
    let v = null;
    try { v = this.view(); } catch (e) { v = null; }
    if (!v) { this.layer.classList.remove('on'); this.key = null; this.targetEl?.removeAttribute?.('data-tut'); this.targetEl = null; return; }
    this.layer.classList.add('on');
    const el = !v.target ? null : typeof v.target === 'function' ? v.target() || null : [...document.querySelectorAll(v.target)].find((x) => x.offsetParent !== null) || null;
    // test/erişilebilirlik: vurgulanan öğeyi işaretle
    if (this.targetEl !== el) { this.targetEl?.removeAttribute?.('data-tut'); this.targetEl = el; el?.setAttribute('data-tut', '1'); }
    // Halka
    if (el) {
      const r = this.rectOf(el);
      Object.assign(this.ring.style, { display: 'block', left: `${r.x - 6}px`, top: `${r.y - 6}px`, width: `${r.w + 12}px`, height: `${r.h + 12}px` });
    } else this.ring.style.display = 'none';
    // Balon (yalnızca içerik değişince yeniden kur: düğmeler tıklanabilir kalsın)
    const key = `${v.title || ''}|${v.text}|${(v.buttons || []).map((b) => b.label).join(',')}|${v.center ? 'c' : ''}`;
    if (key !== this.key) {
      this.key = key;
      clear(this.bubble);
      const total = STEPS.length - 2;
      this.bubble.append(...[
        v.step ? h('div.tutStep', {}, `Eğitim ${v.step}/${total}`) : null,
        v.title ? h('h3', {}, v.title) : null,
        h('p', {}, v.text),
        (v.buttons && v.buttons.length) || !v.center ? h('div.tutBtns', {},
          ...(v.buttons || []).map((b) => h(`button.btn.sm${b.cls || ''}`, { onTap: () => b.on() }, b.label)),
          !v.center ? h('button.btn.sm.ghost.tutSkip', { onTap: () => this.skip() }, 'Atla') : null,
        ) : null,
      ].filter(Boolean));
      this.bubble.className = `tutBubble${v.center ? ' center' : ''}${v.small ? ' small' : ''}`;
    }
    // Konum
    const W = this.stage.W || 1280, H = this.stage.H || 720;
    const bw = v.center ? 620 : 440;
    if (v.center) Object.assign(this.bubble.style, { left: `${W / 2 - bw / 2}px`, top: `${H / 2 - 160}px`, bottom: '', width: `${bw}px` });
    else if (el && v.place === 'top') Object.assign(this.bubble.style, { left: `${W / 2 - bw / 2}px`, width: `${bw}px`, top: '96px', bottom: '' });
    else if (el) {
      const r = this.rectOf(el);
      // balonu hedefin soluna/sağına ya da üstüne/altına, hedefi örtmeyecek şekilde yerleştir
      const below = r.y + r.h / 2 < H * 0.45;
      let x = Math.max(12, Math.min(W - bw - 12, r.x + r.w / 2 - bw / 2));
      const side = r.x > bw + 40 ? 'left' : r.x + r.w + bw + 40 < W ? 'right' : null;
      if (side && r.h < 220) {
        x = side === 'left' ? r.x - bw - 24 : r.x + r.w + 24;
        const y = Math.max(90, Math.min(H - 260, r.y + r.h / 2 - 90));
        Object.assign(this.bubble.style, { left: `${x}px`, width: `${bw}px`, top: `${y}px`, bottom: '' });
      } else Object.assign(this.bubble.style, { left: `${x}px`, width: `${bw}px`, top: below ? `${Math.min(H - 200, r.y + r.h + 16)}px` : '', bottom: below ? '' : `${Math.max(12, H - r.y + 16)}px` });
    } else Object.assign(this.bubble.style, { left: `${W / 2 - bw / 2}px`, width: `${bw}px`, top: '96px', bottom: '' });
  }
}
void NUM;
