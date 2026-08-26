import { getAccessibleAlbums } from "../../Controller/Login/login.js";
import { t } from "../../Model/i18n/i18n.js";
import { createAlbumCard } from "../Universal/albumCard.js";

export function wishListPage() {
	const wishlist = getAccessibleAlbums().filter((album) => album.wishlist);

	if (wishlist.length === 0) {
		return /*HTML*/ `
        <div class="page-header">
            <span class="page-title">${t("wishlist.title")}</span>
        </div>

        <div class="empty-state">
            <div class="empty-state-icon">⭐</div>
            ${t("wishlist.empty")}
        </div>
        `;
	}

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">${t("wishlist.titleCount", { count: wishlist.length })}</span>
    </div>

    ${wishlist.map((album) => createAlbumCard(album)).join("")}
    `;
}
