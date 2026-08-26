// Shared export / import block (task J).
//
// Rendered twice: inside the Profile settings panel, and in a collapsed
// <details> on the welcome page. It has to be reachable while logged out because
// the moment you most need to restore a backup — a corrupt library, a wiped
// browser profile — is the moment you cannot log in.
//
// One function so the two placements cannot drift. They differ only in whether
// the plaintext export is offered, since that one needs an unlocked library.

import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";

export function backupSection({ idPrefix, allowPlaintext = false, canExport = true }) {
	const message = model.app.backupMessage;
	const messageBlock = message.key
		? /*HTML*/ `
        <p class="backup-message backup-message-${message.tone}" role="alert">${t(message.key)}</p>`
		: "";

	const exportRow = canExport
		? /*HTML*/ `
        <div class="backup-row">
            <span class="backup-label">${t("backup.export")}</span>
            <button class="btn" type="button"
                    aria-describedby="${idPrefix}-export-hint"
                    data-action="export-encrypted">${t("backup.exportBtn")}</button>
        </div>
        <p class="backup-hint" id="${idPrefix}-export-hint">${t("backup.exportHint")}</p>`
		: "";

	// A plain visible file input, not a button wired to a hidden one: native
	// keyboard and screen-reader behaviour, and a real <label> to name it.
	const importRow = /*HTML*/ `
        <div class="backup-row">
            <label class="backup-label" for="${idPrefix}-import-file">${t("backup.import")}</label>
            <input class="file-input" type="file"
                   id="${idPrefix}-import-file"
                   accept="application/json,.json"
                   aria-describedby="${idPrefix}-import-hint"
                   data-action-change="import-backup">
        </div>
        <p class="backup-hint" id="${idPrefix}-import-hint">${t("backup.importHint")}</p>`;

	// Kept in its own row rather than beside the encrypted button, so the unsafe
	// export is never one misclick away from the safe one.
	const plaintextRow = allowPlaintext
		? /*HTML*/ `
        <div class="backup-row">
            <span class="backup-label">${t("backup.plaintext")}</span>
            <button class="btn" type="button"
                    aria-describedby="${idPrefix}-plaintext-hint"
                    data-action="export-plaintext">${t("backup.plaintextBtn")}</button>
        </div>
        <p class="backup-hint backup-hint-warn" id="${idPrefix}-plaintext-hint">${t("backup.plaintextHint")}</p>`
		: "";

	return messageBlock + exportRow + importRow + plaintextRow;
}
