import { describe, expect, it } from 'vitest'
import { CURATOR_ROLE, EDITOR_ROLE } from '$lib/auth/roles'
import { HOME_LAUNCHED } from '$lib/utils/browseRoutes'
import { NAV_PATHS, mainNavLinks, moreNavLinks, type NavHrefs } from './navLinks'

const hrefs = { ...NAV_PATHS } as NavHrefs
const home = HOME_LAUNCHED ? ['home'] : []

describe('mainNavLinks', () => {
	it('ends with Collection when signed out', () => {
		expect(mainNavLinks(hrefs, false, '').map((l) => l.id)).toEqual([
			...home,
			'gallery',
			'crew',
			'collection'
		])
	})

	it('ends with the profile when signed in', () => {
		const links = mainNavLinks(hrefs, true, 'siero')
		expect(links.map((l) => l.id)).toEqual([...home, 'gallery', 'crew', 'profile'])
		const profile = links.at(-1)
		expect(profile?.href).toBe('/me')
		expect(profile?.label()).toBe('siero')
	})
})

describe('moreNavLinks', () => {
	it('hides Database below curator', () => {
		expect(moreNavLinks(hrefs, null).map((l) => l.id)).toEqual(['about', 'gacha', 'extension'])
		expect(moreNavLinks(hrefs, CURATOR_ROLE - 1).map((l) => l.id)).not.toContain('database')
	})

	it('shows Database to curators and up', () => {
		for (const role of [CURATOR_ROLE, EDITOR_ROLE]) {
			const links = moreNavLinks(hrefs, role)
			expect(links.map((l) => l.id)).toEqual(['about', 'gacha', 'extension', 'database'])
			expect(links.at(-1)?.href).toBe('/database')
		}
	})
})
