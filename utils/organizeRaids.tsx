export default (raids: Raid[]) => {
  console.log('organizing raids...')
  // Set up empty raid for "All raids"
  const all = {
    id: '0',
    name: {
      en: 'All raids',
      ja: '全て',
    },
    slug: 'all',
    level: 0,
    group: 0,
    element: 0,
  }

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
