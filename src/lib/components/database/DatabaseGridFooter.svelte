<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		currentPage: number
		totalPages: number
		total: number
		startItem: number
		endItem: number
		onPrevPage: () => void
		onNextPage: () => void
	}

	const {
		currentPage,
		totalPages,
		total,
		startItem,
		endItem,
		onPrevPage,
		onNextPage
	}: Props = $props()
</script>

<div class="grid-footer">
	<div class="pagination-info">
		{#if total > 0}
			Showing {startItem} to {endItem} of {total} entries
		{:else}
			No entries found
		{/if}
	</div>

	<div class="pagination-controls">
		<Button variant="ghost" size="small" onclick={onPrevPage} disabled={currentPage <= 1}>
			Previous
		</Button>

		<span class="page-display">
			Page {currentPage} of {totalPages}
		</span>

		<Button variant="ghost" size="small" onclick={onNextPage} disabled={currentPage >= totalPages}>
			Next
		</Button>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.grid-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit-2x;
		border-top: 1px solid var(--border-subtle);
		background: var(--bar-bg);

		.pagination-info {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}

		.pagination-controls {
			display: flex;
			align-items: center;
			gap: spacing.$unit;

			.page-display {
				font-size: typography.$font-small;
				color: var(--text-primary);
				min-width: 100px;
				text-align: center;
			}
		}
	}
</style>
