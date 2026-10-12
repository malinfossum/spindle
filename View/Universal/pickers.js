// The language and theme pickers, shared by the welcome page, the navbar and
// the profile settings block so the copies can't drift apart.
//
// They follow my workbench standard (design system components/picker.css and
// the locale standard, section 6): a <details> disclosure with an icon-only
// trigger, globe for language and sun or moon for theme, and a list of rows
// under it. The trigger names itself in a hidden span ("Theme: Dark"), so the
// name a screen reader hears is also the current value. The active row carries
// aria-current and a check. The markup opens and closes without any script;
// Controller/Universal/picker.js adds the arrow keys, Escape and outside click
// through the data-action-* attributes below.
//
// Its own module rather than a corner of chrome.js: these return HTML strings
// that get rendered inside #app (and into the navbar's one slot), while
// everything in chrome.js patches the static markup outside it.
// View/Universal/backup.js is the same shape: one fragment several places embed.

import { getHtmlLang, getLang, getLangName, getLanguages, t } from "../../Model/i18n/i18n.js";
import { getPref } from "../../Model/prefs.js";
import { escapeHtml } from "./escape.js";
import { icon } from "./icons.js";

// Row order in the theme list. The same two values Model/prefs.js allows.
const THEMES = ["light", "dark"];

// One row. The label sits in one span so the check icon is the only other flex
// item. `attrs` is what the controller reads, written here and never by the user.
function row({ attrs, active, lang, label }) {
	return /*HTML*/ `<li><button class="picker-row" type="button" ${attrs}${
		lang ? ` lang="${lang}"` : ""
	}${active ? ' aria-current="true"' : ""}><span>${label}</span>${active ? icon("check") : ""}</button></li>`;
}

// The disclosure itself. The trigger gets a stable id built from idPrefix so the
// controller can put focus back on it after a re-render, and data-id-prefix lets
// refreshPickers() below render the same picker again in place.
function picker({ name, idPrefix, triggerIcon, triggerName, listLabel, rows }) {
	return /*HTML*/ `
    <details class="picker" data-picker="${name}" data-id-prefix="${idPrefix}"
             data-action-toggle="picker-toggle"
             data-action-keydown="picker-keys"
             data-action-focusout="picker-leave">
        <summary class="picker-trigger" id="${idPrefix}-${name}-trigger">${triggerIcon}<span class="visually-hidden">${triggerName}</span></summary>
        <ul class="picker-list" aria-label="${listLabel}">${rows.join("")}</ul>
    </details>`;
}

// Rows are autonyms ("Norsk", "English") with lang on each one, so a screen
// reader reads every name in its own voice. No flags: a flag is a country, not
// a language.
export function langPicker(idPrefix) {
	const current = getLang();
	const rows = getLanguages().map((code) =>
		row({
			attrs: `data-action="set-lang" data-lang="${code}"`,
			active: code === current,
			lang: getHtmlLang(code),
			label: escapeHtml(getLangName(code)),
		}),
	);
	const currentName = `<span lang="${getHtmlLang(current)}">${escapeHtml(getLangName(current))}</span>`;
	return picker({
		name: "lang",
		idPrefix,
		triggerIcon: icon("globe"),
		triggerName: `${t("picker.language")}: ${currentName}`,
		listLabel: t("picker.language"),
		rows,
	});
}

export function themePicker(idPrefix) {
	const current = getPref("theme");
	const rows = THEMES.map((theme) =>
		row({
			attrs: `data-action="set-theme" data-value="${theme}"`,
			active: theme === current,
			label: t(`theme.${theme}`),
		}),
	);
	return picker({
		name: "theme",
		idPrefix,
		triggerIcon: icon(current === "light" ? "sun" : "moon"),
		triggerName: `${t("picker.theme")}: ${t(`theme.${current}`)}`,
		listLabel: t("picker.theme"),
		rows,
	});
}

const RENDER = { lang: langPicker, theme: themePicker };

// Renders every picker of one kind again where it stands. A theme change uses
// this instead of updateView(): the navbar picker is on every page, including
// the add form, and re-rendering #app there would throw away what was typed.
export function refreshPickers(name) {
	for (const details of document.querySelectorAll(`details.picker[data-picker="${name}"]`)) {
		details.outerHTML = RENDER[name](details.dataset.idPrefix);
	}
}
