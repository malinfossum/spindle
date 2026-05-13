function getSearchResults() {
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
