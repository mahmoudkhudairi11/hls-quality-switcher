let autoSelectorModes = Array.from(document.querySelectorAll("#controls .auto-selector input"));
for (let mode of autoSelectorModes) {
  if (mode.id == (localStorage.autoSelectorMode || "onechoice")) mode.checked = true;
  mode.addEventListener("click", function () {
    localStorage.autoSelectorMode = mode.id;
  });
}
let getAutoSelectorMode = () => autoSelectorModes.find(m => m.checked)?.id || "onechoice";
let showTitlesEl = document.querySelector("#controls .show-titles input");
showTitlesEl.checked = localStorage.showTitles && true;
showTitlesEl.addEventListener("change", function () {
  if (this.checked) {
    localStorage.showTitles = "true";
  } else {
    delete localStorage.showTitles;
  }
});
let animationEl    = document.querySelector(".animation");
let currentSpeed   = animationEl.querySelector(".current-speed");
let animationSpeed = document.getElementById("animationspeed");
animationEl.addEventListener("dblclick", function () {
  currentSpeed.innerText = "1X";
  animationSpeed.value = 1;
  localStorage.animationSpeed = "1";
});
let defaultAnimationSpeed = localStorage.animationSpeed || 1;
if (1 <= defaultAnimationSpeed <= 10) {
  currentSpeed.innerText = `${defaultAnimationSpeed}X`;
  animationSpeed.value = defaultAnimationSpeed;
}
animationSpeed.addEventListener("change", function () {
  currentSpeed.innerText = `${this.value}X`;
  localStorage.animationSpeed = this.value;
});
animationSpeed.addEventListener("wheel", function (e) {
  e.preventDefault();
  let oldValue = this.value;
  this.value = +this.value + e.deltaY / (-100 / (e.shiftKey && .1 || 1));
  oldValue != this.value && this.dispatchEvent(new Event("change"));
});
const draw = new Worker("resources/js/draw.js");
async function createUserSelective(entries, parent) {
  return await new Promise(async rs => {
    let aborter = new AbortController();
    entries.shuffle();
    let selective = document.createElement("div");
    selective.className = "selective";
    let balls = [];
    let done = false;
    let ballNames = new Map;
    for (let entry of entries) {
      await new Promise(rs => setTimeout(rs, 10 / animationSpeed.value));
      let ball = document.createElement("img");
      ball.className = "ball";
      ball.src = "resources/img/ball.png";
      ball.alt = "Ball";
      ballNames.set(ball, entry.name || `Group ${String.fromCharCode(entry + 65)}`);
      if (showTitlesEl.checked) ball.title = ballNames.get(ball);
      ball.addEventListener("click", async function () {
        if (!done) return;
        aborter.abort();
        balls.forEach(b => {
          if (b != ball) b.classList.add("off");
          b.classList.remove("clickable");
        });
        ball.classList.add("rotate");
        await new Promise(rs => setTimeout(rs, 3000 / animationSpeed.value));
        selective.remove();
        rs(entry);
      }, {signal: aborter.signal});
      balls.push(ball);
      selective.append(ball);
      parent.append(selective);
    }
    showTitlesEl.addEventListener("change", function () {
      if (this.checked) {
        balls.forEach(b => b.title = ballNames.get(b));
      } else {
        balls.forEach(b => b.removeAttribute("title"));
      }
    }, {signal: aborter.signal})
    balls.forEach(b => b.classList.add("clickable"));
    done = true;
    await new Promise(rs => setTimeout(rs, 50));
    let autoSelectorMode = getAutoSelectorMode();
    if (autoSelectorMode == "always") {
      balls.random().click();
    } else if (autoSelectorMode == "onechoice" && entries.length == 1) {
      balls[0]?.click();
    }
  });
}
async function showBall(title, color) {
  let background = document.createElement("div");
  background.className = "background " + color;
  document.body.append(background);
  await new Promise(rs => setTimeout(rs, 50));
  background.classList.add("show");
  await new Promise(rs => setTimeout(rs, 1000 / animationSpeed.value));
  for (let c of title) {
    await new Promise(rs => setTimeout(rs, (500 / title.length) / animationSpeed.value));
    background.innerHTML += c;
  }
  await new Promise(rs => setTimeout(rs, 500 / animationSpeed.value));
  background.classList.remove("show");
  await new Promise(rs => setTimeout(rs, 1000 / animationSpeed.value));
  background.remove();
}
export async function groupStage(data, clEl) {
  let pots  = data.pots;
  let teams = pots.flat();
  for (let pairing of data.pairings) {
    let teamName      = pairing[0];
    let thisTeam      = teams.find(t => t.name == teamName);
    let otherTeam     = teams.find(t => pairing.includes(t.name) && t.name != teamName);
    thisTeam.pairing  = otherTeam;
    otherTeam.pairing = thisTeam;
  }
  const groups = Array(8).fill().map(() => []);
  groups.forEach((g, i) => g.number = i + 1);
  let groupsEl = document.querySelector(".groups");
  let groupsElsMap = new Map;
  for (let group of groups) {
    let groupEl = document.createElement("table");
    groupEl.classList.add("group", group.number < 5 ? "red" : "blue");
    groupEl.innerHTML = `<thead><tr><th>Group ${String.fromCharCode(group.number + 64)}</th></tr></thead>`;
    let tbody = document.createElement("tbody");
    for (let i = 1; i < 5; i++) {
      tbody.innerHTML += `<tr data-pot="${i}"><td></td></tr>`;
    }
    groupEl.append(tbody);
    groupsElsMap.set(group, groupEl);
    groupsEl.append(groupEl);
  }
  let drawEl      = clEl.querySelector(".draw");
  let currentStep = drawEl.querySelector(".current-step");
  async function updateCurrentStep(text, time = 1000) {
    currentStep.innerHTML = "";
    for (let c of text) {
      await new Promise(rs => setTimeout(rs, ((time / 1000 * 500) / text.length) / animationSpeed.value));
      currentStep.innerHTML += c;
    }
    await new Promise(rs => setTimeout(rs, (time / 1000 * 500) / animationSpeed.value));
  }
  if (!localStorage?.welcomeSent) {
    await updateCurrentStep("Welcome to UEFA Champions League Draw", 2000);
    await updateCurrentStep("Developed by: Mahmoud Khudairi", 3000);
    await updateCurrentStep("In the upper of the page you will find the controls", 3000);
    await updateCurrentStep("You can control Auto Selector Mode, turning ON/OFF Champions League official anthem or changing the speed of the Animations", 5000);
    await updateCurrentStep("Now let's begin!", 1500);
    localStorage.welcomeSent = "true";
  }
  await updateCurrentStep("Click to Start!", 1500);
  currentStep.classList.add("clickable");
  await new Promise(rs => currentStep.addEventListener("click", rs, {once: 1}));
  currentStep.classList.remove("clickable");
  let potsEl = clEl.querySelector(".pots");
  let pot1El = clEl.querySelector('[data-pot="1"]');
  for (let i = 0; i < 8; i++) {
    await updateCurrentStep("Select a team from pot 1");
    let team  = await createUserSelective(pots[0], drawEl);
    let ti    = pots[0].findIndex(t => t == team);
    pots[0].splice(ti, 1);
    await showBall(`${team.name} (${team.country})`, "white");
    await updateCurrentStep(`Calculating available groups for ${team.name}...`, 100);
    draw.postMessage([pots, 0, groups, team, 1]);
    let availableGroupIndex = await new Promise(rs => draw.addEventListener("message", e => rs(e.data)));
    let group = groups[availableGroupIndex];
    group.push(team);
    await updateCurrentStep(`${team.name} goes to group ${String.fromCharCode(group.number + 64)}`);
    let teamEl = groupsElsMap.get(group).querySelector('[data-pot="1"] td');
    let span = document.createElement("span");
    teamEl.append(span);
    let potsTeamEl = potsEl.querySelector(`td[data-name="${team.name}"]`);
    potsTeamEl.classList.add("done");
    let fragments = [`<img class="flag" src="resources/img/flags/${team.country}.png"> `, ...team.name];
    for (let fragment of fragments) {
      await new Promise(rs => setTimeout(rs, (500 / (team.name.length + 1)) / animationSpeed.value));
      span.innerHTML += fragment;
    }
  }
  pot1El.classList.remove("current");
  pot1El.classList.add("done");
  for (let p = 1; p < 4; p++) {
    let potEl = clEl.querySelector(`[data-pot="${p + 1}"]`);
    potEl.classList.add("current");
    for (let i = 0; i < 8; i++) {
      await updateCurrentStep(`Select a team from pot ${p + 1}`);
      let team = await createUserSelective(pots[p], drawEl);
      let ti   = pots[p].findIndex(t => t == team);
      pots[p].splice(ti, 1);
      await showBall(`${team.name} (${team.country})`, "white");
      await updateCurrentStep(`Calculating available groups for ${team.name}`, 100);
      draw.postMessage([pots, p, groups, team]);
      let availableGroupsIndexes = await new Promise(rs => draw.addEventListener("message", e => rs(e.data)));
      await updateCurrentStep(`Select a group for ${team.name}`);
      currentStep.innerHTML += '<br> Available groups: <div class="available-groups"></div>';
      currentStep.querySelector(".available-groups").innerHTML = availableGroupsIndexes.map(g => `<span class="available-group ${g < 4 ? "red" : "blue"}">${String.fromCharCode(g + 65)}</span>`).join(" ");
      let group = groups[await createUserSelective(availableGroupsIndexes, drawEl)];
      await showBall(`Group ${String.fromCharCode(group.number + 64)}`, group.number < 5 ? "red" : "blue");
      group.push(team);
      team.group = group.number;
      await updateCurrentStep(`${team.name} goes to group ${String.fromCharCode(group.number + 64)}`);
      let teamEl = groupsElsMap.get(group).querySelector(`[data-pot="${p + 1}"] td`);
      let span = document.createElement("span");
      teamEl.append(span);
      let potsTeamEl = potsEl.querySelector(`td[data-name="${team.name}"]`);
      potsTeamEl.classList.add("done");
      let fragments = [`<img class="flag" src="resources/img/flags/${team.country}.png"> `, ...team.name];
      for (let fragment of fragments) {
        await new Promise(rs => setTimeout(rs, (500 / (team.name.length + 1)) / animationSpeed.value));
        span.innerHTML += fragment;
      }
    }
    potEl.classList.remove("current");
    potEl.classList.add("done");
  }
  await updateCurrentStep("The draw has been successfully completed!");
  currentStep.innerHTML += `<br>By: <a href="https://github.com/mahmoudkhudairi11">Mahmoud Khudairi</a>`;
  return groups;
}