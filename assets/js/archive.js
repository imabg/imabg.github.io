(function () {
  var root = document.querySelector("[data-writing-archive]");
  if (!root) return;

  var rows = root.querySelectorAll(".post-list li");
  var typeBtns = root.querySelectorAll("[data-type-filter]");
  var list = root.querySelector(".post-list");
  var empty = root.querySelector("[data-filter-empty]");
  var type = "";

  function pressed(btns, key, value) {
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      var on = (btn.getAttribute(key) || "") === value;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function apply() {
    var shown = 0;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var match = !type || row.getAttribute("data-type") === type;
      row.hidden = !match;
      if (match) shown += 1;
    }
    if (list) list.hidden = shown === 0;
    if (empty) empty.hidden = shown > 0;
    pressed(typeBtns, "data-type-filter", type);
  }

  for (var p = 0; p < typeBtns.length; p++) {
    typeBtns[p].addEventListener("click", function () {
      type = this.getAttribute("data-type-filter") || "";
      apply();
    });
  }

  apply();
})();
