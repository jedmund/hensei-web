declare const __BUILD_TIMESTAMP__: string

declare module '*.jpg'

declare module '*.svg' {
	import React from 'react'
	const SVG: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
	export default SVG
}

// SvelteKit environment variables type declarations
// These are populated from .env files at build time
declare module '$env/static/public' {
	export const PUBLIC_SIERO_API_URL: string
	export const PUBLIC_SIERO_IMG_URL: string
}
