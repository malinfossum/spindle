import { deleteCover } from "../../Model/covers.js";
import { t } from "../../Model/i18n/i18n.js";
import { model } from "../../Model/model.js";
import { persistState } from "../../Model/persistence.js";
import { forgetCover } from "../../View/Universal/cover.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { navigate } from "./router.js";

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

	// After the album is gone from the library, so a failed delete leaves an
	// orphaned row rather than an album with no cover. pruneCovers() clears
	// orphans at the next unlock.
	if (album.coverId) {
		forgetCover(album.coverId);
		deleteCover(album.coverId).catch((err) =>
			console.warn("[delete] could not delete the cover:", err),
		);
	}

	navigate("homePage");
}
