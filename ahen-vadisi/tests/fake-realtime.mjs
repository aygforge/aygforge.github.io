// Testler için sahte anlık bağlantı.
// 1) createHub(): birim testlerinde kullanılan bellek içi taşıma (realtime.js ile aynı arayüz: join → {send, track, leave}).
// 2) createPhoenixServer(): Supabase Realtime'ın WebSocket protokolünü (Phoenix, vsn 2.0.0) taklit eder; e2e'de Playwright
//    routeWebSocket ile gerçek @supabase/realtime-js istemcisi buna bağlanır. Yayınları aynı konudaki diğer bağlantılara
//    iletir, presence durumunu (presence_state / presence_diff) tutar, her mesajı sayar (mesaj bütçesi ölçümü).

export function createHub() {
  const topics = new Map();   // topic → Set(sub)
  const stats = { sent: 0, delivered: 0 };
  const presenceOf = (topic) => [...(topics.get(topic) || [])].filter((s) => s.meta).map((s) => s.meta);
  const syncPresence = (topic) => { for (const s of topics.get(topic) || []) s.opts.onPresence?.(presenceOf(topic)); };
  return {
    stats, topics,
    transport() {
      return {
        join(topic, opts = {}) {
          const sub = { opts, meta: null, ok: true };
          if (!topics.has(topic)) topics.set(topic, new Set());
          topics.get(topic).add(sub);
          opts.onStatus?.('joining');
          queueMicrotask(() => { if (sub.ok) { opts.onStatus?.('ok'); syncPresence(topic); } });
          return {
            get ok() { return sub.ok; },
            send(event, payload) {
              if (!sub.ok) return false;
              stats.sent++;
              for (const s of topics.get(topic)) if (s !== sub && s.ok) { stats.delivered++; s.opts.onBroadcast?.(event, JSON.parse(JSON.stringify(payload))); }
              return true;
            },
            track(meta) { if (!sub.ok) return false; sub.meta = { ...meta }; syncPresence(topic); return true; },
            leave() { sub.ok = false; topics.get(topic)?.delete(sub); syncPresence(topic); },
            // test: bağlantı kopması (presence'tan düşer, gönderemez)
            drop() { sub.ok = false; topics.get(topic)?.delete(sub); opts.onStatus?.('error'); syncPresence(topic); },
          };
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------- Phoenix (vsn 2.0.0) sunucu taklidi
export function createPhoenixServer() {
  const conns = new Set();          // { ws, topics: Map(topic → { joinRef, presenceKey, meta }) }
  const stats = { broadcasts: 0, delivered: 0, joins: 0, presence: 0, frames: 0, binary: 0 };
  let refN = 0;
  const sendJson = (c, arr) => { try { c.ws.send(JSON.stringify(arr)); } catch { /* kapandı */ } };
  const presState = (topic) => {
    const st = {};
    for (const c of conns) { const t = c.topics.get(topic); if (t?.meta) st[t.presenceKey] = { metas: [{ phx_ref: t.phxRef, ...t.meta }] }; }
    return st;
  };
  const diff = (topic, joins, leaves) => {
    for (const c of conns) {
      const t = c.topics.get(topic);
      if (!t) continue;
      sendJson(c, [t.joinRef, null, topic, 'presence_diff', { joins, leaves }]);
    }
  };
  function decodeBinaryPush(buf) {
    // kind 3 (userBroadcastPush): [kind, joinRefLen, refLen, topicLen, eventLen, metaLen, encoding] + alanlar + yük
    const b = Buffer.from(buf);
    if (b[0] !== 3) return null;
    const [jl, rl, tl, el, ml, enc] = [b[1], b[2], b[3], b[4], b[5], b[6]];
    let o = 7;
    const take = (n) => { const s = b.subarray(o, o + n).toString('utf8'); o += n; return s; };
    const joinRef = take(jl), ref = take(rl), topic = take(tl), event = take(el); take(ml);
    const rest = b.subarray(o);
    const payload = enc === 1 ? JSON.parse(rest.toString('utf8') || '{}') : rest;
    return { joinRef, ref, topic, event, payload };
  }
  function broadcast(from, topic, event, payload) {
    stats.broadcasts++;
    for (const c of conns) {
      if (c === from) continue;
      const t = c.topics.get(topic);
      if (!t) continue;
      stats.delivered++;
      sendJson(c, [null, null, topic, 'broadcast', { type: 'broadcast', event, payload }]);
    }
  }
  function leaveTopic(c, topic) {
    const t = c.topics.get(topic);
    if (!t) return;
    c.topics.delete(topic);
    if (t.meta) diff(topic, {}, { [t.presenceKey]: { metas: [{ phx_ref: t.phxRef, ...t.meta }] } });
  }
  return {
    stats, conns,
    // Playwright: context.routeWebSocket(/realtime\/v1\/websocket/, (ws) => server.accept(ws))
    accept(ws) {
      const c = { ws, topics: new Map(), dead: false };
      conns.add(c);
      ws.onMessage((msg) => {
        stats.frames++;
        if (c.dead) return;
        if (typeof msg !== 'string') {
          stats.binary++;
          const m = decodeBinaryPush(msg);
          if (m && m.event) broadcast(c, m.topic, m.event, m.payload);
          return;
        }
        const [joinRef, ref, topic, event, payload] = JSON.parse(msg);
        if (topic === 'phoenix' && event === 'heartbeat') return sendJson(c, [null, ref, 'phoenix', 'phx_reply', { status: 'ok', response: {} }]);
        if (event === 'phx_join') {
          stats.joins++;
          const key = payload?.config?.presence?.key || 'k' + (++refN);
          c.topics.set(topic, { joinRef, presenceKey: key, meta: null, phxRef: 'r' + (++refN) });
          sendJson(c, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: [] } }]);
          if (payload?.config?.presence?.enabled) sendJson(c, [joinRef, null, topic, 'presence_state', presState(topic)]);
          return;
        }
        if (event === 'phx_leave') { leaveTopic(c, topic); return sendJson(c, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]); }
        if (event === 'access_token') return;
        if (event === 'presence') {
          stats.presence++;
          const t = c.topics.get(topic);
          sendJson(c, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
          if (!t) return;
          if (payload.event === 'track') {
            const old = t.meta;
            t.meta = payload.payload || {};
            t.phxRef = 'r' + (++refN);
            diff(topic, { [t.presenceKey]: { metas: [{ phx_ref: t.phxRef, ...t.meta }] } }, old ? { [t.presenceKey]: { metas: [{ phx_ref: 'old', ...old }] } } : {});
          } else if (payload.event === 'untrack' && t.meta) {
            const old = t.meta; t.meta = null;
            diff(topic, {}, { [t.presenceKey]: { metas: [{ phx_ref: t.phxRef, ...old }] } });
          }
          return;
        }
        if (event === 'broadcast') { broadcast(c, topic, payload?.event, payload?.payload); if (ref) sendJson(c, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]); return; }
        if (ref) sendJson(c, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
      });
      ws.onClose(() => { c.dead = true; for (const topic of [...c.topics.keys()]) leaveTopic(c, topic); conns.delete(c); });
    },
    // test: bir bağlantıyı sunucu tarafında kopar
    kill(predicate) { for (const c of conns) if (predicate(c)) { for (const topic of [...c.topics.keys()]) leaveTopic(c, topic); c.dead = true; conns.delete(c); try { c.ws.close(); } catch { /* */ } } },
  };
}
