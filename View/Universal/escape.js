// HTML-escape any value before interpolating it into an innerHTML string.
// Lives in the View layer because escaping is a rendering concern: every view
// builds an HTML string that updateView() assigns to innerHTML, so untrusted
// data (album titles, notes, search queries, user-added genre/location names)
// must be neutralised here or the browser runs it as markup. Escapes the five
// characters that matter in both element text and double-quoted attributes.
// "&" is replaced first so the entities introduced below aren't re-escaped.
function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}
