const overMasteryPrimary: ItemSkill[] = [
  {
    name: {
      en: 'ATK',
      ja: '攻撃',
    },
    id: 1,
    slug: 'atk',
    minValue: 300,
    maxValue: 3000,
    suffix: '',
    secondary: [],
  },
  {
    name: {
      en: 'HP',
      ja: 'HP',
    },
    id: 2,
    slug: 'hp',
    minValue: 150,
    maxValue: 1500,
    suffix: '',
    secondary: [],
  },
]

const overMasterySecondary: ItemSkill[] = [
  {
    name: {
      en: 'Debuff Success',
      ja: '弱体成功率',
    },
    id: 3,
    slug: 'debuff-success',
    minValue: 6,
    maxValue: 15,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Skill DMG Cap',
      ja: 'アビダメ上限',
    },
    id: 4,
    slug: 'skill-cap',
    minValue: 6,
    maxValue: 15,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'C.A. DMG',
      ja: '奥義ダメージ',
    },
    id: 5,
    slug: 'ca-dmg',
    minValue: 10,
    maxValue: 30,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'C.A. DMG Cap',
      ja: '奥義ダメージ上限',
    },
    id: 6,
    slug: 'ca-cap',
    minValue: 6,
    maxValue: 15,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Stamina',
      ja: '渾身',
    },
    id: 7,
    slug: 'stamina',
    minValue: 1,
    maxValue: 10,
    suffix: '',
    secondary: [],
  },
  {
    name: {
      en: 'Enmity',
      ja: '背水',
    },
    id: 8,
    slug: 'enmity',
    minValue: 1,
    maxValue: 10,
    suffix: '',
    secondary: [],
  },
  {
    name: {
      en: 'Critical Hit',
      ja: 'クリティカル確率',
    },
    id: 9,
    slug: 'crit',
    minValue: 10,
    maxValue: 30,
    suffix: '%',
    secondary: [],
  },
]

const overMasteryTertiary: ItemSkill[] = [
  {
    name: {
      en: 'Double Attack',
      ja: 'ダブルアタック確率',
    },
    id: 10,
    slug: 'da',
    minValue: 6,
    maxValue: 15,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Triple Attack',
      ja: 'トリプルアタック確率',
    },
    id: 11,
    slug: 'ta',
    minValue: 1,
    maxValue: 10,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'DEF',
      ja: '防御',
    },
    id: 12,
    slug: 'def',
    minValue: 6,
    maxValue: 20,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Healing',
      ja: '回復性能',
    },
    id: 13,
    slug: 'heal',
    minValue: 3,
    maxValue: 30,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Debuff Resistance',
      ja: '弱体耐性',
    },
    id: 14,
    slug: 'debuff-resist',
    minValue: 6,
    maxValue: 15,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Dodge',
      ja: '回避',
    },
    id: 15,
    slug: 'dodge',
    minValue: 1,
    maxValue: 10,
    suffix: '%',
    secondary: [],
  },
]

export const overMastery = {
  a: overMasteryPrimary,
  b: overMasterySecondary,
  c: overMasteryTertiary,
}

export const aetherialMastery = [
  {
    name: {
      en: 'Double Attack',
      ja: 'ダブルアタック確率',
    },
    id: 1,
    slug: 'da',
    minValue: 10,
    maxValue: 17,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Triple Attack',
      ja: 'トリプルアタック確率',
    },
    id: 2,
    slug: 'ta',
    minValue: 5,
    maxValue: 12,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: '{Element} ATK Up',
      ja: '{属性}攻撃',
    },
    id: 3,
    slug: 'element-atk',
    minValue: 15,
    maxValue: 22,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: '{Element} Resistance',
      ja: '{属性}軽減',
    },
    id: 3,
    slug: 'element-resist',
    minValue: 5,
    maxValue: 12,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Stamina',
      ja: '渾身',
    },
    id: 4,
    slug: 'stamina',
    minValue: 5,
    maxValue: 12,
    suffix: '',
    secondary: [],
  },
  {
    name: {
      en: 'Enmity',
      ja: '背水',
    },
    id: 5,
    slug: 'enmity',
    minValue: 5,
    maxValue: 12,
    suffix: '',
    secondary: [],
  },
  {
    name: {
      en: 'Supplemental DMG',
      ja: '与ダメ上昇',
    },
    id: 6,
    slug: 'supplemental',
    minValue: 5,
    maxValue: 12,
    suffix: '',
    secondary: [],
  },
  {
    name: {
      en: 'Critical Hit',
      ja: 'クリティカル',
    },
    id: 7,
    slug: 'crit',
    minValue: 18,
    maxValue: 35,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Counters on Dodge',
      ja: 'カウンター(回避)',
    },
    id: 8,
    slug: 'counter-dodge',
    minValue: 5,
    maxValue: 12,
    suffix: '%',
    secondary: [],
  },
  {
    name: {
      en: 'Counters on DMG',
      ja: 'カウンター(被ダメ)',
    },
    id: 9,
    slug: 'counter-dmg',
    minValue: 10,
    maxValue: 17,
    suffix: '%',
    secondary: [],
  },
]
