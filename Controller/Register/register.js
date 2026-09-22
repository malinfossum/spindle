import {
	bytesToBase64,
	computeVerifyHmac,
	deriveKeys,
	encryptLibrary,
	KDF_SALT_BYTES,
	randomBytes,
	validatePassword,
} from "../../Model/auth.js";
import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { SCHEMA_VERSION, STORAGE_KEY } from "../../Model/persistence.js";
import { setPref } from "../../Model/prefs.js";
import { clearAuthMessage, setAuthMessage } from "../../Model/viewState.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { updateView } from "../../View/Universal/updateView.js";
import { clearRegisterForm, focusFirstInvalid } from "../Login/login.js";
import { navigate } from "../Universal/router.js";

export async function register() {
	if (model.app.authBusy) return;

	const username = model.viewState.createProfile.username.trim();
	const password = model.viewState.createProfile.password;
	const repeatPassword = model.viewState.createProfile.repeatPassword;

	const errors = { username: "", password: "", repeatPassword: "" };

	if (!username) errors.username = "error.fillUsername";

	if (!password) {
		errors.password = "error.fillPassword";
	} else {
		const check = validatePassword(password);
		if (!check.ok) errors.password = check.error;
	}

	if (!repeatPassword) {
		errors.repeatPassword = "error.repeatPassword";
	} else if (password && password !== repeatPassword) {
		errors.repeatPassword = "error.passwordsDiffer";
	}

	if (errors.username || errors.password || errors.repeatPassword) {
		model.viewState.createProfile.errors = errors;
		clearAuthMessage();
		updateView();
		focusFirstInvalid();
		return;
	}

	// Validation passed — drop any field errors from a previous attempt.
	model.viewState.createProfile.errors = {
		username: "",
		password: "",
		repeatPassword: "",
	};

	try {
		model.app.authBusy = true;
		updateView();

		// A library already exists (e.g. another tab created one) — don't clobber it.
		if (localStorage.getItem(STORAGE_KEY)) {
			model.app.authBusy = false;
			setAuthMessage("error.libraryInOtherTab");
			updateView();
			return;
		}

		const saltBytes = randomBytes(KDF_SALT_BYTES);
		const { verifyKey, encryptKey } = await deriveKeys(password, saltBytes);

		const newData = {
			user: { username },
			// A new library starts completely empty: no albums, and no genres or
			// locations invented on the owner's behalf. The home page already has
			// an empty state and a prominent add button, which is a better first
			// screen than records and shelves nobody chose. Both lists are built
			// from the ➕ controls on the add-album form.
			genre: [],
			location: [],
			musicInfo: [],
		};

		const verifyHmacBytes = await computeVerifyHmac(verifyKey);
		const { iv, ciphertext } = await encryptLibrary(encryptKey, JSON.stringify(newData));

		// Re-check the race window between the first guard and this write.
		if (localStorage.getItem(STORAGE_KEY)) {
			model.app.authBusy = false;
			setAuthMessage("error.libraryInOtherTab");
			updateView();
			return;
		}

		const kdfSaltB64 = bytesToBase64(saltBytes);
		const verifyHmacB64 = bytesToBase64(verifyHmacBytes);
		const envelope = {
			schemaVersion: SCHEMA_VERSION,
			kdfSalt: kdfSaltB64,
			iv: bytesToBase64(iv),
			verifyHmac: verifyHmacB64,
			ciphertext: bytesToBase64(ciphertext),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));

		model.data = newData;
		model.app.crypto = {
			unlocked: true,
			encryptKey,
			verifyKey,
			kdfSaltB64,
			verifyHmacB64,
		};
		model.app.authBusy = false;
		clearRegisterForm();
		clearAuthMessage();
		updateView();

		// Asked here, once, because a library is created once (v0.5). The No
		// button is an answer and is never asked again; Escape, Back and the
		// backdrop are someone getting their bearings, and the press dialog
		// asks on their first Look up instead. Anyone who created a library
		// before v0.5 has no answer stored and meets that dialog too.
		const answer = await openDialog({
			title: t("dialog.lookupsAskTitle"),
			body: t("dialog.lookupsAskBody"),
			confirmText: t("dialog.lookupsAskConfirm"),
			cancelText: t("dialog.lookupsAskCancel"),
			outcomes: true,
		});
		if (answer === "confirm") setPref("lookups", "on");
		if (answer === "cancel") setPref("lookups", "off");

		navigate("homePage");
	} catch (err) {
		console.error("[register] failed:", err);
		model.app.authBusy = false;
		setAuthMessage(err.name === "QuotaExceededError" ? "error.noSpace" : "error.unexpected");
		updateView();
	}
}
