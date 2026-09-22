// English strings. Keys mirror no.js exactly — see that file for the rules on
// markup in values and on {param} placeholders.
export const STRINGS_EN = {
	// ---- Chrome: navbar, footer, document ----------------------------------
	"nav.home": "Home",
	"nav.library": "Library",
	"nav.wishlist": "Wishlist",
	"nav.searchPlaceholder": "Search your library",
	"nav.suggestions": "Suggestions",
	"nav.recentSearches": "Recent searches",
	"nav.search": "Search",
	"nav.login": "Log in",
	"nav.profile": "Profile",
	"nav.themeToggle": "Switch theme (dark or light)",
	"nav.menuToggle": "Menu",
	"footer.copyright": "Spindle ©",

	// ---- Language switcher --------------------------------------------------
	"lang.group": "Language",
	"lang.no": "NO",
	"lang.en": "EN",
	"lang.noFull": "Norwegian",
	"lang.enFull": "English",

	// ---- Welcome ------------------------------------------------------------
	"welcome.tagline": "Your physical music library — kept safe on your own device.",
	"welcome.createLibrary": "Create library",
	"welcome.login": "Log in",
	"welcome.about": "About Spindle",
	"welcome.credit": "Spindle ©",
	"welcome.backup": "Backup",

	// ---- About --------------------------------------------------------------
	"about.back": "← Back",
	"about.title": "About Spindle",
	"about.lead":
		"Spindle is a library for physical music: CDs, LPs and cassettes. Your library is created in this browser and stays there, locked with a password only you know.",
	"about.originsTitle": "Origins",
	"about.originsBody":
		"Spindle began as a team assignment at GET Academy. It has been rebuilt here as an open project for general use.",
	"about.privacyTitle": "Privacy",
	"about.privacyBody":
		"No server, no tracking, and no third parties — with two exceptions you choose. If you turn on barcode look-ups, the scanned number is sent to musicbrainz.org and the cover of the album you pick is fetched from coverartarchive.org — nothing from your library — and, as with any web request, they see your IP address. If you tick “Stay unlocked on this device” when logging in, the key that opens your library is kept in this browser until you log out, so anyone holding the device can open it meanwhile. Your library is encrypted at rest with a key derived from your password (PBKDF2 + HKDF). Without the password the data cannot be read — there is no password recovery, so export regularly.",
};
