// What the service worker caches, and the version that names its cache. Pure,
// so node --test can check it; the Vite plugin in vite.config.js feeds it every
// file in dist/ after the build.
//
// The version is a hash of every file's CONTENTS, not its name. Only Vite's
// bundled files carry content hashes in their names — themePreload.js, the
// manifest, the icons and favicon.ico keep theirs when they change — and a
// name-only version would leave sw.js byte-identical and the old file cached
// for good. _headers is hashed too, because Cache Storage keeps a response's
// headers: the cached / carries the CSP it was fetched with, so a policy change
// has to be a new worker.

import { createHash } from "node:crypto";

// _headers is Cloudflare's config, not a file anyone fetches. og-image.png is
// for link previews, which are fetched by other servers. sw.js is the worker.
export const NOT_PRECACHED = new Set(["_headers", "og-image.png", "sw.js"]);

export function precacheManifest(files) {
	// Every file feeds the version, sw.js's own source included; NOT_PRECACHED
	// only keeps names off the list.
	const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

	const hash = createHash("sha256");
	for (const file of sorted) {
		hash.update(file.path);
		hash.update("\0");
		hash.update(file.contents);
		hash.update("\0");
	}

	// Cloudflare Pages answers /index.html with a 308 to /, and a redirected
	// response cannot answer a navigation — so the document is cached as /.
	const urls = sorted
		.filter((file) => !NOT_PRECACHED.has(file.path))
		.map((file) => (file.path === "index.html" ? "/" : `/${file.path}`))
		.sort();

	return { urls, version: hash.digest("hex").slice(0, 16) };
}
