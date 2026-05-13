function deleteAlbum(id) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;

	if (!canManageAlbum(album)) {
		alert("Du har ikke tilgang til å slette dette albumet.");
		return;
	}

	const confirmed = confirm("Er du sikker på at du vil slette albumet?");
	if (!confirmed) return;

	model.data.musicInfo = model.data.musicInfo.filter((a) => a.id !== id);
	changePage("homePage");
}
