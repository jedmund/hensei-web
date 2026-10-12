<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { solomonisGuidebookQueries } from '$lib/api/queries/solomonis-guidebook.queries'
	import { appLocale } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'
	import type { GuideEffect, GuidebookEntry } from '$lib/types/api/solomonis'

	import Icon from '$lib/components/Icon.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import GuideEffectIcon from './GuideEffectIcon.svelte'
	import {
		RARITY_ORDER,
		canAddEffect,
		filterGuideEffects,
		formatGuideEffectName,
		heldCount,
		type GuideEffectFilters,
		type GuideEffectTargetFilter
	} from './guidebook'
	import { rarityLabel, targetLabel } from './labels'

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
	let resultsScrolled = $state(false)

	const TARGETS: GuideEffectTargetFilter[] = ['all', 'everyone', 'race', 'proficiency', 'character']
	const targetOptions = TARGETS.map((value) => ({ value, label: targetLabel(value) }))

	const catalogueQuery = createQuery(() => solomonisGuidebookQueries.guideEffects())

	const filters = $derived<GuideEffectFilters>({
		query: searchQuery,
		rarity: rarity === 'all' ? 'all' : (rarity as GuideEffectFilters['rarity']),
		target,
		stackableOnly
	})

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

		<div class="filter-row">
			<div class="target">
				<span class="filter-label">{m.solomonis_web_guidebook_filter_target()}</span>
				<Select
					options={targetOptions}
					value={target}
					onValueChange={(v) => {
						target = v ?? 'all'
					}}
					size="small"
					contained
					fullWidth
				/>
			</div>
			<label class="stackable">
				<span class="filter-label">{m.solomonis_web_guidebook_filter_stackable()}</span>
				<Switch bind:checked={stackableOnly} size="small" />
			</label>
		</div>
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
					{@const count = heldCount(held, effect.id)}
					<li>
						<button
							type="button"
							class="result-button"
							disabled={!canAddEffect(held, effect)}
							onclick={() => onSelect(effect)}
						>
							<GuideEffectIcon {effect} size="small" />
							<span class="result-info">
								<span class="result-name">
									{formatGuideEffectName(effect, null, appLocale())}
								</span>
								<span class="result-meta">
									{rarityLabel(effect.rarity)} ·
									{effect.stackable
										? m.solomonis_web_guidebook_stackable()
										: m.solomonis_web_guidebook_not_stackable()}
									{#if count > 0}
										· <span class="held">{m.solomonis_web_guidebook_held({ count })}</span>
									{/if}
								</span>
							</span>
							{#if canAddEffect(held, effect)}
								<Icon name="plus" size={16} class="add-icon" />
							{/if}
						</button>
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

	.filter-row {
		display: flex;
		align-items: flex-end;
		gap: $unit-2x;
	}

	.target {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.stackable {
		display: flex;
		align-items: center;
		gap: $unit;
		padding-bottom: $unit-half;
	}

	.filter-label {
		font-size: $font-tiny;
		color: var(--text-secondary);
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

	.result-button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit;
		border: none;
		border-radius: $input-corner;
		background: transparent;
		color: var(--text-primary);
		font: inherit;
		cursor: pointer;
		transition: background-color 0.15s ease-out;
		text-align: left;

		&:hover:not(:disabled) {
			background: var(--list-cell-bg-hover);
		}

		&:active:not(:disabled) {
			transform: scale(0.99);
		}

		&:disabled {
			cursor: default;
			opacity: 0.6;
		}

		:global(.add-icon) {
			flex-shrink: 0;
			color: var(--text-tertiary);
		}
	}

	.result-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.result-name {
		font-size: $font-small;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.result-meta {
		font-size: $font-tiny;
		color: var(--text-secondary);
	}

	.held {
		font-weight: $bold;
		color: var(--accent-blue);
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
