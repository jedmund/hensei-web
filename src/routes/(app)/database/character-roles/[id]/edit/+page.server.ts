import type { PageServerLoad } from './$types'
import { roleAdapter } from '$lib/api/adapters/role.adapter'
import { error, isHttpError, isRedirect, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	try {
		const parentData = await parent()
		if (!parentData.role || parentData.role < 7) {
			throw redirect(303, `/database/character-roles/${params.id}`)
		}
		const role = await roleAdapter.getRole(params.id)
		if (!role) throw error(404, 'Role not found')

		return {
			roleRecord: role,
			role: parentData.role
		}
	} catch (err) {
		// Re-throw SvelteKit's own redirect/error so the framework handles them as intended.
		if (isHttpError(err) || isRedirect(err)) throw err
		console.error('Failed to load role:', err)
		if (err instanceof Error && 'status' in err && (err as { status?: number }).status === 404) {
			throw error(404, 'Role not found')
		}
		throw error(500, 'Failed to load role')
	}
}
