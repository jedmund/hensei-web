export default (raids: Raid[]) => {
  const numGroups = Math.max.apply(
    Math,
    raids.map((raid) => raid.group)
  )
  let groupedRaids = []

  for (let i = 0; i <= numGroups; i++) {
    groupedRaids[i] = raids.filter((raid) => raid.group == i)
  }

  return {
    raids: raids,
    sortedRaids: groupedRaids,
  }
}
