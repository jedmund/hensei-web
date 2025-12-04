<svelte:options runes={true} />

<script lang="ts">
	/**
	 * CollectionArtifactEditPane - Edit pane for modifying artifact properties
	 *
	 * Pushed onto pane stack from CollectionArtifactDetailPane.
	 * Handles saving and deleting artifacts.
	 */
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { useUpdateCollectionArtifact, useDeleteCollectionArtifact } from '$lib/api/mutations/artifact.mutations'
	import { usePaneStack } from '$lib/stores/paneStack.svelte'
	import ArtifactEditPane from '$lib/components/artifact/ArtifactEditPane.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		artifact: CollectionArtifact
		onClose?: () => void
	}

	let { artifact, onClose }: Props = $props()

	const paneStack = usePaneStack()

	// Mutations
	const updateMutation = useUpdateCollectionArtifact()
	const deleteMutation = useDeleteCollectionArtifact()

	// Handle updates from ArtifactEditPane
	function handleUpdate(updates: Partial<CollectionArtifact>) {
		updateMutation.mutate({
			id: artifact.id,
			input: {
				element: updates.element,
				level: updates.level,
				proficiency: updates.proficiency,
				skill1: updates.skills?.[0] ?? undefined,
				skill2: updates.skills?.[1] ?? undefined,
				skill3: updates.skills?.[2] ?? undefined,
				skill4: updates.skills?.[3] ?? undefined
			}
		})
	}

	// Handle delete
	function handleDelete() {
		if (confirm('Are you sure you want to delete this artifact from your collection?')) {
			deleteMutation.mutate(artifact.id, {
				onSuccess: () => {
					onClose?.()
				}
			})
		}
	}
</script>

<div class="artifact-edit-pane">
	<!-- Edit pane content -->
	<div class="pane-content">
		<ArtifactEditPane
			{artifact}
			onUpdate={handleUpdate}
		/>
	</div>

	<!-- Actions footer -->
	<div class="pane-footer">
		<Button
			variant="destructive"
			size="small"
			onclick={handleDelete}
			disabled={deleteMutation.isPending}
		>
			{deleteMutation.isPending ? 'Deleting...' : 'Delete'}
		</Button>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.artifact-edit-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.pane-content {
		flex: 1;
		overflow-y: auto;
	}

	.pane-footer {
		display: flex;
		justify-content: center;
		padding: $unit-2x;
		border-top: 1px solid var(--border-secondary);
		flex-shrink: 0;
	}
</style>
