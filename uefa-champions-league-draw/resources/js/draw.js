const coldCountries = [
  "KAZ",
  "RUS",
  "BLR",
  "LTU",
  "LVA",
  "EST",
  "NOR",
  "FIN",
  "SWE",
  "ISL",
  "FRO",
];
function sumBy(array, callback) {
  return array.reduce((a, c) => a + callback(c), 0);
}
function isMaxTwoColdTeams() {
  return group => sumBy(group, team => coldCountries.includes(team.country) ? 1 : 0) <= 2;
}
const incompatibleCountries = [
  {
    countries: ["RUS", "UKR"],
    startYear: 2014,
  },
  {
    countries: ["AZE", "ARM"],
  },
  {
    countries: ["SRB", "KOS"],
  },
  {
    countries: ["BIH", "KOS"],
  },
  {
    countries: ["ESP", "GIB"],
  },
];
function isCountriesIncompatibleWith(country1, country2) {
  if (country1 == country2) return true;
  return incompatibleCountries.some(ic => ic.countries.includes(country1) && ic.countries.includes(country2));
}
const getPairingGroups = (groups, groupIndex) => {
  const mid = groups.length >> 1;
  const start = groupIndex < mid ? 0 : mid;
  return groups.slice(start, start + mid);
}
function getAvailableGroups(potIndex, groups, team) {
  return groups.map((item, i) => i).filter(groupIndex => {
    const group = groups[groupIndex];
    if (group.length > potIndex) return false;
    return !(group.some(t => isCountriesIncompatibleWith(team.country, t.country) || !isMaxTwoColdTeams([...group, team])) || team.pairing && getPairingGroups(groups, groupIndex).some(g => g.some(t => t == team.pairing)));
  });
}
function groupIsPossible(pots, groups, team, groupIndex) {
  const potIndex = pots.findIndex(p => p.length);
  if (potIndex < 0) return true;
  const virtualGroups = groups.slice();
  const group = virtualGroups[groupIndex];
  virtualGroups[groupIndex] = [team, ...group];
  const virtualPots = pots.slice();
  let remainingTeams;
  [team, ...remainingTeams] = virtualPots[potIndex];
  virtualPots[potIndex] = remainingTeams;
  return getAvailableGroups(potIndex, virtualGroups, team).some(groupIndex => groupIsPossible(virtualPots, virtualGroups, team, groupIndex));
}
function getPossible(pots, potIndex, groups, team, autoSelect) {
  pots.forEach((pot, i) => {
    if (pot.length < 2) return;
    let availableGroupsMap = new Map;
    pot.forEach(t => availableGroupsMap.set(t, getAvailableGroups(i, groups, t)));
    pot.sort((a, b) => {
      let ag1 = availableGroupsMap.get(a);
      let ag2 = availableGroupsMap.get(b);
      if (ag1.length < ag2.length) return -1;
      if (ag1.length > ag2.length) return 1;
      return 0;
    });
  });
  let availableGroups = getAvailableGroups(potIndex, groups, team);
  if (availableGroups.length == 1) return autoSelect ? availableGroups[0] : availableGroups;
  return getAvailableGroups(potIndex, groups, team)[autoSelect ? "find" : "filter"](groupIndex => groupIsPossible(pots, groups, team, groupIndex))
}
addEventListener("message", e => {
  let availableGroups = getPossible.apply(this, e.data);
  postMessage(availableGroups);
});