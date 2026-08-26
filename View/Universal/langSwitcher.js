// The segmented NO / EN control, shared by the welcome page and the profile
// settings block so the two can't drift apart.
//
// Its own module rather than a corner of chrome.js: this returns an HTML string
// that gets rendered inside #app, while everything in chrome.js patches the
// static markup outside it. View/Universal/backup.js is the same shape — one
// fragment two pages both embed — and sits on its own for the same reason.

import { getHtmlLang, getLang, t } from "../../Model/i18n/i18n.js";

// Pass labelledById when the control already sits next to a visible label, so
// the group is named once rather than twice.
export function langSwitcher(extraClass = "", labelledById = "") {
	const current = getLang();

	const groupLabel = labelledById
		? `aria-labelledby="${labelledById}"`
		: `aria-label="${t("lang.group")}"`;

	const option = (code, labelKey, fullKey) => /*HTML*/ `
        <button class="lang-opt ${current === code ? "is-active" : ""}"
                type="button"
                aria-pressed="${current === code}"
                lang="${getHtmlLang(code)}"
                title="${t(fullKey)}"
                data-action="set-lang" data-lang="${code}">${t(labelKey)}</button>`;

	return /*HTML*/ `
    <div class="lang-switch ${extraClass}" role="group" ${groupLabel}>
        ${option("no", "lang.no", "lang.noFull")}
        ${option("en", "lang.en", "lang.enFull")}
    </div>`;
}
