// Vite/Vitest ortamında birleşik JSON'u yükler ve tekil katalog örneğini verir.
import raw from '../../Son_Peron_v1_0_Birlesik_Oyun_Verileri.json';
import { buildCatalog } from './catalog.js';

export const C = buildCatalog(raw);
if (C.errors.length) console.error('[Katalog] veri hataları:', C.errors);
export default C;
