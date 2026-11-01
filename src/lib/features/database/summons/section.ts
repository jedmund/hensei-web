/**
 * Where summons sit in the database sidebar. Kept apart from the definition
 * (which points at it as `section`): the sidebar is on every page and mustn't
 * load the definition.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const summonsSection: ResourceSection = {
	label: () => m.nav_summons(),
	group: 'catalogue',
	entity: () => m.type_summon(),
	actions: [
		[
			{ label: () => m.nav_new_single({ entity: m.type_summon() }), href: 'new' },
			{ label: () => m.nav_new_multiple({ entity: m.type_summon() }), href: 'import' }
		]
	]
}
