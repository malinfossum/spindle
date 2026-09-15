import assert from "node:assert/strict";
import { test } from "node:test";
import { blankAlbum, normalizeBarcode } from "../Model/model.js";

test("a blank album carries an empty barcode", () => {
	assert.equal(blankAlbum().barcode, "");
});

test("normalizeBarcode keeps 8 to 14 ASCII digits", () => {
	assert.equal(normalizeBarcode("720642442524"), "720642442524");
	assert.equal(normalizeBarcode("12345678"), "12345678");
	assert.equal(normalizeBarcode("12345678901234"), "12345678901234");
});

test("normalizeBarcode coerces everything else to empty", () => {
	assert.equal(normalizeBarcode("  7206 42442524 "), "");
	assert.equal(normalizeBarcode("1234567"), "");
	assert.equal(normalizeBarcode("123456789012345"), "");
	assert.equal(normalizeBarcode("abc"), "");
	assert.equal(normalizeBarcode("٧٢٠٦٤٢٤٤٢٥٢٤"), "");
	assert.equal(normalizeBarcode(12345678), "");
	assert.equal(normalizeBarcode(null), "");
	assert.equal(normalizeBarcode(undefined), "");
});
