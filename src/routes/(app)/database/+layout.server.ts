import { redirect } from '@sveltejs/kit'
import { requiredDatabaseRole } from '$lib/auth/roles'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, route }) => {
	// Check authentication first
	if (!locals.session.isAuthenticated) {
		throw redirect(302, '/auth/login')
	}

	// Check role authorization. Curators reach the Events pages only; many
	// Database pages have no guard of their own, so this check is the gate.
	const role = locals.session.account?.role ?? 0
	if (role < requiredDatabaseRole(route.id)) {
		// Redirect to home with no indication of why (security best practice)
		throw redirect(302, '/')
	}

	return {
		role,
		user: locals.session.user
	}
}
