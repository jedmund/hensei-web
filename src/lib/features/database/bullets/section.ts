/**
 * Bullets in the database sidebar: nested under Jobs, as Gunslinger-type
 * jobs load them. Kept apart from the definition, like every section.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const bulletsSection: ResourceSection = {
	label: () => m.nav_bullets(),
	group: 'catalogue',
	parent: 'jobs'
}
