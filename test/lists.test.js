import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { blankAlbum, blankLibraryView, model, removeListEntry } from "../Model/model.js";

beforeEach(() => {
	model.data.genre = ["Rock", "Jazz", "Pop"];
	model.data.location = ["Loft", "Shelf"];
	model.data.musicInfo = [
		{ ...blankAlbum(), id: 1, genre: [0, 2], location: [1] },
		{ ...blankAlbum(), id: 2, genre: [1], location: [0] },
		{ ...blankAlbum(), id: 3, genre: [2, 1], location: [] },
	];
	model.viewState.musicInfo = { ...blankAlbum(), genre: [1, 2] };
	model.viewState.library = blankLibraryView();
});

test("removeListEntry drops the entry and moves every later position down one", () => {
	removeListEntry("genre", 1);
	assert.deepEqual(model.data.genre, ["Rock", "Pop"]);
	assert.deepEqual(
		model.data.musicInfo.map((album) => album.genre),
		[[0, 1], [], [1]],
	);
});

test("removeListEntry moves the album on the form the same way", () => {
	removeListEntry("genre", 1);
	assert.deepEqual(model.viewState.musicInfo.genre, [1]);
});

test("removeListEntry clears a filter on the removed entry and moves a later one", () => {
	model.viewState.library.genre = "1";
	removeListEntry("genre", 1);
	assert.equal(model.viewState.library.genre, "");

	model.data.genre = ["Rock", "Jazz", "Pop"];
	model.viewState.library.genre = "2";
	removeListEntry("genre", 1);
	assert.equal(model.viewState.library.genre, "1");

	model.data.genre = ["Rock", "Jazz", "Pop"];
	model.viewState.library.genre = "0";
	removeListEntry("genre", 1);
	assert.equal(model.viewState.library.genre, "0");
});

test("removeListEntry leaves the other list alone", () => {
	removeListEntry("location", 0);
	assert.deepEqual(model.data.location, ["Shelf"]);
	assert.deepEqual(
		model.data.musicInfo.map((album) => album.location),
		[[0], [], []],
	);
	assert.deepEqual(
		model.data.musicInfo.map((album) => album.genre),
		[[0, 2], [1], [2, 1]],
	);
	assert.equal(model.viewState.library.genre, "");
});

test("removeListEntry ignores a position that is not there", () => {
	removeListEntry("genre", -1);
	removeListEntry("genre", 3);
	assert.deepEqual(model.data.genre, ["Rock", "Jazz", "Pop"]);
	assert.deepEqual(model.data.musicInfo[0].genre, [0, 2]);
});

// After Save, the form and the saved album share one array
// (editMusic.js:154). An in-place shift would move it twice.
test("removeListEntry shifts a shared array once", () => {
	model.viewState.musicInfo = { ...model.data.musicInfo[0] };
	removeListEntry("genre", 1);
	assert.deepEqual(model.data.musicInfo[0].genre, [0, 1]);
	assert.deepEqual(model.viewState.musicInfo.genre, [0, 1]);
});
