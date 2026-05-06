// service-worker.js – einfacher Cache für die Mobile-PWA von "Lehrer vs. Schüler"
// Strategie: Cache-First für alle Spiel-Assets, Netzwerk-Fallback. Bei neuer Version
// wird der alte Cache gelöscht (CACHE_NAME erhöhen → Force-Refresh).

const CACHE_NAME = 'lvs-mobile-v3'; // Cache-Name. Bei Asset-Änderungen Versionsnummer erhöhen.
const ASSETS = [ // Liste aller Dateien die offline verfügbar sein müssen
  './mobile.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './p5.min.js',
  './highscoreManager.js?v=5',
  './settingsManager.js?v=5',
  './soundManager.js?v=5',
  './upgradeManager.js?v=5',
  './economyManager.js?v=5',
  './enemy.js?v=5',
  './tower.js?v=5',
  './mathTeacher.js?v=5',
  './peTeacher.js?v=5',
  './principal.js?v=5',
  './bioTeacher.js?v=5',
  './roomTeacher.js?v=5',
  './motorcycleTeacher.js?v=5',
  './physicsTeacher.js?v=5',
  './electroTeacher.js?v=5',
  './waveManager.js?v=5',
  './uiManager.js?v=5',
  './menuScene.js?v=5',
  './gameScene.js?v=5',
  './sketch.js?v=5'
];

self.addEventListener('install', (event) => { // Beim Installieren: Assets vorab cachen
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {})) // Cache füllen, Fehler tolerieren
      .then(() => self.skipWaiting()) // Sofort aktiv werden
  );
});

self.addEventListener('activate', (event) => { // Beim Aktivieren: alte Caches löschen
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)) // Alte Caches entfernen
    )).then(() => self.clients.claim()) // Sofort die Kontrolle über alle Clients übernehmen
  );
});

self.addEventListener('fetch', (event) => { // Bei jedem Request: Cache-First
  if (event.request.method !== 'GET') return; // Nur GET cachen
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached; // Aus Cache liefern wenn vorhanden
      return fetch(event.request).then((response) => {
        // Erfolgreiche Same-Origin-Antworten zusätzlich in den Cache legen
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => cached); // Bei Netzwerkfehler ggf. Cache-Fallback
    })
  );
});
