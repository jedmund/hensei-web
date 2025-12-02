/**
 * Font loading utilities
 *
 * Generates @font-face CSS based on environment:
 * - Development: loads from /fonts (local static files)
 * - Production: loads from AWS S3 CDN
 */

import { getImageBaseUrl } from '$lib/api/adapters/config'

const FONT_FILES = [
	{ file: '437fb160c86d1771.woff2', weight: 400, style: 'normal' },
	{ file: '90e2044c61d1d575.woff2', weight: 400, style: 'italic' },
	{ file: 'db6054d73906f6d1.woff2', weight: 500, style: 'normal' },
	{ file: '54cf3d47648cbde4.woff2', weight: 500, style: 'italic' },
	{ file: 'a9a1343791e012e7.woff2', weight: 700, style: 'normal' },
	{ file: '0137ea08b8d14fae.woff2', weight: 700, style: 'italic' },
	{ file: '83b98eb4efef82d6.woff2', weight: 900, style: 'normal' },
	{ file: '8fd873f2349d20e6.woff2', weight: 900, style: 'italic' }
] as const

/**
 * Get the base URL for font files
 * Uses AWS S3 URL when PUBLIC_SIERO_IMG_URL is set, otherwise local /fonts
 */
export function getFontBaseUrl(): string {
	const imageBaseUrl = getImageBaseUrl()
	if (imageBaseUrl) {
		return `${imageBaseUrl}/fonts`
	}
	return '/fonts'
}

/**
 * Generate @font-face CSS for all font weights/styles
 */
export function generateFontFaceCSS(): string {
	const baseUrl = getFontBaseUrl()

	return FONT_FILES.map(
		({ file, weight, style }) => `@font-face {
  font-family: 'AGrot';
  src: url('${baseUrl}/${file}') format('woff2');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`
	).join('\n\n')
}

/**
 * Get preload link tags for critical font weights (400 normal, 700 normal)
 */
export function getFontPreloadLinks(): string {
	const baseUrl = getFontBaseUrl()
	const criticalFonts = ['437fb160c86d1771.woff2', 'a9a1343791e012e7.woff2']

	return criticalFonts
		.map(
			(file) =>
				`<link rel="preload" href="${baseUrl}/${file}" as="font" type="font/woff2" crossorigin />`
		)
		.join('\n')
}
