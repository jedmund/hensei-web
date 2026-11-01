/**
 * Job accessories in the database sidebar: nested under Jobs, whose list
 * they were a tab of (`/database/jobs?view=accessories` redirects here). Kept
 * apart from the definition, like every section.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const jobAccessoriesSection: ResourceSection = {
	label: () => m.db_nav_accessories(),
	group: 'catalogue',
	parent: 'jobs'
}
