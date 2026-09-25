// Renders every icon and the link preview from the SVG masters. Run with
// `npm run icons` after changing a master; the output is committed, so a deploy
// never depends on this script or on sharp.

import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { maskableSvg, ogSvg, recordMarkup } from "./compose.js";
import { packIco } from "./ico.js";

const icon = readFileSync("public/icons/icon.svg");
const small = readFileSync("public/icons/icon-small.svg");
const record = recordMarkup(icon.toString("utf8"));
const maskable = Buffer.from(maskableSvg(record));
const og = Buffer.from(
	ogSvg(record, {
		title: "Spindle",
		tagline: ["Your physical music library —", "kept safe on your own device."],
	}),
);

function png(svg, width, height = width) {
	return sharp(svg).resize(width, height).png({ compressionLevel: 9 }).toBuffer();
}

const outputs = [
	["public/icons/icon-192.png", png(icon, 192)],
	["public/icons/icon-512.png", png(icon, 512)],
	["public/icons/icon-maskable-192.png", png(maskable, 192)],
	["public/icons/icon-maskable-512.png", png(maskable, 512)],
	// Opaque on purpose: iOS fills a transparent home-screen icon with black.
	["public/apple-touch-icon.png", png(maskable, 180)],
	["public/og-image.png", png(og, 1200, 630)],
];

for (const [path, pending] of outputs) {
	writeFileSync(path, await pending);
	console.log(`wrote ${path}`);
}

const ico = packIco([
	{ size: 16, png: await png(small, 16) },
	{ size: 32, png: await png(small, 32) },
	{ size: 48, png: await png(icon, 48) },
]);
writeFileSync("public/favicon.ico", ico);
console.log("wrote public/favicon.ico");
