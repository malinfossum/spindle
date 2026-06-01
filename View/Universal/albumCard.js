function createAlbumCard(album) {
	const genre = album.genre.map((i) => model.data.genre[i]).join(", ") || "—";
	const location =
		album.location.map((i) => model.data.location[i]).join(", ") || "—";
	const albumCover = album.coverImg
		? /*HTML*/ `<img src="${escapeHtml(album.coverImg)}" alt="Cover">`
		: "🎵";

	return /*HTML*/ `
    <div class="album-card" onclick="viewMusicDetails(${album.id})">
        <div class="album-cover">${albumCover}</div>

        <div class="album-info">
            <div class="album-title">${escapeHtml(album.title)}</div>
            <div class="album-artist">${escapeHtml(album.artist)}</div>
            <div class="album-meta">
                <span class="tag">${escapeHtml(genre)}</span>
                <span class="tag">📍 ${escapeHtml(location)}</span>
                <span class="tag">📅 ${album.releaseYear || "—"}</span>
                ${album.wishlist ? '<span class="tag">⭐ Ønskeliste</span>' : ""}
            </div>
        </div>

        <div class="album-actions">
            <button class="btn btn-ghost" onclick="event.stopPropagation(); viewMusicDetails(${album.id})">Se</button>
            <button class="btn btn-danger" onclick="event.stopPropagation(); deleteAlbum(${album.id})">Slett</button>
        </div>
    </div>
    `;
}
