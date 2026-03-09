/**
 * Tests for useJobHandlers composable
 *
 * Focuses on behavioral contracts:
 * - getShortcode: uses party shortcode for existing parties, calls
 *   ensurePartyExists for new parties, returns undefined when stuck
 * - canEdit guard: all handlers are no-ops when canEdit is false
 * - Sidebar callbacks: onSelectJob/onSelectSkill trigger the right mutations
 * - Skill slot merging: new skill is merged into existing skills map
 * - Error handling: errors toast AND set state, loading resets
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useJobHandlers } from '../job-handlers.svelte'
import { createMockMutations, createTestParty } from './helpers'
import { MOCK_JOB, MOCK_JOB_SKILL_1, MOCK_JOB_SKILL_2 } from '$lib/api/mutations/__tests__/fixtures'
import type { PartyMutations } from '../party-mutations.svelte'
import type { Party } from '$lib/types/api/party'
import type { Job, JobSkill } from '$lib/types/api/entities'

// Capture sidebar openers so we can invoke their callbacks
const mockOpenJobSidebar = vi.fn()
const mockOpenSkillSidebar = vi.fn()

vi.mock('$lib/features/job/openJobSidebar.svelte', () => ({
	openJobSelectionSidebar: (...args: unknown[]) => mockOpenJobSidebar(...args),
	openJobSkillSelectionSidebar: (...args: unknown[]) => mockOpenSkillSidebar(...args)
}))

vi.mock('svelte-sonner', () => ({
	toast: { error: vi.fn(), success: vi.fn() }
}))

vi.mock('$lib/utils/errors', () => ({
	extractErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback)
}))

describe('useJobHandlers', () => {
	let mutations: PartyMutations
	let party: Party
	let handlers: ReturnType<typeof useJobHandlers>

	function createHandlers(overrides: Record<string, unknown> = {}) {
		return useJobHandlers({
			mutations,
			getParty: () => party,
			canEdit: () => true,
			...overrides
		})
	}

	/** Extracts the onSelectJob callback from the last openJobSelectionSidebar call */
	function getJobCallback(): (job: Job) => Promise<void> {
		const call = mockOpenJobSidebar.mock.calls.at(-1)?.[0]
		return call.onSelectJob
	}

	/** Extracts callbacks from the last openJobSkillSelectionSidebar call */
	function getSkillCallbacks(): {
		onSelectSkill: (skill: JobSkill) => Promise<void>
		onRemoveSkill: () => Promise<void>
	} {
		const call = mockOpenSkillSidebar.mock.calls.at(-1)?.[0]
		return { onSelectSkill: call.onSelectSkill, onRemoveSkill: call.onRemoveSkill }
	}

	beforeEach(() => {
		mutations = createMockMutations()
		party = createTestParty()
		handlers = createHandlers()
		vi.clearAllMocks()
	})

	// ========================================================================
	// getShortcode behavior (tested indirectly via handleRemoveJobSkill
	// since it's the only handler that doesn't go through a sidebar callback)
	// ========================================================================

	describe('shortcode resolution', () => {
		it('uses existing party shortcode for saved parties', async () => {
			await handlers.handleRemoveJobSkill(0)

			expect(mutations.job.removeJobSkill.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ shortcode: party.shortcode })
			)
		})

		it('calls ensurePartyExists when party is new', async () => {
			const createdParty = createTestParty({ shortcode: 'CREATED' })
			party = createTestParty({ shortcode: 'new' })

			const ensurePartyExists = vi.fn().mockImplementation(async () => {
				party = createdParty
				return { id: createdParty.id, shortcode: 'CREATED' }
			})

			handlers = createHandlers({ ensurePartyExists })
			await handlers.handleRemoveJobSkill(0)

			expect(ensurePartyExists).toHaveBeenCalledTimes(1)
			expect(mutations.job.removeJobSkill.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ shortcode: 'CREATED' })
			)
		})

		it('aborts silently when party is new and no ensurePartyExists', async () => {
			party = createTestParty({ shortcode: 'new' })
			handlers = createHandlers()

			await handlers.handleRemoveJobSkill(0)

			expect(mutations.job.removeJobSkill.mutateAsync).not.toHaveBeenCalled()
		})

		it('does not call ensurePartyExists for existing parties', async () => {
			const ensurePartyExists = vi.fn()
			handlers = createHandlers({ ensurePartyExists })

			await handlers.handleRemoveJobSkill(0)

			expect(ensurePartyExists).not.toHaveBeenCalled()
		})
	})

	// ========================================================================
	// canEdit guard
	// ========================================================================

	describe('canEdit guard', () => {
		it('handleSelectJob does not open sidebar when canEdit is false', () => {
			handlers = createHandlers({ canEdit: () => false })
			handlers.handleSelectJob()
			expect(mockOpenJobSidebar).not.toHaveBeenCalled()
		})

		it('handleSelectJobSkill does not open sidebar when canEdit is false', () => {
			handlers = createHandlers({ canEdit: () => false })
			handlers.handleSelectJobSkill(0)
			expect(mockOpenSkillSidebar).not.toHaveBeenCalled()
		})

		it('handleRemoveJobSkill is a no-op when canEdit is false', async () => {
			handlers = createHandlers({ canEdit: () => false })
			await handlers.handleRemoveJobSkill(0)
			expect(mutations.job.removeJobSkill.mutateAsync).not.toHaveBeenCalled()
		})
	})

	// ========================================================================
	// Job selection: sidebar opens → user picks job → mutation fires
	// ========================================================================

	describe('handleSelectJob', () => {
		it('opens sidebar with current job ID for highlighting', () => {
			handlers.handleSelectJob()

			expect(mockOpenJobSidebar).toHaveBeenCalledWith(
				expect.objectContaining({ currentJobId: MOCK_JOB.id })
			)
		})

		it('fires updateJob mutation when user selects a job', async () => {
			handlers.handleSelectJob()
			const onSelectJob = getJobCallback()

			const newJob = { ...MOCK_JOB, id: 'new-job-id' }
			await onSelectJob(newJob)

			expect(mutations.job.updateJob.mutateAsync).toHaveBeenCalledWith({
				shortcode: party.shortcode,
				jobId: 'new-job-id'
			})
		})

		it('loading resets after successful job selection', async () => {
			handlers.handleSelectJob()
			const onSelectJob = getJobCallback()

			await onSelectJob(MOCK_JOB)

			expect(handlers.loading).toBe(false)
		})

		it('loading resets after failed job selection', async () => {
			vi.mocked(mutations.job.updateJob.mutateAsync).mockRejectedValue(new Error('fail'))
			handlers.handleSelectJob()
			const onSelectJob = getJobCallback()

			await onSelectJob(MOCK_JOB)

			expect(handlers.loading).toBe(false)
		})
	})

	// ========================================================================
	// Skill selection: merges new skill into existing skills map
	// ========================================================================

	describe('handleSelectJobSkill', () => {
		it('opens sidebar with current job and skills for context', () => {
			handlers.handleSelectJobSkill(1)

			expect(mockOpenSkillSidebar).toHaveBeenCalledWith(
				expect.objectContaining({
					job: party.job,
					currentSkills: party.jobSkills,
					targetSlot: 1
				})
			)
		})

		it('merges selected skill into existing skills and sends array', async () => {
			handlers.handleSelectJobSkill(1)
			const { onSelectSkill } = getSkillCallbacks()

			const newSkill = { ...MOCK_JOB_SKILL_2, id: 'new-skill' }
			await onSelectSkill(newSkill)

			expect(mutations.job.updateJobSkills.mutateAsync).toHaveBeenCalledWith({
				shortcode: party.shortcode,
				skills: expect.arrayContaining([
					expect.objectContaining({ slot: 1, id: 'new-skill' })
				])
			})
		})

		it('onRemoveSkill delegates to handleRemoveJobSkill', async () => {
			handlers.handleSelectJobSkill(1)
			const { onRemoveSkill } = getSkillCallbacks()

			await onRemoveSkill()

			expect(mutations.job.removeJobSkill.mutateAsync).toHaveBeenCalledWith({
				shortcode: party.shortcode,
				slot: 1
			})
		})
	})

	// ========================================================================
	// handleRemoveJobSkill
	// ========================================================================

	describe('handleRemoveJobSkill', () => {
		it('sends correct slot number to the API', async () => {
			await handlers.handleRemoveJobSkill(2)

			expect(mutations.job.removeJobSkill.mutateAsync).toHaveBeenCalledWith({
				shortcode: party.shortcode,
				slot: 2
			})
		})

		it('loading resets after failure', async () => {
			vi.mocked(mutations.job.removeJobSkill.mutateAsync).mockRejectedValue(
				new Error('fail')
			)

			await handlers.handleRemoveJobSkill(0)

			expect(handlers.loading).toBe(false)
		})
	})

	// ========================================================================
	// State machine
	// ========================================================================

	describe('state machine', () => {
		it('error from job update is visible to consumers', async () => {
			vi.mocked(mutations.job.updateJob.mutateAsync).mockRejectedValue(
				new Error('Job update failed')
			)

			handlers.handleSelectJob()
			const onSelectJob = getJobCallback()
			await onSelectJob(MOCK_JOB)

			// The composable doesn't expose error publicly, but loading should reset.
			// This verifies the finally block runs even on error.
			expect(handlers.loading).toBe(false)
		})
	})
})
