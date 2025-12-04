<svelte:options runes={true} />

<script lang="ts">
	/**
	 * CollectionArtifactEditPane - Edit pane for modifying artifact properties
	 *
	 * Pushed onto pane stack from CollectionArtifactDetailPane.
	 * Handles saving and deleting artifacts.
	 */
	import { onMount, untrack } from 'svelte'
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { useUpdateCollectionArtifact } from '$lib/api/mutations/artifact.mutations'
	import { usePaneStack, type ElementType } from '$lib/stores/paneStack.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import ArtifactEditPane from '$lib/components/artifact/ArtifactEditPane.svelte'

	interface Props {
		artifact: CollectionArtifact
	}

	let { artifact }: Props = $props()

	const paneStack = usePaneStack()

	// Mutations
	const updateMutation = useUpdateCollectionArtifact()

	// Track pending changes
	let pendingUpdates = $state<Partial<CollectionArtifact> | null>(null)
	let hasChanges = $derived(pendingUpdates !== null)

	// Convert numeric element to ElementType string
	const elementNames: Record<number, ElementType> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementType = $derived(elementNames[artifact.element] ?? undefined)

	// Handle updates from ArtifactEditPane (store locally until save)
	function handleUpdate(updates: Partial<CollectionArtifact>) {
		pendingUpdates = { ...pendingUpdates, ...updates }
	}

	// Handle save
	function handleSave() {
		if (!pendingUpdates) return

		updateMutation.mutate({
			id: artifact.id,
			input: {
				element: pendingUpdates.element,
				level: pendingUpdates.level,
				proficiency: pendingUpdates.proficiency,
				skill1: pendingUpdates.skills?.[0] ?? undefined,
				skill2: pendingUpdates.skills?.[1] ?? undefined,
				skill3: pendingUpdates.skills?.[2] ?? undefined,
				skill4: pendingUpdates.skills?.[3] ?? undefined
			}
		}, {
			onSuccess: () => {
				paneStack.pop()
			}
		})
	}

	// Set up header action (Save button always visible, disabled when no changes)
	function updateHeader() {
		const canSave = hasChanges && !updateMutation.isPending
		sidebar.setAction(canSave ? handleSave : undefined, 'Save', elementType)
	}

	onMount(() => {
		updateHeader()
		return () => sidebar.clearAction()
	})

	// Reactively update header when state changes
	$effect(() => {
		const _ = [hasChanges, updateMutation.isPending]
		untrack(() => updateHeader())
	})
</script>

<div class="artifact-edit-pane">
	<ArtifactEditPane
		{artifact}
		onUpdate={handleUpdate}
	/>
</div>

<style lang="scss">
	.artifact-edit-pane {
		height: 100%;
	}
</style>
