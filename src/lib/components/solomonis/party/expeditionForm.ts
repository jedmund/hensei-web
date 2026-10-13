import type { SolomonisExpeditionInput, SolomonisOutcome } from '$lib/types/api/solomonis'

/** The editable expedition fields, as the edit pane holds them (D20). */
export interface ExpeditionFormValues {
	routeEvokerId: string | null
	pledgeLevel: number
	outcome: SolomonisOutcome | null
}

/**
 * Builds `party[solomonis]` from the pane's values: only what changed, or
 * everything required when the party has no expedition yet.
 */
export function buildExpeditionInput(
	values: ExpeditionFormValues,
	initial: ExpeditionFormValues
): SolomonisExpeditionInput {
	const input: SolomonisExpeditionInput = {}
	const isNew = initial.routeEvokerId === null

	if (values.routeEvokerId && (isNew || values.routeEvokerId !== initial.routeEvokerId)) {
		input.routeEvokerId = values.routeEvokerId
	}
	if (isNew || values.pledgeLevel !== initial.pledgeLevel) input.pledgeLevel = values.pledgeLevel
	if (values.outcome !== initial.outcome) input.outcome = values.outcome

	return input
}
