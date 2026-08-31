// The search box's suggestion list.
//
// Patched into the DOM directly rather than rendered through updateView(), for
// the same reason renderStrength() is: the search box lives in the static
// navbar and this runs on every keystroke. A full re-render would be fine for
// #app — the navbar is outside it — but the list has to stay in step with the
// input character by character, and going through the router for that is a lot
// of machinery for one <ul>.
//
// Both navbars (desktop and mobile) get the same treatment from one call, so
// the two placements cannot drift.
//
// The markup is the ARIA combobox-with-listbox pattern: the input owns
// aria-expanded and aria-activedescendant, the list is a listbox of options,
// and the active option is identified by id rather than by focus — focus never
// leaves the input, which is what lets someone keep typing.

import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { getSearchSuggestions } from "../../Model/selectors.js";
import { escapeHtml } from "./escape.js";

const SEARCH_FORMS = ["desktop", "mobile"];

export function renderSuggestions() {
	const state = model.viewState.suggest;
	const albums = state.open ? getSearchSuggestions() : [];

	for (const which of SEARCH_FORMS) {
		const input = document.getElementById(`nav-search-${which}-input`);
		const list = document.getElementById(`nav-search-${which}-list`);
		if (!input || !list) continue;

		const open = albums.length > 0;
		list.hidden = !open;
		input.setAttribute("aria-expanded", open ? "true" : "false");

		if (!open) {
			list.innerHTML = "";
			input.removeAttribute("aria-activedescendant");
			continue;
		}

		list.innerHTML = albums
			.map((album, i) => {
				const active = i === state.index;
				return /*HTML*/ `
        <li class="nav-suggest-item"
            role="option"
            id="nav-search-${which}-opt-${i}"
            aria-selected="${active}"
            data-action="suggest-pick"
            data-id="${album.id}">
            <span class="nav-suggest-title">${escapeHtml(album.title)}</span>
            <span class="nav-suggest-artist">${escapeHtml(album.artist)}</span>
        </li>`;
			})
			.join("");

		if (state.index >= 0) {
			input.setAttribute("aria-activedescendant", `nav-search-${which}-opt-${state.index}`);
			list.children[state.index]?.scrollIntoView({ block: "nearest" });
		} else {
			input.removeAttribute("aria-activedescendant");
		}
	}
}

// Both inputs carry the same query, so a language switch or a re-render cannot
// leave the hidden one holding an older string than the model.
export function syncSearchInputs() {
	for (const which of SEARCH_FORMS) {
		const input = document.getElementById(`nav-search-${which}-input`);
		if (input && input.value !== model.viewState.searchBar) {
			input.value = model.viewState.searchBar;
		}
		const list = document.getElementById(`nav-search-${which}-list`);
		if (list) list.setAttribute("aria-label", t("nav.suggestions"));
	}
}
