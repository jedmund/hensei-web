import { sidebar } from '$lib/stores/sidebar.svelte'
import DescriptionSidebar from '$lib/components/sidebar/DescriptionSidebar.svelte'

interface DescriptionSidebarOptions {
	title?: string
	description?: string
	canEdit?: boolean
	onEdit?: () => void
}

export function openDescriptionSidebar(options: DescriptionSidebarOptions) {
	const { title, description, canEdit = false, onEdit } = options

	// Open the sidebar with the party title as the header
	sidebar.openWithComponent(title, DescriptionSidebar, {
		title,
		description,
		canEdit,
		onEdit
	})
}

export function closeDescriptionSidebar() {
	sidebar.close()
}