// Promise-based confirm dialog built on the native <dialog> element, replacing
// the blocking window.confirm(). showModal() hands us a real focus trap,
// Esc-to-close, and an inert background for free — everything a hand-rolled
// modal would have to reimplement with ARIA and keydown handlers. Resolves to
// true on confirm and false on cancel / Esc / backdrop click. The body is
// written with textContent, never innerHTML, so user-entered names (album
// titles, genres, locations) can be dropped in without escaping.

import { t } from "../../Model/i18n/i18n.js";

export function openDialog({
	title,
	body,
	confirmText,
	cancelText = t("dialog.cancel"),
	danger = false,
}) {
	return new Promise((resolve) => {
		const opener = document.activeElement;

		const dialog = document.createElement("dialog");
		dialog.className = "dialog";
		dialog.setAttribute("aria-labelledby", "dialog-title");

		const heading = document.createElement("h2");
		heading.className = "dialog-title";
		heading.id = "dialog-title";
		heading.textContent = title;

		const message = document.createElement("p");
		message.className = "dialog-body";
		message.textContent = body;

		const actions = document.createElement("div");
		actions.className = "dialog-actions";

		const cancelBtn = document.createElement("button");
		cancelBtn.className = "btn btn-ghost";
		cancelBtn.textContent = cancelText;
		cancelBtn.addEventListener("click", () => dialog.close("cancel"));

		const confirmBtn = document.createElement("button");
		confirmBtn.className = danger ? "btn btn-danger" : "btn btn-accent";
		confirmBtn.textContent = confirmText;
		confirmBtn.addEventListener("click", () => dialog.close("confirm"));

		actions.append(cancelBtn, confirmBtn);
		dialog.append(heading, message, actions);
		document.body.appendChild(dialog);

		// A click landing outside the dialog box is the backdrop → cancel. Testing
		// the coordinates (not event.target) means clicks on the dialog's own
		// padding aren't mistaken for the backdrop, which target checks get wrong.
		dialog.addEventListener("click", (event) => {
			const box = dialog.getBoundingClientRect();
			const clickedInside =
				event.clientX >= box.left &&
				event.clientX <= box.right &&
				event.clientY >= box.top &&
				event.clientY <= box.bottom;
			if (!clickedInside) dialog.close("cancel");
		});

		// One exit for every close path (button, Esc, backdrop): read the result,
		// drop the element, hand focus back to whatever opened the dialog.
		dialog.addEventListener("close", () => {
			dialog.remove();
			if (opener && typeof opener.focus === "function") opener.focus();
			resolve(dialog.returnValue === "confirm");
		});

		dialog.showModal();
		// Destructive actions focus Cancel so Enter doesn't delete by reflex.
		(danger ? cancelBtn : confirmBtn).focus();
	});
}
