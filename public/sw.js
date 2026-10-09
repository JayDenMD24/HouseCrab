// Service worker mínimo: permite instalar la web como app. No guarda nada en caché a propósito,
// para que siempre se vea la última versión desplegada.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
