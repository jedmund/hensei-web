<script lang="ts">
	/**
	 * EntityMentionList - Dropdown for entity mention suggestions
	 *
	 * Shows search results for characters, weapons, and summons when typing @
	 * Supports keyboard navigation and displays entity images with element colors.
	 */
	import { getBasePath } from '$lib/utils/images'
	import { getElementClass } from '$lib/utils/element'
	import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'

	interface Props {
		items: UnifiedSearchResult[]
		command: (item: EntityMentionData) => void
		query: string
	}

	/** Data structure passed to the mention command */
	export interface EntityMentionData {
		granblue_id: string
		name: { en: string; ja: string }
		type: string
		element: { id: number; slug: string }
	}

	let { items, command, query }: Props = $props()

	let selectedIndex = $state(0)

	// Reset selection when items change
	$effect(() => {
		void items
		selectedIndex = 0
	})

	function getEntityImageUrl(item: UnifiedSearchResult): string {
		const base = getBasePath()
		const type = item.searchableType.toLowerCase()
		const id = item.granblueId

		if (type === 'character') {
			return `${base}/character-square/${id}_01.jpg`
		}
		return `${base}/${type}-square/${id}.jpg`
	}

	function getElementSlug(element?: number): string {
		const slugs: Record<number, string> = {
			0: 'null',
			1: 'wind',
			2: 'fire',
			3: 'water',
			4: 'earth',
			5: 'dark',
			6: 'light'
		}
		return slugs[element ?? 0] ?? 'null'
	}

	function selectItem(index: number) {
		const item = items[index]
		if (!item) return

		command({
			granblue_id: item.granblueId,
			name: {
				en: item.nameEn ?? 'Unknown',
				ja: item.nameJp ?? 'Unknown'
			},
			type: item.searchableType.toLowerCase(),
			element: {
				id: item.element ?? 0,
				slug: getElementSlug(item.element)
			}
		})
	}

	function upHandler() {
		selectedIndex = (selectedIndex + items.length - 1) % items.length
	}

	function downHandler() {
		selectedIndex = (selectedIndex + 1) % items.length
	}

	function enterHandler() {
		selectItem(selectedIndex)
	}

	/** Exposed for keyboard handling from suggestion plugin */
	export function onKeyDown(event: KeyboardEvent): boolean {
		if (event.key === 'ArrowUp') {
			upHandler()
			return true
		}
		if (event.key === 'ArrowDown') {
			downHandler()
			return true
		}
		if (event.key === 'Enter') {
			enterHandler()
			return true
		}
		return false
	}
</script>

<div class="entity-mention-list">
	{#if items.length > 0}
		{#each items as item, index}
			<button
				type="button"
				class="mention-item"
				class:selected={index === selectedIndex}
				class:element-wind={item.element === 1}
				class:element-fire={item.element === 2}
				class:element-water={item.element === 3}
				class:element-earth={item.element === 4}
				class:element-dark={item.element === 5}
				class:element-light={item.element === 6}
				onclick={() => selectItem(index)}
			>
				<div class="item-image {item.searchableType.toLowerCase()}">
					<img src={getEntityImageUrl(item)} alt={item.nameEn ?? ''} loading="lazy" />
				</div>
				<span class="item-name">{item.nameEn ?? item.nameJp ?? 'Unknown'}</span>
			</button>
		{/each}
	{:else}
		<div class="no-results">
			{#if query.length < 2}
				Type at least 2 characters to search
			{:else}
				No results found
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.entity-mention-list {
		background: var(--dialog-bg);
		border: 1px solid var(--border-color);
		border-radius: $card-corner;
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		min-width: 200px;
		max-width: 300px;
		max-height: 280px;
		overflow-y: auto;
	}

	.mention-item {
		display: flex;
		align-items: center;
		gap: $unit;
		width: 100%;
		padding: $unit $unit-2x;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;

		&:hover,
		&.selected {
			background: var(--option-bg-hover);
		}
	}

	.item-image {
		width: 32px;
		height: 32px;
		border-radius: $item-corner-small;
		overflow: hidden;
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		&.character {
			border-radius: 50%;
		}
	}

	.item-name {
		flex: 1;
		font-size: $font-regular;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	// Element indicator on hover/selection
	.mention-item {
		border-left: 3px solid transparent;

		&.element-wind.selected,
		&.element-wind:hover {
			border-left-color: $wind-bg-00;
		}
		&.element-fire.selected,
		&.element-fire:hover {
			border-left-color: $fire-bg-00;
		}
		&.element-water.selected,
		&.element-water:hover {
			border-left-color: $water-bg-00;
		}
		&.element-earth.selected,
		&.element-earth:hover {
			border-left-color: $earth-bg-00;
		}
		&.element-dark.selected,
		&.element-dark:hover {
			border-left-color: $dark-bg-00;
		}
		&.element-light.selected,
		&.element-light:hover {
			border-left-color: $light-bg-00;
		}
	}

	.no-results {
		padding: $unit-2x;
		text-align: center;
		color: var(--text-secondary);
		font-size: $font-small;
	}
</style>
