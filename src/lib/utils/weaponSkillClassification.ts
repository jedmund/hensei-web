import type { WeaponSkillVersion } from '$lib/types/api/entities'

export interface SkillClassification {
	modifier: string | null
	series: string | null
	size: string | null
}

type Classified = Pick<
	WeaponSkillVersion,
	| 'skillModifier'
	| 'skillSeries'
	| 'skillSize'
	| 'resolvedModifier'
	| 'resolvedSeries'
	| 'resolvedSize'
>

/**
 * The classification the damage calculator uses: the API's resolved values
 * (curated override, else derived). Falls back to the derived values only when
 * the API doesn't send a resolved field. A null resolved value is kept: a
 * modifier pinned to "none" resolves to null, and the derived family it
 * removed must not reappear.
 */
export function resolvedClassification(version: Classified): SkillClassification {
	const pick = (resolved: string | null | undefined, derived: string | null | undefined) =>
		(resolved === undefined ? derived : resolved) ?? null

	return {
		modifier: pick(version.resolvedModifier, version.skillModifier),
		series: pick(version.resolvedSeries, version.skillSeries),
		size: pick(version.resolvedSize, version.skillSize)
	}
}
