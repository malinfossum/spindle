// Applies the stored theme and language before the stylesheet paints, so a
// light-theme user doesn't get a dark flash on every load.
//
// Loaded from <head> as a plain synchronous <script src>, which blocks parsing
// until it has run — first paint cannot happen before that, so the attributes
// are always on <html> in time. It used to be an inline <script>, but an inline
// script is exactly what forces 'unsafe-inline' in the Content-Security-Policy;
// one extra same-origin request buys a script-src of plain 'self'.
//
// It lives in public/ rather than View/Universal/ because it is the one file
// Vite must NOT touch: public/ is copied to the build output verbatim, while
// anything Vite bundles becomes a module, and a module script is deferred by
// definition — which puts the theme after first paint and brings the flash
// back. The rest of the app is a module graph rooted at
// Controller/Universal/boot.js; this file deliberately is not part of it.
//
// It still duplicates the prefs key deliberately: Model/prefs.js is inside that
// module graph, and waiting for it would reintroduce the flash this prevents.
// Keep the two key literals in sync.
try {
	const stored = JSON.parse(localStorage.getItem("spindle:v1:prefs") || "{}");
	if (stored.theme === "light" || stored.theme === "dark") {
		document.documentElement.setAttribute("data-theme", stored.theme);
	}
	if (stored.lang === "no" || stored.lang === "en") {
		document.documentElement.setAttribute("lang", stored.lang);
	}
} catch (err) {
	/* No stored preferences, or storage is blocked — defaults apply. */
}
