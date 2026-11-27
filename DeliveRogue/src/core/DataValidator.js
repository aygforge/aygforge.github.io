// core/DataValidator.js — data authority checks (run at boot and by the unit tests).
// Phase-appropriate: validates the migrated Coffee content + canonical ID catalog. Map reachability
// (`maps: true`) builds every chapter world and is used by tests (it mutates the Nav world).
import { CHAPTERS } from '../data/chapters.js';
import { ENEMY_DB, ENEMY_SHORT, ENEMY_INTRO, ENEMY_ORDER } from '../data/enemies.js';
import { ENEMY_CATALOG } from '../data/enemyCatalog.js';
import { PACKAGES } from '../data/packages.js';
import { SKILLS, SKILL_BY_ID, EVOLUTIONS } from '../data/skills.js';
import { SEGS } from '../data/segments.js';
import { GARAGE, GARAGE_ORDER } from '../data/garage.js';
import { EPISODE_IDS } from '../data/ids.js';
import { MapBuilder } from '../systems/MapBuilder.js';
import { Nav } from '../systems/Nav.js';
import { TILE } from './util.js';

export const ARCHETYPES = ['Disruptor', 'Runner', 'Bruiser', 'Tank', 'Boss', 'Swarm', 'Ranged', 'Caster'];
export const ARCHETYPE_COUNTS = { Disruptor: 20, Runner: 19, Bruiser: 16, Tank: 15, Boss: 10, Swarm: 9, Ranged: 6, Caster: 5 };

export function validateData({ maps = false } = {}) {
  const errors = [], info = {};
  const err = m => errors.push(m);
  // canonical enemy catalog
  const ids = new Set(); const arch = {}; const per = {};
  for (const e of ENEMY_CATALOG) {
    if (ids.has(e.enemyId)) err('duplicate enemy id ' + e.enemyId); ids.add(e.enemyId);
    if (!ARCHETYPES.includes(e.archetype)) err('unknown archetype ' + e.archetype);
    arch[e.archetype] = (arch[e.archetype] || 0) + 1;
    const p = per[e.districtCode] = per[e.districtCode] || { Normal: 0, Elite: 0, Boss: 0 }; p[e.role]++;
    if (!e.enemyId.startsWith(e.districtCode + '_' + e.role[0] + '_')) err('id/role/district mismatch ' + e.enemyId);
  }
  if (ENEMY_CATALOG.length !== 100) err('enemy catalog size ' + ENEMY_CATALOG.length);
  for (const k in ARCHETYPE_COUNTS) if (arch[k] !== ARCHETYPE_COUNTS[k]) err(`archetype ${k} count ${arch[k]} != ${ARCHETYPE_COUNTS[k]}`);
  for (const d of EPISODE_IDS) { const p = per[d]; if (!p || p.Normal !== 7 || p.Elite !== 2 || p.Boss !== 1) err('district roster ' + d + ' ' + JSON.stringify(p)); }
  // runtime enemies must match catalog identity fields
  const cat = Object.fromEntries(ENEMY_CATALOG.map(e => [e.enemyId, e]));
  for (const id in ENEMY_DB) {
    const e = ENEMY_DB[id], c = cat[id];
    if (!c) { err('runtime enemy not in catalog ' + id); continue; }
    if (e.name !== c.name || e.role !== c.role || e.arch !== c.archetype) err('runtime enemy identity mismatch ' + id);
  }
  if (ENEMY_ORDER.length !== Object.keys(ENEMY_DB).length) err('ENEMY_ORDER incomplete');
  // skills
  const sk = new Set(SKILLS.map(s => s.id)); if (sk.size !== SKILLS.length) err('duplicate skill id'); info.skills = SKILLS.length;
  if (SKILLS.length !== 60) err('skill count ' + SKILLS.length);
  SKILLS.forEach(x => { if (x.prereq && !SKILL_BY_ID[x.prereq]) err('skill prereq missing ' + x.id); });
  if (EVOLUTIONS.length !== 20) err('evolution count ' + EVOLUTIONS.length);
  EVOLUTIONS.forEach(e => { if (!SKILL_BY_ID[e.a] || !SKILL_BY_ID[e.b]) err('evolution prereq missing ' + e.id); }); info.evolutions = EVOLUTIONS.length;
  // garage
  GARAGE_ORDER.forEach(k => { if (!GARAGE[k]) err('garage missing ' + k); });
  // chapters
  if (CHAPTERS.length !== 12) err('Coffee chapter count ' + CHAPTERS.length);
  CHAPTERS.forEach((ch, i) => {
    if (ch.n !== i + 1 || ch.id !== 'C' + String(i + 1).padStart(2, '0')) err('chapter numbering ' + ch.id);
    if (!PACKAGES[ch.pkg]) err(ch.id + ' unknown package ' + ch.pkg);
    let count = 0;
    ch.layout.forEach(([seg, en]) => {
      if (!SEGS[seg]) err(ch.id + ' unknown segment ' + seg);
      en.split(/\s+/).filter(Boolean).forEach(s => {
        count++;
        if (!ENEMY_SHORT[s]) err(ch.id + ' unknown enemy ' + s);
        else if ((ENEMY_INTRO[s] || 99) > ch.n) err(ch.id + ' enemy before intro ' + s);
      });
    });
    if (count !== ch.enemies) err(`${ch.id} enemy count ${count} != ${ch.enemies}`);
    if (ch.layout[ch.layout.length - 1][0] !== 'START') err(ch.id + ' must end (bottom) with START');
  });
  // maps
  if (maps) {
    info.maps = [];
    for (const ch of CHAPTERS) {
      try {
        const w = MapBuilder.build(ch);
        const pick = Math.hypot(w.pickup.x - w.start.x, w.pickup.y - w.start.y);
        const reachPick = Nav.fieldAt(w.pickField, w.start.x, w.start.y);
        const cpOk = !ch.cp || (w.checkpoint && Nav.fieldAt(w.dropField, w.checkpoint.x, w.checkpoint.y) >= 0);
        if (!(w.pathLen > 0)) err(ch.id + ' drop unreachable from pickup');
        if (!(reachPick >= 0)) err(ch.id + ' pickup unreachable from start');
        if (pick > TILE * 3) err(ch.id + ' pickup too far from start ' + pick.toFixed(1));
        if (!cpOk) err(ch.id + ' checkpoint missing/unreachable');
        info.maps.push({ id: ch.id, rows: w.rows, pathLen: w.pathLen, pickupDist: Math.round(pick), segs: w.segs.length });
      } catch (e) { err(ch.id + ' build failed: ' + e.message); }
    }
  }
  return { ok: errors.length === 0, errors, info };
}
