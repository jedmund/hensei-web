import { localizedName } from '$lib/utils/locale'
import { sidebar } from '$lib/stores/sidebar.svelte'
import SubstitutionsSidebar from '$lib/components/sidebar/SubstitutionsSidebar.svelte'
import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import * as m from '$lib/paraglide/messages'

type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

const ELEMENT_MAP: Record<number, ElementName> = {
  1: 'wind',
  2: 'fire',
  3: 'water',
  4: 'earth',
  5: 'dark',
  6: 'light'
}

interface SubstitutionsSidebarOptions {
  type: 'weapon' | 'character' | 'summon'
  item: GridCharacter | GridWeapon | GridSummon
}

function getItemElement(type: 'weapon' | 'character' | 'summon', item: GridCharacter | GridWeapon | GridSummon): ElementName | undefined {
  let elementId: number | undefined

  if (type === 'character') {
    elementId = (item as GridCharacter).character?.element
  } else if (type === 'weapon') {
    const weapon = item as GridWeapon
    elementId = weapon.element || weapon.weapon?.element
  } else if (type === 'summon') {
    elementId = (item as GridSummon).summon?.element
  }

  return elementId ? ELEMENT_MAP[elementId] : undefined
}

function getName(obj: any): string {
  if (!obj) return m.substitution_title()
  const name = obj.name ?? obj
  const resolved = localizedName(name)
  return resolved === '—' ? m.substitution_title() : resolved
}

export function openSubstitutionsSidebar(options: SubstitutionsSidebarOptions) {
  const { type, item } = options
  const paneId = `substitutions-${item.id}`

  if (sidebar.paneStack.panes.some((p) => p.id === paneId)) return

  let itemName = m.substitution_title()
  if (type === 'character' && (item as GridCharacter).character) {
    itemName = getName((item as GridCharacter).character)
  } else if (type === 'weapon' && (item as GridWeapon).weapon) {
    itemName = getName((item as GridWeapon).weapon)
  } else if (type === 'summon' && (item as GridSummon).summon) {
    itemName = getName((item as GridSummon).summon)
  }

  const hasDetailsRoot = sidebar.isOpen && sidebar.paneStack.depth > 0

  const goBack = () => {
    if (hasDetailsRoot) {
      sidebar.pop()
    } else {
      sidebar.close()
    }
  }

  const paneConfig = {
    id: paneId,
    title: `${itemName} — ${m.substitution_title()}`,
    component: SubstitutionsSidebar,
    props: {
      type,
      item
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
