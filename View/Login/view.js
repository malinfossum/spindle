import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { loadState } from "../../Model/persistence.js";
import { authNotice } from "../Universal/authNotice.js";
import { backupSection } from "../Universal/backup.js";
import { escapeHtml } from "../Universal/escape.js";

export function loginPage() {
	const busy = model.app.authBusy;
	const errors = model.viewState.login.errors;

	// v0.9. The way out when the library will not open: a forgotten password or
	// a damaged envelope. Restore is the first answer, delete the last. Only shown
	// when something is stored. It borrows the start page panel's class, which
	// already gives the summary its 44 px and the disclosure triangle.
	const stored = loadState();
	const forgotOpen = model.viewState.loginForgotOpen || !!model.app.backupMessage.key;
	const forgotPanel =
		stored.kind === "none"
			? ""
			: /*HTML*/ `
            <details class="welcome-backup login-forgot" ${forgotOpen ? "open" : ""}
                     data-action-toggle="login-forgot-toggle">
                <summary>${t("login.forgot")}</summary>
                <p class="backup-hint">${t("login.forgotBody")}</p>
                ${backupSection({ idPrefix: "login", canExport: stored.kind === "encrypted" })}
                <div class="backup-row">
                    <div class="backup-text">
                        <span class="backup-label">${t("profile.delete")}</span>
                        <p class="backup-hint" id="login-delete-hint">${t("login.forgotDeleteHint")}</p>
                    </div>
                    <button class="btn btn-danger" type="button"
                            aria-describedby="login-delete-hint"
                            data-action="delete-library">${t("delete.button")}</button>
                </div>
            </details>`;

	return /*HTML*/ `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-title">${t("auth.unlockTitle")}</div>

            ${authNotice()}
            ${
				model.app.sessionStale
					? `<p class="auth-error" role="alert">${escapeHtml(t("login.sessionStale"))}</p>`
					: ""
			}
            ${
				model.app.sessionClearFailed
					? `<p class="auth-error" role="alert">${escapeHtml(t("login.stayClearFailed"))}</p>`
					: ""
			}

            <form data-action-submit="login">
                <div class="form-row">
                    <label class="form-label" for="login-password">${t("auth.password")}</label>
                    <input class="form-input"
                           id="login-password"
                           type="password"
                           autocomplete="current-password"
                           placeholder="••••••"
                           aria-invalid="${errors.password ? "true" : "false"}"
                           aria-describedby="login-password-error"
                           value="${escapeHtml(model.viewState.login.password)}"
                           data-action-input="login-password">
                    <span class="field-error" id="login-password-error">${escapeHtml(t(errors.password))}</span>
                </div>

                <label class="checkbox-row" for="login-stay">
                    <input type="checkbox"
                           id="login-stay"
                           ${model.viewState.login.stay ? "checked" : ""}
                           aria-describedby="login-stay-help"
                           data-action-change="login-stay">
                    ${t("login.stay")}
                </label>
                <p class="form-hint" id="login-stay-help">${t("login.stayHelp")}</p>

                <button class="btn btn-accent btn-full"
                        type="submit"
                        ${busy ? 'disabled aria-busy="true"' : 'aria-busy="false"'}>
                    ${busy ? t("auth.verifying") : t("auth.login")}
                </button>
            </form>

            ${forgotPanel}

            <p class="auth-footer">
                ${t("auth.noLibrary")}
                <a class="link-inline" href="#register" data-action="nav">${t("auth.createTitle")}</a>
            </p>

            <p class="auth-footer">
                <a class="auth-back" href="#welcome" data-action="nav">${t("auth.backToStart")}</a>
            </p>
        </div>
    </div>
    `;
}
