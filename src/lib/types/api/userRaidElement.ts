import type { LocalizedName } from './entities'

/** The elements a user has teams for in one trackable raid (game element ids) */
export interface UserRaidElement {
	raidId: string
	raidName: LocalizedName
	elements: number[]
}
