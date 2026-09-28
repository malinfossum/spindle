import assert from "node:assert/strict";
import { test } from "node:test";
import { guessSquare } from "../View/Universal/cropGuess.js";

// A made-up photo: a plain ground with one rectangle on it. `paint` can
// replace the ground pixel by pixel. The sample is 100 × 75 and the photo is
// ten times that, so every test also checks the scaling back to full size.
function image(width, height, ground, box, colour, paint) {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const inside =
				box && x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;
			data.set(inside ? colour : paint ? paint(x, y) : ground, (y * width + x) * 4);
		}
	}
	return { data, width, height };
}

const PHOTO = { width: 1000, height: 750 };
const CENTRE = { x: 125, y: 0, side: 750 };
const TABLE = [120, 90, 60, 255];
const SLEEVE = [230, 230, 220, 255];

test("a sleeve on a plain table gives its own square", () => {
	const sample = image(100, 75, TABLE, { x: 30, y: 10, w: 50, h: 50 }, SLEEVE);
	assert.deepEqual(guessSquare(sample, PHOTO), { x: 300, y: 100, side: 500 });
});

test("a sleeve on a transparent ground is found by its alpha", () => {
	const sample = image(100, 75, [0, 0, 0, 0], { x: 30, y: 10, w: 50, h: 50 }, [0, 0, 0, 255]);
	assert.deepEqual(guessSquare(sample, PHOTO), { x: 300, y: 100, side: 500 });
});

test("a box that is nearly square becomes its longer side, centred on the box", () => {
	const sample = image(100, 75, TABLE, { x: 30, y: 10, w: 45, h: 50 }, SLEEVE);
	assert.deepEqual(guessSquare(sample, PHOTO), { x: 275, y: 100, side: 500 });
});

test("a sleeve wider than the photo is tall keeps its centre", () => {
	const sample = image(100, 75, TABLE, { x: 5, y: 4, w: 80, h: 67 }, SLEEVE);
	assert.deepEqual(guessSquare(sample, PHOTO), { x: 75, y: 0, side: 750 });
});

test("low contrast gives the centre", () => {
	const faint = [TABLE[0] + 15, TABLE[1] + 15, TABLE[2] + 15, 255];
	const sample = image(100, 75, TABLE, { x: 30, y: 10, w: 50, h: 50 }, faint);
	assert.deepEqual(guessSquare(sample, PHOTO), CENTRE);
});

test("a busy background gives the centre", () => {
	const checker = (x, y) => ((x + y) % 2 ? [0, 0, 0, 255] : [255, 255, 255, 255]);
	const sample = image(100, 75, null, { x: 30, y: 10, w: 50, h: 50 }, SLEEVE, checker);
	assert.deepEqual(guessSquare(sample, PHOTO), CENTRE);
});

test("a long thin shape gives the centre", () => {
	const sample = image(100, 75, TABLE, { x: 10, y: 30, w: 80, h: 20 }, SLEEVE);
	assert.deepEqual(guessSquare(sample, PHOTO), CENTRE);
});

test("a small sleeve gives the centre", () => {
	const sample = image(100, 75, TABLE, { x: 35, y: 20, w: 30, h: 30 }, SLEEVE);
	assert.deepEqual(guessSquare(sample, PHOTO), CENTRE);
});

test("a plain photo with nothing on it gives the centre", () => {
	const sample = image(100, 75, TABLE);
	assert.deepEqual(guessSquare(sample, PHOTO), CENTRE);
});
