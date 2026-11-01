import { describe, expect, it } from 'vitest'
import { CURATOR_ROLE } from '$lib/auth/roles'
import { weaponsResource } from './weapons/resource'
import {
	DATABASE_SECTIONS,
	childrenOf,
	groupedSections,
	movedView,
	resourceSections,
	rootOf,
	sectionById,
	sectionForUrl,
	type DatabaseSection
} from './sections'

const at = (path: string) => sectionForUrl(new URL(path, 'http://localhost'))?.id ?? null

describe('sectionForUrl', () => {
	it('matches list pages', () => {
		expect(at('/database/weapons')).toBe('weapons')
		expect(at('/ja/database/summons')).toBe('summons')
	})

	it('selects sub-sections by ?view=', () => {
		expect(at('/database/weapons?view=series')).toBe('weapon-series')
		expect(at('/database/weapons?view=skills')).toBe('weapon-skills')
		expect(at('/database/raids?view=groups')).toBe('raid-groups')
	})

	it('maps record routes to their section', () => {
		expect(at('/database/weapons/1040001000/edit')).toBe('weapons')
		expect(at('/database/series/weapons/dark-opus')).toBe('weapon-series')
		expect(at('/database/weapon-skills/atk')).toBe('weapon-skills')
		expect(at('/database/job-accessories/123')).toBe('job-accessories')
		expect(at('/database/job-skills')).toBe('job-skills')
		expect(at('/database/jobs/abc/edit')).toBe('jobs')
		expect(at('/database/raid-groups/abc/edit')).toBe('raid-groups')
	})

	it('returns null on the overview', () => {
		expect(at('/database')).toBeNull()
	})
})

describe('rootOf', () => {
	it('resolves sub-sections to their parent', () => {
		expect(rootOf(sectionForUrl(new URL('http://x/database/weapons?view=awakenings')))?.id).toBe(
			'weapons'
		)
	})
})

describe('groupedSections', () => {
	it('hides admin-only and hidden sections from editors', () => {
		const ids = groupedSections(7).flatMap((g) => g.sections.map((s) => s.id))
		expect(ids).not.toContain('users')
		expect(ids).toContain('weapons')
	})

	it('shows curators only Events', () => {
		const ids = groupedSections(CURATOR_ROLE).flatMap((g) => g.sections.map((s) => s.id))
		expect(ids).toEqual(['events'])
	})
})

describe('resourceSections', () => {
	/** Labels called, so entries compare by what they show */
	const shown = (section: DatabaseSection) =>
		JSON.parse(
			JSON.stringify(section, (_, v) => (typeof v === 'function' ? `fn:${v()}` : v))
		) as unknown

	it("derives the weapons entries from the definition's section", () => {
		const derived = resourceSections(weaponsResource.name, weaponsResource.section!)
		const start = DATABASE_SECTIONS.findIndex((s) => s.id === 'weapons')
		expect(DATABASE_SECTIONS.slice(start, start + derived.length).map(shown)).toEqual(
			derived.map(shown)
		)
	})

	it('keeps the weapons entries as they were written by hand', () => {
		const ids = DATABASE_SECTIONS.map((s) => s.id)
		expect(ids.slice(ids.indexOf('roles'), ids.indexOf('summons') + 1)).toEqual([
			'roles',
			'weapons',
			'weapon-series',
			'awakenings',
			'weapon-skills',
			'summons'
		])
		expect(shown(sectionById('weapons')!)).toEqual({
			id: 'weapons',
			label: 'fn:Weapons',
			path: '/database/weapons',
			group: 'catalogue',
			entity: 'fn:weapon',
			actions: [
				[
					{ label: 'fn:Single weapon', href: '/database/weapons/new' },
					{ label: 'fn:Multiple weapons', href: '/database/weapons/import' }
				],
				[{ label: 'fn:Weapon series', href: '/database/series/weapons/new' }]
			]
		})
		expect(
			['weapon-series', 'awakenings', 'weapon-skills'].map((id) => shown(sectionById(id)!))
		).toEqual([
			{
				id: 'weapon-series',
				label: 'fn:Series',
				path: '/database/weapons',
				view: 'series',
				group: 'catalogue',
				parent: 'weapons',
				matches: ['/database/series/weapons']
			},
			{
				id: 'awakenings',
				label: 'fn:Awakenings',
				path: '/database/weapons',
				view: 'awakenings',
				group: 'catalogue',
				parent: 'weapons'
			},
			{
				id: 'weapon-skills',
				label: 'fn:Skills',
				path: '/database/weapons',
				view: 'skills',
				group: 'catalogue',
				parent: 'weapons',
				matches: ['/database/weapon-skills']
			}
		])
	})

	it('nests job skills and accessories under Jobs, at their own paths', () => {
		expect(childrenOf('jobs', 7).map((s) => [s.id, s.path, s.view])).toEqual([
			['job-skills', '/database/job-skills', undefined],
			['job-accessories', '/database/job-accessories', undefined],
			['bullets', '/database/bullets', undefined]
		])
		// They share the Jobs "New" menu
		expect(rootOf(sectionById('job-skills')!)?.id).toBe('jobs')
		expect(sectionById('jobs')!.actions![0]!.map((a) => a.href)).toEqual([
			'/database/jobs/new',
			'/database/job-skills/new',
			'/database/job-accessories/new'
		])
	})
})

describe('movedView', () => {
	it("finds the section a list's old ?view= tab became", () => {
		expect(movedView('jobs', 'skills')?.path).toBe('/database/job-skills')
		expect(movedView('jobs', 'accessories')?.path).toBe('/database/job-accessories')
		expect(movedView('jobs', null)).toBeUndefined()
		// Tabs that are still tabs stay put
		expect(movedView('weapons', 'series')).toBeUndefined()
	})
})
