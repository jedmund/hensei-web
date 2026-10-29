import { describe, expect, it } from 'vitest'
import {
	formatTemplate,
	needsTemplateConfirmation,
	parseRuleParams,
	toWeaponTier,
	replaceWeaponCondition,
	weaponConditions
} from '../rule-form'

describe('rule JSON templates', () => {
	it('preserves API parameter keys and values', () => {
		const params = { min_count: 2, series_ids: [], scale_by_count: true }
		expect(parseRuleParams(formatTemplate(params))).toEqual({ params, error: null })
	})
	it('only replaces untouched generated text without confirmation', () => {
		expect(needsTemplateConfirmation('{}', '{}')).toBe(false)
		expect(needsTemplateConfirmation('{"days":14}', '{}')).toBe(true)
		expect(needsTemplateConfirmation('{}', null)).toBe(true)
	})
	it.each(['null', '[]', 'true', '1', '"text"', '{'])(
		'rejects invalid parameter objects: %s',
		(text) => {
			const result = parseRuleParams(text)
			expect(result.params).toBeNull()
			expect(result.error).toBeTruthy()
		}
	)
})

describe('combined weapon conditions', () => {
	it('combines a series and transcendence filter into one tier rule without losing scoring settings', () => {
		const tier = toWeaponTier('weapon_series_match', {
			slugs: ['illustrious'],
			min_count: 2,
			scale_by_count: true,
			decay_floor: 0.2
		})!
		const combined = replaceWeaponCondition(tier, null, 'weapon_transcendence_at_least')
		expect(combined).toEqual({
			series_slugs: ['illustrious'],
			min_count: 2,
			scale_by_count: true,
			decay_floor: 0.2,
			min_transcendence_step: 1
		})
		expect(weaponConditions(combined)).toEqual([
			'weapon_series_match',
			'weapon_transcendence_at_least'
		])
	})
	it('converts standalone thresholds without keeping ignored parameter aliases', () => {
		expect(toWeaponTier('weapon_transcendence_at_least', { min_step: 5, min_count: 1 })).toEqual({
			min_transcendence_step: 5,
			min_count: 1
		})
		expect(toWeaponTier('weapon_awakening_at_least', { min_level: 5, awakening_id: 'id' })).toEqual(
			{ min_awakening_level: 5, awakening_id: 'id' }
		)
	})
	it('removes an entire condition while preserving other bounds and advanced settings', () => {
		const params = {
			series_slugs: ['illustrious'],
			min_transcendence_step: 3,
			max_transcendence_step: 4,
			gacha_filter: 'any'
		}
		expect(replaceWeaponCondition(params, 'weapon_transcendence_at_least', null)).toEqual({
			series_slugs: ['illustrious'],
			gacha_filter: 'any'
		})
		expect(params.max_transcendence_step).toBe(4)
	})
	it('detects conditions from edited JSON and rejects incompatible rule types', () => {
		expect(
			weaponConditions({ series_ids: ['id'], min_uncap_level: 5, min_awakening_level: 10 })
		).toEqual(['weapon_series_match', 'weapon_uncap_at_least', 'weapon_awakening_at_least'])
		expect(toWeaponTier('weapon_bullet_match', { bullet_ids: ['id'] })).toBeNull()
	})
})
