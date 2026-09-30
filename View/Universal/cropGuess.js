// The best-guess square (v0.7). Pixels in, { x, y, side } out. There is no
// canvas and no DOM here, so the Node suite runs it on made-up pixel arrays.
//
// The guess is made by background colour. A phone photo of a sleeve has the
// table, the floor or the bed around it, so the ring along the photo's edge
// shows what the background looks like, and anything that clearly differs
// from it is the sleeve. Edge detection lost to this in the spec: cover art
// is full of strong edges of its own. Anything that does not look like a
// sleeve falls back to the centre: a busy background, a shape far from
// square, or something small. The dialog that opens on the guess is where a
// bad guess gets fixed.
//
// Every number below is a first guess, tuned on real photos of my sleeves.

import { centreSquare, clampFrame } from "./cropFrame.js";

// The ring: the outer 4 % of each side.
export const RING_SHARE = 0.04;
// When more than this share of the ring is far from the background colour,
// the background is not plain (a full shelf) and there is nothing to measure.
export const BUSY_RING_SHARE = 0.3;
// How far a pixel must be from the background, over R, G, B and alpha, to
// count as sleeve. The largest possible distance is 510. Raised from 60 to
// 100 on 2026-09-30: a wooden table lit from one side, where the lit half of
// the table read as sleeve.
export const FOREGROUND_DISTANCE = 100;
// A row or column is part of the sleeve when more than this share of it is.
// Raised from 1/5 to 1/2 on 2026-09-30, for the same table: its lit rows were
// still 30 to 46 % "sleeve" at any threshold, the CD's rows 65 to 85 %. So a
// sleeve now has to fill over half the photo's width and height to be found.
export const LINE_SHARE = 0.5;
// The box must be roughly square and cover at least a quarter of the photo.
// With LINE_SHARE at 1/2 an upright sleeve always passes the area check, but a
// sleeve shot at an angle passes only its middle rows and columns: its box can
// be about 0.4 by 0.4 of the photo, and this check sends that to the centre.
export const MIN_RATIO = 0.8;
export const MAX_RATIO = 1.25;
export const MIN_AREA_SHARE = 0.25;

function median(values) {
	values.sort((a, b) => a - b);
	return values[values.length >> 1];
}

export function guessSquare(image, photo) {
	const { data, width, height } = image;
	const ringX = Math.max(1, Math.round(width * RING_SHARE));
	const ringY = Math.max(1, Math.round(height * RING_SHARE));
	const inRing = (x, y) => x < ringX || x >= width - ringX || y < ringY || y >= height - ringY;

	// The background: the median of each channel around the ring. A median,
	// not a mean, so a corner of the sleeve reaching the edge does not tint it.
	const channels = [[], [], [], []];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (!inRing(x, y)) continue;
			const i = (y * width + x) * 4;
			for (let c = 0; c < 4; c++) channels[c].push(data[i + c]);
		}
	}
	const background = channels.map(median);
	const limit = FOREGROUND_DISTANCE * FOREGROUND_DISTANCE;

	const rows = new Array(height).fill(0);
	const cols = new Array(width).fill(0);
	let ringTotal = 0;
	let ringFar = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			let distance = 0;
			for (let c = 0; c < 4; c++) {
				const d = data[i + c] - background[c];
				distance += d * d;
			}
			const foreground = distance > limit;
			if (inRing(x, y)) {
				ringTotal++;
				if (foreground) ringFar++;
			}
			if (foreground) {
				rows[y]++;
				cols[x]++;
			}
		}
	}
	if (ringFar > ringTotal * BUSY_RING_SHARE) return centreSquare(photo);

	const top = rows.findIndex((n) => n > width * LINE_SHARE);
	const bottom = rows.findLastIndex((n) => n > width * LINE_SHARE);
	const left = cols.findIndex((n) => n > height * LINE_SHARE);
	const right = cols.findLastIndex((n) => n > height * LINE_SHARE);
	if (top === -1 || left === -1) return centreSquare(photo);

	const boxW = right - left + 1;
	const boxH = bottom - top + 1;
	const ratio = boxW / boxH;
	if (ratio < MIN_RATIO || ratio > MAX_RATIO) return centreSquare(photo);
	if (boxW * boxH < width * height * MIN_AREA_SHARE) return centreSquare(photo);

	// The box's longer side, no bigger than the photo's shorter side, centred
	// on the box, then scaled back to the full photo.
	const scale = photo.width / width;
	const side = Math.min(Math.max(boxW, boxH) * scale, photo.width, photo.height);
	return clampFrame(
		{
			x: (left + boxW / 2) * scale - side / 2,
			y: (top + boxH / 2) * scale - side / 2,
			side,
		},
		photo,
	);
}
