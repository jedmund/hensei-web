/**
 * Where weapons sit in the database sidebar. Kept apart from the definition
 * (which points at it as `section`): the sidebar is on every page and mustn't
 * load the definition.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const weaponsSection: ResourceSection = {
	label: () => m.nav_weapons(),
	group: 'catalogue',
	entity: () => m.type_weapon(),
	actions: [
		[
			{ label: () => m.nav_new_single({ entity: m.type_weapon() }), href: 'new' },
			{ label: () => m.nav_new_multiple({ entity: m.type_weapon() }), href: 'import' }
		],
		[
			{ label: () => m.nav_new_weapon_series(), href: '/database/weapon-series/new' },
			{ label: () => m.nav_new_awakening(), href: '/database/awakenings/new' }
		]
	],
	// Series and awakenings are resources of their own, nested here
	// (DATABASE_SECTIONS); skills lead into weapon-skill curation
	views: [
		{
			id: 'weapon-skills',
			label: () => m.db_nav_skills(),
			view: 'skills',
			matches: ['/database/weapon-skills']
		}
	]
}
