// Home page payload, based on the community participation API contract.

import type { GameEvent } from './event'
import type { FeaturedParty } from './featuredParty'
import type { Party } from './party'
import type { RaidFull } from './raid'

export interface HomeRaidSection {
	raid: RaidFull
	parties: Party[]
}

export interface HomeCurrentEvent {
	event: GameEvent
	raids: HomeRaidSection[]
}

export interface HomeUpcomingEvent {
	event: GameEvent
	previousEvent: GameEvent | null
	raids: HomeRaidSection[]
}

export interface HomeResponse {
	current: HomeCurrentEvent[]
	upcoming: HomeUpcomingEvent[]
	rising: Party[]
	staffPicks: FeaturedParty[]
}
