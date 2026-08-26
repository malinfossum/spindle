import { model } from "../../Model/model.js";
import { isLoggedIn } from "../Login/login.js";

export function toggleMobileMenu() {
	const menu = document.getElementById("mobile-menu");

	// Selve togglen
	model.app.mobileMenuToggle = !model.app.mobileMenuToggle;

	//forkortelse
	const mobileMenu = model.app.mobileMenuToggle;

	if (mobileMenu === true) {
		menu.classList.toggle("open");
		console.log(mobileMenu);
		console.log("On");
	} else {
		menu.classList.remove("open");
		console.log(mobileMenu);
		console.log("Off");
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
