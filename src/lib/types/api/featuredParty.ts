// Staff pick types based on the community participation API contract.

import type { LocalizedName } from './entities'
import type { Party } from './party'

/** A staff pick from FeaturedPartyBlueprint */
export interface FeaturedParty {
	id: string
	eventId: string | null
	position: number
	note: LocalizedName
	party: Party
}

/** Editor create/update payload */
export interface FeaturedPartyPayload {
	eventId: string | null
	partyId: string
	position: number
	noteEn: string
	noteJp: string
}
