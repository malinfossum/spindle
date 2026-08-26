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

		// The pages a locked library is allowed to open. changePage() turns every
		// other page away, and syncChrome() decides from this same list which pages
		// render without the navbar and footer, so the two can never disagree about
		// what counts as public.
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

		showGenreInput: true,
		showLocationInput: true,

		showDeleteGenreInput: true,
		showDeleteLocationInput: true,

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

		musicInfo: [
			{
				id: 1,
				title: "Abbey Road",
				artist: "The Beatles",
				location: [0],
				releaseYear: 1969,
				genre: [0],
				notes: "Released in 1969, recorded at EMI Studios on London's Abbey Road.",
				wishlist: false,
				coverImg: null,
			},
			{
				id: 2,
				title: "The Dark Side of the Moon",
				artist: "Pink Floyd",
				location: [2],
				releaseYear: 1973,
				genre: [0],
				notes: "Concept album exploring conflict, greed, time, and mental illness.",
				wishlist: false,
				coverImg: null,
			},
			{
				id: 3,
				title: "The Rise and Fall of Ziggy Stardust and the Spiders from Mars",
				artist: "David Bowie",
				location: [0],
				releaseYear: 1972,
				genre: [0],
				notes: "Loose concept album about a fictional androgynous rock star.",
				wishlist: false,
				coverImg: null,
			},
			{
				id: 4,
				title: "Kind of Blue",
				artist: "Miles Davis",
				location: [1],
				releaseYear: 1959,
				genre: [1],
				notes: "Widely regarded as the best-selling jazz album of all time.",
				wishlist: false,
				coverImg: null,
			},
		],

		user: {
			username: "",
		},
	},
};
