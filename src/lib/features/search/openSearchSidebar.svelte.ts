import { sidebar } from '$lib/stores/sidebar.svelte'
import SearchContent from '$lib/components/sidebar/SearchContent.svelte'
import type { AddItemResult } from '$lib/types/api/search'

interface SearchSidebarOptions {
	type: 'weapon' | 'character' | 'summon'
	onAddItems?: (items: AddItemResult[]) => void
	canAddMore?: boolean
	/** User ID to enable collection search mode. If not provided, only "All Items" mode is available. */
	authUserId?: string
}

export function openSearchSidebar(options: SearchSidebarOptions) {
	const { type, onAddItems, canAddMore = true, authUserId } = options

	// Open the sidebar with the search component
	const title = `Search ${type.charAt(0).toUpperCase() + type.slice(1)}s`
	sidebar.openWithComponent(title, SearchContent, {
		type,
		onAddItems,
		canAddMore,
		authUserId
	})
}

export function closeSearchSidebar() {
	sidebar.close()
}