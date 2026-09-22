// The one-line auth message, wherever a page needs it. Login and Register
// carried the same three lines each; v0.5 needs it on Home ("logged in, but
// this device could not be kept unlocked"), on Profile (the stay toggle) and
// on Welcome (a logout whose stored key would not clear), so it is one
// function. It is transient: resetTransientViewState() clears it on every
// navigation, which is why a caller that navigates first sets it after.

import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { escapeHtml } from "./escape.js";

export function authNotice() {
	if (!model.app.authMessage) return "";
	return /*HTML*/ `<p class="auth-error" role="alert">${escapeHtml(t(model.app.authMessage))}</p>`;
}
