// The crop frame's maths (v0.7, turned and straightened in v0.8). A frame is
// { cx, cy, side, quarter, tilt }: the centre of the square that will be cut
// out, in the photo's own upright pixels, its side, the number of quarter
// turns clockwise, and a tilt from -45 to 45 degrees. A photo is
// { width, height }. Every function here is pure and returns a frame that is
// already inside the limits, so the dialog can never show a gap and the Node
// suite can test every limit without a canvas.
//
// The pattern is the profile picture's: the square stays put and upright on
// screen, and the photo moves and turns under it. A point s on the stage,
// measured from the stage's centre in photo pixels, is the photo point
// p = c + R(-angle) · s. The stage, the pointer and the saved cover all use
// that one mapping, so they cannot disagree.

// Zooming in stops at a quarter of the photo's shorter side: past four times,
// a phone photo no longer has the detail for a 700 px cover. It never goes
// below 200 px of the photo either, so a small image cannot become a 12 px
// cover. A photo smaller than that cannot be zoomed at all.
export const MAX_ZOOM = 4;
export const MIN_SIDE_PX = 200;
// One wheel notch, one press of + or −, one + or - key.
export const ZOOM_STEP = 1.1;
// Arrow keys move 2 % of the square, Shift + arrow 10 %.
export const MOVE_STEP = 0.02;
export const MOVE_STEP_LARGE = 0.1;
// A quarter turn and a tilt cover every angle, so the tilt never needs more
// than 45 degrees. Half a degree is the slider's step, and the twist rounds
// to it too, so the frame, the slider and the readout always agree.
export const TILT_LIMIT = 45;
export const TILT_STEP = 0.5;
// A tilted square keeps one photo pixel away from the edge. Smoothing at the
// exact border blends in the transparent pixels outside the photo, which
// would leave a see-through fringe along the edge of a saved cover. An
// untilted square needs no inset and crops exactly as in v0.7.
export const EDGE_INSET = 1;
// Every real pinch turns the fingers a little. The twist starts only after
// they have turned this far in one gesture, and snaps to straight when it
// ends this close to it.
export const TWIST_DEAD_ZONE = 10;
export const TWIST_SNAP = 1;

// Half a pixel of slack, so a side that is a rounding error away from its
// limit does not keep a button enabled that does nothing.
const EPSILON = 0.5;
const RADIANS = Math.PI / 180;

function clamp(value, low, high) {
	return Math.min(high, Math.max(low, value));
}

// Clamped to the range, or the middle of it when there is no range: a photo
// only a few pixels across has no room for an inset on both sides.
function within(value, low, high) {
	return low > high ? (low + high) / 2 : clamp(value, low, high);
}

// Exact at every quarter, so a turn moves pixels without blurring them.
function cosSin(degrees) {
	const d = ((degrees % 360) + 360) % 360;
	if (d === 0) return [1, 0];
	if (d === 90) return [0, 1];
	if (d === 180) return [-1, 0];
	if (d === 270) return [0, -1];
	return [Math.cos(d * RADIANS), Math.sin(d * RADIANS)];
}

// (x, y) turned clockwise by degrees, in y-down coordinates.
export function rotate(x, y, degrees) {
	const [cos, sin] = cosSin(degrees);
	return [x * cos - y * sin, x * sin + y * cos];
}

export function angleOf(frame) {
	return frame.quarter * 90 + frame.tilt;
}

// A tilt as the frame stores it: on the half-degree grid, inside the limit.
// The + 0 turns a -0 from rounding into 0.
function tiltOf(tilt) {
	return clamp(Math.round(tilt / TILT_STEP) * TILT_STEP, -TILT_LIMIT, TILT_LIMIT) + 0;
}

// How much wider than its side a tilted square's bounding box is. A quarter
// turn swaps the sine and the cosine, so only the tilt matters.
function fit(tilt) {
	const [cos, sin] = cosSin(Math.abs(tilt));
	return cos + sin;
}

function insetOf(tilt) {
	return tilt === 0 ? 0 : EDGE_INSET;
}

export function sideLimits(photo, tilt = 0) {
	const short = Math.min(photo.width, photo.height);
	const max = Math.max(1, (short - 2 * insetOf(tilt)) / fit(tilt));
	return { min: Math.min(max, Math.max(short / MAX_ZOOM, MIN_SIDE_PX)), max };
}

export function centreSquare(photo) {
	const side = Math.min(photo.width, photo.height);
	return { x: (photo.width - side) / 2, y: (photo.height - side) / 2, side };
}

// The guess is an upright square; the dialog opens on it, straight.
export function frameFromSquare(square) {
	return {
		cx: square.x + square.side / 2,
		cy: square.y + square.side / 2,
		side: square.side,
		quarter: 0,
		tilt: 0,
	};
}

// The upright square an untilted, unturned frame cuts out.
export function squareOf(frame) {
	return { x: frame.cx - frame.side / 2, y: frame.cy - frame.side / 2, side: frame.side };
}

// A tilted square lies inside the photo exactly when its bounding box does,
// because the photo is an upright rectangle and the square's corners are what
// touch the box.
export function clampFrame(frame, photo) {
	const tilt = tiltOf(frame.tilt);
	const quarter = (((Math.round(frame.quarter) % 4) + 4) % 4) + 0;
	const { min, max } = sideLimits(photo, tilt);
	const side = clamp(frame.side, min, max);
	const reach = (side * fit(tilt)) / 2 + insetOf(tilt);
	return {
		cx: within(frame.cx, reach, photo.width - reach),
		cy: within(frame.cy, reach, photo.height - reach),
		side,
		quarter,
		tilt,
	};
}

// A point on the stage, measured from its centre in photo pixels, as a point
// in the photo.
export function screenToPhoto(frame, sx, sy) {
	const [dx, dy] = rotate(sx, sy, -angleOf(frame));
	return [frame.cx + dx, frame.cy + dy];
}

// A new side and tilt, with the photo point (px, py) kept where it is on
// screen: under the cursor, between two fingers, or at the square's centre.
export function transformAt(frame, photo, side, tilt, px, py) {
	const nextTilt = tiltOf(tilt);
	const { min, max } = sideLimits(photo, nextTilt);
	const nextSide = clamp(side, min, max);
	const ratio = nextSide / frame.side;
	// The quarter is the same before and after, so only the tilt turns.
	const [dx, dy] = rotate(px - frame.cx, py - frame.cy, frame.tilt - nextTilt);
	return clampFrame(
		{ ...frame, cx: px - ratio * dx, cy: py - ratio * dy, side: nextSide, tilt: nextTilt },
		photo,
	);
}

export function zoomAt(frame, photo, side, px, py) {
	return transformAt(frame, photo, side, frame.tilt, px, py);
}

// factor > 1 zooms in (a smaller square), factor < 1 zooms out. Without a
// point it zooms around the square's centre, which is what the buttons and
// the keys want.
export function zoomBy(frame, photo, factor, px = frame.cx, py = frame.cy) {
	return zoomAt(frame, photo, frame.side / factor, px, py);
}

// A new tilt. The square keeps its zoom relative to the largest square that
// fits, so tilting zooms in and straightening zooms back out to where it
// was. scale is the pinch that came with a twist: before / after.
export function setTilt(frame, photo, tilt, px = frame.cx, py = frame.cy, scale = 1) {
	const nextTilt = tiltOf(tilt);
	const grow = sideLimits(photo, nextTilt).max / sideLimits(photo, frame.tilt).max;
	return transformAt(frame, photo, frame.side * scale * grow, nextTilt, px, py);
}

// A quarter turn clockwise. The frame lives in the photo's own pixels, which
// a turn does not change, so the centre and the side stay; only the screen
// turns.
export function turnQuarter(frame, photo) {
	return clampFrame({ ...frame, quarter: frame.quarter + 1 }, photo);
}

// One mouse-wheel notch is about 100 px (Chrome, Edge, Safari), 3 lines
// (Firefox) or a page. A trackpad sends many small deltas instead, so the zoom
// follows the distance rather than the number of events, and one event never
// zooms more than one notch.
export const WHEEL_NOTCH_PX = 100;

export function wheelFactor(deltaY, deltaMode = 0) {
	let notches = deltaY / WHEEL_NOTCH_PX;
	if (deltaMode === 1) notches = deltaY / 3;
	if (deltaMode === 2) notches = Math.sign(deltaY);
	return ZOOM_STEP ** -Math.max(-1, Math.min(1, notches));
}

// The photo moved by (dx, dy) photo pixels on screen, under a square that
// stays put. Turned into the photo's own directions first, so a drag to the
// right moves the photo right on screen at any angle.
export function panBy(frame, photo, dx, dy) {
	const [ux, uy] = rotate(dx, dy, -angleOf(frame));
	return clampFrame({ ...frame, cx: frame.cx - ux, cy: frame.cy - uy }, photo);
}

export function canZoomIn(frame, photo) {
	return frame.side > sideLimits(photo, frame.tilt).min + EPSILON;
}

export function canZoomOut(frame, photo) {
	return frame.side < sideLimits(photo, frame.tilt).max - EPSILON;
}

// How far in the square is, against the largest that fits: 1 fully out.
export function zoomLevel(frame, photo) {
	return sideLimits(photo, frame.tilt).max / frame.side;
}

const ARROWS = {
	ArrowLeft: [-1, 0],
	ArrowRight: [1, 0],
	ArrowUp: [0, -1],
	ArrowDown: [0, 1],
};

// A key pressed on the stage, as a new frame, or null when the key is not
// one of the crop's. An arrow moves the photo the way a drag in that
// direction would.
export function keyStep(frame, photo, key, shift) {
	if (key === "+") return zoomBy(frame, photo, ZOOM_STEP);
	if (key === "-") return zoomBy(frame, photo, 1 / ZOOM_STEP);
	if (!Object.hasOwn(ARROWS, key)) return null;
	const [dirX, dirY] = ARROWS[key];
	const step = frame.side * (shift ? MOVE_STEP_LARGE : MOVE_STEP);
	return panBy(frame, photo, dirX * step, dirY * step);
}

// How far the line between two fingers turned, from one angle to the next,
// in degrees. The jump at ±180 is unwrapped, so a twist across that line is
// not a sudden full turn.
export function angleDelta(from, to) {
	return ((((to - from + 180) % 360) + 360) % 360) - 180;
}

// The tilt a twist shows: startTilt (the tilt when the second finger landed)
// until the fingers have turned TWIST_DEAD_ZONE degrees, then following them
// one to one from that point, so the photo does not jump when it starts.
export function twistTilt(startTilt, turned) {
	if (Math.abs(turned) < TWIST_DEAD_ZONE) return startTilt;
	return tiltOf(startTilt + turned - Math.sign(turned) * TWIST_DEAD_ZONE);
}

// The tilt a twist leaves behind when it ends: straight, when it ended within
// TWIST_SNAP of it. A gesture that never changed the tilt (a plain pinch)
// leaves it alone, so a 0.5° set with the slider survives a zoom.
export function settleTwist(tilt, startTilt) {
	if (tilt === startTilt) return tilt;
	return Math.abs(tilt) <= TWIST_SNAP ? 0 : tilt;
}

// The canvas transform that draws the frame's square onto an out × out
// canvas: [a, b, c, d, e, f] for setTransform(). scale is the size of the
// source against the full photo (the dialog draws from a smaller copy of a
// very large one).
export function frameTransform(frame, out, scale = 1) {
	const [cos, sin] = cosSin(angleOf(frame));
	const k = out / frame.side / scale;
	const cx = frame.cx * scale;
	const cy = frame.cy * scale;
	return [
		k * cos,
		k * sin,
		-k * sin,
		k * cos,
		out / 2 - k * (cos * cx - sin * cy),
		out / 2 - k * (sin * cx + cos * cy),
	];
}
