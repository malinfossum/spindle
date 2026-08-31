import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { getSearchResults } from "../../Model/selectors.js";
import { createAlbumCard } from "../Universal/albumCard.js";
import { escapeHtml } from "../Universal/escape.js";
import { icon } from "../Universal/icons.js";

export function searchPage() {
	const query = (model.viewState.searchBar || "").toLowerCase().trim();
	const results = getSearchResults();

	// The query is user input, so it is escaped before being handed to t() as a
	// parameter — t() itself only ever returns developer-authored text.
	const safeQuery = escapeHtml(query);

	const resultHTML = results.length
		? results.map((album) => createAlbumCard(album)).join("")
		: `<div class="empty-state"><div class="empty-state-icon">${icon("search", { size: 48 })}</div>${t("search.noResults", { query: safeQuery })}</div>`;

	// Norwegian "treff" is the same either way, but English needs the singular.
	// One extra key beats a plural-rule engine for the one string that needs it.
	const countKey = results.length === 1 ? "search.countOne" : "search.count";

	const countHTML = query
		? `<p class="search-result-count">${t(countKey, { query: safeQuery, count: results.length })}</p>`
		: "";

	return /*HTML*/ `
    ${countHTML}
    ${resultHTML}
    `;
}
