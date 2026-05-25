function loginPage() {
	const busy = model.app.authBusy;

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
                    <label class="form-label">Passord</label>
                    <input class="form-input"
                           type="password"
                           autocomplete="current-password"
                           placeholder="••••••"
                           value="${escapeHtml(model.viewState.login.password)}"
                           oninput="model.viewState.login.password = this.value">
                </div>

                <button class="btn btn-accent btn-full"
                        type="submit"
                        ${busy ? 'disabled aria-busy="true"' : 'aria-busy="false"'}>
                    ${busy ? "Bekrefter…" : "Logg inn"}
                </button>
            </form>

            <p class="auth-footer">
                Ingen bibliotek?
                <a href="#" onclick="clearAuthMessage(); changePage('register')">Opprett bibliotek</a>
            </p>
        </div>
    </div>
    `;
}
