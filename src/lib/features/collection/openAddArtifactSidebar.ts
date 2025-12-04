import { sidebar } from '$lib/stores/sidebar.svelte'
import AddArtifactSidebar from '$lib/components/sidebar/AddArtifactSidebar.svelte'

/**
 * Opens the Add Artifact sidebar for adding a new artifact to the collection.
 *
 * Uses the pane stack pattern - the root pane allows artifact selection and
 * configuration, with skill modifier selection pushing additional panes.
 */
export function openAddArtifactSidebar(options?: { onSuccess?: () => void }) {
	const handleClose = () => {
		sidebar.close()
	}

	sidebar.openWithComponent('Add Artifact', AddArtifactSidebar, {
		onSuccess: options?.onSuccess,
		onClose: handleClose
	})
}

export function closeAddArtifactSidebar() {
	sidebar.close()
}
