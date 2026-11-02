/**
 * Base values: one per quality tier (1–5). A shorter list means the last
 * value holds for the remaining qualities (ArtifactSkill#strength_for_quality).
 * Rails drops nulls from JSON arrays, so the form sends no gaps: trailing
 * blanks are trimmed, and a blank before a value is an error.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'

export const QUALITIES = 5

/** The list as shown: unknown values as "?" */
export function formatBaseValues(values: readonly (number | null)[] | null | undefined): string {
	return (values ?? []).map((v) => v ?? '?').join(', ')
}

/** The list without its trailing blanks */
export function trimBaseValues(values: unknown): (number | null)[] {
	const list = Array.isArray(values) ? [...(values as (number | null)[])] : []
	while (list.length && (list.at(-1) === null || list.at(-1) === undefined)) list.pop()
	return list
}

export const baseValuesSchema = z
	.array(z.number().nullable())
	.max(QUALITIES)
	.superRefine((values, ctx) => {
		const last = trimBaseValues(values).length
		values.slice(0, last).forEach((value, index) => {
			if (value === null) {
				ctx.addIssue({
					code: 'custom',
					path: [index],
					message: m.db_artifact_skills_base_values_gap()
				})
			}
		})
	})
