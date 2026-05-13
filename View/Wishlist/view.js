function wishListPage() {
	const wishlist = getAccessibleAlbums().filter((album) => album.wishlist);

	if (wishlist.length === 0) {
		return /*HTML*/ `
        <div class="page-header">
            <span class="page-title">Ønskeliste</span>
        </div>

        <div class="empty-state">
            <div class="empty-state-icon">⭐</div>
            Ønskelisten er tom. Merk album med ⭐ for å legge dem til.
        </div>
        `;
	}

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">Ønskeliste (${wishlist.length})</span>
    </div>

    ${wishlist.map((album) => createAlbumCard(album)).join("")}
    `;
}
