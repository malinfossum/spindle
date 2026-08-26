import { model } from "../../Model/model.js";
import { persistState } from "../../Model/persistence.js";
import { updateView } from "../../View/Universal/updateView.js";

export function toggleWishlist(id, checked) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;

	album.wishlist = checked;
	persistState();
	updateView();
}
