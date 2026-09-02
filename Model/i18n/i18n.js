// Translation lookup: string tables in, strings out. No DOM in this file — the
// language-driven DOM patching it used to carry moved to View/Universal/.
//
// Views call t("some.key") inline and are re-rendered wholesale by updateView(),
// so switching language is just: store the choice, re-render, done. There is no
// per-node binding to keep in sync.

import { getPref, setPref } from "../prefs.js";
import { STRINGS_EN } from "./en.js";
import { STRINGS_NO } from "./no.js";

const LANGUAGES = {
	no: { strings: STRINGS_NO, htmlLang: "no" },
	en: { strings: STRINGS_EN, htmlLang: "en" },
};

const FALLBACK_LANG = "no";

export function getLang() {
	const lang = getPref("lang");
	return LANGUAGES[lang] ? lang : FALLBACK_LANG;
}

// t("music.save")                        → "Lagre"
// t("library.titleCount", { count: 12 })  → "Bibliotek (12)"
//
// A falsy key returns "" so callers can pass a possibly-empty error key straight
// through: t(errors.artist) renders nothing when there is no error.
export function t(key, params) {
	if (!key) return "";

	const table = LANGUAGES[getLang()].strings;
	let value = table[key];

	// Missing in the active language → fall back to Norwegian, then to the key
	// itself. A visible "music.save" in the UI is a loud, findable bug; a blank
	// button is a silent one.
	if (value === undefined) value = LANGUAGES[FALLBACK_LANG].strings[key];
	if (value === undefined) {
		console.warn(`[i18n] missing string: ${key}`);
		return key;
	}

	if (!params) return value;

	return value.replace(/\{(\w+)\}/g, (match, name) =>
		Object.hasOwn(params, name) ? params[name] : match,
	);
}

// Writes the preference and stops there. Applying the choice — the <html lang>
// attribute, the static chrome, the re-render — is the Controller's call to
// make, and the DOM patching it asks for lives in View/Universal/chrome.js.
export function setLang(lang) {
	if (!LANGUAGES[lang] || lang === getLang()) return;

	setPref("lang", lang);
}

// The BCP-47 tag for a language code: what <html lang> and the switcher's
// per-option lang attribute both need. A narrow accessor rather than exporting
// LANGUAGES, so the strings and seed lists behind it stay in the Model.
export function getHtmlLang(lang = getLang()) {
	return (LANGUAGES[lang] ?? LANGUAGES[FALLBACK_LANG]).htmlLang;
}
