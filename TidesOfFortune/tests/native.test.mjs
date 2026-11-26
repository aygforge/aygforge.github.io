// Android kayıt yedeği: localStorage birincil kalır, yazımlar kalıcı yedeğe yansır, boş localStorage yedekten dolar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareStorage } from '../src/platform/native.js';

function fakeLocal() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}
function fakePrefs() {
  const m = new Map();
  return {
    m,
    get: async ({ key }) => ({ value: m.has(key) ? m.get(key) : null }),
    set: async ({ key, value }) => { m.set(key, value); },
    remove: async ({ key }) => { m.delete(key); },
  };
}

test('web: depo aynen döner (sarmalanmaz)', async () => {
  const ls = fakeLocal();
  assert.equal(await prepareStorage(ls, { native: false, prefs: fakePrefs() }), ls);
});

test('android: yazımlar yedeğe yansır, kayıt biçimi değişmez', async () => {
  const ls = fakeLocal(); const pr = fakePrefs();
  const st = await prepareStorage(ls, { native: true, prefs: pr, delay: 5 });
  st.setItem('tof.meta', '{"v":7,"xp":10}');
  st.setItem('tof.meta.bak', '{"v":7,"xp":9}');
  st.setItem('__tof_test__', '1'); // kayıt dışı anahtar yansıtılmaz
  assert.equal(ls.getItem('tof.meta'), '{"v":7,"xp":10}');
  await st.flushNative();
  assert.equal(pr.m.get('tof.meta'), '{"v":7,"xp":10}');
  assert.equal(pr.m.get('tof.meta.bak'), '{"v":7,"xp":9}');
  assert.ok(!pr.m.has('__tof_test__'));
  st.removeItem('tof.meta.bak');
  await st.flushNative();
  assert.ok(!pr.m.has('tof.meta.bak'));
});

test('android: localStorage boşsa kayıtlar yedekten geri yüklenir; doluysa yedek ezmez', async () => {
  const pr = fakePrefs();
  pr.m.set('tof.meta', '{"v":7,"xp":42}'); pr.m.set('tof.run', '{"v":7,"seed":"A"}'); pr.m.set('tof.settings', '{"music":0.5}');
  const ls = fakeLocal();
  ls.setItem('tof.settings', '{"music":1}'); // yerel daha yeni: korunur
  const st = await prepareStorage(ls, { native: true, prefs: pr });
  assert.equal(st.getItem('tof.meta'), '{"v":7,"xp":42}');
  assert.equal(st.getItem('tof.run'), '{"v":7,"seed":"A"}');
  assert.equal(st.getItem('tof.settings'), '{"music":1}');
});

test('android: kalıcı kayıt duruyorsa yedekten eksik anahtar diriltilmez (biten sefer geri gelmez)', async () => {
  const pr = fakePrefs();
  pr.m.set('tof.meta', '{"v":7,"xp":1}'); pr.m.set('tof.run', '{"v":7,"seed":"OLD"}');
  const ls = fakeLocal();
  ls.setItem('tof.meta', '{"v":7,"xp":5}'); // sefer bitmiş, tof.run silinmiş; silme yedeğe yansımadan uygulama kapanmış
  const st = await prepareStorage(ls, { native: true, prefs: pr });
  assert.equal(st.getItem('tof.run'), null);
  assert.equal(st.getItem('tof.meta'), '{"v":7,"xp":5}');
});

test('android: kayıtta satın alma/hak alanı yazılmaz (kapalı test erişimi kalıcı hak değildir)', async () => {
  const { GameCore } = await import('../src/core/GameCore.js');
  const ls = fakeLocal(); const pr = fakePrefs();
  const st = await prepareStorage(ls, { native: true, prefs: pr, delay: 5 });
  const core = new GameCore(st);
  core.newRun('ENT1'); core.persist(); core.saveSettings();
  await st.flushNative();
  const all = [...ls.m.values(), ...pr.m.values()].join('\n');
  assert.ok(!/purchas|entitle|unlock(ed)?Full|fullGame|premium|isPaid|owned/i.test(all), 'kayıtta satın alma benzeri alan bulundu');
});
