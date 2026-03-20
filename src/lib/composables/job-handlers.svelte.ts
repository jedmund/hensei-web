import type { PartyMutations } from './party-mutations.svelte'
import type { Party } from '$lib/types/api/party'
import {
	openJobSelectionSidebar,
	openJobSkillSelectionSidebar,
	openJobAccessorySelectionSidebar,
	closeJobSidebar,
	type SkillFilterState
} from '$lib/features/job/openJobSidebar.svelte'
import { transformSkillsToArray } from '$lib/utils/jobSkills'
import { toast } from 'svelte-sonner'
import { extractErrorMessage } from '$lib/utils/errors'
import * as m from '$lib/paraglide/messages'

type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

interface JobHandlerOptions {
	mutations: PartyMutations
	getParty: () => Party
	canEdit: () => boolean
	getUserElement?: () => ElementType | undefined
	ensurePartyExists?: () => Promise<{ id: string; shortcode: string }>
}

export function useJobHandlers(opts: JobHandlerOptions) {
	let loading = $state(false)
	let error = $state<string | null>(null)

	async function getShortcode(): Promise<string | undefined> {
		const party = opts.getParty()
		if (party.shortcode && party.shortcode !== 'new') return party.shortcode
		if (opts.ensurePartyExists) {
			const result = await opts.ensurePartyExists()
			return result.shortcode
		}
		return undefined
	}

	async function handleSelectJob() {
		if (!opts.canEdit()) return

		openJobSelectionSidebar({
			currentJobId: opts.getParty().job?.id,
			element: opts.getUserElement?.(),
			onSelectJob: async (job) => {
				loading = true
				error = null

				try {
					const shortcode = await getShortcode()
					if (!shortcode) return

					await opts.mutations.job.updateJob.mutateAsync({
						shortcode,
						jobId: job.id
					})
				} catch (e) {
					error = e instanceof Error ? e.message : m.toast_failed_update_job()
					console.error('Failed to update job:', e)
					toast.error(extractErrorMessage(e, m.toast_failed_update_job()))
				} finally {
					loading = false
				}
			}
		})
	}

	async function handleSelectJobSkill(slot: number, filterState?: SkillFilterState) {
		if (!opts.canEdit()) return

		openJobSkillSelectionSidebar({
			job: opts.getParty().job,
			currentSkills: opts.getParty().jobSkills,
			targetSlot: slot,
			initialSearchQuery: filterState?.searchQuery,
			initialSkillCategory: filterState?.skillCategory,
			onSelectSkill: async (skill, currentFilterState) => {
				loading = true
				error = null

				try {
					const shortcode = await getShortcode()
					if (!shortcode) return

					const updatedSkills = { ...opts.getParty().jobSkills }
					updatedSkills[String(slot) as keyof typeof updatedSkills] = skill

					const skillsArray = transformSkillsToArray(updatedSkills)

					await opts.mutations.job.updateJobSkills.mutateAsync({
						shortcode,
						skills: skillsArray
					})

					// Advance to the next empty slot, or close if all filled
					const nextSlot = findNextEmptySlot(slot, updatedSkills)
					if (nextSlot !== null) {
						handleSelectJobSkill(nextSlot, currentFilterState)
					} else {
						closeJobSidebar()
					}
				} catch (e: any) {
					error = extractErrorMessage(e, m.toast_failed_update_skill())
					console.error('Failed to update skill:', e)
					toast.error(extractErrorMessage(e, m.toast_failed_update_skill()))
					closeJobSidebar()
				} finally {
					loading = false
				}
			},
			onRemoveSkill: async () => {
				await handleRemoveJobSkill(slot)
			}
		})
	}

	function findNextEmptySlot(
		currentSlot: number,
		updatedSkills: Record<string, unknown>
	): number | null {
		// Check slots after the current one first, then wrap around
		for (let i = 1; i <= 3; i++) {
			const candidate = ((currentSlot - 1 + i) % 3) + 1
			if (!updatedSkills[String(candidate)]) return candidate
		}
		return null
	}

	async function handleRemoveJobSkill(slot: number) {
		if (!opts.canEdit()) return

		loading = true
		error = null

		try {
			const shortcode = await getShortcode()
			if (!shortcode) return

			await opts.mutations.job.removeJobSkill.mutateAsync({
				shortcode,
				slot
			})
		} catch (e) {
			error = e instanceof Error ? e.message : m.toast_failed_remove_skill()
			console.error('Failed to remove skill:', e)
			toast.error(extractErrorMessage(e, m.toast_failed_remove_skill()))
		} finally {
			loading = false
		}
	}

	async function handleSelectAccessory() {
		if (!opts.canEdit()) return

		openJobAccessorySelectionSidebar({
			job: opts.getParty().job,
			currentAccessory: opts.getParty().accessory,
			onSelectAccessory: async (accessory) => {
				loading = true
				error = null

				try {
					const shortcode = await getShortcode()
					if (!shortcode) return

					await opts.mutations.job.updateAccessory.mutateAsync({
						shortcode,
						accessoryId: accessory.id
					})
				} catch (e) {
					error = e instanceof Error ? e.message : m.toast_failed_update_accessory()
					console.error('Failed to update accessory:', e)
					toast.error(extractErrorMessage(e, m.toast_failed_update_accessory()))
				} finally {
					loading = false
				}
			},
			onRemoveAccessory: async () => {
				loading = true
				error = null

				try {
					const shortcode = await getShortcode()
					if (!shortcode) return

					await opts.mutations.job.removeAccessory.mutateAsync({
						shortcode
					})
				} catch (e) {
					error = e instanceof Error ? e.message : m.toast_failed_remove_accessory()
					console.error('Failed to remove accessory:', e)
					toast.error(extractErrorMessage(e, m.toast_failed_remove_accessory()))
				} finally {
					loading = false
				}
			}
		})
	}

	return {
		handleSelectJob,
		handleSelectJobSkill,
		handleRemoveJobSkill,
		handleSelectAccessory,
		get loading() {
			return loading
		}
	}
}
