export type Awakening = {
  id: number
  name: {
    [key: string]: string
    en: string
    ja: string
  }
}
export const characterAwakening: Awakening[] = [
  {
    id: 0,
    name: {
      en: 'Balanced',
      ja: 'バランス',
    },
  },
  {
    id: 1,
    name: {
      en: 'Attack',
      ja: '攻撃',
    },
  },
  {
    id: 2,
    name: {
      en: 'Defense',
      ja: '防御',
    },
  },
  {
    id: 3,
    name: {
      en: 'Multiattack',
      ja: '連続攻撃',
    },
  },
]

export const weaponAwakening: Awakening[] = [
  {
    id: 0,
    name: {
      en: 'Attack',
      ja: '攻撃',
    },
  },
  {
    id: 1,
    name: {
      en: 'Defense',
      ja: '防御',
    },
  },
  {
    id: 2,
    name: {
      en: 'Special',
      ja: '特殊',
    },
  },
]
