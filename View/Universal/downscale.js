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
// 3x display and someone will eventually want to open one full size. Failure is
// non-fatal by design — the caller keeps the original file if this returns null,
// which is what the app did for its whole life until now.

const MAX_EDGE = 700;
const QUALITY = 0.82;
const OUTPUT_TYPE = "image/webp";

export async function downscaleCover(file) {
	let bitmap;

	try {
		// from-image so a portrait phone photo is stored the way it was taken:
		// canvas draws raw pixels, and the orientation tag is one of the things
		// this strips.
		bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
	} catch (err) {
		console.warn("[downscale] could not decode the image:", err);
		return null;
	}

	try {
		const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d");
		if (!ctx) return null;

		// A PNG cover can be transparent, and drawing it over nothing keeps that;
		// WebP carries alpha, so no white box appears behind a transparent sleeve.
		ctx.drawImage(bitmap, 0, 0, width, height);

		// A browser that cannot encode WebP returns a PNG data URL instead of
		// failing. That is still a valid, EXIF-free, correctly sized cover, so it
		// is accepted rather than treated as an error.
		const dataUrl = canvas.toDataURL(OUTPUT_TYPE, QUALITY);
		return dataUrl.startsWith("data:image/") ? dataUrl : null;
	} catch (err) {
		console.warn("[downscale] could not re-encode the image:", err);
		return null;
	} finally {
		bitmap.close();
	}
}
