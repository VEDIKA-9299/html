// Offline support for the MediDocker emergency page.
// After the page is opened once, it (and the signature checker) are kept on
// the phone, so the card + SMS/call buttons work without internet.
const CACHE = "medidocker-emergency-v1";
const FILES = ["emergency.html", "nacl-fast.min.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("medidocker-emergency-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const name = url.pathname.split("/").pop();
  if (!FILES.includes(name)) return; // other pages on the site are left alone

  // Network first (gets updates), cached copy when offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(name, copy));
        return res;
      })
      .catch(() => caches.match(name))
  );
});
