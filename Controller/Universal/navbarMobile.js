import { model } from "../../Model/model.js";

// The menu is static chrome outside #app, so updateView() never redraws it —
// the class on the element and the flag on the model have to be kept in step
// by hand, here and nowhere else. The burger's aria-expanded is the same
// state a third time, for whoever cannot see the class.
function paintMobileMenu(open) {
	const menu = document.getElementById("mobile-menu");
	if (menu) menu.classList.toggle("open", open);
	const burger = document.getElementById("nav-burger");
	if (burger?.hasAttribute("aria-expanded")) burger.setAttribute("aria-expanded", String(open));
}

export function toggleMobileMenu() {
	model.app.mobileMenuToggle = !model.app.mobileMenuToggle;
	paintMobileMenu(model.app.mobileMenuToggle);
}

// Called by the router on every page change (v0.5): choosing a page closes the
// menu, and so does Back, which arrives on the same path. Idempotent, so the
// desktop layout — where the menu is never open — costs nothing.
export function closeMobileMenu() {
	model.app.mobileMenuToggle = false;
	paintMobileMenu(false);
}
