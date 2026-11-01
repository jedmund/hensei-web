/**
 * Where characters sit in the database sidebar. Kept apart from the
 * definition (which points at it as `section`): the sidebar is on every page
 * and mustn't load the definition.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const charactersSection: ResourceSection = {
	label: () => m.nav_characters(),
	group: 'catalogue',
	entity: () => m.type_character(),
	actions: [
		[
			{ label: () => m.nav_new_single({ entity: m.type_character() }), href: 'new' },
			{ label: () => m.nav_new_multiple({ entity: m.type_character() }), href: 'import' }
		],
		[{ label: () => m.nav_new_character_series(), href: '/database/series/characters/new' }]
	],
	// Until character series becomes a resource of its own (GBF-143)
	views: [
		{
			id: 'character-series',
			label: () => m.db_nav_series(),
			view: 'series',
			matches: ['/database/series/characters']
		}
	]
}
