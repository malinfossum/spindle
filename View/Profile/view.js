function profilePage() {
	const user = getLoggedInUser();
	const albums = getProfileAlbums();

	if (!user) {
		return /*HTML*/ `
        <div class="empty-state">
            <div class="empty-state-icon">🔒</div>
            Du må være logget inn for å se profilen.
        </div>
        `;
	}

	const gridHTML = albums
		.map((album) => {
			const albumCover = album.coverImg
				? `<img src="${album.coverImg}" alt="Cover">`
				: "🎵";

			return /*HTML*/ `
            <div class="profile-album-card" onclick="viewMusicDetails(${album.id})">
                <div class="profile-album-img">${albumCover}</div>
                <div class="profile-album-info">
                    <div class="profile-album-title">${album.title}</div>
                    <div class="profile-album-artist">${album.artist}</div>
                </div>
            </div>
            `;
		})
		.join("");

	const storage = model.app.storage;
	const storageBlock = storage
		? /*HTML*/ `
        <div class="profile-storage" role="status">
            <div class="profile-storage-label">Lagring</div>
            <div class="profile-storage-bar">
                <div class="profile-storage-bar-fill" style="width: ${Math.min(storage.percent, 100)}%"></div>
            </div>
            <div class="profile-storage-stats">
                ${formatBytes(storage.usage)} av ${formatBytes(storage.quota)} brukt (${storage.percent}%)
            </div>
        </div>`
		: "";

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">${escapeHtml(user.username)} sin profil</span>
    </div>

    <p class="search-result-count">Mine album: ${albums.length}</p>

    ${storageBlock}

    ${
			albums.length
				? `<div class="profile-grid">${gridHTML}</div>`
				: `<div class="empty-state"><div class="empty-state-icon">🎵</div>Du har ikke lagt til noen album ennå.</div>`
		}
    `;
}
