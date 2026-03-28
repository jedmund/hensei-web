import { localizedName } from '$lib/utils/locale'
import { sidebar } from '$lib/stores/sidebar.svelte'
import SubstitutionsSidebar from '$lib/components/sidebar/SubstitutionsSidebar.svelte'
import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import * as m from '$lib/paraglide/messages'

interface SubstitutionsSidebarOptions {
	type: 'weapon' | 'character' | 'summon'
	item: GridCharacter | GridWeapon | GridSummon
}

export function openSubstitutionsSidebar(options: SubstitutionsSidebarOptions) {
	const { type, item } = options

	const paneId = `substitutions-${item.id}`

	// Don't push duplicate
	if (sidebar.paneStack.panes.some((p) => p.id === paneId)) return

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
		title: m.substitution_substitutes(),
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
