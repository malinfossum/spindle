// The navbar and footer chrome (v0.2).
//
// index.html hand-writes the navbar and footer rather than rendering them from
// state, so updateView()'s innerHTML assignment never reaches them. These two
// push the current state into that static markup by hand, which is the same job
// every other file in View/ does — build the DOM the state implies. Neither one
// decides anything, changes state or listens for an event, so neither belonged
// in the Controller, where updateView() had to import them from.
//
// applyStaticText() in i18n.js owns the parts of the chrome that depend only on
// language; these two own the parts that depend on auth state and the page.

import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { getLoggedInUser, isLoggedIn } from "../../Model/selectors.js";

export function syncNavbar() {
	const user = getLoggedInUser();

	const loginDesktop = document.getElementById("nav-login-desktop");
	const loginMobile = document.getElementById("nav-login-mobile");
	const profileDesktop = document.getElementById("nav-profile-desktop");
	const profileMobile = document.getElementById("nav-profile-mobile");

	const loginLabel = t(user ? "nav.logout" : "nav.login");
	if (loginDesktop) loginDesktop.textContent = loginLabel;
	if (loginMobile) loginMobile.textContent = loginLabel;

	const profileLabel = t("nav.profile");
	if (profileDesktop) {
		profileDesktop.textContent = profileLabel;
		profileDesktop.style.display = user ? "inline-flex" : "none";
	}
	if (profileMobile) {
		profileMobile.textContent = profileLabel;
		profileMobile.style.display = user ? "inline-flex" : "none";
	}
}

// The logged-out flow (welcome, login, register, about) is shown without the app
// navbar and footer so the welcome landing reads as a clean entry point. This only
// flips a body class; CSS owns the actual hiding.
export function syncChrome() {
	const loggedOutPages = ["welcome", "login", "register", "about"];
	// The not-found view is reachable from both sides: keep the chrome hidden in
	// the logged-out flow, and visible inside the app where the navbar is the way
	// back out.
	const hideChrome =
		loggedOutPages.includes(model.app.currentPage) ||
		(model.app.currentPage === "notFound" && !isLoggedIn());
	document.body.classList.toggle("chrome-hidden", hideChrome);
}
