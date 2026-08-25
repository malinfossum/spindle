// English strings. Keys mirror no.js exactly — see that file for the rules on
// markup in values and on {param} placeholders.
const STRINGS_EN = {
	// ---- Chrome: navbar, footer, document ----------------------------------
	"nav.home": "Home",
	"nav.wishlist": "Wishlist",
	"nav.searchPlaceholder": "Search",
	"nav.search": "Search",
	"nav.login": "Log in",
	"nav.logout": "Log out",
	"nav.profile": "Profile",
	"nav.themeToggle": "Switch theme (dark or light)",
	"nav.menuToggle": "Menu",
	"footer.copyright": "© 2026 Spindle",

	// ---- Language switcher --------------------------------------------------
	"lang.group": "Language",
	"lang.no": "NO",
	"lang.en": "EN",
	"lang.noFull": "Norwegian",
	"lang.enFull": "English",

	// ---- Welcome ------------------------------------------------------------
	"welcome.tagline":
		"Your physical music library — kept safe on your own device.",
	"welcome.createLibrary": "Create library",
	"welcome.login": "Log in",
	"welcome.about": "About Spindle",
	"welcome.credit":
		"Built by Malin Fossum. Originally a team project with Henry Elendheim.",

	// ---- About --------------------------------------------------------------
	"about.back": "← Back",
	"about.title": "About Spindle",
	"about.lead":
		"Spindle is a library for physical music — CDs, LPs and cassettes. Everything lives locally in your browser. No account, no cloud.",
	"about.originsTitle": "Origins",
	"about.originsBody":
		'Spindle began as a team assignment at GET Academy (Module 2), built together with <a class="about-link" href="https://github.com/HenryElendheim/Teamoppgaver-Emne-2" target="_blank" rel="noopener noreferrer">Henry Elendheim</a>, with smaller contributions from Hans Nilsen. It has been rebuilt here as an open project for general use — not tied to any one collection.',
	"about.privacyTitle": "Privacy",
	"about.privacyBody":
		"No server, no tracking, no third parties. Your library is encrypted at rest with a key derived from your password (PBKDF2 + HKDF). Without the password the data cannot be read — there is no password recovery, so export regularly.",
	"about.a11yTitle": "Accessibility",
	"about.a11yBody":
		"Spindle is built to work with a keyboard and a screen reader: semantic HTML, visible focus, sufficient contrast, and respect for reduced motion.",
	"about.licenseTitle": "License and source code",
	"about.licenseBody":
		'Apache-2.0. Copyright 2026 Malin Fossum. <a class="about-link" href="https://github.com/malinfossum/spindle" target="_blank" rel="noopener noreferrer">View the source on GitHub</a>.',

	// ---- Auth ---------------------------------------------------------------
	"auth.createTitle": "Create library",
	"auth.unlockTitle": "Unlock",
	"auth.username": "Username",
	"auth.usernamePlaceholder": "Choose a username",
	"auth.password": "Password",
	"auth.repeatPassword": "Repeat password",
	"auth.creating": "Creating…",
	"auth.create": "Create",
	"auth.verifying": "Verifying…",
	"auth.login": "Log in",
	"auth.haveLibrary": "Already have a library?",
	"auth.noLibrary": "No library yet?",
	"auth.backToStart": "← Back to start",
	"auth.passwordHint":
		"At least 8 characters. Remember it — the library cannot be recovered without it.",
	"auth.strength": "Password strength: {level} of 4",

	// ---- Add / edit album ---------------------------------------------------
	"music.addTitle": "Add album",
	"music.editTitle": "Edit album",
	"music.addAlbum": "+ Add album",
	"music.changeCover": "Change cover image",
	"music.coverAlt": "Cover",
	"music.artist": "Artist",
	"music.artistPlaceholder": "Artist name",
	"music.titleLabel": "Album / Single / EP",
	"music.titlePlaceholder": "Title",
	"music.location": "Location",
	"music.newLocation": "New location?",
	"music.removeLocation": "Remove location?",
	"music.addLocationToggle": "Add location",
	"music.removeLocationToggle": "Remove location",
	"music.year": "Year",
	"music.yearPlaceholder": "e.g. 1997",
	"music.genre": "Genre",
	"music.newGenre": "New genre?",
	"music.removeGenre": "Remove genre?",
	"music.addGenreToggle": "Add genre",
	"music.removeGenreToggle": "Remove genre",
	"music.confirmOption": "Confirm",
	"music.notes": "Notes",
	"music.notesPlaceholder": "Your own notes about this album…",
	"music.wishlist": "Wishlist",
	"music.save": "Save",
	"music.delete": "Delete",
	"music.cancel": "Cancel",
	"music.edit": "Edit",
	"music.view": "View",
	"music.back": "← Back",
	"music.notFound": "Album not found.",

	// ---- Library / wishlist / search ----------------------------------------
	"library.title": "Library",
	"library.titleCount": "Library ({count})",
	"library.empty": "No albums yet. Add your first one!",
	"wishlist.title": "Wishlist",
	"wishlist.titleCount": "Wishlist ({count})",
	"wishlist.empty": "Your wishlist is empty. Mark albums with ⭐ to add them.",
	"search.noResults": 'No results for "{query}"',
	"search.count": 'Searched: "{query}" — {count} results',
	"search.countOne": 'Searched: "{query}" — 1 result',

	// ---- Profile ------------------------------------------------------------
	"profile.title": "{username}'s profile",
	"profile.myAlbums": "My albums: {count}",
	"profile.storage": "Storage",
	"profile.storageStats": "{used} of {total} used ({percent}%)",
	"profile.loginRequired": "You must be logged in to view your profile.",
	"profile.noAlbums": "You haven't added any albums yet.",
	"profile.settings": "Settings",
	"profile.language": "Language",

	// ---- Confirm dialogs ----------------------------------------------------
	"dialog.cancel": "Cancel",
	"dialog.delete": "Delete",
	"dialog.deleteAlbumTitle": "Delete album?",
	"dialog.deleteAlbumBody": "Delete “{title}” from your library?",
	"dialog.deleteLocationTitle": "Delete location?",
	"dialog.deleteLocationBody": "Delete “{name}” from the location list?",
	"dialog.deleteGenreTitle": "Delete genre?",
	"dialog.deleteGenreBody": "Delete “{name}” from the genre list?",

	// ---- Storage banners ----------------------------------------------------
	"storage.unavailable":
		"Your browser has disabled storage for this site. Changes will not be saved. Enable storage in your browser settings and reload.",
	"storage.quotaExceeded":
		"Storage is full. Export your library, then delete old cover images or albums.",
	"storage.warn":
		"Storage is {percent}% full. Consider deleting or exporting soon.",
	"storage.saveFailed":
		"Your change could not be saved. Export your data soon so you don't lose it.",
	"storage.needsHttps":
		"Spindle needs HTTPS or Live Server for encryption. Open it through VS Code Live Server, not straight from the file system.",
	"storage.corrupt":
		"The stored library is damaged — create a new one or import a backup (coming in v0.1 task J).",

	// ---- Validation errors --------------------------------------------------
	"error.fillUsername": "Enter a username.",
	"error.fillPassword": "Enter your password.",
	"error.repeatPassword": "Repeat your password.",
	"error.passwordsDiffer": "The passwords do not match.",
	"error.passwordTooShort": "The password must be at least 8 characters.",
	"error.passwordWeak":
		"Choose a stronger password — this one is on our list of weak passwords.",
	"error.wrongPassword": "Wrong password.",
	"error.noLibraryFound": "No library found. Create one first.",
	"error.libraryInOtherTab":
		"A library was created in another tab — reload the page and log in.",
	"error.noSpace": "Not enough space — free up storage and try again.",
	"error.unexpected": "Something went wrong. Please try again.",
	"error.fillArtist": "Enter an artist.",
	"error.fillTitle": "Enter a title.",
	"error.pickLocation": "Choose a location.",
	"error.pickGenre": "Choose at least one genre.",
	"error.storageNearFull":
		"Storage is nearly full. Delete some albums before adding more.",
	"error.imageTooLarge": "The image is too large. Maximum 2 MB.",
	"error.imageInvalid": "Invalid image file. Use JPEG, PNG or WebP.",
};

// See SEED_NO — seeded once at library creation, then owned by the user.
const SEED_EN = {
	genre: ["Rock", "Jazz", "Country", "Pop", "EDM", "Various genres"],
	location: ["Living room", "Attic", "Storage", "Shop"],
};
