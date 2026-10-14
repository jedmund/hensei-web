import { sidebar } from '$lib/stores/sidebar.svelte'
import EditPartyPane, {
	type PartyEditValues,
	type SolomonisDetailsLink
} from '$lib/components/sidebar/EditPartyPane.svelte'

type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

interface PartyEditSidebarOptions {
	/** Current party values for editing */
	initialValues: PartyEditValues
	/** Party element for switch theming */
	element?: ElementType
	/** Callback when user saves changes */
	onSave: (values: PartyEditValues) => void
	/** Callback to save description independently */
	onDescriptionSave?: (content: string) => Promise<void>
	/** Evoking Solomonis parties: the row that opens the details pane */
	solomonisDetails?: SolomonisDetailsLink
}

/**
 * Opens the party edit sidebar for editing battle settings, performance metrics, and video URL.
 */
export function openPartyEditSidebar(options: PartyEditSidebarOptions) {
	const { initialValues, element, onSave, onDescriptionSave, solomonisDetails } = options

	sidebar.openWithComponent('Edit Team Settings', EditPartyPane, {
		initialValues,
		element,
		onSave,
		onDescriptionSave,
		solomonisDetails
	})
}

export function closePartyEditSidebar() {
	sidebar.close()
}

export type { PartyEditValues }
