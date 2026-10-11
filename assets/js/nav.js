(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");
  if (!header || !toggle || !nav) return;

  // Collapse only when JS runs — no-JS keeps the nav visible.
  header.setAttribute("data-nav", "");

  function setOpen(open) {
    if (open) header.setAttribute("data-nav-open", "");
    else header.removeAttribute("data-nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setOpen(!header.hasAttribute("data-nav-open"));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.hasAttribute("data-nav-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
})();
