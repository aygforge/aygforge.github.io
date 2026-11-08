import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadContent } from '../../src/data/ContentRegistry.js';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SPEC = path.join(ROOT, 'Kayip_Ufuk_GDD_v2_0');
export const fsLoader = (base = SPEC) => async (p) => JSON.parse(await readFile(path.join(base, p), 'utf8'));
let cached;
export async function getContent() { if (!cached) cached = await loadContent(fsLoader()); return cached; }
