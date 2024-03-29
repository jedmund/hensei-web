import { elements, allElement } from '~data/elements'

export default (
  query: { [index: string]: string },
  raidGroups: RaidGroup[]
) => {
  // Extract recency filter
  const recencyParam: number = parseInt(query.recency)

  // Extract element filter
  const elementParam: string = query.element
  const teamElement: TeamElement | undefined =
    elementParam === 'all'
      ? allElement
      : elements.find(
          (element) => element.name.en.toLowerCase() === elementParam
        )

  // Extract raid filter
  const allRaids = raidGroups.flatMap((group) => group.raids)
  const raidParam: string = query.raid
  const raid: Raid | undefined = allRaids.find((r) => r.slug === raidParam)

  // Return filter object
  return {
    recency: recencyParam && recencyParam !== -1 ? recencyParam : undefined,
    element: teamElement && teamElement.id > -1 ? teamElement.id : undefined,
    raid: raid ? raid.id : undefined,
  }
}
