// Routing (v0.2).
//
// changePage() lived in View/Universal/updateView.js, next to the function it
// calls last. The module conversion showed the cost of that: a View file was
// importing four Controller modules, all of them for this one function. Deciding
// where the app goes is not rendering — it validates the target, guards it
// against auth state, seeds the add form and clears what the last page left
// behind. That is behaviour, so it lives in the Controller.
//
// v0.2 item 3 put a URL in front of it. The decision half is unchanged and now
// lives in resolveRoute(); navigate() is the same entry point the app has always
// called, with a fragment write in front of it, and initRouter() resolves
// whatever the address bar already says so a pasted link opens on that page.
//
// Why navigate() renders instead of waiting for its own hashchange: that event
// is queued, not synchronous, so a deferred render would make every one of the
// 13 call sites asynchronous. backup.js is the proof — it calls navigate("login"),
// then sets an auth message, then renders. With a deferred render it would render
// the page it was leaving, and the late resolve would then wipe the message it
// exists to show. So navigate() writes the URL and resolves in the same turn, and
// the hashchange handler exists for the URL changes the app did not make: back,
// forward, and a fragment typed into the address bar. Exactly one render per
// navigation either way — see lastResolvedHash.
//
// router.js and editMusic.js import from each other — this file wants
// initNewAlbum(), and editMusic.js wants navigate() — and there is a second,
// longer cycle through login.js: router.js -> editMusic.js -> login.js (for
// focusFirstInvalid()) -> router.js. Both cycles are safe only because every
// cross-module call here happens inside a function body, long after all three
// modules have finished evaluating. A top-level call to an import from the
// other side of either cycle would read undefined and break the app. The
// addEventListener in initRouter() is not one: it is registered from boot.js,
// and it calls nothing until an event arrives.

import { model } from "../../Model/model.js";
import { hasSelectedAlbum, isLoggedIn } from "../../Model/selectors.js";
import { resetTransientViewState } from "../../Model/viewState.js";
import { updateView } from "../../View/Universal/updateView.js";
import { initNewAlbum } from "../Edit_Music_Details/editMusic.js";

// What an empty fragment means. `/` with no `#` is the same page the model's
// currentPage starts on, so the two can't disagree about where the app opens.
const DEFAULT_PAGE = "welcome";

// The fragment the router last rendered. hashchange fires asynchronously, so the
// echo of our own write arrives after navigate() has already resolved it; that
// echo is the one case where location.hash still equals this. Comparing against
// reality rather than counting suppressions means it cannot drift out of sync —
// a missed or coalesced event costs nothing, because the next comparison is
// still made against what the address bar actually says.
let lastResolvedHash = null;

// The only way the app should change pages. Writes the fragment, then resolves
// it. Assigning location.hash a value it already holds fires no event and adds
// no history entry, which is why the resolve below is unconditional: logout()
// sends you to `login` from `login`, and deleteAlbum() re-enters `homePage` from
// `homePage` to drop the row it just deleted. Both must still render.
export function navigate(page) {
	const target = `#${page}`;

	if (window.location.hash !== target) {
		window.location.hash = target;
	}

	resolveRoute(page);
}

// Called once, from boot.js, in place of the bare updateView() that used to end
// it. Registers the listener first so nothing can be missed, then renders
// whatever the URL already says — that single call is what makes a deep link work.
export function initRouter() {
	window.addEventListener("hashchange", onHashChange);
	resolveRoute(readPage());
}

function onHashChange() {
	// The echo of the router's own write, already rendered by navigate(). Two
	// navigate() calls in one turn queue two of these, and both land here after
	// the second one has settled the URL, so both are dropped.
	if (window.location.hash === lastResolvedHash) return;

	resolveRoute(readPage());
}

// The fragment as a page name. Everything after `#`, with no leading slash and
// no second naming scheme: the names in model.app.allPages are the app's own
// vocabulary, and a mapping table would be one more thing to keep in sync.
function readPage() {
	const raw = window.location.hash.slice(1);

	if (!raw) return DEFAULT_PAGE;

	try {
		return decodeURIComponent(raw);
	} catch {
		// A malformed escape like `#%E0%A4%A` throws. The undecoded text is not a
		// page name either, so it lands on the not-found view a line further down
		// — which is the point of catching: an uncaught throw in a hashchange
		// handler leaves the app frozen on the page it was showing.
		return raw;
	}
}

// The library and the wishlist are one view with one setting between them, and
// the fragment is what carries that setting: `#library` and `#wishList` both
// render the library page, with the preset read off the name. Keeping two
// fragments rather than one sticky flag is what makes Back, forward, a reload
// and a bookmark all land on the list they say they will.
const LIST_PRESETS = {
	library: "all",
	wishList: "wishlist",
};

// The results page folded into the library in v0.3. Old links still work; they
// arrive as a plain library view with whatever query is in the box.
const FOLDED_PAGES = { searchPage: "library" };

// The decision half, unchanged from the changePage() that shipped in v0.1 apart
// from the redirects, which now have to say so in the address bar.
function resolveRoute(requested) {
	let page = requested;

	if (FOLDED_PAGES[page]) {
		page = FOLDED_PAGES[page];
		replaceFragment(page);
	}

	if (LIST_PRESETS[page]) {
		model.viewState.library.preset = LIST_PRESETS[page];
	}

	// changePage() used to trust its argument, so a typo in an onclick handler
	// set currentPage to a name nothing renders. Unknown names land on the
	// not-found view instead of a blank page — and keep their fragment, on
	// purpose: someone who mistyped a URL needs to see what they typed. This is
	// the opposite of the two redirects below, which do rewrite.
	if (!model.app.allPages.includes(page)) {
		console.warn(`[router] unknown page: ${page}`);
		page = "notFound";
	}

	if (!isLoggedIn() && !model.app.publicPages.includes(page)) {
		replaceFragment("welcome");
		model.app.currentPage = "welcome";
		renderRoute();
		return;
	}

	// viewDetails and editDetails render whichever album model.viewState holds,
	// and a cold deep link has no selection — nothing identifies an album in the
	// URL. Carrying an id there would mean giving albums stable public
	// identifiers, which is a product decision nobody has made, so these two are
	// routable by name and fall back to the library when entered without one.
	// Known boundary, not an oversight.
	if ((page === "viewDetails" || page === "editDetails") && !hasSelectedAlbum()) {
		page = "homePage";
		replaceFragment(page);
	}

	if (page === "addDetails") {
		initNewAlbum();
	}

	model.app.currentPage = page;
	resetTransientViewState();
	renderRoute();
}

// Corrects the address bar without adding a history entry, and without firing
// hashchange — replaceState does neither. Pushing here would trap the visitor:
// Back would return to the URL that redirects, which would redirect forward
// again, and the Back button would stop being a way out.
function replaceFragment(page) {
	window.history.replaceState(null, "", `#${page}`);
}

// Records what the address bar settled on before painting, so onHashChange can
// tell the echo of our own write from a real back or forward.
//
// Invariant: this samples location.hash, so it must run *after* any
// replaceFragment() the route needed — both redirects above call it first. Hoist
// this above one of them and the sample records the fragment the visitor asked
// for rather than the one they got; the queued echo then no longer matches, and
// a redirect renders twice.
function renderRoute() {
	lastResolvedHash = window.location.hash;
	updateView();
}
