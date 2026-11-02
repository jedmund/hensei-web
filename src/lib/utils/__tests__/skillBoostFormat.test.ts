import { describe, expect, it } from 'vitest'
import { formatBoostNumber, formatBoostValue } from '../skillBoostFormat'

describe('formatBoostValue', () => {
	it('shows percents at one decimal', () => {
		expect(formatBoostValue(756.8123)).toBe('756.8%')
		expect(formatBoostValue(22.85)).toBe('22.9%')
	})

	it('trims a trailing zero', () => {
		expect(formatBoostValue(20.0004)).toBe('20%')
	})

	it('rounds negatives away from zero', () => {
		expect(formatBoostValue(-2.25)).toBe('-2.3%')
		expect(formatBoostValue(-0.04)).toBe('0%')
	})

	it('shows flat counts with separators', () => {
		expect(formatBoostValue(100000, true)).toBe('+100,000')
		expect(formatBoostValue(-1500, true)).toBe('-1,500')
	})
})

describe('formatBoostNumber', () => {
	it('rounds multipliers to one decimal', () => {
		expect(formatBoostNumber(5.6123)).toBe('5.6')
		expect(formatBoostNumber(3)).toBe('3')
	})
})
