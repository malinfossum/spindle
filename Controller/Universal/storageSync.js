// Spindle — cross-tab storage sync (v0.1 task N).
//
// Two tabs on the same library used to overwrite each other in silence: each
// holds its own decrypted copy in memory, and whichever saved last won. The
// README warned people off a second tab, which is a note rather than a fix.
//
// The `storage` event fires only in OTHER documents of the same origin, so this
// listener never sees this tab's own writes. Every event here is another tab
// reporting what it just did.

import { applyLang } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { STORAGE_KEY } from "../../Model/persistence.js";
import { invalidatePrefsCache, PREFS_KEY } from "../../Model/prefs.js";
import { updateView } from "../../View/Universal/updateView.js";
import { isLoggedIn } from "../Login/login.js";
import { applyStoredTheme } from "./theme.js";

function handlePrefsChangedElsewhere() {
	// prefs.js keeps an in-memory mirror, so re-reading is not enough on its own —
	// the cache has to be dropped or the old language and theme would win.
	invalidatePrefsCache();
	applyStoredTheme();
	applyLang();
	updateView();
}

function handleLibraryChangedElsewhere() {
	// Logged out there is nothing in memory to go stale. The welcome page does
	// emphasise "Log in" or "Create library" depending on whether a library
	// exists, so it still wants a re-render.
	if (!isLoggedIn()) {
		updateView();
		return;
	}

	// Unlocked: model.data is now a stale copy of a library another tab has
	// already re-encrypted. Merging two divergent libraries is not something this
	// app can do safely, so stop saving and say so plainly. A reload picks up the
	// other tab's version.
	model.app.libraryStale = true;
	updateView();
}

window.addEventListener("storage", (event) => {
	if (event.storageArea !== localStorage) return;

	// A null key means the whole store was cleared — treat that as both changing.
	if (event.key === null) {
		handlePrefsChangedElsewhere();
		handleLibraryChangedElsewhere();
		return;
	}

	if (event.key === PREFS_KEY) handlePrefsChangedElsewhere();
	else if (event.key === STORAGE_KEY) handleLibraryChangedElsewhere();
});
