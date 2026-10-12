// Delete library (v0.9, docs/v0.9-plan.md). Reached from Profile and from the
// "Can't open the library?" panel on the login page; the same dialog either way.
// No password: the login path cannot ask for one, and anyone holding the device
// can already clear the site's data.

import { clearLibraryStores } from "../../Model/db.js";
import { wipeLibrary } from "../../Model/deleteLibrary.js";
import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { STORAGE_KEY } from "../../Model/persistence.js";
import { setPref } from "../../Model/prefs.js";
import { setAuthMessage } from "../../Model/viewState.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { appRoot, updateView } from "../../View/Universal/updateView.js";
import { logout } from "../Login/login.js";

export async function confirmDeleteLibrary() {
	const word = t("delete.word");
	const confirmed = await openDialog({
		title: t("delete.title"),
		body: t("delete.body"),
		confirmText: t("delete.confirm"),
		danger: true,
		confirmWord: word,
		confirmWordLabel: t("delete.wordLabel", { word }),
		confirmWordMismatch: t("delete.wordMismatch", { word }),
	});
	if (!confirmed) return;

	const result = await wipeLibrary({
		clearStores: clearLibraryStores,
		removeLibrary: () => localStorage.removeItem(STORAGE_KEY),
		resetLookups: () => setPref("lookups", "unset"),
	});

	if (!result.ok) {
		console.warn("[delete] the stores would not clear; nothing removed:", result.error);
		setAuthMessage("delete.failed");
		updateView();
		// The re-render replaced the button, so focus would fall to <body>. Back on
		// the button, then the notice under it scrolled fully into view: focus()
		// alone stops at the button's own edge.
		appRoot.querySelector('[data-action="delete-library"]')?.focus();
		appRoot.querySelector(".delete-failed")?.scrollIntoView({ block: "nearest" });
		return;
	}

	finishDelete("delete.done");
}

// Shared with storageSync.js: after a delete, here or in another tab. The stale
// flag goes too: the library it was stale against no longer exists, and a new
// library in this tab must be able to save.
export function finishDelete(messageKey) {
	model.app.libraryStale = false;
	model.viewState.loginForgotOpen = false;
	logout();
	// logout() navigates, and navigation clears the notice: set it after.
	setAuthMessage(messageKey, "info");
	updateView();
	document.getElementById("welcome-heading")?.focus();
}
