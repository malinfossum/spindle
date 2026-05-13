function toggleWishlist(id, checked) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;
	if (!canManageAlbum(album)) return;

	album.wishlist = checked;
	updateView();
}
