import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getPref, invalidatePrefsCache, PREFS_KEY, setPref } from "../Model/prefs.js";

// prefs.js reads localStorage inside function bodies only, so a Map behind the
// four methods it calls is enough to drive it from Node.
function fakeStorage() {
	const map = new Map();
	return {
		getItem: (k) => map.get(k) ?? null,
		setItem: (k, v) => map.set(k, String(v)),
		removeItem: (k) => map.delete(k),
		clear: () => map.clear(),
	};
}

beforeEach(() => {
	globalThis.localStorage = fakeStorage();
	invalidatePrefsCache();
});
afterEach(() => {
	delete globalThis.localStorage;
	invalidatePrefsCache();
});

function stored() {
	return JSON.parse(localStorage.getItem(PREFS_KEY));
}

test("lookups defaults to unset when nothing is stored", () => {
	assert.equal(getPref("lookups"), "unset");
});

test("a stored off stays off; stored garbage reads as unset", () => {
	localStorage.setItem(PREFS_KEY, JSON.stringify({ prefsVersion: 2, lookups: "off" }));
	assert.equal(getPref("lookups"), "off");

	invalidatePrefsCache();
	localStorage.setItem(PREFS_KEY, JSON.stringify({ prefsVersion: 2, lookups: "maybe" }));
	assert.equal(getPref("lookups"), "unset");
});

test("a v0.4 blob with lookups on migrates to unset and is written back as v2", () => {
	localStorage.setItem(PREFS_KEY, JSON.stringify({ lang: "en", lookups: "on" }));
	assert.equal(getPref("lookups"), "unset");
	assert.equal(getPref("lang"), "en");
	assert.deepEqual(stored(), { prefsVersion: 2, lang: "en", theme: "dark", lookups: "unset" });
});

test("a v0.4 blob with lookups off stays off and is stamped v2", () => {
	localStorage.setItem(PREFS_KEY, JSON.stringify({ lookups: "off" }));
	assert.equal(getPref("lookups"), "off");
	assert.equal(stored().prefsVersion, 2);
});

test("a v0.4 blob with no lookups key reads unset and is stamped v2", () => {
	localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: "light" }));
	assert.equal(getPref("lookups"), "unset");
	assert.equal(stored().prefsVersion, 2);
});

test("setPref accepts the three values and stamps the version", () => {
	setPref("lookups", "on");
	assert.equal(getPref("lookups"), "on");
	assert.equal(stored().prefsVersion, 2);
	setPref("lookups", "unset");
	assert.equal(getPref("lookups"), "unset");
	setPref("lookups", "sideways");
	assert.equal(getPref("lookups"), "unset");
});
