import { describe, it, expect } from 'vitest'
import { battleSettings, formatClearTime, performanceMetrics } from '../partySettings'

describe('battleSettings', () => {
	it('lists every setting, with charge attack on unless turned off', () => {
		expect(battleSettings({}).map((s) => [s.key, s.on])).toEqual([
			['chargeAttack', true],
			['fullAuto', false],
			['autoSummon', false],
			['autoGuard', false]
		])
	})

	it('labels each with on or off', () => {
		const [chargeAttack, fullAuto] = battleSettings({ chargeAttack: false, fullAuto: true })
		expect(chargeAttack!.label).toBe('Charge Attack Off')
		expect(fullAuto!.label).toBe('Full Auto On')
	})
})

describe('formatClearTime', () => {
	it('shows minutes and padded seconds', () => {
		expect(formatClearTime(125)).toBe('2:05')
		expect(formatClearTime(59)).toBe('0:59')
	})

	it('is null for no time', () => {
		expect(formatClearTime(null)).toBeNull()
		expect(formatClearTime(0)).toBeNull()
	})
})

describe('performanceMetrics', () => {
	it('keeps recorded figures in order, zero counts included', () => {
		expect(
			performanceMetrics({ clearTime: 90, buttonCount: 3, chainCount: 0, summonCount: null }).map(
				(metric) => metric.label
			)
		).toEqual(['1:30', '3B', '0C'])
	})
})
