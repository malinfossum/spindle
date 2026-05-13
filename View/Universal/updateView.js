updateView();

function updateView() {
	let html = "";

	if (model.app.currentPage == "homePage") html = homeView();
	else if (model.app.currentPage == "searchPage") html = searchPage();
	else if (model.app.currentPage == "wishList") html = wishListPage();
	else if (model.app.currentPage == "viewDetails") html = viewDetailsPage();
	else if (model.app.currentPage == "addDetails") html = addDetailsPage();
	else if (model.app.currentPage == "editDetails") html = editDetailsPage();
	else if (model.app.currentPage == "profile") html = profilePage();
	else if (model.app.currentPage == "login") html = loginPage();
	else if (model.app.currentPage == "register") html = registerPage();

	model.app.app.innerHTML = html;
	syncNavbar();
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
