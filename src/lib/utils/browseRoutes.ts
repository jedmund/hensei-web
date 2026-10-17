/**
 * Where the team-browsing pages live. Kept in one place because the routing
 * may move again: explore (all teams, with filters) is at `/`, and the
 * featured gallery is at `/gallery`.
 */

export const EXPLORE_PATH = '/'
export const GALLERY_PATH = '/gallery'

/** Explore URL with a query string (e.g. from `exploreQuery`) */
export function explorePath(query = ''): string {
	return `${EXPLORE_PATH}${query}`
}

function trimSlash(path: string): string {
	return path.length > 1 ? path.replace(/\/$/, '') : path
}

/**
 * Whether the "Gallery" nav item is selected: on the gallery and on explore.
 * Hrefs are the localized paths (e.g. `/ja/gallery`).
 */
export function isBrowsePath(pathname: string, galleryHref: string, exploreHref: string): boolean {
	const path = trimSlash(pathname)
	const gallery = trimSlash(galleryHref)
	return path === gallery || path.startsWith(gallery + '/') || path === trimSlash(exploreHref)
}
