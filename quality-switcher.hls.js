function HLSQualitySwitcher(h, e) {
  if (h.levels.length <= 1) return e.innerHTML = "<b>This video doesn't have a multi quality</b>";
  var
    levels = h.levels,
    list;
  e.appendChild(list = document.createElement("ul"));
  list.classList.add("hqs-level_list");
  var auto = document.createElement("li");
  auto.innerHTML = "Auto";
  auto.classList.add("hqs-level", "hqs-auto");
  auto.dataset["track_id"] = -1;
  list.appendChild(auto);
  auto.addEventListener("click", function () {
    h.currentLevel = -1;
    cleanSelected();
    setSelected();
  });
  for (let i = h.levels.length - 1; i > -1 ; i--) {
    let li = document.createElement("li");
    li.innerHTML = levels[i].height + "p";
    li.classList.add("hqs-level");
    li.dataset["track_id"] = i;
    list.appendChild(li);
    li.addEventListener("click", function () {
      h.currentLevel = this.dataset["track_id"];
      cleanSelected();
    setSelected();
    });
  }
  var levelsBtn = list.querySelectorAll(".hqs-level");
  function cleanSelected() {
    levelsBtn.forEach((e) => {
      e.classList.remove("selected");
      e.classList.remove("autoselected");
    });
  }
  function setSelected() {
    if (h.autoLevelEnabled) {
      list.querySelector("[data-track_id=\"-1\"]").classList.add("selected");
      list.querySelector("[data-track_id=\"" + hls.currentLevel + "\"]").classList.add("autoselected");
    } else {
      list.querySelector("[data-track_id=\"" + hls.currentLevel + "\"]").classList.add("selected");
    }
  }
  setSelected();
  h.on(Hls.Events.LEVEL_SWITCHED, function() {
    cleanSelected();
    setSelected();
  });
}