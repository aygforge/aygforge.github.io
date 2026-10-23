// Ahen Vadisi çevrimiçi oyun sunucusu — başlatıcı.
// Ortam değişkenleri:
//   PORT              dinlenecek port (Render/Fly bunu kendisi verir; varsayılan 8787)
//   SUPABASE_URL      https://xxxx.supabase.co   (oturum doğrulama; yoksa ../public/online.json okunur)
//   SUPABASE_KEY      herkese açık (publishable / anon) anahtar — GİZLİ anahtar gerekmez
//   DEV_AUTH=1        yalnız yerel test: "dev:<uid>" belirteçleri kabul edilir
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';
import { Hub, supabaseVerifier } from './hub.mjs';
import { GAME_VERSION } from '../src/data/constants.js';

const PORT = +(process.env.PORT || 8787);
let url = process.env.SUPABASE_URL, key = process.env.SUPABASE_KEY;
if (!url || !key) {
  try {
    const cfg = JSON.parse(readFileSync(new URL('../public/online.json', import.meta.url), 'utf8'));
    url = url || cfg.url; key = key || cfg.anonKey;
  } catch { /* yok */ }
}
const devAuth = process.env.DEV_AUTH === '1';
const supa = url && key ? supabaseVerifier(url, key) : null;
const verify = async (token) => {
  if (devAuth && token.startsWith('dev:')) return { uid: token.slice(4, 68), email: token.slice(4) + '@dev' };
  return supa ? supa(token) : null;
};
const log = (...a) => console.log(new Date().toISOString(), ...a);
const hub = new Hub({ verify, log });

const server = http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, cors);
    res.end(JSON.stringify({ ok: true, game: 'ahen-vadisi', version: GAME_VERSION, ...hub.stats() }));
    return;
  }
  res.writeHead(404, cors); res.end('{}');
});
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });
wss.on('connection', (ws) => hub.attach(ws));
setInterval(() => hub.tick(), 50);
setInterval(() => hub.heartbeat(), 20000);
server.listen(PORT, () => log(`Ahen Vadisi sunucusu ${GAME_VERSION} :${PORT} (kimlik: ${devAuth ? 'DEV + ' : ''}${supa ? url : 'yok!'})`));
