import { Vec, dist, distToSeg } from './math';

/** World geometry. Combat uses plain 2D world coordinates; renderer projects them. */
export const WORLD_W = 3200;
export const WORLD_H = 1800;
export const CELL = 40;
export const GW = WORLD_W / CELL; // 80
export const GH = WORLD_H / CELL; // 45

export type LaneId = 'top' | 'bot';
export type TeamId = 0 | 1; // 0 = blue (left), 1 = red (right)

const mirrorX = (p: Vec): Vec => ({ x: WORLD_W - p.x, y: p.y });
const mirrorY = (p: Vec): Vec => ({ x: p.x, y: WORLD_H - p.y });

/** Lane polylines from blue base to red base */
const TOP_LANE: Vec[] = [
  { x: 330, y: 820 }, { x: 420, y: 470 }, { x: 640, y: 290 }, { x: 1000, y: 240 },
  { x: 1600, y: 230 }, { x: 2200, y: 240 }, { x: 2560, y: 290 }, { x: 2780, y: 470 }, { x: 2870, y: 820 },
];
const BOT_LANE: Vec[] = TOP_LANE.map(mirrorY);

export const LANES: Record<LaneId, Vec[]> = { top: TOP_LANE, bot: BOT_LANE };

export const CRYSTAL_POS: Vec[] = [{ x: 300, y: 900 }, { x: WORLD_W - 300, y: 900 }];
export const FOUNTAIN_POS: Vec[] = [{ x: 80, y: 900 }, { x: WORLD_W - 80, y: 900 }];

export interface TowerDef { team: TeamId; lane: LaneId; tier: 'outer' | 'inner'; pos: Vec }
const blueTopInner = { x: 560, y: 345 };
const blueTopOuter = { x: 1080, y: 245 };
export const TOWERS: TowerDef[] = [];
for (const team of [0, 1] as TeamId[]) {
  for (const lane of ['top', 'bot'] as LaneId[]) {
    for (const tier of ['inner', 'outer'] as const) {
      let p = tier === 'inner' ? blueTopInner : blueTopOuter;
      if (lane === 'bot') p = mirrorY(p);
      if (team === 1) p = mirrorX(p);
      TOWERS.push({ team, lane, tier, pos: { ...p } });
    }
  }
}

export type CampKind = 'wolf' | 'golem' | 'spirit';
export interface CampDef { id: number; kind: CampKind; side: TeamId; pos: Vec }
const blueCamps: { kind: CampKind; pos: Vec }[] = [
  { kind: 'wolf', pos: { x: 860, y: 640 } },
  { kind: 'golem', pos: { x: 1170, y: 900 } },
  { kind: 'spirit', pos: { x: 860, y: 1160 } },
];
export const CAMPS: CampDef[] = [];
blueCamps.forEach((c, i) => CAMPS.push({ id: i, kind: c.kind, side: 0, pos: { ...c.pos } }));
blueCamps.forEach((c, i) => CAMPS.push({ id: i + 3, kind: c.kind, side: 1, pos: mirrorX(c.pos) }));

export const BOSS_POS = { blood: { x: 1600, y: 640 }, titan: { x: 1600, y: 1160 } };

interface Seg { a: Vec; b: Vec; r: number }
const segs: Seg[] = [];
const circles: { c: Vec; r: number }[] = [];
function poly(points: Vec[], r: number) {
  for (let i = 0; i < points.length - 1; i++) segs.push({ a: points[i], b: points[i + 1], r });
}
// lanes
poly(TOP_LANE, 125);
poly(BOT_LANE, 125);
// bases
for (const c of CRYSTAL_POS) circles.push({ c: { x: c.x < 1600 ? 230 : WORLD_W - 230, y: 900 }, r: 300 });
// jungle paths (blue side, mirrored)
const jp: Vec[][] = [
  [{ x: 460, y: 900 }, { x: 860, y: 640 }],
  [{ x: 460, y: 900 }, { x: 1170, y: 900 }],
  [{ x: 460, y: 900 }, { x: 860, y: 1160 }],
  [{ x: 860, y: 640 }, { x: 900, y: 260 }],
  [{ x: 860, y: 1160 }, { x: 900, y: 1540 }],
  [{ x: 860, y: 640 }, { x: 1250, y: 560 }, { x: 1600, y: 640 }],
  [{ x: 860, y: 1160 }, { x: 1250, y: 1240 }, { x: 1600, y: 1160 }],
  [{ x: 1170, y: 900 }, { x: 1600, y: 900 }],
  [{ x: 1170, y: 900 }, { x: 1600, y: 640 }],
  [{ x: 1170, y: 900 }, { x: 1600, y: 1160 }],
  [{ x: 1600, y: 640 }, { x: 1600, y: 1160 }],
  [{ x: 1600, y: 640 }, { x: 1600, y: 240 }],
  [{ x: 1600, y: 1160 }, { x: 1600, y: 1560 }],
  [{ x: 1250, y: 560 }, { x: 1300, y: 250 }],
  [{ x: 1250, y: 1240 }, { x: 1300, y: 1550 }],
];
for (const p of jp) {
  poly(p, 62);
  poly(p.map(mirrorX), 62);
}
for (const c of CAMPS) circles.push({ c: c.pos, r: 140 });
circles.push({ c: BOSS_POS.blood, r: 190 });
circles.push({ c: BOSS_POS.titan, r: 190 });
circles.push({ c: { x: 1600, y: 900 }, r: 110 });

/** walkable[gy*GW+gx] */
export const walkable = new Uint8Array(GW * GH);
/** terrain kind for renderer: 0 forest(blocked), 1 lane path, 2 jungle path, 3 clearing, 4 base, 5 boss arena */
export const terrain = new Uint8Array(GW * GH);
for (let gy = 0; gy < GH; gy++) {
  for (let gx = 0; gx < GW; gx++) {
    const x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
    let w = 0, t = 0;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (distToSeg(x, y, s.a.x, s.a.y, s.b.x, s.b.y) <= s.r) {
        w = 1;
        t = s.r > 100 ? 1 : t || 2;
        if (s.r > 100) break;
      }
    }
    for (const c of circles) {
      if (dist(x, y, c.c.x, c.c.y) <= c.r) {
        w = 1;
        if (c.r >= 300) t = 4;
        else if (c.r >= 190) t = 5;
        else if (t !== 1) t = 3;
      }
    }
    if (gx === 0 || gy === 0 || gx === GW - 1 || gy === GH - 1) w = 0;
    walkable[gy * GW + gx] = w;
    terrain[gy * GW + gx] = w ? t : 0;
  }
}

export function isWalkable(x: number, y: number): boolean {
  const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
  if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return false;
  return walkable[gy * GW + gx] === 1;
}

/** Map region label for given point (used by AI and UI alerts) */
export function regionOf(x: number, y: number): 'top' | 'bot' | 'jungle' | 'base0' | 'base1' {
  if (x < 560 && Math.abs(y - 900) < 380) return 'base0';
  if (x > WORLD_W - 560 && Math.abs(y - 900) < 380) return 'base1';
  if (y < 420) return 'top';
  if (y > WORLD_H - 420) return 'bot';
  // lane bends near the bases
  const dTop = laneDistance('top', x, y), dBot = laneDistance('bot', x, y);
  if (dTop < 130) return 'top';
  if (dBot < 130) return 'bot';
  return 'jungle';
}

export function laneDistance(lane: LaneId, x: number, y: number): number {
  const pts = LANES[lane];
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) best = Math.min(best, distToSeg(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y));
  return best;
}

/** Cumulative lengths for lane progress queries */
const laneCum: Record<LaneId, number[]> = { top: [], bot: [] };
for (const l of ['top', 'bot'] as LaneId[]) {
  const p = LANES[l];
  let acc = 0;
  laneCum[l].push(0);
  for (let i = 1; i < p.length; i++) {
    acc += dist(p[i - 1].x, p[i - 1].y, p[i].x, p[i].y);
    laneCum[l].push(acc);
  }
}
export const laneLength = (l: LaneId) => laneCum[l][laneCum[l].length - 1];

/** Progress (0..len) of the closest lane point, measured from blue base */
export function laneProgress(lane: LaneId, x: number, y: number): number {
  const p = LANES[lane];
  let best = Infinity, bestS = 0;
  for (let i = 0; i < p.length - 1; i++) {
    const ax = p[i].x, ay = p[i].y, bx = p[i + 1].x, by = p[i + 1].y;
    const vx = bx - ax, vy = by - ay;
    const l2 = vx * vx + vy * vy;
    let t = ((x - ax) * vx + (y - ay) * vy) / l2;
    t = Math.max(0, Math.min(1, t));
    const d = dist(x, y, ax + vx * t, ay + vy * t);
    if (d < best) {
      best = d;
      bestS = laneCum[lane][i] + Math.sqrt(l2) * t;
    }
  }
  return bestS;
}

export function lanePoint(lane: LaneId, s: number): Vec {
  const p = LANES[lane];
  const cum = laneCum[lane];
  s = Math.max(0, Math.min(cum[cum.length - 1], s));
  for (let i = 0; i < p.length - 1; i++) {
    if (s <= cum[i + 1]) {
      const t = (s - cum[i]) / (cum[i + 1] - cum[i] || 1);
      return { x: p[i].x + (p[i + 1].x - p[i].x) * t, y: p[i].y + (p[i + 1].y - p[i].y) * t };
    }
  }
  return { ...p[p.length - 1] };
}

// ---------- A* pathfinding on the nav grid ----------
const gScore = new Float32Array(GW * GH);
const fScore = new Float32Array(GW * GH);
const came = new Int32Array(GW * GH);
const stamp = new Int32Array(GW * GH);
const closed = new Int32Array(GW * GH);
let curStamp = 1;

function nearestWalkableCell(gx: number, gy: number): number {
  gx = Math.max(0, Math.min(GW - 1, gx));
  gy = Math.max(0, Math.min(GH - 1, gy));
  if (walkable[gy * GW + gx]) return gy * GW + gx;
  for (let r = 1; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = gx + dx, y = gy + dy;
        if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
        if (walkable[y * GW + x]) return y * GW + x;
      }
  }
  return gy * GW + gx;
}

export function nearestWalkable(x: number, y: number): Vec {
  const c = nearestWalkableCell(Math.floor(x / CELL), Math.floor(y / CELL));
  if (isWalkable(x, y)) return { x, y };
  return { x: (c % GW) * CELL + CELL / 2, y: Math.floor(c / GW) * CELL + CELL / 2 };
}

/** Binary heap for open set */
class Heap {
  a: number[] = [];
  push(n: number) {
    const a = this.a;
    a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (fScore[a[p]] <= fScore[a[i]]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): number {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < a.length && fScore[a[l]] < fScore[a[m]]) m = l;
        if (r < a.length && fScore[a[r]] < fScore[a[m]]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

/** Line of sight on walkable grid (used for path smoothing and vision) */
export function lineWalkable(ax: number, ay: number, bx: number, by: number): boolean {
  const d = dist(ax, ay, bx, by);
  const steps = Math.ceil(d / (CELL * 0.45));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (!isWalkable(ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
  }
  return true;
}

export function findPath(sx: number, sy: number, tx: number, ty: number): Vec[] {
  if (lineWalkable(sx, sy, tx, ty) && isWalkable(tx, ty)) return [{ x: tx, y: ty }];
  const start = nearestWalkableCell(Math.floor(sx / CELL), Math.floor(sy / CELL));
  const goal = nearestWalkableCell(Math.floor(tx / CELL), Math.floor(ty / CELL));
  curStamp++;
  const heap = new Heap();
  const gxg = goal % GW, gyg = Math.floor(goal / GW);
  const h = (c: number) => {
    const dx = Math.abs((c % GW) - gxg), dy = Math.abs(Math.floor(c / GW) - gyg);
    return (dx + dy + (1.4142 - 2) * Math.min(dx, dy)) * CELL;
  };
  stamp[start] = curStamp;
  gScore[start] = 0;
  fScore[start] = h(start);
  came[start] = -1;
  heap.push(start);
  let found = false;
  let iter = 0;
  while (heap.size && iter++ < 6000) {
    const c = heap.pop();
    if (closed[c] === curStamp) continue;
    closed[c] = curStamp;
    if (c === goal) { found = true; break; }
    const cx = c % GW, cy = Math.floor(c / GW);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const n = ny * GW + nx;
        if (!walkable[n]) continue;
        if (dx && dy && (!walkable[cy * GW + nx] || !walkable[ny * GW + cx])) continue;
        const ng = gScore[c] + (dx && dy ? 1.4142 : 1) * CELL;
        if (stamp[n] !== curStamp || ng < gScore[n]) {
          stamp[n] = curStamp;
          gScore[n] = ng;
          fScore[n] = ng + h(n);
          came[n] = c;
          if (closed[n] === curStamp) closed[n] = 0;
          heap.push(n);
        }
      }
  }
  if (!found) return [{ x: tx, y: ty }];
  const cells: Vec[] = [];
  let c = goal;
  while (c !== -1 && c !== start) {
    cells.push({ x: (c % GW) * CELL + CELL / 2, y: Math.floor(c / GW) * CELL + CELL / 2 });
    c = came[c];
  }
  cells.reverse();
  if (isWalkable(tx, ty)) cells[cells.length - 1] = { x: tx, y: ty };
  // string pulling
  const out: Vec[] = [];
  let ax = sx, ay = sy;
  let i = 0;
  while (i < cells.length) {
    let j = cells.length - 1;
    while (j > i && !lineWalkable(ax, ay, cells[j].x, cells[j].y)) j--;
    out.push(cells[j]);
    ax = cells[j].x; ay = cells[j].y;
    i = j + 1;
  }
  return out;
}
