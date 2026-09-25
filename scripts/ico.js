// Packs PNG images into one .ico file. An ICO is a 6-byte header, a 16-byte
// directory entry per image, then the images themselves — and every browser
// and Windows since Vista accept PNG data as those images. That is the whole
// format, so it does not need a second dependency.

export function packIco(images) {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0); // reserved
	header.writeUInt16LE(1, 2); // 1 = icon
	header.writeUInt16LE(images.length, 4);

	const directory = Buffer.alloc(16 * images.length);
	let offset = header.length + directory.length;
	images.forEach(({ size, png }, i) => {
		const at = i * 16;
		// One byte per side, where 0 means 256.
		directory.writeUInt8(size >= 256 ? 0 : size, at);
		directory.writeUInt8(size >= 256 ? 0 : size, at + 1);
		directory.writeUInt8(0, at + 2); // no palette
		directory.writeUInt8(0, at + 3); // reserved
		directory.writeUInt16LE(1, at + 4); // colour planes
		directory.writeUInt16LE(32, at + 6); // bits per pixel
		directory.writeUInt32LE(png.length, at + 8);
		directory.writeUInt32LE(offset, at + 12);
		offset += png.length;
	});

	return Buffer.concat([header, directory, ...images.map((image) => image.png)]);
}
