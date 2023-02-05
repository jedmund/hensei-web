export type Awakening = {
  id: number
  name: {
    [key: string]: string
    en: string
    ja: string
  }
}
export const characterAwakening: ItemSkill[] = [
  {
    id: 1,
    name: {
      en: 'Balanced',
      ja: 'バランス',
    },
    slug: 'balanced',
    minValue: 1,
    maxValue: 9,
    fractional: false,
  },
  {
    id: 2,
    name: {
      en: 'Attack',
      ja: '攻撃',
    },
    slug: 'attack',
    minValue: 1,
    maxValue: 9,
    fractional: false,
  },
  {
    id: 3,
    name: {
      en: 'Defense',
      ja: '防御',
    },
    slug: 'defense',
    minValue: 1,
    maxValue: 9,
    fractional: false,
  },
  {
    id: 4,
    name: {
      en: 'Multiattack',
      ja: '連続攻撃',
    },
    slug: 'multiattack',
    minValue: 1,
    maxValue: 9,
    fractional: false,
  },
]

export const weaponAwakening: ItemSkill[] = [
  {
    id: 1,
    name: {
      en: 'Attack',
      ja: '攻撃',
    },
    slug: 'attack',
    minValue: 1,
    maxValue: 15,
    fractional: false,
  },
  {
    id: 2,
    name: {
      en: 'Defense',
      ja: '防御',
    },
    slug: 'defense',
    minValue: 1,
    maxValue: 15,
    fractional: false,
  },
  {
    id: 3,
    name: {
      en: 'Special',
      ja: '特殊',
    },
    slug: 'special',
    minValue: 1,
    maxValue: 15,
    fractional: false,
  },
]
