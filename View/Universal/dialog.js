// Promise-based confirm dialog built on the native <dialog> element, replacing
// the blocking window.confirm(). showModal() hands us a real focus trap,
// Esc-to-close, and an inert background for free — everything a hand-rolled
// modal would have to reimplement with ARIA and keydown handlers. Resolves to
// true on confirm and false on cancel / Esc / backdrop click / leaving the
// page with Back or forward — or, with `outcomes`, to which of the three it
// was. The body is written with textContent, never innerHTML, so user-entered
// names (album titles, genres, locations) can be dropped in without escaping.
// With `confirmWord` (v0.9) a typed word arms the confirm button.

import { t } from "../../Model/i18n/i18n.js";

// v0.9. The typed-word check for a destructive confirm. Trimmed and upper-cased,
// then exact: "delete" arms, "DELET" and "DELETED" do not. An empty word never
// matches, so a caller that forgets the word cannot arm the button by default.
export function matchesConfirmWord(typed, word) {
	const want = String(word ?? "")
		.trim()
		.toUpperCase();
	if (!want) return false;
	return (
		String(typed ?? "")
			.trim()
			.toUpperCase() === want
	);
}

export function openDialog({
	title,
	body,
	confirmText,
	cancelText = t("dialog.cancel"),
	danger = false,
	// v0.5. true resolves "confirm" | "cancel" | "dismiss" instead of a
	// boolean: the Create-library question needs to tell the No button (an
	// answer) from Escape, Back and the backdrop (not an answer).
	outcomes = false,
	// v0.9. A word the user must type before the confirm button arms (delete
	// library). The label and the mismatch message come from the caller, so the
	// dialog stays generic.
	confirmWord = "",
	confirmWordLabel = "",
	confirmWordMismatch = "",
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
		// The word field (v0.9). aria-disabled, not disabled: the button stays in
		// the tab order and a screen reader hears that it is unavailable. A press
		// while unarmed is not silent: it shows the mismatch under the field (an
		// alert region present from the start) and puts focus back in the field.
		let input = null;
		let fieldError = null;
		const field = confirmWord ? document.createElement("div") : null;
		if (field) {
			field.className = "form-row dialog-field";
			const label = document.createElement("label");
			label.className = "form-label";
			label.htmlFor = "dialog-confirm-word";
			label.textContent = confirmWordLabel;
			input = document.createElement("input");
			input.className = "form-input";
			input.id = "dialog-confirm-word";
			input.type = "text";
			input.autocomplete = "off";
			input.spellcheck = false;
			input.setAttribute("autocapitalize", "characters");
			input.setAttribute("enterkeyhint", "done");
			input.setAttribute("aria-invalid", "false");
			input.setAttribute("aria-describedby", "dialog-confirm-error");
			fieldError = document.createElement("span");
			fieldError.className = "field-error";
			fieldError.id = "dialog-confirm-error";
			fieldError.setAttribute("role", "alert");
			field.append(label, input, fieldError);
			confirmBtn.setAttribute("aria-disabled", "true");
		}

		const armed = () => !confirmWord || matchesConfirmWord(input.value, confirmWord);
		const refuse = () => {
			fieldError.textContent = confirmWordMismatch;
			input.setAttribute("aria-invalid", "true");
			input.focus();
		};
		const tryConfirm = () => {
			if (armed()) dialog.close("confirm");
			else refuse();
		};

		confirmBtn.addEventListener("click", tryConfirm);
		input?.addEventListener("input", () => {
			const ok = armed();
			confirmBtn.setAttribute("aria-disabled", ok ? "false" : "true");
			if (ok) {
				fieldError.textContent = "";
				input.setAttribute("aria-invalid", "false");
			}
		});
		input?.addEventListener("keydown", (event) => {
			if (event.key !== "Enter") return;
			event.preventDefault();
			tryConfirm();
		});

		actions.append(cancelBtn, confirmBtn);
		dialog.append(heading, message, ...(field ? [field] : []), actions);
		document.body.appendChild(dialog);

		// A click landing outside the dialog box is the backdrop → cancel. Testing
		// the coordinates (not event.target) means clicks on the dialog's own
		// padding aren't mistaken for the backdrop, which target checks get wrong.
		// The target still has to be the dialog itself: a button pressed with Enter
		// or Space fires a click at (0, 0), which is outside the box, and the
		// unarmed confirm (v0.9) must stay open when that happens.
		dialog.addEventListener("click", (event) => {
			if (event.target !== dialog) return;
			const box = dialog.getBoundingClientRect();
			const clickedInside =
				event.clientX >= box.left &&
				event.clientX <= box.right &&
				event.clientY >= box.top &&
				event.clientY <= box.bottom;
			if (!clickedInside) dialog.close("dismiss");
		});

		// Back or forward while the dialog is up. The router has already
		// re-rendered the page underneath by the time this runs — its listener
		// was registered first — so the question the dialog asks is about a page
		// that is gone. Closing as a dismissal (not an answer) means the caller
		// returns without touching anything. hashchange is queued, so a navigate() from
		// the same turn as this dialog echoes after it has opened; comparing
		// against the fragment the dialog opened on drops that echo, the same
		// test the router makes.
		const openedOn = window.location.hash;
		const onLeave = () => {
			if (window.location.hash !== openedOn) dialog.close("dismiss");
		};
		window.addEventListener("hashchange", onLeave);

		// One exit for every close path (button, Esc, backdrop, navigation): read
		// the result, drop the element, hand focus back to whatever opened the
		// dialog — if it still exists. After a page change it does not, and the
		// fresh page keeps whatever focus the router gave it.
		dialog.addEventListener("close", () => {
			window.removeEventListener("hashchange", onLeave);
			dialog.remove();
			if (opener?.isConnected && typeof opener.focus === "function") opener.focus();
			// Esc closes with an empty returnValue: no button was pressed.
			const outcome = dialog.returnValue === "" ? "dismiss" : dialog.returnValue;
			resolve(outcomes ? outcome : outcome === "confirm");
		});

		dialog.showModal();
		// Destructive actions focus Cancel so Enter doesn't delete by reflex. With a
		// word to type, the field is where the user has to start anyway.
		if (input) input.focus();
		else (danger ? cancelBtn : confirmBtn).focus();
	});
}
