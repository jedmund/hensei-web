import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	updatePartyJobOptions,
	updatePartyJobSkillsOptions,
	removePartyJobSkillOptions,
	updatePartyAccessoryOptions
} from '../job.mutations'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_PARTY, MOCK_SHORTCODE } from './fixtures'
import type { QueryClient } from '@tanstack/svelte-query'

vi.mock('$lib/api/adapters/party.adapter', () => ({
	partyAdapter: {
		updateJob: vi.fn(),
		updateJobSkills: vi.fn(),
		removeJobSkill: vi.fn(),
		updateAccessory: vi.fn()
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

	it('invalidates party on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updatePartyJobOptions(queryClient)

		opts.onSettled(undefined, undefined, { shortcode: MOCK_SHORTCODE, jobId: 'x' })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})
})

// ============================================================================
// updatePartyJobSkills
// ============================================================================

describe('updatePartyJobSkillsOptions', () => {
	it('invalidates party detail on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updatePartyJobSkillsOptions(queryClient)

		opts.onSuccess(undefined, { shortcode: MOCK_SHORTCODE, skills: [] })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
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

	it('invalidates party on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removePartyJobSkillOptions(queryClient)

		opts.onSettled(undefined, undefined, { shortcode: MOCK_SHORTCODE, slot: 0 })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})
})

// ============================================================================
// updatePartyAccessory
// ============================================================================

describe('updatePartyAccessoryOptions', () => {
	it('invalidates party detail on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updatePartyAccessoryOptions(queryClient)

		opts.onSuccess(undefined, { shortcode: MOCK_SHORTCODE, accessoryId: 'acc-1' })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})
})
