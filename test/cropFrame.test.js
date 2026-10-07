import assert from "node:assert/strict";
import { test } from "node:test";
import {
	angleDelta,
	canZoomIn,
	canZoomOut,
	centreSquare,
	clampFrame,
	frameFromSquare,
	frameTransform,
	keyStep,
	panBy,
	rotate,
	screenToPhoto,
	setTilt,
	settleTwist,
	sideLimits,
	squareOf,
	turnQuarter,
	twistTilt,
	wheelFactor,
	ZOOM_STEP,
	zoomAt,
	zoomBy,
	zoomLevel,
} from "../View/Universal/cropFrame.js";

const PHOTO = { width: 4000, height: 3000 };
const PORTRAIT = { width: 3000, height: 4000 };

// An upright v0.7 square as a v0.8 frame.
const at = (x, y, side, quarter = 0, tilt = 0) => ({
	...frameFromSquare({ x, y, side }),
	quarter,
	tilt,
});

const near = (actual, expected, label = "") =>
	assert.ok(Math.abs(actual - expected) < 1e-6, `${label} ${actual} is not ${expected}`);

// Where a photo point lands on the stage, measured from its centre in photo
// pixels: the inverse of screenToPhoto.
function toScreen(frame, px, py) {
	return rotate(px - frame.cx, py - frame.cy, frame.quarter * 90 + frame.tilt);
}

// The four corners of the frame's square, in the photo.
function corners(frame) {
	const h = frame.side / 2;
	return [
		[-h, -h],
		[h, -h],
		[h, h],
		[-h, h],
	].map(([sx, sy]) => screenToPhoto(frame, sx, sy));
}

// --- v0.7 behaviour, unchanged at tilt 0 ---

test("sideLimits: a quarter of the shorter side, never below 200 px", () => {
	assert.deepEqual(sideLimits(PHOTO), { min: 750, max: 3000 });
	assert.deepEqual(sideLimits({ width: 600, height: 400 }), { min: 200, max: 400 });
	// Smaller than the floor: the whole shorter side, and no zoom at all.
	assert.deepEqual(sideLimits({ width: 150, height: 120 }), { min: 120, max: 120 });
});

test("centreSquare and frameFromSquare: the largest square that fits, centred, straight", () => {
	assert.deepEqual(centreSquare(PHOTO), { x: 500, y: 0, side: 3000 });
	assert.deepEqual(centreSquare({ width: 300, height: 500 }), { x: 0, y: 100, side: 300 });
	assert.deepEqual(frameFromSquare({ x: 500, y: 0, side: 3000 }), {
		cx: 2000,
		cy: 1500,
		side: 3000,
		quarter: 0,
		tilt: 0,
	});
	assert.deepEqual(squareOf(frameFromSquare({ x: 500, y: 0, side: 3000 })), {
		x: 500,
		y: 0,
		side: 3000,
	});
});

test("clampFrame keeps the square inside the photo and inside the zoom limits", () => {
	assert.deepEqual(squareOf(clampFrame(at(-50, -50, 1000), PHOTO)), { x: 0, y: 0, side: 1000 });
	assert.deepEqual(squareOf(clampFrame(at(3900, 2900, 1000), PHOTO)), {
		x: 3000,
		y: 2000,
		side: 1000,
	});
	// Too big: v0.8 keeps the centre as near as it can, where v0.7 kept the
	// top-left corner. Only a frame the guess never produces is this big.
	assert.deepEqual(squareOf(clampFrame(at(0, 0, 9000), PHOTO)), { x: 1000, y: 0, side: 3000 });
	assert.deepEqual(squareOf(clampFrame(at(100, 100, 10), PHOTO)).side, 750);
});

test("zoomAt keeps the given point where it was", () => {
	const frame = at(1000, 0, 2000);
	// (1500, 500) sits a quarter of the way into the square on both axes, and
	// after halving the side it still does.
	assert.deepEqual(squareOf(zoomAt(frame, PHOTO, 1000, 1500, 500)), {
		x: 1250,
		y: 250,
		side: 1000,
	});
});

test("zoomBy stops at both limits, and the buttons know it", () => {
	let frame = frameFromSquare(centreSquare(PHOTO));
	assert.equal(canZoomOut(frame, PHOTO), false);
	assert.equal(canZoomIn(frame, PHOTO), true);
	assert.equal(zoomLevel(frame, PHOTO), 1);

	for (let i = 0; i < 50; i++) frame = zoomBy(frame, PHOTO, ZOOM_STEP);
	assert.equal(frame.side, 750);
	assert.equal(canZoomIn(frame, PHOTO), false);
	assert.equal(canZoomOut(frame, PHOTO), true);
	assert.equal(zoomLevel(frame, PHOTO), 4);

	for (let i = 0; i < 50; i++) frame = zoomBy(frame, PHOTO, 1 / ZOOM_STEP);
	assert.equal(frame.side, 3000);
	assert.equal(canZoomOut(frame, PHOTO), false);
});

test("a small photo cannot be zoomed below 200 px", () => {
	const photo = { width: 600, height: 400 };
	let frame = frameFromSquare(centreSquare(photo));
	for (let i = 0; i < 50; i++) frame = zoomBy(frame, photo, ZOOM_STEP);
	assert.equal(frame.side, 200);
});

test("panBy moves the square against the drag and never leaves a gap", () => {
	const frame = at(1000, 1000, 1000);
	assert.deepEqual(squareOf(panBy(frame, PHOTO, 100, -50)), { x: 900, y: 1050, side: 1000 });
	assert.deepEqual(squareOf(panBy(frame, PHOTO, 5000, 5000)), { x: 0, y: 0, side: 1000 });
	assert.deepEqual(squareOf(panBy(frame, PHOTO, -5000, -5000)), {
		x: 3000,
		y: 2000,
		side: 1000,
	});
});

test("keyStep: arrows move 2 %, Shift 10 %, + and - zoom, other keys are not ours", () => {
	const frame = at(1000, 1000, 1000);
	// An arrow moves the photo the way a drag in that direction would.
	assert.deepEqual(squareOf(keyStep(frame, PHOTO, "ArrowRight", false)), {
		x: 980,
		y: 1000,
		side: 1000,
	});
	assert.deepEqual(squareOf(keyStep(frame, PHOTO, "ArrowDown", true)), {
		x: 1000,
		y: 900,
		side: 1000,
	});
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

// --- v0.8: turning and straightening ---

test("clampFrame keeps every corner inside the photo at any tilt and in every quarter", () => {
	for (const photo of [PHOTO, PORTRAIT]) {
		for (const tilt of [0, 10, -10, 45, -45, 30]) {
			for (const quarter of [0, 1, 2, 3]) {
				// Too big and pushed past a corner: the clamp has to do everything.
				const frame = clampFrame(
					{ cx: -500, cy: photo.height + 500, side: 9000, quarter, tilt },
					photo,
				);
				for (const [x, y] of corners(frame)) {
					const label = `${photo.width}x${photo.height} q${quarter} t${tilt}: (${x}, ${y})`;
					assert.ok(x >= -1e-9 && x <= photo.width + 1e-9, label);
					assert.ok(y >= -1e-9 && y <= photo.height + 1e-9, label);
				}
			}
		}
	}
});

test("clampFrame puts the tilt on the half-degree grid, inside ±45, and the quarter in 0-3", () => {
	const frame = clampFrame({ cx: 2000, cy: 1500, side: 1000, quarter: 5, tilt: 12.37 }, PHOTO);
	assert.equal(frame.tilt, 12.5);
	assert.equal(frame.quarter, 1);
	assert.equal(clampFrame({ ...frame, tilt: 80 }, PHOTO).tilt, 45);
	assert.equal(clampFrame({ ...frame, tilt: -0.2 }, PHOTO).tilt, 0);
	assert.ok(Object.is(clampFrame({ ...frame, tilt: -0.2 }, PHOTO).tilt, 0), "never -0");
	assert.equal(clampFrame({ ...frame, quarter: -1 }, PHOTO).quarter, 3);
});

test("sideLimits: the largest side at 45° is (shorter side - 2) / √2", () => {
	near(sideLimits(PHOTO, 45).max, 2998 / Math.SQRT2);
	assert.equal(sideLimits(PHOTO, 45).min, 750);
});

test("a photo a few pixels across still gives a finite frame", () => {
	const tiny = { width: 2, height: 2 };
	const frame = clampFrame({ cx: 1, cy: 1, side: 2, quarter: 0, tilt: 45 }, tiny);
	assert.ok(frame.side >= 1);
	for (const value of [frame.cx, frame.cy, frame.side]) assert.ok(Number.isFinite(value));
});

test("setTilt: tilting zooms in, and straightening comes back to the same zoom", () => {
	const start = at(1000, 500, 1500);
	const tilted = setTilt(start, PHOTO, 30);
	assert.equal(tilted.tilt, 30);
	assert.ok(tilted.side < 1500);
	near(setTilt(tilted, PHOTO, 0).side, 1500);
});

test("setTilt: a square zoomed fully out stays fully out, there and back", () => {
	const full = frameFromSquare(centreSquare(PHOTO));
	const tilted = setTilt(full, PHOTO, 30);
	assert.equal(canZoomOut(tilted, PHOTO), false);
	near(zoomLevel(tilted, PHOTO), 1);
	const back = setTilt(tilted, PHOTO, 0);
	near(back.side, 3000);
	assert.equal(canZoomOut(back, PHOTO), false);
});

test("setTilt: the 200 px floor is the one thing that keeps the zoom from coming back", () => {
	const photo = { width: 600, height: 400 };
	let frame = frameFromSquare(centreSquare(photo));
	for (let i = 0; i < 50; i++) frame = zoomBy(frame, photo, ZOOM_STEP);
	assert.equal(frame.side, 200);
	// At 45° the floor holds the side at 200 although the zoom says smaller,
	// so straightening grows it past where it was.
	const back = setTilt(setTilt(frame, photo, 45), photo, 0);
	assert.ok(back.side > 200);
});

test("turnQuarter changes the quarter only, on a centred frame and one against an edge", () => {
	const centred = at(1000, 500, 2000, 0, 10);
	const turned = turnQuarter(clampFrame(centred, PHOTO), PHOTO);
	const before = clampFrame(centred, PHOTO);
	assert.deepEqual(turned, { ...before, quarter: 1 });

	const edge = clampFrame({ cx: 0, cy: 0, side: 1000, quarter: 3, tilt: -20 }, PHOTO);
	assert.deepEqual(turnQuarter(edge, PHOTO), { ...edge, quarter: 0 });
});

test("transformAt keeps the pivot on the same spot of the screen", () => {
	const frame = clampFrame({ cx: 2000, cy: 1500, side: 1200, quarter: 1, tilt: 5 }, PHOTO);
	const [px, py] = [2200, 1400];
	const before = toScreen(frame, px, py).map((v) => v / frame.side);
	const after = setTilt(frame, PHOTO, 20, px, py);
	const moved = toScreen(after, px, py).map((v) => v / after.side);
	near(moved[0], before[0], "x");
	near(moved[1], before[1], "y");
});

test("a drag to the right moves the photo right on screen, at 90° and at 30°", () => {
	for (const [quarter, tilt] of [
		[1, 0],
		[0, 30],
	]) {
		const frame = clampFrame({ cx: 2000, cy: 1500, side: 1000, quarter, tilt }, PHOTO);
		const [x, y] = toScreen(panBy(frame, PHOTO, 100, 0), frame.cx, frame.cy);
		near(x, 100, `q${quarter} t${tilt} x`);
		near(y, 0, `q${quarter} t${tilt} y`);
	}
});

test("twistTilt: a dead zone of 10°, then one to one, on the half-degree grid", () => {
	assert.equal(twistTilt(0, 9), 0);
	assert.equal(twistTilt(0, -9.9), 0);
	assert.equal(twistTilt(0, 15), 5);
	assert.equal(twistTilt(0, 15.3), 5.5);
	assert.equal(twistTilt(3, -14), -1);
	assert.equal(twistTilt(40, 30), 45);
});

test("settleTwist snaps to straight within 1°, and leaves anything else", () => {
	assert.equal(settleTwist(0.8), 0);
	assert.equal(settleTwist(-1), 0);
	assert.equal(settleTwist(1.5), 1.5);
	assert.equal(settleTwist(-12), -12);
});

test("angleDelta: a twist across ±180° is a small turn, not a full one", () => {
	assert.equal(angleDelta(170, -170), 20);
	assert.equal(angleDelta(-170, 170), -20);
	assert.equal(angleDelta(10, 25), 15);
});

test("frameTransform maps the square's centre and corners onto the output canvas", () => {
	const frame = clampFrame({ cx: 2000, cy: 1500, side: 1000, quarter: 1, tilt: 12 }, PHOTO);
	const [a, b, c, d, e, f] = frameTransform(frame, 700);
	const map = ([x, y]) => [a * x + c * y + e, b * x + d * y + f];
	const [mx, my] = map([frame.cx, frame.cy]);
	near(mx, 350);
	near(my, 350);
	const out = corners(frame).map(map);
	const expected = [
		[0, 0],
		[700, 0],
		[700, 700],
		[0, 700],
	];
	out.forEach(([x, y], i) => {
		near(x, expected[i][0], `corner ${i} x`);
		near(y, expected[i][1], `corner ${i} y`);
	});
	// From a half-size copy of the photo, the same square lands in the same place.
	const [a2, b2, c2, d2, e2, f2] = frameTransform(frame, 700, 0.5);
	const half = [frame.cx * 0.5, frame.cy * 0.5];
	near(a2 * half[0] + c2 * half[1] + e2, 350);
	near(b2 * half[0] + d2 * half[1] + f2, 350);
});

test("frameTransform at a quarter turn has exact whole-number entries", () => {
	const frame = at(1000, 500, 700, 1, 0);
	const matrix = frameTransform(frame, 700);
	for (const value of matrix) assert.ok(Number.isInteger(value), `${value}`);
});
