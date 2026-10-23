import { describe, expect, it } from 'vitest'
import { resolvedClassification } from './weaponSkillClassification'

describe('resolvedClassification', () => {
	it('prefers the resolved values over the derived ones', () => {
		expect(
			resolvedClassification({
				skillModifier: 'Enmity',
				skillSeries: 'normal',
				skillSize: 'medium',
				resolvedModifier: 'Might',
				resolvedSeries: 'omega',
				resolvedSize: 'big'
			})
		).toEqual({ modifier: 'Might', series: 'omega', size: 'big' })
	})

	it('keeps a null resolved modifier (pinned to "none")', () => {
		expect(
			resolvedClassification({
				skillModifier: 'Might',
				skillSeries: 'normal',
				skillSize: 'big',
				resolvedModifier: null,
				resolvedSeries: 'normal',
				resolvedSize: 'big'
			})
		).toEqual({ modifier: null, series: 'normal', size: 'big' })
	})

	it('falls back to the derived values when the API lacks resolved fields', () => {
		expect(
			resolvedClassification({ skillModifier: 'Might', skillSeries: 'normal', skillSize: 'big' })
		).toEqual({ modifier: 'Might', series: 'normal', size: 'big' })
	})

	it('returns nulls for an unclassified version', () => {
		expect(resolvedClassification({})).toEqual({ modifier: null, series: null, size: null })
	})
})
