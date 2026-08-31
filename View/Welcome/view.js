import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { loadState } from "../../Model/persistence.js";
import { backupSection } from "../Universal/backup.js";
import { icon } from "../Universal/icons.js";
import { langSwitcher } from "../Universal/langSwitcher.js";

export function welcomePage() {
	// First-time visitors should be nudged toward "Create library", returning ones
	// toward "Log in". readEnvelope() (via loadState) only reads the stored envelope's
	// shape — it never decrypts — so we can safely tell which library state we're in
	// and give the likely action the accent button + first position.
	const hasLibrary = loadState().kind === "encrypted";

	// Duplicates the rule in Controller/Universal/theme.js on purpose: importing
	// themeIcon() from there would put a View file back on the Controller, the
	// exact edge this branch removed. Two lines of duplication is cheaper than
	// that edge — do not "fix" this by adding the import back.
	const themeIcon =
		document.documentElement.getAttribute("data-theme") === "light"
			? icon("sun")
			: icon("moon");

	const createBtn = /*HTML*/ `
        <button class="btn btn-full ${hasLibrary ? "" : "btn-accent"}"
                type="button"
                data-action="nav" data-page="register">
            ${t("welcome.createLibrary")}
        </button>`;

	const loginBtn = /*HTML*/ `
        <button class="btn btn-full ${hasLibrary ? "btn-accent" : ""}"
                type="button"
                data-action="nav" data-page="login">
            ${t("welcome.login")}
        </button>`;

	const actions = hasLibrary ? loginBtn + createBtn : createBtn + loginBtn;

	// Restoring a backup has to work from here, not only from Profile: a corrupt
	// library or a forgotten password locks you out of the app entirely, and that
	// is precisely when a backup is worth having. Collapsed by default so the
	// landing page stays a landing page. Forced open while a message is showing,
	// so an error can never be hidden inside a closed panel.
	const backupOpen = model.viewState.welcomeBackupOpen || !!model.app.backupMessage.key;

	const backupPanel = /*HTML*/ `
        <details class="welcome-backup" ${backupOpen ? "open" : ""}
                 data-action-toggle="welcome-backup-toggle">
            <summary>${t("welcome.backup")}</summary>
            ${backupSection({ idPrefix: "welcome", canExport: hasLibrary })}
        </details>`;

	return /*HTML*/ `
    <section class="welcome" aria-labelledby="welcome-heading">
        <div class="welcome-top">
            ${langSwitcher("welcome-lang")}
            <button class="btn-theme welcome-theme"
                    type="button"
                    data-action="toggle-theme"
                    aria-label="${t("nav.themeToggle")}">${themeIcon}</button>
        </div>

        <div class="welcome-vinyl" aria-hidden="true">
            ${vinylSvg()}
        </div>

        <div class="welcome-card">
            <h1 class="welcome-brand" id="welcome-heading">Spindle</h1>
            <p class="welcome-tagline">
                ${t("welcome.tagline")}
            </p>

            <div class="welcome-actions">
                ${actions}
            </div>

            <button class="link-btn welcome-about" type="button" data-action="nav" data-page="about">
                ${t("welcome.about")}
            </button>

            ${backupPanel}
        </div>

        <p class="welcome-footer">
            ${t("welcome.credit")}
        </p>
    </section>
    `;
}

// Decorative rotating record for the welcome page. Kept in its own function so the
// markup above stays readable. Purely visual (aria-hidden on the wrapper); the
// spinning group is paused for users who prefer reduced motion via CSS.
function vinylSvg() {
	return /*HTML*/ `
    <svg class="vinyl" viewBox="0 0 200 200" role="presentation" focusable="false">
        <defs>
            <radialGradient id="vinyl-sheen" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stop-color="#3b3b3b"/>
                <stop offset="45%" stop-color="#151515"/>
                <stop offset="100%" stop-color="#000000"/>
            </radialGradient>
        </defs>
        <g class="vinyl-spin">
            <circle cx="100" cy="100" r="98" fill="url(#vinyl-sheen)"/>
            <circle cx="100" cy="100" r="86" fill="none" stroke="#2b2b2b" stroke-width="0.6"/>
            <circle cx="100" cy="100" r="76" fill="none" stroke="#242424" stroke-width="0.6"/>
            <circle cx="100" cy="100" r="66" fill="none" stroke="#2b2b2b" stroke-width="0.6"/>
            <circle cx="100" cy="100" r="56" fill="none" stroke="#242424" stroke-width="0.6"/>
            <circle cx="100" cy="100" r="46" fill="none" stroke="#2b2b2b" stroke-width="0.6"/>
            <circle cx="100" cy="100" r="34" fill="#d4af37"/>
            <circle cx="100" cy="100" r="34" fill="none" stroke="#b8962e" stroke-width="1"/>
            <circle cx="100" cy="100" r="26" fill="none" stroke="rgba(0, 0, 0, 0.18)" stroke-width="1"/>
            <circle cx="100" cy="100" r="3.4" fill="#0c0c0c"/>
        </g>
    </svg>`;
}
