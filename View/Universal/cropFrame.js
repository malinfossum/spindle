// The crop frame's maths (v0.7). A frame is { x, y, side } in the photo's own
// upright pixels: the square that will be cut out and saved. A photo is
// { width, height }. Every function here is pure and returns a frame that is
// already inside the limits, so the dialog can never show a gap and the Node
// suite can test every limit without a canvas.
//
// The pattern is the profile picture's: the square stays put on screen and
// the photo moves under it. panBy() therefore moves the frame the other way.

// Zooming in stops at a quarter of the photo's shorter side — past four
// times, a phone photo no longer has the detail for a 700 px cover — but
// never below 200 px of the photo, so a small image cannot become a 12 px
// cover. A photo smaller than that cannot be zoomed at all.
export const MAX_ZOOM = 4;
export const MIN_SIDE_PX = 200;
// One wheel notch, one press of + or −, one + or - key.
export const ZOOM_STEP = 1.1;
// Arrow keys move 2 % of the square, Shift + arrow 10 %.
export const MOVE_STEP = 0.02;
export const MOVE_STEP_LARGE = 0.1;

// Half a pixel of slack, so a side that is a rounding error away from its
// limit does not keep a button enabled that does nothing.
const EPSILON = 0.5;

function clamp(value, low, high) {
	return Math.min(high, Math.max(low, value));
}

export function sideLimits(photo) {
	const max = Math.min(photo.width, photo.height);
	return { min: Math.min(max, Math.max(max / MAX_ZOOM, MIN_SIDE_PX)), max };
}

export function centreSquare(photo) {
	const side = Math.min(photo.width, photo.height);
	return { x: (photo.width - side) / 2, y: (photo.height - side) / 2, side };
}

export function clampFrame(frame, photo) {
	const { min, max } = sideLimits(photo);
	const side = clamp(frame.side, min, max);
	return {
		x: clamp(frame.x, 0, photo.width - side),
		y: clamp(frame.y, 0, photo.height - side),
		side,
	};
}

// A new side length, with the photo point (px, py) kept where it is on
// screen: under the cursor, or between two fingers.
export function zoomAt(frame, photo, side, px, py) {
	const { min, max } = sideLimits(photo);
	const next = clamp(side, min, max);
	const ratio = next / frame.side;
	return clampFrame(
		{ x: px - (px - frame.x) * ratio, y: py - (py - frame.y) * ratio, side: next },
		photo,
	);
}

// factor > 1 zooms in (a smaller square), factor < 1 zooms out. Without a
// point it zooms around the square's centre, which is what the buttons and
// the keys want.
export function zoomBy(
	frame,
	photo,
	factor,
	px = frame.x + frame.side / 2,
	py = frame.y + frame.side / 2,
) {
	return zoomAt(frame, photo, frame.side / factor, px, py);
}

// The photo moved by (dx, dy) photo pixels under a square that stays put.
export function panBy(frame, photo, dx, dy) {
	return clampFrame({ ...frame, x: frame.x - dx, y: frame.y - dy }, photo);
}

export function canZoomIn(frame, photo) {
	return frame.side > sideLimits(photo).min + EPSILON;
}

export function canZoomOut(frame, photo) {
	return frame.side < sideLimits(photo).max - EPSILON;
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
