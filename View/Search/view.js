function searchPage() {
	const query = (model.viewState.searchBar || "").toLowerCase().trim();
	const results = getSearchResults();

	const resultHTML = results.length
		? results.map((album) => createAlbumCard(album)).join("")
		: `<div class="empty-state"><div class="empty-state-icon">🔍</div>Ingen treff for "${query}"</div>`;

	const countHTML = query
		? `<p class="search-result-count">Søkt: "${query}" — ${results.length} treff</p>`
		: "";

	return /*HTML*/ `
    ${countHTML}
    ${resultHTML}
    `;
}
