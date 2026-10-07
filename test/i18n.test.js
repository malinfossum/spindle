import assert from "node:assert/strict";
import { test } from "node:test";
import { STRINGS_EN } from "../Model/i18n/en.js";
import { formatNumber } from "../Model/i18n/i18n.js";
import { STRINGS_NO } from "../Model/i18n/no.js";

// In v0.5 a rewrite of en.js dropped about 130 keys and every other test
// stayed green. A key in one table and not the other falls back to Norwegian
// or shows as the bare key, so the two tables must match exactly.
test("the Norwegian and English tables have the same keys", () => {
	const no = Object.keys(STRINGS_NO);
	const en = Object.keys(STRINGS_EN);
	assert.deepEqual(
		en.filter((key) => !Object.hasOwn(STRINGS_NO, key)),
		[],
		"only in en.js",
	);
	assert.deepEqual(
		no.filter((key) => !Object.hasOwn(STRINGS_EN, key)),
		[],
		"only in no.js",
	);
});

test("no string is empty", () => {
	for (const [name, table] of [
		["no.js", STRINGS_NO],
		["en.js", STRINGS_EN],
	]) {
		for (const [key, value] of Object.entries(table)) {
			assert.ok(typeof value === "string" && value.trim() !== "", `${name}: ${key}`);
		}
	}
});

test("formatNumber: a decimal comma in Norwegian, a point in English, one decimal at most", () => {
	assert.equal(formatNumber(3.5, "no"), "3,5");
	assert.equal(formatNumber(-3.5, "no"), "−3,5");
	assert.equal(formatNumber(90, "no"), "90");
	assert.equal(formatNumber(3.5, "en"), "3.5");
	assert.equal(formatNumber(1.4641, "en"), "1.5");
});
