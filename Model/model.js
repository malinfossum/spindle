const model = {
	app: {
		app: document.getElementById("app"),
		allPages: [
			"homePage",
			"searchPage",
			"wishList",
			"viewDetails",
			"addDetails",
			"editDetails",
			"profile",
			"login",
			"register",
		],

		currentPage: "login",
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

		deleteConfirmation: false,
		authMessage: "",

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

		login: {
			password: "",
		},

		createProfile: {
			username: "",
			password: "",
			repeatPassword: "",
		},

		searchBar: "",
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
