// Navigation (v0.2).
//
// changePage() lived in View/Universal/updateView.js, next to the function it
// calls last. The module conversion showed the cost of that: a View file was
// importing four Controller modules, all of them for this one function. Deciding
// where the app goes is not rendering — it validates the target, guards it
// against auth state, seeds the add form and clears what the last page left
// behind. That is behaviour, so it lives in the Controller.
//
// This is a move, not a rewrite: the body below is the one that shipped in v0.2.
//
// router.js and editMusic.js import from each other — this file wants
// initNewAlbum(), and editMusic.js wants changePage(). That cycle is safe only
// because every cross-module call here happens inside a function body, long
// after both modules have finished evaluating. A top-level call to an import
// from the other side of the cycle would read undefined and break the app.

import { model } from "../../Model/model.js";
import { isLoggedIn } from "../../Model/selectors.js";
import { resetTransientViewState } from "../../Model/viewState.js";
import { updateView } from "../../View/Universal/updateView.js";
import { initNewAlbum } from "../Edit_Music_Details/editMusic.js";

export function changePage(element) {
	const publicPages = ["welcome", "login", "register", "about", "notFound"];

	// changePage() used to trust its argument, so a typo in an onclick handler
	// set currentPage to a name nothing renders. Unknown names land on the
	// not-found view instead of a blank page.
	if (!model.app.allPages.includes(element)) {
		console.warn(`[router] unknown page: ${element}`);
		element = "notFound";
	}

	if (!isLoggedIn() && !publicPages.includes(element)) {
		model.app.currentPage = "welcome";
		updateView();
		return;
	}

	if (element === "addDetails") {
		initNewAlbum();
	}

	model.app.currentPage = element;
	resetTransientViewState();
	updateView();
}
