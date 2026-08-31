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
    return "paper";
  }

  function storedMode() {
    try {
      var t = localStorage.getItem("theme");
      if (t === "dark" || t === "light") return t;
    } catch (e) {}
    return "";
  }

  function systemMode() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function effectiveMode() {
    return storedMode() || systemMode();
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

  function applyPalette(name) {
    var palette = palettes.indexOf(name) !== -1 ? name : "paper";
    root.setAttribute("data-palette", palette);
    return palette;
  }

  function applyMode(mode) {
    if (mode === "dark" || mode === "light") {
      root.setAttribute("data-theme", mode);
    } else {
      root.removeAttribute("data-theme");
    }
  }

  function setPalette(name) {
    persist("theme-palette", applyPalette(name));
    syncPaletteUI();
    closeMenu();
  }

  function setMode(mode) {
    persist("theme", mode);
    applyMode(mode);
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

  applyPalette(storedPalette());
  applyMode(storedMode());
  syncPaletteUI();
  syncModeUI();

  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  var onSystemMode = function () {
    if (!storedMode()) syncModeUI();
  };
  if (systemDark.addEventListener) systemDark.addEventListener("change", onSystemMode);
  else if (systemDark.addListener) systemDark.addListener(onSystemMode);
})();
