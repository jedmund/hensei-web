<script lang="ts">
	import DescriptionRenderer from '$lib/components/DescriptionRenderer.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		title?: string
		description?: string
		canEdit?: boolean
		onEdit?: () => void
	}

	let { title, description, canEdit = false, onEdit }: Props = $props()
</script>

<div class="description-sidebar">
	<div class="content-section">
		<div class="content-inner">
			{#if description}
				<div class="description-content">
					<DescriptionRenderer content={description} truncate={false} />
				</div>
			{:else}
				<div class="empty-state">
					<p>No description available for this party.</p>
					{#if canEdit}
						<Button variant="primary" onclick={onEdit}>Add Description</Button>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	{#if canEdit && description}
		<div class="actions-section">
			<Button variant="secondary" onclick={onEdit} class="edit-button">Edit Description</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	.description-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: var(--text-primary);
	}

	.content-section {
		flex: 1;
		overflow-y: auto;

		// Custom scrollbar styling - on the outer container
		&::-webkit-scrollbar {
			width: 6px;
		}

		&::-webkit-scrollbar-track {
			background: var(--button-bg);
			border-radius: 3px;
		}

		&::-webkit-scrollbar-thumb {
			background: var(--text-secondary);
			border-radius: 3px;

			&:hover {
				background: var(--text-primary);
			}
		}
	}

	.content-inner {
		padding: 0 $unit-2x;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: $unit-4x;
		min-height: 200px;

		p {
			margin: 0 0 $unit-2x 0;
			color: var(--text-secondary);
			font-size: $font-regular;
		}
	}

	.actions-section {
		margin-top: $unit-2x;
		padding: $unit-2x;
		padding-bottom: $unit-2x;
		border-top: 1px solid var(--button-bg);

		:global(.edit-button) {
			width: 100%;
		}
	}
</style>
