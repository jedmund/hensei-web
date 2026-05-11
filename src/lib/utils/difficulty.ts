/**
 * Difficulty tier icon URL helper.
 *
 * Tiers store an S3-style key on the backend (e.g. `images/difficulties/<uuid>.png`,
 * versioned with `?v=<updated_at>` to bust caches). The public icon URL is built
 * by joining that key with the configured image base — same pattern as Role icons.
 */

import { getBasePath } from '$lib/utils/images'

export function getTierIconUrl(imageKey: string | null | undefined): string | null {
	if (!imageKey) return null
	const base = getBasePath().replace(/\/$/, '')
	const path = imageKey.replace(/^images\//, '').replace(/^\//, '')
	return `${base}/${path}`
}
