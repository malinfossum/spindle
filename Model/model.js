export const model = {
	app: {
		app: document.getElementById("app"),
		allPages: [
			"welcome",
			"homePage",
			"library",
			"wishList",
			"viewDetails",
			"addDetails",
			"editDetails",
			"profile",
			"login",
			"register",
			"about",
			"notFound",
		],

		// The pages a locked library is allowed to open. navigate() turns every
		// other page away, and syncChrome() derives from this same list which pages
		// render without the navbar and footer — with one deliberate exception,
		// notFound, that syncChrome() documents where it filters it out.
		publicPages: ["welcome", "login", "register", "about", "notFound"],

		currentPage: "welcome",
		mobileMenuToggle: false,

		authBusy: false,
		// In-memory only — NEVER persisted to localStorage.
		crypto: {
			unlocked: false,
			encryptKey: null,
			verifyKey: null,
			kdfSaltB64: null,
			verifyHmacB64: null,
		},

		authMessage: "",

		// Result of the last export / import, shown in the backup block on the
		// profile and welcome pages. A string key plus a tone, resolved by t() at
		// render time like every other message on the model.
		backupMessage: { key: "", tone: "info" },

		// Set when another tab re-encrypted the library: this tab is holding a
		// stale copy, so it stops saving rather than overwrite the other tab.
		libraryStale: false,

		storageUnavailable: false,
		storageQuotaExceeded: false,
		storageError: "",
		storage: null,
	},

	viewState: {
		editMusicInfo: {
			genre: "",
			location: "",
		},

		musicInfo: {
			id: null,
			title: "",
			artist: "",
			location: [],
			releaseYear: null,
			genre: [],
			notes: "",
			wishlist: false,
			// The cover itself lives in IndexedDB (Model/covers.js); the album
			// carries the row's id and nothing else.
			coverId: null,
		},

		// Add/edit-form validation errors. Kept OFF musicInfo on purpose: musicInfo
		// is spread into the saved album ({ ...musicInfo }), so errors living there
		// would be persisted as album data.
		musicForm: {
			errors: {
				coverImg: "",
				artist: "",
				title: "",
				location: "",
				genre: "",
				form: "",
			},

			// The four chip panels behind each group's add and remove buttons. True
			// means open, which is what the name says: these were show*Input flags
			// that meant the opposite, defaulted to true, and rendered as
			// visibility: hidden, which hides a box but keeps its height. That is
			// where the form's four tall empty bands came from.
			// True while a picked image is being decoded and re-encoded. A big photo
			// takes a moment, and the form would otherwise sit there looking as
			// though the click did nothing.
			coverBusy: false,

			// A cover chosen but not saved yet. Kept off musicInfo for the same
			// reason the errors are: musicInfo is spread into the saved album, and a
			// data URL on it would land straight back in the library JSON that this
			// whole change exists to keep small.
			coverPreview: null,

			panels: {
				locationAdd: false,
				locationRemove: false,
				genreAdd: false,
				genreRemove: false,
			},
		},

		login: {
			password: "",
			errors: { password: "" },
		},

		createProfile: {
			username: "",
			password: "",
			repeatPassword: "",
			errors: { username: "", password: "", repeatPassword: "" },
		},

		searchBar: "",

		// The library view's filters and sort. Not cleared on navigation, unlike
		// everything in resetTransientViewState(): opening an album and coming back
		// must not throw away the filter someone set to find it. The query itself
		// lives on searchBar, since the navbar owns that field.
		library: {
			preset: "all",
			genre: "",
			location: "",
			sort: "recent",
		},

		// The search box's suggestion list. Transient in the same way the chip
		// panels are: open is whether the list is showing, index is the option the
		// arrow keys have moved to (-1 = none), and both are forgotten on
		// navigation.
		suggest: {
			open: false,
			index: -1,
		},

		// The welcome page rebuilds wholesale on every re-render, so the backup
		// panel would snap shut on a language switch if its open state lived in
		// the DOM. Anything that must survive a re-render belongs on the model.
		welcomeBackupOpen: false,
	},

	data: {
		genre: ["Rock", "Jazz", "Country", "Pop", "EDM", "Diverse Sjangere"],
		location: ["Stue", "Loft", "Boden", "Butikk"],

		musicInfo: [],

		user: {
			username: "",
		},
	},
};
