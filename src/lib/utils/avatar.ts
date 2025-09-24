/**
 * Ensures a filename has a .png extension
 */
export function ensurePng(name: string): string {
	return /\.png$/i.test(name) ? name : `${name}.png`
}

/**
 * Converts a filename to its @2x version for retina displays
 */
export function to2x(name: string): string {
	return /\.png$/i.test(name) ? name.replace(/\.png$/i, '@2x.png') : `${name}@2x.png`
}

/**
 * Gets the avatar source path
 */
export function getAvatarSrc(avatarFile: string | undefined | null): string {
	return avatarFile ? `/profile/${ensurePng(avatarFile)}` : ''
}

/**
 * Gets the avatar srcset for responsive images
 */
export function getAvatarSrcSet(avatarFile: string | undefined | null): string {
	if (!avatarFile) return ''
	const src = `/profile/${ensurePng(avatarFile)}`
	return `${src} 1x, /profile/${to2x(avatarFile)} 2x`
}