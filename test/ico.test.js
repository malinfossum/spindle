import assert from "node:assert/strict";
import { test } from "node:test";
import { packIco } from "../scripts/ico.js";

const a = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
const b = Buffer.from([0x89, 0x50, 0x4e, 0x47, 9, 8, 7, 6, 5]);

test("packIco writes an ICO header with one entry per image", () => {
	const ico = packIco([
		{ size: 16, png: a },
		{ size: 32, png: b },
	]);
	assert.equal(ico.readUInt16LE(0), 0); // reserved
	assert.equal(ico.readUInt16LE(2), 1); // type: icon
	assert.equal(ico.readUInt16LE(4), 2); // count
});

test("packIco points each entry at its PNG, in order", () => {
	const ico = packIco([
		{ size: 16, png: a },
		{ size: 32, png: b },
	]);
	const first = 6;
	const second = 6 + 16;
	assert.equal(ico.readUInt8(first), 16);
	assert.equal(ico.readUInt8(first + 1), 16);
	assert.equal(ico.readUInt16LE(first + 4), 1); // planes
	assert.equal(ico.readUInt16LE(first + 6), 32); // bits per pixel
	assert.equal(ico.readUInt32LE(first + 8), a.length);
	const offsetA = ico.readUInt32LE(first + 12);
	assert.equal(offsetA, 6 + 2 * 16);
	assert.deepEqual(ico.subarray(offsetA, offsetA + a.length), a);

	assert.equal(ico.readUInt8(second), 32);
	const offsetB = ico.readUInt32LE(second + 12);
	assert.equal(offsetB, offsetA + a.length);
	assert.deepEqual(ico.subarray(offsetB, offsetB + b.length), b);
	assert.equal(ico.length, offsetB + b.length);
});

test("packIco writes 0 for a 256 px side, as the format requires", () => {
	const ico = packIco([{ size: 256, png: a }]);
	assert.equal(ico.readUInt8(6), 0);
	assert.equal(ico.readUInt8(7), 0);
});
