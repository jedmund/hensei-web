import type { RequestHandler } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('account', { path: '/' })
	cookies.delete('user', { path: '/' })
	return json({ success: true })
}
