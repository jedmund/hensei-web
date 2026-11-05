import { describe, it, expect, vi, afterEach } from 'vitest'
import type { QueryFunction } from '@tanstack/svelte-query'
import { jobQueries, type JobSearchPageResult } from '../job.queries'
import { jobAdapter } from '$lib/api/adapters/job.adapter'
import type { Job } from '$lib/types/api/entities'

/** Runs a search page's queryFn (the factory always provides one) */
function fetchPage(options: { queryFn?: unknown }, pageParam: number) {
	const fn = options.queryFn as QueryFunction<JobSearchPageResult, never[], number>
	return fn({ pageParam } as never)
}

const job = (id: string, row: string, proficiency: [number, number]) =>
	({ id, row, proficiency }) as unknown as Job

describe('jobQueries.search', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('sends the query, filters, locale and page to the adapter', async () => {
		const spy = vi
			.spyOn(jobAdapter, 'searchJobs')
			.mockResolvedValue({ results: [], page: 2, total: 0, totalPages: 3 })

		const page = await fetchPage(jobQueries.search('ber', { row: ['4'] }, 'ja'), 2)

		expect(spy).toHaveBeenCalledWith({
			query: 'ber',
			filters: { row: ['4'] },
			locale: 'ja',
			page: 2,
			per: 50
		})
		expect(page).toEqual({ results: [], page: 2, totalPages: 3 })
	})

	it('drops second-slot proficiency matches outside the row filter', async () => {
		vi.spyOn(jobAdapter, 'searchJobs').mockResolvedValue({
			results: [job('in-row', '4', [1, 2]), job('other-row', '5', [3, 1])],
			page: 1,
			total: 2,
			totalPages: 1
		})

		const page = await fetchPage(jobQueries.search('', { row: ['4'], proficiency: [1] }), 1)

		expect(page.results.map((j) => j.id)).toEqual(['in-row'])
	})

	it('asks for the next page until the last', () => {
		const { getNextPageParam } = jobQueries.search('ber')
		const next = (page: number, totalPages: number) =>
			getNextPageParam({ results: [], page, totalPages }, [], page, [])

		expect(next(1, 2)).toBe(2)
		expect(next(2, 2)).toBeUndefined()
	})
})
