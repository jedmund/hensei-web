import { describe, it, expect, afterEach, vi } from 'vitest'
import en from '../../../../../messages/en.json'
import ja from '../../../../../messages/ja.json'

const { getLocale } = vi.hoisted(() => ({ getLocale: vi.fn(() => 'en') }))
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/paraglide/runtime')>()),
	getLocale
}))

import {
	bonusIcon,
	bonusLabel,
	bonusValueLabel,
	parseElementStat,
	statLabel,
	wonderSummary,
	wonderText
} from '../labels'

const ELEMENTS = ['fire', 'water', 'earth', 'wind', 'light', 'dark']

/** Every stat key in the GBF-282 contract. */
const CONTRACT_STATS = [
	...ELEMENTS.flatMap((el) => [`${el}_resistance`, `${el}_atk`, `dmg_amplify_vs_${el}`]),
	'def',
	'double_attack_rate',
	'triple_attack_rate',
	'healing_cap',
	'debuff_resistance',
	'debuff_success_rate',
	'skill_dmg',
	'ca_dmg',
	'na_dmg_cap',
	'skill_dmg_cap',
	'ca_dmg_cap',
	'dmg_amplify'
]

/** The message each stat key reads from. */
function messageKey(stat: string): string {
	const elemental = parseElementStat(stat)
	return `wonders_stat_${elemental ? elemental.family : stat}`
}

afterEach(() => {
	getLocale.mockReturnValue('en')
})

describe('stat copy', () => {
	it('has an EN and a JA message for every contract stat', () => {
		for (const stat of CONTRACT_STATS) {
			const key = messageKey(stat)
			expect(en, key).toHaveProperty(key)
			expect(ja, key).toHaveProperty(key)
		}
	})

	it('labels stats in EN', () => {
		expect(statLabel('fire_resistance')).toBe('Fire Resistance')
		expect(statLabel('light_atk')).toBe('Light ATK')
		expect(statLabel('dmg_amplify_vs_wind')).toBe('DMG Amplify vs. Wind')
		expect(statLabel('na_dmg_cap')).toBe('N.A. DMG Cap')
		expect(statLabel('dmg_amplify')).toBe('DMG Amplify')
	})

	it('labels stats in JA with the game terms', () => {
		getLocale.mockReturnValue('ja')
		expect(statLabel('wind_resistance')).toBe('風属性ダメージ軽減')
		expect(statLabel('fire_atk')).toBe('火属性攻撃力')
		expect(statLabel('dmg_amplify_vs_wind')).toBe('対風属性与ダメージ')
		expect(statLabel('ca_dmg_cap')).toBe('奥義ダメージ上限')
		expect(statLabel('dmg_amplify')).toBe('与ダメージ')
	})

	it('shows unknown stats as they are', () => {
		expect(statLabel('mystery_stat')).toBe('mystery_stat')
		expect(parseElementStat('null_resistance')).toBeNull()
	})
})

describe('bonus icons', () => {
	it("uses the game's icons from the Seal and Yupei captures", () => {
		// Seal of the Underworld Emperor and Zhurong's Yupei, in capture order
		expect(
			[
				'fire_resistance',
				'def',
				'double_attack_rate',
				'healing_cap',
				'debuff_resistance',
				'triple_attack_rate',
				'debuff_success_rate'
			].map(bonusIcon)
		).toEqual(['bonus_8', 'bonus_2', 'bonus_20', 'bonus_13', 'bonus_3', 'bonus_21', 'bonus_4'])
		expect(
			[
				'fire_atk',
				'def',
				'skill_dmg',
				'ca_dmg',
				'dmg_amplify_vs_wind',
				'na_dmg_cap',
				'skill_dmg_cap',
				'ca_dmg_cap'
			].map(bonusIcon)
		).toEqual([
			'bonus_8',
			'bonus_2',
			'bonus_18',
			'bonus_19',
			'bonus_1',
			'bonus_1',
			'bonus_18',
			'bonus_19'
		])
		expect(bonusIcon('dmg_amplify')).toBe('bonus_1')
	})

	it('gives each element its own icon', () => {
		expect(ELEMENTS.map((el) => bonusIcon(`${el}_resistance`))).toEqual([
			'bonus_8',
			'bonus_9',
			'bonus_10',
			'bonus_7',
			'bonus_11',
			'bonus_12'
		])
		expect(bonusIcon('unknown_stat')).toBeNull()
	})
})

describe('bonus values', () => {
	it('formats like the game in each language', () => {
		expect(bonusValueLabel(12)).toBe('+12%')
		expect(bonusValueLabel(0.5)).toBe('+0.5%')
		expect(bonusLabel({ stat: 'def', value: 12 })).toEqual({ label: 'DEF', value: '+12%' })

		getLocale.mockReturnValue('ja')
		expect(bonusValueLabel(10)).toBe('＋10％')
	})
})

describe('wonderText', () => {
	it('falls back to the other language', () => {
		expect(wonderText({ en: 'Ring of Death', ja: null })).toBe('Ring of Death')
		getLocale.mockReturnValue('ja')
		expect(wonderText({ en: 'Ring of Death', ja: 'リング・オブ・デス' })).toBe('リング・オブ・デス')
		expect(wonderText({ en: "Thief's Map", ja: null })).toBe("Thief's Map")
		expect(wonderText(null)).toBe('—')
	})
})

describe('wonderSummary', () => {
	it('shows the level, the bonus, or nothing', () => {
		expect(wonderSummary({ kind: 'leveled' }, { level: 20, bonuses: [] })).toBe('Lvl 20')
		expect(
			wonderSummary(
				{ kind: 'scaling' },
				{ level: null, bonuses: [{ stat: 'dmg_amplify', value: 4 }] }
			)
		).toBe('+4%')
		expect(wonderSummary({ kind: 'fixed' }, { level: null, bonuses: [] })).toBeNull()
	})
})
