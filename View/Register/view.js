function registerPage() {
	return /*HTML*/ `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-title">Registrer bruker</div>

            ${
							model.app.authMessage
								? `<p class="auth-error">${model.app.authMessage}</p>`
								: ""
						}

            <div class="form-row">
                <label class="form-label">Brukernavn</label>
                <input class="form-input"
                       type="text"
                       placeholder="Velg brukernavn"
                       value="${model.viewState.createProfile.username}"
                       oninput="model.viewState.createProfile.username = this.value">
            </div>

            <div class="form-row">
                <label class="form-label">Passord</label>
                <input class="form-input"
                       type="password"
                       placeholder="••••••"
                       value="${model.viewState.createProfile.password}"
                       oninput="model.viewState.createProfile.password = this.value">
            </div>

            <div class="form-row">
                <label class="form-label">Gjenta passord</label>
                <input class="form-input"
                       type="password"
                       placeholder="••••••"
                       value="${model.viewState.createProfile.repeatPassword}"
                       oninput="model.viewState.createProfile.repeatPassword = this.value">
            </div>

            <button class="btn btn-accent btn-full" onclick="register()">Registrer</button>

            <p class="auth-footer">
                Har du allerede konto?
                <a href="#" onclick="clearAuthMessage(); changePage('login')">Logg inn</a>
            </p>
        </div>
    </div>
    `;
}
