import Phaser from 'phaser';
import { CHAMPIONS, CHAMP_BY_ID, CLASS_NAMES, CLASS_STATS, ChampClass, Position, SYNERGIES } from '../data/champions';
import { BUILD_NAMES, BuildKind } from '../data/builds';
import { COMPONENTS, ITEMS, ITEM_BY_ID } from '../data/items';
import { SaveData, defaultSave, getBuild, loadSave, resetBuild, saveSave, setBuild } from '../save/storage';
import { icon, itemIcon, portrait, MANIFEST } from '../render/assets';
import { Match } from '../match';
import { botDraft } from '../ai/draft';
import { Rng } from '../core/rng';
import { BattleBridge, BattleScene } from '../render/BattleScene';
import { Hud } from './hud';
import { DIFFICULTY_NAMES, PERSONALITY_NAMES, Difficulty, Personality } from '../ai/botCommander';
import type { Style, JungleStrategy } from '../core/types';
import { setSound, sfx, unlockAudio } from '../render/audio';

export const STYLE_NAMES: Record<Style, string> = { aggressive: 'Agresif', balanced: 'Dengeli', defensive: 'Savunmacı' };
export const JS_NAMES: Record<JungleStrategy, string> = { aggressive: 'Agresif', balanced: 'Dengeli', farm: 'Farm odaklı' };
const POS: Position[] = ['top', 'jungle', 'bot'];
export const POS_NAMES: Record<Position, string> = { top: 'Üst koridor', jungle: 'Orman', bot: 'Alt koridor' };
const FIT_NAMES = { high: 'Yüksek uyum', mid: 'Orta uyum', low: 'Düşük uyum' };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export class App {
  save: SaveData = loadSave();
  tab: 'battle' | 'champions' | 'rewards' | 'profile' = 'battle';
  root = document.getElementById('ui')!;
  classFilter: ChampClass | 'all' = 'all';
  game: Phaser.Game | null = null;
  hud: Hud | null = null;
  bridge: BattleBridge | null = null;

  constructor() {
    setSound(this.save.prefs.sound);
    document.addEventListener('pointerdown', () => unlockAudio(), { once: false });
    this.showMenu();
  }

  // ---------------------------------------------------------------- menu shell
  showMenu() {
    this.root.innerHTML = `<div class="screen" id="menu">
      <div class="topnav">
        <div class="logo">⚔ MOBA Tactics <small>v0.1 prototip</small></div>
        ${(['battle', 'champions', 'rewards', 'profile'] as const).map((t) => `<button class="tab ${this.tab === t ? 'on' : ''}" data-tab="${t}">${{ battle: 'Savaş', champions: 'Şampiyonlar', rewards: 'Ödüller', profile: 'Profil' }[t]}</button>`).join('')}
      </div>
      <div class="content" id="content"></div>
    </div>`;
    this.root.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => (b.onclick = () => { sfx('click'); this.tab = b.dataset.tab as any; this.showMenu(); }));
    const c = this.root.querySelector('#content') as HTMLElement;
    if (this.tab === 'battle') this.renderPrep(c);
    else if (this.tab === 'champions') this.renderChampions(c);
    else if (this.tab === 'rewards') this.renderRewards(c);
    else this.renderProfile(c);
  }

  // ---------------------------------------------------------------- prep
  renderPrep(c: HTMLElement) {
    const t = this.save.team;
    const ids = t.picks.map((p) => p.champId);
    const syn = SYNERGIES.filter((s) => ids.includes(s.a) && ids.includes(s.b));
    c.innerHTML = `<div class="prep">
      ${POS.map((pos, i) => {
        const p = t.picks[i];
        const d = CHAMP_BY_ID[p.champId];
        const fit = d.pos[pos];
        const build = getBuild(this.save, p.champId, p.buildKind);
        return `<div class="card slot">
          <div class="role">${POS_NAMES[pos]}</div>
          <div class="champ" data-pick="${i}">${portrait(p.champId, 64)}<div><div class="nm">${d.name}</div><div class="tt">${d.title} · ${CLASS_NAMES[d.cls]}</div><span class="fit ${fit}">${FIT_NAMES[fit]}</span></div></div>
          <div class="row"><span class="muted">Davranış</span><div class="seg">${(['aggressive', 'balanced', 'defensive'] as Style[]).map((s) => `<button class="${p.style === s ? 'on' : ''}" data-style="${i}:${s}">${STYLE_NAMES[s]}</button>`).join('')}</div></div>
          <div class="row"><span class="muted">Build</span><div class="seg">${(['attack', 'defense', 'hybrid'] as BuildKind[]).map((k) => `<button class="${p.buildKind === k ? 'on' : ''}" data-bk="${i}:${k}">${BUILD_NAMES[k]}</button>`).join('')}</div></div>
          <div class="items">${build.map((id) => `<span class="it" title="${esc(ITEM_BY_ID[id].name)}">${itemIcon(id, 30)}</span>`).join('')}</div>
          <div class="row"><button class="btn small" data-detail="${p.champId}">Yetenekler</button><button class="btn small" data-edit="${p.champId}:${p.buildKind}">Build düzenle</button></div>
          ${pos === 'jungle' ? `<div class="row"><span class="muted">Orman stratejisi</span><div class="seg">${(['aggressive', 'balanced', 'farm'] as JungleStrategy[]).map((s) => `<button class="${t.jungleStrategy === s ? 'on' : ''}" data-js="${s}">${JS_NAMES[s]}</button>`).join('')}</div></div>` : ''}
        </div>`;
      }).join('')}
      <div class="card slot">
        <h3 style="margin-top:0">Rakip bot</h3>
        <div class="row"><span class="muted">Zorluk</span><div class="seg">${(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => `<button class="${t.difficulty === d ? 'on' : ''}" data-diff="${d}">${DIFFICULTY_NAMES[d]}</button>`).join('')}</div></div>
        <div class="row"><span class="muted">Kişilik</span><div class="seg">${(['random', 'aggressive', 'controlled', 'objective'] as const).map((p) => `<button class="${t.personality === p ? 'on' : ''}" data-pers="${p}">${p === 'random' ? 'Rastgele' : PERSONALITY_NAMES[p]}</button>`).join('')}</div></div>
        <div class="muted" style="font-size:calc(var(--u)*1.3)">Bot, oyuncuyla aynı kuralları kullanır: aynı TP, altın, XP ve görüş. Zorluk yalnızca karar kalitesini değiştirir.</div>
        <h3>Sinerjiler</h3>
        ${syn.length ? syn.map((s) => `<div class="syn">✦ ${s.name}: ${s.desc}</div>`).join('') : '<div class="muted">Aktif özel sinerji yok</div>'}
        <div style="flex:1"></div>
        <button class="btn primary" id="start" style="font-size:calc(var(--u)*2.4);justify-content:center;padding:12px">⚔ Savaşa Başla</button>
      </div>
    </div>`;
    const on = (sel: string, fn: (v: string) => void) => c.querySelectorAll<HTMLElement>(`[${sel}]`).forEach((b) => (b.onclick = () => { sfx('click'); fn(b.getAttribute(sel)!); saveSave(this.save); this.showMenu(); }));
    on('data-style', (v) => { const [i, s] = v.split(':'); t.picks[+i].style = s as Style; });
    on('data-bk', (v) => { const [i, k] = v.split(':'); t.picks[+i].buildKind = k as BuildKind; });
    on('data-js', (v) => { t.jungleStrategy = v as JungleStrategy; });
    on('data-diff', (v) => { t.difficulty = v as Difficulty; });
    on('data-pers', (v) => { t.personality = v as any; });
    c.querySelectorAll<HTMLElement>('[data-pick]').forEach((b) => (b.onclick = () => this.pickModal(+b.dataset.pick!)));
    c.querySelectorAll<HTMLElement>('[data-detail]').forEach((b) => (b.onclick = () => this.detailModal(b.dataset.detail!)));
    c.querySelectorAll<HTMLElement>('[data-edit]').forEach((b) => { b.onclick = () => { const [id, k] = b.dataset.edit!.split(':'); this.buildModal(id, k as BuildKind); }; });
    (c.querySelector('#start') as HTMLElement).onclick = () => { unlockAudio(); sfx('click'); this.startMatch(); };
  }

  modal(html: string, onMount?: (box: HTMLElement, close: () => void) => void) {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="box">${html}</div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    m.onclick = (e) => { if (e.target === m) close(); };
    m.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => (b.onclick = close));
    onMount?.(m.querySelector('.box') as HTMLElement, close);
    return close;
  }

  pickModal(slot: number) {
    const t = this.save.team;
    const pos = POS[slot];
    const taken = t.picks.map((p, i) => (i !== slot ? p.champId : '')).filter(Boolean);
    this.modal(`<div class="head"><h2>${POS_NAMES[pos]} için şampiyon seç</h2><button class="btn" data-close>✕</button></div>
      <div class="grid">${CHAMPIONS.map((d) => `<div class="gcell ${taken.includes(d.id) ? 'dis' : ''} ${t.picks[slot].champId === d.id ? 'sel' : ''}" data-c="${d.id}">${portrait(d.id, 56)}<div class="nm">${d.name}</div><div class="muted">${CLASS_NAMES[d.cls]}</div><span class="fit ${d.pos[pos]}">${FIT_NAMES[d.pos[pos]]}</span></div>`).join('')}</div>
      <div class="muted" style="margin-top:8px">Aynı şampiyon takımda iki kez seçilemez. Her şampiyon her pozisyonda oynayabilir; uyum yalnızca küçük (±%4) verim farkı yaratır.</div>`,
    (box, close) => box.querySelectorAll<HTMLElement>('[data-c]').forEach((b) => (b.onclick = () => {
      const id = b.dataset.c!;
      if (taken.includes(id)) return;
      t.picks[slot].champId = id;
      saveSave(this.save);
      close();
      this.showMenu();
    })));
  }

  abilityHtml(id: string) {
    const d = CHAMP_BY_ID[id];
    const st = CLASS_STATS[d.cls];
    return `<div class="row" style="align-items:flex-start;gap:14px">${portrait(id, 96)}<div><h2 style="margin:0">${d.name} <span class="muted" style="font-size:.7em">${d.title}</span></h2>
      <div class="row">${icon('c_' + d.cls, 22)} ${CLASS_NAMES[d.cls]} · ${d.ranged ? 'Menzilli' : 'Yakın dövüş'} (${d.range})</div>
      <div class="muted">${d.look}</div>
      <div class="row" style="margin-top:4px">${POS.map((p) => `<span class="fit ${d.pos[p]}">${POS_NAMES[p]}: ${FIT_NAMES[d.pos[p]]}</span>`).join('')}</div>
      <div class="muted" style="margin-top:4px">Can ${st.hp} · Saldırı ${st.ad} · Büyü ${st.ap} · Zırh ${st.armor} · B.Direnç ${st.mr} · S.Hızı ${st.as}</div></div></div>
      <div class="ability"><b>Pasif · ${d.passive.name}</b><span>${d.passive.desc}</span></div>
      <div class="ability"><b>1 · ${d.s1.name}</b><span>${d.s1.desc}</span></div>
      <div class="ability"><b>2 · ${d.s2.name}</b><span>${d.s2.desc}</span></div>
      <div class="ability"><b>Ulti · ${d.ult.name}</b><span>${d.ult.desc} <span class="tag">Sv.5'te açılır, Sv.9'da güçlenir</span></span></div>
      <div class="ability"><b>AI</b><span class="muted">${d.ai}</span></div>`;
  }

  detailModal(id: string) {
    this.modal(`<div class="head"><span></span><button class="btn" data-close>✕</button></div>${this.abilityHtml(id)}
      <h3>Kayıtlı buildler</h3>${(['attack', 'defense', 'hybrid'] as BuildKind[]).map((k) => `<div class="row"><span style="width:90px">${BUILD_NAMES[k]}</span><div class="items">${getBuild(this.save, id, k).map((i) => `<span class="it" title="${esc(ITEM_BY_ID[i].name)}">${itemIcon(i, 28)}</span>`).join('')}</div><button class="btn small" data-edit="${k}">Düzenle</button></div>`).join('')}`,
    (box, close) => box.querySelectorAll<HTMLElement>('[data-edit]').forEach((b) => (b.onclick = () => { close(); this.buildModal(id, b.dataset.edit as BuildKind); })));
  }

  /** Build editor: reorder and replace items, saved locally */
  buildModal(id: string, kind: BuildKind, after?: () => void) {
    let items = getBuild(this.save, id, kind);
    let sel = 0;
    const render = (box: HTMLElement, close: () => void) => {
      box.innerHTML = `<div class="head"><h2>${CHAMP_BY_ID[id].name} · ${BUILD_NAMES[kind]} buildi</h2><button class="btn" data-x>✕</button></div>
        <div class="row">${items.map((it, i) => `<div class="card" style="padding:6px;text-align:center;${i === sel ? 'border-color:var(--gold)' : ''}" data-s="${i}">${itemIcon(it, 40)}<div style="font-size:12px">${i + 1}. ${esc(ITEM_BY_ID[it].name)}</div><div class="row" style="justify-content:center"><button class="btn small" data-up="${i}">◀</button><button class="btn small" data-dn="${i}">▶</button></div></div>`).join('')}</div>
        <div class="tooltip" id="tt">${this.itemDesc(items[sel])}</div>
        <h3>${sel + 1}. yuva için eşya seç</h3>
        <div class="pick">${ITEMS.map((it) => `<button class="${items.includes(it.id) ? 'in' : ''}" data-i="${it.id}" title="${esc(it.name)}">${itemIcon(it.id, 36)}</button>`).join('')}</div>
        <div class="row" style="margin-top:10px"><button class="btn primary" data-save>Kaydet</button><button class="btn" data-reset>Varsayılana dön</button></div>`;
      box.querySelector<HTMLElement>('[data-x]')!.onclick = close;
      box.querySelectorAll<HTMLElement>('[data-s]').forEach((b) => (b.onclick = (e) => { if ((e.target as HTMLElement).closest('button')) return; sel = +b.dataset.s!; render(box, close); }));
      box.querySelectorAll<HTMLElement>('[data-up]').forEach((b) => (b.onclick = () => { const i = +b.dataset.up!; if (i > 0) { [items[i - 1], items[i]] = [items[i], items[i - 1]]; sel = i - 1; } render(box, close); }));
      box.querySelectorAll<HTMLElement>('[data-dn]').forEach((b) => (b.onclick = () => { const i = +b.dataset.dn!; if (i < 3) { [items[i + 1], items[i]] = [items[i], items[i + 1]]; sel = i + 1; } render(box, close); }));
      box.querySelectorAll<HTMLElement>('[data-i]').forEach((b) => (b.onclick = () => {
        const nid = +b.dataset.i!;
        const ex = items.indexOf(nid);
        if (ex >= 0) [items[ex], items[sel]] = [items[sel], items[ex]];
        else items[sel] = nid;
        render(box, close);
      }));
      box.querySelector<HTMLElement>('[data-save]')!.onclick = () => { setBuild(this.save, id, kind, items); sfx('click'); close(); after ? after() : this.showMenu(); };
      box.querySelector<HTMLElement>('[data-reset]')!.onclick = () => { resetBuild(this.save, id, kind); items = getBuild(this.save, id, kind); render(box, close); };
    };
    this.modal('', (box, close) => render(box, close));
  }

  itemDesc(id: number) {
    const it = ITEM_BY_ID[id];
    return `<b>${esc(it.name)}</b> · ${it.price} altın · Tarif: ${COMPONENTS[it.recipe[0]].name} + ${COMPONENTS[it.recipe[1]].name}<br>${esc(it.passive)}`;
  }

  // ---------------------------------------------------------------- champions tab
  renderChampions(c: HTMLElement) {
    const f = this.classFilter;
    c.innerHTML = `<div class="row" style="margin-bottom:10px"><div class="seg">${(['all', 'tank', 'fighter', 'mage', 'assassin', 'marksman', 'summoner'] as const).map((k) => `<button class="${f === k ? 'on' : ''}" data-f="${k}">${k === 'all' ? 'Tümü' : CLASS_NAMES[k]}</button>`).join('')}</div><span class="muted">18 şampiyonun tamamı açık</span></div>
      <div class="grid">${CHAMPIONS.filter((d) => f === 'all' || d.cls === f).map((d) => `<div class="gcell" data-d="${d.id}">${portrait(d.id, 64)}<div class="nm">${d.name}</div><div class="muted">${d.title}</div><div>${icon('c_' + d.cls, 18)} ${CLASS_NAMES[d.cls]}</div></div>`).join('')}</div>`;
    c.querySelectorAll<HTMLElement>('[data-f]').forEach((b) => (b.onclick = () => { this.classFilter = b.dataset.f as any; this.showMenu(); }));
    c.querySelectorAll<HTMLElement>('[data-d]').forEach((b) => (b.onclick = () => this.detailModal(b.dataset.d!)));
  }

  renderRewards(c: HTMLElement) {
    const fut = [['Sandıklar', 'Savaş (2 sa), Büyülü (6 sa), Efsanevi (12 sa) sandıkları ve dört sandık yuvası.'], ['Şampiyon parçaları', 'Odak şampiyona %70 parça; kalıcı PvE geliştirmeleri.'], ['Dereceli sezon', '6 haftalık sezon, kupa/MMR eşleştirme, kozmetik ödüller.'], ['Günlük görevler', 'İsteğe bağlı görev ve sınırlı bot galibiyeti ödülleri.'], ['Online PvP', 'Sunucu otoriteli gerçek zamanlı iki oyunculu maçlar.'], ['Kozmetikler', 'Yalnızca görsel ilerleme; oyun avantajı yok.']];
    c.innerHTML = `<h2>Ödüller</h2><p class="muted">Bu prototipte ekonomi ve ödül sistemleri bilinçli olarak kapalıdır. Aşağıdakiler <b>Gelecek sürüm</b> önizlemesidir; çalışan bir ekonomi gibi davranmaz.</p>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">${fut.map(([a, b]) => `<div class="card"><h3 style="margin-top:0">${a} <span class="tag">Gelecek sürüm</span></h3><div class="muted">${b}</div></div>`).join('')}</div>`;
  }

  renderProfile(c: HTMLElement) {
    const s = this.save.stats, p = this.save.prefs;
    const wr = s.played ? Math.round((s.wins / s.played) * 100) : 0;
    c.innerHTML = `<div class="prep" style="grid-template-columns:1fr 1fr">
      <div class="card"><h2>Yerel bot maçı istatistikleri</h2>
        <div style="font-size:calc(var(--u)*2)">Oynanan: <b>${s.played}</b> · Galibiyet: <b style="color:var(--green)">${s.wins}</b> · Mağlubiyet: <b style="color:var(--red)">${s.losses}</b> · %${wr}</div>
        ${Object.entries(s.byDifficulty).map(([d, v]) => `<div class="muted">${DIFFICULTY_NAMES[d as Difficulty] ?? d}: ${v.w}G / ${v.l}M</div>`).join('')}
        <h3>Son maçlar</h3>${s.lastResults.length ? s.lastResults.map((r) => `<div>${r.win ? '🏆 Galibiyet' : '✖ Mağlubiyet'} · ${Math.floor(r.time / 60)}:${String(Math.floor(r.time % 60)).padStart(2, '0')} · ${r.kills}/${r.deaths} · <span class="muted">${r.date}</span></div>`).join('') : '<div class="muted">Henüz maç yok</div>'}
      </div>
      <div class="card"><h2>Tercihler</h2>
        <div class="row"><span style="width:150px">Ses</span><div class="seg"><button class="${p.sound ? 'on' : ''}" data-snd="1">Açık</button><button class="${!p.sound ? 'on' : ''}" data-snd="0">Kapalı</button></div></div>
        <div class="row"><span style="width:150px">Grafik kalitesi</span><div class="seg"><button class="${p.quality === 'high' ? 'on' : ''}" data-q="high">Yüksek (60 FPS)</button><button class="${p.quality === 'low' ? 'on' : ''}" data-q="low">Pil dostu (30 FPS)</button></div></div>
        <div class="row"><span style="width:150px">Hasar sayıları</span><div class="seg"><button class="${p.damageNumbers ? 'on' : ''}" data-dn="1">Açık</button><button class="${!p.damageNumbers ? 'on' : ''}" data-dn="0">Kapalı</button></div></div>
        <div class="row"><span style="width:150px">Oyun hızı</span><div class="seg">${[1, 1.5, 2].map((v) => `<button class="${p.speed === v ? 'on' : ''}" data-sp="${v}">${v}x</button>`).join('')}</div></div>
        <h3>Veri</h3><button class="btn danger" id="reset">Yerel kaydı sıfırla</button>
        <p class="muted">Kayıt şeması v1 · Asset: ${MANIFEST.counts.atlases} atlas, ${MANIFEST.counts.frames} kare</p>
      </div></div>`;
    const on = (a: string, fn: (v: string) => void) => c.querySelectorAll<HTMLElement>(`[${a}]`).forEach((b) => (b.onclick = () => { fn(b.getAttribute(a)!); saveSave(this.save); setSound(this.save.prefs.sound); sfx('click'); this.showMenu(); }));
    on('data-snd', (v) => (p.sound = v === '1'));
    on('data-q', (v) => (p.quality = v as any));
    on('data-dn', (v) => (p.damageNumbers = v === '1'));
    on('data-sp', (v) => (p.speed = +v));
    (c.querySelector('#reset') as HTMLElement).onclick = () => { if (confirm('Tüm yerel kayıt silinsin mi?')) { this.save = defaultSave(); saveSave(this.save); this.showMenu(); } };
  }

  // ---------------------------------------------------------------- match lifecycle
  startMatch() {
    const t = this.save.team;
    const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    const rng = new Rng(seed ^ 0xabcdef);
    const pers: Personality = t.personality === 'random' ? rng.pick(['aggressive', 'controlled', 'objective'] as Personality[]) : t.personality;
    const bot = botDraft(rng, pers, (id, k) => getBuild(this.save, id, k));
    const player = {
      picks: t.picks.map((p, i) => ({ champId: p.champId, position: POS[i], style: p.style, build: getBuild(this.save, p.champId, p.buildKind) })),
      jungleStrategy: t.jungleStrategy, controller: 'player' as const,
    };
    const match = new Match({ seed, teams: [player, bot] }, [{ team: 1, difficulty: t.difficulty, personality: pers }]);
    this.root.innerHTML = '';
    const bridge: BattleBridge = {
      match, team: 0, quality: this.save.prefs.quality, damageNumbers: this.save.prefs.damageNumbers, speed: this.save.prefs.speed, paused: false,
      selectedSlot: 0, camMode: 'close', camFocus: null,
      onEvents: (e) => this.hud?.onEvents(e), onHud: () => this.hud?.update(), onSelect: (s) => this.hud?.select(s), onReady: () => this.hud?.update(),
    };
    this.bridge = bridge;
    this.hud = new Hud(this, match, bridge, pers);
    this.game = new Phaser.Game({
      type: Phaser.AUTO, parent: 'game', pixelArt: true, backgroundColor: '#0b1410',
      scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
      fps: this.save.prefs.quality === 'low' ? { target: 30, limit: 30 } : { target: 60 },
      input: { activePointers: 2 },
      banner: false,
    });
    this.game.scene.add('battle', BattleScene, true, { bridge });
    (window as any).__match = match;
  }

  endMatch(win: boolean) {
    const w = this.bridge!.match.world;
    const s = this.save.stats;
    s.played++;
    if (win) s.wins++; else s.losses++;
    const d = this.save.team.difficulty;
    s.byDifficulty[d] ??= { w: 0, l: 0 };
    if (win) s.byDifficulty[d].w++; else s.byDifficulty[d].l++;
    const mine = w.champions(0);
    s.lastResults.unshift({ win, time: Math.round(w.time), kills: w.teams[0].kills, deaths: w.teams[1].kills, date: new Date().toLocaleDateString('tr-TR') });
    s.lastResults = s.lastResults.slice(0, 10);
    saveSave(this.save);
    void mine;
  }

  exitMatch() {
    this.game?.destroy(true);
    this.game = null;
    this.hud?.destroy();
    this.hud = null;
    this.bridge = null;
    document.getElementById('game')!.innerHTML = '';
    this.tab = 'battle';
    this.showMenu();
  }
}
