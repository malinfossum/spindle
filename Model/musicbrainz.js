// The one file that knows the hosts (v0.4, v0.5).
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
// The cover (v0.5) is the second: a release-group id is used only when it is
// a UUID, and the image is trusted by its bytes, checked by the Controller
// with the same sniff a chosen file gets.
// The genres (v0.7) are the third: names are cleaned and capped in pickGenres()
// before anything else sees them.
//
// Verified 2026-09-15: the endpoint answers with Access-Control-Allow-Origin:
// *, needs no key, and returns 503 when busy as a matter of course. No custom
// headers are sent — a browser cannot set User-Agent, and any other header
// would turn the request into a preflighted one for nothing.

import { ALBUM_FORMATS, normalizeBarcode } from "./model.js";

const HOST = "https://musicbrainz.org";
// The same project, one more host (v0.5). front-500 caps the download at a
// 500 px edge, well under downscale's 700, so a slow connection never pulls a
// 3000 px scan. The archive answers with a redirect to archive.org and from
// there to a *.archive.org mirror — connect-src in public/_headers names all
// three, and the probe that established that is Task 1 of docs/v0.5-tasks.md.
const COVER_HOST = "https://coverartarchive.org";
export const COVER_MAX_BYTES = 2 * 1024 * 1024;

// A release-group id goes into a URL path, and it comes from a third party:
// only a lower-case UUID is allowed to. Missing and malformed are the same
// case — no request. Upper case is rejected on purpose: MusicBrainz never
// writes one, so an upper-case id is not a MusicBrainz id.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isReleaseGroupId(value) {
	return typeof value === "string" && UUID.test(value);
}

export function COVER_URL(releaseGroupId) {
	return `${COVER_HOST}/release-group/${releaseGroupId}/front-500`;
}

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

// The release group's id when it is a UUID, "" otherwise — never a value that
// could be spliced into a path.
function releaseGroupOf(release) {
	const group = release["release-group"];
	const id = group && typeof group === "object" ? group.id : undefined;
	return isReleaseGroupId(id) ? id : "";
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
// for; a bootleg with its own title stays its own entry. The release group of
// the first release seen is what the cover is fetched by.
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
			byKey.set(key, {
				artist,
				title: release.title,
				year,
				format,
				// Of the first release in the group (v0.5): every pressing of one
				// album shares a release group, so the first one is as good as any.
				releaseGroupId: releaseGroupOf(release),
			});
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

// The front cover of a release group, as a blob, or why there is none. The
// caller sniffs the bytes and decodes them: this file has no DOM and does not
// import the View's image helpers. A rejection is fetch's own — aborted,
// timed out, offline — and is left to the caller, as lookupBarcode() does.
export async function fetchCover(releaseGroupId, signal) {
	if (!isReleaseGroupId(releaseGroupId)) return { status: "none" };

	const response = await fetch(COVER_URL(releaseGroupId), { signal });

	if (response.status === 404) return { status: "none" };
	if (response.status === 503 || response.status === 429) return { status: "busy" };
	if (!response.ok) return { status: "failed" };

	// front-500 is a request, not a guarantee. The header is checked so an
	// oversized file is not downloaded; the blob is checked because the header
	// can be absent or wrong across a redirect.
	const declared = Number(response.headers.get("content-length"));
	if (declared > COVER_MAX_BYTES) return { status: "failed" };

	const blob = await response.blob();
	if (blob.size > COVER_MAX_BYTES) return { status: "failed" };

	return { status: "ok", blob };
}

// Genres (v0.7). The same host, one more request: the release group's voted
// genres. Only the top ones count — at least a quarter of the top genre's
// votes, at most three — so Nevermind gives grunge and alternative rock and
// not every genre someone once voted for.
export const GENRE_SHARE = 0.25;
export const GENRE_MAX = 3;
export const GENRE_NAME_MAX = 40;

export function GENRES_URL(releaseGroupId) {
	if (!isReleaseGroupId(releaseGroupId)) throw new Error("Not a release-group id");
	return `${HOST}/ws/2/release-group/${releaseGroupId}?inc=genres&fmt=json`;
}

// Every genre comparison goes through this: lower case, and hyphens and runs
// of whitespace as one space, so MusicBrainz's "hip hop" finds my "Hip-hop"
// instead of adding a twin.
export function genreKey(name) {
	return name
		.toLowerCase()
		.replace(/[-\s]+/g, " ")
		.trim();
}

// A control character becomes a space before whitespace is collapsed, so
// "hip\thop" stays two words. The cap counts characters, not UTF-16 units.
function cleanGenreName(name) {
	const flat = name
		.replace(/\p{Cc}/gu, " ")
		.replace(/\s+/g, " ")
		.trim();
	return [...flat].slice(0, GENRE_NAME_MAX).join("").trim();
}

// The trust boundary for the genre response. Anything that is not an array
// gives nothing; an entry needs a string name and a finite vote count above
// zero. Sorted by votes, ties by name, so the result never depends on the
// order the response came in.
export function pickGenres(genres) {
	if (!Array.isArray(genres)) return [];

	const valid = [];
	for (const entry of genres) {
		if (!entry || typeof entry !== "object") continue;
		if (typeof entry.name !== "string") continue;
		if (typeof entry.count !== "number" || !Number.isFinite(entry.count) || entry.count <= 0) {
			continue;
		}
		const name = cleanGenreName(entry.name);
		if (name !== "") valid.push({ name, count: entry.count });
	}
	if (valid.length === 0) return [];

	valid.sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

	const floor = valid[0].count * GENRE_SHARE;
	const seen = new Set();
	const picked = [];
	for (const { name, count } of valid) {
		if (count < floor || picked.length === GENRE_MAX) break;
		const key = genreKey(name);
		if (seen.has(key)) continue;
		seen.add(key);
		picked.push(name);
	}
	return picked;
}

function capitalise(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

// Picked names against my list: the positions to tick, the names that are
// new (with a capital first letter, "alternative rock" → "Alternative rock"),
// and every name as it will show, in vote order, for the status line.
export function mergeGenres(list, picked) {
	const indexes = [];
	const fresh = [];
	const names = [];
	for (const name of picked) {
		const key = genreKey(name);
		const index = list.findIndex((existing) => genreKey(existing) === key);
		if (index === -1) {
			const shown = capitalise(name);
			fresh.push(shown);
			names.push(shown);
		} else if (!indexes.includes(index)) {
			indexes.push(index);
			names.push(list[index]);
		}
	}
	return { indexes, fresh, names };
}

// At Save: the ticked new names join the list, unless the same genre is on
// it by now (I may have added it by hand meanwhile), and the album gets each
// one's position. Returns a new list; the one passed in is not touched.
export function commitGenres(list, pending) {
	const next = [...list];
	const indexes = [];
	for (const { name, checked } of pending) {
		if (!checked) continue;
		const key = genreKey(name);
		let index = next.findIndex((existing) => genreKey(existing) === key);
		if (index === -1) {
			next.push(name);
			index = next.length - 1;
		}
		if (!indexes.includes(index)) indexes.push(index);
	}
	return { list: next, indexes };
}

// The genres of a release group, already picked. A rejection is fetch's own
// (aborted, timed out, offline) and is left to the caller, as lookupBarcode()
// does. Busy and failed are one case here: the look-up has already filled the
// form, and a genre that does not arrive says nothing.
export async function fetchGenres(releaseGroupId, signal) {
	if (!isReleaseGroupId(releaseGroupId)) return { status: "failed" };

	const response = await fetch(GENRES_URL(releaseGroupId), { signal });
	if (!response.ok) return { status: "failed" };

	let body;
	try {
		body = await response.json();
	} catch {
		return { status: "failed" };
	}
	if (!body || typeof body !== "object") return { status: "failed" };

	return { status: "ok", genres: pickGenres(body.genres) };
}
