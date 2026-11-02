import { isCurator } from '$lib/auth/roles'
import { m } from '$lib/paraglide/messages'
import { localizeHref } from '$lib/paraglide/runtime'
import { GALLERY_PATH, HOME_LAUNCHED, HOME_PATH, NEW_TEAM_PATH } from '$lib/utils/browseRoutes'

/**
 * The links the desktop pill, its "more" menu, the mobile tab bar and its
 * sheet share.
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
	register: '/auth/register',
	newTeam: NEW_TEAM_PATH
} as const

export type NavHrefs = Record<keyof typeof NAV_PATHS, string>

export type MainNavLinkId = 'home' | 'gallery' | 'crew' | 'collection' | 'profile'
export type MoreNavLinkId = 'about' | 'gacha' | 'extension' | 'database'
export type TabBarLinkId = 'home' | 'gallery' | 'newTeam' | 'profile'
export type SheetLinkId = 'crew' | 'collection' | MoreNavLinkId

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

/** Whether a (localized) path is in the Database, which keeps its own top bar */
export function isDatabasePath(pathname: string, hrefs: NavHrefs): boolean {
	return pathname === hrefs.database || pathname.startsWith(hrefs.database + '/')
}

/**
 * The phone tab bar: Home, Gallery, New team in the middle, and the profile
 * when signed in. The "More" tab that opens the sheet comes after these.
 */
export function tabBarLinks(
	hrefs: NavHrefs,
	isAuth: boolean,
	homeLaunched: boolean = HOME_LAUNCHED
): NavLink<TabBarLinkId>[] {
	const links: NavLink<TabBarLinkId>[] = []
	if (homeLaunched) links.push({ id: 'home', href: hrefs.home, label: () => m.nav_home() })
	links.push(
		{ id: 'gallery', href: hrefs.gallery, label: () => m.nav_gallery() },
		{ id: 'newTeam', href: hrefs.newTeam, label: () => m.nav_new_team() }
	)
	if (isAuth) links.push({ id: 'profile', href: hrefs.me, label: () => m.nav_profile() })
	return links
}

/**
 * Everything else, for the phone tab bar's "More" sheet: Crew, Collection
 * (the signed-in user's own, under their profile) and the secondary links.
 */
export function sheetLinks(
	hrefs: NavHrefs,
	isAuth: boolean,
	username: string,
	role: number | null
): NavLink<SheetLinkId>[] {
	return [
		{ id: 'crew', href: hrefs.crew, label: () => m.nav_crew() },
		{
			id: 'collection',
			href: isAuth ? localizeHref(`/${username}/collection`) : hrefs.collection,
			label: () => m.nav_collection()
		},
		...moreNavLinks(hrefs, isAuth ? role : null)
	]
}
