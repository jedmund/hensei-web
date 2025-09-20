import { sidebar } from '$lib/stores/sidebar.svelte'
import SearchContent from '$lib/components/sidebar/SearchContent.svelte'
import type { SearchResult } from '$lib/api/adapters/search.adapter'

interface SearchSidebarOptions {
	type: 'weapon' | 'character' | 'summon'
	onAddItems?: (items: SearchResult[]) => void
	canAddMore?: boolean
}

export function openSearchSidebar(options: SearchSidebarOptions) {
	const { type, onAddItems, canAddMore = true } = options

	// Open the sidebar with the search component
	const title = `Search ${type.charAt(0).toUpperCase() + type.slice(1)}s`
	sidebar.openWithComponent(title, SearchContent, {
		type,
		onAddItems,
		canAddMore
	})
}

export function closeSearchSidebar() {
	sidebar.close()
}