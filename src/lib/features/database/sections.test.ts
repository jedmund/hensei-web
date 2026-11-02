import { describe, expect, it } from 'vitest'
import { CURATOR_ROLE, EDITOR_ROLE } from '$lib/auth/roles'
import { awakeningsResource } from './awakenings/resource'
import { weaponSeriesResource } from './weapon-series/resource'
import { weaponsResource } from './weapons/resource'
import {
	DATABASE_SECTIONS,
	childrenOf,
	groupedSections,
	resourceMinRole,
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
		expect(at('/database/raid-groups')).toBe('raid-groups')
	})

	it('selects sub-sections by ?view=', () => {
		expect(at('/database/weapons?view=skills')).toBe('weapon-skills')
	})

	it('maps record routes to their section', () => {
		expect(at('/database/weapons/1040001000/edit')).toBe('weapons')
		expect(at('/database/weapon-series/dark-opus')).toBe('weapon-series')
		expect(at('/database/awakenings/weapon-atk/edit')).toBe('awakenings')
		expect(at('/database/character-series/new')).toBe('character-series')
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
		expect(rootOf(sectionForUrl(new URL('http://x/database/awakenings')))?.id).toBe('weapons')
		expect(rootOf(sectionForUrl(new URL('http://x/database/character-series')))?.id).toBe(
			'characters'
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

	it("derives the weapons entries from the definitions' sections", () => {
		const derived = [
			...resourceSections(weaponsResource.name, weaponsResource.section!),
			...resourceSections(weaponSeriesResource.name, weaponSeriesResource.section!),
			...resourceSections(awakeningsResource.name, awakeningsResource.section!)
		]
		const start = DATABASE_SECTIONS.findIndex((s) => s.id === 'weapons')
		expect(DATABASE_SECTIONS.slice(start, start + derived.length).map(shown)).toEqual(
			derived.map(shown)
		)
	})

	it('nests series and awakenings under Weapons, linking to their own lists', () => {
		const ids = DATABASE_SECTIONS.map((s) => s.id)
		expect(ids.slice(0, 4)).toEqual([
			'characters',
			'character-series',
			'artifact-skills',
			'character-roles'
		])
		expect(sectionById('character-roles')).toMatchObject({
			path: '/database/character-roles',
			parent: 'characters'
		})
		expect(sectionById('character-series')?.path).toBe('/database/character-series')
		expect(ids.slice(ids.indexOf('character-roles'), ids.indexOf('summons') + 1)).toEqual([
			'character-roles',
			'weapons',
			'weapon-skills',
			'weapon-series',
			'awakenings',
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
				[
					{ label: 'fn:Weapon series', href: '/database/weapon-series/new' },
					{ label: 'fn:Awakening', href: '/database/awakenings/new' }
				]
			]
		})
		expect(
			['weapon-series', 'awakenings', 'weapon-skills'].map((id) => shown(sectionById(id)!))
		).toEqual([
			{
				id: 'weapon-series',
				path: '/database/weapon-series',
				label: 'fn:Series',
				group: 'catalogue',
				parent: 'weapons'
			},
			{
				id: 'awakenings',
				path: '/database/awakenings',
				label: 'fn:Awakenings',
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

	it('nests job skills, accessories and bullets under Jobs, at their own paths', () => {
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
			'/database/job-accessories/new',
			'/database/bullets/new'
		])
		expect(rootOf(sectionById('bullets')!)?.id).toBe('jobs')
	})

	it('keeps the summons entry as it was written by hand', () => {
		expect(shown(sectionById('summons')!)).toEqual({
			id: 'summons',
			label: 'fn:Summons',
			path: '/database/summons',
			group: 'catalogue',
			entity: 'fn:summon',
			actions: [
				[
					{ label: 'fn:Single summon', href: '/database/summons/new' },
					{ label: 'fn:Multiple summons', href: '/database/summons/import' }
				]
			]
		})
	})
})

describe('battles sections', () => {
	const shown = (section: DatabaseSection) =>
		JSON.parse(
			JSON.stringify(section, (_, v) => (typeof v === 'function' ? `fn:${v()}` : v))
		) as unknown

	it('nests raid groups under raids at their own path, sharing its New menu', () => {
		expect(shown(sectionById('raid-groups')!)).toEqual({
			id: 'raid-groups',
			label: 'fn:Groups',
			path: '/database/raid-groups',
			group: 'battles',
			parent: 'raids'
		})
		expect(rootOf(sectionById('raid-groups')!)?.id).toBe('raids')
		expect(shown(sectionById('raids')!)).toMatchObject({
			path: '/database/raids',
			actions: [
				[
					{ label: 'fn:New raid', href: '/database/raids/new' },
					{ label: 'fn:New raid group', href: '/database/raid-groups/new' }
				]
			]
		})
	})

	it('opens Events to curators and every other resource to editors only', () => {
		expect(resourceMinRole('events')).toBe(CURATOR_ROLE)
		expect(resourceMinRole('raids')).toBe(EDITOR_ROLE)
		expect(resourceMinRole('raid-groups')).toBe(EDITOR_ROLE)
		expect(resourceMinRole('weapons')).toBe(EDITOR_ROLE)
		expect(resourceMinRole('widgets')).toBe(EDITOR_ROLE)
	})
})
