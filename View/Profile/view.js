function profilePage() {
	const user = getLoggedInUser();
	const albums = getProfileAlbums();

	if (!user) {
		return /*HTML*/ `
        <div class="empty-state">
            <div class="empty-state-icon">🔒</div>
            ${t("profile.loginRequired")}
        </div>
        `;
	}

	const gridHTML = albums
		.map((album) => {
			const albumCover = album.coverImg
				? `<img src="${escapeHtml(album.coverImg)}" alt="${t("music.coverAlt")}">`
				: "🎵";

			return /*HTML*/ `
            <div class="profile-album-card" onclick="viewMusicDetails(${album.id})">
                <div class="profile-album-img">${albumCover}</div>
                <div class="profile-album-info">
                    <div class="profile-album-title">${escapeHtml(album.title)}</div>
                    <div class="profile-album-artist">${escapeHtml(album.artist)}</div>
                </div>
            </div>
            `;
		})
		.join("");

	const storage = model.app.storage;
	const storageBlock = storage
		? /*HTML*/ `
        <div class="profile-storage" role="status">
            <div class="profile-storage-label">${t("profile.storage")}</div>
            <div class="profile-storage-bar">
                <div class="profile-storage-bar-fill" style="width: ${Math.min(storage.percent, 100)}%"></div>
            </div>
            <div class="profile-storage-stats">
                ${t("profile.storageStats", {
									used: formatBytes(storage.usage),
									total: formatBytes(storage.quota),
									percent: storage.percent,
								})}
            </div>
        </div>`
		: "";

	// The welcome page's language switcher is only reachable while logged out, so
	// the setting needs a home inside the app too. Profile is where the other
	// account-level controls already live (storage, and export/import in task J).
	const settingsBlock = /*HTML*/ `
        <div class="profile-settings">
            <div class="profile-settings-row">
                <span class="profile-settings-label" id="profile-language-label">${t("profile.language")}</span>
                ${langSwitcher("", "profile-language-label")}
            </div>
        </div>`;

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">${t("profile.title", { username: escapeHtml(user.username) })}</span>
    </div>

    <p class="search-result-count">${t("profile.myAlbums", { count: albums.length })}</p>

    ${storageBlock}
    ${settingsBlock}

    ${
			albums.length
				? `<div class="profile-grid">${gridHTML}</div>`
				: `<div class="empty-state"><div class="empty-state-icon">🎵</div>${t("profile.noAlbums")}</div>`
		}
    `;
}
