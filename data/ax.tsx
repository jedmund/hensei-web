const ax: ItemSkill[][] = [
  [
    {
      name: {
        en: 'ATK',
        ja: '攻撃',
      },
      id: 0,
      slug: 'atk',
      minValue: 1,
      maxValue: 3.5,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'C.A. DMG',
            ja: '奥義ダメ',
          },
          id: 3,
          slug: 'ca-dmg',
          minValue: 2,
          maxValue: 4,
          suffix: '%',
        },
        {
          name: {
            en: 'Double Attack Rate',
            ja: 'DA確率',
          },
          id: 5,
          slug: 'da',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
        {
          name: {
            en: 'Triple Attack Rate',
            ja: 'TA確率',
          },
          id: 6,
          slug: 'ta',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
        {
          name: {
            en: 'Skill DMG Cap',
            ja: 'アビ上限',
          },
          id: 7,
          slug: 'skill-cap',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
      ],
    },
    {
      name: {
        en: 'DEF',
        ja: '防御',
      },
      id: 1,
      slug: 'def',
      minValue: 1,
      maxValue: 8,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'HP',
            ja: 'HP',
          },
          id: 2,
          slug: 'hp',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Debuff Resistance',
            ja: '弱体耐性',
          },
          id: 9,
          slug: 'debuff',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Healing',
            ja: '回復性能',
          },
          id: 10,
          slug: 'healing',
          minValue: 2,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Enmity',
            ja: '背水',
          },
          id: 11,
          slug: 'enmity',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'HP',
        ja: 'HP',
      },
      id: 2,
      slug: 'hp',
      minValue: 1,
      maxValue: 11,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'DEF',
            ja: '防御',
          },
          id: 1,
          slug: 'def',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Debuff Resistance',
            ja: '弱体耐性',
          },
          id: 9,
          slug: 'debuff',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Healing',
            ja: '回復性能',
          },
          id: 10,
          slug: 'healing',
          minValue: 2,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Stamina',
            ja: '渾身',
          },
          id: 12,
          slug: 'stamina',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'C.A. DMG',
        ja: '奥義ダメ',
      },
      id: 3,
      slug: 'ca-dmg',
      minValue: 2,
      maxValue: 8.5,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'ATK',
            ja: '攻撃',
          },
          id: 0,
          slug: 'atk',
          minValue: 1,
          maxValue: 1.5,
          suffix: '%',
        },
        {
          name: {
            en: 'Elemental ATK',
            ja: '全属性攻撃力',
          },
          id: 13,
          slug: 'ele-atk',
          minValue: 1,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'C.A. DMG Cap',
            ja: '奥義上限',
          },
          id: 8,
          slug: 'ca-cap',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
        {
          name: {
            en: 'Stamina',
            ja: '渾身',
          },
          id: 12,
          slug: 'stamina',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'Multiattack Rate',
        ja: '連撃率',
      },
      id: 4,
      slug: 'ta',
      minValue: 1,
      maxValue: 4,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'C.A. DMG',
            ja: '奥義ダメ',
          },
          id: 3,
          slug: 'ca-dmg',
          minValue: 2,
          maxValue: 4,
          suffix: '%',
        },
        {
          name: {
            en: 'Elemental ATK',
            ja: '全属性攻撃力',
          },
          id: 13,
          slug: 'ele-atk',
          minValue: 1,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Double Attack Rate',
            ja: 'DA確率',
          },
          id: 5,
          slug: 'da',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
        {
          name: {
            en: 'Triple Attack Rate',
            ja: 'TA確率',
          },
          id: 6,
          slug: 'ta',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
      ],
    },
  ],
  [
    {
      name: {
        en: 'ATK',
        ja: '攻撃',
      },
      id: 0,
      slug: 'atk',
      minValue: 1,
      maxValue: 3.5,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'C.A. DMG',
            ja: '奥義ダメ',
          },
          id: 3,
          slug: 'ca-dmg',
          minValue: 2,
          maxValue: 8.5,
          suffix: '%',
        },
        {
          name: {
            en: 'Multiattack Rate',
            ja: '連撃確率',
          },
          id: 4,
          slug: 'ta',
          minValue: 1.5,
          maxValue: 4,
          suffix: '%',
        },
        {
          name: {
            en: 'Normal ATK DMG Cap',
            ja: '通常ダメ上限',
          },
          id: 14,
          slug: 'na-dmg',
          minValue: 0.5,
          maxValue: 1.5,
          suffix: '%',
        },
        {
          name: {
            en: 'Supplemental Skill DMG',
            ja: 'アビ与ダメ上昇',
          },
          id: 15,
          slug: 'skill-supp',
          minValue: 1,
          maxValue: 5,
        },
      ],
    },
    {
      name: {
        en: 'DEF',
        ja: '防御',
      },
      id: 1,
      slug: 'def',
      minValue: 1,
      maxValue: 8,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'Elemental DMG Reduction',
            ja: '属性ダメ軽減',
          },
          id: 17,
          slug: 'ele-def',
          minValue: 1,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Debuff Resistance',
            ja: '弱体耐性',
          },
          id: 9,
          slug: 'debuff',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Healing',
            ja: '回復性能',
          },
          id: 10,
          slug: 'healing',
          minValue: 2,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Enmity',
            ja: '背水',
          },
          id: 11,
          slug: 'enmity',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'HP',
        ja: 'HP',
      },
      id: 2,
      slug: 'hp',
      minValue: 1,
      maxValue: 11,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'Elemental DMG Reduction',
            ja: '属性ダメ軽減',
          },
          id: 17,
          slug: 'ele-def',
          minValue: 1,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Debuff Resistance',
            ja: '弱体耐性',
          },
          id: 9,
          slug: 'debuff',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Healing',
            ja: '回復性能',
          },
          id: 10,
          slug: 'healing',
          minValue: 2,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Stamina',
            ja: '渾身',
          },
          id: 12,
          slug: 'stamina',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'C.A. DMG',
        ja: '奥義ダメ',
      },
      id: 3,
      slug: 'ca-dmg',
      minValue: 2,
      maxValue: 8.5,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'Multiattack Rate',
            ja: '連撃率',
          },
          id: 4,
          slug: 'ta',
          minValue: 1.5,
          maxValue: 4,
          suffix: '%',
        },
        {
          name: {
            en: 'Supplemental Skill DMG',
            ja: 'アビ与ダメ上昇',
          },
          id: 15,
          slug: 'skill-supp',
          minValue: 1,
          maxValue: 5,
        },
        {
          name: {
            en: 'Supplemental C.A. DMG',
            ja: '奥義与ダメ上昇',
          },
          id: 16,
          slug: 'ca-supp',
          minValue: 1,
          maxValue: 5,
        },
        {
          name: {
            en: 'Stamina',
            ja: '渾身',
          },
          id: 12,
          slug: 'stamina',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'Multiattack Rate',
        ja: '連撃率',
      },
      id: 4,
      slug: 'ta',
      minValue: 1,
      maxValue: 4,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'Supplemental C.A. DMG',
            ja: '奥義与ダメ上昇',
          },
          id: 16,
          slug: 'ca-supp',
          minValue: 1,
          maxValue: 5,
        },
        {
          name: {
            en: 'Normal ATK DMG Cap',
            ja: '通常ダメ上限',
          },
          id: 14,
          slug: 'na-cap',
          minValue: 0.5,
          maxValue: 1.5,
          suffix: '%',
        },
        {
          name: {
            en: 'Stamina',
            ja: '渾身',
          },
          id: 12,
          slug: 'stamina',
          minValue: 1,
          maxValue: 3,
        },
        {
          name: {
            en: 'Enmity',
            ja: '背水',
          },
          id: 11,
          slug: 'enmity',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
  ],
  [
    {
      name: {
        en: 'ATK',
        ja: '攻撃',
      },
      id: 0,
      slug: 'atk',
      minValue: 1,
      maxValue: 3.5,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'C.A. DMG',
            ja: '奥義ダメ',
          },
          id: 3,
          slug: 'ca-dmg',
          minValue: 2,
          maxValue: 4,
          suffix: '%',
        },
        {
          name: {
            en: 'Double Attack Rate',
            ja: 'DA確率',
          },
          id: 5,
          slug: 'da',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
        {
          name: {
            en: 'Triple Attack Rate',
            ja: 'TA確率',
          },
          id: 6,
          slug: 'ta',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
        {
          name: {
            en: 'Skill DMG Cap',
            ja: 'アビ上限',
          },
          id: 7,
          slug: 'skill-cap',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
      ],
    },
    {
      name: {
        en: 'DEF',
        ja: '防御',
      },
      id: 1,
      slug: 'def',
      minValue: 1,
      maxValue: 8,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'HP',
            ja: 'HP',
          },
          id: 2,
          slug: 'hp',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Debuff Resistance',
            ja: '弱体耐性',
          },
          id: 9,
          slug: 'debuff',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Healing',
            ja: '回復性能',
          },
          id: 10,
          slug: 'healing',
          minValue: 2,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Enmity',
            ja: '背水',
          },
          id: 11,
          slug: 'enmity',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'HP',
        ja: 'HP',
      },
      id: 2,
      slug: 'hp',
      minValue: 1,
      maxValue: 11,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'DEF',
            ja: '防御',
          },
          id: 1,
          slug: 'def',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Debuff Resistance',
            ja: '弱体耐性',
          },
          id: 9,
          slug: 'debuff',
          minValue: 1,
          maxValue: 3,
          suffix: '%',
        },
        {
          name: {
            en: 'Healing',
            ja: '回復性能',
          },
          id: 10,
          slug: 'healing',
          minValue: 2,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Stamina',
            ja: '渾身',
          },
          id: 12,
          slug: 'stamina',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'C.A. DMG',
        ja: '奥義ダメ',
      },
      id: 3,
      slug: 'ca-dmg',
      minValue: 2,
      maxValue: 8.5,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'ATK',
            ja: '攻撃',
          },
          id: 0,
          slug: 'atk',
          minValue: 1,
          maxValue: 1.5,
          suffix: '%',
        },
        {
          name: {
            en: 'Elemental ATK',
            ja: '全属性攻撃力',
          },
          id: 13,
          slug: 'ele-atk',
          minValue: 1,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'C.A. DMG Cap',
            ja: '奥義上限',
          },
          id: 8,
          slug: 'ca-dmg',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
        {
          name: {
            en: 'Stamina',
            ja: '渾身',
          },
          id: 12,
          slug: 'stamina',
          minValue: 1,
          maxValue: 3,
        },
      ],
    },
    {
      name: {
        en: 'Multiattack Rate',
        ja: '連撃率',
      },
      id: 4,
      slug: 'ta',
      minValue: 1,
      maxValue: 4,
      suffix: '%',
      secondary: [
        {
          name: {
            en: 'C.A. DMG',
            ja: '奥義ダメ',
          },
          id: 3,
          slug: 'ca-dmg',
          minValue: 2,
          maxValue: 4,
          suffix: '%',
        },
        {
          name: {
            en: 'Elemental ATK',
            ja: '全属性攻撃力',
          },
          id: 13,
          slug: 'ele-atk',
          minValue: 1,
          maxValue: 5,
          suffix: '%',
        },
        {
          name: {
            en: 'Double Attack Rate',
            ja: 'DA確率',
          },
          id: 5,
          slug: 'da',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
        {
          name: {
            en: 'Triple Attack Rate',
            ja: 'TA確率',
          },
          id: 6,
          slug: 'ta',
          minValue: 1,
          maxValue: 2,
          suffix: '%',
        },
      ],
    },
    {
      name: {
        en: 'EXP Up',
        ja: 'EXP UP',
      },
      id: 18,
      slug: 'exp',
      minValue: 5,
      maxValue: 10,
      suffix: '%',
    },
    {
      name: {
        en: 'Rupies',
        ja: '獲得ルピ',
      },
      id: 19,
      slug: 'rupie',
      minValue: 10,
      maxValue: 20,
      suffix: '%',
    },
  ],
]

export default ax
