import { sidebar } from '$lib/stores/sidebar.svelte'
import DetailsSidebar from '$lib/components/sidebar/DetailsSidebar.svelte'
import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'

interface DetailsSidebarOptions {
  type: 'weapon' | 'character' | 'summon'
  item: GridCharacter | GridWeapon | GridSummon
}

export function openDetailsSidebar(options: DetailsSidebarOptions) {
  const { type, item } = options

  // Get the item name for the title
  let itemName = 'Details'
  if (type === 'character' && (item as GridCharacter).character) {
    const char = (item as GridCharacter).character
    itemName = getName(char)
  } else if (type === 'weapon' && (item as GridWeapon).weapon) {
    const weapon = (item as GridWeapon).weapon
    itemName = getName(weapon)
  } else if (type === 'summon' && (item as GridSummon).summon) {
    const summon = (item as GridSummon).summon
    itemName = getName(summon)
  }

  // Open the sidebar with the details component
  const title = itemName !== 'Details' ? itemName : `${type.charAt(0).toUpperCase() + type.slice(1)} Details`
  sidebar.openWithComponent(title, DetailsSidebar, {
    type,
    item
  })
}

function getName(obj: any): string {
  if (!obj) return 'Details'
  const name = obj.name ?? obj
  if (typeof name === 'string') return name
  if (name && typeof name === 'object') {
    return name.en || name.ja || 'Details'
  }
  return 'Details'
}

export function closeDetailsSidebar() {
  sidebar.close()
}