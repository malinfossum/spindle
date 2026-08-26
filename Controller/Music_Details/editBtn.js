import { model } from "../../Model/model.js";
import { changePage } from "../../View/Universal/updateView.js";

export function editAlbum(id) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;

	model.viewState.musicInfo = {
		...album,
		location: [...album.location],
		genre: [...album.genre],
	};

	changePage("editDetails");
}
