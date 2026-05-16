/**
 * User-initiated download of the support-summon share card.
 *
 * Owner-only: session must match the URL username. No cache — the user might
 * change the transient fields between downloads, and the artifact is one-off.
 */

import { error } from '@sveltejs/kit'
import { getTemplate } from '$lib/server/renderRegistry'
import { renderToPng } from '$lib/server/renderService'
import type { RequestHandler } from './$types'

const MAX_GBF_NAME = 30
const MAX_GBF_ID = 16
const MAX_TEAM_URL = 200

function sanitize(value: string | null, max: number): string | undefined {
	if (!value) return undefined
	// Strip ASCII control characters (newlines, tabs, DEL) so a careless
	// paste can't sneak invisible chars into the rendered card.
	// eslint-disable-next-line no-control-regex
	const cleaned = value.replace(/[\x00-\x1f\x7f]/g, '').trim()
	if (!cleaned) return undefined
	return cleaned.slice(0, max)
}

function sanitizeUrl(value: string | null, max: number): string | undefined {
	const cleaned = sanitize(value, max)
	if (!cleaned) return undefined
	try {
		const parsed = new URL(cleaned)
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined
		return parsed.toString()
	} catch {
		return undefined
	}
}

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const username = params.username
	if (!username) throw error(400, 'Missing username')

	if (
		!locals.session.isAuthenticated ||
		locals.session.account?.username?.toLowerCase() !== username.toLowerCase()
	) {
		throw error(403, 'You can only download your own support summons')
	}

	const template = getTemplate('user.support-summons')
	if (!template) throw error(500, 'Render template missing')

	const renderParams: Record<string, string> = { username }
	const gbfName = sanitize(url.searchParams.get('gbf_name'), MAX_GBF_NAME)
	const gbfId = sanitize(url.searchParams.get('gbf_id'), MAX_GBF_ID)
	const teamUrl = sanitizeUrl(url.searchParams.get('team_url'), MAX_TEAM_URL)
	if (gbfName) renderParams.gbf_name = gbfName
	if (gbfId) renderParams.gbf_id = gbfId
	if (teamUrl) renderParams.team_url = teamUrl

	const png = await renderToPng({
		path: template.internalPath(renderParams),
		viewport: template.viewport
	})

	return new Response(new Uint8Array(png), {
		status: 200,
		headers: {
			'Content-Type': 'image/png',
			'Content-Length': String(png.length),
			'Content-Disposition': `attachment; filename="${username}-support-summons.png"`,
			'Cache-Control': 'no-store'
		}
	})
}
