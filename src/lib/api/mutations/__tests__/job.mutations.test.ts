import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	updatePartyJobOptions,
	updatePartyJobSkillsOptions,
	removePartyJobSkillOptions,
	updatePartyAccessoryOptions,
	removePartyAccessoryOptions
} from '../job.mutations'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_PARTY, MOCK_SHORTCODE } from './fixtures'
import type { QueryClient } from '@tanstack/svelte-query'

vi.mock('$lib/api/adapters/party.adapter', () => ({
	partyAdapter: {
		updateJob: vi.fn(),
		updateJobSkills: vi.fn(),
		removeJobSkill: vi.fn(),
		updateAccessory: vi.fn(),
		removeAccessory: vi.fn()
	}
}))

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
	seedPartyCache(queryClient, MOCK_PARTY)
})

// ============================================================================
// updatePartyJob
// ============================================================================

describe('updatePartyJobOptions', () => {
	it('optimistically updates job ID in cached party', async () => {
		const opts = updatePartyJobOptions(queryClient)

		await opts.onMutate({ shortcode: MOCK_SHORTCODE, jobId: 'new-job-id' })

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.job?.id).toBe('new-job-id')
	})

	it('preserves other job fields during optimistic update', async () => {
		const opts = updatePartyJobOptions(queryClient)

		await opts.onMutate({ shortcode: MOCK_SHORTCODE, jobId: 'new-job-id' })

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.job?.name).toEqual(MOCK_PARTY.job?.name)
	})

	it('returns snapshot for rollback', async () => {
		const opts = updatePartyJobOptions(queryClient)

		const context = await opts.onMutate({ shortcode: MOCK_SHORTCODE, jobId: 'new-job-id' })

		expect(context.previousParty).toEqual(MOCK_PARTY)
	})

	it('rolls back on error', async () => {
		const opts = updatePartyJobOptions(queryClient)
		const params = { shortcode: MOCK_SHORTCODE, jobId: 'new-job-id' }

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.job?.id).toBe(MOCK_PARTY.job?.id)
	})

	it('does nothing on error without context', () => {
		const opts = updatePartyJobOptions(queryClient)

		opts.onError(new Error('fail'), { shortcode: MOCK_SHORTCODE, jobId: 'x' }, undefined)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
	})
})

// ============================================================================
// updatePartyJobSkills
// ============================================================================

describe('updatePartyJobSkillsOptions', () => {
	it('calls adapter with transformed skill params', async () => {
		const { partyAdapter } = await import('$lib/api/adapters/party.adapter')
		const opts = updatePartyJobSkillsOptions(queryClient)
		const skills = [{ id: 'skill-a', slot: 1 }]

		await opts.mutationFn({ shortcode: MOCK_SHORTCODE, skills })

		expect(partyAdapter.updateJobSkills).toHaveBeenCalledWith(MOCK_SHORTCODE, skills)
	})
})

// ============================================================================
// removePartyJobSkill
// ============================================================================

describe('removePartyJobSkillOptions', () => {
	it('optimistically removes skill from slot', async () => {
		const opts = removePartyJobSkillOptions(queryClient)

		await opts.onMutate({ shortcode: MOCK_SHORTCODE, slot: 0 })

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.jobSkills?.[0]).toBeUndefined()
		expect(cached?.jobSkills?.[1]).toBeDefined()
	})

	it('returns snapshot for rollback', async () => {
		const opts = removePartyJobSkillOptions(queryClient)

		const context = await opts.onMutate({ shortcode: MOCK_SHORTCODE, slot: 0 })

		expect(context.previousParty?.jobSkills?.[0]).toBeDefined()
	})

	it('rolls back on error', async () => {
		const opts = removePartyJobSkillOptions(queryClient)
		const params = { shortcode: MOCK_SHORTCODE, slot: 0 }

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.jobSkills?.[0]).toBeDefined()
	})

	it('does nothing on error without context', () => {
		const opts = removePartyJobSkillOptions(queryClient)

		opts.onError(new Error('fail'), { shortcode: MOCK_SHORTCODE, slot: 0 }, undefined)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
	})
})

// ============================================================================
// updatePartyAccessory
// ============================================================================

describe('updatePartyAccessoryOptions', () => {
	it('optimistically updates accessory ID in cached party', async () => {
		const opts = updatePartyAccessoryOptions(queryClient)

		await opts.onMutate({ shortcode: MOCK_SHORTCODE, accessoryId: 'new-acc-id' })

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.accessory?.id).toBe('new-acc-id')
	})

	it('preserves other accessory fields during optimistic update', async () => {
		const opts = updatePartyAccessoryOptions(queryClient)

		await opts.onMutate({ shortcode: MOCK_SHORTCODE, accessoryId: 'new-acc-id' })

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.accessory?.name).toEqual(MOCK_PARTY.accessory?.name)
	})

	it('returns snapshot for rollback', async () => {
		const opts = updatePartyAccessoryOptions(queryClient)

		const context = await opts.onMutate({ shortcode: MOCK_SHORTCODE, accessoryId: 'new-acc-id' })

		expect(context.previousParty?.accessory).toEqual(MOCK_PARTY.accessory)
	})

	it('rolls back on error', async () => {
		const opts = updatePartyAccessoryOptions(queryClient)
		const params = { shortcode: MOCK_SHORTCODE, accessoryId: 'new-acc-id' }

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.accessory?.id).toBe(MOCK_PARTY.accessory?.id)
	})

	it('does nothing on error without context', () => {
		const opts = updatePartyAccessoryOptions(queryClient)

		opts.onError(new Error('fail'), { shortcode: MOCK_SHORTCODE, accessoryId: 'x' }, undefined)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
	})
})

// ============================================================================
// removePartyAccessory
// ============================================================================

describe('removePartyAccessoryOptions', () => {
	it('optimistically clears accessory in cached party', async () => {
		const opts = removePartyAccessoryOptions(queryClient)

		await opts.onMutate({ shortcode: MOCK_SHORTCODE })

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.accessory).toBeUndefined()
	})

	it('returns snapshot with original accessory for rollback', async () => {
		const opts = removePartyAccessoryOptions(queryClient)

		const context = await opts.onMutate({ shortcode: MOCK_SHORTCODE })

		expect(context.previousParty?.accessory).toEqual(MOCK_PARTY.accessory)
	})

	it('rolls back on error', async () => {
		const opts = removePartyAccessoryOptions(queryClient)
		const params = { shortcode: MOCK_SHORTCODE }

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.accessory).toEqual(MOCK_PARTY.accessory)
	})

	it('does nothing on error without context', () => {
		const opts = removePartyAccessoryOptions(queryClient)

		opts.onError(new Error('fail'), { shortcode: MOCK_SHORTCODE }, undefined)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
	})
})
