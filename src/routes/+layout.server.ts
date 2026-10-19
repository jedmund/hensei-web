import type { LayoutServerLoad } from './$types'
import { STICKERS_FOLDED_COOKIE } from '$lib/stores/stickersFolded.svelte'

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const account = locals.session.account
		? {
				userId: locals.session.account.userId,
				username: locals.session.account.username,
				role: locals.session.account.role,
				deletionScheduledAt: locals.session.account.deletionScheduledAt ?? null
			}
		: null

	const currentUser = locals.session.user ?? null
	const isAuthenticated = locals.session.isAuthenticated

	// For unauthenticated users, read the standalone theme cookie as fallback
	const themePreference = currentUser?.theme ?? cookies.get('theme') ?? null

	// Sticker areas folded away on every team (see stores/stickersFolded)
	const stickersFolded = cookies.get(STICKERS_FOLDED_COOKIE) === '1'

	return {
		isAuthenticated,
		account,
		currentUser,
		themePreference,
		stickersFolded,
		auth: locals.auth
	}
}
