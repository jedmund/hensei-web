import type { PageServerLoad } from './$types'
import { roleAdapter } from '$lib/api/adapters/role.adapter'
import { error, isHttpError, isRedirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	try {
		const parentData = await parent()
		const role = await roleAdapter.getRole(params.id)
		if (!role) throw error(404, 'Role not found')

		return {
			roleRecord: role,
			role: parentData.role
		}
	} catch (err) {
		// Re-throw SvelteKit's own redirect/error (e.g. our 404 above, or a parent
		// auth redirect) so the framework handles them as intended instead of
		// rewrapping as a 500.
		if (isHttpError(err) || isRedirect(err)) throw err
		console.error('Failed to load role:', err)
		if (err instanceof Error && 'status' in err && (err as { status?: number }).status === 404) {
			throw error(404, 'Role not found')
		}
		throw error(500, 'Failed to load role')
	}
}
