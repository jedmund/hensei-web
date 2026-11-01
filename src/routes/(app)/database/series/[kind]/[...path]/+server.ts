/**
 * The old series pages (`/database/series/weapons/<slug>`, `…/edit`, `…/new`)
 * moved to their resources' generic routes (GBF-143). Old links redirect.
 */
import { error, redirect } from '@sveltejs/kit'
import { localizeHref } from '$lib/paraglide/runtime'
import type { RequestHandler } from './$types'

const MOVED: Record<string, string> = {
	weapons: 'weapon-series',
	characters: 'character-series'
}

export const GET: RequestHandler = ({ params }) => {
	const resource = MOVED[params.kind]
	if (!resource) error(404, 'Not found')
	const rest = params.path ? `/${params.path}` : ''
	redirect(301, localizeHref(`/database/${resource}${rest}`))
}
