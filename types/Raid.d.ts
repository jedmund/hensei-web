interface Raid {
  id: string
  group?: RaidGroup
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  slug: string
  level: number
  element: GranblueElement
}
