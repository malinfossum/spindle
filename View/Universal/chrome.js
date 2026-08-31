// The navbar and footer chrome (v0.2).
//
// index.html hand-writes the navbar and footer rather than rendering them from
// state, so updateView()'s innerHTML assignment never reaches them. Everything
// here pushes the current state into that static markup by hand, which is the
// same job every other file in View/ does — build the DOM the state implies.
// Nothing here decides anything, changes state or listens for an event.
//
// The four arrived from two different wrong layers. syncNavbar() and syncChrome()
// were in the Controller, which updateView() had to reach into. applyLang() and
// applyStaticText() were in Model/i18n/i18n.js doing this identical job under a
// Model file's name. Together they cover the chrome by what it depends on:
// applyStaticText() the parts that depend only on language, syncNavbar() the
// parts that depend on auth state too, syncChrome() the part that depends on
// which page is open.

import { getHtmlLang, t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { getLoggedInUser, isLoggedIn } from "../../Model/selectors.js";

export function syncNavbar() {
	const user = getLoggedInUser();

	const loginDesktop = document.getElementById("nav-login-desktop");
	const loginMobile = document.getElementById("nav-login-mobile");
	const profileDesktop = document.getElementById("nav-profile-desktop");
	const profileMobile = document.getElementById("nav-profile-mobile");

	// Login only, and gone once you are in: the log-out control lives on the
	// Profile page now. One button that changes what it does depending on state,
	// in the slot beside Search and Profile, is how you log yourself out by
	// reaching for something else.
	const loginLabel = t("nav.login");
	if (loginDesktop) {
		loginDesktop.textContent = loginLabel;
		loginDesktop.style.display = user ? "none" : "inline-flex";
	}
	if (loginMobile) {
		loginMobile.textContent = loginLabel;
		loginMobile.style.display = user ? "none" : "inline-flex";
	}

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
	// The not-found view is reachable from both sides, so it is the one public
	// page this rule treats differently: keep the chrome hidden in the logged-out
	// flow, and visible inside the app where the navbar is the way back out. Every
	// other name comes from model.app.publicPages rather than a second list here.
	const loggedOutPages = model.app.publicPages.filter((page) => page !== "notFound");
	const hideChrome =
		loggedOutPages.includes(model.app.currentPage) ||
		(model.app.currentPage === "notFound" && !isLoggedIn());
	document.body.classList.toggle("chrome-hidden", hideChrome);
}

// Everything about the document that lives outside #app and so is not covered
// by a re-render: the lang attribute screen readers use to pick a voice, and
// the static navbar/footer chrome in index.html. Called by the Controller after
// it writes the new language — setLang() only stores the preference.
export function applyLang() {
	document.documentElement.setAttribute("lang", getHtmlLang());
	applyStaticText();
}

// The language-only half of the chrome. Called from updateView() as well, so a
// re-render can never leave the navbar and footer in the previous language.
export function applyStaticText() {
	const setText = (id, key) => {
		const el = document.getElementById(id);
		if (el) el.textContent = t(key);
	};

	setText("nav-home-desktop", "nav.home");
	setText("nav-home-mobile", "nav.home");
	setText("nav-wishlist-desktop", "nav.wishlist");
	setText("nav-wishlist-mobile", "nav.wishlist");
	setText("nav-search-desktop", "nav.search");
	setText("nav-search-mobile", "nav.search");
	setText("footer-copyright", "footer.copyright");

	for (const input of document.querySelectorAll(".nav-search-input")) {
		input.placeholder = t("nav.searchPlaceholder");
	}

	const burger = document.getElementById("nav-burger");
	if (burger) burger.setAttribute("aria-label", t("nav.menuToggle"));

	for (const btn of document.querySelectorAll(".btn-theme")) {
		btn.setAttribute("aria-label", t("nav.themeToggle"));
	}

	// syncNavbar() above owns the login/logout and profile buttons — their text
	// depends on auth state as well as language, so it stays the single writer
	// for those.
}
