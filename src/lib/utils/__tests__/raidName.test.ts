import { describe, expect, it } from 'vitest'
import { raidShortName } from '../raidName'

describe('raidShortName', () => {
	const name = { en: 'Exo Diablo Lv200', ja: 'エクス・ディアボロス Lv200' }

	it('prefers the short name, for places that already show the group', () => {
		expect(raidShortName({ name, shortName: { en: 'Lv200', ja: 'Lv200' } })).toBe('Lv200')
	})

	it('uses the name when there is no short name', () => {
		expect(raidShortName({ name, shortName: null })).toBe('Exo Diablo Lv200')
		expect(raidShortName({ name })).toBe('Exo Diablo Lv200')
		expect(raidShortName({ name, shortName: { en: '', ja: '' } })).toBe('Exo Diablo Lv200')
	})
})
