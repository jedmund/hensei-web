import { describe, it, expect } from 'vitest'
import { galleryPath, isHomePath, newTeamPath, parseNewTeamStart } from '../browseRoutes'

describe('browseRoutes', () => {
	it('builds gallery paths', () => {
		expect(galleryPath()).toBe('/gallery')
		expect(galleryPath('?raid=nm200&label=fast')).toBe('/gallery?raid=nm200&label=fast')
	})

	it('selects Home only on the home page', () => {
		expect(isHomePath('/', '/')).toBe(true)
		expect(isHomePath('/ja', '/ja/')).toBe(true)
		expect(isHomePath('/ja/', '/ja')).toBe(true)
	})

	it('does not select Home elsewhere', () => {
		expect(isHomePath('/gallery', '/')).toBe(false)
		expect(isHomePath('/ja/gallery', '/ja/')).toBe(false)
		expect(isHomePath('/crew', '/')).toBe(false)
	})

	it('builds new team paths that start with an item or a raid', () => {
		expect(newTeamPath()).toBe('/teams/new')
		expect(newTeamPath({ add: { type: 'weapon', granblueId: '1040001000' } })).toBe(
			'/teams/new?add=weapon%3A1040001000'
		)
		expect(newTeamPath({ add: { type: 'character', granblueId: '3040683000', style: true } })).toBe(
			'/teams/new?add=character%3A3040683000%3Astyle'
		)
		expect(newTeamPath({ raidSlug: 'nm200' })).toBe('/teams/new?raid=nm200')
	})

	it('reads the start back, ignoring anything malformed', () => {
		const start = parseNewTeamStart(
			new URL(
				`http://x${newTeamPath({ add: { type: 'summon', granblueId: '2040001000' }, raidSlug: 'nm200' })}`
			).searchParams
		)
		expect(start).toEqual({ add: { type: 'summon', granblueId: '2040001000' }, raidSlug: 'nm200' })
		expect(parseNewTeamStart(new URLSearchParams('add=character:3040683000:style'))).toEqual({
			add: { type: 'character', granblueId: '3040683000', style: true }
		})
		expect(parseNewTeamStart(new URLSearchParams('add=job:j-1'))).toEqual({})
		expect(parseNewTeamStart(new URLSearchParams('add=weapon:'))).toEqual({})
	})
})
