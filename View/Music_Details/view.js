import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { coverAttr, coverInner } from "../Universal/cover.js";
import { escapeHtml } from "../Universal/escape.js";

export function viewDetailsPage() {
	const id = model.viewState.musicInfo.id;
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) {
		return /*HTML*/ `
        <p style="color: var(--text-muted)">${t("music.notFound")}</p>
        <button class="btn btn-ghost" data-action="nav" data-page="homePage">${t("music.back")}</button>
        `;
	}

	const genre = album.genre.map((i) => model.data.genre[i]).join(", ") || "—";
	const location = album.location.map((i) => model.data.location[i]).join(", ") || "—";
	const albumCover = coverInner(album, 36);

	return /*HTML*/ `
    <div class="detail-card">
        <div class="detail-top">
            <div class="detail-cover"${coverAttr(album)}>${albumCover}</div>

            <div class="detail-fields">
                <div class="field-row">
                    <div class="field-label">${t("music.artist")}</div>
                    <div class="field-value">${escapeHtml(album.artist)}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">${t("music.titleLabel")}</div>
                    <div class="field-value">${escapeHtml(album.title)}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">${t("music.location")}</div>
                    <div class="field-value">${escapeHtml(location)}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">${t("music.year")}</div>
                    <div class="field-value">${album.releaseYear || "—"}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">${t("music.genre")}</div>
                    <div class="field-value">${escapeHtml(genre)}</div>
                </div>
            </div>
        </div>

        <div class="field-row">
            <div class="field-label">${t("music.notes")}</div>
            <div class="field-value" style="color: var(--text-muted)">
                ${escapeHtml(album.notes || "—")}
            </div>
        </div>

        <hr class="detail-divider">

        <label class="checkbox-row">
            <input type="checkbox"
                   ${album.wishlist ? "checked" : ""}
                   data-action-change="toggle-wishlist"
                   data-id="${album.id}">
            ${t("music.wishlist")}
        </label>

        <div class="detail-actions">
            <button class="btn btn-accent" data-action="edit-album" data-id="${album.id}">${t("music.edit")}</button>
            <button class="btn btn-danger" data-action="delete-album" data-id="${album.id}">${t("music.delete")}</button>
            <button class="btn btn-ghost" data-action="nav" data-page="homePage">${t("music.cancel")}</button>
        </div>
    </div>
    `;
}
