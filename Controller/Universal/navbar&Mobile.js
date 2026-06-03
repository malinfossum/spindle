function toggleMobileMenu() {
	const menu = document.getElementById("mobile-menu");

	// Selve togglen
	model.app.mobileMenuToggle = !model.app.mobileMenuToggle;

	//forkortelse
	const mobileMenu = model.app.mobileMenuToggle;

	if (mobileMenu == true) {
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
function syncChrome() {
	const loggedOutPages = ["welcome", "login", "register", "about"];
	const hideChrome = loggedOutPages.includes(model.app.currentPage);
	document.body.classList.toggle("chrome-hidden", hideChrome);
}
