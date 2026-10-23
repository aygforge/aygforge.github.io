// Anlık bağlantı (Supabase Realtime, WebSocket): parti kanalı ve davet kanalı için ince sarmalayıcı.
// Kütüphane yalnız parti kullanılınca yüklenir (dinamik import); çevrimiçi kullanmayan oyuncunun indirmesi değişmez.
// Kanal arayüzü (testlerde sahtesi kullanılır):
//   join(topic, { presenceKey, onBroadcast(event, payload), onPresence(metas[]), onStatus(status) })
//     → { send(event, payload), track(meta), leave() }
// status: 'joining' | 'ok' | 'error' | 'closed'. Gönderim yalnız kanal bağlıyken yapılır (kütüphanenin REST'e düşen
// yedek yolu kullanılmaz: o yol her mesajı ayrı bir HTTP isteğine çevirir).

export function createRealtimeTransport(api) {
  let client = null;
  let loading = null;

  async function getClient() {
    if (client) return client;
    if (!loading) {
      loading = import('@supabase/realtime-js').then(({ RealtimeClient }) => {
        const endpoint = api.url.replace(/^http/, 'ws') + '/realtime/v1';
        client = new RealtimeClient(endpoint, {
          params: { apikey: api.key },
          heartbeatIntervalMs: 25000,
          // giriş yapan oyuncunun belirteci (yoksa yalnız herkese açık anahtar)
          accessToken: async () => { await api.ensureFresh?.(); return api.session?.access_token || null; },
        });
        return client;
      }).catch((e) => { loading = null; throw e; });
    }
    return loading;
  }

  return {
    join(topic, { presenceKey = '', onBroadcast, onPresence, onStatus } = {}) {
      let ch = null, ok = false, closed = false;
      const status = (s) => { ok = s === 'ok'; onStatus?.(s); };
      status('joining');
      getClient().then((c) => {
        if (closed) return;
        ch = c.channel(topic, { config: { broadcast: { self: false, ack: false }, presence: { key: presenceKey, enabled: !!onPresence } } });
        ch.on('broadcast', { event: '*' }, (m) => onBroadcast?.(m.event, m.payload || {}));
        if (onPresence) {
          ch.on('presence', { event: 'sync' }, () => {
            const st = ch.presenceState();
            onPresence(Object.values(st).map((metas) => metas[0]).filter(Boolean));
          });
        }
        ch.subscribe((s) => {
          if (closed) return;
          if (s === 'SUBSCRIBED') status('ok');
          else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') status('error');
          else if (s === 'CLOSED') status('closed');
        });
      }).catch(() => status('error'));
      return {
        get ok() { return ok; },
        send(event, payload) { if (ok && ch) ch.send({ type: 'broadcast', event, payload }); return ok; },
        track(meta) { if (ok && ch) ch.track(meta); return ok; },
        leave() {
          closed = true; ok = false;
          if (ch && client) client.removeChannel(ch).catch(() => {});
          ch = null;
        },
      };
    },
  };
}
