import type { Party } from './party'
import type { User } from './entities'

export interface Playlist {
	id: string
	title: string
	slug: string
	description?: string
	videoUrl?: string
	visibility: number
	user?: User
	parties?: Party[]
	partyCount?: number
	partyIds?: string[]
	raidSlugs?: string[]
	createdAt: string
	updatedAt: string
	lastUpdated?: string
}
