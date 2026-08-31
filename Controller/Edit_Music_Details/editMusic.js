import { deleteCover, newCoverId, putCover } from "../../Model/covers.js";
import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { isStorageNearFull, persistState } from "../../Model/persistence.js";
import { isLoggedIn } from "../../Model/selectors.js";
import { clearAuthMessage } from "../../Model/viewState.js";
import { forgetCover } from "../../View/Universal/cover.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { downscaleCover } from "../../View/Universal/downscale.js";
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
	model.viewState.musicForm.coverPreview = null;
	emptyList();
	emptyGenreLocationList();
	clearAuthMessage();
}

export async function submitChanges(isEdit) {
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

	// The cover is written before the album, so an album never points at a row
	// that failed to store. A write that fails leaves the previous cover in place
	// and says so, rather than saving an album with a broken reference.
	const preview = model.viewState.musicForm.coverPreview;
	let replacedCoverId = null;

	if (preview) {
		const newId = newCoverId();
		try {
			await putCover(newId, preview);
		} catch (err) {
			console.error("[editMusic] could not store the cover:", err);
			errors.coverImg = "error.imageStoreFailed";
			model.viewState.musicForm.errors = errors;
			updateView();
			return;
		}
		replacedCoverId = model.viewState.musicInfo.coverId;
		model.viewState.musicInfo.coverId = newId;
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

	model.viewState.musicForm.coverPreview = null;

	// Only once the album that pointed at it is saved pointing somewhere else.
	if (replacedCoverId) {
		forgetCover(replacedCoverId);
		deleteCover(replacedCoverId).catch((err) =>
			console.warn("[editMusic] could not delete the replaced cover:", err),
		);
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
		coverId: null,
	};
}

function emptyGenreLocationList() {
	model.viewState.editMusicInfo = {
		genre: "",
		location: "",
	};
}

// The cap existed because the file was stored exactly as picked, inside the one
// localStorage value. Covers are re-encoded to a few tens of kilobytes now, so
// this only has to bound what the browser is asked to decode — and 2 MB rejected
// the phone photos that "photograph the sleeve" is entirely about.
//
// The megabyte figure appears in error.imageTooLarge in both string tables;
// field errors are rendered from a key with no parameters, so the two are kept
// in step by hand. Change one, change the other.
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export async function saveImage(image) {
	const file = image.files[0];
	if (!file) return;

	const errors = model.viewState.musicForm.errors;

	if (file.size > MAX_UPLOAD_BYTES) {
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

	// Re-encoded small before anything stores it: a sleeve is drawn at 120px and
	// arrives as a multi-megabyte photo. The canvas also drops the EXIF block,
	// which is where a phone writes the GPS coordinates of wherever the picture
	// was taken.
	//
	// If that fails, fall back to the file as it came: build the data URI from the
	// sniffed MIME rather than file.type, so the stored prefix cannot be spoofed —
	// strip FileReader's own prefix and re-attach ours.
	//
	// Either way it goes to the form's preview, not to the album: nothing reaches
	// IndexedDB until the album is saved, so choosing a cover and then cancelling
	// leaves no row behind.
	const downscaled = await downscaleCover(file);
	model.viewState.musicForm.coverPreview =
		downscaled ?? `data:${mime};base64,${await readFileAsBase64(file)}`;
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
