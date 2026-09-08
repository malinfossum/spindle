// The transient half of the view state, and how to clear it (v0.2).
//
// Auth messages, backup messages and per-field validation errors are all true
// of one visit to one page, never of the library itself. They were written from
// three different Controller files, which is why View/Universal/updateView.js
// ended up importing from the Controller: navigation has to wipe all four, and
// the only way to ask for that was to import all four.
//
// Every one of these is a plain write to model.viewState or model.app. None of
// them reads or touches the DOM, so none of them was ever Controller work.

import { model } from "./model.js";

export function clearAuthMessage() {
	model.app.authMessage = "";
}

export function setAuthMessage(message) {
	model.app.authMessage = message;
}

function clearBackupMessage() {
	model.app.backupMessage = { key: "", tone: "info" };
}

// Wipes every per-field error on both auth forms. Called on navigation so a
// validation error from one visit never lingers into the next.
function resetAuthFieldErrors() {
	model.viewState.login.errors = { password: "" };
	model.viewState.createProfile.errors = {
		username: "",
		password: "",
		repeatPassword: "",
	};
}

// Wipes the add/edit form's field errors. Called on navigation so a
// validation error from one visit never lingers into the next — the music-form
// counterpart to resetAuthFieldErrors.
function resetMusicFieldErrors() {
	model.viewState.musicForm.errors = {
		coverImg: "",
		artist: "",
		title: "",
		location: "",
		genre: "",
		form: "",
	};
}

// Closes the add/edit form's four chip panels. Transient in the same way the
// field errors are: a panel opened on one visit must not still be open on the
// next, which is exactly why these flags did not belong on model.app.
function resetMusicPanels() {
	model.viewState.musicForm.panels = {
		locationAdd: false,
		locationRemove: false,
		genreAdd: false,
		genreRemove: false,
	};
}

// How many past searches the dropdown offers. Short on purpose: it is a way
// back to the search made a minute ago, not a log of the session.
const SEARCH_HISTORY_LIMIT = 6;

// Remembers a search. The same query typed twice moves back to the top rather
// than appearing twice, matched without case so "Bowie" and "bowie" are one
// entry — the second spelling wins, because it is the one just typed.
export function recordSearch(query) {
	const trimmed = query.trim();
	if (trimmed === "") return;

	const rest = model.viewState.searchHistory.filter(
		(entry) => entry.toLowerCase() !== trimmed.toLowerCase(),
	);

	model.viewState.searchHistory = [trimmed, ...rest].slice(0, SEARCH_HISTORY_LIMIT);
}

// Logging out has to take the history with it: the queries name artists and
// titles, which is library content, and locked means locked for those too.
export function clearSearchHistory() {
	model.viewState.searchHistory = [];
}

// Closes the search suggestions. A list left open across a navigation would
// hang over the page someone just moved to.
function closeSuggestions() {
	model.viewState.suggest = { open: false, index: -1 };
}

// Everything a page change has to forget, in the order changePage() used to
// call the four by hand. Navigation asks for this one function instead of
// naming each write, which is what lets the router stay out of login.js,
// backup.js and editMusic.js.
export function resetTransientViewState() {
	clearAuthMessage();
	clearBackupMessage();
	resetAuthFieldErrors();
	resetMusicFieldErrors();
	resetMusicPanels();
	closeSuggestions();
}
