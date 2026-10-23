/**
 * Entity icon URL helper.
 *
 * Database entities (roles, difficulty tiers, etc.) store an S3-style key on
 * the backend (e.g. `images/<entity>/<uuid>.png`, optionally versioned with
 * `?v=<updated_at>` to bust caches). The public URL is built by joining that
 * key with the configured image base — same pattern as every other game asset.
 */

import { getBasePath } from '$lib/utils/images'

export function buildEntityIconUrl(iconKey: string | null | undefined): string | null {
	if (!iconKey) return null
	const base = getBasePath().replace(/\/$/, '')
	const path = iconKey.replace(/^images\//, '').replace(/^\//, '')
	return `${base}/${path}`
}
