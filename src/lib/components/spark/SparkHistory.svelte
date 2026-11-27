<!-- SparkHistory - The signed-in player's saved sparks, newest first; each row opens the spark in a dialog -->

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import { drawnSsrCount, savedSparkName, sparkRate } from '$lib/features/spark/labels'
	import { SPARK_COLUMNS } from '$lib/features/spark/spark'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { gachaItemName, gachaItemThumbnail } from '$lib/utils/gacha'
	import { IsInViewport } from 'runed'
	import type { SavedSpark } from '$lib/types/api/savedSpark'
	import type { SparkRenderData } from '$lib/types/spark'

	interface Props {
		sparks: SavedSpark[]
		/** A saved spark with its items resolved against the catalogue */
		resolve: (saved: SavedSpark) => SparkRenderData
		onOpen: (saved: SavedSpark) => void
		/** More pages to load; they load as the list scrolls */
		hasMore: boolean
		loadingMore: boolean
		onLoadMore: () => void
	}

	let { sparks, resolve, onOpen, hasMore, loadingMore, onLoadMore }: Props = $props()

	/** Thumbnails shown in a row before the rest are counted */
	const THUMBNAILS = 6

	const count = (value: number) => new Intl.NumberFormat(getLocale()).format(value)

	// The next page loads as the end of the list nears the viewport. A page
	// that leaves the end still in view loads the next one too.
	let sentinel = $state<HTMLElement>()
	const nearEnd = new IsInViewport(() => sentinel, { rootMargin: '200px' })
	$effect(() => {
		if (nearEnd.current && hasMore && !loadingMore) onLoadMore()
	})
</script>

<section class="history" aria-labelledby="spark-history-heading">
	<h2 id="spark-history-heading">
		{m.spark_history()}
		<!-- Saved sparks are private to their owner -->
		<Tooltip content={m.spark_history_private()}>
			<span class="private" aria-label={m.spark_history_private()}>
				<Icon name="lock" size={14} />
			</span>
		</Tooltip>
	</h2>
	<ol>
		{#each sparks as saved (saved.id)}
			{@const data = resolve(saved)}
			{@const items = SPARK_COLUMNS.flatMap((column) => data.columns[column])}
			<li>
				<button type="button" class="entry" onclick={() => onOpen(saved)}>
					<span class="summary">
						<span class="entry-title"
							>{savedSparkName(saved.sparkDate, saved.pool, saved.season, getLocale())}</span
						>
						<span class="entry-meta">
							{[
								m.gacha_log_draws({ draws: count(saved.draws) }),
								sparkRate(data, getLocale()),
								`${count(drawnSsrCount(data))} SSR`
							].join(' · ')}
						</span>
					</span>
					{#if items.length > 0}
						<span class="thumbnails" aria-hidden="true">
							{#each items.slice(0, THUMBNAILS) as item, index (index)}
								<img
									src={gachaItemThumbnail(item)}
									alt=""
									title={gachaItemName(item, getLocale())}
								/>
							{/each}
							{#if items.length > THUMBNAILS}
								<span class="more">+{items.length - THUMBNAILS}</span>
							{/if}
						</span>
					{/if}
				</button>
			</li>
		{/each}
	</ol>
	{#if hasMore}
		<div class="more-row" bind:this={sentinel}>
			{#if loadingMore}
				<span class="loading">{m.spark_loading()}</span>
			{/if}
		</div>
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	// Rows match the gacha simulator's log
	// Set apart from the card above it
	.history {
		display: flex;
		flex-direction: column;
		gap: $unit;
		margin-top: $unit-2x;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: $unit-half;
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.private {
		display: flex;
		color: var(--text-tertiary);
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: $unit;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.entry {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		width: 100%;
		padding: $unit-2x;
		border: $card-border;
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		background: var(--card-bg);
		color: var(--text-primary);
		font: inherit;
		text-align: left;
		cursor: pointer;
		@include smooth-transition($duration-quick, background);

		&:hover {
			background: var(--button-contained-bg-hover);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	.summary {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		flex: 1;
		min-width: 0;
	}

	.entry-title {
		font-weight: $medium;
	}

	.entry-meta {
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.thumbnails {
		display: flex;
		align-items: center;
		gap: $unit-half;

		img {
			display: block;
			width: $unit-5x;
			height: $unit-5x;
			border-radius: $item-corner-small;
			object-fit: cover;
		}

		// Phones show the count, not the art
		@media (max-width: 600px) {
			display: none;
		}
	}

	// The count of items past the thumbnails, in a tile the size of one
	.more {
		display: flex;
		align-items: center;
		justify-content: center;
		width: $unit-5x;
		height: $unit-5x;
		border-radius: $item-corner-small;
		background: var(--placeholder-bg);
		color: var(--text-secondary);
		font-size: $font-small;
		font-weight: $bold;
	}

	// Where the next page loads; tall enough to be seen before it's reached
	.more-row {
		display: flex;
		justify-content: center;
		min-height: $unit-4x;
	}

	.loading {
		color: var(--text-secondary);
		font-size: $font-small;
	}
</style>
