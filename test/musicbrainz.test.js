import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
	COVER_MAX_BYTES,
	COVER_URL,
	collapseReleases,
	fetchCover,
	isReleaseGroupId,
	LOOKUP_URL,
	lookupBarcode,
	mapMediumFormat,
} from "../Model/musicbrainz.js";

function release(title, artist, date, mediumFormat, releaseGroupId) {
	return {
		title,
		"artist-credit": [{ name: artist, joinphrase: "" }],
		...(date === undefined ? {} : { date }),
		...(mediumFormat === undefined ? {} : { media: [{ format: mediumFormat }] }),
		...(releaseGroupId === undefined ? {} : { "release-group": { id: releaseGroupId } }),
	};
}

const FIXTURE = [
	release("Nevermind", "Nirvana", "1991-09-24", "CD", "1b022e01-4da6-387b-8658-8678046e4cef"),
	release("Nevermind", "Nirvana", "1991", '12" Vinyl'),
	release("Nevermind", "Nirvana", undefined, undefined),
	release("Nevermind", "nirvana", "2011-09-19", "CD"),
	release("Outcesticide", "Nirvana", "1994", "CD"),
	release("Rust in Peace", "Megadeth", "1990-09-24", "Cassette"),
];

test("mapMediumFormat maps MusicBrainz medium names onto ALBUM_FORMATS", () => {
	assert.equal(mapMediumFormat("CD"), "cd");
	assert.equal(mapMediumFormat("CD-R"), "cd");
	assert.equal(mapMediumFormat('12" Vinyl'), "lp");
	assert.equal(mapMediumFormat("Cassette"), "cassette");
	assert.equal(mapMediumFormat("Digital Media"), "other");
});

test("collapseReleases folds pressings into one match per artist and title", () => {
	const matches = collapseReleases(FIXTURE);
	assert.deepEqual(matches, [
		{
			artist: "Nirvana",
			title: "Nevermind",
			year: 1991,
			format: "cd",
			releaseGroupId: "1b022e01-4da6-387b-8658-8678046e4cef",
		},
		{ artist: "Nirvana", title: "Outcesticide", year: 1994, format: "cd", releaseGroupId: "" },
		{
			artist: "Megadeth",
			title: "Rust in Peace",
			year: 1990,
			format: "cassette",
			releaseGroupId: "",
		},
	]);
});

test("collapseReleases keeps the earliest year and the first mappable format", () => {
	const matches = collapseReleases([
		release("X", "A", undefined, undefined),
		release("X", "A", "2011", undefined),
		release("X", "A", "1991", "Cassette"),
	]);
	assert.deepEqual(matches, [
		{ artist: "A", title: "X", year: 1991, format: "cassette", releaseGroupId: "" },
	]);
});

test("collapseReleases skips a release that is not shaped like one", () => {
	const matches = collapseReleases([
		{ title: 42, "artist-credit": [{ name: "A" }] },
		{ title: "No credit", "artist-credit": [] },
		{ title: "No credit key" },
		{ title: "Bad year", "artist-credit": [{ name: "A" }], date: "0099-01-01" },
		null,
	]);
	assert.deepEqual(matches, [
		{ artist: "A", title: "Bad year", year: null, format: "", releaseGroupId: "" },
	]);
});

test("collapseReleases joins a multi-artist credit with its join phrases", () => {
	const matches = collapseReleases([
		{
			title: "Split",
			"artist-credit": [{ name: "A", joinphrase: " & " }, { artist: { name: "B" } }],
		},
	]);
	assert.equal(matches[0].artist, "A & B");
});

test("LOOKUP_URL asks for the barcode as JSON with the maximum page size", () => {
	assert.equal(
		LOOKUP_URL("720642442524"),
		"https://musicbrainz.org/ws/2/release/?query=barcode:720642442524&fmt=json&limit=100",
	);
});

const realFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = realFetch;
});

function stubFetch(status, body) {
	globalThis.fetch = async () => ({
		ok: status >= 200 && status < 300,
		status,
		json: async () => {
			if (body === "not json") throw new SyntaxError("bad");
			return body;
		},
	});
}

test("lookupBarcode returns collapsed matches on a good response", async () => {
	stubFetch(200, { releases: FIXTURE });
	const result = await lookupBarcode("720642442524", new AbortController().signal);
	assert.equal(result.status, "ok");
	assert.equal(result.matches.length, 3);
});

test("lookupBarcode reports busy on 503 and 429", async () => {
	stubFetch(503, {});
	assert.deepEqual(await lookupBarcode("720642442524"), { status: "busy" });
	stubFetch(429, {});
	assert.deepEqual(await lookupBarcode("720642442524"), { status: "busy" });
});

test("lookupBarcode reports failed on any other non-2xx, bad JSON, or a body with no releases", async () => {
	stubFetch(500, {});
	assert.deepEqual(await lookupBarcode("720642442524"), { status: "failed" });
	stubFetch(200, "not json");
	assert.deepEqual(await lookupBarcode("720642442524"), { status: "failed" });
	stubFetch(200, { count: 0 });
	assert.deepEqual(await lookupBarcode("720642442524"), { status: "failed" });
});

test("lookupBarcode lets a fetch rejection through", async () => {
	globalThis.fetch = async () => {
		throw new DOMException("aborted", "AbortError");
	};
	await assert.rejects(lookupBarcode("720642442524"), { name: "AbortError" });
});

test("lookupBarcode rejects digits that don't normalize without calling fetch", async () => {
	globalThis.fetch = () => {
		throw new Error("fetch should not be called");
	};
	assert.deepEqual(await lookupBarcode("abc"), { status: "failed", matches: [] });
});

test("lookupBarcode passes the signal and no custom headers", async () => {
	let seen;
	globalThis.fetch = async (url, init) => {
		seen = { url, init };
		return { ok: true, status: 200, json: async () => ({ releases: [] }) };
	};
	const signal = new AbortController().signal;
	await lookupBarcode("720642442524", signal);
	assert.equal(seen.url, LOOKUP_URL("720642442524"));
	assert.equal(seen.init.signal, signal);
	assert.equal(seen.init.headers, undefined);
});

test("collapseReleases keeps the first release's group id, only when it is a UUID", () => {
	const matches = collapseReleases([
		release("X", "A", "1991", "CD", "../release/x"),
		release("X", "A", "1992", "CD", "1b022e01-4da6-387b-8658-8678046e4cef"),
		release("Y", "A", "1991", "CD", "1B022E01-4DA6-387B-8658-8678046E4CEF"),
		{ title: "Z", "artist-credit": [{ name: "A" }], "release-group": "not an object" },
	]);
	assert.deepEqual(
		matches.map((m) => [m.title, m.releaseGroupId]),
		[
			["X", ""],
			["Y", ""],
			["Z", ""],
		],
	);
});

test("isReleaseGroupId accepts a lower-case UUID and nothing else", () => {
	assert.equal(isReleaseGroupId("1b022e01-4da6-387b-8658-8678046e4cef"), true);
	assert.equal(isReleaseGroupId("1B022E01-4DA6-387B-8658-8678046E4CEF"), false);
	assert.equal(isReleaseGroupId("../release/x"), false);
	assert.equal(isReleaseGroupId(""), false);
	assert.equal(isReleaseGroupId(null), false);
});

test("COVER_URL puts the id in the release-group path", () => {
	assert.equal(
		COVER_URL("1b022e01-4da6-387b-8658-8678046e4cef"),
		"https://coverartarchive.org/release-group/1b022e01-4da6-387b-8658-8678046e4cef/front-500",
	);
});

function stubCoverFetch(status, bytes, headers = {}) {
	globalThis.fetch = async (url) => {
		globalThis.__coverUrl = url;
		return {
			ok: status >= 200 && status < 300,
			status,
			headers: { get: (name) => headers[name.toLowerCase()] ?? null },
			blob: async () => new Blob([new Uint8Array(bytes)]),
		};
	};
}

const RG = "1b022e01-4da6-387b-8658-8678046e4cef";

test("fetchCover returns the blob on 200", async () => {
	stubCoverFetch(200, [0x89, 0x50, 0x4e, 0x47]);
	const result = await fetchCover(RG, new AbortController().signal);
	assert.equal(result.status, "ok");
	assert.equal(result.blob.size, 4);
	assert.equal(globalThis.__coverUrl, COVER_URL(RG));
});

test("fetchCover maps 404 to none, 503 and 429 to busy, anything else to failed", async () => {
	stubCoverFetch(404, []);
	assert.deepEqual(await fetchCover(RG, undefined), { status: "none" });
	stubCoverFetch(503, []);
	assert.deepEqual(await fetchCover(RG, undefined), { status: "busy" });
	stubCoverFetch(429, []);
	assert.deepEqual(await fetchCover(RG, undefined), { status: "busy" });
	stubCoverFetch(500, []);
	assert.deepEqual(await fetchCover(RG, undefined), { status: "failed" });
});

test("fetchCover never requests a missing or malformed release group", async () => {
	globalThis.fetch = async () => {
		throw new Error("must not be called");
	};
	assert.deepEqual(await fetchCover("", undefined), { status: "none" });
	assert.deepEqual(await fetchCover("../release/x", undefined), { status: "none" });
});

test("fetchCover refuses a body over the cap before and after download", async () => {
	stubCoverFetch(200, [1, 2, 3], { "content-length": String(COVER_MAX_BYTES + 1) });
	assert.deepEqual(await fetchCover(RG, undefined), { status: "failed" });

	// A number makes new Uint8Array(n) a zeroed buffer of that length.
	stubCoverFetch(200, COVER_MAX_BYTES + 1);
	assert.deepEqual(await fetchCover(RG, undefined), { status: "failed" });
});

test("fetchCover lets a rejected fetch through to the caller", async () => {
	globalThis.fetch = async () => {
		throw new DOMException("aborted", "AbortError");
	};
	await assert.rejects(() => fetchCover(RG, undefined), { name: "AbortError" });
});
