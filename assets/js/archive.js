(function () {
  var root = document.querySelector("[data-writing-archive]");
  if (!root) return;

  var rows = root.querySelectorAll(".post-list li");
  var tagBtns = root.querySelectorAll("[data-tag-filter]");
  var typeBtns = root.querySelectorAll("[data-type-filter]");
  var list = root.querySelector(".post-list");
  var empty = root.querySelector("[data-filter-empty]");
  var tag = "";
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
      var typeOk = !type || row.getAttribute("data-type") === type;
      var tags = (row.getAttribute("data-tags") || "").split(/\s+/);
      var tagOk = !tag || tags.indexOf(tag) !== -1;
      var match = typeOk && tagOk;
      row.hidden = !match;
      if (match) shown += 1;
    }
    if (list) list.hidden = shown === 0;
    if (empty) empty.hidden = shown > 0;
    pressed(tagBtns, "data-tag-filter", tag);
    pressed(typeBtns, "data-type-filter", type);
  }

  for (var t = 0; t < tagBtns.length; t++) {
    tagBtns[t].addEventListener("click", function () {
      var next = this.getAttribute("data-tag-filter") || "";
      tag = tag === next ? "" : next;
      apply();
    });
  }

  for (var p = 0; p < typeBtns.length; p++) {
    typeBtns[p].addEventListener("click", function () {
      type = this.getAttribute("data-type-filter") || "";
      apply();
    });
  }

  apply();
})();
