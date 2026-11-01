import { redirect } from '@sveltejs/kit'
import { requiredDatabaseRole } from '$lib/auth/roles'
import { resourceMinRole } from '$lib/features/database/sections'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, route, params }) => {
	// Check authentication first
	if (!locals.session.isAuthenticated) {
		throw redirect(302, '/auth/login')
	}

	// Check role authorization. Curators reach the Events pages only; many
	// Database pages have no guard of their own, so this check is the gate.
	// A generic resource route needs that resource's minimum role.
	const role = locals.session.account?.role ?? 0
	const resourceRole = params.resource ? resourceMinRole(params.resource) : undefined
	if (role < requiredDatabaseRole(route.id, resourceRole)) {
		// Redirect to home with no indication of why (security best practice)
		throw redirect(302, '/')
	}

	return {
		role,
		user: locals.session.user
	}
}
