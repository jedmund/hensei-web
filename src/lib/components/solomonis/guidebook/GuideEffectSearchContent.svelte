<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { solomonisGuidebookQueries } from '$lib/api/queries/solomonis-guidebook.queries'
	import * as m from '$lib/paraglide/messages'
	import type { GuideEffect, GuidebookEntry } from '$lib/types/api/solomonis'

	import Icon from '$lib/components/Icon.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import GuideEffectFilters from './GuideEffectFilters.svelte'
	import GuideEffectSearchRow from './GuideEffectSearchRow.svelte'
	import {
		RARITY_ORDER,
		canAddEffect,
		collectGuideEffectTags,
		filterGuideEffects,
		heldCount,
		type GuideEffectFilters as Filters,
		type GuideEffectTargetFilter
	} from './guidebook'
	import { rarityLabel } from './labels'

	interface Props {
		/** The run's current guidebook, read on every render. */
		entries: () => GuidebookEntry[]
		onSelect: (effect: GuideEffect) => void
	}

	let { entries, onSelect }: Props = $props()

	// Filters (the catalogue is small and static, so everything is client-side)
	let searchQuery = $state('')
	let rarity = $state<string>('all')
	let target = $state<GuideEffectTargetFilter>('all')
	let stackableOnly = $state(false)
	let tags = $state<string[]>([])
	let resultsScrolled = $state(false)

	const catalogueQuery = createQuery(() => solomonisGuidebookQueries.guideEffects())

	const filters = $derived<Filters>({
		query: searchQuery,
		rarity: rarity === 'all' ? 'all' : (rarity as Filters['rarity']),
		target,
		stackableOnly,
		tags
	})

	// Wiki tags (board decision D14). Shown in English in both locales, as the
	// wiki has them; hidden until the catalogue carries any.
	const tagOptions = $derived(
		collectGuideEffectTags(catalogueQuery.data ?? []).map((tag) => ({ value: tag, label: tag }))
	)

	const results = $derived(filterGuideEffects(catalogueQuery.data ?? [], filters))
	const held = $derived(entries())
</script>

<div class="search-content">
	<div class="controls" class:scrolled={resultsScrolled}>
		<Input
			bind:value={searchQuery}
			type="text"
			placeholder={m.search_placeholder()}
			leftIcon="search"
			contained
			fullWidth
			class="search-input"
		/>

		<SegmentedControl bind:value={rarity} size="small" variant="background" grow>
			<Segment value="all">{m.solomonis_web_guidebook_filter_all()}</Segment>
			{#each RARITY_ORDER as r (r)}
				<Segment value={r}>{rarityLabel(r)}</Segment>
			{/each}
		</SegmentedControl>

		<GuideEffectFilters bind:target bind:stackableOnly bind:tags {tagOptions} />
	</div>

	<div
		class="results-section"
		onscroll={(e) => {
			resultsScrolled = e.currentTarget.scrollTop > 0
		}}
	>
		{#if catalogueQuery.isLoading}
			<div class="loading">
				<Icon name="loader-2" size={24} />
				<span>{m.search_searching()}</span>
			</div>
		{:else if catalogueQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{m.solomonis_web_guidebook_catalogue_failed()}</p>
				<Button size="small" onclick={() => catalogueQuery.refetch()}>{m.retry()}</Button>
			</div>
		{:else if results.length > 0}
			<ul class="results-list">
				{#each results as effect (effect.id)}
					<li>
						<GuideEffectSearchRow
							{effect}
							held={heldCount(held, effect.id)}
							canAdd={canAddEffect(held, effect)}
							onSelect={() => onSelect(effect)}
						/>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="no-results">{m.search_no_results()}</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.search-content {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 60px);
		overflow: hidden;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: 0 $unit-2x $unit;
		flex-shrink: 0;
		border-bottom: 1px solid var(--border-primary);
		position: relative;
		z-index: 1;
		transition: box-shadow 0.2s ease;

		&.scrolled {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
			border-bottom: 1px solid rgba(0, 0, 0, 0.01);
		}

		:global(.search-input) {
			border-radius: $card-corner;
		}
	}

	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: $unit $unit-2x;
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-3x;
		color: var(--text-secondary);
		font-size: $font-small;

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit;
		padding: $unit-3x;
		color: var(--text-secondary);
		text-align: center;
	}

	.no-results {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $unit-3x;
		color: var(--text-tertiary);
		font-size: $font-small;
		text-align: center;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
