Array.prototype.shuffle = function () {
  var
    l = this.length,
    s = l > 2,
    c = l;
  while (c-- > s) {
    let i = Math.floor(Math.random() * (s ? c : l));
    [this[i], this[c]] = [this[c], this[i]];
  }
  return this;
};
Array.prototype.randomIndex = function () {
  return Math.floor(Math.random() * this.length);
};
Array.prototype.random = function () {
  return this[this.randomIndex()];
};
const
  data   = await (await fetch("resources/data/seasons/2022-23.json")).json(),
  clEl   = document.getElementById("cl"),
  clBody = clEl.querySelector(".pots tbody"),
  music  = new Audio("resources/sound/music.weba");
for (let i = 0; i < 8; i++) {
  let tr  = document.createElement("tr");
  for (let pot of data.pots) {
    let ptd = document.createElement("td");
    ptd.dataset.name = pot[i].name;
    ptd.innerHTML = `<span><img class="flag" src="resources/img/flags/${pot[i].country}.png"><span>${pot[i].name}</span></span>`;
    tr.append(ptd);
    clBody.append(tr);
  }
}
import {groupStage} from "./engine.js";
groupStage(data, clEl);
music.volume = .1;
music.loop = true;
let musicEl = document.querySelector("#controls .music input");
musicEl.checked = !localStorage.disableMusic;
musicEl.addEventListener("change", function () {
  if (this.checked) {
    music.play();
    delete localStorage.disableMusic;
  } else {
    music.pause();
    localStorage.disableMusic = "true";
  }
});
function playIfPossible() {
  if (!localStorage.disableMusic) {
    music.play().catch(() => document.addEventListener("click", playIfPossible, {once: 1}));
  }
}
playIfPossible();