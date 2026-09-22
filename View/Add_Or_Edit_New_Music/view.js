import { t } from "../../Model/i18n/i18n.js";
import { ALBUM_FORMATS, formatLabelKey, model } from "../../Model/model.js";
import { getPref } from "../../Model/prefs.js";
import { getAccessibleAlbums } from "../../Model/selectors.js";
import { coverAttr, coverInner } from "../Universal/cover.js";
import { escapeHtml } from "../Universal/escape.js";
import { icon } from "../Universal/icons.js";

export function addDetailsPage() {
	return buildMusicForm(false);
}

export function editDetailsPage() {
	return buildMusicForm(true);
}

function buildMusicForm(isEdit) {
	const info = model.viewState.musicInfo;
	const errors = model.viewState.musicForm.errors;
	const panels = model.viewState.musicForm.panels;

	const lookup = model.viewState.musicForm.lookup;
	const lookupsOn = getPref("lookups") === "on";
	const busyLookup = lookup.status === "busy";

	// The album the barcode already belongs to, when there is one. Looked up by
	// id here rather than kept on the state, so a name edited in the meantime
	// renders as it is now.
	const ownedAlbum =
		lookup.owned === null
			? null
			: (getAccessibleAlbums().find((album) => album.id === lookup.owned) ?? null);

	// What the status line says. role="status" is what tells a screen-reader
	// user that three fields just changed — aria-busy on a button says nothing.
	// The cover result (v0.5) is appended to the fill sentence rather than
	// written to a second region a screen reader may talk over: one line, one
	// announcement, and the second write carries the whole sentence.
	const COVER_KEYS = {
		added: "lookup.coverAdded",
		none: "lookup.coverNone",
		busy: "lookup.coverBusy",
		failed: "lookup.coverFailed",
	};
	const filledLine = lookup.filled
		? t("music.lookupFilled", {
				artist: escapeHtml(lookup.filled.artist),
				title: escapeHtml(lookup.filled.title),
			}) + (lookup.cover ? ` ${t(COVER_KEYS[lookup.cover])}` : "")
		: "";
	const lookupStatus = busyLookup
		? t("music.lookupWorking")
		: lookup.status === "off"
			? t("lookup.off")
			: filledLine;

	const matchButtons = lookup.matches
		.map(
			(match, i) => /*HTML*/ `
        <li>
            <button type="button" class="btn btn-ghost lookup-match"
                    data-action="barcode-pick" data-index="${i}">
                <span class="lookup-match-name">${escapeHtml(match.artist)} – ${escapeHtml(match.title)}</span>
                <span class="lookup-match-meta">${escapeHtml(match.year ?? "")}${
					match.year && match.format ? " · " : ""
				}${match.format ? escapeHtml(t(formatLabelKey(match.format))) : ""}</span>
            </button>
        </li>`,
		)
		.join("");

	// Only ids that are on the page. The note is rendered only while the pref is
	// on, so the attribute must not name it otherwise.
	const barcodeDescribedBy = lookupsOn
		? "music-barcode-error music-lookup-note"
		: "music-barcode-error";

	const barcodeRow = /*HTML*/ `
        <div class="form-row">
            <label class="form-label" for="music-barcode">${t("music.barcode")}</label>
            <!-- Its own small form, the chip-input pattern: the page's main
                 form is a <div>, so this is what makes Enter in the field work
                 without a keydown handler. novalidate keeps the browser's own
                 pattern check out of the way: the controller validates and
                 renders the i18n error, so the native tooltip never shows.
                 The wrapper keeps the form from matching .form-row > form >
                 button, which would out-rank .btn and paint Look up as a
                 borderless icon button. -->
            <div class="lookup-wrap">
            <form class="lookup-row" data-action-submit="barcode-lookup" novalidate>
                <input class="form-input"
                       id="music-barcode"
                       type="text"
                       inputmode="numeric"
                       pattern="[0-9 ]*"
                       autocomplete="off"
                       placeholder="${t("music.barcodePlaceholder")}"
                       aria-invalid="${errors.barcode ? "true" : "false"}"
                       aria-describedby="${barcodeDescribedBy}"
                       value="${escapeHtml(info.barcode)}"
                       data-action-input="music-barcode">
                <button class="btn" id="music-lookup-btn"
                        aria-busy="${busyLookup}"
                        ${busyLookup ? "disabled" : ""}>${t("music.lookup")}</button>
                ${
					// Everyone without a working detector sees only the
					// typed field — no dead button.
					model.app.canScan
						? /*HTML*/ `<button class="btn" type="button" id="music-scan-btn"
                        data-action="barcode-scan">${t("music.scan")}</button>`
						: ""
				}
            </form>
            </div>
            <span class="field-error" id="music-barcode-error">${escapeHtml(t(errors.barcode))}</span>
            <p class="lookup-status" id="music-lookup-status" role="status">${lookupStatus}</p>
            ${
				lookupsOn
					? /*HTML*/ `<p class="form-hint" id="music-lookup-note">${t("music.lookupNote")}</p>`
					: ""
			}
            ${
				ownedAlbum
					? /*HTML*/ `<p class="lookup-owned" id="music-barcode-owned" tabindex="-1">
                ${t("music.barcodeOwned", {
					artist: escapeHtml(ownedAlbum.artist),
					title: escapeHtml(ownedAlbum.title),
				})}
                <button class="btn btn-ghost" type="button" data-action="view-album"
                        data-id="${ownedAlbum.id}">${t("music.view")}</button>
            </p>`
					: ""
			}
            <div id="music-lookup-matches" ${lookup.matches.length > 1 ? "" : "hidden"}>
                <p class="form-label" id="music-lookup-matches-label">${t("music.pickMatch")}</p>
                <ul class="lookup-matches" aria-labelledby="music-lookup-matches-label">
                    ${matchButtons}
                </ul>
            </div>
        </div>
`;

	const locationCheckboxes = model.data.location
		.map(
			(loc, i) => /*HTML*/ `
        <label class="checkbox-option">
            <input type="radio"
                   name="location"
                   ${info.location.includes(i) ? "checked" : ""}
                   data-action-change="music-location"
                   data-index="${i}">
            ${escapeHtml(loc)}
        </label>
    `,
		)
		.join("");

	const genreBoxes = model.data.genre
		.map(
			(loc, i) => /*HTML*/ `
        <label class="checkbox-option">
            <input type="checkbox"
                   name="genre"
                   ${info.genre.includes(i) ? "checked" : ""}
                   data-action-change="music-genre"
                   data-index="${i}">
            ${escapeHtml(loc)}
        </label>
    `,
		)
		.join("");

	// "" first and selected by default: format is optional, and defaulting to CD
	// would quietly label every album someone never touches this field on.
	const formatOptions = ["", ...ALBUM_FORMATS]
		.map((value) => {
			const label = value ? t(formatLabelKey(value)) : t("music.formatUnset");
			return /*HTML*/ `<option value="${value}" ${
				info.format === value ? "selected" : ""
			}>${escapeHtml(label)}</option>`;
		})
		.join("");

	const busy = model.viewState.musicForm.coverBusy;

	// A cover chosen a moment ago outranks the stored one: it is what the person
	// is looking at the form to confirm.
	const preview = model.viewState.musicForm.coverPreview;
	const albumCover = preview
		? /*HTML*/ `<img src="${escapeHtml(preview)}" alt="${t("music.coverAlt")}">`
		: /*HTML*/ `<span class="form-cover-icon">${coverInner(info, 30, "image")}</span>`;

	const formError = errors.form
		? /*HTML*/ `<p class="auth-error" role="alert">${escapeHtml(t(errors.form))}</p>`
		: "";

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">${isEdit ? t("music.editTitle") : t("music.addTitle")}</span>
    </div>

    <div class="form-card">
        ${formError}

        <div class="form-top">
            <!-- The file input is still a real, focusable <input type="file"> —
                 it is only moved off screen, with the <label> beside it as its
                 visible control. That keeps the native keyboard and screen-reader
                 behaviour while dropping the browser's unstyleable "Choose File /
                 No file chosen" widget, which used to be nudged into place with a
                 210px margin and landed on top of the cover. -->
            <div class="form-cover">
                <!-- capture="environment" is what makes a phone open the rear
                     camera on this field instead of the file picker, so a sleeve
                     can be photographed where it is standing. It costs the phone
                     its gallery: Android Chrome and iOS Safari read capture as
                     "camera only", not "camera as well". Desktop ignores the
                     attribute, so nothing changes there. Still nothing leaves the
                     device — the file goes through the same downscale as any
                     other, then into IndexedDB encrypted. -->
                <input class="file-input-hidden"
                       id="music-cover"
                       type="file"
                       accept="image/jpeg,image/png,image/webp"
                       capture="environment"
                       aria-invalid="${errors.coverImg ? "true" : "false"}"
                       aria-describedby="music-cover-error"
                       ${busy ? "disabled" : ""}
                       data-action-change="music-cover">

                <label class="form-cover-slot file-input-label" for="music-cover" aria-busy="${busy}"${
					preview ? "" : coverAttr(info)
				}>
                    ${albumCover}
                    <span class="form-cover-caption"${busy ? ' role="status"' : ""}>${
						busy ? t("music.coverWorking") : t("music.chooseCover")
					}</span>
                </label>
            </div>

            <div class="form-fields">
                <div class="form-row">
                    <label class="form-label" for="music-artist">${t("music.artist")}</label>
                    <input class="form-input"
                           id="music-artist"
                           type="text"
                           placeholder="${t("music.artistPlaceholder")}"
                           aria-invalid="${errors.artist ? "true" : "false"}"
                           aria-describedby="music-artist-error"
                           value="${escapeHtml(info.artist)}"
                           data-action-input="music-artist">
                    <span class="field-error" id="music-artist-error">${escapeHtml(t(errors.artist))}</span>
                </div>

                <div class="form-row">
                    <label class="form-label" for="music-title">${t("music.titleLabel")}</label>
                    <input class="form-input"
                           id="music-title"
                           type="text"
                           placeholder="${t("music.titlePlaceholder")}"
                           aria-invalid="${errors.title ? "true" : "false"}"
                           aria-describedby="music-title-error"
                           value="${escapeHtml(info.title)}"
                           data-action-input="music-title">
                    <span class="field-error" id="music-title-error">${escapeHtml(t(errors.title))}</span>
                </div>
            </div>
        </div>

        <span class="field-error" id="music-cover-error">${escapeHtml(t(errors.coverImg))}</span>

        <div class="form-row">
            <label class="form-label" id="music-location-label">${t("music.location")}</label>

            <div class="checkbox-group"
                 role="group"
                 id="music-location-group"
                 tabindex="-1"
                 aria-labelledby="music-location-label"
                 aria-describedby="music-location-error"
                 aria-invalid="${errors.location ? "true" : "false"}">
                ${locationCheckboxes}
                <button
                type="button"
                aria-label="${t("music.addLocationToggle")}"
                aria-expanded="${panels.locationAdd}"
                data-action="toggle-panel"
                data-panel="location-add">${icon("plus")}</button>

                ${
					// Nothing to remove from an empty list, so the control that
					// removes from it does not belong on the page yet.
					model.data.location.length
						? /*HTML*/ `<button
                type="button"
                aria-label="${t("music.removeLocationToggle")}"
                aria-expanded="${panels.locationRemove}"
                data-action="toggle-panel"
                data-panel="location-remove">${icon("close")}</button>`
						: ""
				}
            </div>

            <span class="field-error" id="music-location-error">${escapeHtml(t(errors.location))}</span>

            <form data-action-submit="new-location" ${panels.locationAdd ? "" : "hidden"}>
                <input class="form-input"
                       type="text"
                       placeholder="${t("music.newLocation")}"
                       value="${escapeHtml(model.viewState.editMusicInfo.location)}"
                       data-action-input="chip-location">
                <button aria-label="${t("music.confirmOption")}">${icon("check")}</button>
            </form>

            <form data-action-submit="remove-location" ${
				panels.locationRemove && model.data.location.length ? "" : "hidden"
			}>
                <input class="form-input"
                       type="text"
                       placeholder="${t("music.removeLocation")}"
                       value="${escapeHtml(model.viewState.editMusicInfo.location)}"
                       data-action-input="chip-location">
                <button aria-label="${t("music.confirmOption")}">${icon("check")}</button>
            </form>
        </div>

        <div class="form-row">
            <label class="form-label" for="music-year">${t("music.year")}</label>
            <input class="form-input"
                   id="music-year"
                   type="number"
                   placeholder="${t("music.yearPlaceholder")}"
                   value="${info.releaseYear || ""}"
                   data-action-input="music-year"
                   style="max-width: 140px">
        </div>

        <div class="form-row">
            <label class="form-label" for="music-format">${t("music.format")}</label>
            <select class="form-input"
                    id="music-format"
                    data-action-change="music-format"
                    style="max-width: 200px">
                ${formatOptions}
            </select>
        </div>

        ${barcodeRow}

        <div class="form-row">
            <label class="form-label" id="music-genre-label">${t("music.genre")}</label>

            <div class="checkbox-group"
                 role="group"
                 id="music-genre-group"
                 tabindex="-1"
                 aria-labelledby="music-genre-label"
                 aria-describedby="music-genre-error"
                 aria-invalid="${errors.genre ? "true" : "false"}">
                ${genreBoxes}
                <button
                type="button"
                aria-label="${t("music.addGenreToggle")}"
                aria-expanded="${panels.genreAdd}"
                data-action="toggle-panel"
                data-panel="genre-add">${icon("plus")}</button>

                ${
					model.data.genre.length
						? /*HTML*/ `<button
                type="button"
                aria-label="${t("music.removeGenreToggle")}"
                aria-expanded="${panels.genreRemove}"
                data-action="toggle-panel"
                data-panel="genre-remove">${icon("close")}</button>`
						: ""
				}
            </div>

            <span class="field-error" id="music-genre-error">${escapeHtml(t(errors.genre))}</span>

            <form data-action-submit="new-genre" ${panels.genreAdd ? "" : "hidden"}>
                <input class="form-input"
                       type="text"
                       placeholder="${t("music.newGenre")}"
                       value="${escapeHtml(model.viewState.editMusicInfo.genre)}"
                       data-action-input="chip-genre">
                <button aria-label="${t("music.confirmOption")}">${icon("check")}</button>
            </form>

            <form data-action-submit="remove-genre" ${
				panels.genreRemove && model.data.genre.length ? "" : "hidden"
			}>
                <input class="form-input"
                       type="text"
                       placeholder="${t("music.removeGenre")}"
                       value="${escapeHtml(model.viewState.editMusicInfo.genre)}"
                       data-action-input="chip-genre">
                <button aria-label="${t("music.confirmOption")}">${icon("check")}</button>
            </form>
        </div>

        <div class="form-row">
            <label class="form-label" for="music-notes">${t("music.notes")}</label>
            <textarea class="form-textarea"
                      id="music-notes"
                      placeholder="${t("music.notesPlaceholder")}"
                      data-action-input="music-notes">${escapeHtml(info.notes)}</textarea>
        </div>

        <label class="checkbox-row">
            <input type="checkbox"
                   ${info.wishlist ? "checked" : ""}
                   data-action-change="music-wishlist">
            ${t("music.wishlist")}
        </label>

        <hr class="form-divider">

        <div class="form-actions">
            <div class="form-actions-left">
                <button class="btn btn-accent"
                        data-action="music-save"
                        data-edit="${isEdit}"
                        ${busy ? "disabled" : ""}>${t("music.save")}</button>
            </div>

            <div class="form-actions-right">
                ${
					isEdit
						? /*HTML*/ `<button class="btn btn-danger" data-action="music-delete">${t("music.delete")}</button>`
						: ""
				}
                <a class="btn btn-ghost" href="#homePage" data-action="nav">${t("music.cancel")}</a>
            </div>
        </div >
    </div >
        `;
}
