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

  // Handler to go back to details view - uses pop() to return to previous pane
  const goBackToDetails = () => {
    sidebar.pop()
  }

  // Handler for save button - saves updates via partyStore
  const handleSave = async (updates: Partial<GridWeapon>) => {
    if (!weapon.id) {
      console.error('Cannot save weapon without ID')
      goBackToDetails()
      return
    }

    try {
      await partyStore.updateWeapon(String(weapon.id), updates)
      goBackToDetails()
    } catch (error) {
      console.error('Failed to save weapon:', error)
      goBackToDetails()
    }
  }

  // Push onto pane stack instead of replacing
  sidebar.push({
    id: `edit-weapon-${weapon.id}`,
    title,
    component: EditWeaponSidebar,
    props: {
      weapon,
      onSave: handleSave,
      onCancel: goBackToDetails
    },
    onback: goBackToDetails
  })
}

export function openCharacterEditSidebar(character: GridCharacter) {
  const characterName = getName(character.character)
  const title = characterName !== 'Details' ? characterName : 'Edit Character'

  // Handler to go back to details view - uses pop() to return to previous pane
  const goBackToDetails = () => {
    sidebar.pop()
  }

  // Handler for save button - saves updates via partyStore
  const handleSave = async (updates: Partial<GridCharacter>) => {
    if (!character.id) {
      console.error('Cannot save character without ID')
      goBackToDetails()
      return
    }

    try {
      await partyStore.updateCharacter(String(character.id), updates)
      goBackToDetails()
    } catch (error) {
      console.error('Failed to save character:', error)
      goBackToDetails()
    }
  }

  // Push onto pane stack instead of replacing
  sidebar.push({
    id: `edit-character-${character.id}`,
    title,
    component: EditCharacterSidebar,
    props: {
      character,
      onSave: handleSave,
      onCancel: goBackToDetails
    },
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