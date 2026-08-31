// Derived reads over model state (v0.2).
//
// These five lived in the Controller until the module conversion made the
// dependency visible: five View files were importing from Controller/Login and
// Controller/Search just to ask the state a question. None of them is behaviour
// — they touch no DOM, start no timers, fire no events and change nothing. They
// only read model.data, model.app and model.viewState and derive an answer,
// which makes them Model, and a view may read them without pointing an import
// the wrong way. Two of them read viewState: getSearchResults() takes the query
// from it, and hasSelectedAlbum() asks whether the selection it holds is live.

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

// Title, artist and genre names. Location is deliberately not searched: it is a
// filter on the library page, and a query that quietly also matched "Loft"
// would make the filter and the search fight over the same word.
function matchesQuery(album, query) {
	return (
		album.title.toLowerCase().includes(query) ||
		album.artist.toLowerCase().includes(query) ||
		album.genre
			.map((i) => model.data.genre[i])
			.join(" ")
			.toLowerCase()
			.includes(query)
	);
}

// The sort orders the library offers, in the order they are listed. Exported so
// the view builds its <select> from this rather than from a second list that
// could fall out of step; each key has a library.sort.<key> string.
export const SORT_ORDERS = ["recent", "artist", "title", "year"];

// Norwegian collation for the alphabetical sorts: æ, ø and å belong at the end
// of the alphabet, and the default locale would scatter them among a, o and aa.
// The data is Norwegian-first even when the interface is in English.
const COLLATOR = new Intl.Collator("nb", { sensitivity: "base" });

function sortAlbums(albums, sort) {
	const sorted = [...albums];

	if (sort === "artist") {
		return sorted.sort(
			(a, b) => COLLATOR.compare(a.artist, b.artist) || COLLATOR.compare(a.title, b.title),
		);
	}
	if (sort === "title") {
		return sorted.sort((a, b) => COLLATOR.compare(a.title, b.title));
	}
	if (sort === "year") {
		// Albums with no year go last rather than being treated as year zero.
		return sorted.sort((a, b) => (b.releaseYear ?? -Infinity) - (a.releaseYear ?? -Infinity));
	}

	// "recent": no album carries a timestamp, and the id cannot stand in for one —
	// rng() in editMusic.js hands out a random number, not a counter. What does
	// record the order is the array itself: a new album is pushed onto the end and
	// an edit replaces it in place, so position in model.data.musicInfo is
	// insertion order. When an album does gain a date, this is the line to change.
	const added = new Map(model.data.musicInfo.map((album, i) => [album.id, i]));
	return sorted.sort((a, b) => added.get(b.id) - added.get(a.id));
}

// Everything the library page shows: the accessible albums, narrowed by the
// wishlist preset, the two filters and the navbar query, then sorted.
export function getLibraryAlbums() {
	const { preset, genre, location, sort } = model.viewState.library;
	const query = (model.viewState.searchBar || "").toLowerCase().trim();

	let albums = getAccessibleAlbums();

	if (preset === "wishlist") albums = albums.filter((album) => album.wishlist);
	if (genre !== "") albums = albums.filter((album) => album.genre.includes(Number(genre)));
	if (location !== "")
		albums = albums.filter((album) => album.location.includes(Number(location)));
	if (query) albums = albums.filter((album) => matchesQuery(album, query));

	return sortAlbums(albums, sort);
}

// The slice Home shows: newest first, and few enough to stay one screen.
const RECENT_LIMIT = 6;

export function getRecentAlbums() {
	return sortAlbums(getAccessibleAlbums(), "recent").slice(0, RECENT_LIMIT);
}

// What the search box offers while someone types. Title and artist only — the
// two things a person is actually reaching for — and capped, because the list
// is a shortcut, not a second results page. getSearchResults() stays the
// authority for the results page itself; this one exists to be short.
const SUGGESTION_LIMIT = 8;

export function getSearchSuggestions() {
	const query = (model.viewState.searchBar || "").toLowerCase().trim();
	if (!query) return [];

	return getAccessibleAlbums()
		.filter(
			(album) =>
				album.title.toLowerCase().includes(query) ||
				album.artist.toLowerCase().includes(query),
		)
		.slice(0, SUGGESTION_LIMIT);
}

// True when viewState holds an album the two detail pages can actually render.
// They read the current selection rather than an id from the URL, so the router
// asks this before routing to one: a cold deep link, or a selection left
// pointing at an album that has since been deleted, has nothing to show.
export function hasSelectedAlbum() {
	const id = model.viewState.musicInfo.id;
	return id !== null && getAccessibleAlbums().some((album) => album.id === id);
}
