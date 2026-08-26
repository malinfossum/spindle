import { defineConfig } from "vite";

// The <meta> CSP in index.html is written for the shipped app, which makes no
// network requests at all — connect-src 'none'. Vite's dev server needs one
// exception: the HMR client opens a websocket back to localhost, and without
// this the console fills with a CSP violation on every reload.
//
// Only connect-src is relaxed, and only while serving. script-src stays 'self'
// (Vite's client is a real file, not an inline script), so the policy that
// matters most is still enforced in development. The built output is untouched
// — verify the real policy against `npm run preview`, not `npm run dev`.
const relaxConnectSrcInDev = {
	name: "spindle:relax-connect-src-in-dev",
	apply: "serve",
	transformIndexHtml: {
		order: "pre",
		handler(html) {
			return html.replace("connect-src 'none'", "connect-src 'self' ws: wss:");
		},
	},
};

export default defineConfig({
	plugins: [relaxConnectSrcInDev],
	server: {
		port: 5070,
		strictPort: true,
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
