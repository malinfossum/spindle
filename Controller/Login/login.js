import {
	base64ToBytes,
	computeVerifyHmac,
	constantTimeEqual,
	decryptLibrary,
	deriveKeys,
	zeroKeys,
} from "../../Model/auth.js";
import { model } from "../../Model/model.js";
import { readEnvelope } from "../../Model/persistence.js";
import { isLoggedIn } from "../../Model/selectors.js";
import { clearAuthMessage } from "../../Model/viewState.js";
import { updateView } from "../../View/Universal/updateView.js";
import { changePage } from "../Universal/router.js";

export function setAuthMessage(message) {
	model.app.authMessage = message;
}

function clearLoginForm() {
	model.viewState.login = {
		password: "",
		errors: { password: "" },
	};
}

export function clearRegisterForm() {
	model.viewState.createProfile = {
		username: "",
		password: "",
		repeatPassword: "",
		errors: { username: "", password: "", repeatPassword: "" },
	};
}

// Clears one field's error the instant the user edits it. Updates the DOM
// directly instead of re-rendering — exactly like renderStrength — because
// calling updateView() on every keystroke would drop the input's focus.
export function clearFieldError(input, formName, fieldName) {
	const errors = model.viewState[formName].errors;
	if (!errors[fieldName]) return;

	errors[fieldName] = "";
	input.setAttribute("aria-invalid", "false");

	const span = document.getElementById(`${input.id}-error`);
	if (span) span.textContent = "";
}

// After a failed submit, send focus to the first field flagged invalid so a
// keyboard or screen-reader user lands on the problem and hears its linked error.
export function focusFirstInvalid() {
	const field = model.app.app.querySelector('[aria-invalid="true"]');
	if (field) field.focus();
}

export async function login() {
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
	if (!result?.ok) {
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

export function logout() {
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

export function handleLoginNavClick() {
	if (isLoggedIn()) {
		logout();
		return;
	}
	changePage("login");
}

export function handleProfileNavClick() {
	if (!isLoggedIn()) {
		changePage("login");
		return;
	}
	changePage("profile");
}
