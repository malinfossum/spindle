// Theme switching. Lifted out of the inline <script> at the bottom of
// index.html so the page carries no inline script at all — that is what lets
// the Content-Security-Policy say script-src 'self' with no hashes and no
// 'unsafe-inline'.
//
// The pre-paint half of this lives in View/Universal/themePreload.js and runs
// from <head>, long before this file loads.

function currentTheme() {
	return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function themeIcon() {
	return currentTheme() === "light" ? "☀️" : "🌙";
}

function applyTheme() {
	document.documentElement.setAttribute("data-theme", currentTheme());
	// Update every theme toggle (navbar + welcome). The navbar one is hidden
	// on the logged-out flow, so the welcome page carries its own.
	const icon = themeIcon();
	for (const btn of document.querySelectorAll(".btn-theme")) {
		btn.textContent = icon;
	}
}

// Applies whatever spindle:v1:prefs holds right now. Used at boot, and again
// when another tab changes the theme (task N).
function applyStoredTheme() {
	document.documentElement.setAttribute("data-theme", getPref("theme"));
	applyTheme();
}

function toggleTheme() {
	const next = currentTheme() === "light" ? "dark" : "light";
	document.documentElement.setAttribute("data-theme", next);
	setPref("theme", next);
	applyTheme();
}
