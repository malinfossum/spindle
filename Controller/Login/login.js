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
		errors: { password: "" },
	};
}

function clearRegisterForm() {
	model.viewState.createProfile = {
		username: "",
		password: "",
		repeatPassword: "",
		errors: { username: "", password: "", repeatPassword: "" },
	};
}

// Wipes every per-field error on both auth forms. Called on navigation so a
// validation error from one visit never lingers into the next.
function resetAuthFieldErrors() {
	model.viewState.login.errors = { password: "" };
	model.viewState.createProfile.errors = {
		username: "",
		password: "",
		repeatPassword: "",
	};
}

// Clears one field's error the instant the user edits it. Updates the DOM
// directly instead of re-rendering — exactly like renderStrength — because
// calling updateView() on every keystroke would drop the input's focus.
function clearFieldError(input, formName, fieldName) {
	const errors = model.viewState[formName].errors;
	if (!errors[fieldName]) return;

	errors[fieldName] = "";
	input.setAttribute("aria-invalid", "false");

	const span = document.getElementById(`${input.id}-error`);
	if (span) span.textContent = "";
}

// After a failed submit, send focus to the first field flagged invalid so a
// keyboard or screen-reader user lands on the problem and hears its linked error.
function focusFirstInvalid() {
	const field = model.app.app.querySelector('[aria-invalid="true"]');
	if (field) field.focus();
}

async function login() {
	if (model.app.authBusy) return;

	const password = model.viewState.login.password;
	if (!password) {
		model.viewState.login.errors = { password: "error.fillPassword" };
		clearAuthMessage();
		updateView();
		focusFirstInvalid();
		return;
	}

	// Past the empty check — any field error from a previous attempt is stale.
	model.viewState.login.errors = { password: "" };

	const result = readEnvelope();
	if (!result || !result.ok) {
		setAuthMessage("error.noLibraryFound");
		updateView();
		return;
	}

	try {
		model.app.authBusy = true;
		clearAuthMessage();
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
			model.viewState.login.errors = { password: "error.wrongPassword" };
			updateView();
			focusFirstInvalid();
			return;
		}

		let plaintext;
		try {
			plaintext = await decryptLibrary(encryptKey, ivBytes, ciphertextBytes);
		} catch (err) {
			console.error("[auth] decrypt failed:", err);
			zeroKeys();
			model.app.authBusy = false;
			model.viewState.login.errors = { password: "error.wrongPassword" };
			updateView();
			focusFirstInvalid();
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
		setAuthMessage("error.unexpected");
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
	changePage("welcome");
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

	const loginLabel = t(user ? "nav.logout" : "nav.login");
	if (loginDesktop) loginDesktop.textContent = loginLabel;
	if (loginMobile) loginMobile.textContent = loginLabel;

	const profileLabel = t("nav.profile");
	if (profileDesktop) {
		profileDesktop.textContent = profileLabel;
		profileDesktop.style.display = user ? "inline-flex" : "none";
	}
	if (profileMobile) {
		profileMobile.textContent = profileLabel;
		profileMobile.style.display = user ? "inline-flex" : "none";
	}
}
