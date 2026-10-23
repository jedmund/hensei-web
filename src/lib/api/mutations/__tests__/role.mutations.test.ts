/**
 * Role mutation tests
 *
 * Exercises the options factories in role.mutations.ts against a real
 * QueryClient to verify cache invalidation after each operation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	createRoleOptions,
	updateRoleOptions,
	deleteRoleOptions,
	reorderRolesOptions,
	uploadRoleIconOptions
} from '../role.mutations'
import { createTestQueryClient } from './helpers'
import { roleKeys } from '$lib/api/queries/role.queries'
import { MutationObserver } from '@tanstack/svelte-query'
import type { QueryClient } from '@tanstack/svelte-query'

vi.mock('$lib/api/adapters/role.adapter', () => ({
	roleAdapter: {
		createRole: vi.fn(),
		updateRole: vi.fn(),
		deleteRole: vi.fn(),
		reorderRoles: vi.fn(),
		uploadIcon: vi.fn()
	}
}))

const { roleAdapter } = await import('$lib/api/adapters/role.adapter')

let queryClient: QueryClient

function runMutation<TVars, TResult>(
	options: { mutationFn: (vars: TVars) => Promise<TResult>; onSuccess?: () => void },
	vars: TVars
) {
	const observer = new MutationObserver(queryClient, options)
	return observer.mutate(vars)
}

beforeEach(() => {
	queryClient = createTestQueryClient()
	vi.clearAllMocks()
})

describe('createRoleOptions', () => {
	it('invalidates the roles cache after a successful create', async () => {
		;(roleAdapter.createRole as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: 'r1',
			nameEn: 'Healer'
		})
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(createRoleOptions(queryClient), { nameEn: 'Healer' })

		expect(roleAdapter.createRole).toHaveBeenCalledWith({ nameEn: 'Healer' })
		expect(spy).toHaveBeenCalledWith({ queryKey: roleKeys.all })
	})
})

describe('updateRoleOptions', () => {
	it('invalidates the roles cache after a successful update', async () => {
		;(roleAdapter.updateRole as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: 'r1',
			nameEn: 'Buffer'
		})
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(updateRoleOptions(queryClient), {
			id: 'r1',
			payload: { nameEn: 'Buffer' }
		})

		expect(roleAdapter.updateRole).toHaveBeenCalledWith('r1', { nameEn: 'Buffer' })
		expect(spy).toHaveBeenCalledWith({ queryKey: roleKeys.all })
	})
})

describe('deleteRoleOptions', () => {
	it('invalidates the roles cache after a successful delete', async () => {
		;(roleAdapter.deleteRole as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(deleteRoleOptions(queryClient), { id: 'r1' })

		expect(roleAdapter.deleteRole).toHaveBeenCalledWith('r1')
		expect(spy).toHaveBeenCalledWith({ queryKey: roleKeys.all })
	})
})

describe('reorderRolesOptions', () => {
	it('passes the entries array through and invalidates the cache', async () => {
		;(roleAdapter.reorderRoles as ReturnType<typeof vi.fn>).mockResolvedValue([])
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(reorderRolesOptions(queryClient), [{ id: 'r1', sortOrder: 0 }])

		expect(roleAdapter.reorderRoles).toHaveBeenCalledWith([{ id: 'r1', sortOrder: 0 }])
		expect(spy).toHaveBeenCalledWith({ queryKey: roleKeys.all })
	})
})

describe('uploadRoleIconOptions', () => {
	it('passes the id/image/filename and invalidates the cache', async () => {
		;(roleAdapter.uploadIcon as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: 'r1',
			iconKey: 'roles/r1.png'
		})
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await runMutation(uploadRoleIconOptions(queryClient), {
			id: 'r1',
			image: 'B64',
			filename: 'r1.png'
		})

		expect(roleAdapter.uploadIcon).toHaveBeenCalledWith('r1', 'B64', 'r1.png')
		expect(spy).toHaveBeenCalledWith({ queryKey: roleKeys.all })
	})
})
