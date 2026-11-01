/**
 * Where raids sit in the database sidebar. Kept apart from the definition
 * (which points at it as `section`): the sidebar is on every page and mustn't
 * load the definition.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const raidsSection: ResourceSection = {
	label: () => m.nav_raids(),
	group: 'battles',
	entity: () => m.type_raid(),
	actions: [
		[
			{ label: () => m.nav_new_raid(), href: 'new' },
			{ label: () => m.nav_new_raid_group(), href: '/database/raid-groups/new' }
		]
	]
}
