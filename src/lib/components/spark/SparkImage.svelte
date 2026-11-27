<!-- SparkImage - The exported spark image: new characters, gold moons and summons in three columns, at a fixed 1200x630. The page edits with SparkBoard instead. -->

<script lang="ts" module>
	/** The image's size; the share render screenshots it at this size */
	export const SPARK_IMAGE_WIDTH = 1200
	export const SPARK_IMAGE_HEIGHT = 630
</script>

<script lang="ts">
	import SparkTile from '$lib/components/spark/SparkTile.svelte'
	import { getLocale } from '$lib/paraglide/runtime'
	import { savedSparkName, SPARK_COLUMN_HEADINGS, sparkRateText } from '$lib/features/spark/labels'
	import { layoutSpark, SPARK_COLUMNS, TILES_PER_ROW } from '$lib/features/spark/spark'
	import type { SparkRenderData } from '$lib/types/spark'

	interface Props {
		data: SparkRenderData
		/**
		 * Light or dark whatever the page's theme (for exports), or the site's
		 * theme (shown on the page)
		 */
		theme?: 'dark' | 'light' | 'site'
		/** The viewer's element, which colors the wordmark */
		element?: string | undefined
	}

	let { data, theme = 'dark', element }: Props = $props()

	// The frame less its padding, the headings and the footer is what the
	// columns share; layoutSpark sizes the tiles to fit it
	const PADDING = 24
	const COLUMN_GAP = 16
	const COLUMN_PADDING = 12
	const HEADING = 40
	const FOOTER = 36
	// The title's line, then the frame's padding again below it, so it sits
	// evenly between the top edge and the columns
	const TITLE_LINE = 28
	const TITLE = TITLE_LINE + PADDING
	const TILE_GAP = 6

	// The spark's date and gacha across the top, when it has either
	const title = $derived(savedSparkName(data.date, data.pool, data.season, getLocale()))

	const layout = $derived(
		layoutSpark(
			{
				characters: data.columns.characters.length,
				moons: data.columns.moons.length,
				summons: data.columns.summons.length
			},
			{
				width: SPARK_IMAGE_WIDTH - PADDING * 2,
				height:
					SPARK_IMAGE_HEIGHT -
					PADDING * 2 -
					(title ? TITLE : 0) -
					FOOTER -
					COLUMN_PADDING * 2 -
					HEADING,
				columnGap: COLUMN_GAP,
				columnPadding: COLUMN_PADDING,
				tileGap: TILE_GAP,
				aspect: 280 / 160,
				maxTileWidth: 240
			}
		)
	)

	const count = (value: number) => new Intl.NumberFormat(getLocale()).format(value)
	const rate = $derived(sparkRateText(data, getLocale()))
</script>

<div
	class="spark-image"
	class:dark={theme === 'dark'}
	class:light={theme === 'light'}
	style:--padding="{PADDING}px"
	style:--column-gap="{COLUMN_GAP}px"
	style:--column-padding="{COLUMN_PADDING}px"
	style:--heading="{HEADING}px"
	style:--footer="{FOOTER}px"
	style:--title-line="{TITLE_LINE}px"
	style:--wordmark={element ? `var(--${element}-text)` : undefined}
	style:--tile-gap="{TILE_GAP}px"
	style:--tile-width="{layout.tileWidth}px"
	style:--per-row={TILES_PER_ROW}
>
	{#if title}
		<h1 class="title">{title}</h1>
	{/if}
	<div class="columns">
		{#each SPARK_COLUMNS as column (column)}
			{@const items = data.columns[column]}
			<section class="column" style:width="{layout.columnWidth}px">
				<h2>
					<span>{SPARK_COLUMN_HEADINGS[column]()}</span>
					<span class="count">{count(items.length)}</span>
				</h2>
				<ul>
					{#each items as item, index (`${column}-${index}`)}
						<li>
							<SparkTile
								{item}
								sparked={data.sparked?.column === column && data.sparked.index === index}
							/>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
	<footer>
		<span class="rate"><strong>{rate.label}</strong> {rate.value}</span>
		<span class="wordmark">granblue.team</span>
	</footer>
</div>

<style lang="scss">
	@use '$src/themes/colors';
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.spark-image {
		box-sizing: border-box;
		width: 1200px;
		height: 630px;
		display: flex;
		flex-direction: column;
		padding: var(--padding);
		overflow: hidden;
		background: var(--page-bg);
		color: var(--text-primary);
		font-family: var(--font-family);

		// An export keeps its theme whatever the theme of the page that asks for it
		&.light {
			--page-bg: #{colors.$page--bg--light};
			--card-bg: #{colors.$grey-100};
			--placeholder-bg: #{colors.$grey-80};
			--accent-blue: #{colors.$accent--blue--light};
			--text-primary: #{colors.$text--primary--color--light};
			--text-secondary: #{colors.$text--secondary--color--light};
			--text-tertiary: #{colors.$text--tertiary--color--light};
			--wind-text: #{colors.$wind--text--light};
			--fire-text: #{colors.$fire--text--light};
			--water-text: #{colors.$water--text--light};
			--earth-text: #{colors.$earth--text--light};
			--light-text: #{colors.$light--text--light};
			--dark-text: #{colors.$dark--text--light};
		}

		&.dark {
			--page-bg: #{colors.$page--bg--dark};
			--card-bg: #{colors.$grey-20};
			--placeholder-bg: #{colors.$grey-40};
			--accent-blue: #{colors.$accent--blue--dark};
			--text-primary: #{colors.$text--primary--color--dark};
			--text-secondary: #{colors.$text--secondary--color--dark};
			--text-tertiary: #{colors.$text--tertiary--color--dark};
			--wind-text: #{colors.$wind--text--dark};
			--fire-text: #{colors.$fire--text--dark};
			--water-text: #{colors.$water--text--dark};
			--earth-text: #{colors.$earth--text--dark};
			--light-text: #{colors.$light--text--dark};
			--dark-text: #{colors.$dark--text--dark};
		}
	}

	.columns {
		flex: 1;
		min-height: 0;
		display: flex;
		gap: var(--column-gap);
	}

	.column {
		box-sizing: border-box;
		flex: none;
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding: var(--column-padding);
		border-radius: $card-corner;
		background: var(--card-bg);
		overflow: hidden;
	}

	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--heading);
		margin: 0;
		padding-bottom: 8px;
		box-sizing: border-box;
		font-size: $font-medium;
		font-weight: $medium;

		.count {
			color: var(--text-secondary);
			font-variant-numeric: tabular-nums;
		}
	}

	ul {
		display: grid;
		grid-template-columns: repeat(var(--per-row), var(--tile-width));
		align-content: start;
		justify-content: center;
		gap: var(--tile-gap);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	footer {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		height: var(--footer);
		color: var(--text-secondary);
		font-size: $font-regular;
	}

	.title {
		margin: 0 0 var(--padding);
		font-size: $font-large;
		font-weight: $bold;
		line-height: var(--title-line);
	}

	.wordmark {
		color: var(--wordmark, var(--text-tertiary));
		font-weight: $medium;
	}

	.rate {
		font-variant-numeric: tabular-nums;

		// The label in the wordmark's weight; the numbers stay regular
		strong {
			color: var(--text-tertiary);
			font-weight: $medium;
		}
	}
</style>
