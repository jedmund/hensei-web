/**
 * Job Mutation Configurations
 *
 * Provides mutation configurations for job-related operations
 * with cache invalidation using TanStack Query v6.
 *
 * @module api/mutations/job
 */

import { useQueryClient, createMutation } from '@tanstack/svelte-query'
import { partyAdapter } from '$lib/api/adapters/party.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'

/**
 * Update party job mutation
 *
 * Updates the job for a party with optimistic updates.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useUpdatePartyJob } from '$lib/api/mutations/job.mutations'
 *
 *   const updateJob = useUpdatePartyJob()
 *
 *   function handleJobSelect(jobId: string) {
 *     updateJob.mutate({ shortcode: 'abc123', jobId })
 *   }
 * </script>
 * ```
 */
export function useUpdatePartyJob() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ shortcode, jobId }: { shortcode: string; jobId: string }) =>
			partyAdapter.updateJob(shortcode, jobId),
		onMutate: async ({ shortcode, jobId }) => {
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
		onError: (_err, { shortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { shortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}))
}

/**
 * Update party job skills mutation
 *
 * Updates the job skills for a party.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useUpdatePartyJobSkills } from '$lib/api/mutations/job.mutations'
 *
 *   const updateSkills = useUpdatePartyJobSkills()
 *
 *   function handleSkillsUpdate(skills: Array<{ id: string; slot: number }>) {
 *     updateSkills.mutate({ shortcode: 'abc123', skills })
 *   }
 * </script>
 * ```
 */
export function useUpdatePartyJobSkills() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({
			shortcode,
			skills
		}: {
			shortcode: string
			skills: Array<{ id: string; slot: number }>
		}) => partyAdapter.updateJobSkills(shortcode, skills),
		onSuccess: (_data, { shortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}))
}

/**
 * Remove party job skill mutation
 *
 * Removes a job skill from a party.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useRemovePartyJobSkill } from '$lib/api/mutations/job.mutations'
 *
 *   const removeSkill = useRemovePartyJobSkill()
 *
 *   function handleRemoveSkill(slot: number) {
 *     removeSkill.mutate({ shortcode: 'abc123', slot })
 *   }
 * </script>
 * ```
 */
export function useRemovePartyJobSkill() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ shortcode, slot }: { shortcode: string; slot: number }) =>
			partyAdapter.removeJobSkill(shortcode, slot),
		onMutate: async ({ shortcode, slot }) => {
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
		onError: (_err, { shortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { shortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}))
}

/**
 * Update party accessory mutation
 *
 * Updates the accessory for a party.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useUpdatePartyAccessory } from '$lib/api/mutations/job.mutations'
 *
 *   const updateAccessory = useUpdatePartyAccessory()
 *
 *   function handleAccessorySelect(accessoryId: string) {
 *     updateAccessory.mutate({ shortcode: 'abc123', accessoryId })
 *   }
 * </script>
 * ```
 */
export function useUpdatePartyAccessory() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ shortcode, accessoryId }: { shortcode: string; accessoryId: string }) =>
			partyAdapter.updateAccessory(shortcode, accessoryId),
		onSuccess: (_data, { shortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}))
}
