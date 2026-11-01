import * as m from '$lib/paraglide/messages'
import type { CreateCrewInput } from '$lib/types/api/crew'

/** The editable details of a crew, as typed into a form */
export interface CrewFormValues {
	name: string
	gamertag: string
	granblueCrewId: string
	description: string
}

export type CrewFormErrors = Record<string, string>

export const CREW_NAME_MAX = 100
export const CREW_GAMERTAG_MAX = 4
export const CREW_DESCRIPTION_MAX = 500

/** Field errors for a crew form; empty when the values can be saved */
export function validateCrewForm(
	values: Pick<CrewFormValues, 'name' | 'gamertag' | 'description'>
): CrewFormErrors {
	const errors: CrewFormErrors = {}

	if (!values.name.trim()) {
		errors.name = m.crew_error_name_required()
	} else if (values.name.length > CREW_NAME_MAX) {
		errors.name = m.crew_error_name_max()
	}

	if (values.gamertag && values.gamertag.length > CREW_GAMERTAG_MAX) {
		errors.gamertag = m.crew_error_gamertag_max()
	}

	if (values.description && values.description.length > CREW_DESCRIPTION_MAX) {
		errors.description = m.crew_error_description_max()
	}

	return errors
}

/** Trimmed values to send to the API; blank optional fields are left out */
export function toCrewInput(values: CrewFormValues): CreateCrewInput {
	return {
		name: values.name.trim(),
		gamertag: values.gamertag.trim() || undefined,
		granblueCrewId: values.granblueCrewId.trim() || undefined,
		description: values.description.trim() || undefined
	}
}
