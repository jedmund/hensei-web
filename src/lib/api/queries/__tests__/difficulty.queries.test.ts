import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryFunction } from '@tanstack/svelte-query'
import { difficultyQueries } from '../difficulty.queries'
import { difficultyAdapter } from '../../adapters/difficulty.adapter'

/**
 * `queryOptions()` types `queryFn` as `unique symbol | QueryFunction`, where
 * the symbol is the "no fn provided" sentinel. Our factories always provide
 * one, so this helper unwraps the union for test invocation.
 */
async function invokeQueryFn<TData>(opts: { queryFn?: unknown }): Promise<TData> {
	const fn = opts.queryFn as QueryFunction<TData, never[], never>
	return fn({} as never)
}

describe('difficultyQueries', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	describe('tiers', () => {
		it('keys without withDrafts default to { withDrafts: false }', () => {
			const opts = difficultyQueries.tiers()
			expect(opts.queryKey).toEqual(['difficulties', 'tiers', { withDrafts: false }])
		})

		it('keys distinguish withDrafts: true from the default', () => {
			const a = difficultyQueries.tiers().queryKey
			const b = difficultyQueries.tiers({ withDrafts: true }).queryKey
			expect(a).not.toEqual(b)
			expect(b).toEqual(['difficulties', 'tiers', { withDrafts: true }])
		})

		it('caches non-draft tiers aggressively (~30 min)', () => {
			expect(difficultyQueries.tiers().staleTime).toBe(1000 * 60 * 30)
		})

		it('treats draft-aware tiers as never stale', () => {
			expect(difficultyQueries.tiers({ withDrafts: true }).staleTime).toBe(0)
		})

		it('queryFn forwards withDrafts to the adapter', async () => {
			const spy = vi.spyOn(difficultyAdapter, 'listTiers').mockResolvedValue([])

			await invokeQueryFn(difficultyQueries.tiers({ withDrafts: true }))

			expect(spy).toHaveBeenCalledWith({ withDrafts: true })
		})
	})

	describe('rules', () => {
		it('keys vary by the filters object so different component filters cache separately', () => {
			const all = difficultyQueries.rules().queryKey
			const weapon = difficultyQueries.rules({ component: 'weapon' }).queryKey
			const weaponWithDrafts = difficultyQueries.rules({
				component: 'weapon',
				withDrafts: true
			}).queryKey

			expect(all).not.toEqual(weapon)
			expect(weapon).not.toEqual(weaponWithDrafts)
		})

		it('queryFn forwards the full filters object to the adapter', async () => {
			const spy = vi.spyOn(difficultyAdapter, 'listRules').mockResolvedValue([])

			await invokeQueryFn(
				difficultyQueries.rules({ component: 'weapon', active: true, withDrafts: true })
			)

			expect(spy).toHaveBeenCalledWith({
				component: 'weapon',
				active: true,
				withDrafts: true
			})
		})

		it('1 minute staleTime is appropriate for editor list', () => {
			expect(difficultyQueries.rules().staleTime).toBe(1000 * 60)
		})
	})

	describe('ruleTypes', () => {
		it('caches rule types for a day', () => {
			const opts = difficultyQueries.ruleTypes()
			expect(opts.queryKey).toEqual(['difficulties', 'rule_types'])
			expect(opts.staleTime).toBe(1000 * 60 * 60 * 24)
		})

		it('queryFn calls adapter.getRuleTypes', async () => {
			const spy = vi
				.spyOn(difficultyAdapter, 'getRuleTypes')
				.mockResolvedValue({ types: [], grouped: {} })

			await invokeQueryFn(difficultyQueries.ruleTypes())

			expect(spy).toHaveBeenCalledOnce()
		})
	})

	describe('components', () => {
		it('keys distinguish withDrafts variants', () => {
			expect(difficultyQueries.components().queryKey).toEqual([
				'difficulties',
				'components',
				{ withDrafts: false }
			])
			expect(difficultyQueries.components({ withDrafts: true }).queryKey).toEqual([
				'difficulties',
				'components',
				{ withDrafts: true }
			])
		})

		it('queryFn forwards withDrafts to the adapter', async () => {
			const spy = vi.spyOn(difficultyAdapter, 'listComponents').mockResolvedValue([])

			await invokeQueryFn(difficultyQueries.components({ withDrafts: true }))

			expect(spy).toHaveBeenCalledWith({ withDrafts: true })
		})
	})

	describe('diff', () => {
		it('is never stale (always refetches when the editor opens it)', () => {
			expect(difficultyQueries.diff().staleTime).toBe(0)
		})

		it('queryFn calls adapter.getDiff', async () => {
			const spy = vi.spyOn(difficultyAdapter, 'getDiff').mockResolvedValue({
				diff: {
					tiers: { creates: [], updates: [], destroys: [] },
					rules: { creates: [], updates: [], destroys: [] },
					components: { creates: [], updates: [], destroys: [] }
				},
				pendingCount: 0
			})

			await invokeQueryFn(difficultyQueries.diff())

			expect(spy).toHaveBeenCalledOnce()
		})

		it('all difficulty-related queryKeys share the "difficulties" root', () => {
			// Used by invalidateQueries({ queryKey: ['difficulties'] }) in mutations
			expect(difficultyQueries.tiers().queryKey[0]).toBe('difficulties')
			expect(difficultyQueries.rules().queryKey[0]).toBe('difficulties')
			expect(difficultyQueries.components().queryKey[0]).toBe('difficulties')
			expect(difficultyQueries.ruleTypes().queryKey[0]).toBe('difficulties')
			expect(difficultyQueries.diff().queryKey[0]).toBe('difficulties')
		})
	})
})
