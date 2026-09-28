// Shrinking a cover before it is stored.
//
// Nothing did this before: a 2 MB photo of a sleeve was kept at 2 MB, and the
// largest it is ever drawn is 120 CSS px. Moving covers to IndexedDB removed the
// ceiling that made that fatal, which is exactly why it is worth fixing now
// rather than never — the app will happily fill a disk instead of a 5 MB store.
//
// Two things fall out of re-encoding through a canvas, and both are the point:
//
//   - Size. 700px on the long side at WebP q0.82 is a few tens of kilobytes,
//     against megabytes for a phone photo. A thousand albums becomes a library
//     that fits in a backup file someone can actually e-mail themselves.
//   - EXIF. A canvas draws pixels, not metadata, so the re-encode drops the
//     camera tags — including the GPS coordinates a phone writes into a photo
//     taken at home. Spindle promises the library stays on the device, but a
//     readable export is a file that leaves it, and nobody expects their record
//     collection to carry their address.
//
// It lives beside sniff.js for the same reason that one does: a helper about
// image files, used by the add/edit form, holding no state and rendering no UI.
//
// 700px rather than something tighter because a cover is drawn at 120px on a
// 3x display and someone will eventually want to open one full size.
//
// v0.7 splits it in three so a picked photo can be cropped between decode and
// encode: decodeCover() once, sampleCover() for the guess, encodeCover() with
// the square I chose. A failure is null, and since v0.7 the caller refuses the
// photo rather than storing the file as it came, because that raw file would
// carry the EXIF block and would not be cropped either.

const MAX_EDGE = 700;
const QUALITY = 0.82;
const OUTPUT_TYPE = "image/webp";
// The copy the guess runs on. 256 px is plenty to find a sleeve, and small
// enough that reading every pixel costs nothing.
const SAMPLE_EDGE = 256;

export async function decodeCover(blob) {
	try {
		// from-image so a portrait phone photo is stored the way it was taken:
		// canvas draws raw pixels, and the orientation tag is one of the things
		// this strips. Every coordinate the crop works in is upright because of it.
		return await createImageBitmap(blob, { imageOrientation: "from-image" });
	} catch (err) {
		console.warn("[downscale] could not decode the image:", err);
		return null;
	}
}

function canvasOf(width, height, options) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return [canvas, canvas.getContext("2d", options)];
}

// The pixels guessSquare() reads.
export function sampleCover(bitmap) {
	try {
		const scale = Math.min(1, SAMPLE_EDGE / Math.max(bitmap.width, bitmap.height));
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));
		const [, ctx] = canvasOf(width, height, { willReadFrequently: true });
		if (!ctx) return null;
		ctx.drawImage(bitmap, 0, 0, width, height);
		return ctx.getImageData(0, 0, width, height);
	} catch (err) {
		console.warn("[downscale] could not sample the image:", err);
		return null;
	}
}

// With no square, the whole image at MAX_EDGE on its long side. With a square,
// that square only, at min(MAX_EDGE, side): a cover is never enlarged.
export function encodeCover(bitmap, square) {
	try {
		let sx = 0;
		let sy = 0;
		let sw = bitmap.width;
		let sh = bitmap.height;
		let width;
		let height;

		if (square) {
			const side = Math.max(
				1,
				Math.min(Math.round(square.side), bitmap.width, bitmap.height),
			);
			sx = Math.min(Math.max(0, Math.round(square.x)), bitmap.width - side);
			sy = Math.min(Math.max(0, Math.round(square.y)), bitmap.height - side);
			sw = side;
			sh = side;
			width = Math.min(MAX_EDGE, side);
			height = width;
		} else {
			const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
			width = Math.max(1, Math.round(sw * scale));
			height = Math.max(1, Math.round(sh * scale));
		}

		const [canvas, ctx] = canvasOf(width, height);
		if (!ctx) return null;

		// A PNG cover can be transparent, and drawing it over nothing keeps that;
		// WebP carries alpha, so no white box appears behind a transparent sleeve.
		ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);

		// A browser that cannot encode WebP returns a PNG data URL instead of
		// failing. That is still a valid, EXIF-free, correctly sized cover, so it
		// is accepted rather than treated as an error.
		const dataUrl = canvas.toDataURL(OUTPUT_TYPE, QUALITY);
		return dataUrl.startsWith("data:image/") ? dataUrl : null;
	} catch (err) {
		console.warn("[downscale] could not re-encode the image:", err);
		return null;
	}
}

// The look-up's path: a cover from the archive arrives square and is not
// cropped, only shrunk.
export async function downscaleCover(blob) {
	const bitmap = await decodeCover(blob);
	if (!bitmap) return null;
	try {
		return encodeCover(bitmap, null);
	} finally {
		bitmap.close();
	}
}
