import { sidebar } from '$lib/stores/sidebar.svelte'
import DescriptionPane from '$lib/components/sidebar/DescriptionPane.svelte'

interface DescriptionPaneOptions {
	title?: string | undefined
	description?: string | undefined
	videoUrl?: string | undefined
	canEdit?: boolean | undefined
	partyId?: string | undefined
	partyShortcode?: string | undefined
	onSave?: ((description: string) => Promise<void>) | undefined
}

export function openDescriptionPane(options: DescriptionPaneOptions) {
	const { title, description, videoUrl, canEdit, partyId, partyShortcode, onSave } = options

	sidebar.openWithComponent(title ?? '', DescriptionPane, {
		description,
		videoUrl,
		canEdit,
		partyId,
		partyShortcode,
		onSave
	})
}

export function closeDescriptionPane() {
	sidebar.close()
}
