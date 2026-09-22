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
export const PREFS_KEY = "spindle:v1:prefs";

// Bumped when a stored value has to be read differently (v0.5). A blob
// without the field is v0.4's and goes through migratePrefs() once.
const PREFS_VERSION = 2;

const PREFS_DEFAULTS = {
	lang: "no",
	theme: "dark",
	// v0.4, widened in v0.5. Whether a barcode may be sent to musicbrainz.org
	// and a cover fetched from coverartarchive.org. "unset" until the question
	// has been answered — once after Create library, or on the first Look up;
	// "off" is an answer and is never asked again. Plaintext on purpose: it has
	// to be readable before unlock, and it says nothing about what the library
	// holds.
	lookups: "unset",
};

const PREFS_ALLOWED = {
	lang: ["no", "en"],
	theme: ["dark", "light"],
	lookups: ["unset", "off", "on"],
};

// Brings a v0.4 blob up to v2, in place. The v0.4 yes was given for one host
// and v0.5 sends to two, so it goes back to unset and the dialog — naming both
// hosts — asks once more. An off was a deliberate choice and still means no.
function migratePrefs(parsed) {
	if (parsed.prefsVersion === PREFS_VERSION) return false;
	if (parsed.lookups === "on") parsed.lookups = "unset";
	return true;
}

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
	} catch {
		console.warn("[prefs] localStorage unavailable — using defaults.");
		return prefsCache;
	}

	if (!raw) return prefsCache;

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		console.warn("[prefs] stored preferences are unreadable — using defaults.");
		return prefsCache;
	}

	if (!parsed || typeof parsed !== "object") return prefsCache;

	const migrated = migratePrefs(parsed);

	// Whitelist every value on the way in. A hand-edited or corrupted blob must
	// not be able to put the app into a state the UI has no rendering for.
	for (const name of Object.keys(PREFS_DEFAULTS)) {
		if (PREFS_ALLOWED[name].includes(parsed[name])) {
			prefsCache[name] = parsed[name];
		}
	}

	// Written back once so the migration does not run on every read — and so
	// a blob that never carried a version carries one from now on.
	if (migrated) writePrefs(prefsCache);

	return prefsCache;
}

// Another tab wrote to spindle:v1:prefs. Drop the mirror so the next read comes
// from storage — without this the stale cached language or theme would win.
// When localStorage is unavailable the cache IS the store, but then no storage
// event can reach us either, so there is nothing to invalidate.
export function invalidatePrefsCache() {
	prefsCache = null;
}

export function getPref(name) {
	return readPrefs()[name];
}

function writePrefs(prefs) {
	try {
		localStorage.setItem(PREFS_KEY, JSON.stringify({ prefsVersion: PREFS_VERSION, ...prefs }));
	} catch (err) {
		// Quota or disabled storage. The in-memory cache is already updated, so
		// the preference still applies for this session.
		console.warn("[prefs] could not persist preferences:", err);
	}
}

export function setPref(name, value) {
	if (!PREFS_ALLOWED[name]?.includes(value)) return;

	const prefs = readPrefs();
	prefs[name] = value;
	writePrefs(prefs);
}
