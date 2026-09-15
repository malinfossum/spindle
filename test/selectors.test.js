import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { blankAlbum, model } from "../Model/model.js";
import { findByBarcode } from "../Model/selectors.js";

beforeEach(() => {
	model.data.musicInfo = [
		{ ...blankAlbum(), id: 11, artist: "Nirvana", title: "Nevermind", barcode: "720642442524" },
		{ ...blankAlbum(), id: 12, artist: "Megadeth", title: "Rust in Peace", barcode: "" },
	];
});

test("findByBarcode returns the album carrying that barcode", () => {
	assert.equal(findByBarcode("720642442524", null)?.id, 11);
});

test("findByBarcode returns null when nothing carries it", () => {
	assert.equal(findByBarcode("00000000", null), null);
	assert.equal(findByBarcode("", null), null);
});

test("findByBarcode skips the album being edited", () => {
	assert.equal(findByBarcode("720642442524", 11), null);
});
