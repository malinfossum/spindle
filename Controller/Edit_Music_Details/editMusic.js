import { deleteCover, newCoverId, putCover } from "../../Model/covers.js";
import { t } from "../../Model/i18n/i18n.js";
import { blankAlbum, model } from "../../Model/model.js";
import { commitGenres, genreKey } from "../../Model/musicbrainz.js";
import { isStorageNearFull, persistState } from "../../Model/persistence.js";
import { isLoggedIn } from "../../Model/selectors.js";
import { clearAuthMessage } from "../../Model/viewState.js";
import { forgetCover } from "../../View/Universal/cover.js";
import { centreSquare } from "../../View/Universal/cropFrame.js";
import { guessSquare } from "../../View/Universal/cropGuess.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { decodeCover, encodeCover, sampleCover } from "../../View/Universal/downscale.js";
import { sniffImageType } from "../../View/Universal/sniff.js";
import { appRoot, updateView } from "../../View/Universal/updateView.js";
import { focusFirstInvalid } from "../Login/login.js";
import { navigate } from "../Universal/router.js";
import { cropPhoto } from "./crop.js";

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

// A genre a look-up proposed (v0.7). Unticking keeps it in the form, unticked,
// so a mis-tap can be undone.
export function togglePendingGenre(checkbox, index) {
	const pending = model.viewState.musicForm.pendingGenres[index];
	if (pending) pending.checked = checkbox.checked;
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

	// A ticked genre a look-up proposed counts, the same as one from my list.
	// The ticks are copied now, so the genres that pass validation are the ones
	// saved, even if a box changes while the cover is being written.
	const ticked = model.viewState.musicForm.pendingGenres
		.filter((genre) => genre.checked)
		.map((genre) => ({ ...genre }));
	const pendingTicked = ticked.length > 0;

	// Validate every field at once so all problems show together (the old code
	// fired one alert at a time). Carry over any cover error saveImage already set.
	const errors = {
		coverImg: model.viewState.musicForm.errors.coverImg,
		artist: info.artist.trim() ? "" : "error.fillArtist",
		title: info.title.trim() ? "" : "error.fillTitle",
		// "Choose a location" is wrong advice on a library that has none — which is
		// every library on its first run now that nothing is seeded. Point at the
		// control that fixes it instead.
		location: info.location.length
			? ""
			: model.data.location.length
				? "error.pickLocation"
				: "error.addLocationFirst",
		genre:
			info.genre.length || pendingTicked
				? ""
				: model.data.genre.length
					? "error.pickGenre"
					: "error.addGenreFirst",
		barcode: "",
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

	// New genres from a look-up join my list only now (v0.7), after the cover
	// write, which can still stop the save. Unticked ones are dropped by the
	// navigation below.
	if (pendingTicked) {
		const committed = commitGenres(model.data.genre, ticked);
		model.data.genre = committed.list;
		for (const index of committed.indexes) {
			if (!info.genre.includes(index)) info.genre.push(index);
		}
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
	const toggle = appRoot.querySelector(`[data-action="toggle-panel"][data-panel="${panel}"]`);
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
		// A genre a look-up proposed and I have now added by hand is the same
		// genre (v0.7): it leaves the pending list, and its tick moves to the
		// new entry, so the form never shows it twice.
		const pending = model.viewState.musicForm.pendingGenres;
		const same = pending.findIndex((p) => genreKey(p.name) === genreKey(genre));
		if (same !== -1) {
			if (pending[same].checked) {
				model.viewState.musicInfo.genre.push(model.data.genre.length - 1);
			}
			pending.splice(same, 1);
		}
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
	model.viewState.musicInfo = blankAlbum();
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

	// Errors are read from the form each time, never held: Save during a slow
	// decode can replace form.errors, and a message written to the old object
	// would never show.
	const form = model.viewState.musicForm;

	if (file.size > MAX_UPLOAD_BYTES) {
		form.errors.coverImg = "error.imageTooLarge";
		image.value = "";
		updateView();
		focusFirstInvalid();
		return;
	}

	const mime = await sniffImageType(file);
	if (!mime) {
		form.errors.coverImg = "error.imageInvalid";
		image.value = "";
		updateView();
		focusFirstInvalid();
		return;
	}

	// Re-encoded small before anything stores it: a sleeve is drawn at 120px and
	// arrives as a multi-megabyte photo. The canvas also drops the EXIF block,
	// which is where a phone writes the GPS coordinates of wherever the picture
	// was taken. Since v0.7 a crop dialog sits between decode and encode, and
	// coverBusy stays true while it is open.
	//
	// A photo that cannot be decoded or encoded is refused (v0.7). Until now it
	// was kept as it came, EXIF included; the bytes were already checked above,
	// so this is rare, and when it happens the field says so.
	//
	// Either way it goes to the form's preview, not to the album: nothing reaches
	// IndexedDB until the album is saved, so choosing a cover and then cancelling
	// leaves no row behind. coverBusy disables the file input until the end, and
	// the render in finally puts a fresh, empty input in its place.
	form.coverBusy = true;
	form.errors.coverImg = "";
	updateView();

	// A large photo takes a moment to decode, and I can leave the form
	// meanwhile. Add album and Edit both put a new musicInfo in place, so the
	// same object and the same hash mean it is still the same visit.
	const visit = model.viewState.musicInfo;
	const openedOn = window.location.hash;
	const stale = () => model.viewState.musicInfo !== visit || window.location.hash !== openedOn;

	const bitmap = await decodeCover(file);
	try {
		// Left the form while it decoded: the dialog must not open on
		// whatever page is showing now.
		if (stale()) return;
		if (!bitmap) {
			form.errors.coverImg = "error.coverProcess";
			return;
		}
		// Guess on a small copy, then let me adjust it (v0.7). The dialog
		// opens every time, on the guess, so I always see what gets saved.
		const photo = { width: bitmap.width, height: bitmap.height };
		const sample = sampleCover(bitmap);
		const guess = sample ? guessSquare(sample, photo) : centreSquare(photo);
		const square = await cropPhoto(bitmap, guess);
		// Cancel, Escape or leaving the page: nothing changes, and an earlier
		// cover stays.
		if (square === null) return;
		const dataUrl = encodeCover(bitmap, square);
		if (dataUrl) form.coverPreview = dataUrl;
		else form.errors.coverImg = "error.coverProcess";
	} finally {
		bitmap?.close();
		form.coverBusy = false;
		updateView();
		// The render above replaced the input that was focused, so put focus back
		// on its replacement — the picker is where someone tabbed to, and where
		// they would go next to change their mind. Not on a visit that is over.
		if (!stale()) appRoot.querySelector("#music-cover")?.focus();
	}
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
