function viewDetailsPage() {
	const id = model.viewState.musicInfo.id;
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) {
		return /*HTML*/ `
        <p style="color: var(--text-muted)">Album ikke funnet.</p>
        <button class="btn btn-ghost" onclick="changePage('homePage')">← Tilbake</button>
        `;
	}

	const genre = album.genre.map((i) => model.data.genre[i]).join(", ") || "—";
	const location =
		album.location.map((i) => model.data.location[i]).join(", ") || "—";
	const albumCover = album.coverImg
		? `<img src="${album.coverImg}" alt="Cover">`
		: "🎵";

	return /*HTML*/ `
    <div class="detail-card">
        <div class="detail-top">
            <div class="detail-cover">${albumCover}</div>

            <div class="detail-fields">
                <div class="field-row">
                    <div class="field-label">Artist</div>
                    <div class="field-value">${album.artist}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Album / Singel / EP</div>
                    <div class="field-value">${album.title}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Lokasjon</div>
                    <div class="field-value">${location}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Årstall</div>
                    <div class="field-value">${album.releaseYear || "—"}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Sjanger</div>
                    <div class="field-value">${genre}</div>
                </div>
            </div>
        </div>

        <div class="field-row">
            <div class="field-label">Notater</div>
            <div class="field-value" style="color: var(--text-muted)">
                ${album.notes || "—"}
            </div>
        </div>

        <hr class="detail-divider">

        <label class="checkbox-row">
            <input type="checkbox"
                   ${album.wishlist ? "checked" : ""}
                   onchange="toggleWishlist(${album.id}, this.checked)">
            Ønskeliste
        </label>

        <div class="detail-actions">
            <button class="btn btn-accent" onclick="editAlbum(${album.id})">Rediger</button>
            <button class="btn btn-danger" onclick="deleteAlbum(${album.id})">Slett</button>
            <button class="btn btn-ghost" onclick="changePage('homePage')">Avbryt</button>
        </div>
    </div>
    `;
}
