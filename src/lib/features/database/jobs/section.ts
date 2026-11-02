/**
 * Where jobs sit in the database sidebar, with job skills and accessories
 * (resources of their own) nested under them. Kept apart from the
 * definition (which points at it as `section`): the sidebar is on every page
 * and mustn't load the definition.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const jobsSection: ResourceSection = {
	label: () => m.nav_jobs(),
	group: 'catalogue',
	entity: () => m.type_job(),
	actions: [
		[
			{ label: () => m.nav_new_job(), href: 'new' },
			{ label: () => m.nav_new_job_skill(), href: '/database/job-skills/new' },
			{ label: () => m.nav_new_job_accessory(), href: '/database/job-accessories/new' },
			{ label: () => m.nav_new_bullet(), href: '/database/bullets/new' }
		]
	]
}
