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

	// Validate every field at once so all problems show together (the old code
	// fired one alert at a time). Carry over any cover error saveImage already set.
	const errors = {
		coverImg: model.viewState.musicForm.errors.coverImg,
		artist: info.artist.trim() ? "" : "error.fillArtist",
		title: info.title.trim() ? "" : "error.fillTitle",
		location: info.location.length ? "" : "error.pickLocation",
		genre: info.genre.length ? "" : "error.pickGenre",
		form: "",
	};

	if (errors.artist || errors.title || errors.location || errors.genre) {
		model.viewState.musicForm.errors = errors;
		updateView();
		focusFirstInvalid();
		return;
	}

	if (!isEdit && isStorageNearFull()) {
		errors.form = "error.storageNearFull";
		model.viewState.musicForm.errors = errors;
		updateView();
		return;
	}

	if (!isEdit) {
		model.viewState.musicInfo.id = rng();
		model.data.musicInfo.push({ ...model.viewState.musicInfo });
	} else {
		const index = model.data.musicInfo.findIndex(
			(item) => item.id == model.viewState.musicInfo.id,
		);

		if (index === -1) return;

		model.data.musicInfo[index] = { ...model.viewState.musicInfo };
	}

	persistState();
	changePage("homePage");
}

function newLocation(event) {
	event.preventDefault();

	const location = model.viewState.editMusicInfo.location.trim();

	if (location !== "") {
		for (let i = 0; i < model.data.location.length; i++) {
			if (model.data.location[i].toLowerCase() === location.toLowerCase()) {
				return;
			}
		}
		model.data.location.push(location);
		persistState();
	}

	model.app.showLocationInput = !model.app.showLocationInput;
	emptyGenreLocationList();
	updateView();
}

function newGenre(event) {
	event.preventDefault();

	const genre = model.viewState.editMusicInfo.genre.trim();

	if (genre !== "") {
		for (let i = 0; i < model.data.genre.length; i++) {
			if (model.data.genre[i].toLowerCase() === genre.toLowerCase()) {
				return;
			}
		}
		model.data.genre.push(genre);
		persistState();
	}

	model.app.showGenreInput = !model.app.showGenreInput;
	emptyGenreLocationList();
	updateView();
}

async function removeLocation(event) {
	event.preventDefault();

	const location = model.viewState.editMusicInfo.location.trim();
	const locationIdx = model.data.location.indexOf(location);

	if (locationIdx !== -1) {
		const confirmed = await openDialog({
			title: t("dialog.deleteLocationTitle"),
			body: t("dialog.deleteLocationBody", { name: location }),
			confirmText: t("dialog.delete"),
			danger: true,
		});

		if (confirmed) {
			model.data.location.splice(locationIdx, 1);
			emptyGenreLocationList();
			persistState();
		}
	}

	model.app.showDeleteLocationInput = !model.app.showDeleteLocationInput;
	updateView();
}

async function removeGenre(event) {
	event.preventDefault();

	const genre = model.viewState.editMusicInfo.genre.trim();
	const genreIdx = model.data.genre.indexOf(genre);

	if (genreIdx !== -1) {
		const confirmed = await openDialog({
			title: t("dialog.deleteGenreTitle"),
			body: t("dialog.deleteGenreBody", { name: genre }),
			confirmText: t("dialog.delete"),
			danger: true,
		});

		if (confirmed) {
			model.data.genre.splice(genreIdx, 1);
			emptyGenreLocationList();
			persistState();
		}
	}

	model.app.showDeleteGenreInput = !model.app.showDeleteGenreInput;
	updateView();
}

function emptyList() {
	model.viewState.musicInfo = {
		id: null,
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

async function saveImage(image) {
	const file = image.files[0];
	if (!file) return;

	const errors = model.viewState.musicForm.errors;

	if (file.size > 2 * 1024 * 1024) {
		errors.coverImg = "error.imageTooLarge";
		image.value = "";
		updateView();
		focusFirstInvalid();
		return;
	}

	const mime = await sniffImageType(file);
	if (!mime) {
		errors.coverImg = "error.imageInvalid";
		image.value = "";
		updateView();
		focusFirstInvalid();
		return;
	}

	// Build the data URI from the sniffed MIME, not file.type, so the stored
	// prefix can't be spoofed. Strip FileReader's own prefix and re-attach ours.
	const base64 = await readFileAsBase64(file);
	model.viewState.musicInfo.coverImg = `data:${mime};base64,${base64}`;
	errors.coverImg = "";
	updateView();
}

function readFileAsBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			resolve(result.slice(result.indexOf(",") + 1));
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

// Wipes the add/edit form's field errors. Called on navigation (changePage) so a
// validation error from one visit never lingers into the next — the music-form
// counterpart to resetAuthFieldErrors.
function resetMusicFieldErrors() {
	model.viewState.musicForm.errors = {
		coverImg: "",
		artist: "",
		title: "",
		location: "",
		genre: "",
		form: "",
	};
}

// Lokasjon/Sjanger are groups, not single inputs, so clearFieldError (which keys
// off input.id) can't clear them. Clear the group's error the moment a choice is
// made, updating the DOM directly to avoid a focus-dropping re-render.
function clearMusicGroupError(groupName) {
	const errors = model.viewState.musicForm.errors;
	if (!errors[groupName]) return;

	errors[groupName] = "";
	const group = document.getElementById(`music-${groupName}-group`);
	if (group) group.setAttribute("aria-invalid", "false");
	const span = document.getElementById(`music-${groupName}-error`);
	if (span) span.textContent = "";
}
