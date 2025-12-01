<svelte:options runes={true} />

<script lang="ts">
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

	interface Props {
		wikiRaw?: string | null
		gameRawEn?: Record<string, unknown> | null
		gameRawJp?: Record<string, unknown> | null
		isLoading?: boolean
	}

	let { wikiRaw, gameRawEn, gameRawJp, isLoading = false }: Props = $props()

	let selectedLang = $state('en')

	const currentGameRaw = $derived(selectedLang === 'en' ? gameRawEn : gameRawJp)
	const formattedGameRaw = $derived(
		currentGameRaw ? JSON.stringify(currentGameRaw, null, 2) : null
	)
</script>

<div class="raw-data-tab">
	{#if isLoading}
		<p class="loading">Loading raw data...</p>
	{:else}
		{#if wikiRaw}
			<section class="raw-section">
				<h3>Wiki Raw</h3>
				<pre class="raw-content">{wikiRaw}</pre>
			</section>
		{/if}

		{#if gameRawEn || gameRawJp}
			<section class="raw-section">
				<div class="section-header">
					<h3>Game Raw</h3>
					<SegmentedControl bind:value={selectedLang} variant="background" size="small">
						<Segment value="en">EN</Segment>
						<Segment value="jp">JP</Segment>
					</SegmentedControl>
				</div>
				{#if formattedGameRaw}
					<pre class="raw-content">{formattedGameRaw}</pre>
				{:else}
					<p class="no-data">No {selectedLang.toUpperCase()} data available</p>
				{/if}
			</section>
		{/if}

		{#if !wikiRaw && !gameRawEn && !gameRawJp}
			<p class="no-data">No raw data available</p>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.raw-data-tab {
		padding: spacing.$unit-2x;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.raw-section {
		h3 {
			font-size: typography.$font-regular;
			font-weight: 600;
			color: colors.$grey-20;
			margin: 0 0 spacing.$unit 0;
		}
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		margin-bottom: spacing.$unit;
	}

	.raw-content {
		background: colors.$grey-95;
		border: 1px solid colors.$grey-80;
		border-radius: layout.$item-corner;
		padding: spacing.$unit-2x;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', monospace;
		font-size: typography.$font-small;
		line-height: 1.5;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 500px;
		overflow-y: auto;
		margin: 0;
	}

	.no-data {
		color: colors.$grey-50;
		font-style: italic;
	}

	.loading {
		color: colors.$grey-50;
		font-style: italic;
	}
</style>
