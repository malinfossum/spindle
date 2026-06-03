function registerPage() {
	const busy = model.app.authBusy;
	const errors = model.viewState.createProfile.errors;
	const strength = passwordStrength(model.viewState.createProfile.password);
	const bars = [0, 1, 2, 3, 4]
		.map((i) => `<span class="${i < strength ? "bar-on" : "bar-off"}"></span>`)
		.join("");

	return /*HTML*/ `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-title">Opprett bibliotek</div>

            ${
							model.app.authMessage
								? `<p class="auth-error" role="alert">${escapeHtml(model.app.authMessage)}</p>`
								: ""
						}

            <form onsubmit="event.preventDefault(); register()">
                <div class="form-row">
                    <label class="form-label" for="register-username">Brukernavn</label>
                    <input class="form-input"
                           id="register-username"
                           type="text"
                           autocomplete="username"
                           placeholder="Velg brukernavn"
                           aria-invalid="${errors.username ? "true" : "false"}"
                           aria-describedby="register-username-error"
                           value="${escapeHtml(model.viewState.createProfile.username)}"
                           oninput="model.viewState.createProfile.username = this.value; clearFieldError(this, 'createProfile', 'username')">
                    <span class="field-error" id="register-username-error">${escapeHtml(errors.username)}</span>
                </div>

                <div class="form-row">
                    <label class="form-label" for="register-password">Passord</label>
                    <input class="form-input"
                           id="register-password"
                           type="password"
                           autocomplete="new-password"
                           placeholder="••••••"
                           aria-invalid="${errors.password ? "true" : "false"}"
                           aria-describedby="register-password-error password-strength-text"
                           value="${escapeHtml(model.viewState.createProfile.password)}"
                           oninput="model.viewState.createProfile.password = this.value; renderStrength(this.value, 'password-strength-bar'); clearFieldError(this, 'createProfile', 'password')">
                    <span class="field-error" id="register-password-error">${escapeHtml(errors.password)}</span>
                    <div id="password-strength-bar" class="strength-bar" aria-hidden="true">${bars}</div>
                    <span class="visually-hidden" id="password-strength-text" aria-live="polite">Passordstyrke: ${strength} av 4</span>
                    <p class="form-hint">Minst 8 tegn. Husk passordet — biblioteket kan ikke gjenopprettes uten det.</p>
                </div>

                <div class="form-row">
                    <label class="form-label" for="register-repeat">Gjenta passord</label>
                    <input class="form-input"
                           id="register-repeat"
                           type="password"
                           autocomplete="new-password"
                           placeholder="••••••"
                           aria-invalid="${errors.repeatPassword ? "true" : "false"}"
                           aria-describedby="register-repeat-error"
                           value="${escapeHtml(model.viewState.createProfile.repeatPassword)}"
                           oninput="model.viewState.createProfile.repeatPassword = this.value; clearFieldError(this, 'createProfile', 'repeatPassword')">
                    <span class="field-error" id="register-repeat-error">${escapeHtml(errors.repeatPassword)}</span>
                </div>

                <button class="btn btn-accent btn-full"
                        type="submit"
                        ${busy ? 'disabled aria-busy="true"' : 'aria-busy="false"'}>
                    ${busy ? "Oppretter…" : "Opprett"}
                </button>
            </form>

            <p class="auth-footer">
                Har du allerede et bibliotek?
                <a href="#" onclick="changePage('login')">Logg inn</a>
            </p>

            <p class="auth-footer">
                <a href="#" onclick="changePage('welcome')">← Tilbake til start</a>
            </p>
        </div>
    </div>
    `;
}
