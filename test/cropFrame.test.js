import assert from "node:assert/strict";
import { test } from "node:test";
import {
	canZoomIn,
	canZoomOut,
	centreSquare,
	clampFrame,
	keyStep,
	panBy,
	sideLimits,
	wheelFactor,
	ZOOM_STEP,
	zoomAt,
	zoomBy,
} from "../View/Universal/cropFrame.js";

const PHOTO = { width: 4000, height: 3000 };

test("sideLimits: a quarter of the shorter side, never below 200 px", () => {
	assert.deepEqual(sideLimits(PHOTO), { min: 750, max: 3000 });
	assert.deepEqual(sideLimits({ width: 600, height: 400 }), { min: 200, max: 400 });
	// Smaller than the floor: the whole shorter side, and no zoom at all.
	assert.deepEqual(sideLimits({ width: 150, height: 120 }), { min: 120, max: 120 });
});

test("centreSquare: the largest square that fits, centred", () => {
	assert.deepEqual(centreSquare(PHOTO), { x: 500, y: 0, side: 3000 });
	assert.deepEqual(centreSquare({ width: 300, height: 500 }), { x: 0, y: 100, side: 300 });
});

test("clampFrame keeps the square inside the photo and inside the zoom limits", () => {
	assert.deepEqual(clampFrame({ x: -50, y: -50, side: 1000 }, PHOTO), { x: 0, y: 0, side: 1000 });
	assert.deepEqual(clampFrame({ x: 3900, y: 2900, side: 1000 }, PHOTO), {
		x: 3000,
		y: 2000,
		side: 1000,
	});
	assert.deepEqual(clampFrame({ x: 0, y: 0, side: 9000 }, PHOTO), { x: 0, y: 0, side: 3000 });
	assert.deepEqual(clampFrame({ x: 100, y: 100, side: 10 }, PHOTO), {
		x: 100,
		y: 100,
		side: 750,
	});
});

test("zoomAt keeps the given point where it was", () => {
	const frame = { x: 1000, y: 0, side: 2000 };
	// (1500, 500) sits a quarter of the way into the square on both axes, and
	// after halving the side it still does.
	assert.deepEqual(zoomAt(frame, PHOTO, 1000, 1500, 500), { x: 1250, y: 250, side: 1000 });
});

test("zoomBy stops at both limits, and the buttons know it", () => {
	let frame = centreSquare(PHOTO);
	assert.equal(canZoomOut(frame, PHOTO), false);
	assert.equal(canZoomIn(frame, PHOTO), true);

	for (let i = 0; i < 50; i++) frame = zoomBy(frame, PHOTO, ZOOM_STEP);
	assert.equal(frame.side, 750);
	assert.equal(canZoomIn(frame, PHOTO), false);
	assert.equal(canZoomOut(frame, PHOTO), true);

	for (let i = 0; i < 50; i++) frame = zoomBy(frame, PHOTO, 1 / ZOOM_STEP);
	assert.equal(frame.side, 3000);
	assert.equal(canZoomOut(frame, PHOTO), false);
});

test("a small photo cannot be zoomed below 200 px", () => {
	const photo = { width: 600, height: 400 };
	let frame = centreSquare(photo);
	for (let i = 0; i < 50; i++) frame = zoomBy(frame, photo, ZOOM_STEP);
	assert.equal(frame.side, 200);
});

test("panBy moves the square against the drag and never leaves a gap", () => {
	const frame = { x: 1000, y: 1000, side: 1000 };
	assert.deepEqual(panBy(frame, PHOTO, 100, -50), { x: 900, y: 1050, side: 1000 });
	assert.deepEqual(panBy(frame, PHOTO, 5000, 5000), { x: 0, y: 0, side: 1000 });
	assert.deepEqual(panBy(frame, PHOTO, -5000, -5000), { x: 3000, y: 2000, side: 1000 });
});

test("keyStep: arrows move 2 %, Shift 10 %, + and - zoom, other keys are not ours", () => {
	const frame = { x: 1000, y: 1000, side: 1000 };
	// An arrow moves the photo the way a drag in that direction would.
	assert.deepEqual(keyStep(frame, PHOTO, "ArrowRight", false), { x: 980, y: 1000, side: 1000 });
	assert.deepEqual(keyStep(frame, PHOTO, "ArrowDown", true), { x: 1000, y: 900, side: 1000 });
	assert.ok(keyStep(frame, PHOTO, "+", false).side < 1000);
	assert.ok(keyStep(frame, PHOTO, "-", false).side > 1000);
	assert.equal(keyStep(frame, PHOTO, "a", false), null);
	assert.equal(keyStep(frame, PHOTO, "Enter", false), null);
	assert.equal(keyStep(frame, PHOTO, "constructor", false), null);
});

test("wheelFactor: one mouse notch is one zoom step, either way", () => {
	assert.ok(Math.abs(wheelFactor(-100) - ZOOM_STEP) < 1e-9);
	assert.ok(Math.abs(wheelFactor(100) - 1 / ZOOM_STEP) < 1e-9);
	assert.ok(Math.abs(wheelFactor(-3, 1) - ZOOM_STEP) < 1e-9);
	assert.ok(Math.abs(wheelFactor(-1, 2) - ZOOM_STEP) < 1e-9);
	assert.equal(wheelFactor(0), 1);
});

test("wheelFactor: a trackpad's small deltas add up to the same zoom as one notch", () => {
	let total = 1;
	for (let i = 0; i < 25; i++) total *= wheelFactor(-4);
	assert.ok(Math.abs(total - ZOOM_STEP) < 1e-9);
	assert.ok(wheelFactor(-4) < 1.01);
});

test("wheelFactor: one event never zooms more than one notch", () => {
	assert.ok(Math.abs(wheelFactor(-1000) - ZOOM_STEP) < 1e-9);
	assert.ok(Math.abs(wheelFactor(1000) - 1 / ZOOM_STEP) < 1e-9);
});
