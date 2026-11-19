// VARNETH application shell: screens, HUD, farm wiring.
import { h, fmt, pct, toast, modal, confirmBox, setRoot, withTooltip, showTooltip, hideTooltip } from './dom.js';
import { heroCanvas, skillIcon, itemIcon } from './icons.js';
import { connect, availableModes, ApiError } from '../services/backend.js';
import { FarmController } from '../services/farm.js';
import { audio } from '../game/audio.js';
import { CLASSES, APPEARANCE, CLASS_IDS } from '../../shared/data/classes.js';
import { SKILLS } from '../../shared/data/skills.js';
import { ZONE_BY_ID, REGION_BY_ID, DUNGEONS, BOSS_ENCOUNTERS } from '../../shared/data/regions.js';
import { ENEMIES } from '../../shared/data/enemies.js';
import { RARITIES } from '../../shared/data/rarities.js';
import { BASE_BY_ID } from '../../shared/data/items.js';
import { MATERIALS } from '../../shared/data/materials.js';
import { MAIN_QUEST_BY_ID, ACHIEVEMENT_BY_ID } from '../../shared/data/quests.js';
import { xpToNext } from '../../shared/formulas.js';
import { openPanel } from './panels.js';
import { t } from '../localization/i18n.js';

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

export const DEFAULT_SETTINGS = { music: 0.55, sfx: 0.7, ui: 0.6, muted: false, fx: 'high', shake: true, numbers: 'all', lang: 'tr' };

export class App {
  constructor(rootEl, scene, manifest, registry) {
    this.root = rootEl;
    setRoot(rootEl);
    this.scene = scene;
    this.registry = registry;
    this.man = manifest;
    this.settings = registry.get('settings');
    this.api = null;
    this.boot = null;
    this.view = null; // current character view
    this.farm = null;
    this.feed = [];
    this.lastHud = 0;
    registry.set('onBanner', (text, tone) => this.banner(text, tone));
    registry.set('onFrame', (dt) => this.frame(dt));
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  // ------------------------------------------------------------------ generic call wrapper
  async call(name, args = {}, { quiet = false } = {}) {
    try {
      return await this.api.call(name, args);
    } catch (e) {
      if (!quiet) { toast(e.message || String(e), 'err'); audio.sfx('error'); }
      throw e;
    }
  }

  clear() { this.root.replaceChildren(); }

  // one backend instance per mode (prevents two in-browser databases racing)
  async ensureApi(onProgress) {
    if (this.api && this.api.mode === this.mode) return this.api;
    this.apiPromises ||= {};
    this.apiPromises[this.mode] ||= connect(this.mode, onProgress).catch((e) => { delete this.apiPromises[this.mode]; throw e; });
    this.api = await this.apiPromises[this.mode];
    return this.api;
  }

  // ------------------------------------------------------------------ boot / login
  async start() {
    const modes = availableModes();
    const saved = LS.get('varneth.mode', null);
    this.mode = modes.includes(saved) ? saved : modes[0];
    audio.setVolumes(this.settings);
    audio.playMusic('menu');
    await this.loginScreen();
  }

  async loginScreen(err) {
    this.clear();
    this.scene.setHub();
    this.scene.setHero(null);
    const modes = availableModes();
    const modeNames = { online: 'Çevrimiçi (Supabase)', local: 'Yerel Sunucu', sandbox: 'Sandbox — çevrimdışı antrenman' };
    const user = h('input', { placeholder: 'kullanıcı adı', autocomplete: 'username' });
    const pass = h('input', { type: 'password', placeholder: 'şifre', autocomplete: 'current-password' });
    const msg = h('div', { class: 'small danger-text' }, err || '');
    const modeSel = h('select', { onchange: async (e) => { this.mode = e.target.value; LS.set('varneth.mode', this.mode); this.api = null; this.loginScreen(); } },
      modes.map((m) => h('option', { value: m, selected: m === this.mode }, modeNames[m])));
    const card = h('div', { class: 'card frame' },
      h('img', { class: 'logo', src: 'assets/ui/logo.png', alt: 'VARNETH' }),
      h('div', { class: 'subtitle' }, 'The Endless Hunt · Alpha 0.1 — The First Hunt'),
      h('label', {}, 'Bağlantı modu'), modeSel,
      this.mode === 'sandbox' ? h('div', { class: 'notice', style: { marginTop: '6px' } },
        'SANDBOX: Tüm oyun bu tarayıcıdaki yerel PostgreSQL (WASM) üzerinde çalışır. Gerçek oyuncu pazarı kapalıdır; sandbox verileri canlı ekonomiye aktarılmaz. ',
        modes.length === 1 ? 'Çevrimiçi mod için .env dosyasında Supabase değerlerini tanımla.' : '') : null,
      this.mode === 'online' ? h('div', { class: 'small muted', style: { marginTop: '6px' } }, 'Supabase Auth ile e-posta + şifre. Pazar ve ilerleme sunucu tarafında doğrulanır.') : null,
      this.mode === 'local' ? h('div', { class: 'small muted', style: { marginTop: '6px' } }, 'Yerel sunucu: npm run server. İki tarayıcıda iki ayrı hesapla gerçek pazar testi yapılabilir.') : null,
      h('label', {}, this.mode === 'online' ? 'E-posta' : 'Kullanıcı adı'), user,
      h('label', {}, 'Şifre'), pass, msg,
      h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'primary grow', onclick: () => go('login') }, 'Giriş Yap'),
        h('button', { class: 'grow', onclick: () => go('register') }, 'Hesap Oluştur')),
      h('p', { class: 'small muted', style: { marginTop: '12px' } },
        'Kırılma\'dan sonra Varneth\'in krallıkları düştü. Kadim Ocak\'ın sızan enerjisi yaratıkları sürekli yeniden doğuruyor. Son Sığınak\'tan çıkan Avcılar eser, mühür ve ganimet peşinde. Sen de onlardan birisin.'));
    if (this.mode === 'online') user.type = 'email';
    const go = async (kind) => {
      msg.textContent = '';
      try {
        await this.ensureApi((s) => { msg.textContent = s; });
        msg.textContent = '';
        await this.api[kind](user.value.trim(), pass.value);
        await this.afterLogin();
      } catch (e) { msg.textContent = e.message || String(e); audio.sfx('error'); }
    };
    pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') go('login'); });
    this.root.append(h('div', { class: 'screen' }, card));
    // auto-restore session
    try {
      await this.ensureApi((s) => { msg.textContent = s; });
      msg.textContent = '';
      const r = await this.api.restore();
      if (r) await this.afterLogin();
    } catch (e) { msg.textContent = e.message; }
  }

  async afterLogin() {
    this.boot = await this.call('bootstrap');
    if (!this.boot.profile) return this.profileScreen();
    if (this.boot.offline) this.showOffline(this.boot.offline);
    return this.charSelect();
  }

  profileScreen() {
    this.clear();
    const name = h('input', { placeholder: 'Avcı adın (pazarda görünür)', maxlength: 20 });
    this.root.append(h('div', { class: 'screen' }, h('div', { class: 'card frame' },
      h('h2', {}, 'Avcılar Loncası\'na Kayıt'),
      h('p', { class: 'muted small' }, 'Bu ad hesabının genel adıdır ve pazar ilanlarında satıcı adı olarak görünür.'),
      name,
      h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'primary', onclick: async () => { await this.call('create_profile', { displayName: name.value }); this.boot = await this.call('bootstrap'); this.charSelect(); } }, 'Kaydol'),
        h('button', { class: 'ghost', onclick: async () => { await this.api.logout(); this.loginScreen(); } }, 'Çıkış')))));
  }

  // ------------------------------------------------------------------ character select
  charSelect() {
    this.clear();
    audio.playMusic('menu');
    this.scene.setHub();
    this.scene.setHero(null);
    const slots = [1, 2, 3].map((slot) => {
      const c = this.boot.characters.find((x) => x.slot === slot);
      if (!c) return h('div', { class: 'slot frame empty', onclick: () => this.charCreate(slot) }, h('div', { style: { fontSize: '40px', color: '#6a4e2a' } }, '+'), h('div', {}, `Yuva ${slot}`), h('div', { class: 'small muted' }, 'Yeni avcı oluştur'));
      return h('div', { class: 'slot frame', onclick: () => this.enterGame(c.id) },
        heroCanvas(c.cls, c.appearance, {}, 2),
        h('div', { class: 'gold', style: { fontFamily: 'var(--font)' } }, c.name),
        h('div', { class: 'small' }, `${CLASSES[c.cls].name} · Seviye ${c.level}`),
        this.boot.session?.characterId === c.id ? h('div', { class: 'small ok-text' }, 'Avda') : null,
        h('button', { class: 'small danger', onclick: async (e) => {
          e.stopPropagation();
          if (!(await confirmBox(`${c.name} silinsin mi? Bağlı olmayan eşyaları ortak depoya taşınır. Bu işlem geri alınamaz.`, { ok: 'Sil', danger: true }))) return;
          await this.call('delete_character', { characterId: c.id });
          this.boot = await this.call('bootstrap'); this.charSelect();
        } }, 'Sil'));
    });
    this.root.append(h('div', { class: 'screen' }, h('div', { class: 'card frame', style: { width: 'min(760px,100%)' } },
      h('img', { class: 'logo', src: 'assets/ui/logo.png', alt: 'VARNETH', style: { width: 'min(300px,60vw)' } }),
      h('div', { class: 'row' }, h('h2', { class: 'grow' }, `Avcılar — ${this.boot.profile.displayName}`), this.modeBadge(),
        h('span', { class: 'gold' }, `${fmt(this.boot.gold)} altın`)),
      h('div', { class: 'slots' }, slots),
      h('div', { class: 'row', style: { marginTop: '10px', justifyContent: 'space-between' } },
        h('span', { class: 'small muted' }, 'Hesap başına 3 yuva · sınıf kısıtlaması yok · altın, depo ve koleksiyon ortak.'),
        h('button', { class: 'ghost', onclick: async () => { await this.api.logout(); this.api = null; this.loginScreen(); } }, 'Çıkış Yap')))));
  }

  modeBadge() {
    const m = this.api?.mode;
    return h('span', { class: 'badge ' + m }, m === 'online' ? 'ÇEVRİMİÇİ' : m === 'local' ? 'YEREL SUNUCU' : 'SANDBOX');
  }

  charCreate(slot) {
    this.clear();
    const st = { cls: 'warrior', body: 0, skin: 1, hair: 0, hairColor: 1, cosmetic: 0 };
    const name = h('input', { placeholder: 'Karakter adı (3-16)', maxlength: 16 });
    const preview = h('div', { style: { display: 'flex', justifyContent: 'center', minHeight: '200px' } });
    const desc = h('p', { class: 'small muted' });
    const redraw = () => {
      preview.replaceChildren(heroCanvas(st.cls, st, {}, 3, 0), heroCanvas(st.cls, st, {}, 3, 20));
      desc.textContent = CLASSES[st.cls].desc;
      for (const el of classPicks) el.classList.toggle('sel', el.dataset.cls === st.cls);
    };
    const classPicks = CLASS_IDS.map((c) => h('div', { class: 'classpick', 'data-cls': c, onclick: () => { st.cls = c; redraw(); } }, heroCanvas(c, st, {}, 1), h('div', {}, CLASSES[c].name), h('div', { class: 'small muted' }, CLASSES[c].resourceName)));
    const swatches = (key, colors) => h('div', { class: 'swatches' }, colors.map((col, i) => {
      const el = h('div', { class: 'swatch' + (st[key] === i ? ' sel' : ''), style: { background: col }, onclick: () => { st[key] = i; el.parentNode.querySelectorAll('.swatch').forEach((x, j) => x.classList.toggle('sel', j === i)); redraw(); } });
      return el;
    }));
    const select = (key, opts) => h('select', { onchange: (e) => { st[key] = Number(e.target.value); redraw(); } }, opts.map((o, i) => h('option', { value: i, selected: st[key] === i }, o)));
    this.root.append(h('div', { class: 'screen' }, h('div', { class: 'card frame', style: { width: 'min(820px,100%)' } },
      h('h2', {}, `Yeni Avcı — Yuva ${slot}`),
      h('div', { class: 'two' },
        h('div', {}, h('div', { class: 'classes' }, classPicks), desc, preview),
        h('div', {},
          h('label', {}, 'Ad'), name,
          h('label', {}, 'Gövde'), select('body', APPEARANCE.bodies),
          h('label', {}, 'Ten tonu'), swatches('skin', APPEARANCE.skins),
          h('label', {}, 'Saç modeli'), select('hair', APPEARANCE.hairStyles),
          h('label', {}, 'Saç rengi'), swatches('hairColor', APPEARANCE.hairColors),
          h('label', {}, 'Ek kozmetik'), select('cosmetic', APPEARANCE.cosmetics),
          h('div', { class: 'row', style: { marginTop: '14px' } },
            h('button', { class: 'primary', onclick: async () => {
              const r = await this.call('create_character', { slot, name: name.value, cls: st.cls, appearance: st });
              this.boot = await this.call('bootstrap');
              audio.sfx('levelup');
              this.enterGame(r.characterId);
            } }, 'Avcıyı Yarat'),
            h('button', { class: 'ghost', onclick: () => this.charSelect() }, 'Geri')))))));
    redraw();
  }

  // ------------------------------------------------------------------ game
  async enterGame(charId) {
    const r = await this.call('select_character', { characterId: charId });
    this.view = r.view;
    this.boot = await this.call('bootstrap');
    if (this.farm?.active) await this.farm.stop().catch(() => {});
    this.farm = new FarmController(this.api, {
      onEvents: (evs) => this.onSimEvents(evs),
      onSettlement: (s) => this.onSettlement(s),
      onEnded: (info, sess) => this.onFarmEnded(info, sess),
      onError: (e) => toast('Bağlantı sorunu: ' + (e.message || e), 'err'),
      onGold: (g) => { this.boot.gold = g; },
    });
    this.applyHero();
    this.buildHud();
    this.scene.setHub();
    audio.playMusic('hub');
    // resume a running session of this character (e.g. page reload)
    if (this.boot.session && this.boot.session.characterId === charId) {
      try {
        const hb = await this.call('farm_heartbeat', { sessionId: this.boot.session.id }, { quiet: true });
        if (hb.session) this.beginSession(hb.session);
      } catch { /* expired */ }
    }
  }

  applyHero() {
    const c = this.view.character;
    this.registry.set('heroChar', c);
    this.registry.set('heroEquip', this.view.equipped);
    this.scene.setHero(c, this.view.equipped);
  }

  async refreshView() {
    this.view = await this.call('character', { characterId: this.view.character.id });
    this.boot = await this.call('bootstrap');
    this.applyHero();
    this.updateHudStatic();
  }

  async startFarm(kind, target, difficulty = 'normal', useDailyHunt = false) {
    if (this.farm.active) await this.farm.stop().catch(() => {});
    const r = await this.call('farm_start', { characterId: this.view.character.id, kind, target, difficulty, useDailyHunt });
    if (r.offline) this.showOffline(r.offline);
    this.beginSession(r.session);
    this.closePanels();
  }

  beginSession(session) {
    this.farm.begin(session);
    const bg = session.kind === 'farm' ? ZONE_BY_ID[session.target].bg : session.kind === 'boss' ? BOSS_ENCOUNTERS[session.target].bg : DUNGEONS[session.target].bg;
    this.scene.bindSim(this.farm.sim, { bg });
    const region = session.kind === 'farm' ? REGION_BY_ID[ZONE_BY_ID[session.target].region] : null;
    audio.playMusic(session.kind === 'boss' ? 'boss' : session.kind === 'dungeon' ? 'dungeon' : region?.music || 'meadow');
    this.updateHudStatic();
  }

  closePanels() { this.root.querySelectorAll('.modal-wrap').forEach((m) => m.remove()); hideTooltip(); }

  frame() {
    if (!this.farm) return;
    this.farm.update();
    if (this.farm.sim) this.scene.syncFromSim(this.farm.sim);
    const now = performance.now();
    if (now - this.lastHud > 100) { this.lastHud = now; this.updateHud(); }
  }

  onSimEvents(evs) {
    this.scene.handleEvents(evs);
    for (const e of evs) {
      if (e.k === 'phase' && e.text && ENEMIES[this.farm.sim?.e.find((x) => x.id === e.id)?.tpl]?.tier === 'boss') audio.playMusic('boss');
      if (e.k === 'spawn' && (e.tier === 'champion')) audio.playMusic('rare');
      if (e.k === 'kill' && e.tier === 'champion' && this.farm.session?.kind === 'farm') {
        const z = ZONE_BY_ID[this.farm.session.target];
        audio.playMusic(REGION_BY_ID[z.region].music);
      }
    }
  }

  onSettlement(s) {
    if (s.gold) audio.sfx('gold');
    for (const it of s.items || []) this.pushFeed(it);
    if (s.autoSold) this.pushFeedText(`${s.autoSold} eşya otomatik satıldı`, '#9b8f80');
    if (s.autoSalvaged) this.pushFeedText(`${s.autoSalvaged} eşya otomatik parçalandı`, '#9b8f80');
    if (s.levelsGained) {
      audio.sfx('levelup');
      this.scene.spawnFx('fx_levelup', this.scene.hero?.x || 140, 250, 1.5);
      this.banner(`Seviye ${s.level}!`, 'level');
      toast(`Seviye atladın: ${s.level}. Yeni yetenek puanı ve beceriler için Karakter menüsüne bak.`);
    }
    for (const q of s.questUpdates || []) {
      if (q.state === 'complete') { const mq = MAIN_QUEST_BY_ID[q.quest]; toast(`Görev tamamlandı: ${mq ? mq.name : 'Kontrat'} — ödülünü Görevler menüsünden al.`); audio.sfx('rare'); }
    }
    for (const a of s.achievements || []) toast(`Başarım: ${ACHIEVEMENT_BY_ID[a]?.name}`);
    for (const r of s.unlocked || []) this.banner(`Yeni bölge açıldı: ${REGION_BY_ID[r].name}`, 'level');
    this.refreshView().catch(() => {});
  }

  async onFarmEnded(info, sess) {
    const kind = sess?.kind;
    this.scene.setHub();
    audio.playMusic('hub');
    await this.refreshView().catch(() => {});
    if (kind === 'boss' || kind === 'dungeon') {
      const won = info.status === 'won';
      const name = kind === 'boss' ? ENEMIES[sess.target].name : DUNGEONS[sess.target].name;
      modal(won ? 'Zafer!' : 'Yenilgi', h('div', { class: 'col' },
        h('p', {}, won ? `${name} alt edildi. Ganimetler sunucu tarafından doğrulandı ve çantana eklendi.` : `${name} karşısında düştün. Ekipmanların korunur; daha iyi bir build ile tekrar dene.`),
        won && kind === 'boss' ? h('p', { class: 'gold' }, REGION_BY_ID[BOSS_ENCOUNTERS[sess.target].region].sealFragment) : null), { wide: false });
      if (won) audio.sfx('legendary');
    } else if (info.reason === 'replaced') {
      toast('Av oturumu başka bir sekmede/cihazda başlatıldığı için durduruldu.', 'err');
    } else if (info.reason === 'deaths') {
      toast('Üst üste ölümler nedeniyle av durduruldu (ölüm kuralı).', 'err');
    } else if (info.reason === 'expired') {
      toast('Bağlantı uzun süre kesildi; aktif av sona erdi, offline ilerlemeye geçildi.', 'err');
    }
    this.updateHudStatic();
  }

  pushFeed(it) {
    const b = BASE_BY_ID[it.base_id];
    this.pushFeedText(`${b?.name || it.base_id}${it.location === 'overflow' ? ' (çanta dolu → Kayıp Eşya)' : ''}`, RARITIES[it.rarity].color, it);
  }
  pushFeedText(text, color, item) {
    if (!this.feedEl) return;
    const el = h('div', { style: { borderLeftColor: color, color } }, item ? '✓ ' : '', text);
    if (item) withTooltip(el, () => h('div', { class: 'small' }, 'Sunucu tarafından doğrulandı'));
    this.feedEl.prepend(el);
    while (this.feedEl.children.length > 9) this.feedEl.lastChild.remove();
  }

  banner(text, tone) {
    if (!this.hudEl) return;
    const b = h('div', { class: 'banner', style: tone === 'warn' ? { color: '#ff8a6a' } : tone === 'champion' ? { color: '#ffd040' } : {} }, text);
    this.hudEl.append(b);
    setTimeout(() => b.remove(), 2700);
  }

  // ------------------------------------------------------------------ HUD
  buildHud() {
    this.clear();
    const c = this.view.character;
    const hud = h('div', { class: 'hud' });
    this.hudEl = hud;
    this.hpBar = h('div', { class: 'bar hp' }, h('i'), h('span'));
    this.resBar = h('div', { class: 'bar res ' + CLASSES[c.cls].resource }, h('i'), h('span'));
    this.xpBar = h('div', { class: 'bar xp' }, h('i'), h('span'));
    this.nameEl = h('div', { class: 'name' });
    this.buffEl = h('div', { class: 'small muted' });
    const portrait = h('div', { class: 'portrait frame' }, this.nameEl, this.hpBar, this.resBar, this.xpBar, this.buffEl);
    this.zoneEl = h('div', { class: 'zone-label' });
    this.targetEl = h('div', { class: 'target-box frame', style: { display: 'none' } });
    this.bossEl = h('div', { style: { display: 'none' } }, h('div', { class: 'small gold', style: { fontFamily: 'var(--font)' } }), h('div', { class: 'bar boss' }, h('i'), h('span')));
    const center = h('div', { class: 'hud-center' }, this.zoneEl, this.bossEl, this.targetEl);
    this.goldEl = h('div', { class: 'goldline' });
    this.statsEl = h('div', { class: 'stats-box frame' });
    this.feedEl = h('div', { class: 'loot-feed' });
    const right = h('div', { class: 'hud-right' }, this.goldEl, this.statsEl, this.feedEl);
    this.skillbar = h('div', { class: 'skillbar frame' });
    this.farmCtl = h('div', { class: 'farmctl frame' });
    const bottom = h('div', { class: 'hud-bottom' }, this.skillbar, this.farmCtl);
    const menus = [
      'world', 'character', 'inventory', 'dungeons', 'quests', 'workshop', 'stash', 'market', 'collection', 'settings',
    ].map((k) => [k, t('menu.' + k)]);
    this.menuBtns = {};
    const menubar = h('div', { class: 'menubar' }, menus.map(([k, label]) => (this.menuBtns[k] = h('button', { onclick: () => { audio.sfx('click'); openPanel(this, k); } }, label))));
    hud.append(h('div', { class: 'hud-top' }, portrait), center, right, bottom, menubar, h('div', { class: 'mode-pill' }, this.modeBadge()));
    this.root.append(hud);
    this.updateHudStatic();
    this.updateHud();
  }

  updateHudStatic() {
    if (!this.hudEl || !this.view) return;
    const c = this.view.character;
    this.nameEl.replaceChildren(`${c.name} `, h('span', { class: 'small muted' }, `· ${CLASSES[c.cls].name} · Sv ${c.level}`));
    const xpMax = xpToNext(c.level);
    const capped = c.level >= 30;
    this.xpBar.firstChild.style.width = (capped ? 100 : Math.min(100, (c.xp / xpMax) * 100)) + '%';
    this.xpBar.lastChild.textContent = capped ? 'Alpha seviye sınırı (30)' : `${fmt(c.xp)} / ${fmt(xpMax)} XP`;
    this.buffEl.textContent = (c.buffs || []).map((b) => `${MATERIALS[b.id]?.name} ${Math.ceil(b.remaining / 60)}dk`).join(' · ');
    // skill bar
    this.skillbar.replaceChildren(...(this.view.stats.actives.length ? this.view.stats.actives : []).map((id) => {
      const el = h('div', { class: 'skill', 'data-skill': id }, skillIcon(id), h('div', { class: 'cd' }), h('div', { class: 'cdt' }));
      return withTooltip(el, () => h('div', {}, h('div', { class: 'tname gold' }, SKILLS[id].name), h('div', { class: 'small' }, SKILLS[id].desc), h('div', { class: 'small muted' }, `Maliyet ${SKILLS[id].cost} · Bekleme ${SKILLS[id].cd} sn`)));
    }));
    if (!this.view.stats.actives.length) this.skillbar.append(h('span', { class: 'small muted' }, 'Aktif yetenek yok'));
    // farm control
    const s = this.farm?.session;
    const zoneName = s ? (s.kind === 'farm' ? ZONE_BY_ID[s.target].name : s.kind === 'boss' ? ENEMIES[s.target].name : `${DUNGEONS[s.target].name} (${DUNGEONS[s.target].difficulties[s.difficulty].name})`) : 'Son Sığınak';
    this.zoneEl.textContent = zoneName + (s ? ' · Otomatik savaş' : '');
    this.farmCtl.replaceChildren(
      s ? h('button', { class: 'danger', onclick: async () => { await this.farm.stop(); toast('Av durduruldu. Offline ilerleme başladı.'); } }, '■ Avı Durdur')
        : h('button', { class: 'primary', onclick: () => {
          const zone = this.view.progress.currentZone;
          this.startFarm('farm', ZONE_BY_ID[zone] && this.view.progress.unlockedRegions.includes(ZONE_BY_ID[zone].region) ? zone : 'abandoned_road');
        } }, '▶ Ava Çık'),
      h('button', { onclick: () => openPanel(this, 'world') }, 'Bölge Seç'),
    );
    this.menuBtns.quests?.classList.toggle('notify', this.view.quests.some((q) => q.state === 'complete') || this.boot.achievements.some((a) => !a.claimed));
    this.menuBtns.market?.classList.toggle('notify', this.boot.notifications.some((n) => !n.read));
  }

  updateHud() {
    if (!this.hudEl) return;
    const sim = this.farm?.sim;
    const st = this.view.stats;
    const C = CLASSES[this.view.character.cls];
    const p = sim?.p;
    const hp = p ? Math.max(0, p.hp) : st.maxHp;
    const maxHp = p ? p.stats.maxHp : st.maxHp;
    this.hpBar.firstChild.style.width = (hp / maxHp) * 100 + '%';
    this.hpBar.lastChild.textContent = `${fmt(hp)} / ${fmt(maxHp)}${p?.shield > 0 ? ` (+${fmt(p.shield)} kalkan)` : ''}`;
    const res = p ? p.res : C.resourceStart;
    this.resBar.firstChild.style.width = (res / C.resourceMax) * 100 + '%';
    this.resBar.lastChild.textContent = `${C.resourceName} ${Math.round(res)}`;
    this.goldEl.textContent = `${fmt(this.boot.gold)} altın`;
    const r = this.farm?.active ? this.farm.rates() : null;
    this.statsEl.replaceChildren(
      ...[['Durum', p ? (p.state === 'DYING' ? 'Öldü — yeniden doğuyor' : stateName(p.state)) : 'Sığınakta'],
        ['XP/saat', r ? fmt(r.xpH) : '—'], ['Altın/saat', r ? fmt(r.goldH) : '—'],
        ['Kesilen', r ? fmt(r.kills) : '—'], ['DPS (tahmini)', fmt(st.estDps)],
        ...this.view.quests.filter((q) => q.state === 'active').slice(0, 2).map((q) => [questName(q), `${q.progress}/${q.target}`])]
        .map(([k, v]) => h('div', {}, h('span', { class: 'k' }, k), h('span', { class: 'v' }, v))));
    // target & boss
    if (sim) {
      const boss = sim.e.find((e) => e.tier === 'boss' && !e.dead);
      if (boss) {
        this.bossEl.style.display = '';
        this.bossEl.firstChild.textContent = ENEMIES[boss.tpl].name + (boss.phaseGuard ? ' — korumalı!' : '');
        this.bossEl.lastChild.firstChild.style.width = (boss.hp / boss.maxHp) * 100 + '%';
        this.bossEl.lastChild.lastChild.textContent = `${fmt(Math.max(0, boss.hp))} / ${fmt(boss.maxHp)}`;
      } else this.bossEl.style.display = 'none';
      const tgt = sim.e.find((e) => e.id === sim.p.target && !e.dead);
      if (tgt && tgt.tier !== 'boss') {
        this.targetEl.style.display = '';
        const tier = { elite: ' (Elit)', champion: ' (Şampiyon)', normal: '' }[tgt.tier];
        this.targetEl.replaceChildren(h('span', {}, `${ENEMIES[tgt.tpl].name}${tier} · Sv ${tgt.level}`), h('div', { class: 'bar hp' }, h('i', { style: { width: (tgt.hp / tgt.maxHp) * 100 + '%' } }), h('span', {}, fmt(Math.max(0, tgt.hp)))));
      } else this.targetEl.style.display = 'none';
      // cooldowns
      for (const el of this.skillbar.querySelectorAll('.skill')) {
        const id = el.dataset.skill;
        const cd = p.cds[id] || 0;
        const total = SKILLS[id].cd;
        el.querySelector('.cd').style.height = Math.min(100, (cd / total) * 100) + '%';
        el.querySelector('.cdt').textContent = cd > 0.05 ? cd.toFixed(cd < 3 ? 1 : 0) : '';
        el.classList.toggle('casting', p.cast?.id === id);
      }
    } else {
      this.bossEl.style.display = 'none';
      this.targetEl.style.display = 'none';
    }
  }

  // ------------------------------------------------------------------ offline report
  showOffline(o) {
    const hrs = Math.floor(o.seconds / 3600), mins = Math.floor((o.seconds % 3600) / 60);
    const wrap = h('div', { class: 'modal-wrap', style: { zIndex: 45 } });
    wrap.append(h('div', { class: 'offline-panel frame' },
      h('h2', {}, 'Sen Yokken Neler Oldu?'),
      h('p', { class: 'muted small' }, `${o.characterName} avlanmayı sürdürdü (azaltılmış verim).`),
      h('div', { class: 'kv' }, h('span', {}, 'Geçen süre'), h('span', {}, `${hrs} sa ${mins} dk${o.capped ? ' (8 saat sınırı)' : ''}`)),
      h('div', { class: 'kv' }, h('span', {}, 'Kazanılan XP'), h('span', { class: 'gold' }, fmt(o.xp))),
      o.levelsGained ? h('div', { class: 'kv' }, h('span', {}, 'Yeni seviye'), h('span', { class: 'ok-text' }, `${o.level} (+${o.levelsGained})`)) : null,
      ...Object.entries(o.materials || {}).map(([m, n]) => h('div', { class: 'kv' }, h('span', {}, `${MATERIALS[m].name} (karaktere bağlı)`), h('span', {}, '×' + n))),
      h('p', { class: 'small muted' }, 'Offline süre altın, ticarete açık ekipman veya pazarlanabilir eşya üretmez. Bağlı malzemeler yalnızca Simyacı iksirlerinde kullanılabilir.'),
      h('button', { class: 'primary', onclick: () => wrap.remove() }, 'Ava Dön')));
    this.root.append(wrap);
  }
}

function stateName(s) {
  return { IDLE: 'Bekliyor', ACQUIRE_TARGET: 'Hedef seçiyor', APPROACH: 'Yaklaşıyor', REPOSITION: 'Mesafe alıyor', BASIC_ATTACK: 'Saldırıyor', CAST_SKILL: 'Yetenek', EVADE_TELEGRAPH: 'Kaçınıyor!', HIT_REACTION: 'Sersemledi', DYING: 'Öldü', RESPAWN: 'Yeniden doğuyor', TRAVEL: 'İlerliyor' }[s] || s;
}
function questName(q) {
  return q.kind === 'main' ? MAIN_QUEST_BY_ID[q.id]?.name || q.id : q.data?.name || 'Kontrat';
}

export { LS, t, pct };
