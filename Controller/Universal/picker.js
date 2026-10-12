// Keyboard and pointer rules for the language and theme pickers
// (View/Universal/pickers.js), ported from my workbench design system's
// components/picker.js.
//
// Without these the <details> still opens and closes, so a picker never stops
// working. With them: opening focuses the active row, the arrow keys move and
// wrap, Home and End jump to the ends, Escape closes and puts focus back on the
// trigger, a pointer-down outside or focus leaving closes without moving focus,
// and only one picker is open at a time. Choosing a row is handled where the
// choice is made, in actions.js.
//
// The toggle, keydown and focusout handlers reach the pickers through
// data-action-* and bindActions like every other control. The pointer-down
// outside is the one listener bindActions cannot express: it has to hear
// presses that land on nothing in particular.

const PICKER = "details.picker";

function rows(details) {
	return [...details.querySelectorAll(".picker-row")];
}

export function closePicker(details, refocus) {
	if (!details.open) return;
	details.open = false;
	if (refocus) details.querySelector("summary")?.focus();
}

// The list hangs from the trigger's right edge (CSS/style.css), so a picker
// near the left of a 320px screen could still push it off the left side. The
// open list is shifted right by the overflow, and the shift is cleared on close.
const EDGE_GAP = 8;
function keepInView(details) {
	const list = details.querySelector(".picker-list");
	if (!list) return;
	list.style.translate = "";
	const overflow = EDGE_GAP - list.getBoundingClientRect().left;
	if (overflow > 0) list.style.translate = `${overflow}px 0`;
}

export function pickerToggled(_event, details) {
	if (!details.open) {
		const list = details.querySelector(".picker-list");
		if (list) list.style.translate = "";
		return;
	}
	for (const other of document.querySelectorAll(`${PICKER}[open]`)) {
		if (other !== details) closePicker(other, false);
	}
	keepInView(details);
	const all = rows(details);
	(all.find((r) => r.hasAttribute("aria-current")) ?? all[0])?.focus();
}

export function pickerKeys(event, details) {
	if (!details.open) return;
	if (event.key === "Escape") {
		event.preventDefault();
		closePicker(details, true);
		return;
	}
	const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
	if (!keys.includes(event.key)) return;
	event.preventDefault();
	const all = rows(details);
	if (!all.length) return;
	const at = all.indexOf(document.activeElement);
	let next;
	if (event.key === "Home") next = 0;
	else if (event.key === "End") next = all.length - 1;
	else {
		const step = event.key === "ArrowDown" ? 1 : -1;
		next =
			at === -1 ? (step === 1 ? 0 : all.length - 1) : (at + step + all.length) % all.length;
	}
	all[next].focus();
}

// Tab out of an open list closes it. A null relatedTarget (the window lost
// focus, or Safari pressed a button without focusing it) is left to the
// pointer-down listener below.
export function pickerLeft(event, details) {
	if (!details.open) return;
	const to = event.relatedTarget;
	if (to && !details.contains(to)) closePicker(details, false);
}

export function initPickers() {
	document.addEventListener("pointerdown", (event) => {
		if (event.target?.closest?.(PICKER)) return;
		for (const details of document.querySelectorAll(`${PICKER}[open]`)) {
			closePicker(details, false);
		}
	});
}
