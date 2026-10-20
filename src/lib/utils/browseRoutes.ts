/**
 * Where the team-browsing pages live. Kept in one place because the routing
 * may move again: Home (events, rising teams, staff picks) is at `/`, and the
 * Gallery (all teams, with filters) is at `/gallery`.
 */

/**
 * Whether Home is live. Until it is, `/` goes to the Gallery, Home is only at
 * `/home` (for checking it in production) and the nav has no Home item.
 * Flip to true to launch.
 */
export const HOME_LAUNCHED = false

export const HOME_PATH = HOME_LAUNCHED ? '/' : '/home'
export const GALLERY_PATH = '/gallery'

/** Gallery URL with a query string (e.g. from `exploreQuery`) */
export function galleryPath(query = ''): string {
	return `${GALLERY_PATH}${query}`
}

function trimSlash(path: string): string {
	return path.length > 1 ? path.replace(/\/$/, '') : path
}

/**
 * Whether the "Home" nav item is selected. Only an exact match: every path
 * starts with the (localized) home path. Hrefs are localized (e.g. `/ja/`).
 */
export function isHomePath(pathname: string, homeHref: string): boolean {
	return trimSlash(pathname) === trimSlash(homeHref)
}

export const NEW_TEAM_PATH = '/teams/new'

export type NewTeamItemType = 'character' | 'weapon' | 'summon'

/** What a new team starts with: an item in its first slot and/or a raid */
export interface NewTeamStart {
	add?: { type: NewTeamItemType; id: string } | undefined
	raidSlug?: string | undefined
}

/** New team URL that starts the team with an item and/or a raid */
export function newTeamPath(start: NewTeamStart = {}): string {
	const params = new URLSearchParams()
	if (start.add) params.set('add', `${start.add.type}:${start.add.id}`)
	if (start.raidSlug) params.set('raid', start.raidSlug)
	const query = params.toString()
	return query ? `${NEW_TEAM_PATH}?${query}` : NEW_TEAM_PATH
}

/** Reads what `newTeamPath` put in the URL; anything malformed is ignored */
export function parseNewTeamStart(params: URLSearchParams): NewTeamStart {
	const start: NewTeamStart = {}
	const [type, id] = (params.get('add') ?? '').split(':')
	if ((type === 'character' || type === 'weapon' || type === 'summon') && id) {
		start.add = { type, id }
	}
	const raid = params.get('raid')
	if (raid) start.raidSlug = raid
	return start
}
