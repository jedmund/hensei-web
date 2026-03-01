import { sidebar } from '$lib/stores/sidebar.svelte'
import SearchContent from '$lib/components/sidebar/SearchContent.svelte'
import type { AddItemResult } from '$lib/types/api/search'

interface SearchSidebarOptions {
	type: 'weapon' | 'character' | 'summon'
	onAddItems?: (items: AddItemResult[]) => void
	canAddMore?: boolean
	/** User ID to enable collection search mode. If not provided, only "All Items" mode is available. */
	authUserId?: string
	/** Required proficiencies for mainhand weapon selection */
	requiredProficiencies?: number[]
	/** User's element for styling the collection toggle */
	userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
}

export function openSearchSidebar(options: SearchSidebarOptions) {
	const { type, onAddItems, canAddMore = true, authUserId, requiredProficiencies, userElement } = options

	// Open the sidebar with the search component
	const title = `Search ${type.charAt(0).toUpperCase() + type.slice(1)}s`
	sidebar.openWithComponent(title, SearchContent, {
		type,
		onAddItems,
		canAddMore,
		authUserId,
		requiredProficiencies,
		userElement
	})
}

export function closeSearchSidebar() {
	sidebar.close()
}