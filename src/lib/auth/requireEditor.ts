/**
 * Gate a `+page.server.ts` `load` on the caller's role. Use at the top of
 * admin route loaders before any data fetch:
 *
 * ```ts
 * export const load: PageServerLoad = async ({ params, parent }) => {
 *   const parentData = await parent()
 *   requireEditor(parentData, `/database/things/${params.id}`)
 *   // … editor-only work
 * }
 * ```
 *
 * Cross-route redirects keep callers on the read path they came from
 * instead of bouncing to the homepage.
 */
import { redirect } from '@sveltejs/kit'
import { isEditor } from '$lib/auth/roles'

interface ParentDataLike {
	role?: number | null | undefined
}

/** Editors only (role >= 7) */
export function requireEditor(parentData: ParentDataLike, fallbackUrl: string): void {
	if (!isEditor(parentData.role)) {
		throw redirect(303, fallbackUrl)
	}
}
