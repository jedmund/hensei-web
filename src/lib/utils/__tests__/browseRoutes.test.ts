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
		expect(newTeamPath({ add: { type: 'weapon', id: 'w-1' } })).toBe('/teams/new?add=weapon%3Aw-1')
		expect(newTeamPath({ raidSlug: 'nm200' })).toBe('/teams/new?raid=nm200')
	})

	it('reads the start back, ignoring anything malformed', () => {
		const start = parseNewTeamStart(
			new URL(`http://x${newTeamPath({ add: { type: 'summon', id: 's-1' }, raidSlug: 'nm200' })}`)
				.searchParams
		)
		expect(start).toEqual({ add: { type: 'summon', id: 's-1' }, raidSlug: 'nm200' })
		expect(parseNewTeamStart(new URLSearchParams('add=job:j-1'))).toEqual({})
		expect(parseNewTeamStart(new URLSearchParams('add=weapon:'))).toEqual({})
	})
})
