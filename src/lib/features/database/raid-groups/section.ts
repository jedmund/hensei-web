/**
 * Raid groups sit under Raids in the database sidebar, and share its "New"
 * menu. Kept apart from the definition, like every resource's section.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const raidGroupsSection: ResourceSection = {
	label: () => m.db_nav_groups(),
	group: 'battles',
	parent: 'raids'
}
