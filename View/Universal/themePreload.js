// Applies the stored theme and language before the stylesheet paints, so a
// light-theme user doesn't get a dark flash on every load.
//
// Loaded from <head> as a plain synchronous <script src>, which blocks parsing
// until it has run — first paint cannot happen before that, so the attributes
// are always on <html> in time. It used to be an inline <script>, but an inline
// script is exactly what forces 'unsafe-inline' in the Content-Security-Policy;
// one extra same-origin request buys a script-src of plain 'self'.
//
// It still duplicates the prefs key deliberately: Model/prefs.js loads at the
// bottom of <body> and waiting for it would reintroduce the flash this
// prevents. Keep the two key literals in sync.
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
