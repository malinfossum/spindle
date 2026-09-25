import assert from "node:assert/strict";
import { test } from "node:test";
import { precacheManifest } from "../scripts/precache.js";

function dist(overrides = {}) {
	return Object.entries({
		"index.html": "<html>",
		"assets/index-abc.js": "js",
		"assets/index-def.css": "css",
		"themePreload.js": "preload",
		"icons/icon.svg": "<svg>",
		"favicon.ico": "ico",
		_headers: "/*\n  Content-Security-Policy: a",
		"og-image.png": "png",
		...overrides,
	}).map(([path, contents]) => ({ path, contents }));
}

test("index.html is cached as / and never as /index.html", () => {
	const { urls } = precacheManifest(dist());
	assert.ok(urls.includes("/"));
	assert.ok(!urls.includes("/index.html"));
});

test("_headers, og-image.png and sw.js are not precached", () => {
	const { urls } = precacheManifest(dist({ "sw.js": "old worker" }));
	assert.ok(!urls.includes("/_headers"));
	assert.ok(!urls.includes("/og-image.png"));
	assert.ok(!urls.includes("/sw.js"));
});

test("every other file is precached under its path", () => {
	const { urls } = precacheManifest(dist());
	assert.deepEqual(urls, [
		"/",
		"/assets/index-abc.js",
		"/assets/index-def.css",
		"/favicon.ico",
		"/icons/icon.svg",
		"/themePreload.js",
	]);
});

test("the same files give the same version, in any order", () => {
	const a = precacheManifest(dist());
	const b = precacheManifest(dist().reverse());
	assert.equal(a.version, b.version);
	assert.match(a.version, /^[0-9a-f]{16}$/);
});

test("a changed file under an unchanged name changes the version", () => {
	const before = precacheManifest(dist());
	const after = precacheManifest(dist({ "themePreload.js": "preload, fixed" }));
	assert.deepEqual(after.urls, before.urls);
	assert.notEqual(after.version, before.version);
});

test("a changed _headers alone changes the version", () => {
	const before = precacheManifest(dist());
	const after = precacheManifest(dist({ _headers: "/*\n  Content-Security-Policy: b" }));
	assert.deepEqual(after.urls, before.urls);
	assert.notEqual(after.version, before.version);
});

test("a change to the worker's own source changes the version", () => {
	const a = precacheManifest(dist({ "sw.js": "one" }));
	const b = precacheManifest(dist({ "sw.js": "two" }));
	assert.notEqual(a.version, b.version);
	assert.ok(!b.urls.includes("/sw.js"));
});
