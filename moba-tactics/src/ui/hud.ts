import type { App } from './app';
import type { Match } from '../match';
import type { BattleBridge } from '../render/BattleScene';
import type { GameEvent, OrderKind } from '../core/types';
import type { Unit } from '../core/unit';
import { BALANCE } from '../core/config';
import { CHAMP_BY_ID } from '../data/champions';
import { COMPONENTS, ITEMS, ITEM_BY_ID, combineFee } from '../data/items';
import { BUILD_NAMES, BuildKind } from '../data/builds';
import { icon, itemIcon, portrait, PNG } from '../render/assets';
import { inBase, nextBuildItem } from '../core/shop';
import { observe } from '../core/observation';
import { counterSuggestions } from '../ai/counters';
import { getBuild } from '../save/storage';
import { CRYSTAL_POS, GH, GW, WORLD_H, WORLD_W } from '../core/map';
import { sfx } from '../render/audio';
import { STYLE_NAMES, JS_NAMES, POS_NAMES } from './app';
import { PERSONALITY_NAMES, DIFFICULTY_NAMES, Personality } from '../ai/botCommander';
import type { Style, JungleStrategy } from '../core/types';

export const ORDER_NAMES: Record<OrderKind, string> = { farm: 'Farm', push: 'Baskı kur', defend: 'Savun', retreat: 'Geri çekil', jungle: 'Orman temizle', raid_top: 'Üst baskını', raid_bot: 'Alt baskını', boss: 'Boss hedefi' };
const LANER: OrderKind[] = ['farm', 'push', 'defend', 'retreat'];
const JUNGLER: OrderKind[] = ['jungle', 'raid_top', 'raid_bot', 'boss', 'retreat'];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export class Hud {
  el: HTMLElement;
  private sigs: Record<string, string> = {};
  private panelOpen = false;
  private pickSlot = -1;
  private miniImg = new Image();
  private alerts: { text: string; cls: string; x: number; y: number; at: number }[] = [];
  private ended = false;

  constructor(private app: App, private match: Match, private b: BattleBridge, private pers: Personality) {
    this.miniImg.src = PNG.minimap;
    this.el = document.createElement('div');
    this.el.id = 'hud';
    this.el.innerHTML = `
      <div class="top pe">
        <div><div class="cbar b"><i id="cb"></i></div><div class="clock">Mavi kristal</div></div>
        <div><div class="score"><span class="b" id="kb">0</span> : <span class="r" id="kr">0</span></div><div class="clock" id="clock">0:00</div><div class="buffs" id="buffs"></div></div>
        <div><div class="cbar r"><i id="cr"></i></div><div class="clock">Kırmızı kristal</div></div>
      </div>
      <div class="tl"><canvas id="minimap" class="pe" width="320" height="180"></canvas><div class="clock pe" style="text-align:left;font-size:11px">Rakip: ${PERSONALITY_NAMES[pers]} · ${DIFFICULTY_NAMES[this.app.save.team.difficulty]}</div></div>
      <div class="tr pe">
        <button class="ibtn" id="cam" title="Kamera">🎥</button>
        <button class="ibtn" id="items" title="Eşyalar">🎒</button>
        <button class="ibtn" id="spd" title="Hız">${b.speed}x</button>
        <button class="ibtn" id="pause" title="Duraklat">⏸</button>
      </div>
      <div class="alerts" id="alerts"></div>
      <div class="bl pe" id="cards"></div>
      <div class="br pe" id="cmd"></div>
      <div class="ipanel pe" id="ipanel"></div>
      <div id="toast" class="toast hidden"></div>`;
    document.body.appendChild(this.el);
    const $ = (id: string) => this.el.querySelector('#' + id) as HTMLElement;
    $('cam').onclick = () => { sfx('click'); this.b.camMode = this.b.camMode === 'close' ? 'overview' : 'close'; this.b.camFocus = null; this.update(); };
    $('items').onclick = () => { sfx('click'); this.panelOpen = !this.panelOpen; this.sigs.panel = ''; this.update(); };
    $('spd').onclick = () => { sfx('click'); this.b.speed = this.b.speed >= 2 ? 1 : this.b.speed + 0.5; $('spd').textContent = `${this.b.speed}x`; };
    $('pause').onclick = () => this.pauseMenu();
    const mm = $('minimap') as HTMLCanvasElement;
    mm.onclick = (e) => {
      const r = mm.getBoundingClientRect();
      this.b.camMode = 'close';
      this.b.camFocus = { x: ((e.clientX - r.left) / r.width) * WORLD_W, y: ((e.clientY - r.top) / r.height) * WORLD_H };
    };
    this.update();
  }

  destroy() { this.el.remove(); document.querySelectorAll('.result,.modal').forEach((e) => e.remove()); }

  select(slot: number) {
    this.b.selectedSlot = slot;
    this.b.camFocus = null;
    this.pickSlot = -1;
    this.sigs = {};
    this.update();
  }

  private get w() { return this.match.world; }
  private champ(slot: number): Unit { return this.w.get(this.w.teams[0].champIds[slot])!; }

  toast(msg: string) {
    const t = this.el.querySelector('#toast') as HTMLElement;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout((t as any)._h);
    (t as any)._h = setTimeout(() => t.classList.add('hidden'), 1800);
  }

  onEvents(evts: GameEvent[]) {
    for (const e of evts) {
      if (e.t === 'cmdResult' && e.team === 0 && e.k === 'fail') this.toast(e.text ?? 'Emir uygulanamadı');
      if (e.t === 'cmdResult' && e.team === 0 && e.k === 'ok') this.sigs = {};
      if (e.t === 'alert') {
        let cls = 'neutral';
        if (e.k === 'kill' || e.k === 'tower' || e.k === 'boss') cls = e.team === 0 ? 'good' : 'bad';
        // enemy-only information is not leaked: alerts are public events (kill feed / objectives)
        this.alerts.unshift({ text: e.text ?? '', cls, x: e.x ?? 0, y: e.y ?? 0, at: performance.now() });
        this.alerts = this.alerts.slice(0, 4);
        sfx('alert', 400);
        this.renderAlerts();
      }
      if (e.t === 'gameOver' && !this.ended) {
        this.ended = true;
        const win = e.team === 0;
        setTimeout(() => this.showResult(win), 2300);
      }
    }
  }

  private renderAlerts() {
    const box = this.el.querySelector('#alerts') as HTMLElement;
    const now = performance.now();
    this.alerts = this.alerts.filter((a) => now - a.at < 6000);
    box.innerHTML = this.alerts.map((a, i) => `<div class="alert ${a.cls} pe" data-a="${i}">${esc(a.text)}</div>`).join('');
    box.querySelectorAll<HTMLElement>('[data-a]').forEach((d) => (d.onclick = () => { const a = this.alerts[+d.dataset.a!]; if (a) { this.b.camMode = 'close'; this.b.camFocus = { x: a.x, y: a.y }; } }));
  }

  update() {
    const w = this.w;
    const $ = (id: string) => this.el.querySelector('#' + id) as HTMLElement;
    // top bar
    const cr = w.units.filter((u) => u.kind === 'crystal');
    const c0 = cr.find((c) => c.team === 0)!, c1 = cr.find((c) => c.team === 1)!;
    $('cb').style.transform = `scaleX(${c0.hp / c0.stats.maxHp})`;
    $('cr').style.transform = `scaleX(${c1.hp / c1.stats.maxHp})`;
    $('kb').textContent = String(w.teams[0].kills);
    $('kr').textContent = String(w.teams[1].kills);
    $('clock').textContent = fmt(w.time);
    const bf = w.teams[0].buffs, ebf = w.teams[1].buffs;
    const buffs = [
      bf.blood > w.time ? `<span class="buff blood">Kan +${Math.round(bf.bloodAmt * 100)}% ${Math.ceil(bf.blood - w.time)}s</span>` : '',
      bf.titan > w.time ? `<span class="buff titan">Titan +${Math.round(bf.titanTower * 100)}% ${Math.ceil(bf.titan - w.time)}s</span>` : '',
      ebf.blood > w.time ? `<span class="buff blood" style="opacity:.6">Rakip: Kan</span>` : '',
      ebf.titan > w.time ? `<span class="buff titan" style="opacity:.6">Rakip: Titan</span>` : '',
    ].join('');
    if (this.sigs.buffs !== buffs) { this.sigs.buffs = buffs; $('buffs').innerHTML = buffs; }
    $('cam').classList.toggle('on', this.b.camMode === 'close');
    $('items').classList.toggle('on', this.panelOpen);
    if (this.alerts.length) this.renderAlerts();
    this.drawMinimap();
    this.renderCards();
    this.renderCmd();
    this.renderPanel();
  }

  private drawMinimap() {
    const cv = this.el.querySelector('#minimap') as HTMLCanvasElement;
    const g = cv.getContext('2d')!;
    const w = this.w;
    const sx = 320 / WORLD_W, sy = 180 / WORLD_H;
    g.imageSmoothingEnabled = false;
    if (this.miniImg.complete) g.drawImage(this.miniImg, 0, 0, 320, 180); else { g.fillStyle = '#1a3020'; g.fillRect(0, 0, 320, 180); }
    // fog
    const vis = w.vision.grids[0];
    g.fillStyle = 'rgba(0,0,10,0.5)';
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (!vis[y * GW + x]) g.fillRect(x * 4, y * 4, 4, 4);
    for (const u of w.units) {
      if (!u.alive && !u.isStructure) continue;
      const own = u.team === 0;
      if (!own && !u.isStructure && !w.isVisibleTo(u, 0)) continue;
      const x = u.x * sx, y = u.y * sy;
      if (u.isStructure) {
        g.fillStyle = !u.alive ? '#555' : u.team === 0 ? '#3ab0ff' : '#ff4a4a';
        const s = u.kind === 'crystal' ? 9 : 6;
        g.fillRect(x - s / 2, y - s / 2, s, s);
        g.strokeStyle = '#000'; g.strokeRect(x - s / 2, y - s / 2, s, s);
      } else if (u.kind === 'champion') {
        g.fillStyle = own ? '#6ad0ff' : '#ff6060';
        g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
        g.strokeStyle = own && u.champ!.slot === this.b.selectedSlot ? '#fff' : '#000'; g.lineWidth = 1.5; g.stroke();
      } else if (u.kind === 'boss') { g.fillStyle = '#ffb030'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); }
      else if (u.kind === 'monster') { g.fillStyle = '#e0d060'; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
      else { g.fillStyle = own ? '#90c8ff' : '#ff9090'; g.fillRect(x - 1, y - 1, 2, 2); }
    }
    // last seen
    for (const [id, ls] of w.teams[0].lastSeen) {
      const e = w.get(id)!;
      if (!e.alive || w.isVisibleTo(e, 0) || w.time - ls.t > 8) continue;
      g.globalAlpha = 1 - (w.time - ls.t) / 8;
      g.fillStyle = '#ff6060'; g.font = 'bold 10px monospace'; g.fillText('?', ls.x * sx - 3, ls.y * sy + 4);
      g.globalAlpha = 1;
    }
    // camera rect
    const cam = (this.app.game?.scene.getScene('battle') as any)?.cameras?.main;
    if (cam) { const v = cam.worldView; g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(v.x * sx, v.y * sy, v.width * sx, v.height * sy); }
  }

  private taskText(u: Unit): { ic: string; txt: string } {
    const c = u.champ!;
    if (!u.alive) return { ic: '', txt: 'Ölü' };
    if (c.recallUntil > 0) return { ic: 'o_retreat', txt: 'Üsse ışınlanıyor' };
    if (u.ai.retreating && c.order !== 'retreat') return { ic: 'o_retreat', txt: 'Oto. geri çekiliyor' };
    if (u.ai.autoRaid) return { ic: u.ai.autoRaid.lane === 'top' ? 'o_raid_top' : 'o_raid_bot', txt: 'Oto. baskın' };
    if (u.ai.autoBoss) return { ic: 'o_boss', txt: 'Oto. boss' };
    return { ic: 'o_' + c.order, txt: ORDER_NAMES[c.order] };
  }

  private renderCards() {
    const w = this.w;
    const parts = [0, 1, 2].map((slot) => {
      const u = this.champ(slot);
      const c = u.champ!;
      const d = CHAMP_BY_ID[c.defId];
      const tt = this.taskText(u);
      const warn = u.alive && (u.hp / u.stats.maxHp < 0.3 || (w.time - u.lastHitAt < 1.5 && w.get(u.lastHitBy)?.kind === 'champion'));
      return { slot, html: `<div class="pc ${this.b.selectedSlot === slot ? 'sel' : ''}" data-slot="${slot}">
        <div class="top2">${portrait(c.defId, 34)}<div style="min-width:0"><div class="nm">${d.name}</div><div class="lv">Sv.${c.level} · ${Math.floor(c.gold)}g</div></div></div>
        <div class="hp"><i style="width:${(u.hp / u.stats.maxHp) * 100}%"></i></div>
        <div class="task">${tt.ic ? icon(tt.ic, 14) : ''}${tt.txt}</div>
        ${!u.alive ? `<div class="dead">${Math.ceil(c.respawnAt - w.time)}</div>` : ''}${warn ? '<div class="warn">!</div>' : ''}</div>`, sig: `${this.b.selectedSlot}${Math.round((u.hp / u.stats.maxHp) * 40)}${c.level}${Math.floor(c.gold / 10)}${tt.txt}${u.alive ? '' : Math.ceil(c.respawnAt - w.time)}${warn}` };
    });
    const sig = parts.map((p) => p.sig).join('|');
    if (this.sigs.cards === sig) return;
    this.sigs.cards = sig;
    const box = this.el.querySelector('#cards') as HTMLElement;
    box.innerHTML = parts.map((p) => p.html).join('');
    box.querySelectorAll<HTMLElement>('[data-slot]').forEach((e) => (e.onclick = () => { sfx('click'); this.select(+e.dataset.slot!); }));
  }

  private canIssue(u: Unit, o: OrderKind): { ok: boolean; why?: string } {
    const w = this.w;
    if (!u.alive) return { ok: false, why: 'Ölü' };
    if (u.champ!.order === o) return { ok: false, why: 'Aktif' };
    if (o === 'boss' && !w.bosses.some((b) => b.unitId && w.get(b.unitId)?.alive)) return { ok: false, why: 'Boss yok' };
    if (w.teams[0].tp < (BALANCE.orderCost[o] ?? 10)) return { ok: false, why: 'TP yetersiz' };
    return { ok: true };
  }

  private renderCmd() {
    const w = this.w;
    const u = this.champ(this.b.selectedSlot);
    const c = u.champ!;
    const tp = w.teams[0].tp;
    const isJ = c.position === 'jungle';
    const list = isJ ? JUNGLER : LANER;
    const st = list.map((o) => { const r = this.canIssue(u, o); return `${o}${r.ok}${c.order === o}`; }).join(',');
    const sig = `${this.b.selectedSlot}${Math.floor(tp)}${st}${c.style}${w.teams[0].jungleStrategy}${u.alive}${this.taskText(u).txt}`;
    if (this.sigs.cmd === sig) return;
    this.sigs.cmd = sig;
    const d = CHAMP_BY_ID[c.defId];
    const box = this.el.querySelector('#cmd') as HTMLElement;
    box.innerHTML = `<div class="tp"><b>${d.name}</b><span class="muted" style="font-size:11px">${POS_NAMES[c.position]}</span><div class="bar"><i style="width:${tp}%"></i></div><b style="color:#c8a0ff">${Math.floor(tp)} TP</b></div>
      <div class="orders">${list.map((o) => { const r = this.canIssue(u, o); return `<button class="ord ${c.order === o ? 'on' : ''}" data-o="${o}" ${r.ok ? '' : 'disabled'}>${icon('o_' + o, 22)}<span>${ORDER_NAMES[o]}</span><span class="c">${BALANCE.orderCost[o]} TP</span></button>`; }).join('')}</div>
      <div class="status"><span>Görev: ${this.taskText(u).txt}</span>
        <div class="seg mini-seg">${(['aggressive', 'balanced', 'defensive'] as Style[]).map((s) => `<button class="${c.style === s ? 'on' : ''}" data-st="${s}">${STYLE_NAMES[s]}</button>`).join('')}</div></div>
      ${isJ ? `<div class="status"><span>Orman stratejisi</span><div class="seg mini-seg">${(['aggressive', 'balanced', 'farm'] as JungleStrategy[]).map((s) => `<button class="${w.teams[0].jungleStrategy === s ? 'on' : ''}" data-js="${s}">${JS_NAMES[s]}</button>`).join('')}</div></div>` : ''}`;
    box.querySelectorAll<HTMLElement>('[data-o]').forEach((e) => (e.onclick = () => { sfx('click'); w.submit({ type: 'order', team: 0, slot: this.b.selectedSlot, order: e.dataset.o as OrderKind }); }));
    box.querySelectorAll<HTMLElement>('[data-st]').forEach((e) => (e.onclick = () => { sfx('click'); w.submit({ type: 'style', team: 0, slot: this.b.selectedSlot, style: e.dataset.st as Style }); setTimeout(() => { this.sigs.cmd = ''; this.update(); }, 80); }));
    box.querySelectorAll<HTMLElement>('[data-js]').forEach((e) => (e.onclick = () => { sfx('click'); w.submit({ type: 'jungleStrategy', team: 0, strategy: e.dataset.js as JungleStrategy }); setTimeout(() => { this.sigs.cmd = ''; this.update(); }, 80); }));
  }

  private renderPanel() {
    const p = this.el.querySelector('#ipanel') as HTMLElement;
    p.classList.toggle('open', this.panelOpen);
    if (!this.panelOpen) return;
    const w = this.w;
    const u = this.champ(this.b.selectedSlot);
    const c = u.champ!;
    const base = inBase(u) && u.alive;
    const next = nextBuildItem(u);
    const obs = observe(w, 0);
    const sugg = counterSuggestions(obs, this.b.selectedSlot);
    const sig = `${this.b.selectedSlot}${Math.floor(c.gold)}${c.inventory.map((s) => s.itemId ?? s.code).join()}${c.build.join()}${base}${this.pickSlot}${sugg.map((s) => s.itemId).join()}`;
    if (this.sigs.panel === sig) return;
    this.sigs.panel = sig;
    const owned = c.inventory.filter((s) => s.kind === 'item').map((s) => s.itemId!);
    const nextIt = next ? ITEM_BY_ID[next] : null;
    const compHave = nextIt ? nextIt.recipe.map((code) => c.inventory.some((s) => s.kind === 'comp' && s.code === code)) : [];
    p.innerHTML = `<div class="row" style="justify-content:space-between"><h2 style="margin:0">${portrait(c.defId, 32)} ${CHAMP_BY_ID[c.defId].name}</h2><button class="btn" data-close>✕</button></div>
      <div class="row"><b style="color:var(--gold)">💰 ${Math.floor(c.gold)} altın</b><span class="muted">${base ? 'Üste: satın alma/satış açık' : 'Satın alma yalnızca üste (otomatik)'}</span></div>
      <h3>Envanter (4 yuva)</h3>
      <div class="slots">${[0, 1, 2, 3].map((i) => { const s = c.inventory[i]; if (!s) return '<div class="sl"><span class="muted">boş</span></div>'; const nm = s.kind === 'item' ? ITEM_BY_ID[s.itemId!].name : COMPONENTS[s.code!].name; return `<div class="sl" title="${esc(nm)}">${s.kind === 'item' ? itemIcon(s.itemId!, 36) : itemIcon(s.code!, 28)}${base ? `<button class="sell" data-sell="${i}">Sat ${Math.floor(s.spent * BALANCE.sellRatio)}</button>` : ''}</div>`; }).join('')}</div>
      ${nextIt ? `<div class="muted">Sıradaki: <b style="color:var(--text)">${esc(nextIt.name)}</b> · Bileşenler: ${nextIt.recipe.map((code, k) => `${itemIcon(code, 18)}${compHave[k] ? '✔' : '✖'} ${COMPONENTS[code].price}`).join(' + ')} + birleşim ${combineFee(nextIt)}</div>` : '<div class="muted">Build tamamlandı</div>'}
      <h3>Build sırası <span class="muted" style="font-size:11px">(TP harcamaz)</span></h3>
      <div class="row">${(['attack', 'defense', 'hybrid'] as BuildKind[]).map((k) => `<button class="btn small" data-kind="${k}">${BUILD_NAMES[k]}</button>`).join('')}</div>
      ${c.build.map((id, i) => `<div class="bo ${owned.includes(id) ? 'own' : ''} ${id === next ? 'next' : ''}">${i + 1}. ${itemIcon(id, 28)}<span style="flex:1">${esc(ITEM_BY_ID[id].name)}${owned.includes(id) ? ' ✔' : ''}</span><button class="btn small" data-up="${i}">▲</button><button class="btn small" data-rep="${i}">Değiştir</button></div>`).join('')}
      ${this.pickSlot >= 0 ? `<div class="pick" style="margin-top:6px">${ITEMS.map((it) => `<button data-pi="${it.id}" class="${c.build.includes(it.id) ? 'in' : ''}" title="${esc(it.name)}">${itemIcon(it.id, 32)}</button>`).join('')}</div>` : ''}
      <h3>Karşı eşya önerileri</h3>
      ${sugg.length ? sugg.map((s) => `<div class="bo">${itemIcon(s.itemId, 28)}<span style="flex:1">${esc(ITEM_BY_ID[s.itemId].name)} <span class="muted">· ${esc(s.reason)}</span></span><button class="btn small" data-sug="${s.itemId}">Builde ekle</button></div>`).join('') : '<div class="muted">Görünen bilgilere göre öneri yok.</div>'}
      <div class="tooltip">${nextIt ? esc(nextIt.passive) : ''}</div>`;
    const send = (build: number[]) => { this.w.submit({ type: 'setBuild', team: 0, slot: this.b.selectedSlot, build }); setTimeout(() => { this.sigs.panel = ''; this.update(); }, 80); };
    p.querySelector<HTMLElement>('[data-close]')!.onclick = () => { this.panelOpen = false; this.update(); };
    p.querySelectorAll<HTMLElement>('[data-sell]').forEach((e) => (e.onclick = () => { sfx('gold'); this.w.submit({ type: 'sell', team: 0, slot: this.b.selectedSlot, index: +e.dataset.sell! }); setTimeout(() => { this.sigs.panel = ''; this.update(); }, 80); }));
    p.querySelectorAll<HTMLElement>('[data-kind]').forEach((e) => (e.onclick = () => send(getBuild(this.app.save, c.defId, e.dataset.kind as BuildKind))));
    p.querySelectorAll<HTMLElement>('[data-up]').forEach((e) => (e.onclick = () => { const i = +e.dataset.up!; if (i === 0) return; const nb = [...c.build]; [nb[i - 1], nb[i]] = [nb[i], nb[i - 1]]; send(nb); }));
    p.querySelectorAll<HTMLElement>('[data-rep]').forEach((e) => (e.onclick = () => { this.pickSlot = +e.dataset.rep!; this.sigs.panel = ''; this.update(); }));
    p.querySelectorAll<HTMLElement>('[data-pi]').forEach((e) => (e.onclick = () => {
      const id = +e.dataset.pi!; const nb = [...c.build]; const ex = nb.indexOf(id);
      if (ex >= 0) [nb[ex], nb[this.pickSlot]] = [nb[this.pickSlot], nb[ex]]; else nb[this.pickSlot] = id;
      this.pickSlot = -1; send(nb);
    }));
    p.querySelectorAll<HTMLElement>('[data-sug]').forEach((e) => (e.onclick = () => {
      const id = +e.dataset.sug!; const nb = [...c.build];
      let idx = -1; for (let i = nb.length - 1; i >= 0; i--) if (!owned.includes(nb[i])) { idx = i; break; }
      if (idx < 0) { this.toast('Değiştirilecek alınmamış eşya yok'); return; }
      nb[idx] = id; send(nb);
    }));
  }

  private pauseMenu() {
    this.b.paused = true;
    this.app.modal(`<div class="pausebox"><h2>Duraklatıldı</h2><button class="btn primary" data-close>Devam et</button><button class="btn" id="pq">Grafik: ${this.b.quality === 'high' ? 'Yüksek' : 'Pil dostu'}</button><button class="btn" id="pdn">Hasar sayıları: ${this.b.damageNumbers ? 'Açık' : 'Kapalı'}</button><button class="btn danger" id="pexit">Maçtan çık (mağlubiyet)</button></div>`, (box, close) => {
      const done = () => { this.b.paused = false; close(); };
      box.querySelector<HTMLElement>('[data-close]')!.onclick = done;
      box.parentElement!.onclick = (e) => { if (e.target === box.parentElement) done(); };
      box.querySelector<HTMLElement>('#pq')!.onclick = () => { this.b.quality = this.b.quality === 'high' ? 'low' : 'high'; this.app.save.prefs.quality = this.b.quality; done(); };
      box.querySelector<HTMLElement>('#pdn')!.onclick = () => { this.b.damageNumbers = !this.b.damageNumbers; this.app.save.prefs.damageNumbers = this.b.damageNumbers; done(); };
      box.querySelector<HTMLElement>('#pexit')!.onclick = () => { close(); if (!this.ended) { this.ended = true; this.app.endMatch(false); } this.app.exitMatch(); };
    });
  }

  private showResult(win: boolean) {
    this.app.endMatch(win);
    sfx(win ? 'win' : 'lose');
    const w = this.w;
    const rows = (team: 0 | 1) => w.champions(team).map((u) => { const c = u.champ!; return `<tr><td>${portrait(c.defId, 24)} ${CHAMP_BY_ID[c.defId].name}</td><td>${c.level}</td><td>${c.kills}/${c.deaths}/${c.assists}</td><td>${c.cs}</td><td>${Math.round(c.totalGold)}</td><td>${Math.round(c.dmgDealtChamps)}</td></tr>`; }).join('');
    const box = document.createElement('div');
    box.className = 'result';
    box.innerHTML = `<div class="box"><h1 style="color:${win ? 'var(--gold)' : 'var(--red)'}">${win ? 'ZAFER' : 'YENİLGİ'}</h1>
      <div class="muted">Süre ${fmt(w.time)} · Skor ${w.teams[0].kills} : ${w.teams[1].kills} · Kuleler ${w.teams[0].towersKilled} : ${w.teams[1].towersKilled} · Kullanılan TP ${Math.round(w.teams[0].tpSpent)}</div>
      <table><tr><th>Mavi</th><th>Sv</th><th>K/Ö/A</th><th>CS</th><th>Altın</th><th>Hasar</th></tr>${rows(0)}<tr><th>Kırmızı</th><th></th><th></th><th></th><th></th><th></th></tr>${rows(1)}</table>
      <div class="row" style="justify-content:center"><button class="btn primary" id="again">Tekrar oyna</button><button class="btn" id="menu">Menüye dön</button></div></div>`;
    document.body.appendChild(box);
    (box.querySelector('#menu') as HTMLElement).onclick = () => { box.remove(); this.app.exitMatch(); };
    (box.querySelector('#again') as HTMLElement).onclick = () => { box.remove(); this.app.exitMatch(); this.app.startMatch(); };
  }
}
void CRYSTAL_POS;
