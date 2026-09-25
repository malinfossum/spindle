import assert from "node:assert/strict";
import { test } from "node:test";
import { installRowState } from "../Model/install.js";

const base = { canPrompt: false, outcome: "", ios: false, standalone: false };

test("an event kept and not installed shows the button", () => {
	assert.equal(installRowState({ ...base, canPrompt: true }), "button");
});

test("an answered prompt shows the outcome, even if the event came back", () => {
	assert.equal(installRowState({ ...base, outcome: "accepted" }), "outcome");
	assert.equal(installRowState({ ...base, outcome: "dismissed", canPrompt: true }), "outcome");
	assert.equal(installRowState({ ...base, outcome: "dismissed", ios: true }), "outcome");
});

test("iOS and not running installed shows the instruction", () => {
	assert.equal(installRowState({ ...base, ios: true }), "ios");
});

test("running installed shows nothing, whatever else is true", () => {
	assert.equal(installRowState({ ...base, standalone: true, canPrompt: true }), "none");
	assert.equal(installRowState({ ...base, standalone: true, ios: true }), "none");
	assert.equal(installRowState({ ...base, standalone: true, outcome: "accepted" }), "none");
});

test("any other browser shows nothing", () => {
	assert.equal(installRowState(base), "none");
});
