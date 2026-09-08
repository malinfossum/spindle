// The library — one list view with three ways in.
//
// Home, Search and Wishlist each used to render the same album cards under a
// different heading, which is three copies of one page. This is that page: the
// full list, plus the query from the navbar, four filters — genre, location,
// format and decade — and a sort. Wishlist is the same view with one filter
// pre-set, and searching lands here with the query filled in.
//
// The query deliberately has no field of its own. The navbar's search box is on
// every page, so a second input would be a second place to type the same thing;
// what this page adds is a visible, clearable statement of what is being
// filtered out.

import { t } from "../../Model/i18n/i18n.js";
import { ALBUM_FORMATS, formatLabelKey, model } from "../../Model/model.js";
import {
	getAccessibleAlbums,
	getLibraryAlbums,
	getLibraryDecades,
	SORT_ORDERS,
} from "../../Model/selectors.js";
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
				({ value, label }) =>
					`<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`,
			)
			.join("");

	// Genre and location are stored as indices into model.data, so their option
	// values are positions; format and decade store their own value.
	const byIndex = (names) => names.map((label, i) => ({ value: String(i), label }));

	const formatOptions = ALBUM_FORMATS.map((key) => ({
		value: key,
		label: t(formatLabelKey(key)),
	}));

	const decadeOptions = getLibraryDecades().map((decade) => ({
		value: String(decade),
		label: t("library.decadeLabel", { decade }),
	}));

	const sortOptions = SORT_ORDERS.map(
		(key) =>
			`<option value="${key}" ${key === state.sort ? "selected" : ""}>${escapeHtml(t(`library.sort.${key}`))}</option>`,
	).join("");

	const active = [state.genre, state.location, state.format, state.decade].filter(
		(value) => value !== "",
	).length;

	const control = (label, action, optionsHtml) => /*HTML*/ `
        <label class="library-control">
            <span class="library-control-label">${label}</span>
            <select class="library-select" data-action-change="${action}">
                ${optionsHtml}
            </select>
        </label>`;

	// The toggle is a mobile affordance and CSS hides it from the tablet
	// breakpoint up, where all five controls fit on a row or two and there is
	// nothing to collapse. It carries the count of active filters because a
	// closed panel would otherwise be the only explanation for a short list, and
	// an unexplained short list is indistinguishable from a small library.
	//
	// Collapsed is a class and not the hidden attribute, which is what the chip
	// panels use. hidden is a statement that the content is not rendered at all,
	// and a screen reader honours it whatever the CSS says — so on a wide screen,
	// where the media query paints the controls anyway, it would hide from
	// assistive technology exactly the row everyone else can see.
	return /*HTML*/ `
    <button type="button"
            class="btn btn-ghost library-filters-toggle"
            aria-expanded="${state.filtersOpen}"
            aria-controls="library-controls"
            data-action="library-filters-toggle">
        ${escapeHtml(t("library.filters"))}${active ? ` (${active})` : ""}
    </button>

    <div class="library-controls${state.filtersOpen ? "" : " is-collapsed"}" id="library-controls">
        ${control(t("music.genre"), "library-genre", options(byIndex(model.data.genre), state.genre))}
        ${control(t("music.location"), "library-location", options(byIndex(model.data.location), state.location))}
        ${control(t("music.format"), "library-format", options(formatOptions, state.format))}
        ${control(t("library.decade"), "library-decade", options(decadeOptions, state.decade))}
        ${control(t("library.sortBy"), "library-sort", sortOptions)}

        ${
			active
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
