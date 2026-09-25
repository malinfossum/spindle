import { t } from "../../Model/i18n/i18n.js";
import { installRowState } from "../../Model/install.js";
import { model } from "../../Model/model.js";
import { formatBytes } from "../../Model/persistence.js";
import { getPref } from "../../Model/prefs.js";
import { getAccessibleAlbums, getLoggedInUser } from "../../Model/selectors.js";
import { authNotice } from "../Universal/authNotice.js";
import { backupSection } from "../Universal/backup.js";
import { escapeHtml } from "../Universal/escape.js";
import { icon } from "../Universal/icons.js";
import { langSwitcher } from "../Universal/langSwitcher.js";

// The Install row (v0.6). Exported so Controller/Universal/install.js can
// re-render this row alone when the browser's install event arrives or leaves
// while Profile is on screen. The wrapper renders even when empty, so there is
// always something to replace.
export function installRowHtml() {
	const install = model.app.install;
	const state = installRowState(install);
	let inner = "";
	if (state === "button") {
		inner = /*HTML*/ `
            <div class="profile-settings-row">
                <span class="profile-settings-label">${t("profile.install")}</span>
                <button class="btn" type="button" data-action="install">${t("profile.installBtn")}</button>
            </div>`;
	} else if (state === "outcome") {
		// Focusable so focus can land here when the button it replaces is gone.
		const key =
			install.outcome === "accepted" ? "profile.installAccepted" : "profile.installDismissed";
		inner = /*HTML*/ `
            <p class="form-hint" id="profile-install-status" role="status" tabindex="-1">${t(key)}</p>`;
	} else if (state === "ios") {
		inner = /*HTML*/ `<p class="form-hint">${t("profile.installIos")}</p>`;
	}
	return /*HTML*/ `<div class="profile-install" id="profile-install">${inner}</div>`;
}

export function profilePage() {
	const user = getLoggedInUser();
	// The count only. The grid of covers that used to be here is what Home is
	// for; Profile is the settings screen.
	const albumCount = getAccessibleAlbums().length;

	if (!user) {
		return /*HTML*/ `
        <div class="empty-state">
            <div class="empty-state-icon">${icon("lock", { size: 48 })}</div>
            ${t("profile.loginRequired")}
        </div>
        `;
	}

	const storage = model.app.storage;
	const storageBlock = storage
		? /*HTML*/ `
        <div class="profile-storage" role="status">
            <div class="profile-storage-label">${t("profile.storage")}</div>
            <div class="profile-storage-bar">
                <div class="profile-storage-bar-fill" style="width: ${Math.min(storage.percent, 100)}%"></div>
            </div>
            <div class="profile-storage-stats">
                ${t("profile.storageStats", {
					used: formatBytes(storage.usage),
					total: formatBytes(storage.quota),
					percent: storage.percent,
				})}
            </div>
        </div>`
		: "";

	// The welcome page's language switcher is only reachable while logged out, so
	// the setting needs a home inside the app too. Profile is where the other
	// account-level controls already live — storage, and now backup/restore.
	// The plaintext export is offered here and nowhere else: it serialises the
	// decrypted library, so it needs a library that is already unlocked.
	const settingsBlock = /*HTML*/ `
        <div class="profile-settings">
            <h2 class="profile-settings-heading">${t("profile.settings")}</h2>
            <div class="profile-settings-row">
                <span class="profile-settings-label" id="profile-language-label">${t("profile.language")}</span>
                ${langSwitcher("", "profile-language-label")}
            </div>
            <div class="profile-settings-row profile-settings-row-stack">
                <label class="profile-settings-label" for="profile-lookups">${t("profile.lookups")}</label>
                <select class="form-input" id="profile-lookups"
                        style="max-width: 320px"
                        data-action-change="set-lookups">
                    ${
						getPref("lookups") === "unset"
							? /*HTML*/ `<option value="unset" disabled selected>${t("profile.lookupsUnset")}</option>`
							: ""
					}
                    <option value="off" ${getPref("lookups") === "off" ? "selected" : ""}>${t("profile.lookupsOff")}</option>
                    <option value="on" ${getPref("lookups") === "on" ? "selected" : ""}>${t("profile.lookupsOn")}</option>
                </select>
            </div>
            <div class="profile-settings-row profile-settings-row-stack">
                <label class="profile-settings-label" for="profile-stay">${t("profile.stay")}</label>
                <select class="form-input" id="profile-stay"
                        style="max-width: 320px"
                        aria-describedby="profile-stay-help"
                        data-action-change="set-stay">
                    <option value="off" ${model.app.stayUnlocked ? "" : "selected"}>${t("profile.stayOff")}</option>
                    <option value="on" ${model.app.stayUnlocked ? "selected" : ""}>${t("profile.stayOn")}</option>
                </select>
            </div>
            <p class="form-hint" id="profile-stay-help">${t("profile.stayHelp")}</p>

            ${installRowHtml()}

            <h2 class="profile-settings-heading">${t("backup.title")}</h2>
            ${backupSection({ idPrefix: "profile", allowPlaintext: true })}

            <h2 class="profile-settings-heading">${t("profile.logout")}</h2>
            <div class="profile-settings-row">
                <span class="profile-settings-label">${t("profile.logoutHint")}</span>
                <button class="btn" type="button" data-action="logout">${t("profile.logoutBtn")}</button>
            </div>
        </div>`;

	return /*HTML*/ `
    <div class="page-header">
        <span class="page-title">${t("profile.title", { username: escapeHtml(user.username) })}</span>
    </div>

    ${authNotice()}

    <p class="search-result-count">${t("profile.myAlbums", { count: albumCount })}</p>

    ${storageBlock}
    ${settingsBlock}
    `;
}
