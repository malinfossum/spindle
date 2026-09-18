// The one file that knows the host (v0.4).
//
// lookupBarcode() is a pure function of the digits: it builds the URL,
// fetches, and turns the response into matches. No DOM, no model writes —
// the Controller decides what a match does to the form, and a later project
// that looks up film instead of music swaps this file and keeps the rest.
//
// This is the app's first external input, so the response is untrusted: a
// body without an array `releases` is a failed lookup, a release without a
// string title or a non-empty artist credit is skipped, a year outside
// 1000–2999 is dropped, and a medium format that does not map onto
// ALBUM_FORMATS becomes "other". Artist and title are plain strings that
// every template escapes on render.
//
// Verified 2026-09-15: the endpoint answers with Access-Control-Allow-Origin:
// *, needs no key, and returns 503 when busy as a matter of course. No custom
// headers are sent — a browser cannot set User-Agent, and any other header
// would turn the request into a preflighted one for nothing.

import { ALBUM_FORMATS, normalizeBarcode } from "./model.js";

const HOST = "https://musicbrainz.org";

// limit=100 is the API's maximum. One barcode is known to carry 25 releases,
// and the whole 25-release body is 34 KB, so asking for everything costs little
// and a barcode reused more widely does not lose releases past the first page.
export function LOOKUP_URL(digits) {
	return `${HOST}/ws/2/release/?query=barcode:${digits}&fmt=json&limit=100`;
}

// MusicBrainz medium names onto the four formats an album can have. "CD",
// "CD-R", "Copy Control CD" start with CD; "12" Vinyl", "7" Vinyl" contain
// Vinyl; anything else the service knows (Digital Media, SACD, DVD) is
// "other", because it is a physical-or-digital thing that is not one of ours.
export function mapMediumFormat(format) {
	if (format.startsWith("CD")) return "cd";
	if (format.includes("Vinyl")) return "lp";
	if (format.includes("Cassette")) return "cassette";
	return "other";
}

function yearOf(release) {
	if (typeof release.date !== "string") return null;
	const year = Number.parseInt(release.date.slice(0, 4), 10);
	return Number.isInteger(year) && year >= 1000 && year <= 2999 ? year : null;
}

// The first medium that names a format, mapped; "" when no medium does.
function formatOf(release) {
	if (!Array.isArray(release.media)) return "";
	for (const medium of release.media) {
		if (medium && typeof medium.format === "string" && medium.format !== "") {
			return mapMediumFormat(medium.format);
		}
	}
	return "";
}

// The credit is a list of {name, joinphrase, artist:{name}} parts; the
// display string is every name followed by its join phrase, in order.
function artistOf(release) {
	const credit = release["artist-credit"];
	if (!Array.isArray(credit) || credit.length === 0) return "";

	let artist = "";
	for (const part of credit) {
		if (!part || typeof part !== "object") continue;
		const name = typeof part.name === "string" ? part.name : part.artist?.name;
		if (typeof name !== "string") continue;
		artist += name + (typeof part.joinphrase === "string" ? part.joinphrase : "");
	}
	return artist.trim();
}

// One match per distinct lower-cased artist + title, in order of first
// appearance, with the earliest year seen and the first format seen. Several
// pressings of one album collapse into the one entry the person is looking
// for; a bootleg with its own title stays its own entry.
export function collapseReleases(releases) {
	const byKey = new Map();

	for (const release of releases) {
		if (!release || typeof release !== "object") continue;
		if (typeof release.title !== "string" || release.title === "") continue;
		const artist = artistOf(release);
		if (artist === "") continue;

		const key = `${artist.toLowerCase()} ${release.title.toLowerCase()}`;
		const year = yearOf(release);
		const format = formatOf(release);
		const seen = byKey.get(key);

		if (!seen) {
			byKey.set(key, { artist, title: release.title, year, format });
			continue;
		}
		if (year !== null && (seen.year === null || year < seen.year)) seen.year = year;
		if (seen.format === "" && format !== "") seen.format = format;
	}

	return [...byKey.values()].map((match) => ({
		...match,
		format: ALBUM_FORMATS.includes(match.format) ? match.format : "",
	}));
}

// Resolves to one of three shapes. A rejection means fetch itself failed —
// no network, aborted, timed out — and is left to the caller, which is the
// only place that knows whether the page has moved on in the meantime.
export async function lookupBarcode(digits, signal) {
	if (normalizeBarcode(digits) === "") return { status: "failed", matches: [] };

	const response = await fetch(LOOKUP_URL(digits), { signal });

	if (response.status === 503 || response.status === 429) return { status: "busy" };
	if (!response.ok) return { status: "failed" };

	let body;
	try {
		body = await response.json();
	} catch {
		return { status: "failed" };
	}

	if (!body || typeof body !== "object" || !Array.isArray(body.releases)) {
		return { status: "failed" };
	}

	return { status: "ok", matches: collapseReleases(body.releases) };
}
