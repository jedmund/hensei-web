/**
 * Pulls a team shortcode out of what an editor pasted: a bare shortcode or a
 * team URL (…/teams/<shortcode>[/tab]). Returns null if there isn't one.
 */
export function shortcodeFromInput(input: string): string | null {
	const value = input.trim()
	if (!value) return null
	const fromUrl = value.match(/\/teams\/([A-Za-z0-9_-]+)/)
	const code = fromUrl ? fromUrl[1] : value
	return code && /^[A-Za-z0-9_-]{1,32}$/.test(code) ? code : null
}
