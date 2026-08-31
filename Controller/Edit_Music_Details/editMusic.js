import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { isStorageNearFull, persistState } from "../../Model/persistence.js";
import { isLoggedIn } from "../../Model/selectors.js";
import { clearAuthMessage } from "../../Model/viewState.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { sniffImageType } from "../../View/Universal/sniff.js";
import { updateView } from "../../View/Universal/updateView.js";
import { focusFirstInvalid } from "../Login/login.js";
import { navigate } from "../Universal/router.js";

export function toggleLocationCheckbox(checkbox, index) {
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

export function toggleGenreCheckbox(checkbox, index) {
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

export function initNewAlbum() {
	emptyList();
	emptyGenreLocationList();
	clearAuthMessage();
}

export function submitChanges(isEdit) {
	if (!isLoggedIn()) {
		navigate("login");
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
			(item) => item.id === model.viewState.musicInfo.id,
		);

		if (index === -1) return;

		model.data.musicInfo[index] = { ...model.viewState.musicInfo };
	}

	persistState();
	navigate("homePage");
}

// updateView() replaces #app wholesale, so whichever control was pressed stops
// existing and focus falls to <body>. Every path that closes a chip panel ends
// here instead: focus returns to the panel's toggle, which is both a sensible
// place to carry on from and the element whose aria-expanded just changed.
export function focusPanelToggle(panel) {
	const toggle = model.app.app.querySelector(
		`[data-action="toggle-panel"][data-panel="${panel}"]`,
	);
	if (toggle) toggle.focus();
}

export function newLocation(event) {
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

	model.viewState.musicForm.panels.locationAdd = false;
	emptyGenreLocationList();
	updateView();
	focusPanelToggle("location-add");
}

export function newGenre(event) {
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

	model.viewState.musicForm.panels.genreAdd = false;
	emptyGenreLocationList();
	updateView();
	focusPanelToggle("genre-add");
}

export async function removeLocation(event) {
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

	model.viewState.musicForm.panels.locationRemove = false;
	updateView();
	focusPanelToggle("location-remove");
}

export async function removeGenre(event) {
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

	model.viewState.musicForm.panels.genreRemove = false;
	updateView();
	focusPanelToggle("genre-remove");
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

export async function saveImage(image) {
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

// Lokasjon/Sjanger are groups, not single inputs, so clearFieldError (which keys
// off input.id) can't clear them. Clear the group's error the moment a choice is
// made, updating the DOM directly to avoid a focus-dropping re-render.
export function clearMusicGroupError(groupName) {
	const errors = model.viewState.musicForm.errors;
	if (!errors[groupName]) return;

	errors[groupName] = "";
	const group = document.getElementById(`music-${groupName}-group`);
	if (group) group.setAttribute("aria-invalid", "false");
	const span = document.getElementById(`music-${groupName}-error`);
	if (span) span.textContent = "";
}
