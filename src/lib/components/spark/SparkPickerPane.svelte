<!-- SparkPickerPane - Sidebar pane for adding to a spark: every SSR character, weapon and summon as art, newest first, in tabs with a search. A weapon adds its character. -->

<script lang="ts">
	import { untrack } from 'svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import SparkTile from '$lib/components/spark/SparkTile.svelte'
	import { setDragDropContext } from '$lib/composables/drag-drop.svelte'
	import {
		itemDragType,
		SPARK_PICKER,
		type SparkDrag,
		type SparkDragItem
	} from '$lib/features/spark/drag'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import {
		gachaItemKind,
		gachaItemMatches,
		gachaItemName,
		newestGachaItemsFirst
	} from '$lib/utils/gacha'
	import { inPool, releasedBy } from '$lib/features/spark/pools'
	import type { CatalogueItem } from '$lib/types/gacha'

	interface Props {
		/** The catalogue, read when it's needed, since it can still be loading */
		items: () => CatalogueItem[]
		loading: () => boolean
		onAdd: (item: CatalogueItem) => void
		/** The page's drag-and-drop context, so art drags from here into the spark */
		drag: SparkDrag
		/** The tab to open on: summons from a summon slot, characters otherwise */
		initialTab?: 'character' | 'summon'
		/** The spark's pool, season and date, to show only what the gacha offered; read live */
		pool: () => { pool: string | null; season: string | null; date: string | null }
		/** The viewer's element, which colors the keyboard selection; read live */
		userElement?: () => string | undefined
	}

	let {
		items,
		loading,
		onAdd,
		drag,
		initialTab = 'character',
		pool,
		userElement = () => undefined
	}: Props = $props()

	// The sidebar renders outside the page's component tree, so the context
	// is set again here for DraggableItem to find it
	// svelte-ignore state_referenced_locally
	setDragDropContext(drag)

	// Weapons are the characters' weapons, shown as the weapon's own art; the
	// spark records the character either way
	const dragItem = (item: CatalogueItem): SparkDragItem => ({ id: item.identity, item })

	type Tab = 'character' | 'weapon' | 'summon'
	// svelte-ignore state_referenced_locally
	let tab = $state<Tab>(initialTab)
	const kind = $derived(tab === 'summon' ? 'summon' : 'character')
	const art = $derived(tab === 'weapon' ? 'weapon' : 'character')

	// On the weapons tab the weapon's name leads and its character follows
	const characterName = (item: CatalogueItem) => gachaItemName(item, getLocale())
	function label(item: CatalogueItem) {
		if (tab !== 'weapon') return characterName(item)
		return (getLocale() === 'ja' && item.name.ja) || item.name.en
	}
	let query = $state('')
	// Elements to show; none picked shows them all
	let elements = $state<number[]>([])
	let scrolled = $state(false)

	const shown = $derived.by(() => {
		const q = query.trim().toLowerCase()
		return items()
			.filter(
				(item) =>
					gachaItemKind(item) === kind &&
					releasedBy(item, pool().date) &&
					inPool(item, pool().pool, pool().season, pool().date) &&
					(elements.length === 0 || elements.includes(item.element)) &&
					gachaItemMatches(item, q)
			)
			.sort(newestGachaItemsFirst(getLocale()))
	})

	// Keyboard: typing highlights the first result and Enter adds it; Down
	// moves into the grid, where the arrows move, Enter adds and goes back to
	// a cleared search, and Escape (or Up from the top row) goes back to the
	// search as it was
	const COLUMNS = 3
	let controls = $state<HTMLElement>()
	let grid = $state<HTMLElement>()
	/** The highlighted result while typing, or the focused one in the grid */
	let active = $state(-1)

	// A new search, tab, filter, pool or date, or the catalogue arriving,
	// starts again from the first result. Keyed on those, not on the results, which are rebuilt whenever
	// the spark changes (e.g. after each add) and would pull the selection back.
	const searchKey = $derived(
		JSON.stringify([query, tab, elements, pool().pool, pool().season, pool().date, loading()])
	)
	$effect(() => {
		void searchKey
		active = untrack(() => (query.trim() && shown.length > 0 ? 0 : -1))
	})

	const searchInput = () => controls?.querySelector<HTMLInputElement>('input') ?? null

	function focusResult(index: number) {
		active = index
		const button = grid?.querySelectorAll<HTMLButtonElement>('button.result')[index]
		button?.focus()
		button?.scrollIntoView({ block: 'nearest' })
	}

	function backToSearch() {
		active = query.trim() && shown.length > 0 ? 0 : -1
		searchInput()?.focus()
	}

	function onSearchKeydown(event: KeyboardEvent) {
		if (event.isComposing || shown.length === 0) return
		if (event.key === 'Enter' && active >= 0) {
			event.preventDefault()
			const item = shown[active]
			if (item) onAdd(item)
			// Ready for the next name
			query = ''
		} else if (event.key === 'ArrowDown') {
			event.preventDefault()
			focusResult(Math.max(active, 0))
		}
	}

	// A click anywhere else in the pane focuses the pane, so the arrow keys
	// pick up in the results
	function onPaneKeydown(event: KeyboardEvent) {
		if (event.target !== event.currentTarget || shown.length === 0) return
		if (event.key.startsWith('Arrow')) {
			event.preventDefault()
			focusResult(Math.max(active, 0))
		} else if (event.key === 'Escape') {
			event.preventDefault()
			event.stopPropagation()
			backToSearch()
		}
	}

	function onGridKeydown(event: KeyboardEvent, index: number) {
		const last = shown.length - 1
		const moves: Record<string, number> = {
			ArrowLeft: index - 1,
			ArrowRight: index + 1,
			ArrowUp: index - COLUMNS,
			ArrowDown: index + COLUMNS
		}
		if (event.key === 'Enter') {
			// Add it and start the next search, as Enter from the search does
			event.preventDefault()
			const item = shown[index]
			if (item) onAdd(item)
			query = ''
			searchInput()?.focus()
		} else if (event.key === 'Escape' || (event.key === 'ArrowUp' && index < COLUMNS)) {
			event.preventDefault()
			event.stopPropagation()
			backToSearch()
		} else if (event.key in moves) {
			event.preventDefault()
			const next = moves[event.key] ?? index
			// Down from above a short last row lands on the last result
			focusResult(Math.min(Math.max(next, 0), last))
		}
	}
</script>

<!-- The pane takes focus from a click on its background and hands the arrow
     keys to the results, which are the real controls -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="spark-picker"
	role="group"
	aria-label={m.spark_picker_title()}
	tabindex="-1"
	onkeydown={onPaneKeydown}
	style:--selection={userElement() ? `var(--${userElement()}-button-bg)` : undefined}
>
	<div class="controls" class:scrolled bind:this={controls}>
		<SegmentedControl
			value={tab}
			onValueChange={(value) => (tab = value as Tab)}
			variant="background"
			size="small"
			grow
		>
			<Segment value="character">{m.collection_tab_characters()}</Segment>
			<Segment value="weapon">{m.collection_tab_weapons()}</Segment>
			<Segment value="summon">{m.collection_tab_summons()}</Segment>
		</SegmentedControl>
		<Input
			bind:value={query}
			type="text"
			placeholder={m.search_placeholder()}
			leftIcon="search"
			contained
			fullWidth
			class="search-input"
			onkeydown={onSearchKeydown}
		/>
		<div class="elements">
			<ElementPicker
				value={elements}
				onValueChange={(value) => (elements = Array.isArray(value) ? value : [value])}
				multiple
				contained
				size="small"
			/>
		</div>
	</div>

	<div class="results" onscroll={(event) => (scrolled = event.currentTarget.scrollTop > 0)}>
		{#if loading()}
			<p class="status">{m.spark_loading()}</p>
		{:else if shown.length === 0}
			<p class="status">{m.search_no_results()}</p>
		{:else}
			<ul bind:this={grid}>
				{#each shown as item, index (item.identity)}
					<li>
						<DraggableItem
							item={dragItem(item)}
							container={SPARK_PICKER}
							position={index}
							type={itemDragType(item)}
						>
							<button
								type="button"
								class="result"
								class:active={index === active}
								tabindex={index === Math.max(active, 0) ? 0 : -1}
								aria-label={characterName(item)}
								onclick={(event) => {
									// Safari doesn't focus a clicked button; the keyboard carries on from here
									event.currentTarget.focus()
									onAdd(item)
								}}
								onkeydown={(event) => onGridKeydown(event, index)}
								onfocus={() => {
									active = index
								}}
							>
								<SparkTile
									{item}
									sparked={false}
									lazy
									{art}
									tooltip={label(item)}
									tooltipDetail={tab === 'weapon' ? characterName(item) : undefined}
								/>
							</button>
						</DraggableItem>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	// Fills the sidebar; the controls stay put while the art scrolls
	.spark-picker {
		outline: none;
		display: flex;
		flex-direction: column;
		height: calc(100dvh - 60px);
		overflow: hidden;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: $unit;
		flex-shrink: 0;
		padding: 0 $unit-2x $unit-2x;
		border-bottom: 1px solid var(--border-primary);
		transition: box-shadow 0.2s ease;

		&.scrolled {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		}

		:global(.search-input) {
			border-radius: $card-corner;
		}

		// As wide as its elements, not the pane
		.elements {
			align-self: flex-start;
		}
	}

	.results {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: $unit-2x;
	}

	// The selected result sits above its neighbors, so its halo covers them
	li:has(:global(.result.active)),
	li:has(:global(.result:focus-visible)) {
		position: relative;
		z-index: 1;
	}

	ul {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $unit-three-quarter;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	button {
		all: unset;
		display: block;
		width: 100%;
		border-radius: $item-corner-small;
		cursor: pointer;

		// The keyboard's place, the result Enter adds, in the viewer's element
		&:focus-visible,
		&.active {
			outline: 3px solid var(--selection, var(--accent-blue));
			outline-offset: 2px;
			// A halo in the page's color, white or dark, under the ring and just
			// past it, so the ring stands apart from the art around it
			box-shadow:
				0 0 0 8px var(--card-bg),
				0 0 12px 8px var(--card-bg);
		}
	}

	.status {
		margin: 0;
		padding: $unit-3x;
		text-align: center;
		color: var(--text-secondary);
		font-size: $font-regular;
	}
</style>
