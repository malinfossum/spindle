function getLoggedInUser() {
	return (
		model.data.users.find((user) => user.id === model.app.loggedInID) || null
	);
}

function isLoggedIn() {
	return getLoggedInUser() !== null;
}

function isAdmin() {
	const user = getLoggedInUser();
	return user?.role === "admin";
}

function isChild() {
	const user = getLoggedInUser();
	return user?.role === "child";
}

function getAccessibleAlbums() {
	if (!isLoggedIn()) return [];
	if (isAdmin()) return model.data.musicInfo;
	return model.data.musicInfo.filter(
		(album) => album.ownerId === model.app.loggedInID,
	);
}

function getProfileAlbums() {
	if (!isLoggedIn()) return [];
	return model.data.musicInfo.filter(
		(album) => album.ownerId === model.app.loggedInID,
	);
}

function canManageAlbum(album) {
	if (!album || !isLoggedIn()) return false;
	if (isAdmin()) return true;
	return album.ownerId === model.app.loggedInID;
}

function clearAuthMessage() {
	model.app.authMessage = "";
}

function setAuthMessage(message) {
	model.app.authMessage = message;
}

function clearLoginForm() {
	model.viewState.login = {
		username: "",
		password: "",
	};
}

function clearRegisterForm() {
	model.viewState.createProfile = {
		username: "",
		password: "",
		repeatPassword: "",
	};
}

function login() {
	const username = model.viewState.login.username.trim();
	const password = model.viewState.login.password;

	if (!username || !password) {
		setAuthMessage("Fyll inn brukernavn og passord.");
		updateView();
		return;
	}

	const user = model.data.users.find(
		(u) =>
			u.username.toLowerCase() === username.toLowerCase() &&
			u.password === password,
	);

	if (!user) {
		setAuthMessage("Feil brukernavn eller passord.");
		updateView();
		return;
	}

	model.app.loggedInID = user.id;
	clearAuthMessage();
	clearLoginForm();
	changePage("homePage");
}

function logout() {
	model.app.loggedInID = null;
	clearAuthMessage();
	clearLoginForm();
	clearRegisterForm();
	changePage("login");
}

function handleLoginNavClick() {
	if (isLoggedIn()) {
		logout();
		return;
	}
	changePage("login");
}

function handleProfileNavClick() {
	if (!isLoggedIn()) {
		changePage("login");
		return;
	}
	changePage("profile");
}

function syncNavbar() {
	const user = getLoggedInUser();

	const loginDesktop = document.getElementById("nav-login-desktop");
	const loginMobile = document.getElementById("nav-login-mobile");
	const profileDesktop = document.getElementById("nav-profile-desktop");
	const profileMobile = document.getElementById("nav-profile-mobile");

	if (loginDesktop) loginDesktop.textContent = user ? "Logg ut" : "Logg inn";
	if (loginMobile) loginMobile.textContent = user ? "Logg ut" : "Logg inn";

	if (profileDesktop) {
		profileDesktop.style.display = user ? "inline-flex" : "none";
	}
	if (profileMobile) {
		profileMobile.style.display = user ? "inline-flex" : "none";
	}
}
