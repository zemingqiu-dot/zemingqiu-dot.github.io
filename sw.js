/* 咖啡杯测 —— 离线缓存
   策略：页面与静态资源网络优先（断网回退缓存），接口一律不缓存（数据必须实时）。
   只在安全上下文（https / localhost）生效；局域网 http 下浏览器会静默忽略。 */
const VERSION = "cupping-pwa-v3";
const PRECACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/picker.js",
  "/i18n.js",
  "/local-backend.js",
  "/gate.js",
  "/gate-config.js",
  "/i18n-en.json",
  "/i18n-ja.json",
  "/i18n-ko.json",
  "/manifest.webmanifest",
  "/logo.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-1024.png",
  "/icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* 接口与图片上传目录不缓存：杯测数据每次都要最新 */
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) return;

  /* 页面导航：先网络，断网才用缓存（保证刷新拿到最新 HTML） */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  /* 静态资源：先网络（本地服务很快，保证改完立刻生效），断网才回退缓存 */
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/")))
  );
});
