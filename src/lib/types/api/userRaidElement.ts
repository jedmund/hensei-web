import type { LocalizedName } from './entities'

/** A user's raid element coverage for a specific raid */
export interface UserRaidElement {
	raidId: string
	raidName: LocalizedName
	elements: number[]
}
