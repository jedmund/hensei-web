/**
 * Job Mutation Configurations
 *
 * Provides mutation configurations for job-related operations
 * with cache invalidation using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/job
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { partyAdapter } from '$lib/api/adapters/party.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'

// ============================================================================
// Options Factories
// ============================================================================

export function updatePartyJobOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ shortcode, jobId }: { shortcode: string; jobId: string }) =>
			partyAdapter.updateJob(shortcode, jobId),
		onMutate: async ({ shortcode, jobId }: { shortcode: string; jobId: string }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(shortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(shortcode))

			// Optimistically update the job ID
			// Note: We don't have the full job object here, so we just update the ID
			// The full job will be fetched when the query is invalidated
			if (previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), {
					...previousParty,
					job: previousParty.job ? { ...previousParty.job, id: jobId } : undefined
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ shortcode }: { shortcode: string; jobId: string },
			context: { previousParty?: Party } | undefined
		) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), context.previousParty)
			}
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			{ shortcode }: { shortcode: string; jobId: string }
		) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}
}

export function updatePartyJobSkillsOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			shortcode,
			skills
		}: {
			shortcode: string
			skills: Array<{ id: string; slot: number }>
		}) => partyAdapter.updateJobSkills(shortcode, skills),
		onSuccess: (_data: unknown, { shortcode }: { shortcode: string; skills: Array<{ id: string; slot: number }> }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}
}

export function removePartyJobSkillOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ shortcode, slot }: { shortcode: string; slot: number }) =>
			partyAdapter.removeJobSkill(shortcode, slot),
		onMutate: async ({ shortcode, slot }: { shortcode: string; slot: number }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(shortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(shortcode))

			// Optimistically remove the skill from the slot
			// Convert slot number to string key to match jobSkills type (0-3)
			if (previousParty?.jobSkills) {
				const updatedSkills = { ...previousParty.jobSkills }
				const key = String(slot) as unknown as keyof typeof updatedSkills
				delete updatedSkills[key]
				queryClient.setQueryData(partyKeys.detail(shortcode), {
					...previousParty,
					jobSkills: updatedSkills
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ shortcode }: { shortcode: string; slot: number },
			context: { previousParty?: Party } | undefined
		) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), context.previousParty)
			}
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			{ shortcode }: { shortcode: string; slot: number }
		) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}
}

export function updatePartyAccessoryOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ shortcode, accessoryId }: { shortcode: string; accessoryId: string }) =>
			partyAdapter.updateAccessory(shortcode, accessoryId),
		onSuccess: (_data: unknown, { shortcode }: { shortcode: string; accessoryId: string }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}
}

// ============================================================================
// Hooks (thin wrappers for component use)
// ============================================================================

export function useUpdatePartyJob() {
	const queryClient = useQueryClient()
	return createMutation(() => updatePartyJobOptions(queryClient))
}

export function useUpdatePartyJobSkills() {
	const queryClient = useQueryClient()
	return createMutation(() => updatePartyJobSkillsOptions(queryClient))
}

export function useRemovePartyJobSkill() {
	const queryClient = useQueryClient()
	return createMutation(() => removePartyJobSkillOptions(queryClient))
}

export function useUpdatePartyAccessory() {
	const queryClient = useQueryClient()
	return createMutation(() => updatePartyAccessoryOptions(queryClient))
}
