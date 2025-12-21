import { sidebar } from '$lib/stores/sidebar.svelte'
import DescriptionSidebar from '$lib/components/sidebar/DescriptionSidebar.svelte'

interface DescriptionSidebarOptions {
	title?: string | undefined
	description?: string | undefined
	canEdit?: boolean | undefined
	partyId?: string | undefined
	partyShortcode?: string | undefined
	onSave?: ((description: string) => Promise<void>) | undefined
}

export function openDescriptionSidebar(options: DescriptionSidebarOptions) {
	const { title, description, canEdit, partyId, partyShortcode, onSave } = options

	sidebar.openWithComponent(title ?? '', DescriptionSidebar, {
		description,
		canEdit,
		partyId,
		partyShortcode,
		onSave
	})
}

export function closeDescriptionSidebar() {
	sidebar.close()
}
