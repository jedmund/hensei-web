import { sidebar } from '$lib/stores/sidebar.svelte'
import PartyEditSidebar, {
	type PartyEditValues
} from '$lib/components/sidebar/PartyEditSidebar.svelte'

type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

interface PartyEditSidebarOptions {
	/** Current party values for editing */
	initialValues: PartyEditValues
	/** Party element for switch theming */
	element?: ElementType
	/** Callback when user saves changes */
	onSave: (values: PartyEditValues) => void
}

/**
 * Opens the party edit sidebar for editing battle settings, performance metrics, and video URL.
 */
export function openPartyEditSidebar(options: PartyEditSidebarOptions) {
	const { initialValues, element, onSave } = options

	sidebar.openWithComponent('Edit Party Settings', PartyEditSidebar, {
		initialValues,
		element,
		onSave
	})
}

export function closePartyEditSidebar() {
	sidebar.close()
}

export type { PartyEditValues }
