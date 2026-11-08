// Gesture-started Web Audio mixer: master/ambience/sfx/music channels, lazy cue rendering from SynthBank,
// ≤16 simultaneous SFX, regional ambience crossfade, weather layer, music by context. No autoplay.
import { renderCue, SR } from './SynthBank.js';

const EVENT_SFX = {
  'node.harvested': (e) => (e.kind === 'TREE' ? 'snd_tree_fall' : e.kind === 'ORE' || e.kind === 'STONE' ? 'snd_ore_break' : 'snd_item_collect'),
  'craft.completed': 'snd_workbench_finish', 'build.completed': 'snd_build_finish', 'build.delivered': 'snd_wood_build', 'build.placed': 'snd_wood_build',
  'fish.cast': 'snd_fish_cast', 'fish.bite': 'snd_fish_bite', 'fish.hooked': 'snd_fish_reel', 'fish.landed': 'snd_fish_landed', 'fish.lost': 'snd_ui_cancel',
  'trap.set': 'snd_trap_set', 'trap.claimed': 'snd_trap_claim', 'crop.planted': 'snd_crop_plant', 'crop.harvested': 'snd_crop_harvest', 'crop.watered': 'snd_water_pour',
  'player.eat': 'snd_eat', 'player.drink': 'snd_drink', 'water.poured': 'snd_water_pour', 'water.taken': 'snd_water_pour', 'player.damaged': 'snd_damage',
  'ui.error': 'snd_ui_error', 'poi.discovered': 'snd_discovery', 'blueprint.learned': 'snd_blueprint_unlocked', 'special.found': 'snd_blueprint_unlocked',
  'puzzle.solved': 'snd_puzzle_correct', 'puzzle.fail': 'snd_puzzle_fail', 'map.reveal': null, 'region.discovered': 'snd_map_reveal', 'sos.sent': 'snd_sos_transmit',
  'rescue.ready': 'snd_sos_received_indicator', 'poi.looted': 'snd_chest_open', 'cave.loot': 'snd_chest_open', 'door.toggled': 'snd_door_open', 'vehicle.boarded': 'snd_raft_oar',
  'mode.changed': (e) => (e.mode === 'DIVE' ? 'snd_dive_bubble' : e.mode === 'SWIM' ? 'snd_swim_stroke' : null), 'skill.levelup': 'snd_healing', 'inventory.changed': null,
  'action.hit': (e) => (e.data?.anim === 'chop' ? 'snd_axe_hit' : e.data?.anim === 'mine' ? 'snd_pick_hit' : e.data?.anim === 'build' ? 'snd_wood_build' : null),
  'craft.claimed': 'snd_item_collect', 'transition': 'snd_door_open', 'finale.hit': 'snd_damage', 'ui.confirm': 'snd_ui_confirm', 'ui.cancel': 'snd_ui_cancel',
};
const REGION_AMB = { REG_BEACH: 'snd_beach_waves', REG_LAGOON: 'snd_beach_waves', REG_LIGHTHOUSE: 'snd_beach_waves', REG_WRECK: 'snd_beach_waves', REG_FERTILE: 'snd_palm_wind', REG_GROVE: 'snd_palm_wind', REG_VALLEY: 'snd_jungle_birds', REG_FOREST: 'snd_jungle_birds', REG_SWAMP: 'snd_swamp_insects', REG_RED_CLIFF: 'snd_mountain_wind', REG_MOUNTAIN: 'snd_mountain_wind', REG_SETTLEMENT: 'snd_palm_wind' };

export class AudioMixer {
  constructor(manifest, settings) {
    this.manifest = new Map(manifest.map((c) => [c.soundId, c]));
    this.settings = settings; this.ctx = null; this.buffers = new Map(); this.active = 0;
    this.loops = { ambience: null, weather: null, music: null };
    this.enabled = true; this.started = false;
  }
  /** Must be called from a user gesture handler. */
  start() {
    if (this.started) return;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) { this.unsupported = true; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
    this.ch = {};
    for (const c of ['ambience', 'sfx', 'music']) { this.ch[c] = this.ctx.createGain(); this.ch[c].connect(this.master); }
    this.started = true; this.applyVolumes();
  }
  applyVolumes() {
    if (!this.started) return;
    const s = this.settings();
    this.master.gain.value = s.muted ? 0 : 0.8;
    this.ch.music.gain.value = s.musicVolume; this.ch.sfx.gain.value = s.sfxVolume; this.ch.ambience.gain.value = s.ambienceVolume ?? 0.7;
  }
  buffer(id) {
    if (this.buffers.has(id)) return this.buffers.get(id);
    const pcm = renderCue(id);
    const b = this.ctx.createBuffer(1, pcm.length, SR); b.copyToChannel(pcm, 0);
    this.buffers.set(id, b); return b;
  }
  play(id, { rate = 1, gain = 1 } = {}) {
    if (!this.started || !id || this.active >= 16) return;
    const cue = this.manifest.get(id); if (!cue) return;
    const src = this.ctx.createBufferSource(); src.buffer = this.buffer(id); src.playbackRate.value = rate;
    const g = this.ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(this.ch[cue.volumeChannel === 'music' ? 'music' : cue.volumeChannel === 'ambience' ? 'ambience' : 'sfx']);
    this.active++; src.onended = () => { this.active--; };
    src.start();
  }
  setLoop(slot, id, gain = 1) {
    if (!this.started) return;
    const cur = this.loops[slot];
    if (cur && cur.id === id) return;
    const now = this.ctx.currentTime;
    if (cur) { cur.g.gain.setTargetAtTime(0, now, 0.6); setTimeout(() => { try { cur.src.stop(); } catch { /* already stopped */ } }, 2500); }
    this.loops[slot] = null;
    if (!id) return;
    const cue = this.manifest.get(id);
    const src = this.ctx.createBufferSource(); src.buffer = this.buffer(id); src.loop = true;
    const g = this.ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(gain, now, 0.8);
    src.connect(g); g.connect(this.ch[slot === 'music' ? 'music' : cue.volumeChannel === 'music' ? 'music' : 'ambience']);
    src.start(); this.loops[slot] = { id, src, g };
  }
  attach(game) {
    game.bus.on('*', (e, type) => {
      const m = EVENT_SFX[type]; if (!m) return;
      const id = typeof m === 'function' ? m(e) : m; if (id) this.play(id);
    });
    this.game = game;
  }
  /** called ~1/s with context */
  update(ctx) {
    if (!this.started) return;
    if (ctx.menu) { this.setLoop('music', 'snd_menu_theme', 0.8); this.setLoop('ambience', 'snd_beach_waves', 0.5); this.setLoop('weather', null); return; }
    let amb = REGION_AMB[ctx.region] || 'snd_beach_waves';
    if (ctx.cave) amb = ctx.cave === 'CAVE_BATS' ? 'snd_cave_bats' : 'snd_cave_drips';
    if (ctx.diving) amb = 'snd_underwater_muffle';
    if (ctx.nearFire && !ctx.cave) amb = 'snd_campfire_crackle';
    this.setLoop('ambience', amb, 0.7);
    const w = ctx.weather;
    this.setLoop('weather', ctx.cave || !ctx.raining ? null : w === 'STORM' ? 'snd_storm_wind' : w === 'HEAVY_RAIN' || w === 'RAIN' ? 'snd_rain_heavy' : 'snd_rain_light', 0.6);
    let mus = ctx.night ? 'snd_night_ambience' : ctx.dusk ? 'snd_camp_evening' : ctx.sea ? 'snd_sea_journey' : ctx.exploring ? 'snd_exploration' : 'snd_calm_day';
    if (ctx.ending) mus = ctx.ending === 'ESCAPE_SAIL' ? 'snd_ending_sea' : 'snd_ending_radio';
    this.setLoop('music', mus, 0.55);
  }
  footstep(surface) { this.play({ sand: 'snd_foot_sand', grass: 'snd_foot_grass', stone: 'snd_foot_stone', wood: 'snd_foot_wood' }[surface] || 'snd_foot_grass', { gain: 0.5, rate: 0.9 + Math.random() * 0.2 }); }
}
