import {
	base64ToBytes,
	clearSessionKey,
	computeVerifyHmac,
	constantTimeEqual,
	decryptLibrary,
	deriveKeys,
	readSessionKey,
	storeSessionKey,
	zeroKeys,
} from "../../Model/auth.js";
import { migrateInlineCovers, pruneCovers } from "../../Model/covers.js";
import { t } from "../../Model/i18n/i18n.js";
import { blankAlbum, blankLibraryView, model } from "../../Model/model.js";
import { normalizeAlbums, persistState, readEnvelope } from "../../Model/persistence.js";
import { isLoggedIn } from "../../Model/selectors.js";
import { clearAuthMessage, clearSearchHistory, setAuthMessage } from "../../Model/viewState.js";
import { clearCoverCache } from "../../View/Universal/cover.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { renderFieldError } from "../../View/Universal/fieldError.js";
import { appRoot, updateView } from "../../View/Universal/updateView.js";
import { navigate } from "../Universal/router.js";

function clearLoginForm() {
	model.viewState.login = {
		password: "",
		stay: false,
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

// Clears one field's error the instant the user edits it. The state change is
// here; the paint is renderFieldError(), which patches the field in place
// because a full updateView() on every keystroke would drop the input's focus.
export function clearFieldError(input, formName, fieldName) {
	const errors = model.viewState[formName].errors;
	if (!errors[fieldName]) return;

	errors[fieldName] = "";
	renderFieldError(input, "");
}

// After a failed submit, send focus to the first field flagged invalid so a
// keyboard or screen-reader user lands on the problem and hears its linked error.
export function focusFirstInvalid() {
	const field = appRoot.querySelector('[aria-invalid="true"]');
	if (field) field.focus();
}

// The half of login() that turns an envelope into live state, shared with the
// stored-key path at boot so the two cannot drift (v0.5). Throws when the key
// does not open the envelope; the caller decides what that means. verifyKey
// is null on the stored-key path — nothing reads it after login, the HMAC in
// the envelope is what persistState() writes back.
async function unlockWith(encryptKey, envelope, verifyKey = null) {
	const plaintext = await decryptLibrary(
		encryptKey,
		base64ToBytes(envelope.iv),
		base64ToBytes(envelope.ciphertext),
	);

	model.data = JSON.parse(plaintext);
	// The only place a stored library becomes live state, so the only place a
	// record written by an older version has to be brought up to date.
	normalizeAlbums(model.data);
	model.app.crypto = {
		unlocked: true,
		encryptKey,
		verifyKey,
		kdfSaltB64: envelope.kdfSalt,
		verifyHmacB64: envelope.verifyHmac,
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
}

export async function login() {
	if (model.app.authBusy) return;
	model.app.sessionStale = false;
	model.app.sessionClearFailed = false;

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
		const verifyHmacBytes = base64ToBytes(result.envelope.verifyHmac);

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

		try {
			await unlockWith(encryptKey, result.envelope, verifyKey);
		} catch (err) {
			console.error("[auth] decrypt failed:", err);
			zeroKeys();
			model.app.authBusy = false;
			model.viewState.login.errors = { password: "error.wrongPassword" };
			updateView();
			focusFirstInvalid();
			return;
		}

		// After the HMAC check and before Home (v0.5): the key goes to the
		// session store only when the box was ticked. A store that refuses —
		// private mode, storage off, a WebKit that will not clone a CryptoKey
		// — does not fail the login; it fails loudly on Home instead.
		let stayFailed = false;
		if (model.viewState.login.stay) {
			try {
				await storeSessionKey(encryptKey);
				model.app.stayUnlocked = true;
			} catch (err) {
				console.warn("[session] could not store the key:", err);
				model.app.stayUnlocked = false;
				stayFailed = true;
			}
		}

		model.app.authBusy = false;
		clearAuthMessage();
		clearLoginForm();
		navigate("homePage");
		if (stayFailed) {
			// After navigate, which clears it — the message has to survive the move.
			setAuthMessage("login.stayFailed");
			updateView();
		}
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

	// Log out is the lock (v0.5): the stored key goes with the session, in
	// this tab and — the store is shared — in every other tab's next reload.
	// The clear is asynchronous and logout() is not, so a refusal reports
	// after the welcome page is up rather than holding it back.
	model.app.stayUnlocked = false;
	clearSessionKey().catch((err) => {
		console.warn("[session] could not clear the key:", err);
		setAuthMessage("login.stayClearFailed");
		updateView();
	});

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
	model.viewState.library = blankLibraryView();
	model.viewState.musicForm.coverPreview = null;
	model.viewState.searchBar = "";
	clearSearchHistory();

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

// Boot (v0.5): a key kept by "Stay unlocked on this device" opens the library
// before the first route renders, through the same unlockWith() the password
// path uses. A missing key is the normal case and is silent. A key that does
// not open the envelope — a backup restored from another device, a corrupt
// store — is cleared, and the Login page says so; nothing is thrown either way.
export async function restoreSession() {
	let key;
	try {
		key = await readSessionKey();
	} catch (err) {
		console.warn("[session] could not read the store:", err);
		return "none";
	}
	if (!key) return "none";

	const result = readEnvelope();
	if (!result?.ok) {
		// The library is gone or unreadable; a key to nothing is cleared quietly
		// — unless the clear itself fails, which is never quiet: the device
		// stays unlocked to anyone holding it, and resetTransientViewState()
		// (run by the router right after this) would wipe an authMessage
		// before it ever painted, so the flag is the mechanism, not the message.
		await clearSessionKey().catch((err) => {
			console.warn("[session] could not clear the stored key:", err);
			model.app.sessionClearFailed = true;
		});
		return "none";
	}

	try {
		await unlockWith(key, result.envelope);
	} catch (err) {
		console.warn("[session] stored key rejected:", err);
		zeroKeys();
		await clearSessionKey().catch((clearErr) => {
			console.warn("[session] could not clear the stored key:", clearErr);
			model.app.sessionClearFailed = true;
		});
		model.app.sessionStale = true;
		return "stale";
	}

	model.app.stayUnlocked = true;
	return "restored";
}
