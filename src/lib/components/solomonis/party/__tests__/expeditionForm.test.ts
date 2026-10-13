import { describe, it, expect } from 'vitest'
import { buildExpeditionInput, type ExpeditionFormValues } from '../expeditionForm'

const SAVED: ExpeditionFormValues = {
	routeEvokerId: 'nier',
	pledgeLevel: 0,
	outcome: null
}

describe('buildExpeditionInput', () => {
	it('sends nothing when nothing changed', () => {
		expect(buildExpeditionInput(SAVED, SAVED)).toEqual({})
		const cleared = { ...SAVED, outcome: 'cleared' as const }
		expect(buildExpeditionInput(cleared, cleared)).toEqual({})
	})

	it('sends route and pledge for a party without an expedition', () => {
		const initial = { ...SAVED, routeEvokerId: null }
		expect(buildExpeditionInput({ ...SAVED, pledgeLevel: 3 }, initial)).toEqual({
			routeEvokerId: 'nier',
			pledgeLevel: 3
		})
	})

	it('sends only changed fields', () => {
		expect(
			buildExpeditionInput({ ...SAVED, routeEvokerId: 'fraux', outcome: 'miasma_2' }, SAVED)
		).toEqual({ routeEvokerId: 'fraux', outcome: 'miasma_2' })
	})

	it('sends a null outcome when it is unset', () => {
		expect(buildExpeditionInput(SAVED, { ...SAVED, outcome: 'miasma_1' })).toEqual({
			outcome: null
		})
	})
})
