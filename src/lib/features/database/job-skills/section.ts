/**
 * Job skills in the database sidebar: nested under Jobs, whose list they
 * were a tab of (`/database/jobs?view=skills` redirects here). Kept apart
 * from the definition, like every section.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const jobSkillsSection: ResourceSection = {
	label: () => m.db_nav_skills(),
	group: 'catalogue',
	parent: 'jobs'
}
