<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		hasActiveFilters: boolean
		filterCount: number
		hasCustomColumns?: boolean
		selectedElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
		supportsCollectionFilters: boolean
		leftActions?: Snippet
		headerActions?: Snippet
		rightActions?: Snippet
		onToggleFilters: () => void
		onResetColumns?: () => void
	}

	const {
		hasActiveFilters,
		filterCount,
		hasCustomColumns = false,
		selectedElement,
		supportsCollectionFilters,
		leftActions,
		headerActions,
		rightActions,
		onToggleFilters,
		onResetColumns
	}: Props = $props()
</script>

<div class="controls">
	{#if leftActions}
		{@render leftActions()}
	{/if}

	<div class="controls-right">
		{#if headerActions}
			{@render headerActions()}
		{/if}

		{#if hasCustomColumns && onResetColumns}
			<Button
				variant="ghost"
				size="small"
				onclick={onResetColumns}
			>
				Reset columns
			</Button>
		{/if}

		{#if supportsCollectionFilters}
			<Button
				variant="ghost"
				size="small"
				onclick={onToggleFilters}
				class="filter-toggle {hasActiveFilters ? 'has-active' : ''}"
			>
				Filters
				{#if hasActiveFilters}
					<span class="filter-count {selectedElement ?? ''}">
						{filterCount}
					</span>
				{/if}
			</Button>
		{/if}

		{#if rightActions}
			{@render rightActions()}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit-2x;
		gap: spacing.$unit;

		.controls-right {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
			margin-left: auto;

			:global(.filter-toggle) {
				gap: spacing.$unit-half;

				:global(svg) {
					transition: transform 0.15s ease;
				}

				&:global(.has-active) {
					color: var(--accent-color);
				}
			}

			.filter-count {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				min-width: 18px;
				height: 18px;
				margin-left: spacing.$unit;
				padding: 0 spacing.$unit-half;
				background: var(--accent-color);
				color: white;
				font-size: 11px;
				font-weight: typography.$medium;
				border-radius: 9px;

				&:global(.wind) {
					background: var(--wind-button-bg);
				}
				&:global(.fire) {
					background: var(--fire-button-bg);
				}
				&:global(.water) {
					background: var(--water-button-bg);
				}
				&:global(.earth) {
					background: var(--earth-button-bg);
				}
				&:global(.dark) {
					background: var(--dark-button-bg);
				}
				&:global(.light) {
					background: var(--light-button-bg);
				}
			}
		}
	}
</style>
