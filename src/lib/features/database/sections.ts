/**
 * Single registry of database sections.
 *
 * The sidebar, the mobile section sheet, the breadcrumb, the overview and
 * the "New" menu all read from this list. Adding a section is one entry.
 *
 * Sub-sections are either resources of their own nested under another
 * (Weapons → Series links to `/database/weapon-series`), or view tabs on
 * their parent's list page (Weapons → Skills links to `weapons?view=skills`).
 */
import { m } from '$lib/paraglide/messages'
import { ADMIN_ROLE, EDITOR_ROLE } from '$lib/auth/roles'
import { awakeningsSection } from './awakenings/section'
import { characterSeriesSection } from './character-series/section'
import { charactersSection } from './characters/section'
import { eventsSection } from './events/section'
import { raidGroupsSection } from './raid-groups/section'
import { raidsSection } from './raids/section'
import { summonsSection } from './summons/section'
import { weaponSeriesSection } from './weapon-series/section'
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
	/** Nests the resource under another section in the sidebar (e.g. raid groups under raids) */
	parent?: string
	/**
	 * Lowest role that sees the section and opens the resource's list and
	 * detail pages (see `resourceMinRole`). Defaults to editor; the edit and
	 * new pages are editor-only whatever this says.
	 */
	minRole?: number
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
	...resourceSections('character-series', characterSeriesSection),
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
	...resourceSections('weapon-series', weaponSeriesSection),
	...resourceSections('awakenings', awakeningsSection),
	...resourceSections('summons', summonsSection),
	{
		id: 'jobs',
		label: () => m.nav_jobs(),
		path: '/database/jobs',
		group: 'catalogue',
		entity: () => m.type_job(),
		actions: [
			[
				{ label: () => m.nav_new_job(), href: '/database/jobs/new' },
				{ label: () => m.nav_new_job_skill(), href: '/database/job-skills/new' },
				{ label: () => m.nav_new_job_accessory(), href: '/database/job-accessories/new' }
			]
		]
	},
	{
		id: 'job-skills',
		label: () => m.db_nav_skills(),
		path: '/database/jobs',
		view: 'skills',
		group: 'catalogue',
		parent: 'jobs',
		matches: ['/database/job-skills']
	},
	{
		id: 'job-accessories',
		label: () => m.db_nav_accessories(),
		path: '/database/jobs',
		view: 'accessories',
		group: 'catalogue',
		parent: 'jobs',
		matches: ['/database/job-accessories']
	},
	{
		id: 'bullets',
		label: () => m.nav_bullets(),
		path: '/database/bullets',
		group: 'catalogue',
		parent: 'jobs'
	},

	// Battles & events
	...resourceSections('raids', raidsSection),
	...resourceSections('raid-groups', raidGroupsSection),
	...resourceSections('events', eventsSection),

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
 * A schema resource's section, followed by its `?view=` sub-sections. A
 * resource nested under another (`parent`) comes right after it in the list.
 * Takes the definition's name and section, not the definition: this list is
 * in every page's bundle, and definitions aren't.
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

/**
 * The lowest role that opens a resource's list and detail pages: its
 * section's `minRole`, else editor. Read from the sections, not the
 * definitions, so the database layout's role gate stays light.
 */
export function resourceMinRole(name: string): number {
	return sectionById(name)?.minRole ?? EDITOR_ROLE
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
