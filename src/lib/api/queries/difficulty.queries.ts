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

interface RuleFilters {
	component?: string
	active?: boolean
}

export const difficultyQueries = {
	/**
	 * List all difficulty tiers. When `withDrafts: true`, the current editor's
	 * staged changes are merged in.
	 */
	tiers: (opts: { withDrafts?: boolean } = {}) =>
		queryOptions({
			queryKey: ['difficulties', 'tiers', { withDrafts: !!opts.withDrafts }] as const,
			queryFn: () => difficultyAdapter.listTiers({ withDrafts: opts.withDrafts }),
			staleTime: opts.withDrafts ? 0 : 1000 * 60 * 30
		}),

	/**
	 * List all difficulty rules (editor only)
	 */
	rules: (filters: RuleFilters & { withDrafts?: boolean } = {}) =>
		queryOptions({
			queryKey: ['difficulties', 'rules', filters] as const,
			queryFn: () => difficultyAdapter.listRules(filters),
			staleTime: 1000 * 60
		}),

	/**
	 * Registered rule types and grouping (editor only)
	 */
	ruleTypes: () =>
		queryOptions({
			queryKey: ['difficulties', 'rule_types'] as const,
			queryFn: () => difficultyAdapter.getRuleTypes(),
			staleTime: 1000 * 60 * 60 * 24
		}),

	/**
	 * List components (editor only)
	 */
	components: (opts: { withDrafts?: boolean } = {}) =>
		queryOptions({
			queryKey: ['difficulties', 'components', { withDrafts: !!opts.withDrafts }] as const,
			queryFn: () => difficultyAdapter.listComponents({ withDrafts: opts.withDrafts }),
			staleTime: 1000 * 60
		}),

	/**
	 * Current editor's draft diff (drives the Commit button + dialog).
	 */
	diff: () =>
		queryOptions({
			queryKey: ['difficulties', 'diff'] as const,
			queryFn: () => difficultyAdapter.getDiff(),
			staleTime: 0
		})
}
