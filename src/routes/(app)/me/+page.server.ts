import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals }) => {
  const username = locals.session?.account?.username
  if (!username) throw redirect(302, '/auth/login')
  throw redirect(302, `/${encodeURIComponent(username)}`)
}

