import { describe, expect, it } from 'vitest'
import { recentImage } from './recentImage'

describe('recentImage', () => {
	it('finds square art for records that route by game id', () => {
		expect(recentImage('/database/weapons/1040001000')).toMatch(/weapons\/square\/1040001000\.jpg$/)
		expect(recentImage('/database/summons/2040001000')).toMatch(/summons\/square\/2040001000\.jpg$/)
		expect(recentImage('/database/characters/3040001000')).toMatch(
			/characters\/square\/3040001000_01\.jpg$/
		)
		expect(recentImage('/database/bullets/3000001')).toMatch(/bullets\/square\/3000001\.jpg$/)
	})

	it("reads Japanese paths and style shifts' base character", () => {
		expect(recentImage('/ja/database/weapons/1040001000')).toMatch(/1040001000\.jpg$/)
		expect(recentImage('/database/characters/3040001000/style')).toMatch(/3040001000_01\.jpg$/)
	})

	it('has no image for other records or non-record pages', () => {
		expect(recentImage('/database/raids/lucilius')).toBeNull()
		expect(recentImage('/database/events/abc')).toBeNull()
		expect(recentImage('/database/weapons')).toBeNull()
	})
})
