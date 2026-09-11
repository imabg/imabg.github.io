(function () {
  var root = document.documentElement;
  var modeBtn = document.querySelector("[data-theme-toggle]");

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

  function persist(value) {
    try {
      localStorage.setItem("theme", value);
    } catch (e) {}
  }

  function applyMode(mode) {
    if (mode === "dark" || mode === "light") {
      root.setAttribute("data-theme", mode);
    } else {
      root.removeAttribute("data-theme");
    }
  }

  function syncModeUI() {
    if (!modeBtn) return;
    modeBtn.setAttribute(
      "aria-label",
      effectiveMode() === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  function setMode(mode) {
    persist(mode);
    applyMode(mode);
    syncModeUI();
  }

  if (modeBtn) {
    modeBtn.addEventListener("click", function () {
      setMode(effectiveMode() === "dark" ? "light" : "dark");
    });
  }

  applyMode(storedMode());
  syncModeUI();

  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  var onSystemMode = function () {
    if (!storedMode()) syncModeUI();
  };
  if (systemDark.addEventListener) systemDark.addEventListener("change", onSystemMode);
  else if (systemDark.addListener) systemDark.addListener(onSystemMode);
})();
