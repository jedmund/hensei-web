/**
 * User-initiated download of the support-summon share card.
 *
 * Owner-only: session must match the URL username. No cache — the user might
 * change the transient fields between downloads, and the artifact is one-off.
 *
 * Output format is JPEG (quality ~88) rather than lossless PNG: the card is
 * dominated by photographic summon art (already JPEG from the CDN), and the
 * primary use case is uploading to social media which re-encodes regardless.
 * A 6MB lossless PNG drops to <1MB at JPEG q=88 with no perceptible loss.
 *
 * Because Playwright's navigation to the internal SSR route is unauthenticated
 * (it only carries the X-Render-Secret header), the user's session can't ride
 * along to the API. We pre-fetch the owner's user info + summons here, using
 * the request's authenticated `fetch`, then hand them to the renderer via a
 * one-shot in-process token. Without this, private support-summon profiles
 * would render an empty grid for their own owner.
 */

import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'
import { getTemplate } from '$lib/server/renderRegistry'
import { renderToImage } from '$lib/server/renderService'
import { storePrefetch } from '$lib/server/renderPrefetch'
import type { SupportSummon } from '$lib/types/api/supportSummon'
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

export const GET: RequestHandler = async ({ params, url, locals, fetch }) => {
	const username = params.username
	if (!username) throw error(400, 'Missing username')

	if (
		!locals.session.isAuthenticated ||
		locals.session.account?.username?.toLowerCase() !== username.toLowerCase()
	) {
		throw error(403, 'You can only download your own support summons')
	}

	// Pre-fetch on the authenticated side so private profiles work for their
	// own owner. Use SvelteKit's session-aware `fetch`, then stash the result
	// under a one-shot token the renderer can pick up.
	const [user, summons] = await Promise.all([
		userAdapter.getInfo(username, { fetch }),
		userAdapter.getSupportSummons(username, { fetch }).catch(() => [] as SupportSummon[])
	])
	const prefetch = storePrefetch({ user, summons })

	const template = getTemplate('user.support-summons')
	if (!template) throw error(500, 'Render template missing')

	const renderParams: Record<string, string> = { username, prefetch }
	const gbfName = sanitize(url.searchParams.get('gbf_name'), MAX_GBF_NAME)
	const gbfId = sanitize(url.searchParams.get('gbf_id'), MAX_GBF_ID)
	const teamUrl = sanitizeUrl(url.searchParams.get('team_url'), MAX_TEAM_URL)
	if (gbfName) renderParams.gbf_name = gbfName
	if (gbfId) renderParams.gbf_id = gbfId
	if (teamUrl) renderParams.team_url = teamUrl

	const jpeg = await renderToImage({
		path: template.internalPath(renderParams),
		viewport: template.viewport,
		format: 'jpeg',
		jpegQuality: 88
	})

	return new Response(new Uint8Array(jpeg), {
		status: 200,
		headers: {
			'Content-Type': 'image/jpeg',
			'Content-Length': String(jpeg.length),
			'Content-Disposition': `attachment; filename="${username}-support-summons.jpg"`,
			'Cache-Control': 'no-store'
		}
	})
}
