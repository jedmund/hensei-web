import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // Double-check authorization at page level
  if (!locals.session.isAuthenticated) {
    throw redirect(302, '/login')
  }

  const role = locals.session.account?.role ?? 0
  if (role < 7) {
    throw redirect(302, '/')
  }

  return {}
}