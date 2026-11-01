/**
 * Character roles in the database sidebar: nested under Characters, whose
 * grid they tag. Kept apart from the definition, like every section; the
 * Characters "New" menu has a "New role" item.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const characterRolesSection: ResourceSection = {
	label: () => m.nav_roles(),
	group: 'catalogue',
	parent: 'characters'
}
