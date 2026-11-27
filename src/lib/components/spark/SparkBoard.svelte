<!-- SparkBoard - The spark on the page, for viewing and editing: the same three sections as the image, with tiles that fill the page's width and sections that grow with them -->

<script lang="ts">
	import type { Snippet } from 'svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import SparkTile from '$lib/components/spark/SparkTile.svelte'
	import { columnDragType, type SparkDragItem } from '$lib/features/spark/drag'
	import { getLocale } from '$lib/paraglide/runtime'
	import { drawnSsrCount, SPARK_COLUMN_HEADINGS, sparkRate } from '$lib/features/spark/labels'
	import StatTile from '$lib/components/ui/StatTile.svelte'
	import { m } from '$lib/paraglide/messages'
	import { gachaItemName } from '$lib/utils/gacha'
	import { mobileQuery } from '$lib/utils/viewport.svelte'
	import { SPARK_COLUMNS, TILES_PER_ROW, type SparkColumn } from '$lib/features/spark/spark'
	import type { CatalogueItem } from '$lib/types/gacha'
	import type { SparkRenderData } from '$lib/types/spark'

	export interface SparkBoardTile {
		column: SparkColumn
		index: number
		item: CatalogueItem
		sparked: boolean
		/** The tile itself; render it inside whatever wraps it */
		art: Snippet
	}

	interface Props {
		data: SparkRenderData
		/** Wraps each tile, e.g. in its menu */
		tile: Snippet<[SparkBoardTile]>
		/** An empty slot was clicked, to add to its section */
		onSlotClick: (column: SparkColumn) => void
		/** Shown along the bottom of the card, e.g. the spark's settings */
		footer?: Snippet
	}

	let { data, tile, onSlotClick, footer }: Props = $props()

	const count = (value: number) => new Intl.NumberFormat(getLocale()).format(value)

	// Each section is a grid of slots: its tiles, then empty slots to drop
	// into. It shows at least SLOT_ROWS rows (fewer where the sections stack,
	// on phones) and always one free slot, so there's room to add at the end.
	const stacked = mobileQuery('(max-width: 640px)')
	const slotRows = $derived(stacked.current ? 2 : 4)
	const emptySlots = (filled: number) => {
		const cells = Math.max(
			Math.ceil((filled + 1) / TILES_PER_ROW) * TILES_PER_ROW,
			slotRows * TILES_PER_ROW
		)
		return cells - filled
	}

	const dragged = (column: SparkColumn, index: number, item: CatalogueItem): SparkDragItem => ({
		id: `${column}:${index}`,
		item
	})
</script>

<div class="spark-board" style:--per-row={TILES_PER_ROW}>
	<!-- The tallies the gacha simulator shows for a draw -->
	<div class="stats">
		<StatTile label={m.spark_draws()} value={count(data.draws)} />
		<StatTile label={m.gacha_ssr_rate()} value={sparkRate(data, getLocale())} />
		<StatTile label="SSR" value={count(drawnSsrCount(data))} />
	</div>
	<div class="sections">
		{#each SPARK_COLUMNS as column (column)}
			{@const items = data.columns[column]}
			{@const type = columnDragType(column)}
			<section>
				<h2>
					<span>{SPARK_COLUMN_HEADINGS[column]()}</span>
					<span class="count">{count(items.length)}</span>
				</h2>
				<ul>
					{#each items as item, index (`${column}-${index}`)}
						{@const sparked = data.sparked?.column === column && data.sparked.index === index}
						{@const entry = dragged(column, index, item)}
						{#snippet art()}
							<SparkTile {item} {sparked} tooltip={gachaItemName(item, getLocale())} />
						{/snippet}
						<li>
							<DropZone container={column} position={index} {type} item={entry}>
								<DraggableItem item={entry} container={column} position={index} {type}>
									{@render tile({ column, index, item, sparked, art })}
								</DraggableItem>
							</DropZone>
						</li>
					{/each}
					<!-- Empty slots, each its own drop target so only the hovered one
					     lights up; dropping past the last tile adds to the end -->
					{#each { length: emptySlots(items.length) }, slot (slot)}
						<li>
							<DropZone container={column} position={items.length + slot} {type}>
								<button
									type="button"
									class="slot"
									aria-label={m.spark_add_items()}
									onclick={() => onSlotClick(column)}
								>
									<Icon name="plus" size={20} />
								</button>
							</DropZone>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
	{@render footer?.()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	// One card holds every section, like the page's other cards but with
	// less padding, so the tiles get the width
	.spark-board {
		@include page-surface;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: $unit-2x;
		color: var(--text-primary);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $unit;
	}

	// Three sections side by side; stacked where three would be too narrow
	.sections {
		display: grid;
		flex: 1;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $unit-2x;

		@media (max-width: 640px) {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	section {
		display: flex;
		flex-direction: column;
		gap: $unit;
		min-height: 0;
	}

	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0;
		font-size: $font-regular;
		font-weight: $medium;

		.count {
			color: var(--text-secondary);
			font-variant-numeric: tabular-nums;
		}
	}

	// An empty slot, the shape of a tile; a + shows on hover to add one
	.slot {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 280 / 160;
		border: 2px dashed var(--border-subtle);
		border-radius: $item-corner-small;
		color: var(--text-tertiary);
		cursor: pointer;

		:global(svg) {
			opacity: 0;
		}

		&:hover,
		&:focus-visible {
			border-color: var(--border-primary);

			:global(svg) {
				opacity: 1;
			}
		}
	}

	ul {
		display: grid;
		grid-template-columns: repeat(var(--per-row), minmax(0, 1fr));
		gap: $unit-three-quarter;
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
