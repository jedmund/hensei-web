import type { WeaponStatModifier } from '$lib/types/api/weaponStatModifier'

/**
 * Strength to use when an AX skill is picked. A freshly picked skill starts at its
 * minimum so the saved value is always valid (a 0 strength fails AX validation);
 * the current value is kept if it still fits the new skill's range.
 */
export function initialAxStrength(
	current: number | undefined,
	range: { min: number; max: number }
): number {
	return current !== undefined && current >= range.min && current <= range.max ? current : range.min
}

/** Valid strength range for a primary AX skill. */
export function primaryAxRange(modifier: WeaponStatModifier): { min: number; max: number } {
	return { min: modifier.baseMin, max: modifier.baseMax }
}
