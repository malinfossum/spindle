// Theme switching. Lifted out of the inline <script> at the bottom of
// index.html so the page carries no inline script at all — that is what lets
// the Content-Security-Policy say script-src 'self' with no hashes and no
// 'unsafe-inline'.
//
// The pre-paint half of this lives in public/themePreload.js and runs from
// <head>, long before this file loads.

import { getPref, setPref } from "../../Model/prefs.js";
import { refreshPickers } from "../../View/Universal/pickers.js";

// The navbar's --nav-bg per theme, for <meta name="theme-color"> (v0.6). The
// same two values are in public/themePreload.js and index.html; keep all three
// in step with CSS/style.css. public/manifest.webmanifest's theme_color is a
// fourth — it can only hold one value, so it carries the dark one.
const THEME_COLOR = { dark: "#141414", light: "#ffffff" };

function applyTheme() {
	const theme = getPref("theme");
	document.documentElement.setAttribute("data-theme", theme);
	document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
	// Every theme picker on screen (the navbar's, and the welcome page's while
	// it is open) shows the theme in its icon, its name and its checked row, so
	// each one is drawn again rather than patched.
	refreshPickers("theme");
}

// Applies whatever spindle:v1:prefs holds right now. Used at boot, and again
// when another tab changes the theme (task N).
export function applyStoredTheme() {
	applyTheme();
}

// A row in the theme picker. Returns whether anything changed, so the caller
// knows whether the picker was drawn again. setPref() whitelists the value.
export function setTheme(theme) {
	if (theme === getPref("theme")) return false;
	setPref("theme", theme);
	if (getPref("theme") !== theme) return false;
	applyTheme();
	return true;
}
