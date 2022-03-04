export const axData: AxSkill[][] = [
    [
        {
            name: {
                "en": "ATK",
                "jp": "攻撃"
            },
            id: 0,
            minValue: 1,
            maxValue: 3.5,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "C.A. DMG",
                        "jp": "奥義ダメ"
                    },
                    id: 3,
                    minValue: 2,
                    maxValue: 4,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Double Attack Rate",
                        "jp": "DA確率"
                    },
                    id: 5,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Triple Attack Rate",
                        "jp": "TA確率"
                    },
                    id: 6,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Skill DMG Cap",
                        "jp": "アビ上限"
                    },
                    id: 7,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                }
            ]
        },
        {
            name: {
                "en": "DEF",
                "jp": "防御"
            },
            id: 1,
            minValue: 1,
            maxValue: 8,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "HP",
                        "jp": "HP"
                    },
                    id: 2,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Debuff Resistance",
                        "jp": "弱体耐性"
                    },
                    id: 9,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Healing",
                        "jp": "回復性能"
                    },
                    id: 10,
                    minValue: 2,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Enmity",
                        "jp": "背水"
                    },
                    id: 11,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "HP",
                "jp": "HP"
            },
            id: 2,
            minValue: 1,
            maxValue: 11,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "DEF",
                        "jp": "防御"
                    },
                    id: 1,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Debuff Resistance",
                        "jp": "弱体耐性"
                    },
                    id: 9,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Healing",
                        "jp": "回復性能"
                    },
                    id: 10,
                    minValue: 2,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Stamina",
                        "jp": "渾身"
                    },
                    id: 12,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "C.A. DMG",
                "jp": "奥義ダメ"
            },
            id: 3,
            minValue: 2,
            maxValue: 8.5,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "ATK",
                        "jp": "攻撃"
                    },
                    id: 0,
                    minValue: 1,
                    maxValue: 1.5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Elemental ATK",
                        "jp": "全属性攻撃力"
                    },
                    id: 13,
                    minValue: 1,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "C.A. DMG Cap",
                        "jp": "奥義上限"
                    },
                    id: 8,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Stamina",
                        "jp": "渾身"
                    },
                    id: 12,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "Multiattack Rate",
                "jp": "連撃率"
            },
            id: 4,
            minValue: 1,
            maxValue: 4,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "C.A. DMG",
                        "jp": "奥義ダメ"
                    },
                    id: 3,
                    minValue: 2,
                    maxValue: 4,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Elemental ATK",
                        "jp": "全属性攻撃力"
                    },
                    id: 13,
                    minValue: 1,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Double Attack Rate",
                        "jp": "DA確率"
                    },
                    id: 5,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Triple Attack Rate",
                        "jp": "TA確率"
                    },
                    id: 6,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                }
            ]
        }
    ], [
        {
            name: {
                "en": "ATK",
                "jp": "攻撃"
            },
            id: 0,
            minValue: 1,
            maxValue: 3.5,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "C.A. DMG",
                        "jp": "奥義ダメ"
                    },
                    id: 3,
                    minValue: 2,
                    maxValue: 8.5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Multiattack Rate",
                        "jp": "連撃確率"
                    },
                    id: 4,
                    minValue: 1.5,
                    maxValue: 4,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Normal ATK DMG Cap",
                        "jp": "通常ダメ上限"
                    },
                    id: 14,
                    minValue: 0.5,
                    maxValue: 1.5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Supplemental Skill DMG",
                        "jp": "アビ与ダメ上昇"
                    },
                    id: 15,
                    minValue: 1,
                    maxValue: 5
                }
            ]
        },
        {
            name: {
                "en": "DEF",
                "jp": "防御"
            },
            id: 1,
            minValue: 1,
            maxValue: 8,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "Elemental DMG Reduction",
                        "jp": "属性ダメ軽減"
                    },
                    id: 17,
                    minValue: 1,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Debuff Resistance",
                        "jp": "弱体耐性"
                    },
                    id: 9,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Healing",
                        "jp": "回復性能"
                    },
                    id: 10,
                    minValue: 2,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Enmity",
                        "jp": "背水"
                    },
                    id: 11,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "HP",
                "jp": "HP"
            },
            id: 2,
            minValue: 1,
            maxValue: 11,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "Elemental DMG Reduction",
                        "jp": "属性ダメ軽減"
                    },
                    id: 17,
                    minValue: 1,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Debuff Resistance",
                        "jp": "弱体耐性"
                    },
                    id: 9,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Healing",
                        "jp": "回復性能"
                    },
                    id: 10,
                    minValue: 2,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Stamina",
                        "jp": "渾身"
                    },
                    id: 12,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "C.A. DMG",
                "jp": "奥義ダメ"
            },
            id: 3,
            minValue: 2,
            maxValue: 8.5,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "Multiattack Rate",
                        "jp": "連撃率"
                    },
                    id: 4,
                    minValue: 1.5,
                    maxValue: 4,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Supplemental Skill DMG",
                        "jp": "アビ与ダメ上昇"
                    },
                    id: 15,
                    minValue: 1,
                    maxValue: 5,
                },
                {
                    name: {
                        "en": "Supplemental C.A. DMG",
                        "jp": "奥義与ダメ上昇"
                    },
                    id: 16,
                    minValue: 1,
                    maxValue: 5,
                },
                {
                    name: {
                        "en": "Stamina",
                        "jp": "渾身"
                    },
                    id: 12,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "Multiattack Rate",
                "jp": "連撃率"
            },
            id: 4,
            minValue: 1,
            maxValue: 4,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "Supplemental C.A. DMG",
                        "jp": "奥義与ダメ上昇"
                    },
                    id: 16,
                    minValue: 1,
                    maxValue: 5,
                },
                {
                    name: {
                        "en": "Normal ATK DMG Cap",
                        "jp": "通常ダメ上限"
                    },
                    id: 14,
                    minValue: 0.5,
                    maxValue: 1.5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Stamina",
                        "jp": "渾身"
                    },
                    id: 12,
                    minValue: 1,
                    maxValue: 3,
                },
                {
                    name: {
                        "en": "Enmity",
                        "jp": "背水"
                    },
                    id: 11,
                    minValue: 1,
                    maxValue: 3,
                }
            ]
        }
    ], [
        {
            name: {
                "en": "ATK",
                "jp": "攻撃"
            },
            id: 0,
            minValue: 1,
            maxValue: 3.5,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "C.A. DMG",
                        "jp": "奥義ダメ"
                    },
                    id: 3,
                    minValue: 2,
                    maxValue: 4,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Double Attack Rate",
                        "jp": "DA確率"
                    },
                    id: 5,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Triple Attack Rate",
                        "jp": "TA確率"
                    },
                    id: 6,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Skill DMG Cap",
                        "jp": "アビ上限"
                    },
                    id: 7,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                }
            ]
        },
        {
            name: {
                "en": "DEF",
                "jp": "防御"
            },
            id: 1,
            minValue: 1,
            maxValue: 8,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "HP",
                        "jp": "HP"
                    },
                    id: 2,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Debuff Resistance",
                        "jp": "弱体耐性"
                    },
                    id: 9,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Healing",
                        "jp": "回復性能"
                    },
                    id: 10,
                    minValue: 2,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Enmity",
                        "jp": "背水"
                    },
                    id: 11,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "HP",
                "jp": "HP"
            },
            id: 2,
            minValue: 1,
            maxValue: 11,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "DEF",
                        "jp": "防御"
                    },
                    id: 1,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Debuff Resistance",
                        "jp": "弱体耐性"
                    },
                    id: 9,
                    minValue: 1,
                    maxValue: 3,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Healing",
                        "jp": "回復性能"
                    },
                    id: 10,
                    minValue: 2,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Stamina",
                        "jp": "渾身"
                    },
                    id: 12,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "C.A. DMG",
                "jp": "奥義ダメ"
            },
            id: 3,
            minValue: 2,
            maxValue: 8.5,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "ATK",
                        "jp": "攻撃"
                    },
                    id: 0,
                    minValue: 1,
                    maxValue: 1.5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Elemental ATK",
                        "jp": "全属性攻撃力"
                    },
                    id: 13,
                    minValue: 1,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "C.A. DMG Cap",
                        "jp": "奥義上限"
                    },
                    id: 8,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Stamina",
                        "jp": "渾身"
                    },
                    id: 12,
                    minValue: 1,
                    maxValue: 3
                }
            ]
        },
        {
            name: {
                "en": "Multiattack Rate",
                "jp": "連撃率"
            },
            id: 4,
            minValue: 1,
            maxValue: 4,
            suffix: '%',
            secondary: [
                {
                    name: {
                        "en": "C.A. DMG",
                        "jp": "奥義ダメ"
                    },
                    id: 3,
                    minValue: 2,
                    maxValue: 4,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Elemental ATK",
                        "jp": "全属性攻撃力"
                    },
                    id: 13,
                    minValue: 1,
                    maxValue: 5,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Double Attack Rate",
                        "jp": "DA確率"
                    },
                    id: 5,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                },
                {
                    name: {
                        "en": "Triple Attack Rate",
                        "jp": "TA確率"
                    },
                    id: 6,
                    minValue: 1,
                    maxValue: 2,
                    suffix: '%'
                }
            ]
        },
        {
            name: {
                "en": "EXP Up",
                "jp": "EXP UP"
            },
            id: 18,
            minValue: 5,
            maxValue: 10,
            suffix: '%'
        },
        {
            name: {
                "en": "Rupies",
                "jp": "獲得ルピ"
            },
            id: 19,
            minValue: 10,
            maxValue: 20,
            suffix: '%'
        }
    ]
]