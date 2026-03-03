import { describe, it, expect } from 'vitest'
import { buildFilterQuery } from '../party.queries'
import type { ExploreFilterParams } from '$lib/api/adapters/party.adapter'

function emptyFilters(): ExploreFilterParams {
	return {} as ExploreFilterParams
}

describe('buildFilterQuery', () => {
	it('returns empty object for empty filters', () => {
		expect(buildFilterQuery(emptyFilters())).toEqual({})
	})

	it('includes element when non-empty array', () => {
		const result = buildFilterQuery({ ...emptyFilters(), element: [1, 2] })
		expect(result.element).toEqual([1, 2])
	})

	it('omits element when empty array', () => {
		const result = buildFilterQuery({ ...emptyFilters(), element: [] })
		expect(result.element).toBeUndefined()
	})

	it('includes raid when truthy', () => {
		const result = buildFilterQuery({ ...emptyFilters(), raid: 'raid-1' })
		expect(result.raid).toBe('raid-1')
	})

	it('includes recency when > 0', () => {
		const result = buildFilterQuery({ ...emptyFilters(), recency: 7 })
		expect(result.recency).toBe(7)
	})

	it('omits recency when 0', () => {
		const result = buildFilterQuery({ ...emptyFilters(), recency: 0 })
		expect(result.recency).toBeUndefined()
	})

	it('includes job when truthy', () => {
		const result = buildFilterQuery({ ...emptyFilters(), job: 'job-1' })
		expect(result.job).toBe('job-1')
	})

	it('includes fullAuto when not -1', () => {
		const result = buildFilterQuery({ ...emptyFilters(), fullAuto: 1 })
		expect(result.fullAuto).toBe(1)
	})

	it('omits fullAuto when -1', () => {
		const result = buildFilterQuery({ ...emptyFilters(), fullAuto: -1 })
		expect(result.fullAuto).toBeUndefined()
	})

	it('includes autoGuard when not -1', () => {
		const result = buildFilterQuery({ ...emptyFilters(), autoGuard: 0 })
		expect(result.autoGuard).toBe(0)
	})

	it('omits autoGuard when -1', () => {
		const result = buildFilterQuery({ ...emptyFilters(), autoGuard: -1 })
		expect(result.autoGuard).toBeUndefined()
	})

	it('includes chargeAttack when not -1', () => {
		const result = buildFilterQuery({ ...emptyFilters(), chargeAttack: 1 })
		expect(result.chargeAttack).toBe(1)
	})

	it('omits chargeAttack when -1', () => {
		const result = buildFilterQuery({ ...emptyFilters(), chargeAttack: -1 })
		expect(result.chargeAttack).toBeUndefined()
	})

	it('includes hasVideo when truthy', () => {
		const result = buildFilterQuery({ ...emptyFilters(), hasVideo: true })
		expect(result.hasVideo).toBe(true)
	})

	it('includes count filters when > 0', () => {
		const result = buildFilterQuery({
			...emptyFilters(),
			charactersCount: 5,
			weaponsCount: 10,
			summonsCount: 4
		})
		expect(result.charactersCount).toBe(5)
		expect(result.weaponsCount).toBe(10)
		expect(result.summonsCount).toBe(4)
	})

	it('omits count filters when 0', () => {
		const result = buildFilterQuery({
			...emptyFilters(),
			charactersCount: 0,
			weaponsCount: 0,
			summonsCount: 0
		})
		expect(result.charactersCount).toBeUndefined()
		expect(result.weaponsCount).toBeUndefined()
		expect(result.summonsCount).toBeUndefined()
	})

	it('includes quality filters when truthy', () => {
		const result = buildFilterQuery({
			...emptyFilters(),
			nameQuality: true,
			userQuality: true
		})
		expect(result.nameQuality).toBe(true)
		expect(result.userQuality).toBe(true)
	})

	it('passes through includes and excludes', () => {
		const result = buildFilterQuery({
			...emptyFilters(),
			includes: 'char-1',
			excludes: 'char-2'
		})
		expect(result.includes).toBe('char-1')
		expect(result.excludes).toBe('char-2')
	})

	it('passes through original and collectionFilter', () => {
		const result = buildFilterQuery({
			...emptyFilters(),
			original: true,
			collectionFilter: true
		})
		expect(result.original).toBe(true)
		expect(result.collectionFilter).toBe(true)
	})
})
