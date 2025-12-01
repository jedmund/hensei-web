/**
 * AX Skill data for weapon modifications
 *
 * Structure:
 * - Array of 3 AX types (indexed by axType - 1)
 * - Each type has a list of primary skills
 * - Primary skills may have secondary skills that can be paired with them
 */

export interface AxSkill {
	name: {
		en: string
		ja: string
	}
	id: number
	granblueId: string
	slug: string
	minValue: number
	maxValue: number
	fractional: boolean
	suffix?: string
	secondary?: AxSkill[]
}

// "No skill" constant for empty selection
export const NO_AX_SKILL: AxSkill = {
	name: { en: 'No skill', ja: 'スキルなし' },
	id: -1,
	granblueId: '',
	slug: 'no-skill',
	minValue: 0,
	maxValue: 0,
	fractional: false
}

// AX skill data organized by axType (1-indexed in API, 0-indexed here)
const ax: AxSkill[][] = [
	// axType 1 - Standard AX skills
	[
		{
			name: { en: 'ATK', ja: '攻撃' },
			id: 0,
			granblueId: '1589',
			slug: 'atk',
			minValue: 1,
			maxValue: 3.5,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'C.A. DMG', ja: '奥義ダメ' }, id: 3, granblueId: '1591', slug: 'ca-dmg', minValue: 2, maxValue: 4, fractional: true, suffix: '%' },
				{ name: { en: 'Double Attack Rate', ja: 'DA確率' }, id: 5, granblueId: '1596', slug: 'da', minValue: 1, maxValue: 2, fractional: true, suffix: '%' },
				{ name: { en: 'Triple Attack Rate', ja: 'TA確率' }, id: 6, granblueId: '1597', slug: 'ta', minValue: 1, maxValue: 2, fractional: true, suffix: '%' },
				{ name: { en: 'Skill DMG Cap', ja: 'アビ上限' }, id: 7, granblueId: '1588', slug: 'skill-cap', minValue: 1, maxValue: 2, fractional: true, suffix: '%' }
			]
		},
		{
			name: { en: 'DEF', ja: '防御' },
			id: 1,
			granblueId: '1590',
			slug: 'def',
			minValue: 1,
			maxValue: 8,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'HP', ja: 'HP' }, id: 2, granblueId: '1588', slug: 'hp', minValue: 1, maxValue: 3, fractional: true, suffix: '%' },
				{ name: { en: 'Debuff Resistance', ja: '弱体耐性' }, id: 9, granblueId: '1593', slug: 'debuff', minValue: 1, maxValue: 3, fractional: false, suffix: '%' },
				{ name: { en: 'Healing', ja: '回復性能' }, id: 10, granblueId: '1595', slug: 'healing', minValue: 2, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Enmity', ja: '背水' }, id: 11, granblueId: '1601', slug: 'enmity', minValue: 1, maxValue: 3, fractional: false }
			]
		},
		{
			name: { en: 'HP', ja: 'HP' },
			id: 2,
			granblueId: '1588',
			slug: 'hp',
			minValue: 1,
			maxValue: 11,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'DEF', ja: '防御' }, id: 1, granblueId: '1590', slug: 'def', minValue: 1, maxValue: 3, fractional: true, suffix: '%' },
				{ name: { en: 'Debuff Resistance', ja: '弱体耐性' }, id: 9, granblueId: '1593', slug: 'debuff', minValue: 1, maxValue: 3, fractional: false, suffix: '%' },
				{ name: { en: 'Healing', ja: '回復性能' }, id: 10, granblueId: '1595', slug: 'healing', minValue: 2, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Stamina', ja: '渾身' }, id: 12, granblueId: '1600', slug: 'stamina', minValue: 1, maxValue: 3, fractional: false }
			]
		},
		{
			name: { en: 'C.A. DMG', ja: '奥義ダメ' },
			id: 3,
			granblueId: '1591',
			slug: 'ca-dmg',
			minValue: 2,
			maxValue: 8.5,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'ATK', ja: '攻撃' }, id: 0, granblueId: '1589', slug: 'atk', minValue: 1, maxValue: 1.5, fractional: true, suffix: '%' },
				{ name: { en: 'Elemental ATK', ja: '全属性攻撃力' }, id: 13, granblueId: '1594', slug: 'ele-atk', minValue: 1, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'C.A. DMG Cap', ja: '奥義上限' }, id: 8, granblueId: '1599', slug: 'ca-cap', minValue: 1, maxValue: 2, fractional: true, suffix: '%' },
				{ name: { en: 'Stamina', ja: '渾身' }, id: 12, granblueId: '1600', slug: 'stamina', minValue: 1, maxValue: 3, fractional: true }
			]
		},
		{
			name: { en: 'Multiattack Rate', ja: '連撃率' },
			id: 4,
			granblueId: '1592',
			slug: 'ta',
			minValue: 1,
			maxValue: 4,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'C.A. DMG', ja: '奥義ダメ' }, id: 3, granblueId: '1591', slug: 'ca-dmg', minValue: 2, maxValue: 4, fractional: true, suffix: '%' },
				{ name: { en: 'Elemental ATK', ja: '全属性攻撃力' }, id: 13, granblueId: '1594', slug: 'ele-atk', minValue: 1, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Double Attack Rate', ja: 'DA確率' }, id: 5, granblueId: '1596', slug: 'da', minValue: 1, maxValue: 2, fractional: true, suffix: '%' },
				{ name: { en: 'Triple Attack Rate', ja: 'TA確率' }, id: 6, granblueId: '1597', slug: 'ta', minValue: 1, maxValue: 2, fractional: true, suffix: '%' }
			]
		}
	],
	// axType 2 - Extended AX skills
	[
		{
			name: { en: 'ATK', ja: '攻撃' },
			id: 0,
			granblueId: '1589',
			slug: 'atk',
			minValue: 1,
			maxValue: 3.5,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'C.A. DMG', ja: '奥義ダメ' }, id: 3, granblueId: '1591', slug: 'ca-dmg', minValue: 2, maxValue: 8.5, fractional: true, suffix: '%' },
				{ name: { en: 'Multiattack Rate', ja: '連撃確率' }, id: 4, granblueId: '1592', slug: 'ta', minValue: 1.5, maxValue: 4, fractional: true, suffix: '%' },
				{ name: { en: 'Normal ATK DMG Cap', ja: '通常ダメ上限' }, id: 14, granblueId: '1722', slug: 'na-dmg', minValue: 0.5, maxValue: 1.5, fractional: true, suffix: '%' },
				{ name: { en: 'Supplemental Skill DMG', ja: 'アビ与ダメ上昇' }, id: 15, granblueId: '1719', slug: 'skill-supp', minValue: 1, maxValue: 5, fractional: false }
			]
		},
		{
			name: { en: 'DEF', ja: '防御' },
			id: 1,
			granblueId: '1590',
			slug: 'def',
			minValue: 1,
			maxValue: 8,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'Elemental DMG Reduction', ja: '属性ダメ軽減' }, id: 17, granblueId: '1721', slug: 'ele-def', minValue: 1, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Debuff Resistance', ja: '弱体耐性' }, id: 9, granblueId: '1593', slug: 'debuff', minValue: 1, maxValue: 3, fractional: false, suffix: '%' },
				{ name: { en: 'Healing', ja: '回復性能' }, id: 10, granblueId: '1595', slug: 'healing', minValue: 2, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Enmity', ja: '背水' }, id: 11, granblueId: '1601', slug: 'enmity', minValue: 1, maxValue: 3, fractional: false }
			]
		},
		{
			name: { en: 'HP', ja: 'HP' },
			id: 2,
			granblueId: '1588',
			slug: 'hp',
			minValue: 1,
			maxValue: 11,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'Elemental DMG Reduction', ja: '属性ダメ軽減' }, id: 17, granblueId: '1721', slug: 'ele-def', minValue: 1, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Debuff Resistance', ja: '弱体耐性' }, id: 9, granblueId: '1593', slug: 'debuff', minValue: 1, maxValue: 3, fractional: false, suffix: '%' },
				{ name: { en: 'Healing', ja: '回復性能' }, id: 10, granblueId: '1595', slug: 'healing', minValue: 2, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Stamina', ja: '渾身' }, id: 12, granblueId: '1600', slug: 'stamina', minValue: 1, maxValue: 3, fractional: false }
			]
		},
		{
			name: { en: 'C.A. DMG', ja: '奥義ダメ' },
			id: 3,
			granblueId: '1591',
			slug: 'ca-dmg',
			minValue: 2,
			maxValue: 8.5,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'Multiattack Rate', ja: '連撃率' }, id: 4, granblueId: '1592', slug: 'ta', minValue: 1.5, maxValue: 4, fractional: true, suffix: '%' },
				{ name: { en: 'Supplemental Skill DMG', ja: 'アビ与ダメ上昇' }, id: 15, granblueId: '1719', slug: 'skill-supp', minValue: 1, maxValue: 5, fractional: false },
				{ name: { en: 'Supplemental C.A. DMG', ja: '奥義与ダメ上昇' }, id: 16, granblueId: '1720', slug: 'ca-supp', minValue: 1, maxValue: 5, fractional: false },
				{ name: { en: 'Stamina', ja: '渾身' }, id: 12, granblueId: '1600', slug: 'stamina', minValue: 1, maxValue: 3, fractional: false }
			]
		},
		{
			name: { en: 'Multiattack Rate', ja: '連撃率' },
			id: 4,
			granblueId: '1592',
			slug: 'ta',
			minValue: 1,
			maxValue: 4,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'Supplemental C.A. DMG', ja: '奥義与ダメ上昇' }, id: 16, granblueId: '1720', slug: 'ca-supp', minValue: 1, maxValue: 5, fractional: false },
				{ name: { en: 'Normal ATK DMG Cap', ja: '通常ダメ上限' }, id: 14, granblueId: '1722', slug: 'na-cap', minValue: 0.5, maxValue: 1.5, fractional: true, suffix: '%' },
				{ name: { en: 'Stamina', ja: '渾身' }, id: 12, granblueId: '1600', slug: 'stamina', minValue: 1, maxValue: 3, fractional: false },
				{ name: { en: 'Enmity', ja: '背水' }, id: 11, granblueId: '1601', slug: 'enmity', minValue: 1, maxValue: 3, fractional: false }
			]
		}
	],
	// axType 3 - Standard + EXP/Rupie skills
	[
		{
			name: { en: 'ATK', ja: '攻撃' },
			id: 0,
			granblueId: '1589',
			slug: 'atk',
			minValue: 1,
			maxValue: 3.5,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'C.A. DMG', ja: '奥義ダメ' }, id: 3, granblueId: '1591', slug: 'ca-dmg', minValue: 2, maxValue: 4, fractional: true, suffix: '%' },
				{ name: { en: 'Double Attack Rate', ja: 'DA確率' }, id: 5, granblueId: '1596', slug: 'da', minValue: 1, maxValue: 2, fractional: false, suffix: '%' },
				{ name: { en: 'Triple Attack Rate', ja: 'TA確率' }, id: 6, granblueId: '1597', slug: 'ta', minValue: 1, maxValue: 2, fractional: true, suffix: '%' },
				{ name: { en: 'Skill DMG Cap', ja: 'アビ上限' }, id: 7, granblueId: '1588', slug: 'skill-cap', minValue: 1, maxValue: 2, fractional: true, suffix: '%' }
			]
		},
		{
			name: { en: 'DEF', ja: '防御' },
			id: 1,
			granblueId: '1590',
			slug: 'def',
			minValue: 1,
			maxValue: 8,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'HP', ja: 'HP' }, id: 2, granblueId: '1588', slug: 'hp', minValue: 1, maxValue: 3, fractional: true, suffix: '%' },
				{ name: { en: 'Debuff Resistance', ja: '弱体耐性' }, id: 9, granblueId: '1593', slug: 'debuff', minValue: 1, maxValue: 3, fractional: false, suffix: '%' },
				{ name: { en: 'Healing', ja: '回復性能' }, id: 10, granblueId: '1595', slug: 'healing', minValue: 2, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Enmity', ja: '背水' }, id: 11, granblueId: '1601', slug: 'enmity', minValue: 1, maxValue: 3, fractional: false }
			]
		},
		{
			name: { en: 'HP', ja: 'HP' },
			id: 2,
			granblueId: '1588',
			slug: 'hp',
			minValue: 1,
			maxValue: 11,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'DEF', ja: '防御' }, id: 1, granblueId: '1590', slug: 'def', minValue: 1, maxValue: 3, fractional: true, suffix: '%' },
				{ name: { en: 'Debuff Resistance', ja: '弱体耐性' }, id: 9, granblueId: '1593', slug: 'debuff', minValue: 1, maxValue: 3, fractional: false, suffix: '%' },
				{ name: { en: 'Healing', ja: '回復性能' }, id: 10, granblueId: '1595', slug: 'healing', minValue: 2, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Stamina', ja: '渾身' }, id: 12, granblueId: '1600', slug: 'stamina', minValue: 1, maxValue: 3, fractional: false }
			]
		},
		{
			name: { en: 'C.A. DMG', ja: '奥義ダメ' },
			id: 3,
			granblueId: '1591',
			slug: 'ca-dmg',
			minValue: 2,
			maxValue: 8.5,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'ATK', ja: '攻撃' }, id: 0, granblueId: '1589', slug: 'atk', minValue: 1, maxValue: 1.5, fractional: true, suffix: '%' },
				{ name: { en: 'Elemental ATK', ja: '全属性攻撃力' }, id: 13, granblueId: '1594', slug: 'ele-atk', minValue: 1, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'C.A. DMG Cap', ja: '奥義上限' }, id: 8, granblueId: '1599', slug: 'ca-dmg', minValue: 1, maxValue: 2, fractional: true, suffix: '%' },
				{ name: { en: 'Stamina', ja: '渾身' }, id: 12, granblueId: '1600', slug: 'stamina', minValue: 1, maxValue: 3, fractional: false }
			]
		},
		{
			name: { en: 'Multiattack Rate', ja: '連撃率' },
			id: 4,
			granblueId: '1592',
			slug: 'ta',
			minValue: 1,
			maxValue: 4,
			suffix: '%',
			fractional: true,
			secondary: [
				{ name: { en: 'C.A. DMG', ja: '奥義ダメ' }, id: 3, granblueId: '1591', slug: 'ca-dmg', minValue: 2, maxValue: 4, fractional: true, suffix: '%' },
				{ name: { en: 'Elemental ATK', ja: '全属性攻撃力' }, id: 13, granblueId: '1594', slug: 'ele-atk', minValue: 1, maxValue: 5, fractional: true, suffix: '%' },
				{ name: { en: 'Double Attack Rate', ja: 'DA確率' }, id: 5, granblueId: '1596', slug: 'da', minValue: 1, maxValue: 2, fractional: true, suffix: '%' },
				{ name: { en: 'Triple Attack Rate', ja: 'TA確率' }, id: 6, granblueId: '1597', slug: 'ta', minValue: 1, maxValue: 2, fractional: true, suffix: '%' }
			]
		},
		// Skills without secondary options
		{
			name: { en: 'EXP Gain', ja: 'EXP UP' },
			id: 18,
			granblueId: '1837',
			slug: 'exp',
			minValue: 5,
			maxValue: 10,
			suffix: '%',
			fractional: false
		},
		{
			name: { en: 'Rupie Gain', ja: '獲得ルピ' },
			id: 19,
			granblueId: '1838',
			slug: 'rupie',
			minValue: 10,
			maxValue: 20,
			suffix: '%',
			fractional: false
		}
	]
]

/**
 * Get AX skills for a given axType
 * @param axType - The weapon's axType (1-indexed from API)
 * @returns Array of primary AX skills for this type
 */
export function getAxSkillsForType(axType: number): AxSkill[] {
	const index = axType - 1
	if (index < 0 || index >= ax.length) {
		return []
	}
	return ax[index] ?? []
}

/**
 * Find a primary skill by its modifier ID
 */
export function findPrimarySkill(axType: number, modifierId: number): AxSkill | undefined {
	const skills = getAxSkillsForType(axType)
	return skills.find((s) => s.id === modifierId)
}

/**
 * Find a secondary skill by its modifier ID within a primary skill
 */
export function findSecondarySkill(primarySkill: AxSkill, modifierId: number): AxSkill | undefined {
	return primarySkill.secondary?.find((s) => s.id === modifierId)
}

export default ax
