import type {
	SolomonisExpeditionInput,
	SolomonisKind,
	SolomonisMidboss,
	SolomonisOutcome
} from '$lib/types/api/solomonis'

/** The editable expedition fields, as the edit pane holds them. */
export interface ExpeditionFormValues {
	kind: SolomonisKind
	routeEvokerId: string | null
	pledgeLevel: number
	outcome: SolomonisOutcome | null
	bossesDefeated: number | null
	midboss: SolomonisMidboss | null
	expeditionLevel: number | null
	endedAt: string | null
}

const RUN_FIELDS = [
	'outcome',
	'bossesDefeated',
	'midboss',
	'expeditionLevel',
	'endedAt'
] as const satisfies readonly (keyof ExpeditionFormValues & keyof SolomonisExpeditionInput)[]

/**
 * Builds `party[solomonis]` from the pane's values: only what changed, or
 * everything required when the party has no expedition yet.
 *
 * Builds must have empty run fields (the API rejects them otherwise), so
 * turning a run into a build clears them.
 */
export function buildExpeditionInput(
	values: ExpeditionFormValues,
	initial: ExpeditionFormValues
): SolomonisExpeditionInput {
	const input: SolomonisExpeditionInput = {}
	const isNew = initial.routeEvokerId === null

	if (isNew || values.kind !== initial.kind) input.kind = values.kind
	if (values.routeEvokerId && (isNew || values.routeEvokerId !== initial.routeEvokerId)) {
		input.routeEvokerId = values.routeEvokerId
	}
	if (isNew || values.pledgeLevel !== initial.pledgeLevel) input.pledgeLevel = values.pledgeLevel

	for (const field of RUN_FIELDS) {
		const next = values.kind === 'build' ? null : values[field]
		if (next !== initial[field]) {
			;(input as Record<string, unknown>)[field] = next
		}
	}

	return input
}
