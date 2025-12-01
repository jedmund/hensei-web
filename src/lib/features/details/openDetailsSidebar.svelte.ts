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
          openWeaponEditSidebar(item as GridWeapon)
        } else if (canEditCharacter) {
          openCharacterEditSidebar(item as GridCharacter)
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

export function openWeaponEditSidebar(weapon: GridWeapon) {
  const weaponName = getName(weapon.weapon)
  const title = weaponName !== 'Details' ? weaponName : 'Edit Weapon'

  // Get element for styling
  const element = getItemElement('weapon', weapon)

  // Keep track of the current weapon state for going back to details
  let currentWeapon = weapon

  // Handler to go back to details view
  const goBackToDetails = () => {
    // Get the updated weapon from the store if available
    const updated = partyStore.getWeapon(weapon.id)
    openDetailsSidebar({ type: 'weapon', item: updated ?? currentWeapon })
  }

  // Handler for save button - saves updates via partyStore
  const handleSave = async (updates: Partial<GridWeapon>) => {
    if (!weapon.id) {
      console.error('Cannot save weapon without ID')
      goBackToDetails()
      return
    }

    try {
      const updated = await partyStore.updateWeapon(String(weapon.id), updates)
      currentWeapon = updated
      goBackToDetails()
    } catch (error) {
      console.error('Failed to save weapon:', error)
      // Still go back on error - the optimistic update will be visible
      goBackToDetails()
    }
  }

  sidebar.openWithComponent(title, EditWeaponSidebar, {
    weapon,
    onSave: handleSave,
    onCancel: goBackToDetails
  }, {
    element,
    onback: goBackToDetails
  })
}

export function openCharacterEditSidebar(character: GridCharacter) {
  const characterName = getName(character.character)
  const title = characterName !== 'Details' ? characterName : 'Edit Character'

  // Get element for styling
  const element = getItemElement('character', character)

  // Keep track of the current character state for going back to details
  let currentCharacter = character

  // Handler to go back to details view
  const goBackToDetails = () => {
    // Get the updated character from the store if available
    const updated = partyStore.getCharacter(character.id)
    openDetailsSidebar({ type: 'character', item: updated ?? currentCharacter })
  }

  // Handler for save button - saves updates via partyStore
  const handleSave = async (updates: Partial<GridCharacter>) => {
    if (!character.id) {
      console.error('Cannot save character without ID')
      goBackToDetails()
      return
    }

    try {
      const updated = await partyStore.updateCharacter(String(character.id), updates)
      currentCharacter = updated
      goBackToDetails()
    } catch (error) {
      console.error('Failed to save character:', error)
      // Still go back on error - the optimistic update will be visible
      goBackToDetails()
    }
  }

  sidebar.openWithComponent(title, EditCharacterSidebar, {
    character,
    onSave: handleSave,
    onCancel: goBackToDetails
  }, {
    element,
    onback: goBackToDetails
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