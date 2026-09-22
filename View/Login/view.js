import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { authNotice } from "../Universal/authNotice.js";
import { escapeHtml } from "../Universal/escape.js";

export function loginPage() {
	const busy = model.app.authBusy;
	const errors = model.viewState.login.errors;

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
