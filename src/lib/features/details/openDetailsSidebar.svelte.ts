import { sidebar } from '$lib/stores/sidebar.svelte'
import { partyStore } from '$lib/stores/partyStore.svelte'
import DetailsSidebar from '$lib/components/sidebar/DetailsSidebar.svelte'
import EditWeaponSidebar from '$lib/components/sidebar/EditWeaponSidebar.svelte'
import EditCharacterSidebar from '$lib/components/sidebar/EditCharacterSidebar.svelte'
import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import { canWeaponBeModified, canCharacterBeModified } from '$lib/utils/modificationDetector'

interface DetailsSidebarOptions {
  type: 'weapon' | 'character' | 'summon'
  item: GridCharacter | GridWeapon | GridSummon
  onSaveWeapon?: (id: string, updates: Partial<GridWeapon>) => Promise<void>
  onSaveCharacter?: (id: string, updates: Partial<GridCharacter>) => Promise<void>
}

type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

const ELEMENT_MAP: Record<number, ElementName> = {
  1: 'wind',
  2: 'fire',
  3: 'water',
  4: 'earth',
  5: 'dark',
  6: 'light'
}

function getItemElement(type: 'weapon' | 'character' | 'summon', item: GridCharacter | GridWeapon | GridSummon): ElementName | undefined {
  let elementId: number | undefined

  if (type === 'character') {
    elementId = (item as GridCharacter).character?.element
  } else if (type === 'weapon') {
    const weapon = item as GridWeapon
    // Use grid weapon element if set, otherwise canonical weapon element
    elementId = weapon.element || weapon.weapon?.element
  } else if (type === 'summon') {
    elementId = (item as GridSummon).summon?.element
  }

  return elementId ? ELEMENT_MAP[elementId] : undefined
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

  // Check if this item can be edited
  const canEditWeapon = type === 'weapon' && canWeaponBeModified(item as GridWeapon)
  const canEditCharacter = type === 'character' && canCharacterBeModified(item as GridCharacter)
  const canEdit = canEditWeapon || canEditCharacter

  // Create edit handler for editable items
  const onsave = canEdit
    ? () => {
        if (canEditWeapon) {
          openWeaponEditSidebar(item as GridWeapon, options.onSaveWeapon)
        } else if (canEditCharacter) {
          openCharacterEditSidebar(item as GridCharacter, options.onSaveCharacter)
        }
      }
    : undefined

  // Get the element for styling
  const element = getItemElement(type, item)

  // Open the sidebar with the details component
  const title = itemName !== 'Details' ? itemName : `${type.charAt(0).toUpperCase() + type.slice(1)} Details`
  sidebar.openWithComponent(title, DetailsSidebar, {
    type,
    item
  }, {
    onsave,
    saveLabel: 'Edit',
    element
  })
}

export function openWeaponEditSidebar(weapon: GridWeapon, onSaveWeapon?: (id: string, updates: Partial<GridWeapon>) => Promise<void>) {
  const weaponName = getName(weapon.weapon)
  const title = weaponName !== 'Details' ? weaponName : 'Edit Weapon'
  const editPaneId = `edit-weapon-${weapon.id}`

  // If this edit pane is already in the stack, don't push a duplicate
  if (sidebar.paneStack.panes.some((p) => p.id === editPaneId)) return

  // Determine whether we're pushing onto an existing details view or opening fresh
  const hasDetailsRoot = sidebar.isOpen && sidebar.paneStack.depth > 0

  // Handler to go back - pops if pushed on stack, closes if opened as root
  const goBack = () => {
    if (hasDetailsRoot) {
      sidebar.pop()
    } else {
      sidebar.close()
    }
  }

  // Handler for save button - uses gridService callback if available (updates TanStack cache),
  // otherwise falls back to partyStore (which bypasses cache)
  const handleSave = async (updates: Partial<GridWeapon>) => {
    if (!weapon.id) {
      console.error('Cannot save weapon without ID')
      goBack()
      return
    }

    try {
      if (onSaveWeapon) {
        await onSaveWeapon(String(weapon.id), updates)
      } else {
        await partyStore.updateWeapon(String(weapon.id), updates)
      }
      goBack()
    } catch (error) {
      console.error('Failed to save weapon:', error)
      goBack()
    }
  }

  const paneConfig = {
    id: editPaneId,
    title,
    component: EditWeaponSidebar,
    props: {
      weapon,
      onSave: handleSave,
      onCancel: goBack
    },
    onback: goBack
  }

  if (hasDetailsRoot) {
    sidebar.push(paneConfig)
  } else {
    sidebar.paneStack.reset(paneConfig)
    sidebar.state.open = true
  }
}

export function openCharacterEditSidebar(character: GridCharacter, onSaveCharacter?: (id: string, updates: Partial<GridCharacter>) => Promise<void>) {
  const characterName = getName(character.character)
  const title = characterName !== 'Details' ? characterName : 'Edit Character'
  const editPaneId = `edit-character-${character.id}`

  // If this edit pane is already in the stack, don't push a duplicate
  if (sidebar.paneStack.panes.some((p) => p.id === editPaneId)) return

  // Determine whether we're pushing onto an existing details view or opening fresh
  const hasDetailsRoot = sidebar.isOpen && sidebar.paneStack.depth > 0

  // Handler to go back - pops if pushed on stack, closes if opened as root
  const goBack = () => {
    if (hasDetailsRoot) {
      sidebar.pop()
    } else {
      sidebar.close()
    }
  }

  // Handler for save button - uses gridService callback if available (updates TanStack cache),
  // otherwise falls back to partyStore (which bypasses cache)
  const handleSave = async (updates: Partial<GridCharacter>) => {
    if (!character.id) {
      console.error('Cannot save character without ID')
      goBack()
      return
    }

    try {
      if (onSaveCharacter) {
        await onSaveCharacter(String(character.id), updates)
      } else {
        await partyStore.updateCharacter(String(character.id), updates)
      }
      goBack()
    } catch (error) {
      console.error('Failed to save character:', error)
      goBack()
    }
  }

  const paneConfig = {
    id: editPaneId,
    title,
    component: EditCharacterSidebar,
    props: {
      character,
      onSave: handleSave,
      onCancel: goBack
    },
    onback: goBack
  }

  if (hasDetailsRoot) {
    sidebar.push(paneConfig)
  } else {
    sidebar.paneStack.reset(paneConfig)
    sidebar.state.open = true
  }
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