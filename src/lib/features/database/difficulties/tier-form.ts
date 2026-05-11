import type { DifficultyTier } from '$lib/types/api/party'

/**
 * Shape of the TierModal form state. Numeric scores are kept as plain
 * `number` rather than `string | number` so the modal owns input coercion.
 */
export interface TierFormInput {
	name: string
	slug: string
	color: string
	description: string
	minScore: number
	maxScore: number
	sortOrder: number
}

export interface TierFormErrors {
	name?: string
	slug?: string
	range?: string
}

/**
 * Validates the form fields used to create or edit a tier.
 *
 * Returns `{ ok: true }` when every field is valid. On failure, returns the
 * first set of human-readable errors so callers can either surface a single
 * toast or fan them out into per-field hints.
 */
export function validateTierForm(
	input: TierFormInput
): { ok: true } | { ok: false; errors: TierFormErrors } {
	const errors: TierFormErrors = {}

	if (input.name.trim().length === 0) errors.name = 'Name is required.'
	if (input.slug.trim().length === 0) errors.slug = 'Slug is required.'

	if (
		input.minScore < 0 ||
		input.maxScore > 100 ||
		!(input.maxScore > input.minScore) ||
		Number.isNaN(input.minScore) ||
		Number.isNaN(input.maxScore)
	) {
		errors.range = 'Score range must be within 0–100 and max must exceed min.'
	}

	if (Object.keys(errors).length > 0) return { ok: false, errors }
	return { ok: true }
}

/**
 * Build the request payload sent to `createTier` / `updateTier`.
 *
 * `removeIcon: true` produces an explicit `imageKey: null` (cleared on the
 * server). When a new icon file is staged, the modal uploads it after the
 * draft is created, so we don't include `imageKey` in this payload.
 */
export function buildTierPayload(
	input: TierFormInput,
	opts: { removeIcon?: boolean; hasIconFile?: boolean } = {}
): Partial<DifficultyTier> {
	const payload: Partial<DifficultyTier> = {
		name: input.name.trim(),
		slug: input.slug.trim(),
		color: input.color,
		description: input.description.trim() || undefined,
		minScore: input.minScore,
		maxScore: input.maxScore,
		sortOrder: input.sortOrder
	}

	if (opts.removeIcon && !opts.hasIconFile) {
		payload.imageKey = null
	}

	return payload
}
