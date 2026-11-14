// Service worker: network-first, falls back to cache when offline.
// Bump CACHE on every deploy so old files are dropped.
const CACHE = "tile-layout-v43";
const SHELL = ["./", "./index.html", "./css/app.css", "./js/00-store.js", "./js/01-i18n.js", "./js/02-core.js", "./js/03-engine.js", "./js/04-state.js", "./js/05-draw.js", "./js/06-interact.js", "./js/07-ui.js", "./js/08-actions.js", "./js/09-materials.js", "./js/10-pdf.js", "./js/11-edit.js", "./js/12-buildup.js", "./js/13-heating.js", "./js/15-niche.js", "./js/16-wizard.js", "./js/17-ux.js", "./js/18-texture.js", "./js/19-sync.js", "./js/20-kitchen.js", "./js/21-home.js", "./js/22-plan.js", "./js/23-nav.js", "./js/24-keypad.js", "./js/25-plan-view.js", "./js/26-plan-act.js", "./js/27-plan-build.js", "./js/28-piece.js", "./js/14-init.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const cp = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp));
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
