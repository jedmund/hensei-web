import { describe, it, expect } from 'vitest'
import { DURATION, FIRST_PHASE, nextPhase, phaseDuration, type Phase } from '../sequence'

describe('nextPhase', () => {
	it('runs opening, stones, one reveal per item, then done', () => {
		const phases: Phase[] = [FIRST_PHASE]
		while (phases.at(-1)?.kind !== 'done') phases.push(nextPhase(phases.at(-1) as Phase, 3))
		expect(phases).toEqual([
			{ kind: 'opening' },
			{ kind: 'stones' },
			{ kind: 'reveal', index: 0 },
			{ kind: 'reveal', index: 1 },
			{ kind: 'reveal', index: 2 },
			{ kind: 'done' }
		])
	})

	it('skips the reveal with no items and stays done', () => {
		expect(nextPhase({ kind: 'stones' }, 0)).toEqual({ kind: 'done' })
		expect(nextPhase({ kind: 'done' }, 10)).toEqual({ kind: 'done' })
	})
})

describe('phaseDuration', () => {
	it('holds each phase for its duration and stops when done', () => {
		expect(phaseDuration({ kind: 'opening' })).toBe(DURATION.opening)
		expect(phaseDuration({ kind: 'reveal', index: 4 })).toBe(DURATION.reveal)
		expect(phaseDuration({ kind: 'done' })).toBeNull()
	})
})
