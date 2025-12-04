<svelte:options runes={true} />

<script lang="ts">
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { useUpdateCollectionArtifact, useDeleteCollectionArtifact } from '$lib/api/mutations/artifact.mutations'
	import { getArtifactImage } from '$lib/utils/images'
	import ArtifactEditPane from '$lib/components/artifact/ArtifactEditPane.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		artifact: CollectionArtifact
		isOwner?: boolean
		onClose?: () => void
	}

	let { artifact, isOwner = false, onClose }: Props = $props()

	// Mutations
	const updateMutation = useUpdateCollectionArtifact()
	const deleteMutation = useDeleteCollectionArtifact()

	// Image and name for header
	const imageUrl = $derived(getArtifactImage(artifact.artifact?.granblueId))
	const displayName = $derived.by(() => {
		const name = artifact.artifact?.name
		if (!name) return '—'
		if (typeof name === 'string') return name
		return name.en || name.ja || '—'
	})

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

<div class="artifact-pane">
	<!-- Header with image -->
	<div class="pane-header">
		<div class="artifact-image">
			<img src={imageUrl} alt={displayName} />
		</div>
		<h2 class="artifact-name">{displayName}</h2>
		{#if artifact.nickname}
			<p class="artifact-nickname">"{artifact.nickname}"</p>
		{/if}
	</div>

	<!-- Edit pane content -->
	<div class="pane-content">
		<ArtifactEditPane
			{artifact}
			onUpdate={isOwner ? handleUpdate : undefined}
			disabled={!isOwner}
		/>
	</div>

	<!-- Actions footer (owner only) -->
	{#if isOwner}
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
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.artifact-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.pane-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: $unit-2x;
		border-bottom: 1px solid var(--border-secondary);
	}

	.artifact-image {
		width: 80px;
		height: 80px;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
		margin-bottom: $unit;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.artifact-name {
		margin: 0;
		font-size: $font-large;
		font-weight: $bold;
		color: var(--text-primary);
		text-align: center;
	}

	.artifact-nickname {
		margin: $unit-half 0 0;
		font-size: $font-small;
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
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
