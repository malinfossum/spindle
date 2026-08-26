// Validate an image by its magic numbers (the file's real signature), never by
// file.type — the declared type is trivially spoofable. Returns the detected
// MIME for the three allowed raster formats, or null to reject everything else,
// including SVG (which is executable and a known XSS vector even when renamed).
// JPEG: FF D8 FF · PNG: 89 50 4E 47 · WebP: "RIFF" .... "WEBP".
export async function sniffImageType(file) {
	const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
	const startsWith = (sig) => sig.every((b, i) => bytes[i] === b);

	if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
	if (startsWith([0x89, 0x50, 0x4e, 0x47])) return "image/png";
	if (
		startsWith([0x52, 0x49, 0x46, 0x46]) &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return "image/webp";
	}
	return null;
}
