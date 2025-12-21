import { sidebar } from '$lib/stores/sidebar.svelte'
import DescriptionSidebar from '$lib/components/sidebar/DescriptionSidebar.svelte'

interface DescriptionSidebarOptions {
	title?: string | undefined
	description?: string | undefined
}

export function openDescriptionSidebar(options: DescriptionSidebarOptions) {
	const { title, description } = options

	sidebar.openWithComponent(title ?? '', DescriptionSidebar, {
		description
	})
}

export function closeDescriptionSidebar() {
	sidebar.close()
}
