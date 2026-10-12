import assert from "node:assert/strict";
import { test } from "node:test";
import {
	BANNER_THEMES,
	bannerSvg,
	MASKABLE_SCALE,
	maskableSvg,
	ogSvg,
	recordMarkup,
} from "../scripts/compose.js";

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="254"/>
</svg>`;

test("recordMarkup returns what is inside the outer <svg>", () => {
	assert.equal(recordMarkup(icon), `<circle cx="256" cy="256" r="254"/>`);
});

test("recordMarkup refuses a file that is not one <svg>", () => {
	assert.throws(() => recordMarkup("<g></g>"));
});

test("the maskable record sits inside the safe zone with plate around it", () => {
	// Safe zone: a centred circle of radius 40 % of 512. The record's radius is
	// 254; scaled, it must leave a visible band of plate under the tightest mask.
	assert.ok(254 * MASKABLE_SCALE <= 204.8 - 16);
});

test("maskableSvg puts the record on a full accent-blue plate", () => {
	const out = maskableSvg(recordMarkup(icon));
	assert.match(out, /<rect width="512" height="512" fill="#4a80d4"\/>/);
	assert.match(out, new RegExp(`scale\\(${MASKABLE_SCALE}\\)`));
	assert.ok(out.includes(`<circle cx="256" cy="256" r="254"/>`));
});

test("ogSvg is 1200 by 630 and escapes its text", () => {
	const out = ogSvg(recordMarkup(icon), { title: "Spindle", tagline: ["Rock & roll", "<b>"] });
	assert.match(out, /width="1200" height="630"/);
	assert.ok(out.includes("Rock &amp; roll"));
	assert.ok(out.includes("&lt;b&gt;"));
	assert.ok(!out.includes("<b>"));
});

test("bannerSvg is 1600 by 400 in either theme and escapes its text", () => {
	for (const theme of Object.keys(BANNER_THEMES)) {
		const out = bannerSvg(recordMarkup(icon), {
			title: "Spindle",
			tagline: ["Rock & roll", "<b>"],
			theme,
		});
		assert.match(out, /width="1600" height="400"/);
		assert.ok(out.includes(`fill="${BANNER_THEMES[theme].page}"`));
		assert.ok(out.includes("Rock &amp; roll"));
		assert.ok(!out.includes("<b>"));
	}
});

test("bannerSvg refuses a theme it does not have", () => {
	assert.throws(() =>
		bannerSvg(recordMarkup(icon), { title: "Spindle", tagline: [], theme: "sepia" }),
	);
});

test("the banner's shelf ends as far from the right edge as the text starts from the left", () => {
	const out = bannerSvg(recordMarkup(icon), { title: "Spindle", tagline: ["a"], theme: "dark" });
	const plank = out.match(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)" height="12"/);
	assert.ok(plank, "the plank is drawn");
	assert.equal(1600 - (Number(plank[1]) + Number(plank[2])), 96);
	assert.match(out, /<text x="96"/);
});
