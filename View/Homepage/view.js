// Home — the page you open to put a record in, not the page you browse.
//
// The whole point of Spindle is cataloguing a shelf you are standing in front
// of, so the first thing on this page is the way to add one, at a size you can
// hit without looking. Under it is what was added most recently, which is the
// only slice of the library that answers a question you have while standing
// there: did I already do this one?
//
// Everything else about browsing — the full list, filters, sorting — is the
// library page. This one stays short on purpose.

import { t } from "../../Model/i18n/i18n.js";
import { getAccessibleAlbums, getRecentAlbums } from "../../Model/selectors.js";
import { createAlbumCard } from "../Universal/albumCard.js";
import { icon } from "../Universal/icons.js";

export function homeView() {
	const total = getAccessibleAlbums().length;
	const recent = getRecentAlbums();

	const capture = /*HTML*/ `
    <div class="home-capture">
        <a class="btn btn-accent home-add" href="#addDetails" data-action="nav">
            ${icon("plus", { size: 22 })}
            <span>${t("home.add")}</span>
        </a>
    </div>`;

	if (total === 0) {
		return /*HTML*/ `
        ${capture}

        <div class="empty-state">
            <div class="empty-state-icon">${icon("disc", { size: 48 })}</div>
            ${t("library.empty")}
        </div>`;
	}

	return /*HTML*/ `
    ${capture}

    <div class="page-header">
        <span class="page-title">${t("home.recent")}</span>
        <a class="btn btn-ghost" href="#library" data-action="nav-list">${t("home.seeAll", { count: total })}</a>
    </div>

    ${recent.map((album) => createAlbumCard(album)).join("")}
    `;
}
