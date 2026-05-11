/**
 * Role icon URL helper.
 *
 * Roles store an S3 key on the backend (e.g. `images/roles/<uuid>.png`).
 * The public icon URL is built by joining that key with the configured
 * image base, the same way every other game asset on the site is served.
 */

import { getBasePath } from '$lib/utils/images'

export function getRoleIconUrl(iconKey: string | null | undefined): string | null {
	if (!iconKey) return null
	const base = getBasePath().replace(/\/$/, '')
	const path = iconKey.replace(/^images\//, '').replace(/^\//, '')
	return `${base}/${path}`
}
