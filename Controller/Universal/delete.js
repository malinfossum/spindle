async function deleteAlbum(id) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;

	const confirmed = await openDialog({
		title: "Slette album?",
		body: `Vil du slette «${album.title}» fra biblioteket?`,
		confirmText: "Slett",
		danger: true,
	});
	if (!confirmed) return;

	model.data.musicInfo = model.data.musicInfo.filter((a) => a.id !== id);
	persistState();
	changePage("homePage");
}
