// Boot — the single entry point index.html loads, and the root of the module
// graph. Everything else in the app is reachable from these four imports.
//
// Until v0.2 this file was loaded last by the last of 41 <script> tags, and
// that ordering *was* the dependency graph: every function was a global, and a
// call worked only if its tag came earlier in the document. Modules make the
// graph explicit, so the order below is now just reading order — the imports
// are resolved before a line of it runs.
//
// storageSync is imported for its side effect. It registers the cross-tab
// `storage` listener and exports nothing, so without this line the module
// would simply never be evaluated.

import { applyLang } from "../../Model/i18n/i18n.js";
import { initActions } from "./actions.js";
import { initRouter } from "./router.js";
import "./storageSync.js";
import { applyStoredTheme } from "./theme.js";

initActions();
applyStoredTheme();
applyLang();
// Last, and it is what paints the first frame: the address bar decides which
// page opens, so this used to be a bare updateView() on whatever currentPage
// happened to start as.
initRouter();
