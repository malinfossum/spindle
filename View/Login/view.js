import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { escapeHtml } from "../Universal/escape.js";

export function loginPage() {
	const busy = model.app.authBusy;
	const errors = model.viewState.login.errors;

	return /*HTML*/ `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-title">${t("auth.unlockTitle")}</div>

            ${
				model.app.authMessage
					? `<p class="auth-error" role="alert">${escapeHtml(t(model.app.authMessage))}</p>`
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
