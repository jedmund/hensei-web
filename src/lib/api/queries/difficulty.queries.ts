/**
 * Difficulty Query Options Factory
 *
 * Provides type-safe, reusable query configurations for the party difficulty
 * scoring system using TanStack Query v6 patterns.
 *
 * @module api/queries/difficulty
 */

import { queryOptions } from '@tanstack/svelte-query'
import { difficultyAdapter } from '$lib/api/adapters/difficulty.adapter'

export const difficultyQueries = {
	/**
	 * List all difficulty tiers (public)
	 */
	tiers: () =>
		queryOptions({
			queryKey: ['difficulties', 'tiers'] as const,
			queryFn: () => difficultyAdapter.listTiers(),
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60 // 1 hour
		}),

	/**
	 * List all difficulty rules (editor only)
	 */
	rules: (filters?: { component?: string; active?: boolean }) =>
		queryOptions({
			queryKey: ['difficulties', 'rules', filters] as const,
			queryFn: () => difficultyAdapter.listRules(filters),
			staleTime: 1000 * 60 // 1 minute (changes frequently in editor)
		}),

	/**
	 * Registered rule types and grouping (editor only)
	 */
	ruleTypes: () =>
		queryOptions({
			queryKey: ['difficulties', 'rule_types'] as const,
			queryFn: () => difficultyAdapter.getRuleTypes(),
			staleTime: 1000 * 60 * 60 * 24 // 1 day - rule types rarely change
		}),

	/**
	 * List components (editor only)
	 */
	components: () =>
		queryOptions({
			queryKey: ['difficulties', 'components'] as const,
			queryFn: () => difficultyAdapter.listComponents(),
			staleTime: 1000 * 60 // 1 minute
		})
}
