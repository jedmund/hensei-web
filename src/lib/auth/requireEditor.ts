/**
 * Gate a `+page.server.ts` `load` on the caller having the editor role
 * (role >= 7). Use at the top of admin route loaders before any data fetch:
 *
 * ```ts
 * export const load: PageServerLoad = async ({ params, parent }) => {
 *   const parentData = await parent()
 *   requireEditor(parentData, `/database/things/${params.id}`)
 *   // … editor-only work
 * }
 * ```
 *
 * Cross-route redirects keep non-editors on the read path they came from
 * instead of bouncing to the homepage.
 */
import { redirect } from '@sveltejs/kit'

const EDITOR_ROLE = 7

interface ParentDataLike {
	role?: number | null | undefined
}

export function requireEditor(parentData: ParentDataLike, fallbackUrl: string): void {
	if (!parentData.role || parentData.role < EDITOR_ROLE) {
		throw redirect(303, fallbackUrl)
	}
}
