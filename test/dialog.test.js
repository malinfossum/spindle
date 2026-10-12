import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesConfirmWord } from "../View/Universal/dialog.js";

test("the word matches in any case, with spaces around it", () => {
	for (const typed of ["DELETE", "delete", " Delete ", "Delete\t"]) {
		assert.equal(matchesConfirmWord(typed, "DELETE"), true, typed);
	}
	assert.equal(matchesConfirmWord("slett", "SLETT"), true);
});

test("anything else does not match", () => {
	for (const typed of ["", "DELET", "DELETED", "DEL ETE", "SLETT"]) {
		assert.equal(matchesConfirmWord(typed, "DELETE"), false, typed);
	}
	assert.equal(matchesConfirmWord("", ""), false);
});
