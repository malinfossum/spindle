function homeView() {
	const albums = getAccessibleAlbums();

	if (albums.length === 0) {
		return /*HTML*/ `
        <div class="page-header">
            <span class="page-title">Bibliotek</span>
            <button class="btn btn-accent" onclick="changePage('addDetails')">+ Legg til album</button>
        </div>

        <div class="empty-state">
            <div class="empty-state-icon">🎵</div>
            Ingen album ennå. Legg til ditt første!
        </div>
        `;
	}

	const albumList = albums.map((album) => createAlbumCard(album)).join("");

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">Bibliotek (${albums.length})</span>
        <button class="btn btn-accent" onclick="changePage('addDetails')">+ Legg til album</button>
    </div>

    ${albumList}
    `;
}
