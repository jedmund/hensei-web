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
	/** Callback to unlink all collection items from the party */
	onUnlinkCollection?: () => Promise<void>
}

export function openSearchSidebar(options: SearchSidebarOptions) {
	const { type, onAddItems, canAddMore = true, authUserId, requiredProficiencies, userElement, onUnlinkCollection } = options

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
		onUnlinkCollection
	})
}

export function closeSearchSidebar() {
	sidebar.close()
}
