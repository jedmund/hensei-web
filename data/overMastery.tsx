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
    fractional: false,
    values: [300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000],
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
    fractional: false,
    values: [150, 300, 450, 600, 750, 900, 1050, 1200, 1350, 1500],
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
    fractional: false,
    values: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
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
    fractional: false,
    values: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
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
    fractional: false,
    values: [10, 12, 14, 16, 18, 20, 22, 24, 27, 30],
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
    fractional: false,
    values: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
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
    fractional: false,
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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
    fractional: false,
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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
    fractional: false,
    values: [10, 12, 14, 16, 18, 20, 22, 24, 27, 30],
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
    fractional: false,
    values: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
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
    fractional: false,
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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
    fractional: false,
    values: [6, 7, 8, 9, 10, 12, 14, 16, 18, 20],
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
    fractional: false,
    values: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30],
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
    fractional: false,
    values: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
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
    fractional: false,
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
]

export const overMastery = {
  a: overMasteryPrimary,
  b: overMasterySecondary,
  c: overMasteryTertiary,
}

export const aetherialMastery: ItemSkill[] = [
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
    fractional: false,
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
    fractional: false,
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
    fractional: false,
  },
  {
    name: {
      en: '{Element} Resistance',
      ja: '{属性}軽減',
    },
    id: 4,
    slug: 'element-resist',
    minValue: 5,
    maxValue: 12,
    suffix: '%',
    fractional: false,
  },
  {
    name: {
      en: 'Stamina',
      ja: '渾身',
    },
    id: 5,
    slug: 'stamina',
    minValue: 5,
    maxValue: 12,
    suffix: '',
    fractional: false,
  },
  {
    name: {
      en: 'Enmity',
      ja: '背水',
    },
    id: 6,
    slug: 'enmity',
    minValue: 5,
    maxValue: 12,
    suffix: '',
    fractional: false,
  },
  {
    name: {
      en: 'Supplemental DMG',
      ja: '与ダメ上昇',
    },
    id: 7,
    slug: 'supplemental',
    minValue: 5,
    maxValue: 12,
    suffix: '',
    fractional: false,
  },
  {
    name: {
      en: 'Critical Hit',
      ja: 'クリティカル',
    },
    id: 8,
    slug: 'crit',
    minValue: 18,
    maxValue: 35,
    suffix: '%',
    fractional: false,
  },
  {
    name: {
      en: 'Counters on Dodge',
      ja: 'カウンター(回避)',
    },
    id: 9,
    slug: 'counter-dodge',
    minValue: 5,
    maxValue: 12,
    suffix: '%',
    fractional: false,
  },
  {
    name: {
      en: 'Counters on DMG',
      ja: 'カウンター(被ダメ)',
    },
    id: 10,
    slug: 'counter-dmg',
    minValue: 10,
    maxValue: 17,
    suffix: '%',
    fractional: false,
  },
]

export const permanentMastery: ItemSkill[] = [
  {
    name: {
      en: 'Extended Mastery Star Cap',
      ja: 'LB強化回数上限',
    },
    id: 1,
    slug: 'star-cap',
    minValue: 10,
    maxValue: 10,
    suffix: '',
    fractional: false,
  },
  {
    name: {
      en: 'ATK',
      ja: '攻撃',
    },
    id: 2,
    slug: 'atk',
    minValue: 10,
    maxValue: 10,
    suffix: '%',
    fractional: false,
  },
  {
    name: {
      en: 'HP',
      ja: 'HP',
    },
    id: 3,
    slug: 'hp',
    minValue: 10,
    maxValue: 10,
    suffix: '',
    fractional: false,
  },
  {
    name: {
      en: 'DMG Cap',
      ja: 'ダメージ上限',
    },
    id: 4,
    slug: 'dmg-cap',
    minValue: 5,
    maxValue: 5,
    suffix: '%',
    fractional: false,
  },
]
