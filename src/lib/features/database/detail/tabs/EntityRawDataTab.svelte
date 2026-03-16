
<script lang="ts">
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { EntityRawData } from '$lib/api/adapters/entity.adapter'

	interface Props {
		wikiRaw?: string | null
		gameRawEn?: Record<string, unknown> | null
		gameRawJp?: Record<string, unknown> | null
		isLoading?: boolean
		canEdit?: boolean
		onFetchWiki?: () => Promise<EntityRawData>
	}

	let { wikiRaw, gameRawEn, gameRawJp, isLoading = false, canEdit = false, onFetchWiki }: Props =
		$props()

	let selectedLang = $state('en')
	let isFetching = $state(false)
	let fetchError = $state<string | null>(null)

	const currentGameRaw = $derived(selectedLang === 'en' ? gameRawEn : gameRawJp)
	const formattedGameRaw = $derived(
		currentGameRaw ? JSON.stringify(currentGameRaw, null, 2) : null
	)

	async function handleFetchWiki() {
		if (!onFetchWiki) return

		isFetching = true
		fetchError = null

		try {
			await onFetchWiki()
		} catch (err: unknown) {
			fetchError = err instanceof Error ? err.message : 'Failed to fetch wiki data'
		} finally {
			isFetching = false
		}
	}
</script>

<div class="raw-data-tab">
	{#if isLoading}
		<p class="loading">Loading raw data...</p>
	{:else}
		<section class="raw-section">
			<div class="section-header">
				<h3>Wiki Raw</h3>
				{#if canEdit && onFetchWiki}
					<Button
						variant="secondary"
						size="small"
						onclick={handleFetchWiki}
						disabled={isFetching}
					>
						{isFetching ? 'Fetching...' : 'Fetch Wiki'}
					</Button>
				{/if}
			</div>
			{#if fetchError}
				<p class="error">{fetchError}</p>
			{/if}
			{#if wikiRaw}
				<pre class="raw-content">{wikiRaw}</pre>
			{:else}
				<p class="no-data">No wiki data available</p>
			{/if}
		</section>

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
	{/if}
</div>

<style lang="scss">
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
			font-weight: typography.$bold;
			color: var(--text-primary);
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
		background: var(--card-bg);
		color: var(--text-primary);
		border: 1px solid var(--border-medium);
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
		color: var(--text-secondary);
		font-style: italic;
	}

	.loading {
		color: var(--text-secondary);
		font-style: italic;
	}

	.error {
		color: var(--danger);
		font-size: typography.$font-small;
		margin: 0 0 spacing.$unit 0;
	}
</style>
