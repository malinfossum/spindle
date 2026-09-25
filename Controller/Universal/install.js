// Install, from a row in Profile (v0.6, docs/v0.6-plan.md § 3). Capturing
// beforeinstallprompt also retires Chrome's automatic install banner, so
// installing happens when I choose it.
//
// The event is kept here, not on the model: it is a DOM object, and
// model.app.install mirrors only what the View needs to render.
//
// One event, one press: prompt() works once per event, so the event is dropped
// the moment Install is pressed, whatever the answer. A second press finds
// nothing to call.

import { model } from "../../Model/model.js";
import { installRowHtml } from "../../View/Profile/view.js";
import { appRoot } from "../../View/Universal/updateView.js";

let deferredPrompt = null;
// True while the browser's install dialog is open. appinstalled can fire before
// userChoice resolves, and re-rendering then would empty the row under the
// press and drop focus to <body>; the outcome line takes over instead.
let prompting = false;

// Re-renders the row alone, only while Profile is on screen. The next full
// render reads model.app.install anyway. Replacing the row destroys whatever
// in it had focus (the outcome line when appinstalled lands after the answer,
// or the button when the browser offers again), so focus moves to what took
// its place instead of falling to <body>.
function refreshInstallRow() {
	if (prompting || model.app.currentPage !== "profile") return;
	const row = appRoot.querySelector("#profile-install");
	if (!row) return;
	const hadFocus = row.contains(document.activeElement);
	row.outerHTML = installRowHtml();
	if (hadFocus) {
		appRoot.querySelector("#profile-install button, #profile-install-status")?.focus();
	}
}

export function initInstall() {
	model.app.install.standalone =
		window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
	// iPadOS reports itself as a Mac; the touch points give it away.
	model.app.install.ios =
		/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		deferredPrompt = event;
		model.app.install.canPrompt = true;
		// The browser offers again after a dismissal; the button comes back.
		model.app.install.outcome = "";
		refreshInstallRow();
	});

	window.addEventListener("appinstalled", () => {
		deferredPrompt = null;
		model.app.install.canPrompt = false;
		refreshInstallRow();
	});
}

export async function installPressed() {
	const event = deferredPrompt;
	if (!event) return;
	deferredPrompt = null;
	model.app.install.canPrompt = false;

	prompting = true;
	let outcome = "dismissed";
	try {
		await event.prompt();
		({ outcome } = await event.userChoice);
	} catch (err) {
		console.warn("[install] the prompt failed:", err);
	}
	prompting = false;

	model.app.install.outcome = outcome === "accepted" ? "accepted" : "dismissed";
	refreshInstallRow();
	appRoot.querySelector("#profile-install-status")?.focus();
}
