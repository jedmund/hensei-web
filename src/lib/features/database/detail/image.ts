// Re-export types and functions from the main image utility
export {
	getPlaceholderImage as getPlaceholder,
	getImageUrl as getImageUrlBase,
	getBasePath
} from '$lib/utils/images/core'
export { getCharacterImage } from '$lib/utils/images/characters'
export { getWeaponImage } from '$lib/utils/images/weapons'
export { getSummonImage } from '$lib/utils/images/summons'

// Import types for local use and re-export
import type { ResourceType, ImageVariant } from '$lib/utils/images/core'
export type { ResourceType as ResourceKind, ImageVariant }

// Import the base function for the legacy wrapper
import { getImageUrl as getImageUrlFromUtils } from '$lib/utils/images/core'

// Legacy compatibility wrapper
interface ImageArgs {
	type: 'character' | 'weapon' | 'summon'
	id?: string | null
	variant: ImageVariant
	element?: number
	pose?: string
}

export function getImageUrl({ type, id, variant, element, pose }: ImageArgs): string {
	return getImageUrlFromUtils(type, id, variant, { pose, element })
}
