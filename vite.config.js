import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

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
//   - connect-src, because the HMR client opens a websocket back to localhost.
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

	return match[1]
		.trim()
		.replace("connect-src 'none'", "connect-src 'self' ws: wss:; worker-src 'self' blob:")
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

export default defineConfig({
	plugins: [devCsp],
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
