/**
 * Composable for accessing weapon stat modifiers (AX skills and befoulments)
 *
 * Provides a reactive interface to fetch and filter weapon stat modifiers
 * from the API, with derived values for common use cases.
 *
 * @module composables/useWeaponStatModifiers
 */

import { createQuery } from '@tanstack/svelte-query'
import { entityQueries } from '$lib/api/queries/entity.queries'
import type { WeaponStatModifier } from '$lib/types/api/weaponStatModifier'

/**
 * Primary AX skill slugs - these are the main skills that can have secondaries
 */
const PRIMARY_AX_SLUGS = ['ax_atk', 'ax_def', 'ax_hp', 'ax_ca_dmg', 'ax_multiattack']

/**
 * Composable for accessing weapon stat modifiers
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useWeaponStatModifiers } from '$lib/composables/useWeaponStatModifiers.svelte'
 *
 *   const { axSkills, befoulments, isLoading } = useWeaponStatModifiers()
 * </script>
 *
 * {#if isLoading}
 *   <p>Loading...</p>
 * {:else}
 *   <p>Found {axSkills.length} AX skills and {befoulments.length} befoulments</p>
 * {/if}
 * ```
 */
export function useWeaponStatModifiers() {
	// Fetch all weapon stat modifiers
	const query = createQuery(() => entityQueries.weaponStatModifiers())

	// Filter to AX skills only
	const axSkills = $derived(
		(query.data ?? []).filter((m): m is WeaponStatModifier => m.category === 'ax')
	)

	// Filter to befoulments only
	const befoulments = $derived(
		(query.data ?? []).filter((m): m is WeaponStatModifier => m.category === 'befoulment')
	)

	// Primary AX skills (main skills that can have secondaries)
	const primaryAxSkills = $derived(axSkills.filter((m) => PRIMARY_AX_SLUGS.includes(m.slug)))

	// Secondary AX skills (all others that aren't primary)
	const secondaryAxSkills = $derived(axSkills.filter((m) => !PRIMARY_AX_SLUGS.includes(m.slug)))

	/**
	 * Find a modifier by its ID
	 */
	function findModifierById(id: string): WeaponStatModifier | undefined {
		return query.data?.find((m) => m.id === id)
	}

	/**
	 * Find a modifier by its slug
	 */
	function findModifierBySlug(slug: string): WeaponStatModifier | undefined {
		return query.data?.find((m) => m.slug === slug)
	}

	/**
	 * Find an AX skill by ID
	 */
	function findAxSkill(id: string): WeaponStatModifier | undefined {
		return axSkills.find((m) => m.id === id)
	}

	/**
	 * Find a befoulment by ID
	 */
	function findBefoulment(id: string): WeaponStatModifier | undefined {
		return befoulments.find((m) => m.id === id)
	}

	return {
		/** The underlying TanStack Query object */
		query,
		/** All modifiers (AX skills + befoulments) */
		allModifiers: query.data ?? [],
		/** AX skills only */
		axSkills,
		/** Befoulments only */
		befoulments,
		/** Primary AX skills (ATK, DEF, HP, C.A. DMG, Multiattack) */
		primaryAxSkills,
		/** Secondary AX skills (all others) */
		secondaryAxSkills,
		/** Whether the query is loading */
		isLoading: query.isLoading,
		/** Whether the query encountered an error */
		isError: query.isError,
		/** Error object if query failed */
		error: query.error,
		/** Find a modifier by ID */
		findModifierById,
		/** Find a modifier by slug */
		findModifierBySlug,
		/** Find an AX skill by ID */
		findAxSkill,
		/** Find a befoulment by ID */
		findBefoulment
	}
}
