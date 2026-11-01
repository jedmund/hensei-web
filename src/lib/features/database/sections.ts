/**
 * Single registry of database sections.
 *
 * The sidebar, the mobile section sheet, the breadcrumb, the overview and
 * the "New" menu all read from this list. Adding a section is one entry.
 *
 * Sub-sections that already exist as view tabs on their parent's list page
 * (e.g. Weapons → Series) link to `parent?view=<view>` rather than to a
 * separate page, so each record set has one list UI.
 */
import { m } from '$lib/paraglide/messages'
import { ADMIN_ROLE, CURATOR_ROLE, EDITOR_ROLE } from '$lib/auth/roles'
import { charactersSection } from './characters/section'
import { jobAccessoriesSection } from './job-accessories/section'
import { jobSkillsSection } from './job-skills/section'
import { jobsSection } from './jobs/section'
import { weaponsSection } from './weapons/section'

export type SectionGroupId = 'catalogue' | 'battles' | 'site' | 'admin'

export interface SectionAction {
	label: () => string
	href: string
}

export interface DatabaseSection {
	id: string
	label: () => string
	/** Base list path, without query */
	path: string
	group: SectionGroupId
	/** Sub-section of another section; shown in the sidebar only when the parent is active */
	parent?: string
	/** `?view=` value on the parent's list page */
	view?: string
	/** The `?view=` tab on the parent's list this section used to be; that URL redirects here */
	legacyView?: string
	description?: () => string
	/** Other route prefixes that belong to this section (detail pages etc.) */
	matches?: string[]
	/** Entity name for the "New {entity}" trigger */
	entity?: () => string
	/** "New" menu items, in separator-delimited groups. Children inherit their parent's menu. */
	actions?: SectionAction[][]
	/** Lowest role that sees the section. Defaults to editor; curators only see Events. */
	minRole?: number
	/** Hidden until the feature exists */
	hidden?: boolean
}

/**
 * A schema resource's place in the sidebar (`ResourceDef.section`). Its id
 * and path come from the resource's name; `resourceSections` expands it into
 * the section and its sub-sections.
 */
export interface ResourceSection {
	label: () => string
	group: SectionGroupId
	entity?: () => string
	/** "New" menu items; an href without a leading slash is relative to the resource's path */
	actions?: SectionAction[][]
	/** Nests the resource under another section, which lends it its "New" menu */
	parent?: string
	/** The `?view=` tab on the parent's list the resource used to be; that URL redirects here */
	legacyView?: string
	/** Sub-sections that are `?view=` tabs on the resource's list */
	views?: Array<Pick<DatabaseSection, 'id' | 'label' | 'view' | 'matches'>>
}

export interface SectionGroup {
	id: SectionGroupId
	label: () => string
}

export const SECTION_GROUPS: SectionGroup[] = [
	{ id: 'catalogue', label: () => m.db_nav_group_catalogue() },
	{ id: 'battles', label: () => m.db_nav_group_battles() },
	{ id: 'site', label: () => m.db_nav_group_site() },
	{ id: 'admin', label: () => m.db_nav_group_admin() }
]

export const DATABASE_SECTIONS: DatabaseSection[] = [
	// Catalogue
	...resourceSections('characters', charactersSection),
	{
		id: 'artifact-skills',
		label: () => m.nav_artifact_skills(),
		path: '/database/artifact-skills',
		group: 'catalogue',
		parent: 'characters'
	},
	{
		id: 'roles',
		label: () => m.nav_roles(),
		path: '/database/character-roles',
		group: 'catalogue',
		parent: 'characters'
	},
	...resourceSections('weapons', weaponsSection),
	{
		id: 'summons',
		label: () => m.nav_summons(),
		path: '/database/summons',
		group: 'catalogue',
		entity: () => m.type_summon(),
		actions: [
			[
				{
					label: () => m.nav_new_single({ entity: m.type_summon() }),
					href: '/database/summons/new'
				},
				{
					label: () => m.nav_new_multiple({ entity: m.type_summon() }),
					href: '/database/summons/import'
				}
			]
		]
	},
	...resourceSections('jobs', jobsSection),
	...resourceSections('job-skills', jobSkillsSection),
	...resourceSections('job-accessories', jobAccessoriesSection),
	{
		id: 'bullets',
		label: () => m.nav_bullets(),
		path: '/database/bullets',
		group: 'catalogue',
		parent: 'jobs'
	},

	// Battles & events
	{
		id: 'raids',
		label: () => m.nav_raids(),
		path: '/database/raids',
		group: 'battles',
		entity: () => m.type_raid(),
		actions: [
			[
				{ label: () => m.nav_new_raid(), href: '/database/raids/new' },
				{ label: () => m.nav_new_raid_group(), href: '/database/raid-groups/new' }
			]
		]
	},
	{
		id: 'raid-groups',
		label: () => m.db_nav_groups(),
		path: '/database/raids',
		view: 'groups',
		group: 'battles',
		parent: 'raids',
		matches: ['/database/raid-groups']
	},
	{
		id: 'events',
		label: () => m.nav_events(),
		path: '/database/events',
		group: 'battles',
		minRole: CURATOR_ROLE
	},

	// Site
	{
		id: 'difficulties',
		label: () => m.party_difficulty_label(),
		path: '/database/difficulties',
		group: 'site'
	},
	{
		id: 'stickers',
		label: () => m.nav_stickers(),
		path: '/database/stickers',
		group: 'site'
	},

	// Admin — hidden until the admin user API exists
	{
		id: 'users',
		label: () => 'Users',
		path: '/database/users',
		group: 'admin',
		minRole: ADMIN_ROLE,
		hidden: true
	}
]

/**
 * A schema resource's section, followed by its `?view=` sub-sections. Takes
 * the definition's name and section, not the definition: this list is in
 * every page's bundle, and definitions aren't.
 */
export function resourceSections(name: string, section: ResourceSection): DatabaseSection[] {
	const path = `/database/${name}`
	const { views = [], actions, ...rest } = section
	return [
		{
			id: name,
			path,
			...rest,
			...(actions && {
				actions: actions.map((group) =>
					group.map((a) => (a.href.startsWith('/') ? a : { ...a, href: `${path}/${a.href}` }))
				)
			})
		},
		...views.map((view) => ({ ...view, path, group: section.group, parent: name }))
	]
}

/** The section a parent list's old `?view=` tab moved to, if any (its URL redirects there) */
export function movedView(parent: string, view: string | null): DatabaseSection | undefined {
	if (!view) return undefined
	return DATABASE_SECTIONS.find((s) => s.parent === parent && s.legacyView === view)
}

export function sectionHref(section: DatabaseSection): string {
	return section.view ? `${section.path}?view=${section.view}` : section.path
}

export function canSeeSection(section: DatabaseSection, role: number): boolean {
	return !section.hidden && role >= (section.minRole ?? EDITOR_ROLE)
}

export function visibleSections(role: number): DatabaseSection[] {
	return DATABASE_SECTIONS.filter((s) => canSeeSection(s, role))
}

export function childrenOf(sectionId: string, role: number): DatabaseSection[] {
	return visibleSections(role).filter((s) => s.parent === sectionId)
}

/** Groups with their visible top-level sections, in display order. */
export function groupedSections(role: number) {
	const sections = visibleSections(role)
	return SECTION_GROUPS.map((group) => ({
		...group,
		sections: sections.filter((s) => s.group === group.id && !s.parent)
	})).filter((g) => g.sections.length > 0)
}

export function sectionById(id: string | undefined): DatabaseSection | undefined {
	return id ? DATABASE_SECTIONS.find((s) => s.id === id) : undefined
}

/** Strip the locale prefix so paths can be compared with registry paths. */
export function delocalize(pathname: string): string {
	return pathname.replace(/^\/ja(?=\/|$)/, '') || '/'
}

/**
 * The most specific section for a URL. A `?view=` on a parent's list path
 * selects the matching sub-section; otherwise the longest matching prefix wins.
 */
export function sectionForUrl(url: URL): DatabaseSection | null {
	const pathname = delocalize(url.pathname)
	const view = url.searchParams.get('view')

	if (view) {
		const byView = DATABASE_SECTIONS.find((s) => s.view === view && s.path === pathname)
		if (byView) return byView
	}

	let best: DatabaseSection | null = null
	let bestLength = 0
	for (const section of DATABASE_SECTIONS) {
		const prefixes = [...(section.view ? [] : [section.path]), ...(section.matches ?? [])]
		for (const prefix of prefixes) {
			if (
				(pathname === prefix || pathname.startsWith(prefix + '/')) &&
				prefix.length > bestLength
			) {
				best = section
				bestLength = prefix.length
			}
		}
	}
	return best
}

/** The top-level section that owns the "New" menu for a section. */
export function rootOf(section: DatabaseSection | null): DatabaseSection | null {
	if (!section) return null
	return section.parent ? (sectionById(section.parent) ?? section) : section
}
