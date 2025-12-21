<script lang="ts">
	import DescriptionRenderer from '$lib/components/DescriptionRenderer.svelte'

	interface Props {
		description?: string
	}

	let { description }: Props = $props()
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
				</div>
			{/if}
		</div>
	</div>
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
			margin: 0;
			color: var(--text-secondary);
			font-size: $font-regular;
		}
	}
</style>
