import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Check authentication first
  if (!locals.session.isAuthenticated) {
    throw redirect(302, '/login')
  }

  // Check role authorization
  const role = locals.session.account?.role ?? 0
  if (role < 7) {
    // Redirect to home with no indication of why (security best practice)
    throw redirect(302, '/')
  }

  return {
    role
  }
}

