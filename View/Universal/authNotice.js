// The one-line auth message, wherever a page needs it. Login and Register
// carried the same three lines each; v0.5 needs it on Home ("logged in, but
// this device could not be kept unlocked"), on Profile (the stay toggle) and
// on Welcome (a logout whose stored key would not clear), so it is one
// function. It is transient: resetTransientViewState() clears it on every
// navigation, which is why a caller that navigates first sets it after.

import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { escapeHtml } from "./escape.js";

// v0.9. A refused delete is said beside the button I pressed, not at the top of
// the page, which on a phone is a screen away from it. Same message slot, so it
// clears on navigation like every other auth message.
const DELETE_FAILED = "delete.failed";

export function authNotice() {
	if (!model.app.authMessage || model.app.authMessage === DELETE_FAILED) return "";
	const text = escapeHtml(t(model.app.authMessage));
	// v0.9: a finished delete is news, not an error. The id lets the start page's
	// heading name it as its description, so it is read once on focus.
	if (model.app.authTone === "info") {
		return /*HTML*/ `<p class="auth-notice" id="auth-notice" role="status">${text}</p>`;
	}
	return /*HTML*/ `<p class="auth-error" role="alert">${text}</p>`;
}

export function deleteFailedNotice() {
	if (model.app.authMessage !== DELETE_FAILED) return "";
	return /*HTML*/ `<p class="auth-error delete-failed" role="alert">${escapeHtml(t(DELETE_FAILED))}</p>`;
}
