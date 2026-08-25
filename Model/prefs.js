// Unauthenticated preference store (v0.1 task M).
//
// Language and theme have to survive a reload *before* anyone logs in, so they
// cannot live in the encrypted library envelope — there is no key to decrypt it
// with until the user unlocks. They get their own plaintext key instead.
//
// Nothing sensitive is allowed in here, and that is a deliberate boundary, not
// an oversight: this blob is readable by anyone with access to the browser
// profile. Display preferences only. Library data stays in spindle:v1:state,
// encrypted.
const PREFS_KEY = "spindle:v1:prefs";

const PREFS_DEFAULTS = {
	lang: "no",
	theme: "dark",
};

const PREFS_ALLOWED = {
	lang: ["no", "en"],
	theme: ["dark", "light"],
};

// In-memory mirror. Doubles as the fallback when localStorage is unavailable
// (private mode, storage disabled) — preferences then work for the session and
// are simply forgotten on reload, which beats throwing on every toggle.
let prefsCache = null;

function readPrefs() {
	if (prefsCache) return prefsCache;

	prefsCache = { ...PREFS_DEFAULTS };

	let raw = null;
	try {
		raw = localStorage.getItem(PREFS_KEY);
	} catch (err) {
		console.warn("[prefs] localStorage unavailable — using defaults.");
		return prefsCache;
	}

	if (!raw) return prefsCache;

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		console.warn("[prefs] stored preferences are unreadable — using defaults.");
		return prefsCache;
	}

	if (!parsed || typeof parsed !== "object") return prefsCache;

	// Whitelist every value on the way in. A hand-edited or corrupted blob must
	// not be able to put the app into a state the UI has no rendering for.
	for (const name of Object.keys(PREFS_DEFAULTS)) {
		if (PREFS_ALLOWED[name].includes(parsed[name])) {
			prefsCache[name] = parsed[name];
		}
	}

	return prefsCache;
}

// Another tab wrote to spindle:v1:prefs. Drop the mirror so the next read comes
// from storage — without this the stale cached language or theme would win.
// When localStorage is unavailable the cache IS the store, but then no storage
// event can reach us either, so there is nothing to invalidate.
function invalidatePrefsCache() {
	prefsCache = null;
}

function getPref(name) {
	return readPrefs()[name];
}

function setPref(name, value) {
	if (!PREFS_ALLOWED[name] || !PREFS_ALLOWED[name].includes(value)) return;

	const prefs = readPrefs();
	prefs[name] = value;

	try {
		localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
	} catch (err) {
		// Quota or disabled storage. The in-memory cache is already updated, so
		// the preference still applies for this session.
		console.warn("[prefs] could not persist preferences:", err);
	}
}
