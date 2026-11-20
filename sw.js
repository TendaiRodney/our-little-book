/* Offline support for Our Little Book.
   On first visit it saves the page, icons and every photo on the phone,
   then serves them from that saved copy, so the album opens with no internet. */
const CACHE = "our-little-book-v1";
const ASSETS = [
  "./",
  "index.html",
  "apple-touch-icon.png",
  "icon-512.png",
  "manifest.webmanifest",
  "photos/i04.jpg",
  "photos/i05.jpg",
  "photos/i07.jpg",
  "photos/i08.jpg",
  "photos/i09.jpg",
  "photos/i10.jpg",
  "photos/i11.jpg",
  "photos/i14.jpg",
  "photos/i15.jpg",
  "photos/i17.jpg",
  "photos/i22.jpg",
  "photos/i24.jpg",
  "photos/i25.jpg",
  "photos/p01.jpg",
  "photos/p02.jpg",
  "photos/p03.jpg",
  "photos/p04.jpg",
  "photos/p05.jpg",
  "photos/p06.jpg",
  "photos/p07.jpg",
  "photos/p08.jpg",
  "photos/p09.jpg",
  "photos/p10.jpg",
  "photos/p11.jpg",
  "photos/p12.jpg",
  "photos/p13.jpg",
  "photos/p14.jpg",
  "photos/p15.jpg",
  "photos/p16.jpg",
  "photos/p17.jpg",
  "photos/p18.jpg",
  "photos/p19.jpg",
  "photos/p20.jpg",
  "photos/p21.jpg",
  "photos/p22.jpg",
  "photos/p23.jpg",
  "photos/p24.jpg",
  "photos/p25.jpg",
  "photos/p26.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Page itself: try the network for the newest version, fall back to the saved copy offline.
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put("index.html", r.clone())); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Photos, icons and Google Fonts: saved copy first, then network (and save it for next time).
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  })));
});
