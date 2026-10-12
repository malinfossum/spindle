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

// The README banner, in both themes: the name and the tagline on the left, and
// on the right a shelf of LP and CD spines with one sleeve pulled out and the
// record rising from it. The record is the same master as everywhere else; the
// shelf is drawn here because nothing else uses it.
export const BANNER_THEMES = {
	dark: {
		page: "#111111",
		text: "#e8e8e8",
		muted: "#9a9a9a",
		accent: "#4a80d4",
		plank: "#2e2e2e",
		edge: "#3a3a3a",
		spines: ["#1e1e1e", "#262626", "#2b2b2b", "#222222"],
		sleeve: "#1e1e1e",
		mark: "#4a4a4a",
	},
	light: {
		page: "#eef1f6",
		text: "#16181b",
		muted: "#5e6266",
		accent: "#2563eb",
		plank: "#c9cdd2",
		edge: "#c4c8cd",
		spines: ["#ffffff", "#e4e7ea", "#f6f7f9", "#dde1e5"],
		sleeve: "#ffffff",
		mark: "#b0b5bb",
	},
};

// Spine widths in px, left to right. "cd" spines are a case's height, not an
// LP's, so the shelf reads as a mixed collection. The fourth spine takes the
// accent: the one saturated colour, as in the app.
const SPINES = [
	[22, "lp"],
	[30, "lp"],
	[20, "lp"],
	[34, "lp"],
	[26, "lp"],
	[28, "lp"],
	[18, "cd"],
	[18, "cd"],
	[18, "cd"],
	[24, "lp"],
	[32, "lp"],
	[22, "lp"],
	[28, "lp"],
	[24, "lp"],
];
const ACCENT_SPINE = 3;

export function bannerSvg(record, { title, tagline, theme }) {
	const c = BANNER_THEMES[theme];
	if (!c) throw new Error(`unknown banner theme: ${theme}`);
	const width = 1600;
	const height = 400;
	const margin = 96;
	const shelfTop = 346;
	const plank = 12;
	const lpHeight = 200;
	const cdHeight = 102;
	const gap = 3;
	const sleeveGap = 36;
	const overhang = 20;

	// The shelf is laid out from the right margin inwards, so the plank's right
	// end sits as far from the edge as the text sits from the left.
	const rowWidth = SPINES.reduce((sum, [w]) => sum + w + gap, 0);
	const plankRight = width - margin;
	const sleeveX = plankRight - overhang - lpHeight;
	const rowLeft = sleeveX - sleeveGap - rowWidth;
	const plankLeft = rowLeft - overhang;

	let x = rowLeft;
	const spines = SPINES.map(([w, kind], i) => {
		const h = kind === "cd" ? cdHeight : lpHeight;
		const fill = i === ACCENT_SPINE ? c.accent : c.spines[i % c.spines.length];
		const stroke = i === ACCENT_SPINE ? c.accent : c.edge;
		const rect = `<rect x="${x}" y="${shelfTop - h}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
		x += w + gap;
		return rect;
	}).join("");

	// The record rises until its spindle hole clears the sleeve's top edge.
	const sleeveTop = shelfTop - lpHeight;
	const radius = 90;
	const scale = radius / 254;
	const centreX = sleeveX + lpHeight / 2;
	const centreY = sleeveTop - 14;
	const recordX = centreX - 256 * scale;
	const recordY = centreY - 256 * scale;

	// The app's disc mark on the sleeve: in the app it stands in for a missing
	// cover, so a blank sleeve gets it here too. The icon's 24 grid at 3.5x.
	const markY = sleeveTop + lpHeight / 2;
	const mark = `<g fill="none" stroke="${c.mark}" stroke-width="4.4"><circle cx="${centreX}" cy="${markY}" r="31.5"/><circle cx="${centreX}" cy="${markY}" r="17.5"/></g><circle cx="${centreX}" cy="${markY}" r="4.2" fill="${c.mark}"/>`;

	const lines = tagline
		.map(
			(line, i) => `<tspan x="${margin}" dy="${i === 0 ? 0 : 44}">${escapeXml(line)}</tspan>`,
		)
		.join("");
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<rect width="${width}" height="${height}" fill="${c.page}"/>
<text x="${margin}" y="188" fill="${c.text}" font-family="Segoe UI, sans-serif" font-size="120" font-weight="700">${escapeXml(title)}</text>
<text x="${margin}" y="250" fill="${c.muted}" font-family="Segoe UI, sans-serif" font-size="34">${lines}</text>
${spines}
<g transform="translate(${recordX} ${recordY}) scale(${scale})">${record}</g>
<rect x="${sleeveX}" y="${sleeveTop}" width="${lpHeight}" height="${lpHeight}" fill="${c.sleeve}" stroke="${c.edge}" stroke-width="2"/>
${mark}
<rect x="${plankLeft}" y="${shelfTop}" width="${plankRight - plankLeft}" height="${plank}" fill="${c.plank}"/>
</svg>`;
}
