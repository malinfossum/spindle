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
