// The maskable icon and the link preview are compositions of the one record
// drawn in public/icons/icon.svg, not drawings of their own. Building them from
// that file's markup means the record exists once: change icon.svg, run
// `npm run icons`, and every size and variant follows.

// 254 × 0.72 = 182.9, inside the 204.8 safe-zone circle with a band of plate
// around it under the tightest mask a launcher applies.
export const MASKABLE_SCALE = 0.72;

export function recordMarkup(svg) {
	const open = svg.indexOf("<svg");
	const close = svg.lastIndexOf("</svg>");
	if (open === -1 || close === -1) throw new Error("icon.svg is not a single <svg> element");
	const start = svg.indexOf(">", open) + 1;
	return svg.slice(start, close).trim();
}

export function maskableSvg(record) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<rect width="512" height="512" fill="#4a80d4"/>
<g transform="translate(256 256) scale(${MASKABLE_SCALE}) translate(-256 -256)">${record}</g>
</svg>`;
}

function escapeXml(text) {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

// The welcome page's composition on dark: the name and the tagline on the left,
// a large record running off the right edge. The record is 560 px across and
// centred at (1080, 315), so its left edge is at x = 800 and the text keeps
// clear of it.
export function ogSvg(record, { title, tagline }) {
	const radius = 280;
	const scale = radius / 254;
	const x = 1080 - 256 * scale;
	const y = 315 - 256 * scale;
	const lines = tagline
		.map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 46}">${escapeXml(line)}</tspan>`)
		.join("");
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="#111111"/>
<g transform="translate(${x} ${y}) scale(${scale})">${record}</g>
<text x="80" y="290" fill="#e8e8e8" font-family="Segoe UI, sans-serif" font-size="112" font-weight="700">${escapeXml(title)}</text>
<text x="80" y="360" fill="#9a9a9a" font-family="Segoe UI, sans-serif" font-size="34">${lines}</text>
</svg>`;
}
