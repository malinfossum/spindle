import assert from "node:assert/strict";
import { test } from "node:test";
import { wipeLibrary } from "../Model/deleteLibrary.js";

function recorder({ storesFail = false } = {}) {
	const calls = [];
	return {
		calls,
		steps: {
			clearStores: async () => {
				calls.push("clearStores");
				if (storesFail) throw new Error("aborted");
			},
			removeLibrary: () => calls.push("removeLibrary"),
			resetLookups: () => calls.push("resetLookups"),
		},
	};
}

test("the three steps run in order", async () => {
	const { calls, steps } = recorder();
	const result = await wipeLibrary(steps);
	assert.deepEqual(result, { ok: true });
	assert.deepEqual(calls, ["clearStores", "removeLibrary", "resetLookups"]);
});

test("a failed store clear removes nothing else", async () => {
	const { calls, steps } = recorder({ storesFail: true });
	const result = await wipeLibrary(steps);
	assert.equal(result.ok, false);
	assert.equal(result.reason, "stores");
	assert.deepEqual(calls, ["clearStores"]);
});
