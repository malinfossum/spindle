// Norwegian strings — the source language. Every key here must also exist in
// en.js; t() falls back to this table when a key is missing from another
// language, so a half-finished translation degrades to Norwegian rather than
// to a blank label.
//
// Values are developer-authored and may contain markup (see about.*), so t()
// output is inserted unescaped. User input never passes through t() — it comes
// in as a {param} and is escaped by the caller.
export const STRINGS_NO = {
	// ---- Chrome: navbar, footer, document ----------------------------------
	"nav.home": "Hjem",
	"nav.library": "Bibliotek",
	"nav.wishlist": "Ønskeliste",
	"nav.searchPlaceholder": "Søk i biblioteket",
	"nav.suggestions": "Forslag",
	"nav.search": "Søk",
	"nav.login": "Logg inn",
	"nav.logout": "Logg ut",
	"nav.profile": "Profil",
	"nav.themeToggle": "Bytt tema (mørkt eller lyst)",
	"nav.menuToggle": "Meny",
	"footer.copyright": "Spindle ©",

	// ---- Language switcher --------------------------------------------------
	"lang.group": "Språk",
	"lang.no": "NO",
	"lang.en": "EN",
	"lang.noFull": "Norsk",
	"lang.enFull": "Engelsk",

	// ---- Welcome ------------------------------------------------------------
	"welcome.tagline": "Ditt fysiske musikkbibliotek — trygt lagret på din egen enhet.",
	"welcome.createLibrary": "Opprett bibliotek",
	"welcome.login": "Logg inn",
	"welcome.about": "Om Spindle",
	"welcome.credit": "Bygget av Malin Fossum.",
	"welcome.backup": "Sikkerhetskopi",

	// ---- About --------------------------------------------------------------
	"about.back": "← Tilbake",
	"about.title": "Om Spindle",
	"about.lead":
		"Spindle er et bibliotek for fysisk musikk: CD-er, LP-er og kassetter. Biblioteket ditt opprettes i denne nettleseren og blir værende der, låst med et passord bare du kjenner.",
	"about.originsTitle": "Opphav",
	"about.originsBody":
		"Spindle begynte som en lagoppgave på GET Academy. Det er bygget om her som et åpent prosjekt for allmenn bruk.",
	"about.privacyTitle": "Personvern",
	"about.privacyBody":
		"Ingen server, ingen sporing, ingen tredjeparter. Biblioteket ditt krypteres i ro med en nøkkel utledet fra passordet ditt (PBKDF2 + HKDF). Uten passordet kan dataen ikke leses — det finnes ingen passordgjenoppretting, så eksporter jevnlig.",
	"about.a11yTitle": "Tilgjengelighet",
	"about.a11yBody":
		"Spindle bygges tastatur- og skjermleservennlig: semantisk HTML, synlig fokus, tilstrekkelig kontrast, og respekt for «redusert bevegelse».",
	"about.licenseTitle": "Lisens og kildekode",
	"about.licenseBody":
		'Apache-2.0. Copyright 2026 Malin Fossum. <a class="about-link" href="https://github.com/malinfossum/spindle" target="_blank" rel="noopener noreferrer">Se kildekoden på GitHub</a>.',

	// ---- Auth ---------------------------------------------------------------
	"auth.createTitle": "Opprett bibliotek",
	"auth.unlockTitle": "Lås opp",
	"auth.username": "Brukernavn",
	"auth.usernamePlaceholder": "Velg brukernavn",
	"auth.password": "Passord",
	"auth.repeatPassword": "Gjenta passord",
	"auth.creating": "Oppretter…",
	"auth.create": "Opprett",
	"auth.verifying": "Bekrefter…",
	"auth.login": "Logg inn",
	"auth.haveLibrary": "Har du allerede et bibliotek?",
	"auth.noLibrary": "Ingen bibliotek?",
	"auth.backToStart": "← Tilbake til start",
	"auth.passwordHint":
		"Minst 8 tegn. Husk passordet — biblioteket kan ikke gjenopprettes uten det.",
	"auth.strength": "Passordstyrke: {level} av {max}",

	// ---- Add / edit album ---------------------------------------------------
	"music.addTitle": "Legg til album",
	"music.editTitle": "Rediger album",
	"music.addAlbum": "+ Legg til album",
	"music.changeCover": "Endre coverbilde",
	"music.chooseCover": "Velg bilde",
	"music.coverWorking": "Behandler bildet…",
	"music.coverAlt": "Cover",
	"music.artist": "Artist",
	"music.artistPlaceholder": "Artistnavn",
	"music.titleLabel": "Album / Singel / EP",
	"music.titlePlaceholder": "Tittel",
	"music.location": "Lokasjon",
	"music.newLocation": "Ny lokasjon?",
	"music.removeLocation": "Fjern lokasjon?",
	"music.addLocationToggle": "Legg til lokasjon",
	"music.removeLocationToggle": "Fjern lokasjon",
	"music.year": "Årstall",
	"music.yearPlaceholder": "f.eks. 1997",
	"music.genre": "Sjanger",
	"music.newGenre": "Ny sjanger?",
	"music.removeGenre": "Fjern sjanger?",
	"music.addGenreToggle": "Legg til sjanger",
	"music.removeGenreToggle": "Fjern sjanger",
	"music.confirmOption": "Bekreft",
	"music.notes": "Notater",
	"music.notesPlaceholder": "Egne notater om albumet…",
	"music.wishlist": "Ønskeliste",
	"music.save": "Lagre",
	"music.delete": "Slett",
	"music.cancel": "Avbryt",
	"music.edit": "Rediger",
	"music.view": "Se",
	"music.back": "← Tilbake",
	"music.notFound": "Album ikke funnet.",

	// ---- Library / wishlist / search ----------------------------------------
	"library.title": "Bibliotek",
	"library.titleCount": "Bibliotek ({count})",
	"library.empty": "Ingen album ennå. Legg til ditt første!",
	"library.noMatches": "Ingen album passer filtrene.",
	"library.any": "Alle",
	"library.sortBy": "Sorter",
	"library.sort.recent": "Nylig lagt til",
	"library.sort.artist": "Artist (A–Å)",
	"library.sort.title": "Tittel (A–Å)",
	"library.sort.year": "Årstall (nyest)",
	"library.clearFilters": "Nullstill filtre",
	"library.filteredBy": "Filtrert på «{query}»",
	"library.clearQuery": "Fjern søket",
	"home.add": "Legg til album",
	"home.recent": "Nylig lagt til",
	"home.seeAll": "Se alle ({count})",
	"wishlist.title": "Ønskeliste",
	"wishlist.titleCount": "Ønskeliste ({count})",
	"wishlist.empty": "Ønskelisten er tom. Kryss av «Ønskeliste» på et album for å legge det til.",
	"search.noResults": 'Ingen treff for "{query}"',
	"search.count": 'Søkt: "{query}" — {count} treff',
	"search.countOne": 'Søkt: "{query}" — 1 treff',

	// ---- Profile ------------------------------------------------------------
	"profile.title": "{username} sin profil",
	"profile.myAlbums": "Mine album: {count}",
	"profile.storage": "Lagring",
	"profile.storageStats": "{used} av {total} brukt ({percent}%)",
	"profile.loginRequired": "Du må være logget inn for å se profilen.",
	"profile.noAlbums": "Du har ikke lagt til noen album ennå.",
	"profile.settings": "Innstillinger",
	"profile.language": "Språk",
	"profile.logout": "Logg ut",
	"profile.logoutBtn": "Logg ut",
	"profile.logoutHint":
		"Låser biblioteket i denne nettleseren. Du trenger passordet for å åpne det igjen.",

	// ---- Confirm dialogs ----------------------------------------------------
	"dialog.cancel": "Avbryt",
	"dialog.delete": "Slett",
	"dialog.deleteAlbumTitle": "Slette album?",
	"dialog.deleteAlbumBody": "Vil du slette «{title}» fra biblioteket?",
	"dialog.deleteLocationTitle": "Slette lokasjon?",
	"dialog.deleteLocationBody": "Vil du slette «{name}» fra lokasjonslisten?",
	"dialog.deleteGenreTitle": "Slette sjanger?",
	"dialog.deleteGenreBody": "Vil du slette «{name}» fra sjangerlisten?",
	"dialog.logoutTitle": "Logge ut?",
	"dialog.logoutBody":
		"Biblioteket låses, og du trenger passordet for å åpne det igjen. Alt du har lagret blir liggende kryptert i denne nettleseren.",
	"dialog.logoutConfirm": "Logg ut",

	// ---- Storage banners ----------------------------------------------------
	"storage.unavailable":
		"Nettleseren har deaktivert lagring for dette nettstedet. Endringer blir ikke lagret. Aktiver lagring i nettleserinnstillingene og last inn på nytt.",
	"storage.quotaExceeded":
		"Lagringen er full. Eksporter biblioteket ditt, og slett deretter gamle coverbilder eller album.",
	"storage.warn": "Lagringen er {percent}% full. Vurder å slette eller eksportere snart.",
	"storage.saveFailed":
		"Endringen din kunne ikke lagres. Eksporter dataen din snart for å unngå å miste den.",
	"storage.needsHttps":
		"Spindle krever HTTPS eller Live Server for kryptering. Åpne via VS Code Live Server, ikke direkte fra fil-systemet.",
	"storage.corrupt":
		"Lagret bibliotek er skadet — gjenopprett fra en sikkerhetskopi, eller opprett et nytt bibliotek.",
	"storage.otherTab":
		"Biblioteket ble endret i en annen fane. Endringene dine lagres ikke lenger her — last inn siden på nytt for å fortsette.",
	"storage.tooNew":
		"Det lagrede biblioteket ble laget av en nyere versjon av Spindle. Oppdater til nyeste versjon før du fortsetter.",

	// ---- Unknown route ------------------------------------------------------
	"notFound.title": "Fant ikke siden",
	"notFound.body":
		"Siden du prøvde å åpne finnes ikke. Den kan ha blitt fjernet, eller lenken kan være feil.",
	"notFound.backLibrary": "Til biblioteket",
	"notFound.backWelcome": "Til startsiden",

	// ---- Backup: export / import --------------------------------------------
	"backup.title": "Sikkerhetskopi",
	"backup.export": "Kryptert kopi",
	"backup.exportBtn": "Eksporter",
	"backup.exportHint":
		"Lagrer biblioteket som en kryptert fil. Den åpnes bare med passordet den ble laget med.",
	"backup.import": "Gjenopprett",
	"backup.importBtn": "Velg fil",
	"backup.importHint":
		"Velg en fil du har eksportert tidligere. Den erstatter biblioteket i denne nettleseren, og du logger inn på nytt med passordet filen ble laget med.",
	"backup.plaintext": "Lesbar kopi",
	"backup.plaintextBtn": "Eksporter ukryptert",
	"backup.plaintextHint":
		"Ukryptert fil. Alle som åpner den, kan lese hele biblioteket. Den kan ikke gjenopprettes — bruk den krypterte kopien til det.",
	"backup.plaintextTitle": "Eksportere uten kryptering?",
	"backup.plaintextBody":
		"Filen lagres i klartekst. Alle som får tak i den, kan lese hele biblioteket ditt uten passord.",
	"backup.plaintextConfirm": "Eksporter likevel",
	"backup.importTitle": "Erstatte biblioteket?",
	"backup.importBody":
		"Alt som ligger i denne nettleseren blir overskrevet av innholdet i filen. Dette kan ikke angres.",
	"backup.importConfirm": "Erstatt",
	"backup.exportDone": "Sikkerhetskopien er lastet ned.",
	"backup.plaintextDone": "Den ukrypterte filen er lastet ned. Oppbevar den trygt.",
	"backup.importDone":
		"Biblioteket er gjenopprettet. Logg inn med passordet som hørte til sikkerhetskopien.",
	"backup.errNoLibrary": "Det finnes ikke noe bibliotek å eksportere ennå.",
	"backup.errCorrupt": "Det lagrede biblioteket er skadet og kan ikke eksporteres.",
	"backup.errLocked": "Du må være logget inn for å eksportere en lesbar kopi.",
	"backup.errNotJson": "Filen er ikke en gyldig JSON-fil.",
	"backup.errNotBackup": "Filen er ikke en Spindle-sikkerhetskopi.",
	"backup.errTooNew": "Filen ble laget av en nyere versjon av Spindle. Oppdater først.",
	"backup.errPlaintext":
		"Dette er en lesbar kopi. Bare krypterte sikkerhetskopier kan gjenopprettes.",
	"backup.errTooLarge": "Filen er for stor til å være en sikkerhetskopi.",
	"backup.errReadFailed": "Filen kunne ikke leses.",
	"backup.errWriteFailed": "Sikkerhetskopien kunne ikke lagres i nettleseren.",

	// ---- Validation errors --------------------------------------------------
	// Stored as keys on model.viewState.*.errors and resolved at render time, so
	// a visible error follows a mid-form language switch instead of freezing.
	"error.fillUsername": "Fyll inn brukernavn.",
	"error.fillPassword": "Fyll inn passord.",
	"error.repeatPassword": "Gjenta passordet.",
	"error.passwordsDiffer": "Passordene er ikke like.",
	"error.passwordTooShort": "Passordet må være minst 8 tegn.",
	"error.passwordWeak": "Velg et sterkere passord — dette er på vår liste over svake passord.",
	"error.wrongPassword": "Feil passord.",
	"error.noLibraryFound": "Ingen bibliotek funnet. Opprett ett først.",
	"error.libraryInOtherTab":
		"Et bibliotek ble opprettet i en annen fane — last inn siden på nytt og logg inn.",
	"error.noSpace": "Ikke nok plass — frigjør lagring og prøv igjen.",
	"error.unexpected": "En uventet feil oppsto. Prøv igjen.",
	"error.fillArtist": "Fyll inn artist.",
	"error.fillTitle": "Fyll inn tittel.",
	"error.pickLocation": "Velg en lokasjon.",
	"error.pickGenre": "Velg minst én sjanger.",
	"error.storageNearFull": "Lagringen er nesten full. Slett noen album før du legger til flere.",
	"error.imageTooLarge": "Bildet er for stort. Maks 12 MB.",
	"error.imageInvalid": "Ugyldig bildefil. Bruk JPEG, PNG eller WebP.",
	"error.imageStoreFailed": "Coverbildet kunne ikke lagres. Prøv igjen, eller lagre uten bilde.",
};

// Starter genres and locations written into a brand-new library. Seeded once in
// whichever language is active at creation time and then owned by the user —
// switching the UI language later must never rewrite their data.
export const SEED_NO = {
	genre: ["Rock", "Jazz", "Country", "Pop", "EDM", "Diverse sjangere"],
	location: ["Stue", "Loft", "Boden", "Butikk"],
};
