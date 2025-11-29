// Re-export types and functions from the main image utility
export {
  getPlaceholderImage as getPlaceholder,
  getCharacterImage,
  getWeaponImage,
  getSummonImage,
  getImageUrl as getImageUrlBase
} from '$lib/utils/images'

// Import types for local use and re-export
import type { ResourceType, ImageVariant } from '$lib/utils/images'
export type { ResourceType as ResourceKind, ImageVariant }

// Legacy compatibility wrapper
interface ImageArgs {
  type: 'character' | 'weapon' | 'summon'
  id?: string | null
  variant: ImageVariant
  element?: number
  pose?: string
}

export function getImageUrl({ type, id, variant, element, pose }: ImageArgs): string {
  // Import the base function to avoid circular dependency
  import('$lib/utils/images').then(({ getImageUrl: getImageUrlFromUtils }) => {
    return getImageUrlFromUtils(type, id, variant, { pose, element })
  })

  // Temporary direct implementation for sync compatibility
  if (!id) return `/images/placeholders/placeholder-${type}-${variant}.png`

  const directory = `${type}-${variant}`
  const extension = (
    (type === 'character' && variant === 'detail') ||
    (type === 'weapon' && variant === 'base') ||
    (type === 'summon' && variant === 'detail')
  ) ? '.png' : '.jpg'

  if (type === 'character') {
    return `/images/${directory}/${id}_${pose || '01'}${extension}`
  }

  if (type === 'weapon' && variant === 'grid' && element && element > 0) {
    return `/images/${directory}/${id}_${element}${extension}`
  }

  return `/images/${directory}/${id}${extension}`
}
