/**
 * Where events sit in the database sidebar. Curators see the section and open
 * the list and details (to manage staff picks); the edit and new pages stay
 * editor-only. Kept apart from the definition, like every resource's section.
 */
import { m } from '$lib/paraglide/messages'
import { CURATOR_ROLE } from '$lib/auth/roles'
import type { ResourceSection } from '$lib/features/database/sections'

export const eventsSection: ResourceSection = {
	label: () => m.nav_events(),
	group: 'battles',
	minRole: CURATOR_ROLE,
	entity: () => m.type_event(),
	actions: [[{ label: () => m.db_events_new(), href: 'new' }]]
}
