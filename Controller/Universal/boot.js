// Boot — the single entry point index.html loads, and the root of the module
// graph. Everything else in the app is reachable from these nine imports.
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

import { applyLang } from "../../View/Universal/chrome.js";
import { restoreSession } from "../Login/login.js";
import { initActions } from "./actions.js";
import { initInstall } from "./install.js";
import { registerWorker } from "./offline.js";
import { initRouter } from "./router.js";
import { initScanSupport } from "./scanSupport.js";
import "./storageSync.js";
import { applyStoredTheme } from "./theme.js";

initActions();
// Before the awaits below: the browser may offer install as soon as the
// manifest is read.
initInstall();
applyStoredTheme();
applyLang();
// Before the first paint, so the add page renders with or without its Scan
// button rather than gaining one a tick later. getSupportedFormats() resolves
// in well under a frame; a browser without the API returns at once.
await initScanSupport();
// A key kept by "Stay unlocked on this device" opens the library before the
// first paint (v0.5), so the page never flashes Login on the way to Home.
const session = await restoreSession();
// Last, and it is what paints the first frame: the address bar decides which
// page opens, so this used to be a bare updateView() on whatever currentPage
// happened to start as. A restored session lands on Home instead of the
// welcome card; a stale one lands on Login, where the reason is shown.
initRouter(session === "restored" ? "homePage" : session === "stale" ? "login" : null);
// After the first paint and not awaited: nothing on screen waits for it.
registerWorker();
