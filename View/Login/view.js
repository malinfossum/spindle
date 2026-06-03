function loginPage() {
	const busy = model.app.authBusy;
	const errors = model.viewState.login.errors;

	return /*HTML*/ `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-title">Lås opp</div>

            ${
							model.app.authMessage
								? `<p class="auth-error" role="alert">${escapeHtml(model.app.authMessage)}</p>`
								: ""
						}

            <form onsubmit="event.preventDefault(); login()">
                <div class="form-row">
                    <label class="form-label" for="login-password">Passord</label>
                    <input class="form-input"
                           id="login-password"
                           type="password"
                           autocomplete="current-password"
                           placeholder="••••••"
                           aria-invalid="${errors.password ? "true" : "false"}"
                           aria-describedby="login-password-error"
                           value="${escapeHtml(model.viewState.login.password)}"
                           oninput="model.viewState.login.password = this.value; clearFieldError(this, 'login', 'password')">
                    <span class="field-error" id="login-password-error">${escapeHtml(errors.password)}</span>
                </div>

                <button class="btn btn-accent btn-full"
                        type="submit"
                        ${busy ? 'disabled aria-busy="true"' : 'aria-busy="false"'}>
                    ${busy ? "Bekrefter…" : "Logg inn"}
                </button>
            </form>

            <p class="auth-footer">
                Ingen bibliotek?
                <a href="#" onclick="changePage('register')">Opprett bibliotek</a>
            </p>

            <p class="auth-footer">
                <a href="#" onclick="changePage('welcome')">← Tilbake til start</a>
            </p>
        </div>
    </div>
    `;
}
