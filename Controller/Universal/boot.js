// Boot. Loaded LAST in index.html, and that placement is the dependency graph:
// scripts are plain <script> tags with no modules, so everything called here
// has to have been defined by an earlier tag. In particular updateView() calls
// syncNavbar() and syncChrome(), which is why the first render cannot live at
// the top of View/Universal/updateView.js.
//
// This was an inline <script> until v0.2. It is a file now for the same reason
// the theme preload is: no inline script anywhere means the CSP can say
// script-src 'self' and nothing else.

initActions();
applyStoredTheme();
applyLang();
updateView();
