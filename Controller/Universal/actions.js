// Every action the UI can trigger, in one map (v0.2).
//
// This is the half of the data-action migration that belongs to the Controller:
// the View names an action, this decides what it does. Handlers get
// (event, target) from bindActions, where target is the element carrying the
// attribute — so `this.value` in the old inline handlers becomes `target.value`.
//
// Arguments travel as data-* attributes next to the action name. They are
// written by our own render functions, never by the user, and the two that
// reach further into the app are validated where they land anyway:
// navigate() checks against model.app.allPages, setLang() against LANGUAGES.

// The add/edit form's four chip panels. A lookup rather than reading the model
// key straight out of the attribute, so markup can only reach these four flags.

import { getLang, setLang } from "../../Model/i18n/i18n.js";
import { ALBUM_FORMATS, model } from "../../Model/model.js";
import { getSuggestionList } from "../../Model/selectors.js";
import { recordSearch } from "../../Model/viewState.js";
import { renderStrength } from "../../View/Register/view.js";
import { bindActions } from "../../View/Universal/bindActions.js";
import { applyLang } from "../../View/Universal/chrome.js";
import { renderSuggestions, syncSearchInputs } from "../../View/Universal/searchSuggest.js";
import { updateView } from "../../View/Universal/updateView.js";
import {
	clearMusicGroupError,
	focusPanelToggle,
	newGenre,
	newLocation,
	removeGenre,
	removeLocation,
	saveImage,
	submitChanges,
	toggleGenreCheckbox,
	toggleLocationCheckbox,
} from "../Edit_Music_Details/editMusic.js";
import {
	clearFieldError,
	confirmLogout,
	handleLoginNavClick,
	handleProfileNavClick,
	login,
} from "../Login/login.js";
import { editAlbum } from "../Music_Details/editBtn.js";
import { register } from "../Register/register.js";
import { exportEncryptedBackup, exportPlaintextBackup, importBackupFile } from "./backup.js";
import { deleteAlbum } from "./delete.js";
import { toggleMobileMenu } from "./navbarMobile.js";
import { navigate } from "./router.js";
import { toggleWishlist } from "./save.js";
import { toggleTheme } from "./theme.js";
import { viewMusicDetails } from "./viewMusicDetails.js";

const FORM_PANELS = {
	"location-add": "locationAdd",
	"location-remove": "locationRemove",
	"genre-add": "genreAdd",
	"genre-remove": "genreRemove",
};

// Set one library filter or the sort, re-render, and put focus back on the
// control that was used. Without the last step the change would drop focus to
// <body> — updateView() replaces #app and every <select> in it.
function setLibraryFilter(key, value) {
	model.viewState.library[key] = value;
	updateView();
	focusLibraryControl(`library-${key}`);
}

// Re-runs a search from the history: the query goes back in the field, moves
// to the top of the history, and lands on the results page — the same three
// things submitting the form does.
function runSearch(query) {
	model.viewState.searchBar = query;
	recordSearch(query);
	model.viewState.suggest = { open: false, index: -1 };
	model.viewState.library.preset = "all";
	syncSearchInputs();
	navigate("library");
}

function focusLibraryControl(action) {
	const control = model.app.app.querySelector(
		`[data-action-change="${action}"], [data-action="${action}"]`,
	);
	if (control) control.focus();
}

const ACTIONS = {
	// --- Navigation and chrome -------------------------------------------
	nav: (_event, target) => navigate(target.dataset.page),

	// Library and Wishlist are the same page under two fragments; the router
	// reads the preset off the name. What this adds over plain nav is dropping
	// the query still sitting in the search box — a nav click means "show me this
	// list", not "show me the last thing I searched for inside it".
	"nav-list": (_event, target) => {
		model.viewState.searchBar = "";
		navigate(target.dataset.page);
	},
	"nav-login": () => handleLoginNavClick(),
	"nav-profile": () => handleProfileNavClick(),
	logout: () => confirmLogout(),
	"toggle-menu": () => toggleMobileMenu(),
	"toggle-theme": () => toggleTheme(),
	// setLang() only writes the preference. Applying it to the document and asking
	// for the re-render are the Controller's job, not the Model's — including
	// deciding not to. Activating the option that is already selected must not
	// re-render: the switcher is inside #app, so the button the user just pressed
	// would be destroyed and focus would drop to <body> with nothing to announce.
	"set-lang": (_event, target) => {
		if (target.dataset.lang === getLang()) return;
		setLang(target.dataset.lang);
		applyLang();
		updateView();
	},

	// The search box lives in the static navbar, outside the #app element
	// updateView() replaces — so a re-render here cannot drop its focus, and the
	// results page can filter as you type. The suggestion list is patched
	// directly either way, because it has to keep up with every keystroke.
	"search-query": (_event, target) => {
		model.viewState.searchBar = target.value;
		// Open unconditionally: with a query the list offers albums, and without
		// one it offers the searches already made. renderSuggestions() is what
		// decides whether either has anything in it.
		model.viewState.suggest = { open: true, index: -1 };

		if (model.app.currentPage === "library" || model.app.currentPage === "wishList") {
			updateView();
			return;
		}
		renderSuggestions();
	},

	// Focusing the empty field is how the past searches are reached, so the list
	// opens on focus and not only on a keystroke.
	"search-focus": () => {
		model.viewState.suggest = { open: true, index: -1 };
		renderSuggestions();
	},

	// Clicking away closes it. An option is a plain <li> and takes no focus, so
	// picking one does not come through here first; moving to the search button
	// inside the same form does, and must not shut the list before the click
	// lands.
	"search-blur": (event, target) => {
		if (target.form?.contains(event.relatedTarget)) return;
		model.viewState.suggest = { open: false, index: -1 };
		renderSuggestions();
	},

	// Enter in the field. The form does the work; this only decides where to go,
	// remembers the query, and closes the list behind it.
	"search-submit": (event) => {
		event.preventDefault();
		recordSearch(model.viewState.searchBar);
		model.viewState.suggest = { open: false, index: -1 };
		// Searching looks through everything, so it leaves the wishlist preset
		// behind rather than quietly searching inside it.
		model.viewState.library.preset = "all";
		navigate("library");
	},

	// Arrow keys move the active option, Enter opens it, Escape closes the list.
	// Focus never leaves the input — the active option is named through
	// aria-activedescendant — so typing carries on uninterrupted.
	"search-keys": (event) => {
		const state = model.viewState.suggest;
		const { kind, items } = getSuggestionList();
		const count = items.length;

		if (event.key === "Escape") {
			if (!state.open) return;
			model.viewState.suggest = { open: false, index: -1 };
			renderSuggestions();
			return;
		}

		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			if (!state.open || count === 0) return;
			event.preventDefault();
			// The ring is [-1, 0 .. count-1], where -1 is "nothing active" — so
			// arrowing up off the top lands back in the field, not on the last item.
			const next = state.index + (event.key === "ArrowDown" ? 1 : -1);
			state.index = next < -1 ? count - 1 : next >= count ? -1 : next;
			renderSuggestions();
			return;
		}

		if (event.key === "Enter" && state.open && state.index >= 0) {
			const chosen = items[state.index];
			if (!chosen) return;
			// Beat the form's submit, which would send us to the results page
			// instead of to whatever was chosen.
			event.preventDefault();

			if (kind === "history") {
				runSearch(chosen);
				return;
			}

			model.viewState.suggest = { open: false, index: -1 };
			viewMusicDetails(chosen.id);
		}
	},

	"suggest-pick": (_event, target) => {
		model.viewState.suggest = { open: false, index: -1 };
		viewMusicDetails(Number(target.dataset.id));
	},

	"history-pick": (_event, target) => runSearch(target.dataset.query),

	// --- Albums ------------------------------------------------------------
	"view-album": (_event, target) => viewMusicDetails(Number(target.dataset.id)),
	"edit-album": (_event, target) => editAlbum(Number(target.dataset.id)),
	"delete-album": (_event, target) => deleteAlbum(Number(target.dataset.id)),
	"toggle-wishlist": (_event, target) =>
		toggleWishlist(Number(target.dataset.id), target.checked),

	// --- Auth forms --------------------------------------------------------
	login: (event) => {
		event.preventDefault();
		login();
	},
	register: (event) => {
		event.preventDefault();
		register();
	},
	"login-password": (_event, target) => {
		model.viewState.login.password = target.value;
		clearFieldError(target, "login", "password");
	},
	"register-username": (_event, target) => {
		model.viewState.createProfile.username = target.value;
		clearFieldError(target, "createProfile", "username");
	},
	"register-password": (_event, target) => {
		model.viewState.createProfile.password = target.value;
		renderStrength(target.value, "password-strength-bar");
		clearFieldError(target, "createProfile", "password");
	},
	"register-repeat": (_event, target) => {
		model.viewState.createProfile.repeatPassword = target.value;
		clearFieldError(target, "createProfile", "repeatPassword");
	},

	// --- Add / edit music form ---------------------------------------------
	"music-save": (_event, target) => submitChanges(target.dataset.edit === "true"),
	"music-delete": () => deleteAlbum(model.viewState.musicInfo.id),
	"music-cover": (_event, target) => saveImage(target),

	"music-artist": (_event, target) => {
		model.viewState.musicInfo.artist = target.value;
		clearFieldError(target, "musicForm", "artist");
	},
	"music-title": (_event, target) => {
		model.viewState.musicInfo.title = target.value;
		clearFieldError(target, "musicForm", "title");
	},
	"music-year": (_event, target) => {
		model.viewState.musicInfo.releaseYear = parseInt(target.value, 10) || null;
	},
	"music-format": (_event, target) => {
		// The <select> only offers valid values, so this guard is for a tampered
		// DOM: an unknown value would be written to the record and later rendered
		// through t() as a raw key. Anything unrecognised means "not set".
		model.viewState.musicInfo.format = ALBUM_FORMATS.includes(target.value) ? target.value : "";
	},
	"music-notes": (_event, target) => {
		model.viewState.musicInfo.notes = target.value;
	},
	"music-wishlist": (_event, target) => {
		model.viewState.musicInfo.wishlist = target.checked;
	},

	"music-location": (_event, target) => {
		toggleLocationCheckbox(target, Number(target.dataset.index));
		clearMusicGroupError("location");
	},
	"music-genre": (_event, target) => {
		toggleGenreCheckbox(target, Number(target.dataset.index));
		clearMusicGroupError("genre");
	},

	"toggle-panel": (_event, target) => {
		const panel = FORM_PANELS[target.dataset.panel];
		if (!panel) return;
		const panels = model.viewState.musicForm.panels;
		panels[panel] = !panels[panel];

		const name = target.dataset.panel;
		updateView();
		focusPanelToggle(name);
	},

	// The five library controls all do the same three things, so they say which
	// key they set and share the rest. Re-rendering is what makes the filter
	// visible, and refocusing is what stops it costing the keyboard its place —
	// updateView() replaces #app, so the control that was just used stops
	// existing, the same way the chip-panel toggles do.
	"library-genre": (_event, target) => setLibraryFilter("genre", target.value),
	"library-location": (_event, target) => setLibraryFilter("location", target.value),
	"library-format": (_event, target) => setLibraryFilter("format", target.value),
	"library-decade": (_event, target) => setLibraryFilter("decade", target.value),
	"library-sort": (_event, target) => setLibraryFilter("sort", target.value),

	// Mobile only: the control row collapses behind this, and CSS drops the
	// button from the tablet breakpoint up.
	"library-filters-toggle": () => {
		model.viewState.library.filtersOpen = !model.viewState.library.filtersOpen;
		updateView();
		focusLibraryControl("library-filters-toggle");
	},

	"library-clear": () => {
		Object.assign(model.viewState.library, {
			genre: "",
			location: "",
			format: "",
			decade: "",
		});
		updateView();
		// The button clears itself off the page, so there is nothing to go back
		// to; the toggle above it is the nearest thing still standing.
		focusLibraryControl("library-filters-toggle");
	},
	"library-clear-query": () => {
		model.viewState.searchBar = "";
		updateView();
	},

	"chip-location": (_event, target) => {
		model.viewState.editMusicInfo.location = target.value;
	},
	"chip-genre": (_event, target) => {
		model.viewState.editMusicInfo.genre = target.value;
	},

	// These four preventDefault inside themselves — they already took the event.
	"new-location": (event) => newLocation(event),
	"remove-location": (event) => removeLocation(event),
	"new-genre": (event) => newGenre(event),
	"remove-genre": (event) => removeGenre(event),

	// --- Backup ------------------------------------------------------------
	"export-encrypted": () => exportEncryptedBackup(),
	"export-plaintext": () => exportPlaintextBackup(),
	"import-backup": (_event, target) => importBackupFile(target),

	"welcome-backup-toggle": (_event, target) => {
		model.viewState.welcomeBackupOpen = target.open;
	},
};

// Called once from the boot script in index.html. Binding to the document
// covers the static navbar, the rendered #app, and the footer in one pass.
export function initActions() {
	bindActions(document, ACTIONS);
}
