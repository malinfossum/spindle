import {
	base64ToBytes,
	computeVerifyHmac,
	constantTimeEqual,
	decryptLibrary,
	deriveKeys,
	zeroKeys,
} from "../../Model/auth.js";
import { migrateInlineCovers, pruneCovers } from "../../Model/covers.js";
import { t } from "../../Model/i18n/i18n.js";
import { blankAlbum, model } from "../../Model/model.js";
import { normalizeAlbums, persistState, readEnvelope } from "../../Model/persistence.js";
import { isLoggedIn } from "../../Model/selectors.js";
import { clearAuthMessage, setAuthMessage } from "../../Model/viewState.js";
import { clearCoverCache } from "../../View/Universal/cover.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { updateView } from "../../View/Universal/updateView.js";
import { navigate } from "../Universal/router.js";

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
		// The only place a stored library becomes live state, so the only place a
		// record written by an older version has to be brought up to date.
		normalizeAlbums(model.data);
		model.app.crypto = {
			unlocked: true,
			encryptKey,
			verifyKey,
			kdfSaltB64: result.envelope.kdfSalt,
			verifyHmacB64: result.envelope.verifyHmac,
		};

		// The cache belongs to whichever library was open last. Covers are keyed by
		// a uuid so a collision is not the worry — holding another library's
		// decrypted artwork in memory is.
		clearCoverCache();

		// A library written before covers moved out still carries them inline.
		// Moving them is what makes the save below shrink, so it happens before it.
		try {
			if (await migrateInlineCovers()) persistState();
			await pruneCovers(model.data.musicInfo.map((album) => album.coverId));
		} catch (err) {
			console.warn("[login] cover maintenance skipped:", err);
		}

		model.app.authBusy = false;
		clearAuthMessage();
		clearLoginForm();
		navigate("homePage");
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
	model.viewState.musicInfo = blankAlbum();
	model.viewState.musicForm.coverPreview = null;
	model.viewState.searchBar = "";

	// Decrypted covers are library contents. Locked has to mean locked for them
	// too — the rows in IndexedDB stay, still encrypted.
	clearCoverCache();

	clearAuthMessage();
	navigate("welcome");
}

// The navbar button is login-only: it is hidden while logged in, and logging
// out now lives on the Profile page behind a confirm. It used to swap its own
// label to "Log out" in the slot next to Search and Profile, which is how it
// got pressed by accident.
export function handleLoginNavClick() {
	navigate("login");
}

// Logging out is the one irreversible-feeling action in the app — the library
// is still there, but it takes the password to see it again — so it asks first.
export async function confirmLogout() {
	const confirmed = await openDialog({
		title: t("dialog.logoutTitle"),
		body: t("dialog.logoutBody"),
		confirmText: t("dialog.logoutConfirm"),
	});

	if (confirmed) logout();
}

export function handleProfileNavClick() {
	if (!isLoggedIn()) {
		navigate("login");
		return;
	}
	navigate("profile");
}
