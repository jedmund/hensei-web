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
		[{ label: () => m.nav_new_weapon_series(), href: '/database/series/weapons/new' }]
	],
	// Until series and awakenings become resources of their own (GBF-143)
	views: [
		{
			id: 'weapon-series',
			label: () => m.db_nav_series(),
			view: 'series',
			matches: ['/database/series/weapons']
		},
		{ id: 'awakenings', label: () => m.db_nav_awakenings(), view: 'awakenings' },
		{
			id: 'weapon-skills',
			label: () => m.db_nav_skills(),
			view: 'skills',
			matches: ['/database/weapon-skills']
		}
	]
}
