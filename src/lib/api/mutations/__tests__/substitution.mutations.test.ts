/**
 * Substitution mutation tests
 *
 * Verifies that create/update/delete substitution mutations forward edit-key
 * headers and invalidate the relevant party cache entry on success.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	createSubstitutionOptions,
	updateSubstitutionOptions,
	deleteSubstitutionOptions,
	reorderSubstitutionsOptions
} from '../substitution.mutations'
import { createTestQueryClient } from './helpers'
import { partyKeys } from '$lib/api/queries/party.queries'
import { MutationObserver } from '@tanstack/svelte-query'
import type { QueryClient } from '@tanstack/svelte-query'

vi.mock('$lib/api/adapters/substitution.adapter', () => ({
	substitutionAdapter: {
		createSubstitution: vi.fn(),
		updateSubstitution: vi.fn(),
		deleteSubstitution: vi.fn(),
		reorderSubstitutions: vi.fn()
	}
}))

vi.mock('$lib/utils/editKeys', () => ({
	getEditKey: (shortcode: string) => (shortcode === 'with-key' ? 'EDIT-KEY' : null)
}))

const { substitutionAdapter } = await import('$lib/api/adapters/substitution.adapter')

let queryClient: QueryClient

function runMutation<TVars, TResult>(
	options: {
		mutationFn: (vars: TVars) => Promise<TResult>
		onSuccess?: (data: TResult, vars: TVars) => void
	},
	vars: TVars
) {
	const observer = new MutationObserver(queryClient, options)
	return observer.mutate(vars)
}

beforeEach(() => {
	queryClient = createTestQueryClient()
	vi.clearAllMocks()
})

describe('createSubstitutionOptions', () => {
	it('invalidates the party cache and forwards the edit-key header', async () => {
		;(substitutionAdapter.createSubstitution as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: 's1'
		})
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(createSubstitutionOptions(queryClient), {
			partyId: 'p1',
			partyShortcode: 'with-key',
			gridType: 'GridWeapon',
			gridId: 'g1',
			itemId: 'i1'
		})

		expect(substitutionAdapter.createSubstitution).toHaveBeenCalledWith(
			expect.objectContaining({ partyId: 'p1', gridType: 'GridWeapon' }),
			{ 'X-Edit-Key': 'EDIT-KEY' }
		)
		expect(spy).toHaveBeenCalledWith({ queryKey: partyKeys.detail('with-key') })
	})

	it('omits the header when no edit-key is stored', async () => {
		;(substitutionAdapter.createSubstitution as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: 's1'
		})

		await runMutation(createSubstitutionOptions(queryClient), {
			partyId: 'p1',
			partyShortcode: 'no-key',
			gridType: 'GridWeapon',
			gridId: 'g1',
			itemId: 'i1'
		})

		expect(substitutionAdapter.createSubstitution).toHaveBeenCalledWith(
			expect.anything(),
			undefined
		)
	})
})

describe('updateSubstitutionOptions', () => {
	it('forwards the position and invalidates the party cache', async () => {
		;(substitutionAdapter.updateSubstitution as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: 's1'
		})
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(updateSubstitutionOptions(queryClient), {
			id: 's1',
			partyId: 'p1',
			partyShortcode: 'with-key',
			position: 2
		})

		expect(substitutionAdapter.updateSubstitution).toHaveBeenCalledWith(
			's1',
			{ partyId: 'p1', position: 2 },
			{ 'X-Edit-Key': 'EDIT-KEY' }
		)
		expect(spy).toHaveBeenCalledWith({ queryKey: partyKeys.detail('with-key') })
	})
})

describe('deleteSubstitutionOptions', () => {
	it('forwards the partyId and invalidates the party cache', async () => {
		;(substitutionAdapter.deleteSubstitution as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined
		)
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(deleteSubstitutionOptions(queryClient), {
			id: 's1',
			partyId: 'p1',
			partyShortcode: 'with-key'
		})

		expect(substitutionAdapter.deleteSubstitution).toHaveBeenCalledWith('s1', 'p1', {
			'X-Edit-Key': 'EDIT-KEY'
		})
		expect(spy).toHaveBeenCalledWith({ queryKey: partyKeys.detail('with-key') })
	})
})

describe('reorderSubstitutionsOptions', () => {
	it('forwards the entries array and invalidates the party cache', async () => {
		;(substitutionAdapter.reorderSubstitutions as ReturnType<typeof vi.fn>).mockResolvedValue([])
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(reorderSubstitutionsOptions(queryClient), {
			partyId: 'p1',
			partyShortcode: 'with-key',
			entries: [
				{ id: 's1', position: 0 },
				{ id: 's2', position: 1 }
			]
		})

		expect(substitutionAdapter.reorderSubstitutions).toHaveBeenCalledWith(
			'p1',
			[
				{ id: 's1', position: 0 },
				{ id: 's2', position: 1 }
			],
			{ 'X-Edit-Key': 'EDIT-KEY' }
		)
		expect(spy).toHaveBeenCalledWith({ queryKey: partyKeys.detail('with-key') })
	})
})
