import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { defineConfig } from "vite";
import { precacheManifest } from "./scripts/precache.js";

// The policy lives in public/_headers, where Cloudflare Pages serves it as a
// real response header. index.html no longer carries a <meta> copy of it, so
// there is exactly one place it is written down.
//
// The dev server still has to enforce something — a stray inline script is a
// mistake worth catching while typing, not on a deployed URL — so this reads the
// policy back out of _headers and injects it as a <meta> tag while serving. Two
// exceptions are needed, both for Vite's own client and neither belonging
// anywhere near the built output:
//
//   - connect-src, because the HMR client opens a websocket back to localhost —
//     added beside the real sources, not in place of them.
//   - worker-src, because when that socket drops Vite reconnects from a worker
//     created out of a blob: URL, and script-src is the fallback for workers.
//
// script-src itself stays 'self' — Vite's dev client is a real file, not an
// inline script — so the directive that matters most is enforced in development
// too. frame-ancestors is dropped instead: a <meta> tag cannot carry it, and
// leaving it in only earns a console warning on every page load.
//
// npm run preview serves the built output with no policy at all. That is not a
// gap it used to cover — the policy that ships is the one on the deployed URL,
// and `curl -I` is how to check it.
function devPolicy() {
	const file = readFileSync("public/_headers", "utf8");
	const match = file.match(/^\s*Content-Security-Policy:\s*(.+)$/m);
	if (!match) {
		throw new Error(
			"public/_headers has no Content-Security-Policy line to serve in development",
		);
	}

	const policy = match[1].trim();
	const marker =
		"connect-src 'self' https://musicbrainz.org https://coverartarchive.org https://archive.org https://*.archive.org";
	if (!policy.includes(marker)) {
		throw new Error(
			`public/_headers no longer contains "${marker}" — update the dev replacement in vite.config.js`,
		);
	}

	return policy
		.replace(marker, `${marker} ws: wss:; worker-src 'self' blob:`)
		.replace("; frame-ancestors 'none'", "");
}

const devCsp = {
	name: "spindle:dev-csp",
	apply: "serve",
	transformIndexHtml: {
		order: "pre",
		handler(html) {
			const meta = `<meta http-equiv="Content-Security-Policy" content="${devPolicy()}">`;
			return html.replace(
				"</head>",
				`    ${meta}
</head>`,
			);
		},
	},
};

// Fills the two placeholders in sw.js and writes dist/sw.js (v0.6). It runs in
// closeBundle because by then dist/ holds everything Cloudflare will serve: the
// bundle, the final index.html and the copies from public/. One walk over it
// is the file list, with nothing to merge.
const PLACEHOLDERS = {
	version: '"__SPINDLE_VERSION__"',
	files: '["__SPINDLE_FILES__"]',
};

// writeBundle runs only when the build succeeded. closeBundle runs either way —
// Vite 8 calls it on a failed build too — and dist/ is then stale or missing;
// walking it would bury the real error under ENOENT from this plugin.
let bundleWritten = false;

const offlineWorker = {
	name: "spindle:offline-worker",
	apply: "build",
	writeBundle() {
		bundleWritten = true;
	},
	closeBundle() {
		if (!bundleWritten) return;
		const outDir = "dist";
		const files = readdirSync(outDir, { recursive: true, withFileTypes: true })
			.filter((entry) => entry.isFile())
			.map((entry) => {
				const file = join(entry.parentPath, entry.name);
				return {
					path: relative(outDir, file).split(sep).join("/"),
					contents: readFileSync(file),
				};
			});
		const template = readFileSync("sw.js", "utf8");
		for (const placeholder of Object.values(PLACEHOLDERS)) {
			if (!template.includes(placeholder)) {
				throw new Error(`sw.js no longer contains ${placeholder} — update vite.config.js`);
			}
		}
		// The worker's own source feeds the version too: a change to sw.js alone
		// must name a new cache, or its install would write into the cache the
		// running worker serves from.
		const { urls, version } = precacheManifest([
			...files,
			{ path: "sw.js", contents: template },
		]);

		// Replacer functions, so a $ in a file name can never be read as a pattern.
		const worker = template
			.replace(PLACEHOLDERS.version, () => JSON.stringify(version))
			.replace(PLACEHOLDERS.files, () => JSON.stringify(urls));
		writeFileSync(join(outDir, "sw.js"), worker);
	},
};

export default defineConfig({
	plugins: [devCsp, offlineWorker],
	server: {
		port: 5070,
		strictPort: true,
	},
	preview: {
		port: 4174,
		strictPort: true,
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
