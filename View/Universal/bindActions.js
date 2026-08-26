// Spindle's one event router (v0.2).
//
// Interactive elements declare what they do with a data-action attribute
// instead of an inline on* handler, and this looks the name up in the map the
// controller hands over. Two reasons. The View stops carrying behaviour, which
// is the MVC rule the inline handlers broke. And with no inline handlers left,
// the Content-Security-Policy no longer needs 'unsafe-inline' — which is the
// setting that makes a CSP worth having at all.
//
// Attribute per event type, so one element can't accidentally answer to two:
//   data-action          click     (the common case, and the workbench name)
//   data-action-input    input
//   data-action-change   change
//   data-action-submit   submit
//   data-action-toggle   toggle
//
// The listeners sit on the document rather than on #app, because updateView()
// replaces #app's contents wholesale on every render — a listener bound to a
// rendered node would be thrown away with it. Delegation also means freshly
// rendered markup is live the moment it lands; nothing is ever re-bound.
const ACTION_EVENTS = {
	click: "data-action",
	input: "data-action-input",
	change: "data-action-change",
	submit: "data-action-submit",
	toggle: "data-action-toggle",
};

function bindActions(root, handlers) {
	for (const [type, attribute] of Object.entries(ACTION_EVENTS)) {
		// <details> fires 'toggle' without bubbling, so a listener up on the
		// document would never see it on the way back up. The capture phase runs
		// on the way down and reaches it regardless. Everything else bubbles
		// normally and is left in the bubble phase.
		const capture = type === "toggle";

		root.addEventListener(
			type,
			(event) => {
				const source = event.target;
				if (!source || typeof source.closest !== "function") return;

				// closest() stops at the nearest element carrying the attribute, so a
				// button inside a clickable card answers for itself and the card never
				// hears about it. That is what the old event.stopPropagation() calls
				// in the album card were hand-rolling.
				const target = source.closest(`[${attribute}]`);
				if (!target) return;

				const name = target.getAttribute(attribute);
				const handler = handlers[name];

				// A typo'd action would otherwise be a button that silently does
				// nothing — the exact failure the inline handlers used to give.
				if (!handler) {
					console.warn(`[actions] no ${type} handler named: ${name}`);
					return;
				}

				handler(event, target);
			},
			capture,
		);
	}
}
