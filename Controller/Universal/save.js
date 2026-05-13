function toggleWishlist(id, checked) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;

	album.wishlist = checked;
	persistState();
	updateView();
}
