import { t } from "../../Model/i18n/i18n.js";
import { getAccessibleAlbums } from "../../Model/selectors.js";
import { createAlbumCard } from "../Universal/albumCard.js";

export function homeView() {
	const albums = getAccessibleAlbums();

	if (albums.length === 0) {
		return /*HTML*/ `
        <div class="page-header">
            <span class="page-title">${t("library.title")}</span>
            <button class="btn btn-accent" data-action="nav" data-page="addDetails">${t("music.addAlbum")}</button>
        </div>

        <div class="empty-state">
            <div class="empty-state-icon">🎵</div>
            ${t("library.empty")}
        </div>
        `;
	}

	const albumList = albums.map((album) => createAlbumCard(album)).join("");

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">${t("library.titleCount", { count: albums.length })}</span>
        <button class="btn btn-accent" data-action="nav" data-page="addDetails">${t("music.addAlbum")}</button>
    </div>

    ${albumList}
    `;
}
