updateView();

function updateView() {
	let html = storageBanner();

	if (model.app.currentPage == "homePage") html += homeView();
	else if (model.app.currentPage == "searchPage") html += searchPage();
	else if (model.app.currentPage == "wishList") html += wishListPage();
	else if (model.app.currentPage == "viewDetails") html += viewDetailsPage();
	else if (model.app.currentPage == "addDetails") html += addDetailsPage();
	else if (model.app.currentPage == "editDetails") html += editDetailsPage();
	else if (model.app.currentPage == "profile") html += profilePage();
	else if (model.app.currentPage == "login") html += loginPage();
	else if (model.app.currentPage == "register") html += registerPage();

	model.app.app.innerHTML = html;
	syncNavbar();
}

function storageBanner() {
	if (model.app.storageUnavailable) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-error" role="alert">
            Nettleseren har deaktivert lagring for dette nettstedet. Endringer blir ikke lagret.
            Aktiver lagring i nettleserinnstillingene og last inn på nytt.
        </div>`;
	}
	if (model.app.storageQuotaExceeded) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-error" role="alert">
            Lagringen er full. Eksporter biblioteket ditt, og slett deretter gamle coverbilder eller album.
        </div>`;
	}
	if (model.app.storageError) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-error" role="alert">
            ${model.app.storageError}
        </div>`;
	}
	const storage = model.app.storage;
	if (storage && storage.percent >= 80) {
		return /*HTML*/ `
        <div class="storage-banner storage-banner-warn" role="status">
            Lagringen er ${storage.percent}% full. Vurder å slette eller eksportere snart.
        </div>`;
	}
	return "";
}

function changePage(element) {
	const publicPages = ["login", "register"];

	if (!isLoggedIn() && !publicPages.includes(element)) {
		model.app.currentPage = "login";
		updateView();
		return;
	}

	if (element === "addDetails") {
		initNewAlbum();
	}

	model.app.currentPage = element;
	clearAuthMessage();
	updateView();
}
