import { describe, expect, it } from 'vitest'
import { groupedSections, rootOf, sectionForUrl } from './sections'

const at = (path: string) => sectionForUrl(new URL(path, 'http://localhost'))?.id ?? null

describe('sectionForUrl', () => {
	it('matches list pages', () => {
		expect(at('/database/weapons')).toBe('weapons')
		expect(at('/ja/database/summons')).toBe('summons')
	})

	it('selects sub-sections by ?view=', () => {
		expect(at('/database/weapons?view=series')).toBe('weapon-series')
		expect(at('/database/weapons?view=skills')).toBe('weapon-skills')
		expect(at('/database/jobs?view=skills')).toBe('job-skills')
		expect(at('/database/raids?view=groups')).toBe('raid-groups')
	})

	it('maps record routes to their section', () => {
		expect(at('/database/weapons/1040001000/edit')).toBe('weapons')
		expect(at('/database/series/weapons/dark-opus')).toBe('weapon-series')
		expect(at('/database/weapon-skills/atk')).toBe('weapon-skills')
		expect(at('/database/job-accessories/123')).toBe('job-accessories')
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
})
