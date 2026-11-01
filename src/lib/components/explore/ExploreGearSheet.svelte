<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { ElementType } from '$lib/utils/element'
	import type { ExploreSort } from '$lib/utils/exploreFilterParams'

	interface Props {
		open: boolean
		/** Gallery order; the sort rows show only when given */
		sort?: ExploreSort | undefined
		onSortChange?: (sort: ExploreSort) => void
		/** Whether the user is authenticated (controls collection filter visibility) */
		isAuthenticated?: boolean
		collectionFilterActive?: boolean
		onCollectionFilterChange?: (active: boolean) => void
		onAdvancedFiltersOpen?: () => void
		element?: ElementType
	}

	let {
		open = $bindable(false),
		sort,
		onSortChange,
		isAuthenticated = false,
		collectionFilterActive = $bindable(false),
		onCollectionFilterChange,
		onAdvancedFiltersOpen,
		element
	}: Props = $props()

	const sortOptions = $derived<{ value: ExploreSort; label: string }[]>([
		{ value: 'rising', label: m.explore_sort_rising() },
		{ value: 'recent', label: m.explore_sort_recent() }
	])
</script>

<BottomSheet bind:open>
	<div class="gear-sheet">
		{#if sort}
			{#each sortOptions as option (option.value)}
				<button
					class="gear-sheet-row gear-sheet-button"
					aria-pressed={sort === option.value}
					onclick={() => onSortChange?.(option.value)}
				>
					<span class="gear-sheet-label">{option.label}</span>
					{#if sort === option.value}
						<Icon name="check" size={16} />
					{/if}
				</button>
			{/each}
			<hr class="gear-sheet-separator" />
		{/if}
		{#if isAuthenticated}
			<div class="gear-sheet-row">
				<span class="gear-sheet-label">{m.explore_collection_buildable()}</span>
				<Switch
					checked={collectionFilterActive}
					onCheckedChange={(checked) => {
						collectionFilterActive = checked
						onCollectionFilterChange?.(checked)
					}}
					size="small"
					{element}
				/>
			</div>
			<hr class="gear-sheet-separator" />
		{/if}
		<button
			class="gear-sheet-row gear-sheet-button"
			onclick={() => {
				open = false
				onAdvancedFiltersOpen?.()
			}}
		>
			<span class="gear-sheet-label">{m.explore_advanced_filters()}</span>
			<Icon name="chevron-right" size={16} />
		</button>
	</div>
</BottomSheet>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.gear-sheet {
		display: flex;
		flex-direction: column;
	}

	.gear-sheet-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc($unit * 1.5) $unit;
	}

	.gear-sheet-button {
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-family);
		border-radius: $card-corner;
		color: var(--text-primary);

		&:hover {
			background: var(--menu-bg-item-hover);
		}
	}

	.gear-sheet-label {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.gear-sheet-separator {
		border: none;
		height: 2px;
		background-color: var(--separator-bg);
		border-radius: 1px;
		margin: $unit-half 0;
	}
</style>
