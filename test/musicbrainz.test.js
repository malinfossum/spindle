import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
	collapseReleases,
	LOOKUP_URL,
	lookupBarcode,
	mapMediumFormat,
} from "../Model/musicbrainz.js";

function release(title, artist, date, mediumFormat) {
	return {
		title,
		"artist-credit": [{ name: artist, joinphrase: "" }],
		...(date === undefined ? {} : { date }),
		...(mediumFormat === undefined ? {} : { media: [{ format: mediumFormat }] }),
	};
}

const FIXTURE = [
	release("Nevermind", "Nirvana", "1991-09-24", "CD"),
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
		{ artist: "Nirvana", title: "Nevermind", year: 1991, format: "cd" },
		{ artist: "Nirvana", title: "Outcesticide", year: 1994, format: "cd" },
		{ artist: "Megadeth", title: "Rust in Peace", year: 1990, format: "cassette" },
	]);
});

test("collapseReleases keeps the earliest year and the first mappable format", () => {
	const matches = collapseReleases([
		release("X", "A", undefined, undefined),
		release("X", "A", "2011", undefined),
		release("X", "A", "1991", "Cassette"),
	]);
	assert.deepEqual(matches, [{ artist: "A", title: "X", year: 1991, format: "cassette" }]);
});

test("collapseReleases skips a release that is not shaped like one", () => {
	const matches = collapseReleases([
		{ title: 42, "artist-credit": [{ name: "A" }] },
		{ title: "No credit", "artist-credit": [] },
		{ title: "No credit key" },
		{ title: "Bad year", "artist-credit": [{ name: "A" }], date: "0099-01-01" },
		null,
	]);
	assert.deepEqual(matches, [{ artist: "A", title: "Bad year", year: null, format: "" }]);
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
