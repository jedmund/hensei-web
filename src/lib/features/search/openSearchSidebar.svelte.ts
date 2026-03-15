import { sidebar } from '$lib/stores/sidebar.svelte'
import SearchContent from '$lib/components/sidebar/SearchContent.svelte'
import GuidebookSearchContent from '$lib/components/sidebar/GuidebookSearchContent.svelte'
import type { AddItemResult } from '$lib/types/api/search'
import type { SearchResult } from '$lib/api/adapters/search.adapter'

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
	/** Callback to unlink all collection items from the party */
	onUnlinkCollection?: () => Promise<void>
	/** Username to pre-populate collection source from an external user */
	initialCollectionSourceUsername?: string
}

export function openSearchSidebar(options: SearchSidebarOptions) {
	const { type, onAddItems, canAddMore = true, authUserId, requiredProficiencies, userElement, onUnlinkCollection, initialCollectionSourceUsername } = options

	// If sidebar is already open with SearchContent for the same entity type,
	// update props without remounting to preserve filter state
	const currentPane = sidebar.paneStack.currentPane
	if (
		sidebar.isOpen &&
		currentPane?.component === SearchContent &&
		currentPane?.props?.type === type
	) {
		sidebar.paneStack.updateCurrentProps({
			onAddItems,
			canAddMore,
			requiredProficiencies
		})
		return
	}

	// Open the sidebar with the search component
	const title = `Search ${type.charAt(0).toUpperCase() + type.slice(1)}s`
	sidebar.openWithComponent(title, SearchContent, {
		type,
		onAddItems,
		canAddMore,
		authUserId,
		requiredProficiencies,
		userElement,
		onUnlinkCollection,
		initialCollectionSourceUsername
	})
}

interface GuidebookSearchSidebarOptions {
	/** Guidebook position (1, 2, or 3) */
	position: number
	/** Callback when a guidebook is selected */
	onSelect: (guidebook: SearchResult) => void
}

export function openGuidebookSearchSidebar(options: GuidebookSearchSidebarOptions) {
	const { position, onSelect } = options

	sidebar.openWithComponent('Search Guidebooks', GuidebookSearchContent, {
		position,
		onSelect: (guidebook: SearchResult) => {
			onSelect(guidebook)
			sidebar.close()
		}
	})
}

export function closeSearchSidebar() {
	sidebar.close()
}
