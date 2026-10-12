import { describe, it, expect } from 'vitest'
import { buildExpeditionInput, type ExpeditionFormValues } from '../expeditionForm'

const BUILD: ExpeditionFormValues = {
	kind: 'build',
	routeEvokerId: 'nier',
	pledgeLevel: 0,
	outcome: null,
	bossesDefeated: null,
	midboss: null,
	expeditionLevel: null,
	endedAt: null
}

const RUN: ExpeditionFormValues = {
	...BUILD,
	kind: 'run',
	outcome: 'cleared',
	bossesDefeated: 2,
	expeditionLevel: 42,
	endedAt: '2026-10-11T16:38:00+09:00'
}

describe('buildExpeditionInput', () => {
	it('sends nothing when nothing changed', () => {
		expect(buildExpeditionInput(BUILD, BUILD)).toEqual({})
		expect(buildExpeditionInput(RUN, RUN)).toEqual({})
	})

	it('sends kind, route and pledge for a party without an expedition', () => {
		const initial = { ...BUILD, routeEvokerId: null }
		expect(buildExpeditionInput({ ...BUILD, pledgeLevel: 3 }, initial)).toEqual({
			kind: 'build',
			routeEvokerId: 'nier',
			pledgeLevel: 3
		})
	})

	it('sends only changed fields', () => {
		expect(
			buildExpeditionInput({ ...RUN, routeEvokerId: 'fraux', midboss: 'infernobringer' }, RUN)
		).toEqual({ routeEvokerId: 'fraux', midboss: 'infernobringer' })
	})

	it('clears run fields when a run becomes a build', () => {
		expect(buildExpeditionInput({ ...RUN, kind: 'build' }, RUN)).toEqual({
			kind: 'build',
			outcome: null,
			bossesDefeated: null,
			expeditionLevel: null,
			endedAt: null
		})
	})

	it('sends run fields when a build becomes a run', () => {
		expect(buildExpeditionInput({ ...BUILD, kind: 'run', outcome: 'failed' }, BUILD)).toEqual({
			kind: 'run',
			outcome: 'failed'
		})
	})
})
