import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient } from '@tanstack/svelte-query'
import { updateUnsealPriorityOptions } from '../solomonis-grid.mutations'
import { solomonisGridAdapter } from '$lib/api/adapters/solomonis-grid.adapter'
import { createTestQueryClient } from './helpers'
import { partyKeys } from '$lib/api/queries/party.queries'
import { transformResponse } from '$lib/api/schemas/transforms'
import type { Party } from '$lib/types/api/party'
import buildJson from '$lib/components/solomonis/grid/__fixtures__/party-build.json'

vi.mock('$lib/api/adapters/solomonis-grid.adapter', () => ({
	solomonisGridAdapter: { updateUnsealPriority: vi.fn() }
}))

let queryClient: QueryClient
const party = transformResponse<{ party: Party }>(buildJson).party
const key = partyKeys.detail(party.shortcode)
const vars = (items: { type: 'weapon' | 'summon'; id: string }[]) => ({
	partyId: party.id,
	partyShortcode: party.shortcode,
	items
})

beforeEach(() => {
	queryClient = createTestQueryClient()
	queryClient.setQueryData(key, party)
})

describe('updateUnsealPriorityOptions', () => {
	it('numbers each type from 1 in the cached grid and clears unlisted items', async () => {
		const weapon = party.weapons.find((w) => w.position === 5)!
		const summon = party.summons.find((s) => s.position === 0)!
		const opts = updateUnsealPriorityOptions(queryClient)

		await opts.onMutate(
			vars([
				{ type: 'summon', id: summon.id },
				{ type: 'weapon', id: weapon.id }
			])
		)

		const cached = queryClient.getQueryData<Party>(key)!
		expect(cached.summons.find((s) => s.id === summon.id)?.unsealPriority).toBe(1)
		expect(cached.weapons.find((w) => w.id === weapon.id)?.unsealPriority).toBe(1)
		expect(cached.weapons.find((w) => w.position === 4)?.unsealPriority).toBeNull()
	})

	it('rolls back on error', async () => {
		const opts = updateUnsealPriorityOptions(queryClient)
		const context = await opts.onMutate(vars([]))
		opts.onError(new Error('nope'), vars([]), context)
		expect(queryClient.getQueryData<Party>(key)).toEqual(party)
	})

	it('stores the returned party and invalidates it', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateUnsealPriorityOptions(queryClient)
		const returned = { ...party, name: 'Renamed' }

		opts.onSuccess(returned, vars([]))
		opts.onSettled(undefined, null, vars([]))

		expect(queryClient.getQueryData<Party>(key)!.name).toBe('Renamed')
		expect(spy.mock.calls[0]![0]!.queryKey).toEqual(key)
	})
})

describe('updateUnsealPriorityOptions, saves in a row', () => {
	it('is scoped to the party', () => {
		expect(updateUnsealPriorityOptions(queryClient, party.id).scope).toEqual({
			id: `solomonis-unseal-priority-${party.id}`
		})
	})

	it('leaves the cache to a queued save and refetches after the last', async () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		let resolveFirst!: (value: Party) => void
		vi.mocked(solomonisGridAdapter.updateUnsealPriority)
			.mockReturnValueOnce(new Promise<Party>((resolve) => (resolveFirst = resolve)))
			.mockResolvedValueOnce({ ...party, name: 'Second' })
		const run = () =>
			queryClient
				.getMutationCache()
				.build(queryClient, updateUnsealPriorityOptions(queryClient, party.id))
				.execute(vars([]))

		const first = run()
		const second = run()
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(solomonisGridAdapter.updateUnsealPriority).toHaveBeenCalledTimes(1)

		resolveFirst({ ...party, name: 'First' })
		await Promise.all([first, second])

		expect(queryClient.getQueryData<Party>(key)!.name).toBe('Second')
		expect(spy).toHaveBeenCalledTimes(1)
	})
})
