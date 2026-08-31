import { model } from "../../Model/model.js";
import { navigate } from "../Universal/router.js";

export function editAlbum(id) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;

	model.viewState.musicInfo = {
		...album,
		location: [...album.location],
		genre: [...album.genre],
	};
	// A cover picked during an edit that was never saved must not follow the next
	// album into the form.
	model.viewState.musicForm.coverPreview = null;

	navigate("editDetails");
}
