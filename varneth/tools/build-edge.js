// Copies shared/ into supabase/functions/game/_shared so the Edge Function bundle is self-contained.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dst = path.join(root, 'supabase/functions/game/_shared');
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(path.join(root, 'shared'), dst, { recursive: true, filter: (p) => !p.endsWith('testkit.js') });
console.log('copied shared/ ->', path.relative(root, dst));
