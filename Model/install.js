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

// iOS gives a Home Screen app its own storage, apart from Safari, so a library
// made in Safari is not there when the installed app opens (a tester hit this
// in v1.0.3). The data never leaves the device, so nothing syncs the two; a
// backup file is the only bridge. So Spindle tells each side what to do:
//
//   safari: iOS in the browser. Install first, then create the library.
//   app:    iOS running installed. An empty app may have a library in Safari.
//   none:   every other browser shares one store with its installed app.

export function iosStorageSide({ ios, standalone }) {
	if (!ios) return "none";
	return standalone ? "app" : "safari";
}
