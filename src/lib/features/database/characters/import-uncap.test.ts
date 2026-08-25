import { describe, expect, it } from 'vitest'
import { normalizeCharacterImportUncap } from './import-uncap'

describe('normalizeCharacterImportUncap', () => {
	it('uses the parser classification for a story ULB import', () => {
		expect(
			normalizeCharacterImportUncap({
				rarity: 2,
				special: true,
				flb: true,
				ulb: true,
				transcendence: false,
				ulbDate: '2019-08-22'
			})
		).toMatchObject({
			special: true,
			flb: true,
			ulb: true,
			transcendence: false,
			maxTranscendenceStage: 0,
			ulbDate: '2019-08-22'
		})
	})

	it('normalizes the old parser story shape during a rolling deploy', () => {
		expect(
			normalizeCharacterImportUncap({
				rarity: 2,
				flb: true,
				transcendence: true,
				transcendenceDate: '2026-08-01'
			})
		).toMatchObject({
			special: true,
			ulb: true,
			transcendence: false,
			ulbDate: '2026-08-01',
			transcendenceDate: undefined
		})
	})
})
