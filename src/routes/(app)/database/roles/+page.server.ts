import type { PageServerLoad } from './$types'
import { roleAdapter } from '$lib/api/adapters/role.adapter'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const parentData = await parent()
		const roles = await roleAdapter.listRoles()

		return {
			roles,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load roles:', err)
		throw error(500, 'Failed to load roles')
	}
}
