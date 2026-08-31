export const model = {
	app: {
		app: document.getElementById("app"),
		allPages: [
			"welcome",
			"homePage",
			"searchPage",
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
			coverImg: null,
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
