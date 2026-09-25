// Which of the Install row's five situations applies (docs/v0.6-plan.md § 3).
// Pure: the Controller gathers the facts, the View renders the answer.
//
//   standalone — running installed: nothing to offer.
//   outcome    — the prompt was answered: say how it went.
//   canPrompt  — the browser handed over an install event: offer the button.
//   ios        — iOS never fires that event: the row is the instruction.
//   otherwise  — a browser that cannot install (e.g. Firefox desktop): nothing.

export function installRowState({ canPrompt, outcome, ios, standalone }) {
	if (standalone) return "none";
	if (outcome) return "outcome";
	if (canPrompt) return "button";
	if (ios) return "ios";
	return "none";
}
