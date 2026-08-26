import { defineConfig } from "vite";

// The <meta> CSP in index.html is written for the shipped app, which makes no
// network requests at all — connect-src 'none'. Vite's dev server needs two
// exceptions, and neither belongs anywhere near the built output:
//
//   - connect-src, because the HMR client opens a websocket back to localhost.
//   - worker-src, because when that socket drops Vite reconnects from a worker
//     created out of a blob: URL, and script-src is the fallback for workers.
//
// script-src itself stays 'self' — Vite's dev client is a real file, not an
// inline script — so the directive that matters most is enforced while
// developing too. Verify the real policy against `npm run preview`, which
// serves the built output with the meta tag exactly as it ships.
const relaxCspForDevServer = {
	name: "spindle:relax-csp-for-dev-server",
	apply: "serve",
	transformIndexHtml: {
		order: "pre",
		handler(html) {
			return html.replace(
				"connect-src 'none';",
				"connect-src 'self' ws: wss:;\n        worker-src 'self' blob:;",
			);
		},
	},
};

export default defineConfig({
	plugins: [relaxCspForDevServer],
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
