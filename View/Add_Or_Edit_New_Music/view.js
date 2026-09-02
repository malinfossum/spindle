import { t } from "../../Model/i18n/i18n.js";
import { ALBUM_FORMATS, formatLabelKey, model } from "../../Model/model.js";
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
                <input class="file-input-hidden"
                       id="music-cover"
                       type="file"
                       accept="image/jpeg,image/png,image/webp"
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

                <button
                type="button"
                aria-label="${t("music.removeLocationToggle")}"
                aria-expanded="${panels.locationRemove}"
                data-action="toggle-panel"
                data-panel="location-remove">${icon("close")}</button>
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

            <form data-action-submit="remove-location" ${panels.locationRemove ? "" : "hidden"}>
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

                <button
                type="button"
                aria-label="${t("music.removeGenreToggle")}"
                aria-expanded="${panels.genreRemove}"
                data-action="toggle-panel"
                data-panel="genre-remove">${icon("close")}</button>
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

            <form data-action-submit="remove-genre" ${panels.genreRemove ? "" : "hidden"}>
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
                <button class="btn btn-ghost" data-action="nav" data-page="homePage">${t("music.cancel")}</button>
            </div>
        </div >
    </div >
        `;
}
