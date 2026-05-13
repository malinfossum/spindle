function loginPage() {
	return /*HTML*/ `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-title">Logg inn</div>

            ${
							model.app.authMessage
								? `<p class="auth-error">${model.app.authMessage}</p>`
								: ""
						}

            <div class="form-row">
                <label class="form-label">Brukernavn</label>
                <input class="form-input"
                       type="text"
                       placeholder="Brukernavn"
                       value="${model.viewState.login.username}"
                       oninput="model.viewState.login.username = this.value">
            </div>

            <div class="form-row">
                <label class="form-label">Passord</label>
                <input class="form-input"
                       type="password"
                       placeholder="••••••"
                       value="${model.viewState.login.password}"
                       oninput="model.viewState.login.password = this.value">
            </div>

            <button class="btn btn-accent btn-full" onclick="login()">Logg inn</button>

            <p class="auth-footer">
                Ingen konto?
                <a href="#" onclick="clearAuthMessage(); changePage('register')">Registrer deg</a>
            </p>
        </div>
    </div>
    `;
}
