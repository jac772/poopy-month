// Poopy Month service worker: network-first with a cache fallback so the
// installed app keeps working offline. Kept deliberately simple.
const CACHE = "poopy-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // The sync API must always go to the network. A cached copy served after a
  // blip would quietly show yesterday's state as if it were current.
  if (url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        // Never cache a failure or a redirect: while the password gate is on,
        // every locked request lands on /unlock and would otherwise be stored
        // as the offline copy of the page it was meant to be.
        if (!res.ok || res.redirected) return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => {
          try { c.put(req, copy); } catch (_) {}
        });
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/")))
  );
});
