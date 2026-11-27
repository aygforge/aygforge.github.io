// platform/StorageAdapter.js — storage access with prod/debug namespace separation.
// The migrated SaveManager still writes the legacy key `deliverogue_save` (v1 schema) so existing
// players keep their progress; a debug build (?debug=1) is isolated under a separate key prefix.
const DEBUG = typeof location !== 'undefined' && /[?&]debug=1\b/.test(location.search);
export const StorageAdapter = {
  debug: DEBUG,
  key: base => (DEBUG ? 'debug__' : '') + base,
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
};
