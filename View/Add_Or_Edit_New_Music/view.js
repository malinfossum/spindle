function addDetailsPage() {
	return buildMusicForm(false);
}

function editDetailsPage() {
	return buildMusicForm(true);
}

function buildMusicForm(isEdit) {
	const info = model.viewState.musicInfo;

	const locationCheckboxes = model.data.location
		.map(
			(loc, i) => /*HTML*/ `
        <label class="checkbox-option">
            <input type="radio"
                   name="location"
                   ${info.location.includes(i) ? "checked" : ""}
                   onchange="toggleLocationCheckbox(this, ${i})">
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
                   onchange="toggleGenreCheckbox(this, ${i})">
            ${escapeHtml(loc)}
        </label>
    `,
		)
		.join("");

	const albumCover = info.coverImg
		? /*HTML*/ `<img src="${escapeHtml(info.coverImg)}" alt="Cover" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`
		: /*HTML*/ `<span class="form-cover-icon">🎵</span>`;

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">${isEdit ? "Rediger album" : "Legg til album"}</span>
    </div>

    <div class="form-card">
        <div class="form-top">
            <div class="form-cover-slot" title="Endre coverbilde">
                ${albumCover}
                <input class="form-cover-set-image"
                       type="file"
                       accept="image/*"
                       onchange="saveImage(this)">
            </div>

            <div class="form-fields">
                <div class="form-row">
                    <label class="form-label">Artist</label>
                    <input class="form-input"
                           type="text"
                           placeholder="Artistnavn"
                           value="${escapeHtml(info.artist)}"
                           oninput="model.viewState.musicInfo.artist = this.value">
                </div>

                <div class="form-row">
                    <label class="form-label">Album / Singel / EP</label>
                    <input class="form-input"
                           type="text"
                           placeholder="Tittel"
                           value="${escapeHtml(info.title)}"
                           oninput="model.viewState.musicInfo.title = this.value">
                </div>
            </div>
        </div>

        <div class="form-row">
            <label class="form-label">Lokasjon</label>

            <div class="checkbox-group">
                ${locationCheckboxes}
                <button
                type="button"
                onclick="model.app.showLocationInput=!model.app.showLocationInput;
                updateView()">➕</button>

                <button
                type="button"
                onclick="model.app.showDeleteLocationInput=!model.app.showDeleteLocationInput;
                updateView()">✖️</button>
            </div>

            <form onsubmit="newLocation(event)" style="visibility: ${model.app.showLocationInput ? "hidden" : "visible"};">
                <input class="form-input"
                       type="text"
                       placeholder="Ny lokasjon?"
                       value="${escapeHtml(model.viewState.editMusicInfo.location)}"
                       oninput="model.viewState.editMusicInfo.location = this.value">
                <button>✔️</button>
            </form>

            <form onsubmit="removeLocation(event)" style="visibility: ${model.app.showDeleteLocationInput ? "hidden" : "visible"};">
                <input class="form-input"
                       type="text"
                       placeholder="Fjern lokasjon?"
                       value="${escapeHtml(model.viewState.editMusicInfo.location)}"
                       oninput="model.viewState.editMusicInfo.location = this.value">
                <button>✔️</button>
            </form>
        </div>

        <div class="form-row">
            <label class="form-label">Årstall</label>
            <input class="form-input"
                   type="number"
                   placeholder="f.eks. 1997"
                   value="${info.releaseYear || ""}"
                   oninput="model.viewState.musicInfo.releaseYear = parseInt(this.value) || null"
                   style="max-width: 140px">
        </div>

        <div class="form-row">
            <label class="form-label">Sjanger</label>

            <div class="checkbox-group">
                ${genreBoxes}
                <button
                type="button"
                onclick="model.app.showGenreInput=!model.app.showGenreInput;
                updateView()">➕</button>

                <button
                type="button"
                onclick="model.app.showDeleteGenreInput=!model.app.showDeleteGenreInput;
                updateView()">✖️</button>
            </div>

            <form onsubmit="newGenre(event)" style="visibility: ${model.app.showGenreInput ? "hidden" : "visible"};">
                <input class="form-input"
                       type="text"
                       placeholder="Ny sjanger?"
                       value="${escapeHtml(model.viewState.editMusicInfo.genre)}"
                       oninput="model.viewState.editMusicInfo.genre = this.value">
                <button>✔️</button>
            </form>

            <form onsubmit="removeGenre(event)" style="visibility: ${model.app.showDeleteGenreInput ? "hidden" : "visible"};">
                <input class="form-input"
                       type="text"
                       placeholder="Fjern sjanger?"
                       value="${escapeHtml(model.viewState.editMusicInfo.genre)}"
                       oninput="model.viewState.editMusicInfo.genre = this.value">
                <button>✔️</button>
            </form>
        </div>

        <div class="form-row">
            <label class="form-label">Notater</label>
            <textarea class="form-textarea"
                      placeholder="Egne notater om albumet…"
                      oninput="model.viewState.musicInfo.notes = this.value">${escapeHtml(info.notes)}</textarea>
        </div>

        <label class="checkbox-row">
            <input type="checkbox"
                   ${info.wishlist ? "checked" : ""}
                   onchange="model.viewState.musicInfo.wishlist = this.checked">
            Ønskeliste
        </label>

        <hr class="form-divider">

        <div class="form-actions">
            <div class="form-actions-left">
                <button class="btn btn-accent" onclick="submitChanges(${isEdit})">Lagre</button>
            </div>
            
            <div class="form-actions-right">
                ${
									isEdit
										? /*HTML*/ `<button class="btn btn-danger" onclick="deleteAlbum(model.viewState.musicInfo.id)">Slett</button>`
										: ""
								}
                <button class="btn btn-ghost" onclick="changePage('homePage')">Avbryt</button>
            </div>
        </div >
    </div >
        `;
}
