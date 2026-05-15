import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
	supportSummonAdapter,
	type SupportSummonWriteParams
} from '$lib/api/adapters/supportSummon.adapter'
import type { SupportSummon, SupportSummonCollectionSummon } from '$lib/types/api/supportSummon'

const cacheKey = (username: string) => ['user', username, 'supportSummons'] as const

type QueryClient = ReturnType<typeof useQueryClient>

/**
 * Optimistically replace (or insert) the slot identified by section+position
 * in the username's cached support-summons list. Returns the snapshot we took
 * so callers can roll back on error.
 */
function applyOptimisticUpsert(
	queryClient: QueryClient,
	username: string,
	section: SupportSummon['section'],
	position: number,
	collectionSummon: SupportSummonCollectionSummon
) {
	const previous = queryClient.getQueryData<SupportSummon[]>(cacheKey(username))
	queryClient.setQueryData<SupportSummon[]>(cacheKey(username), (old) => {
		const list = old ?? []
		const existing = list.find((s) => s.section === section && s.position === position)
		if (existing) {
			return list.map((s) => (s.id === existing.id ? { ...s, collectionSummon } : s))
		}
		return [
			...list,
			{
				id: `optimistic:${section}:${position}`,
				section,
				position,
				collectionSummon
			}
		]
	})
	return previous
}

function applyOptimisticRemove(queryClient: QueryClient, username: string, id: string) {
	const previous = queryClient.getQueryData<SupportSummon[]>(cacheKey(username))
	queryClient.setQueryData<SupportSummon[]>(cacheKey(username), (old) =>
		(old ?? []).filter((s) => s.id !== id)
	)
	return previous
}

interface MutationContext {
	previous?: SupportSummon[]
}

export interface CreateSupportSummonVars extends SupportSummonWriteParams {
	username: string
	collectionSummon: SupportSummonCollectionSummon
}

export interface UpdateSupportSummonVars {
	id: string
	username: string
	section: SupportSummon['section']
	position: number
	collectionSummonId: string
	collectionSummon: SupportSummonCollectionSummon
}

export interface DeleteSupportSummonVars {
	id: string
	username: string
}

export function useCreateSupportSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => ({
		mutationFn: (vars: CreateSupportSummonVars) =>
			supportSummonAdapter.create({
				collectionSummonId: vars.collectionSummonId,
				section: vars.section,
				position: vars.position
			}),
		onMutate: async (vars: CreateSupportSummonVars) => {
			await queryClient.cancelQueries({ queryKey: cacheKey(vars.username) })
			const previous = applyOptimisticUpsert(
				queryClient,
				vars.username,
				vars.section,
				vars.position,
				vars.collectionSummon
			)
			return { previous } satisfies MutationContext
		},
		onError: (_err, vars: CreateSupportSummonVars, ctx) => {
			if (ctx?.previous !== undefined) {
				queryClient.setQueryData(cacheKey(vars.username), ctx.previous)
			}
		},
		onSettled: (_data, _err, vars: CreateSupportSummonVars) => {
			queryClient.invalidateQueries({ queryKey: cacheKey(vars.username) })
		}
	}))
}

export function useUpdateSupportSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => ({
		mutationFn: (vars: UpdateSupportSummonVars) =>
			supportSummonAdapter.update(vars.id, {
				collectionSummonId: vars.collectionSummonId,
				section: vars.section,
				position: vars.position
			}),
		onMutate: async (vars: UpdateSupportSummonVars) => {
			await queryClient.cancelQueries({ queryKey: cacheKey(vars.username) })
			const previous = applyOptimisticUpsert(
				queryClient,
				vars.username,
				vars.section,
				vars.position,
				vars.collectionSummon
			)
			return { previous } satisfies MutationContext
		},
		onError: (_err, vars: UpdateSupportSummonVars, ctx) => {
			if (ctx?.previous !== undefined) {
				queryClient.setQueryData(cacheKey(vars.username), ctx.previous)
			}
		},
		onSettled: (_data, _err, vars: UpdateSupportSummonVars) => {
			queryClient.invalidateQueries({ queryKey: cacheKey(vars.username) })
		}
	}))
}

export function useDeleteSupportSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => ({
		mutationFn: (vars: DeleteSupportSummonVars) => supportSummonAdapter.destroy(vars.id),
		onMutate: async (vars: DeleteSupportSummonVars) => {
			await queryClient.cancelQueries({ queryKey: cacheKey(vars.username) })
			const previous = applyOptimisticRemove(queryClient, vars.username, vars.id)
			return { previous } satisfies MutationContext
		},
		onError: (_err, vars: DeleteSupportSummonVars, ctx) => {
			if (ctx?.previous !== undefined) {
				queryClient.setQueryData(cacheKey(vars.username), ctx.previous)
			}
		},
		onSettled: (_data, _err, vars: DeleteSupportSummonVars) => {
			queryClient.invalidateQueries({ queryKey: cacheKey(vars.username) })
		}
	}))
}
