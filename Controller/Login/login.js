function getLoggedInUser() {
	return isLoggedIn() ? model.data.user : null;
}

function isLoggedIn() {
	return model.app.crypto.unlocked === true;
}

function getAccessibleAlbums() {
	if (!isLoggedIn()) return [];
	return model.data.musicInfo;
}

function getProfileAlbums() {
	return getAccessibleAlbums();
}

function clearAuthMessage() {
	model.app.authMessage = "";
}

function setAuthMessage(message) {
	model.app.authMessage = message;
}

function clearLoginForm() {
	model.viewState.login = {
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

async function login() {
	if (model.app.authBusy) return;

	const password = model.viewState.login.password;
	if (!password) {
		setAuthMessage("Fyll inn passord.");
		updateView();
		return;
	}

	const result = readEnvelope();
	if (!result || !result.ok) {
		setAuthMessage("Ingen bibliotek funnet. Opprett ett først.");
		updateView();
		return;
	}

	try {
		model.app.authBusy = true;
		updateView();

		const saltBytes = base64ToBytes(result.envelope.kdfSalt);
		const ivBytes = base64ToBytes(result.envelope.iv);
		const verifyHmacBytes = base64ToBytes(result.envelope.verifyHmac);
		const ciphertextBytes = base64ToBytes(result.envelope.ciphertext);

		const { verifyKey, encryptKey } = await deriveKeys(password, saltBytes);
		const computedHmac = await computeVerifyHmac(verifyKey);

		if (!constantTimeEqual(computedHmac, verifyHmacBytes)) {
			zeroKeys();
			model.app.authBusy = false;
			setAuthMessage("Feil passord.");
			updateView();
			return;
		}

		let plaintext;
		try {
			plaintext = await decryptLibrary(encryptKey, ivBytes, ciphertextBytes);
		} catch (err) {
			console.error("[auth] decrypt failed:", err);
			zeroKeys();
			model.app.authBusy = false;
			setAuthMessage("Feil passord.");
			updateView();
			return;
		}

		model.data = JSON.parse(plaintext);
		model.app.crypto = {
			unlocked: true,
			encryptKey,
			verifyKey,
			kdfSaltB64: result.envelope.kdfSalt,
			verifyHmacB64: result.envelope.verifyHmac,
		};
		model.app.authBusy = false;
		clearAuthMessage();
		clearLoginForm();
		changePage("homePage");
	} catch (err) {
		console.error("[login] failed:", err);
		zeroKeys();
		model.app.authBusy = false;
		setAuthMessage("En uventet feil oppsto. Prøv igjen.");
		updateView();
	}
}

function logout() {
	zeroKeys();

	// Replace the library with an empty shell so a racing re-render can't briefly
	// show the previous library before the login page mounts.
	model.data = {
		genre: [],
		location: [],
		musicInfo: [],
		user: { username: "" },
	};

	clearLoginForm();
	clearRegisterForm();
	model.viewState.musicInfo = {
		id: null,
		title: "",
		artist: "",
		location: [],
		releaseYear: null,
		genre: [],
		notes: "",
		wishlist: false,
		coverImg: null,
	};
	model.viewState.searchBar = "";

	clearAuthMessage();
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
