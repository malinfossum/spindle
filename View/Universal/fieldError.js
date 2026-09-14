// Patches one field's inline error in place, on purpose — this runs on every
// keystroke, and updateView() replaces #app's innerHTML, which would drop the
// input's focus. Same shape as renderStrength() in the register view. The two
// rules here are the ones every form template applies when it renders the
// field: aria-invalid says whether there is an error, and the span with the
// `<input id>-error` id carries its translated text.

import { t } from "../../Model/i18n/i18n.js";

export function renderFieldError(input, errorKey) {
	input.setAttribute("aria-invalid", errorKey ? "true" : "false");

	const span = document.getElementById(`${input.id}-error`);
	if (span) span.textContent = errorKey ? t(errorKey) : "";
}
