<svelte:options runes={true} />

<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { gwQueries } from '$lib/api/queries/gw.queries'
	import { formatScore } from '$lib/utils/gw'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	const phantomId = $derived($page.params.phantomId ?? '')

	// Query for phantom's GW scores
	const scoresQuery = createQuery(() => gwQueries.phantomGwScores(phantomId))

	const phantomName = $derived(scoresQuery.data?.phantom?.name ?? 'Phantom')
</script>

<div class="scores-page">
	<header class="page-header">
		<Button variant="ghost" size="small" icon="arrow-left" onclick={() => history.back()}>
			Back
		</Button>
		<h1>{phantomName}</h1>
		<span class="phantom-badge">Phantom</span>
	</header>

	{#if scoresQuery.isLoading}
		<div class="loading">Loading scores...</div>
	{:else if scoresQuery.isError}
		<div class="error">Failed to load scores</div>
	{:else if scoresQuery.data}
		{@const data = scoresQuery.data}

		<div class="summary">
			<div class="stat">
				<span class="stat-label">Total Honors</span>
				<span class="stat-value">{formatScore(data.grandTotal)}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Events</span>
				<span class="stat-value">{data.eventScores.length}</span>
			</div>
		</div>

		{#if data.eventScores.length === 0}
			<div class="empty">No GW scores recorded yet.</div>
		{:else}
			<ul class="events-list">
				{#each data.eventScores as eventScore (eventScore.gwEvent.id)}
					<li class="event-item">
						<button
							class="event-button"
							onclick={() => goto(`/crew/events/${eventScore.gwEvent.eventNumber}`)}
						>
							<div class="event-info">
								<span class="event-number">GW #{eventScore.gwEvent.eventNumber}</span>
								<ElementBadge element={eventScore.gwEvent.element} />
							</div>
							<span class="event-score">{formatScore(eventScore.totalScore)}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.scores-page {
		padding: spacing.$unit-2x;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		margin-bottom: spacing.$unit-3x;

		h1 {
			font-size: typography.$font-large;
			font-weight: typography.$bold;
			margin: 0;
		}
	}

	.phantom-badge {
		font-size: typography.$font-small;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		background: var(--color-purple-light, #ede9fe);
		color: var(--color-purple-dark, #7c3aed);
	}

	.loading,
	.error,
	.empty {
		text-align: center;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);
	}

	.error {
		color: var(--color-error);
	}

	.summary {
		display: flex;
		gap: spacing.$unit-4x;
		margin-bottom: spacing.$unit-3x;
		padding: spacing.$unit-2x;
		background: var(--card-bg);
		border-radius: layout.$card-corner;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.stat-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.stat-value {
		font-size: typography.$font-large;
		font-weight: typography.$bold;
		font-variant-numeric: tabular-nums;
	}

	.events-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.event-item {
		border-radius: layout.$item-corner;
		overflow: hidden;
	}

	.event-button {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: spacing.$unit-2x;
		background: var(--card-bg);
		border: none;
		border-radius: layout.$item-corner;
		cursor: pointer;
		transition: background-color 0.15s;
		text-align: left;

		&:hover {
			background: var(--card-bg-hover);
		}
	}

	.event-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
	}

	.event-number {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
	}

	.event-score {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
	}
</style>
