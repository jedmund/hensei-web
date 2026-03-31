<script lang="ts">
	/**
	 * EntityMentionList - Dropdown for entity mention suggestions
	 *
	 * Shows search results for characters, weapons, and summons when typing @
	 * Supports keyboard navigation and displays entity images with element colors.
	 */
	import * as m from '$lib/paraglide/messages'
	import { getBasePath } from '$lib/utils/images'
	import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'

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
		proficiency?: number | number[]
		season?: number | null
		series?: number[] | { id: string; slug: string; name: { en: string; ja: string } }[] | null
		styleSwap?: boolean
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
				en: item.nameEn ?? m.mention_unknown(),
				ja: item.nameJp ?? m.mention_unknown()
			},
			type: item.searchableType.toLowerCase(),
			element: {
				id: item.element ?? 0,
				slug: getElementSlug(item.element)
			},
			proficiency: item.proficiency,
			season: item.season,
			series: item.series as
				| number[]
				| { id: string; slug: string; name: { en: string; ja: string } }[]
				| undefined,
			styleSwap: item.styleSwap
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
		{#each items as item, index (item.searchableId)}
			<button
				type="button"
				class="mention-item"
				class:selected={index === selectedIndex}
				onclick={() => selectItem(index)}
			>
				<div class="item-image {item.searchableType.toLowerCase()}">
					<img src={getEntityImageUrl(item)} alt={item.nameEn ?? ''} loading="lazy" />
				</div>
				<div class="item-info">
					<span class="item-name">{item.nameEn ?? item.nameJp ?? m.mention_unknown()}</span>
					{#if item.searchableType === 'Character'}
						<CharacterTags
							character={{ element: item.element, season: item.season, series: item.series }}
						/>
					{/if}
				</div>
			</button>
		{/each}
	{:else}
		<div class="no-results">
			{#if query.length < 2}
				{m.mention_search_hint()}
			{:else}
				{m.mention_no_results()}
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.entity-mention-list {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		background: var(--dialog-bg);
		border: 1px solid var(--border-color);
		border-radius: $card-corner;
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		min-width: 200px;
		max-width: 300px;
		max-height: 280px;
		overflow-y: auto;
		padding: $unit-half;
	}

	.mention-item {
		display: flex;
		align-items: center;
		gap: $unit;
		width: 100%;
		padding: $unit;
		border: none;
		border-radius: $item-corner-small;
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;

		&:hover,
		&.selected {
			background: var(--typeahead-item-hover);
		}
	}

	.item-image {
		width: $unit-6x;
		height: $unit-6x;
		border-radius: $item-corner-small;
		overflow: hidden;
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $unit-quarter;
		min-width: 0;
	}

	.item-name {
		font-size: $font-regular;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.no-results {
		padding: $unit-2x;
		text-align: center;
		color: var(--text-secondary);
		font-size: $font-small;
	}
</style>
