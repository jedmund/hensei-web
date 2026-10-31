import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient } from '@tanstack/svelte-query'
import { syncRaidElementsOptions } from '../userRaidElement.mutations'
import { createTestQueryClient } from './helpers'
import { userRaidElementAdapter } from '$lib/api/adapters/userRaidElement.adapter'
import { userRaidElementKeys } from '$lib/api/queries/userRaidElement.queries'

vi.mock('$lib/api/adapters/userRaidElement.adapter', () => ({
	userRaidElementAdapter: { sync: vi.fn() }
}))

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
	vi.clearAllMocks()
})

describe('syncRaidElementsOptions', () => {
	it('sends the raid and elements to the adapter', async () => {
		const opts = syncRaidElementsOptions(queryClient)

		await opts.mutationFn({ raidId: 'raid-1', elements: [2, 4] })

		expect(userRaidElementAdapter.sync).toHaveBeenCalledWith('raid-1', [2, 4])
	})

	it('invalidates every raid element query once settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		syncRaidElementsOptions(queryClient).onSettled()

		expect(spy).toHaveBeenCalledWith({ queryKey: userRaidElementKeys.all })
	})
})
