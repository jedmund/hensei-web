import { isCurator } from '$lib/auth/roles'
import { m } from '$lib/paraglide/messages'
import { localizeHref } from '$lib/paraglide/runtime'
import { GALLERY_PATH, HOME_LAUNCHED, HOME_PATH } from '$lib/utils/browseRoutes'

/**
 * The links the desktop pill, its "more" menu and the mobile sheet share.
 * Both navigations build their lists from here so a link (or its role
 * gating) only has to change in one place.
 */
export const NAV_PATHS = {
	home: HOME_PATH,
	gallery: GALLERY_PATH,
	crew: '/crew',
	collection: '/collection',
	me: '/me',
	about: '/about',
	gacha: '/gacha',
	extension: '/extension',
	database: '/database',
	login: '/auth/login',
	register: '/auth/register'
} as const

export type NavHrefs = Record<keyof typeof NAV_PATHS, string>

export type MainNavLinkId = 'home' | 'gallery' | 'crew' | 'collection' | 'profile'
export type MoreNavLinkId = 'about' | 'gacha' | 'extension' | 'database'

export interface NavLink<Id extends string> {
	id: Id
	href: string
	label: () => string
}

export function localizeNavHrefs(): NavHrefs {
	const hrefs = {} as NavHrefs
	for (const key of Object.keys(NAV_PATHS) as (keyof NavHrefs)[]) {
		hrefs[key] = localizeHref(NAV_PATHS[key])
	}
	return hrefs
}

/** Main links. Signed-in users get their profile where Collection would be. */
export function mainNavLinks(
	hrefs: NavHrefs,
	isAuth: boolean,
	username: string
): NavLink<MainNavLinkId>[] {
	const links: NavLink<MainNavLinkId>[] = []
	if (HOME_LAUNCHED) links.push({ id: 'home', href: hrefs.home, label: () => m.nav_home() })
	links.push(
		{ id: 'gallery', href: hrefs.gallery, label: () => m.nav_gallery() },
		{ id: 'crew', href: hrefs.crew, label: () => m.nav_crew() },
		isAuth
			? { id: 'profile', href: hrefs.me, label: () => username }
			: { id: 'collection', href: hrefs.collection, label: () => m.nav_collection() }
	)
	return links
}

/** Secondary links (the desktop "more" menu). Database is for curators and up. */
export function moreNavLinks(hrefs: NavHrefs, role: number | null): NavLink<MoreNavLinkId>[] {
	const links: NavLink<MoreNavLinkId>[] = [
		{ id: 'about', href: hrefs.about, label: () => m.nav_about() },
		{ id: 'gacha', href: hrefs.gacha, label: () => m.nav_gacha() },
		{ id: 'extension', href: hrefs.extension, label: () => m.nav_extension() }
	]
	if (isCurator(role)) {
		links.push({ id: 'database', href: hrefs.database, label: () => m.nav_database() })
	}
	return links
}
