import {
	initNewAlbum,
	resetMusicFieldErrors,
} from "../../Controller/Edit_Music_Details/editMusic.js";
import {
	clearAuthMessage,
	isLoggedIn,
	resetAuthFieldErrors,
	syncNavbar,
} from "../../Controller/Login/login.js";
import { clearBackupMessage } from "../../Controller/Universal/backup.js";
import { syncChrome } from "../../Controller/Universal/navbarMobile.js";
import { applyStaticText, t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { aboutPage } from "../About/view.js";
import { addDetailsPage, editDetailsPage } from "../Add_Or_Edit_New_Music/view.js";
import { homeView } from "../Homepage/view.js";
import { loginPage } from "../Login/view.js";
import { viewDetailsPage } from "../Music_Details/view.js";
import { notFoundPage } from "../NotFound/view.js";
import { profilePage } from "../Profile/view.js";
import { registerPage } from "../Register/view.js";
import { searchPage } from "../Search/view.js";
import { welcomePage } from "../Welcome/view.js";
import { wishListPage } from "../Wishlist/view.js";

export function updateView() {
	let html = storageBanner();

	if (model.app.currentPage == "welcome") html += welcomePage();
	else if (model.app.currentPage == "homePage") html += homeView();
	else if (model.app.currentPage == "searchPage") html += searchPage();
	else if (model.app.currentPage == "wishList") html += wishListPage();
	else if (model.app.currentPage == "viewDetails") html += viewDetailsPage();
	else if (model.app.currentPage == "addDetails") html += addDetailsPage();
	else if (model.app.currentPage == "editDetails") html += editDetailsPage();
	else if (model.app.currentPage == "profile") html += profilePage();
	else if (model.app.currentPage == "login") html += loginPage();
	else if (model.app.currentPage == "register") html += registerPage();
	else if (model.app.currentPage == "about") html += aboutPage();
	// Catch-all, not just the "notFound" page itself: a page name that reaches
	// here without a branch would otherwise render as an empty content area.
	else html += notFoundPage();

	model.app.app.innerHTML = html;
	syncNavbar();
	syncChrome();
	// The navbar and footer live outside #app, so the re-render above never
	// reaches them. Re-apply the current language to that static chrome here so
	// it can't drift out of sync with the page.
	applyStaticText();
}

function storageBanner() {
	if (model.app.storageUnavailable) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-error" role="alert">
            ${t("storage.unavailable")}
        </div>`;
	}
	if (model.app.libraryStale) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-error" role="alert">
            ${t("storage.otherTab")}
        </div>`;
	}
	if (model.app.storageQuotaExceeded) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-error" role="alert">
            ${t("storage.quotaExceeded")}
        </div>`;
	}
	if (model.app.storageError) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-error" role="alert">
            ${t(model.app.storageError)}
        </div>`;
	}
	const storage = model.app.storage;
	if (storage && storage.percent >= 80) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-warn" role="status">
            ${t("storage.warn", { percent: storage.percent })}
        </div>`;
	}
	return "";
}

export function changePage(element) {
	const publicPages = ["welcome", "login", "register", "about", "notFound"];

	// changePage() used to trust its argument, so a typo in an onclick handler
	// set currentPage to a name nothing renders. Unknown names land on the
	// not-found view instead of a blank page.
	if (!model.app.allPages.includes(element)) {
		console.warn(`[router] unknown page: ${element}`);
		element = "notFound";
	}

	if (!isLoggedIn() && !publicPages.includes(element)) {
		model.app.currentPage = "welcome";
		updateView();
		return;
	}

	if (element === "addDetails") {
		initNewAlbum();
	}

	model.app.currentPage = element;
	clearAuthMessage();
	clearBackupMessage();
	resetAuthFieldErrors();
	resetMusicFieldErrors();
	updateView();
}
