/**
 * Where the team-browsing pages live. Kept in one place because the routing
 * may move again: Home (events, rising teams, staff picks) is at `/`, and the
 * Gallery (all teams, with filters) is at `/gallery`.
 */

export const HOME_PATH = '/'
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
