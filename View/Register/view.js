function registerPage() {
	const busy = model.app.authBusy;
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
                    <label class="form-label">Brukernavn</label>
                    <input class="form-input"
                           type="text"
                           autocomplete="username"
                           placeholder="Velg brukernavn"
                           value="${escapeHtml(model.viewState.createProfile.username)}"
                           oninput="model.viewState.createProfile.username = this.value">
                </div>

                <div class="form-row">
                    <label class="form-label">Passord</label>
                    <input class="form-input"
                           type="password"
                           autocomplete="new-password"
                           placeholder="••••••"
                           aria-describedby="password-strength-text"
                           value="${escapeHtml(model.viewState.createProfile.password)}"
                           oninput="model.viewState.createProfile.password = this.value; renderStrength(this.value, 'password-strength-bar')">
                    <div id="password-strength-bar" class="strength-bar" aria-hidden="true">${bars}</div>
                    <span class="visually-hidden" id="password-strength-text" aria-live="polite">Passordstyrke: ${strength} av 4</span>
                    <p class="form-hint">Minst 8 tegn. Husk passordet — biblioteket kan ikke gjenopprettes uten det.</p>
                </div>

                <div class="form-row">
                    <label class="form-label">Gjenta passord</label>
                    <input class="form-input"
                           type="password"
                           autocomplete="new-password"
                           placeholder="••••••"
                           value="${escapeHtml(model.viewState.createProfile.repeatPassword)}"
                           oninput="model.viewState.createProfile.repeatPassword = this.value">
                </div>

                <button class="btn btn-accent btn-full"
                        type="submit"
                        ${busy ? 'disabled aria-busy="true"' : 'aria-busy="false"'}>
                    ${busy ? "Oppretter…" : "Opprett"}
                </button>
            </form>

            <p class="auth-footer">
                Har du allerede et bibliotek?
                <a href="#" onclick="clearAuthMessage(); changePage('login')">Logg inn</a>
            </p>
        </div>
    </div>
    `;
}
