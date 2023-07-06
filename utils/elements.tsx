export const elements: GranblueElement[] = [
  {
    id: 0,
    weaknessId: 0,
    name: {
      en: 'Null',
      ja: '無',
    },
    slug: 'null',
  },
  {
    id: 1,
    weaknessId: 2,
    name: {
      en: 'Wind',
      ja: '風',
    },
    slug: 'wind',
  },
  {
    id: 2,
    weaknessId: 3,
    name: {
      en: 'Fire',
      ja: '火',
    },
    slug: 'fire',
  },
  {
    id: 3,
    weaknessId: 4,
    name: {
      en: 'Water',
      ja: '水',
    },
    slug: 'water',
  },
  {
    id: 4,
    weaknessId: 1,
    name: {
      en: 'Earth',
      ja: '土',
    },
    slug: 'earth',
  },
  {
    id: 5,
    weaknessId: 5,
    name: {
      en: 'Dark',
      ja: '闇',
    },
    slug: 'dark',
  },
  {
    id: 6,
    weaknessId: 6,
    name: {
      en: 'Light',
      ja: '光',
    },
    slug: 'light',
  },
]

export function numberToElement(value: number) {
  return elements.find((element) => element.id === value) || elements[0]
}

export function stringToElement(value: string) {
  return elements.find((element) => element.name.en === value)
}
