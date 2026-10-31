import { describe, it, expect, vi } from 'vitest'
import { ResultSet } from '$lib/features/database/resultSet.svelte'
import { syncResultSet, toResultItems } from './resultSync'

interface Row {
	granblueId: string
	name: string | null
}

const accessors = {
	rowId: (r: Row) => r.granblueId,
	rowHref: (r: Row) => `/database/weapons/${r.granblueId}`,
	rowTitle: (r: Row) => r.name
}

const page1: Row[] = [
	{ granblueId: '1', name: 'One' },
	{ granblueId: '2', name: null }
]
const page2: Row[] = [{ granblueId: '3', name: 'Three' }]

describe('toResultItems', () => {
	it('maps rows to items in display order and drops empty titles', () => {
		expect(toResultItems(page1, accessors)).toEqual([
			{ id: '1', href: '/database/weapons/1', title: 'One' },
			{ id: '2', href: '/database/weapons/2', title: undefined }
		])
	})
})

describe('syncResultSet', () => {
	it('copies items, page and total pages, and has no loader for static lists', () => {
		const resultSet = new ResultSet()
		syncResultSet(resultSet, { rows: page1, page: 1, totalPages: 1, loadPage: null }, accessors)
		expect(resultSet.items.map((i) => i.id)).toEqual(['1', '2'])
		expect(resultSet.page).toBe(1)
		expect(resultSet.totalPages).toBe(1)
		expect(resultSet.loadPage).toBeNull()
	})

	it('lets the panel step across a page boundary through loadPage', async () => {
		const resultSet = new ResultSet()
		const loadPage = vi.fn(async (page: number) => (page === 2 ? page2 : page1))
		syncResultSet(resultSet, { rows: page1, page: 1, totalPages: 2, loadPage }, accessors)

		const next = await resultSet.next('2')
		expect(loadPage).toHaveBeenCalledWith(2)
		expect(next).toEqual({ id: '3', href: '/database/weapons/3', title: 'Three' })
		expect(resultSet.page).toBe(2)

		const prev = await resultSet.prev('3')
		expect(loadPage).toHaveBeenCalledWith(1)
		expect(prev?.id).toBe('2')
		expect(resultSet.page).toBe(1)
	})

	it('stops at the last page', async () => {
		const resultSet = new ResultSet()
		const loadPage = vi.fn(async () => page2)
		syncResultSet(resultSet, { rows: page2, page: 2, totalPages: 2, loadPage }, accessors)
		expect(await resultSet.next('3')).toBeNull()
		expect(loadPage).not.toHaveBeenCalled()
	})
})
