<script lang="ts">
	/**
	 * The Gallery's order (Rising or Most recent) and, when signed in, the
	 * "only teams I can build" modifier. The trigger tints with the user's
	 * element while the modifier is on.
	 */
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import CollectionFilterButton from '$lib/components/explore/CollectionFilterButton.svelte'
	import type { ExploreSort } from '$lib/utils/exploreFilterParams'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		sort: ExploreSort
		onSortChange: (sort: ExploreSort) => void
		collectionFilterActive: boolean
		onCollectionFilterChange: (active: boolean) => void
		/** Whether to offer the collection modifier (signed in) */
		showCollectionFilter?: boolean
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	}

	const {
		sort,
		onSortChange,
		collectionFilterActive,
		onCollectionFilterChange,
		showCollectionFilter = false,
		element
	}: Props = $props()

	const sortOptions = $derived<{ value: ExploreSort; label: string }[]>([
		{ value: 'rising', label: m.explore_sort_rising() },
		{ value: 'recent', label: m.explore_sort_recent() }
	])
	const sortLabel = $derived(sortOptions.find((o) => o.value === sort)?.label ?? '')
	const modifierActive = $derived(showCollectionFilter && collectionFilterActive)
</script>

<DropdownMenu align="end">
	{#snippet trigger({ props })}
		<CollectionFilterButton
			{...props}
			active={modifierActive}
			{element}
			rightIcon="chevron-down-small"
		>
			{sortLabel}
		</CollectionFilterButton>
	{/snippet}

	{#snippet menu()}
		<DropdownMenuBase.RadioGroup
			value={sort}
			onValueChange={(value) => onSortChange(value as ExploreSort)}
		>
			{#each sortOptions as option (option.value)}
				<DropdownMenuBase.RadioItem value={option.value} class="dropdown-menu-item">
					{#snippet children({ checked })}
						{option.label}
						{#if checked}
							<span class="dropdown-menu-check"><Icon name="check" size={14} /></span>
						{/if}
					{/snippet}
				</DropdownMenuBase.RadioItem>
			{/each}
		</DropdownMenuBase.RadioGroup>

		{#if showCollectionFilter}
			<DropdownMenuBase.Separator class="dropdown-menu-separator" />
			<DropdownMenuBase.CheckboxItem
				checked={collectionFilterActive}
				onCheckedChange={onCollectionFilterChange}
				closeOnSelect={false}
				class="dropdown-menu-item"
			>
				{#snippet children({ checked })}
					{m.explore_collection_buildable()}
					{#if checked}
						<span class="dropdown-menu-check"><Icon name="check" size={14} /></span>
					{/if}
				{/snippet}
			</DropdownMenuBase.CheckboxItem>
		{/if}
	{/snippet}
</DropdownMenu>
