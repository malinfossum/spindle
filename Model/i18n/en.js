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
	"auth.strength": "Password strength: {level} of {max}",

	// ---- Stay unlocked (v0.5) --------------------------------------------
	"login.stay": "Stay unlocked on this device",
	"login.stayHelp":
		"Keeps the library open after a reload or a switch to another app — until you log out. Anyone holding this device can open it meanwhile. The password is still never stored.",
	"login.stayFailed": "Logged in, but this device could not be kept unlocked.",
	"login.stayClearFailed":
		"Logged out, but the stored key could not be removed. Clear this site's data in your browser to be sure.",
	"login.sessionStale": "This device was unlocked, but the library has changed. Log in again.",

	// ---- Add / edit album ---------------------------------------------------
	"music.addTitle": "Add album",
	"music.editTitle": "Edit album",
	"music.addAlbum": "+ Add album",
	"music.changeCover": "Change cover image",
	"music.chooseCover": "Choose image",
	"music.coverWorking": "Processing image…",
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
	"music.format": "Format",
	// The empty option. Format is optional, so "not set" is a real answer and
	// needs its own words — a blank line in the list reads as a glitch.
	"music.formatUnset": "Not set",
	// ---- Barcode lookup (v0.4) --------------------------------------------
	"music.barcode": "Barcode",
	"music.barcodePlaceholder": "13 digits from the sleeve",
	"music.lookup": "Look up",
	"music.scan": "Scan barcode",
	"music.lookupNote":
		"Look-ups go to musicbrainz.org; a cover may be fetched from coverartarchive.org",
	"music.lookupWorking": "Looking up…",
	"music.lookupFilled": "Filled from MusicBrainz: {artist} – {title}",
	"music.barcodeOwned": "Already in your library: {artist} – {title}",

	"lookup.off":
		"Look-ups are off. Turn them on under Profile to fill in details from the barcode.",
	"lookup.coverAdded":
		"Cover added from the Cover Art Archive. Change it below if it is the wrong pressing.",
	"lookup.coverNone": "No cover in the archive for this album — add one below.",
	"lookup.coverBusy": "The cover archive is busy — try Look up again in a moment.",
	"lookup.coverFailed":
		"The cover could not be fetched. The details were filled in; add a cover below.",

	"music.pickMatch": "Which one is it?",
	"scanner.title": "Scan a barcode",
	"scanner.hint": "Hold the barcode inside the frame.",
	"scanner.close": "Close",
	"music.formatCd": "CD",
	"music.formatLp": "LP",
	"music.formatCassette": "Cassette",
	"music.formatOther": "Other",
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
	"library.noMatches": "No albums match these filters.",
	"library.any": "All",
	"library.sortBy": "Sort",
	"library.sort.recent": "Recently added",
	"library.sort.artist": "Artist (A-Z)",
	"library.sort.title": "Title (A-Z)",
	"library.sort.year": "Year (newest)",
	"library.decade": "Decade",
	// {decade} is the first year of the decade, e.g. 1990 -> "1990s".
	"library.decadeLabel": "{decade}s",
	"library.filters": "Filters",
	"library.clearFilters": "Clear filters",
	"library.filteredBy": "Filtered by “{query}”",
	"library.clearQuery": "Clear search",
	"home.add": "Add album",
	"home.recent": "Recently added",
	"home.seeAll": "See all ({count})",
	"wishlist.title": "Wishlist",
	"wishlist.titleCount": "Wishlist ({count})",
	"wishlist.empty": "Your wishlist is empty. Tick “Wishlist” on an album to add it.",
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
	"profile.logout": "Log out",
	"profile.logoutBtn": "Log out",
	"profile.logoutHint":
		"Locks the library in this browser. You need the password to open it again.",
	"profile.lookups": "Barcode look-ups",
	"profile.lookupsOff": "Off",
	"profile.lookupsOn":
		"On — sends the barcode to musicbrainz.org, covers from coverartarchive.org",

	"profile.lookupsUnset": "Not chosen yet",
	"profile.stay": "Stay unlocked on this device",
	"profile.stayHelp":
		"On: the library opens without the password after a reload, until you log out — anyone holding this device can open it. Log out is the lock.",
	"profile.stayOff": "Off",
	"profile.stayOn": "On — until I log out",
	"profile.stayFailed": "This device could not be kept unlocked.",
	"profile.stayClearFailed":
		"The stored key could not be removed. Log out and clear this site's data in your browser to be sure.",
	"profile.install": "Install Spindle",
	"profile.installBtn": "Install",
	"profile.installAccepted": "Spindle is installed — open it from your home screen.",
	"profile.installDismissed": "Not installed. The browser menu can still install it.",
	"profile.installIos": 'To install Spindle, tap Share, then "Add to Home Screen".',

	// ---- Confirm dialogs ----------------------------------------------------
	"dialog.cancel": "Cancel",
	"dialog.delete": "Delete",
	"dialog.deleteAlbumTitle": "Delete album?",
	"dialog.deleteAlbumBody": "Delete “{title}” from your library?",
	"dialog.deleteLocationTitle": "Delete location?",
	"dialog.deleteLocationBody": "Delete “{name}” from the location list?",
	"dialog.deleteGenreTitle": "Delete genre?",
	"dialog.deleteGenreBody": "Delete “{name}” from the genre list?",
	"dialog.logoutTitle": "Log out?",
	"dialog.logoutBody":
		"The library locks, and you need the password to open it again. Everything you have saved stays encrypted in this browser.",
	"dialog.logoutConfirm": "Log out",
	"dialog.lookupTitle": "Look up this barcode?",
	"dialog.lookupBody":
		"Spindle will send this barcode to musicbrainz.org to find the album, and fetch the cover of the album you pick from coverartarchive.org — nothing from your library, and never on its own. As with any web request, those sites see your IP address. You can turn look-ups off under Profile.",
	"dialog.lookupConfirm": "Look up",
	"dialog.lookupCancel": "Not now",

	"dialog.lookupsAskTitle": "Look up barcodes online?",
	"dialog.lookupsAskBody":
		"When you scan or type a barcode, Spindle can send it to musicbrainz.org to find the album and fetch its cover from coverartarchive.org — nothing from your library, and never on its own. As with any web request, those sites see your IP address. You can change this under Profile.",
	"dialog.lookupsAskConfirm": "Yes, look them up",
	"dialog.lookupsAskCancel": "No, keep it offline",

	// ---- Storage banners ----------------------------------------------------
	"storage.unavailable":
		"Your browser has disabled storage for this site. Changes will not be saved. Enable storage in your browser settings and reload.",
	"storage.quotaExceeded":
		"Storage is full. Export your library, then delete old cover images or albums.",
	"storage.warn": "Storage is {percent}% full. Consider deleting or exporting soon.",
	"storage.saveFailed":
		"Your change could not be saved. Export your data soon so you don't lose it.",
	"storage.needsHttps":
		"Spindle needs HTTPS or Live Server for encryption. Open it through VS Code Live Server, not straight from the file system.",
	"storage.corrupt":
		"The stored library is damaged — restore from a backup, or create a new library.",
	"storage.otherTab":
		"The library was changed in another tab. Your changes are no longer saved here — reload the page to continue.",
	"storage.tooNew":
		"The stored library was created by a newer version of Spindle. Update to the latest version before continuing.",

	// ---- Unknown route ------------------------------------------------------
	"notFound.title": "Page not found",
	"notFound.body":
		"The page you tried to open does not exist. It may have been removed, or the link may be wrong.",
	"notFound.backLibrary": "Back to your library",
	"notFound.backWelcome": "Back to the start page",

	// ---- Backup: export / import --------------------------------------------
	"backup.title": "Backup",
	"backup.export": "Encrypted copy",
	"backup.exportBtn": "Export",
	"backup.exportHint":
		"Saves your library as an encrypted file. It only opens with the password it was created with.",
	"backup.import": "Restore",
	"backup.importBtn": "Choose file",
	"backup.importHint":
		"Choose a file you exported earlier. It replaces the library in this browser, and you log in again with the password that file was created with.",
	"backup.plaintext": "Readable copy",
	"backup.plaintextBtn": "Export unencrypted",
	"backup.plaintextHint":
		"An unencrypted file. Anyone who opens it can read your whole library. It cannot be restored — use the encrypted copy for that.",
	"backup.plaintextTitle": "Export without encryption?",
	"backup.plaintextBody":
		"The file is saved as plain text. Anyone who gets hold of it can read your entire library without a password.",
	"backup.plaintextConfirm": "Export anyway",
	"backup.importTitle": "Replace the library?",
	"backup.importBody":
		"Everything in this browser will be overwritten by the contents of the file. This cannot be undone.",
	"backup.importConfirm": "Replace",
	"backup.exportDone": "Your backup has been downloaded.",
	"backup.plaintextDone": "The unencrypted file has been downloaded. Keep it somewhere safe.",
	"backup.importDone": "Library restored. Log in with the password that belongs to that backup.",
	"backup.errNoLibrary": "There is no library to export yet.",
	"backup.errCorrupt": "The stored library is damaged and cannot be exported.",
	"backup.errLocked": "You have to be logged in to export a readable copy.",
	"backup.errNotJson": "That file is not valid JSON.",
	"backup.errNotBackup": "That file is not a Spindle backup.",
	"backup.errTooNew": "That file was created by a newer version of Spindle. Update first.",
	"backup.errPlaintext": "This is a readable copy. Only encrypted backups can be restored.",
	"backup.errTooLarge": "That file is too large to be a backup.",
	"backup.errReadFailed": "The file could not be read.",
	"backup.errWriteFailed": "The backup could not be saved in this browser.",

	// ---- Validation errors --------------------------------------------------
	"error.fillUsername": "Enter a username.",
	"error.fillPassword": "Enter your password.",
	"error.repeatPassword": "Repeat your password.",
	"error.passwordsDiffer": "The passwords do not match.",
	"error.passwordTooShort": "The password must be at least 8 characters.",
	"error.passwordWeak": "Choose a stronger password — this one is on our list of weak passwords.",
	"error.wrongPassword": "Wrong password.",
	"error.noLibraryFound": "No library found. Create one first.",
	"error.libraryInOtherTab": "A library was created in another tab — reload the page and log in.",
	"error.noSpace": "Not enough space — free up storage and try again.",
	"error.unexpected": "Something went wrong. Please try again.",
	"error.fillArtist": "Enter an artist.",
	"error.fillTitle": "Enter a title.",
	"error.pickLocation": "Choose a location.",
	"error.pickGenre": "Choose at least one genre.",
	// Shown instead of the two above when the list itself is empty. They name the
	// button rather than the ➕ glyph: it is an icon, and "Add location" is the
	// accessible name a screen reader will read out.
	"error.addLocationFirst": "No locations yet. Add one with the “Add location” button.",
	"error.addGenreFirst": "No genres yet. Add one with the “Add genre” button.",
	"error.storageNearFull": "Storage is nearly full. Delete some albums before adding more.",
	"error.imageTooLarge": "The image is too large. Maximum 12 MB.",
	"error.imageInvalid": "Invalid image file. Use JPEG, PNG or WebP.",
	"error.imageStoreFailed": "The cover image could not be saved. Try again, or save without one.",
	"error.barcodeInvalid": "A barcode is 8 to 14 digits.",
	"error.barcodeNoMatch": "No album found for that barcode.",
	"error.lookupBusy": "MusicBrainz is busy. Try again in a moment.",
	"error.lookupFailed": "The look-up failed. Check your connection and try again.",
	"error.cameraUnavailable": "The camera could not be opened.",
};
