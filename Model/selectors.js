// Derived reads over model state (v0.2).
//
// These five lived in the Controller until the module conversion made the
// dependency visible: five View files were importing from Controller/Login and
// Controller/Search just to ask the state a question. None of them is behaviour
// — they touch no DOM, start no timers, fire no events and change nothing. They
// only read model.data and model.app and derive an answer, which makes them
// Model, and a view may read them without pointing an import the wrong way.

import { model } from "./model.js";

export function getLoggedInUser() {
	return isLoggedIn() ? model.data.user : null;
}

export function isLoggedIn() {
	return model.app.crypto.unlocked === true;
}

export function getAccessibleAlbums() {
	if (!isLoggedIn()) return [];
	return model.data.musicInfo;
}

export function getProfileAlbums() {
	return getAccessibleAlbums();
}

export function getSearchResults() {
	const query = (model.viewState.searchBar || "").toLowerCase().trim();
	const all = getAccessibleAlbums();

	if (!query) return all;

	return all.filter(
		(album) =>
			album.title.toLowerCase().includes(query) ||
			album.artist.toLowerCase().includes(query) ||
			album.genre
				.map((i) => model.data.genre[i])
				.join(" ")
				.toLowerCase()
				.includes(query),
	);
}
