(function () {
  var palettes = ["paper", "nord", "solarized", "catppuccin"];
  var root = document.documentElement;
  var modeBtn = document.querySelector("[data-theme-toggle]");
  var paletteBtn = document.querySelector("[data-palette-toggle]");
  var menu = document.getElementById("palette-menu");

  function storedPalette() {
    try {
      var p = localStorage.getItem("theme-palette");
      if (palettes.indexOf(p) !== -1) return p;
    } catch (e) {}
    return root.getAttribute("data-palette") || "paper";
  }

  function effectiveMode() {
    var t = root.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function persist(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function syncPaletteUI() {
    var current = storedPalette();
    if (paletteBtn) {
      paletteBtn.setAttribute("aria-label", "Color theme, " + current);
    }
    if (!menu) return;
    menu.querySelectorAll("[data-palette]").forEach(function (opt) {
      var selected = opt.getAttribute("data-palette") === current;
      opt.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function syncModeUI() {
    if (!modeBtn) return;
    var mode = effectiveMode();
    modeBtn.setAttribute(
      "aria-label",
      mode === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  function setPalette(name) {
    if (palettes.indexOf(name) === -1) return;
    root.setAttribute("data-palette", name);
    persist("theme-palette", name);
    syncPaletteUI();
    closeMenu();
  }

  function setMode(mode) {
    root.setAttribute("data-theme", mode);
    persist("theme", mode);
    syncModeUI();
  }

  function closeMenu() {
    if (!menu || !paletteBtn) return;
    menu.hidden = true;
    paletteBtn.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    if (!menu || !paletteBtn) return;
    menu.hidden = false;
    paletteBtn.setAttribute("aria-expanded", "true");
    var selected = menu.querySelector('[aria-selected="true"]');
    if (selected) selected.focus();
  }

  if (modeBtn) {
    modeBtn.addEventListener("click", function () {
      setMode(effectiveMode() === "dark" ? "light" : "dark");
    });
  }

  if (paletteBtn && menu) {
    paletteBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.hidden) openMenu();
      else closeMenu();
    });

    menu.addEventListener("click", function (e) {
      e.stopPropagation();
      var opt = e.target.closest("[data-palette]");
      if (opt) setPalette(opt.getAttribute("data-palette"));
    });

    document.addEventListener("click", function () {
      if (!menu.hidden) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  syncPaletteUI();
  syncModeUI();
})();
