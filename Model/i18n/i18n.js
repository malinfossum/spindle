// Translation lookup. Loaded after no.js and en.js, before any view script.
//
// Views call t("some.key") inline and are re-rendered wholesale by updateView(),
// so switching language is just: store the choice, re-render, done. There is no
// per-node binding to keep in sync.
const LANGUAGES = {
	no: { strings: STRINGS_NO, seed: SEED_NO, htmlLang: "no" },
	en: { strings: STRINGS_EN, seed: SEED_EN, htmlLang: "en" },
};

const FALLBACK_LANG = "no";

function getLang() {
	const lang = getPref("lang");
	return LANGUAGES[lang] ? lang : FALLBACK_LANG;
}

// t("music.save")                        → "Lagre"
// t("library.titleCount", { count: 12 })  → "Bibliotek (12)"
//
// A falsy key returns "" so callers can pass a possibly-empty error key straight
// through: t(errors.artist) renders nothing when there is no error.
function t(key, params) {
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

// Starter genre/location lists for a brand-new library, in the active language.
function seedData() {
	const seed = LANGUAGES[getLang()].seed;
	return { genre: [...seed.genre], location: [...seed.location] };
}

function setLang(lang) {
	if (!LANGUAGES[lang] || lang === getLang()) return;

	setPref("lang", lang);
	applyLang();
	updateView();
}

// Everything about the document that lives outside #app and so is not covered
// by a re-render: the lang attribute screen readers use to pick a voice, and
// the static navbar/footer chrome in index.html.
function applyLang() {
	document.documentElement.setAttribute("lang", LANGUAGES[getLang()].htmlLang);
	applyStaticText();
}

// The navbar and footer are hand-written in index.html rather than rendered
// from state, so updateView() never touches them. Push the current language
// into them by hand. Called from updateView() so the two can never drift.
function applyStaticText() {
	const setText = (id, key) => {
		const el = document.getElementById(id);
		if (el) el.textContent = t(key);
	};

	setText("nav-home-desktop", "nav.home");
	setText("nav-home-mobile", "nav.home");
	setText("nav-wishlist-desktop", "nav.wishlist");
	setText("nav-wishlist-mobile", "nav.wishlist");
	setText("nav-search-desktop", "nav.search");
	setText("nav-search-mobile", "nav.search");
	setText("footer-copyright", "footer.copyright");

	for (const input of document.querySelectorAll(".nav-search-input")) {
		input.placeholder = t("nav.searchPlaceholder");
	}

	const burger = document.getElementById("nav-burger");
	if (burger) burger.setAttribute("aria-label", t("nav.menuToggle"));

	for (const btn of document.querySelectorAll(".btn-theme")) {
		btn.setAttribute("aria-label", t("nav.themeToggle"));
	}

	// syncNavbar() owns the login/logout and profile buttons — their text depends
	// on auth state as well as language, so it stays the single writer for those.
}

// Segmented NO / EN control. Shared by the welcome page and the profile
// settings block so the two can't drift apart.
// Pass labelledById when the control already sits next to a visible label, so
// the group is named once rather than twice.
function langSwitcher(extraClass = "", labelledById = "") {
	const current = getLang();

	const groupLabel = labelledById
		? `aria-labelledby="${labelledById}"`
		: `aria-label="${t("lang.group")}"`;

	const option = (code, labelKey, fullKey) => /*HTML*/ `
        <button class="lang-opt ${current === code ? "is-active" : ""}"
                type="button"
                aria-pressed="${current === code}"
                lang="${LANGUAGES[code].htmlLang}"
                title="${t(fullKey)}"
                data-action="set-lang" data-lang="${code}">${t(labelKey)}</button>`;

	return /*HTML*/ `
    <div class="lang-switch ${extraClass}" role="group" ${groupLabel}>
        ${option("no", "lang.no", "lang.noFull")}
        ${option("en", "lang.en", "lang.enFull")}
    </div>`;
}
