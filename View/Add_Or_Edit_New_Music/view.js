function addDetailsPage() {
	return buildMusicForm(false);
}

function editDetailsPage() {
	return buildMusicForm(true);
}

function buildMusicForm(isEdit) {
	const info = model.viewState.musicInfo;
	const errors = model.viewState.musicForm.errors;

	const locationCheckboxes = model.data.location
		.map(
			(loc, i) => /*HTML*/ `
        <label class="checkbox-option">
            <input type="radio"
                   name="location"
                   ${info.location.includes(i) ? "checked" : ""}
                   onchange="toggleLocationCheckbox(this, ${i}); clearMusicGroupError('location')">
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
                   onchange="toggleGenreCheckbox(this, ${i}); clearMusicGroupError('genre')">
            ${escapeHtml(loc)}
        </label>
    `,
		)
		.join("");

	const albumCover = info.coverImg
		? /*HTML*/ `<img src="${escapeHtml(info.coverImg)}" alt="${t("music.coverAlt")}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`
		: /*HTML*/ `<span class="form-cover-icon">🎵</span>`;

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
            <div class="form-cover-slot" title="${t("music.changeCover")}">
                ${albumCover}
                <input class="form-cover-set-image"
                       id="music-cover"
                       type="file"
                       accept="image/jpeg,image/png,image/webp"
                       aria-invalid="${errors.coverImg ? "true" : "false"}"
                       aria-describedby="music-cover-error"
                       onchange="saveImage(this)">
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
                           oninput="model.viewState.musicInfo.artist = this.value; clearFieldError(this, 'musicForm', 'artist')">
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
                           oninput="model.viewState.musicInfo.title = this.value; clearFieldError(this, 'musicForm', 'title')">
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
                onclick="model.app.showLocationInput=!model.app.showLocationInput;
                updateView()">➕</button>

                <button
                type="button"
                aria-label="${t("music.removeLocationToggle")}"
                onclick="model.app.showDeleteLocationInput=!model.app.showDeleteLocationInput;
                updateView()">✖️</button>
            </div>

            <span class="field-error" id="music-location-error">${escapeHtml(t(errors.location))}</span>

            <form onsubmit="newLocation(event)" style="visibility: ${model.app.showLocationInput ? "hidden" : "visible"};">
                <input class="form-input"
                       type="text"
                       placeholder="${t("music.newLocation")}"
                       value="${escapeHtml(model.viewState.editMusicInfo.location)}"
                       oninput="model.viewState.editMusicInfo.location = this.value">
                <button aria-label="${t("music.confirmOption")}">✔️</button>
            </form>

            <form onsubmit="removeLocation(event)" style="visibility: ${model.app.showDeleteLocationInput ? "hidden" : "visible"};">
                <input class="form-input"
                       type="text"
                       placeholder="${t("music.removeLocation")}"
                       value="${escapeHtml(model.viewState.editMusicInfo.location)}"
                       oninput="model.viewState.editMusicInfo.location = this.value">
                <button aria-label="${t("music.confirmOption")}">✔️</button>
            </form>
        </div>

        <div class="form-row">
            <label class="form-label" for="music-year">${t("music.year")}</label>
            <input class="form-input"
                   id="music-year"
                   type="number"
                   placeholder="${t("music.yearPlaceholder")}"
                   value="${info.releaseYear || ""}"
                   oninput="model.viewState.musicInfo.releaseYear = parseInt(this.value) || null"
                   style="max-width: 140px">
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
                onclick="model.app.showGenreInput=!model.app.showGenreInput;
                updateView()">➕</button>

                <button
                type="button"
                aria-label="${t("music.removeGenreToggle")}"
                onclick="model.app.showDeleteGenreInput=!model.app.showDeleteGenreInput;
                updateView()">✖️</button>
            </div>

            <span class="field-error" id="music-genre-error">${escapeHtml(t(errors.genre))}</span>

            <form onsubmit="newGenre(event)" style="visibility: ${model.app.showGenreInput ? "hidden" : "visible"};">
                <input class="form-input"
                       type="text"
                       placeholder="${t("music.newGenre")}"
                       value="${escapeHtml(model.viewState.editMusicInfo.genre)}"
                       oninput="model.viewState.editMusicInfo.genre = this.value">
                <button aria-label="${t("music.confirmOption")}">✔️</button>
            </form>

            <form onsubmit="removeGenre(event)" style="visibility: ${model.app.showDeleteGenreInput ? "hidden" : "visible"};">
                <input class="form-input"
                       type="text"
                       placeholder="${t("music.removeGenre")}"
                       value="${escapeHtml(model.viewState.editMusicInfo.genre)}"
                       oninput="model.viewState.editMusicInfo.genre = this.value">
                <button aria-label="${t("music.confirmOption")}">✔️</button>
            </form>
        </div>

        <div class="form-row">
            <label class="form-label" for="music-notes">${t("music.notes")}</label>
            <textarea class="form-textarea"
                      id="music-notes"
                      placeholder="${t("music.notesPlaceholder")}"
                      oninput="model.viewState.musicInfo.notes = this.value">${escapeHtml(info.notes)}</textarea>
        </div>

        <label class="checkbox-row">
            <input type="checkbox"
                   ${info.wishlist ? "checked" : ""}
                   onchange="model.viewState.musicInfo.wishlist = this.checked">
            ${t("music.wishlist")}
        </label>

        <hr class="form-divider">

        <div class="form-actions">
            <div class="form-actions-left">
                <button class="btn btn-accent" onclick="submitChanges(${isEdit})">${t("music.save")}</button>
            </div>

            <div class="form-actions-right">
                ${
									isEdit
										? /*HTML*/ `<button class="btn btn-danger" onclick="deleteAlbum(model.viewState.musicInfo.id)">${t("music.delete")}</button>`
										: ""
								}
                <button class="btn btn-ghost" onclick="changePage('homePage')">${t("music.cancel")}</button>
            </div>
        </div >
    </div >
        `;
}
