/** Generated asset registry (works for normal builds and the single-file standalone build). */
const pngs = import.meta.glob('../../assets/generated/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const jsons = import.meta.glob('../../assets/generated/*.json', { eager: true, import: 'default' }) as Record<string, any>;

const base = (p: string) => p.split('/').pop()!.replace(/\.(png|json)$/, '');
export const PNG: Record<string, string> = Object.fromEntries(Object.entries(pngs).map(([k, v]) => [base(k), v]));
export const JSON_DATA: Record<string, any> = Object.fromEntries(Object.entries(jsons).map(([k, v]) => [base(k), v]));
export const MANIFEST = JSON_DATA.manifest as {
  champions: Record<string, { atlas: string; size: number; anims: Record<string, { frames: number; rate: number; repeat: number }> }>;
  units: Record<string, { atlas: string; size: number; anims: Record<string, { frames: number; rate: number; repeat: number }> }>;
  vfx: Record<string, { frames: number; rate: number; loop: boolean; size: number }>;
  atlases: string[];
  runtimeDecor: { key: string; x: number; y: number }[];
  counts: Record<string, number>;
};

/** CSS for showing one atlas frame as a DOM element background */
export function frameStyle(atlas: string, frame: string, size: number): string {
  const j = JSON_DATA[atlas];
  const f = j?.frames?.[frame]?.frame;
  if (!f) return '';
  const k = size / f.w;
  return `background-image:url(${PNG[atlas]});background-position:-${f.x * k}px -${f.y * k}px;background-size:${j.meta.size.w * k}px ${j.meta.size.h * k}px;width:${f.w * k}px;height:${f.h * k}px;image-rendering:pixelated;display:inline-block;background-repeat:no-repeat`;
}
export const icon = (key: string, size = 32) => `<span class="ico" style="${frameStyle('icons', key, size)}"></span>`;
export const portrait = (id: string, size = 48) => `<span class="portrait" style="${frameStyle('portraits', id, size)}"></span>`;
export const itemIcon = (id: number | string, size = 32) => icon(typeof id === 'number' ? `i${id}` : id, size);
