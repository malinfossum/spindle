// The library — one list view with three ways in.
//
// Home, Search and Wishlist each used to render the same album cards under a
// different heading, which is three copies of one page. This is that page: the
// full list, plus the query from the navbar, a genre and location filter, and a
// sort. Wishlist is the same view with one filter pre-set, and searching lands
// here with the query filled in.
//
// The query deliberately has no field of its own. The navbar's search box is on
// every page, so a second input would be a second place to type the same thing;
// what this page adds is a visible, clearable statement of what is being
// filtered out.

import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { getAccessibleAlbums, getLibraryAlbums, SORT_ORDERS } from "../../Model/selectors.js";
import { createAlbumCard } from "../Universal/albumCard.js";
import { escapeHtml } from "../Universal/escape.js";
import { icon } from "../Universal/icons.js";

export function libraryPage() {
	const state = model.viewState.library;
	const albums = getLibraryAlbums();
	const query = (model.viewState.searchBar || "").trim();
	const wishlistOnly = state.preset === "wishlist";

	const total = getAccessibleAlbums().filter((album) => !wishlistOnly || album.wishlist).length;

	const title = wishlistOnly
		? t("wishlist.titleCount", { count: albums.length })
		: t("library.titleCount", { count: albums.length });

	// An empty library is a different message from a library whose filters
	// happen to match nothing: one needs an album, the other needs the filters
	// cleared, and telling someone to add their first album when they have 200 is
	// the kind of small wrongness that makes an app feel unattended.
	const emptyKey = total === 0 ? (wishlistOnly ? "wishlist.empty" : "library.empty") : null;

	const body = albums.length
		? albums.map((album) => createAlbumCard(album)).join("")
		: /*HTML*/ `
        <div class="empty-state">
            <div class="empty-state-icon">${icon(wishlistOnly ? "star" : "disc", { size: 48 })}</div>
            ${t(emptyKey ?? "library.noMatches")}
        </div>`;

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">${title}</span>
        <button class="btn btn-accent" data-action="nav" data-page="addDetails">${t("music.addAlbum")}</button>
    </div>

    ${controls(state)}
    ${activeQuery(query)}

    ${body}
    `;
}

function controls(state) {
	const anyLabel = t("library.any");

	const options = (items, selected) =>
		`<option value="">${escapeHtml(anyLabel)}</option>` +
		items
			.map(
				(name, i) =>
					`<option value="${i}" ${String(i) === selected ? "selected" : ""}>${escapeHtml(name)}</option>`,
			)
			.join("");

	const sortOptions = SORT_ORDERS.map(
		(key) =>
			`<option value="${key}" ${key === state.sort ? "selected" : ""}>${escapeHtml(t(`library.sort.${key}`))}</option>`,
	).join("");

	const filtered = state.genre !== "" || state.location !== "";

	return /*HTML*/ `
    <div class="library-controls">
        <label class="library-control">
            <span class="library-control-label">${t("music.genre")}</span>
            <select class="library-select" data-action-change="library-genre">
                ${options(model.data.genre, state.genre)}
            </select>
        </label>

        <label class="library-control">
            <span class="library-control-label">${t("music.location")}</span>
            <select class="library-select" data-action-change="library-location">
                ${options(model.data.location, state.location)}
            </select>
        </label>

        <label class="library-control">
            <span class="library-control-label">${t("library.sortBy")}</span>
            <select class="library-select" data-action-change="library-sort">
                ${sortOptions}
            </select>
        </label>

        ${
			filtered
				? `<button class="btn btn-ghost library-clear" data-action="library-clear">${t("library.clearFilters")}</button>`
				: ""
		}
    </div>`;
}

// The query lives in the navbar, so the page says out loud that it is being
// applied — and offers the one-click way out of it.
function activeQuery(query) {
	if (!query) return "";

	return /*HTML*/ `
    <p class="library-query">
        <span>${t("library.filteredBy", { query: escapeHtml(query) })}</span>
        <button class="btn-link" data-action="library-clear-query">${t("library.clearQuery")}</button>
    </p>`;
}
