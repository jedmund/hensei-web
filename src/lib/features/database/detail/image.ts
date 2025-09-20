export type ResourceKind = 'character' | 'weapon' | 'summon'
export type ImageVariant = 'main' | 'grid' | 'square'

function folder(type: ResourceKind, variant: ImageVariant) {
  // Folders are kebab-case: e.g. weapon-main, summon-grid
  if (type === 'character') {
    if (variant === 'main') return 'character-main'
    if (variant === 'grid') return 'character-grid'
    return 'character-square'
  }
  return `${type}-${variant}` // weapon-main, summon-grid, weapon-square, etc.
}

export function getPlaceholder(type: ResourceKind, variant: ImageVariant): string {
  // Try specific placeholder; fall back to -main if others are unavailable
  const specific = `/images/placeholders/placeholder-${type}-${variant}.png`
  if (variant !== 'main') return specific
  return specific
}

interface ImageArgs {
  type: ResourceKind
  id?: string | null
  variant: ImageVariant
  element?: number // only used for weapon grid element-specific variants
  pose?: string // character pose suffix like '01', '02'
}

export function getImageUrl({ type, id, variant, element, pose }: ImageArgs): string {
  if (!id) return getPlaceholder(type, variant)

  const base = `/images/${folder(type, variant)}`

  if (type === 'character') {
    // Characters include pose suffix in filenames; default to 01
    const suffix = `_${pose || '01'}`
    return `${base}/${id}${suffix}.jpg`
  }

  if (type === 'weapon' && variant === 'grid' && element && element > 0) {
    // Support element-specific grid images when provided
    return `${base}/${id}_${element}.jpg`
  }

  return `${base}/${id}.jpg`
}

// Convenience wrappers
export const getCharacterImage = (id?: string | null, pose?: string, variant: ImageVariant = 'main') =>
  getImageUrl({ type: 'character', id: id ?? undefined, variant, pose })

export const getWeaponImage = (id?: string | null, variant: ImageVariant = 'main', element?: number) =>
  getImageUrl({ type: 'weapon', id: id ?? undefined, variant, element })

export const getSummonImage = (id?: string | null, variant: ImageVariant = 'main') =>
  getImageUrl({ type: 'summon', id: id ?? undefined, variant })
