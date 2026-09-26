/* OmniLifeONE — service worker (avisos e funcionamento offline)
   IMPORTANTE: todos os apps de solverone.com.br (antes marceloneco.github.io) moram no mesmo endereço e dividem os
   caches. Por isso o nome leva o app ("dgo-omnilife-") e, ao atualizar, só apagamos caches
   DESTE app — nunca os dos outros (senão eles perdem o modo sem internet). */
const APPC = "dgo-omnilife-";
const CACHE = APPC + "v24"; /* VERSAO: suba este número a cada versão nova */
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"]).catch(() => {})));
});
self.addEventListener("activate", (e) => {
  /* apaga só versões antigas deste app (inclusive as do nome antigo "omnilife-one-vN") */
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && (k.startsWith(APPC) || k.startsWith("omnilife-one-v"))).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Código do app (página, .js, .css, .json): REDE PRIMEIRO, conferindo com o servidor
   (cache:"no-cache" fura o cache de até 10 min do GitHub Pages) e com prazo de 4 s; sem
   resposta, usa a cópia guardada. Nunca "página nova com arquivo antigo".
   Arquivo pesado (imagem, som, motor de OCR): cópia primeiro, atualizando por trás. */
const HEAVY = /\.(png|jpe?g|gif|webp|svg|ico|mp3|wav|ogg|m4a|wasm|traineddata|gz)$/i;
function withTimeout(p, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error("timeout")), ms); p.then((v) => { clearTimeout(t); ok(v); }, (e) => { clearTimeout(t); no(e); }); }); }
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (HEAVY.test(u.pathname)) {
    e.respondWith(caches.match(r).then((m) => {
      const net = fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)).catch(() => {}); } return res; });
      return m || net;
    }));
    return;
  }
  e.respondWith(
    withTimeout(fetch(r, { cache: "no-cache" }), 4000).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)).catch(() => {}); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || (r.mode === "navigate" ? caches.match("./index.html") : undefined)).then((m) => m || new Response("", { status: 504 })))
  );
});
/* "Salvar no aparelho" (Ajustes → Usar sem internet): baixa a lista e responde o tamanho */
self.addEventListener("message", (e) => {
  const d = e.data || {}, port = e.ports && e.ports[0];
  const reply = (x) => { try { port && port.postMessage(x); } catch (_) {} };
  if (d.type === "save") {
    e.waitUntil(caches.open(CACHE).then(async (c) => {
      let bytes = 0, ok = 0;
      for (const f of d.files || []) { try { const res = await fetch(f, { cache: "no-cache" }); if (res.ok) { const b = await res.clone().arrayBuffer(); bytes += b.byteLength; await c.put(f, res); ok++; } } catch (_) {} }
      reply({ ok, bytes, cache: CACHE });
    }));
  } else if (d.type === "clear") {
    e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith(APPC)).map((k) => caches.delete(k)))).then(() => reply({ ok: true })));
  } else if (d.type === "version") reply({ cache: CACHE });
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if (c.url.startsWith(self.registration.scope)) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: "OmniLifeONE", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "OmniLifeONE", { body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", data: { url: d.url || "./" } }));
});
