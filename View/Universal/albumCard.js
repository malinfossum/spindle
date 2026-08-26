// The whole card opens the album, but the card itself is a <div> — it holds two
// buttons, so it cannot be one. A <div> with a click handler is invisible to the
// keyboard, and role="button" + tabindex would only paper over that.
//
// So the title is the real control, and its ::after is stretched over the card
// (see .album-open in the stylesheet). One tab stop, named after the album,
// with the entire card as its pointer target. .album-actions is raised back
// above the overlay so View and Delete still get their own clicks.
//
// This is the pseudo-element hit-area trick that does NOT work for segmented
// controls: there, adjacent expanded areas overlap and steal each other's
// clicks. Here each overlay is bounded by its own card and the cards are spaced
// apart, so nothing overlaps.
function createAlbumCard(album) {
	const genre = album.genre.map((i) => model.data.genre[i]).join(", ") || "—";
	const location = album.location.map((i) => model.data.location[i]).join(", ") || "—";
	const albumCover = album.coverImg
		? /*HTML*/ `<img src="${escapeHtml(album.coverImg)}" alt="${t("music.coverAlt")}">`
		: "🎵";

	return /*HTML*/ `
    <div class="album-card">
        <div class="album-cover">${albumCover}</div>

        <div class="album-info">
            <button class="album-title album-open"
                    type="button"
                    data-action="view-album"
                    data-id="${album.id}">${escapeHtml(album.title)}</button>
            <div class="album-artist">${escapeHtml(album.artist)}</div>
            <div class="album-meta">
                <span class="tag">${escapeHtml(genre)}</span>
                <span class="tag">📍 ${escapeHtml(location)}</span>
                <span class="tag">📅 ${album.releaseYear || "—"}</span>
                ${album.wishlist ? `<span class="tag">⭐ ${t("music.wishlist")}</span>` : ""}
            </div>
        </div>

        <div class="album-actions">
            <button class="btn btn-ghost" data-action="view-album" data-id="${album.id}">${t("music.view")}</button>
            <button class="btn btn-danger" data-action="delete-album" data-id="${album.id}">${t("music.delete")}</button>
        </div>
    </div>
    `;
}
