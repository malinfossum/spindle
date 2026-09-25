// The service worker (v0.6). It caches the app itself and nothing else, so an
// installed Spindle opens with no network. The library is already on the
// device; this puts the app there too.
//
// The two constants below are placeholders. The spindle:offline-worker plugin
// in vite.config.js fills them after the build and writes dist/sw.js; this file
// is never served as it stands. It is a classic script with no imports, so it
// runs in every browser that has service workers.
//
// What it never touches: localStorage (a worker cannot reach it), IndexedDB
// (never opened here), and anything cross-origin. The library, the covers and
// the key never enter Cache Storage.
//
// Updates are quiet (docs/v0.6-plan.md § 2): no skipWaiting(), no
// clients.claim(). A new version installs in the background, waits until every
// Spindle window is closed, and runs from the next launch.

const VERSION = "__SPINDLE_VERSION__";
const FILES = ["__SPINDLE_FILES__"];
const CACHE = `spindle-${VERSION}`;

// Why a response must not be cached, or "" if it can be. Cloudflare Pages
// answers a missing path with index.html and a 200, so a status check alone
// would cache the page under an icon's name and break offline only. Only / may
// be HTML, and nothing may arrive by redirect — a navigation refuses a
// redirected response.
function problem(url, response) {
	if (!response.ok) return `status ${response.status}`;
	if (response.redirected) return "redirected";
	const html = (response.headers.get("content-type") || "").startsWith("text/html");
	if (url === "/" && !html) return "not text/html";
	if (url !== "/" && html) return "text/html";
	return "";
}

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			// Past the HTTP cache, so an old file cannot land in a new version.
			const responses = await Promise.all(
				FILES.map((url) => fetch(url, { cache: "reload" })),
			);
			responses.forEach((response, i) => {
				const why = problem(FILES[i], response);
				if (why) throw new Error(`[sw] ${FILES[i]}: ${why}`);
			});
			// Any rejection fails the install and the old worker keeps running.
			// A half-filled cache is removed so it never outlives the attempt.
			const cache = await caches.open(CACHE);
			try {
				await Promise.all(responses.map((response, i) => cache.put(FILES[i], response)));
			} catch (err) {
				await caches.delete(CACHE);
				throw err;
			}
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key.startsWith("spindle-") && key !== CACHE) await caches.delete(key);
			}
		})(),
	);
});

async function fromCache(key, request) {
	const cache = await caches.open(CACHE);
	// ignoreVary: this cache holds exactly one response per URL, written only
	// by install above, so Vary can only ever cause a false miss here, never
	// serve the wrong response.
	return (await cache.match(key, { ignoreVary: true })) || fetch(request);
}

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	// MusicBrainz, the Cover Art Archive and archive.org go straight to the
	// network under the page's own CSP, exactly as without a worker.
	if (new URL(request.url).origin !== self.location.origin) return;

	// Routing is fragment-based, so every page is the one document at /.
	if (request.mode === "navigate") {
		event.respondWith(fromCache("/", request));
		return;
	}
	// Nothing fetched at runtime is added to the cache.
	event.respondWith(fromCache(request, request));
});

// Rollback, written down and not built (docs/v0.6-plan.md § 2): if a worker
// ever ships broken, replace this file with one that calls skipWaiting(),
// deletes every spindle-* cache and unregisters itself. The browser fetches
// sw.js past the HTTP cache, so the next check finds it.
