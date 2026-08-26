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

			// Unlike the album card this one holds no nested buttons, so the whole
			// card can simply BE the button — one tab stop, named after the album,
			// and the entire tile is the target. Inner elements are spans because
			// <button> only takes phrasing content; the stylesheet gives them back
			// their block layout.
			return /*HTML*/ `
            <button class="profile-album-card"
                    type="button"
                    data-action="view-album"
                    data-id="${album.id}">
                <span class="profile-album-img">${albumCover}</span>
                <span class="profile-album-info">
                    <span class="profile-album-title">${escapeHtml(album.title)}</span>
                    <span class="profile-album-artist">${escapeHtml(album.artist)}</span>
                </span>
            </button>
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
	// account-level controls already live — storage, and now backup/restore.
	// The plaintext export is offered here and nowhere else: it serialises the
	// decrypted library, so it needs a library that is already unlocked.
	const settingsBlock = /*HTML*/ `
        <div class="profile-settings">
            <h2 class="profile-settings-heading">${t("profile.settings")}</h2>
            <div class="profile-settings-row">
                <span class="profile-settings-label" id="profile-language-label">${t("profile.language")}</span>
                ${langSwitcher("", "profile-language-label")}
            </div>

            <h2 class="profile-settings-heading">${t("backup.title")}</h2>
            ${backupSection({ idPrefix: "profile", allowPlaintext: true })}
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
