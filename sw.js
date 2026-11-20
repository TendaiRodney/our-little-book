/* Purpose: Offline support for Our Little Book.
   Install saves only the small "shell" (page, icons, manifest) so it always succeeds quickly.
   The photos are saved one by one by the page itself (see "Offline saving" in index.html),
   so an interrupted save resumes next time instead of failing completely.
   Every request is answered from the saved copy when there is no internet. */
const CACHE = "our-little-book-v2";
const SHELL = ["./", "index.html", "apple-touch-icon.png", "icon-512.png", "manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/** Save a good response for next time without blocking the reply. */
function remember(req, res) {
  if (res && (res.ok || res.type === "opaque")) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // The page: newest version when online, saved copy when offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => remember("index.html", res))
        .catch(() => caches.match("index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Photos, icons, fonts: saved copy first, otherwise network (and save it).
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit ||
      fetch(req).then(res => remember(req, res)))
  );
});
