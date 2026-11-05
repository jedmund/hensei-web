/**
 * Users in the database sidebar, under Admin. Admins only: the section's
 * `minRole` also gates the list and detail routes. Kept apart from the
 * definition: the sidebar is on every page and mustn't load it.
 */
import * as m from '$lib/paraglide/messages'
import { ADMIN_ROLE } from '$lib/auth/roles'
import type { ResourceSection } from '$lib/features/database/sections'

export const usersSection: ResourceSection = {
	label: () => m.db_users_label(),
	group: 'admin',
	entity: () => m.db_users_type(),
	minRole: ADMIN_ROLE
}
