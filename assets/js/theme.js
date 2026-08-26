(function () {
  var btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;

  function effective() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function sync() {
    var mode = effective();
    btn.setAttribute(
      "aria-label",
      mode === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  btn.addEventListener("click", function () {
    var next = effective() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    sync();
  });

  sync();
})();
