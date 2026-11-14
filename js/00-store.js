"use strict";
/* ================= storage =================
   Projects, photos and backups live in IndexedDB (hundreds of MB allowed) instead of localStorage (~5 MB).
   The rest of the app keeps a simple synchronous API: STORE.get(key) / STORE.set(key, string).
   Values are cached in memory at start-up; writes go to IndexedDB in the background.
   If IndexedDB is not available (old browser, private mode) everything falls back to localStorage. */
const STORE = (() => {
  const mem = new Map(),
    pend = new Map();
  let db = null,
    timer = 0,
    failed = false;
  const KEYS = ["prusart-tile-layout-v1", "prusart-tile-layout-backups"];
  const lsGet = (k) => {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  };
  const lsSet = (k, v) => {
    localStorage.setItem(k, v); // may throw (quota) — callers handle it
  };
  function open() {
    return new Promise((res) => {
      try {
        if (!window.indexedDB) return res(null);
        const rq = indexedDB.open("prusart-tile-layout", 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore("kv");
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => res(null);
        rq.onblocked = () => res(null);
        setTimeout(() => res(null), 4000); // never hang the start-up
      } catch (e) {
        res(null);
      }
    });
  }
  function idbGet(k) {
    return new Promise((res) => {
      try {
        const rq = db.transaction("kv").objectStore("kv").get(k);
        rq.onsuccess = () => res(rq.result == null ? null : rq.result);
        rq.onerror = () => res(null);
      } catch (e) {
        res(null);
      }
    });
  }
  function flush() {
    timer = 0;
    if (!db || !pend.size) return;
    const items = [...pend.entries()];
    pend.clear();
    try {
      const tx = db.transaction("kv", "readwrite"),
        os = tx.objectStore("kv");
      items.forEach(([k, v]) => os.put(v, k));
      tx.onerror = () => {
        // disk full or the browser refused: keep the data in memory and try localStorage once
        items.forEach(([k, v]) => {
          try {
            lsSet(k, v);
          } catch (e) {}
        });
        if (!failed && typeof toast === "function" && typeof t === "function")
          toast(t("saveErr"), false);
        failed = true;
      };
      tx.oncomplete = () => (failed = false);
    } catch (e) {}
  }
  const ready = (async () => {
    db = await open();
    for (const k of KEYS) {
      let v = db ? await idbGet(k) : null;
      if (v == null) {
        // first start after the update: move the old localStorage data over
        v = lsGet(k);
        if (v != null && db) pend.set(k, v);
      }
      if (v != null) mem.set(k, v);
    }
    if (pend.size) flush();
    try {
      if (navigator.storage && navigator.storage.persist)
        navigator.storage.persist();
    } catch (e) {}
    return !!db;
  })();
  return {
    ready,
    get: (k) => (mem.has(k) ? mem.get(k) : lsGet(k)),
    set(k, v) {
      mem.set(k, v);
      if (!db) return lsSet(k, v);
      pend.set(k, v);
      if (!timer) timer = setTimeout(flush, 30);
    },
    flush,
    usesIdb: () => !!db,
  };
})();
// write everything before the page goes away (app switch, close)
addEventListener("pagehide", () => STORE.flush());
document.addEventListener(
  "visibilitychange",
  () => document.visibilityState === "hidden" && STORE.flush(),
);
