import { describe, expect, it } from 'vitest'
import { CURATOR_ROLE, EDITOR_ROLE } from '$lib/auth/roles'
import { HOME_LAUNCHED } from '$lib/utils/browseRoutes'
import {
	NAV_PATHS,
	isDatabasePath,
	mainNavLinks,
	moreNavLinks,
	sheetLinks,
	tabBarLinks,
	type NavHrefs
} from './navLinks'

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

describe('tabBarLinks', () => {
	const ids = (isAuth: boolean, homeLaunched: boolean) =>
		tabBarLinks(hrefs, isAuth, homeLaunched).map((l) => l.id)

	it('puts New team between Gallery and the profile', () => {
		expect(ids(true, true)).toEqual(['home', 'gallery', 'newTeam', 'profile'])
		expect(ids(true, false)).toEqual(['gallery', 'newTeam', 'profile'])
	})

	it('has no profile tab when signed out', () => {
		expect(ids(false, true)).toEqual(['home', 'gallery', 'newTeam'])
		expect(ids(false, false)).toEqual(['gallery', 'newTeam'])
	})

	it('links New team to the new team page', () => {
		const link = tabBarLinks(hrefs, false, false).find((l) => l.id === 'newTeam')
		expect(link?.href).toBe('/teams/new')
	})
})

describe('sheetLinks', () => {
	it("links a signed-in user's collection under their profile", () => {
		const links = sheetLinks(hrefs, true, 'siero', null)
		expect(links.map((l) => l.id)).toEqual(['crew', 'collection', 'about', 'gacha', 'extension'])
		expect(links.find((l) => l.id === 'collection')?.href).toBe('/siero/collection')
	})

	it('links the collection intro when signed out, without Database', () => {
		const links = sheetLinks(hrefs, false, '', CURATOR_ROLE)
		expect(links.find((l) => l.id === 'collection')?.href).toBe('/collection')
		expect(links.map((l) => l.id)).not.toContain('database')
	})

	it('adds Database for signed-in curators', () => {
		expect(sheetLinks(hrefs, true, 'siero', CURATOR_ROLE).map((l) => l.id)).toContain('database')
	})
})

describe('isDatabasePath', () => {
	it('matches the database and its sub-pages only', () => {
		expect(isDatabasePath('/database', hrefs)).toBe(true)
		expect(isDatabasePath('/database/weapons', hrefs)).toBe(true)
		expect(isDatabasePath('/databases', hrefs)).toBe(false)
		expect(isDatabasePath('/gallery', hrefs)).toBe(false)
	})
})
