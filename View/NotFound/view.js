// Unknown-route view (v0.1 task O).
//
// changePage() used to trust whatever string it was handed: a typo in one
// onclick attribute set currentPage to a name updateView() has no branch for,
// and the result was a blank content area with no explanation. Unknown names now
// land here, and this is also the catch-all at the end of updateView()'s chain,
// so a page added to model.app.allPages but never wired up fails visibly rather
// than silently.
//
// Static content only — nothing user-entered is interpolated, so nothing needs
// escaping.

import { isLoggedIn } from "../../Controller/Login/login.js";
import { t } from "../../Model/i18n/i18n.js";

export function notFoundPage() {
	const loggedIn = isLoggedIn();
	const target = loggedIn ? "homePage" : "welcome";
	const backKey = loggedIn ? "notFound.backLibrary" : "notFound.backWelcome";

	return /*HTML*/ `
    <section class="notfound" aria-labelledby="notfound-heading">
        <div class="notfound-icon" aria-hidden="true">🔍</div>
        <h1 class="notfound-title" id="notfound-heading">${t("notFound.title")}</h1>
        <p class="notfound-body">${t("notFound.body")}</p>
        <button class="btn btn-accent" type="button" data-action="nav" data-page="${target}">
            ${t(backKey)}
        </button>
    </section>
    `;
}
