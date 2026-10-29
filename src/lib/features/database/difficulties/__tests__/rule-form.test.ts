import { describe, expect, it } from 'vitest'
import { formatTemplate, needsTemplateConfirmation, parseRuleParams } from '../rule-form'

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
