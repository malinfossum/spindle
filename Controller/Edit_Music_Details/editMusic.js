function toggleLocationCheckbox(checkbox, index) {
	const locations = model.viewState.musicInfo.location;

	if (checkbox.checked) {
		if (!locations.includes(index)) {
			locations.splice(0, 1);
			locations.push(index);
		}
	} else {
		const pos = locations.indexOf(index);
		if (pos !== -1) locations.splice(pos, 1);
	}
}

function toggleGenreCheckbox(checkbox, index) {
	const genre = model.viewState.musicInfo.genre;

	if (checkbox.checked) {
		if (!genre.includes(index)) genre.push(index);
	} else {
		const pos = genre.indexOf(index);
		if (pos !== -1) genre.splice(pos, 1);
	}
}

function rng() {
	const number = Math.floor(Math.random() * 999999);
	for (let i = 0; i < model.data.musicInfo.length; i++) {
		if (model.data.musicInfo[i].id === number) return rng();
	}
	return number;
}

function initNewAlbum() {
	emptyList();
	emptyGenreLocationList();
	clearAuthMessage();
}

function submitChanges(isEdit) {
	if (!isLoggedIn()) {
		changePage("login");
		return;
	}

	const info = model.viewState.musicInfo;

	if (!info.artist.trim() || !info.title.trim()) {
		alert("Artist og tittel må fylles ut.");
		return;
	}

	if (info.location.length === 0) {
		alert("Velg en lokasjon.");
		return;
	}

	if (info.genre.length === 0) {
		alert("Velg minst én sjanger.");
		return;
	}

	if (!isEdit) {
		model.viewState.musicInfo.id = rng();
		model.viewState.musicInfo.ownerId = model.app.loggedInID;
		model.data.musicInfo.push({ ...model.viewState.musicInfo });
	} else {
		const index = model.data.musicInfo.findIndex(
			(item) => item.id == model.viewState.musicInfo.id,
		);

		if (index === -1) return;

		const existingAlbum = model.data.musicInfo[index];

		if (!canManageAlbum(existingAlbum)) {
			alert("Du har ikke tilgang til å redigere dette albumet.");
			return;
		}

		model.viewState.musicInfo.ownerId = existingAlbum.ownerId;
		model.data.musicInfo[index] = { ...model.viewState.musicInfo };
	}

	changePage("homePage");
}

function newLocation(event) {
	event.preventDefault();

	if (!isAdmin()) {
		alert("Kun admin kan legge til lokasjoner.");
		return;
	}

	const location = model.viewState.editMusicInfo.location.trim();

	if (location !== "") {
		for (let i = 0; i < model.data.location.length; i++) {
			if (model.data.location[i].toLowerCase() === location.toLowerCase()) {
				return;
			}
		}
		model.data.location.push(location);
	}

	model.app.showLocationInput = !model.app.showLocationInput;
	emptyGenreLocationList();
	updateView();
}

function newGenre(event) {
	event.preventDefault();

	if (!isAdmin()) {
		alert("Kun admin kan legge til sjangre.");
		return;
	}

	const genre = model.viewState.editMusicInfo.genre.trim();

	if (genre !== "") {
		for (let i = 0; i < model.data.genre.length; i++) {
			if (model.data.genre[i].toLowerCase() === genre.toLowerCase()) {
				return;
			}
		}
		model.data.genre.push(genre);
	}

	model.app.showGenreInput = !model.app.showGenreInput;
	emptyGenreLocationList();
	updateView();
}

function removeLocation(event) {
	event.preventDefault();

	if (!isAdmin()) {
		alert("Kun admin kan slette lokasjoner.");
		return;
	}

	const location = model.viewState.editMusicInfo.location.trim();
	const locationIdx = model.data.location.indexOf(location);

	if (locationIdx !== -1) {
		deleteConfirmation();
		if (model.app.deleteConfirmation === false) {
			model.data.location.splice(locationIdx, 1);
		} else {
			model.app.deleteConfirmation = false;
		}
	}

	model.app.showDeleteLocationInput = !model.app.showDeleteLocationInput;
	updateView();
}

function removeGenre(event) {
	event.preventDefault();

	if (!isAdmin()) {
		alert("Kun admin kan slette sjangre.");
		return;
	}

	const genre = model.viewState.editMusicInfo.genre.trim();
	const genreIdx = model.data.genre.indexOf(genre);

	if (genreIdx !== -1) {
		deleteConfirmation();
		if (model.app.deleteConfirmation === false) {
			model.data.genre.splice(genreIdx, 1);
		} else {
			model.app.deleteConfirmation = false;
		}
	}

	model.app.showDeleteGenreInput = !model.app.showDeleteGenreInput;
	updateView();
}

function emptyList() {
	model.viewState.musicInfo = {
		id: null,
		ownerId: null,
		title: "",
		artist: "",
		location: [],
		releaseYear: null,
		genre: [],
		notes: "",
		wishlist: false,
		coverImg: null,
	};
}

function emptyGenreLocationList() {
	model.viewState.editMusicInfo = {
		genre: "",
		location: "",
	};
}

function saveImage(image) {
	const file = image.files[0];
	if (!file) return;
	model.viewState.musicInfo.coverImg = URL.createObjectURL(file);
}

function deleteConfirmation() {
	if (confirm("Er du sikker på at du vil slette denne?")) {
		emptyGenreLocationList();
		updateView();
	} else {
		model.app.deleteConfirmation = true;
	}
}
