import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { persistState } from "../../Model/persistence.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { changePage } from "../../View/Universal/updateView.js";

export async function deleteAlbum(id) {
	const album = model.data.musicInfo.find((a) => a.id === id);

	if (!album) return;

	const confirmed = await openDialog({
		title: t("dialog.deleteAlbumTitle"),
		body: t("dialog.deleteAlbumBody", { title: album.title }),
		confirmText: t("dialog.delete"),
		danger: true,
	});
	if (!confirmed) return;

	model.data.musicInfo = model.data.musicInfo.filter((a) => a.id !== id);
	persistState();
	changePage("homePage");
}
