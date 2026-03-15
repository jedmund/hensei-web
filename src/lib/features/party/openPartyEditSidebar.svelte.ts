import { sidebar } from '$lib/stores/sidebar.svelte'
import EditPartyPane, {
	type PartyEditValues
} from '$lib/components/sidebar/EditPartyPane.svelte'

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

	sidebar.openWithComponent('Edit Team Settings', EditPartyPane, {
		initialValues,
		element,
		onSave
	})
}

export function closePartyEditSidebar() {
	sidebar.close()
}

export type { PartyEditValues }
