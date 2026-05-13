function viewMusicDetails(id) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;

	if (!canManageAlbum(album)) {
		alert("Du har ikke tilgang til å se dette albumet.");
		return;
	}

	model.viewState.musicInfo = {
		...album,
		location: [...album.location],
		genre: [...album.genre],
	};

	changePage("viewDetails");
}
