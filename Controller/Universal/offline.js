// Registers the service worker (v0.6). Production builds only: the dev server
// never sees a worker, so HMR is untouched, and `npm run build && npm run
// preview` is how it is tested locally.
//
// The browser checks sw.js for a new version on navigation, and with fragment
// routing there is no navigation after launch. So the page also asks whenever
// it becomes visible again: one small request, and it never reloads anything.

export function registerWorker() {
	if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
	navigator.serviceWorker.register("/sw.js").then(
		(registration) => {
			document.addEventListener("visibilitychange", () => {
				if (document.visibilityState !== "visible") return;
				registration.update().catch(() => {
					/* Offline or busy: the next visible check tries again. */
				});
			});
		},
		(err) => console.warn("[offline] the service worker did not register:", err),
	);
}
