import { describe, it, expect } from 'vitest'
import { formatAmount, formatDecimal, formatProbability, formatRate } from '../gachaFormat'

describe('gacha number formats', () => {
	it('groups amounts beyond a double and drops trailing zeros', () => {
		expect(formatAmount('12345678901234567890', 'en')).toBe('12,345,678,901,234,567,890')
		expect(formatAmount('1500.50', 'en')).toBe('1,500.5')
		expect(formatAmount('300.00', 'en')).toBe('300')
		expect(formatAmount('', 'en')).toBe('0')
	})

	it('shows probabilities to four significant digits', () => {
		expect(formatProbability(0.123456, 'en')).toBe('12.35%')
		expect(formatProbability(1, 'en')).toBe('100%')
	})

	it('shows rates to two decimal places', () => {
		expect(formatRate('9', '300', 'en')).toBe('3.00%')
		expect(formatRate('1', '3', 'en')).toBe('33.33%')
	})

	it('shows expected values to at most two decimal places', () => {
		expect(formatDecimal(2.456, 'en')).toBe('2.46')
		expect(formatDecimal(3, 'en')).toBe('3')
	})
})
