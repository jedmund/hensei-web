// Home page payload, based on the community participation API contract.

import type { CharacterSeriesRef } from './characterSeries'
import type { LocalizedName } from './entities'
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

/** Catalogue item type, as GridRep and the Gallery's inc= filter use it */
export type HomeItemType = 'character' | 'weapon' | 'summon'

/** What made the item new: its release or its most recent uncap */
export type HomeItemChange = 'release' | 'flb' | 'ulb' | 'transcendence'

export interface HomeNewItem {
	item: {
		type: HomeItemType
		id: string
		granblueId: string
		name: LocalizedName
		/** ISO date (YYYY-MM-DD) of the release or uncap */
		latestDate: string
		change: HomeItemChange
		/** Characters only: what CharacterTags needs */
		character?: {
			element: number | null
			season: number | null
			series: (number | CharacterSeriesRef)[] | null
			seriesNames: string[] | null
			styleSwap: boolean
		}
	}
	parties: Party[]
}

/** A battle released in the last 4 weeks, with its teams in two orders */
export interface HomeNewBattle {
	raid: RaidFull
	recent: Party[]
	/** Participation score first, then most recent */
	trending: Party[]
}

export interface HomeResponse {
	current: HomeCurrentEvent[]
	upcoming: HomeUpcomingEvent[]
	rising: Party[]
	staffPicks: FeaturedParty[]
	newItems: HomeNewItem[]
	/** Absent from APIs older than the New battles card */
	newBattles?: HomeNewBattle[]
}
