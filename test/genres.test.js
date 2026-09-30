import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
	commitGenres,
	fetchGenres,
	GENRES_URL,
	genreKey,
	mergeGenres,
	pickGenres,
} from "../Model/musicbrainz.js";

const NEVERMIND_ID = "1b022e01-4da6-387b-8658-8678046e4cef";
// Nevermind's release group, as voted on 2026-09-28.
const NEVERMIND = [
	{ id: "a", name: "grunge", count: 48, disambiguation: "" },
	{ id: "b", name: "alternative rock", count: 20, disambiguation: "" },
	{ id: "c", name: "rock", count: 5, disambiguation: "" },
	{ id: "d", name: "punk rock", count: 3, disambiguation: "" },
];

test("pickGenres keeps a quarter of the top votes: Nevermind is grunge and alternative rock", () => {
	assert.deepEqual(pickGenres(NEVERMIND), ["grunge", "alternative rock"]);
	assert.deepEqual(pickGenres([...NEVERMIND].reverse()), ["grunge", "alternative rock"]);
});

test("pickGenres keeps at most three, and ties are broken by name in either order", () => {
	const tied = ["shoegaze", "dream pop", "noise pop", "ambient"].map((name) => ({
		name,
		count: 10,
	}));
	assert.deepEqual(pickGenres(tied), ["ambient", "dream pop", "noise pop"]);
	assert.deepEqual(pickGenres([...tied].reverse()), ["ambient", "dream pop", "noise pop"]);
});

test("pickGenres gives nothing for a response that is not a list", () => {
	for (const value of [undefined, null, "rock", 42, {}, { length: 1, 0: { name: "rock" } }]) {
		assert.deepEqual(pickGenres(value), []);
	}
});

test("pickGenres drops malformed entries and cleans the names it keeps", () => {
	const long = "x".repeat(500);
	const picked = pickGenres([
		null,
		"rock",
		{ name: 42, count: 10 },
		{ name: "rock", count: Number.NaN },
		{ name: "pop", count: "9" },
		{ name: "jazz", count: 0 },
		{ name: "   ", count: 9 },
		{ name: long, count: 8 },
		{ name: "  indie\u0000 \n rock ", count: 7 },
	]);
	assert.deepEqual(picked, ["x".repeat(40), "indie rock"]);
});

test("pickGenres turns a lone control or format character into a space", () => {
	const picked = pickGenres([
		{ name: "hip\u0001hop", count: 10 },
		{ name: "post‮rock", count: 9 },
		{ name: "shoe​gaze", count: 8 },
	]);
	assert.deepEqual(picked, ["hip hop", "post rock", "shoe gaze"]);
});

test("pickGenres keeps one of two spellings of the same genre", () => {
	const picked = pickGenres([
		{ name: "hip hop", count: 10 },
		{ name: "hip-hop", count: 9 },
	]);
	assert.deepEqual(picked, ["hip hop"]);
});

test("genreKey: case, hyphens and whitespace do not matter", () => {
	assert.equal(genreKey("Hip-hop"), "hip hop");
	assert.equal(genreKey("hip  hop"), "hip hop");
	assert.equal(genreKey(" HIP - HOP "), "hip hop");
});

test("mergeGenres ticks what is on my list and capitalises what is new", () => {
	const merged = mergeGenres(["Rock", "Hip-hop", "Jazz"], ["hip hop", "grunge", "rock"]);
	assert.deepEqual(merged, {
		indexes: [1, 0],
		fresh: ["Grunge"],
		names: ["Hip-hop", "Grunge", "Rock"],
	});
});

test("commitGenres adds only ticked new names, never a twin, and leaves the list alone", () => {
	const list = ["Rock"];
	const committed = commitGenres(list, [
		{ name: "Grunge", checked: true },
		{ name: "Shoegaze", checked: false },
		{ name: "rock", checked: true },
		{ name: "grunge", checked: true },
	]);
	assert.deepEqual(committed, { list: ["Rock", "Grunge"], indexes: [1, 0] });
	assert.deepEqual(list, ["Rock"]);
});

test("GENRES_URL asks for one release group's genres, and only by a UUID", () => {
	assert.equal(
		GENRES_URL(NEVERMIND_ID),
		`https://musicbrainz.org/ws/2/release-group/${NEVERMIND_ID}?inc=genres&fmt=json`,
	);
	assert.throws(() => GENRES_URL("../release/x"));
	assert.throws(() => GENRES_URL(""));
});

const realFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = realFetch;
});

test("fetchGenres picks from a good answer", async () => {
	let asked = "";
	globalThis.fetch = async (url) => {
		asked = url;
		return { ok: true, status: 200, json: async () => ({ genres: NEVERMIND }) };
	};
	assert.deepEqual(await fetchGenres(NEVERMIND_ID), {
		status: "ok",
		genres: ["grunge", "alternative rock"],
	});
	assert.equal(asked, GENRES_URL(NEVERMIND_ID));
});

test("fetchGenres fails on a busy server, a bad body and a bad id", async () => {
	globalThis.fetch = async () => ({ ok: false, status: 503 });
	assert.deepEqual(await fetchGenres(NEVERMIND_ID), { status: "failed" });

	globalThis.fetch = async () => ({
		ok: true,
		status: 200,
		json: async () => {
			throw new SyntaxError("bad json");
		},
	});
	assert.deepEqual(await fetchGenres(NEVERMIND_ID), { status: "failed" });

	let called = false;
	globalThis.fetch = async () => {
		called = true;
	};
	assert.deepEqual(await fetchGenres("not-a-uuid"), { status: "failed" });
	assert.equal(called, false);
});

test("fetchGenres gives no genres when the body has none", async () => {
	globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
	assert.deepEqual(await fetchGenres(NEVERMIND_ID), { status: "ok", genres: [] });
});
