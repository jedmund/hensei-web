<script lang="ts">
	/**
	 * RaidPartiesPane - Shows parties that use a specific raid
	 *
	 * Displays a filterable list of public parties for a given raid.
	 * Filters include: Element, Full Auto, Charge Attack, Auto Guard
	 */
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import type { Raid } from '$lib/types/api/entities'
	import { partyQueries, type RaidPartiesFilters } from '$lib/api/queries/party.queries'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		raid: Raid
	}

	let { raid }: Props = $props()

	// Filter state
	let elementFilter = $state<number | undefined>(undefined)
	let fullAutoFilter = $state<boolean | undefined>(undefined)
	let chargeAttackFilter = $state<boolean | undefined>(undefined)
	let autoGuardFilter = $state<boolean | undefined>(undefined)

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Build filters object
	const filters = $derived<RaidPartiesFilters>({
		element: elementFilter,
		fullAuto: fullAutoFilter,
		chargeAttack: chargeAttackFilter,
		autoGuard: autoGuardFilter
	})

	// Query for parties
	const partiesQuery = createInfiniteQuery(() => partyQueries.raidParties(raid.id, filters))

	// Infinite loader
	const loader = useInfiniteLoader(
		() => partiesQuery,
		() => sentinelEl,
		{ rootMargin: '200px' }
	)

	// Reset loader when filters change
	$effect(() => {
		void filters
		loader.reset()
	})

	onDestroy(() => loader.destroy())

	// Flatten results
	const parties = $derived(partiesQuery.data?.pages.flatMap((page) => page.results) ?? [])

	const isEmpty = $derived(
		parties.length === 0 && !partiesQuery.isLoading && !partiesQuery.isError
	)

	// Element filter options
	const elementOptions = [
		{ value: undefined, label: 'All' },
		{ value: 1, label: 'Wind' },
		{ value: 2, label: 'Fire' },
		{ value: 3, label: 'Water' },
		{ value: 4, label: 'Earth' },
		{ value: 5, label: 'Dark' },
		{ value: 6, label: 'Light' }
	]

	// Battle setting definitions
	const battleSettings = [
		{
			key: 'chargeAttack',
			label: 'CA',
			get value() {
				return chargeAttackFilter
			},
			set: (v: boolean | undefined) => (chargeAttackFilter = v)
		},
		{
			key: 'fullAuto',
			label: 'FA',
			get value() {
				return fullAutoFilter
			},
			set: (v: boolean | undefined) => (fullAutoFilter = v)
		},
		{
			key: 'autoGuard',
			label: 'AG',
			get value() {
				return autoGuardFilter
			},
			set: (v: boolean | undefined) => (autoGuardFilter = v)
		}
	]

	function toggleBattleSetting(setting: (typeof battleSettings)[0]) {
		const current = setting.value
		// Cycle: undefined -> true -> false -> undefined
		if (current === undefined) setting.set(true)
		else if (current === true) setting.set(false)
		else setting.set(undefined)
	}

	function getBattleSettingLabel(setting: (typeof battleSettings)[0]): string {
		const value = setting.value
		if (value === undefined) return setting.label
		return `${setting.label} ${value ? 'On' : 'Off'}`
	}
</script>

<div class="raid-parties-pane">
	<!-- Filters -->
	<div class="filters-section">
		<!-- Element filter -->
		<div class="filter-group">
			<span class="filter-label">Element</span>
			<div class="filter-buttons">
				{#each elementOptions as option (option.label)}
					<button
						type="button"
						class="filter-btn element-btn"
						class:active={elementFilter === option.value}
						onclick={() => (elementFilter = option.value)}
						aria-pressed={elementFilter === option.value}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Battle settings filter -->
		<div class="filter-group">
			<span class="filter-label">Battle</span>
			<div class="filter-buttons">
				{#each battleSettings as setting (setting.key)}
					<button
						type="button"
						class="filter-btn battle-btn"
						class:active={setting.value !== undefined}
						class:on={setting.value === true}
						class:off={setting.value === false}
						onclick={() => toggleBattleSetting(setting)}
						aria-pressed={setting.value !== undefined}
					>
						{getBattleSettingLabel(setting)}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Party list -->
	<div class="parties-list">
		{#if partiesQuery.isLoading && parties.length === 0}
			<div class="loading-state">
				<Icon name="loader-2" size={24} />
				<span>{m.sidebar_loading_parties()}</span>
			</div>
		{:else if partiesQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{m.sidebar_parties_error()}</p>
				<button type="button" onclick={() => partiesQuery.refetch()}>{m.retry()}</button>
			</div>
		{:else if isEmpty}
			<div class="empty-state">
				<p>{m.sidebar_no_parties()}</p>
			</div>
		{:else}
			<div class="parties-grid">
				{#each parties as party (party.id)}
					<GridRep {party} />
				{/each}
			</div>

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!partiesQuery.hasNextPage}
			></div>

			{#if partiesQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>{m.loading_more()}</span>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.raid-parties-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.filters-section {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: $unit-2x;
		background: var(--sidebar-bg);
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.filter-label {
		font-size: $font-tiny;
		font-weight: $bold;
		text-transform: uppercase;
		color: var(--text-secondary);
		letter-spacing: 0.5px;
	}

	.filter-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
	}

	.filter-btn {
		padding: $unit-half $unit;
		border: 1px solid var(--border-subtle);
		background: var(--button-bg);
		border-radius: $input-corner;
		font-size: $font-small;
		cursor: pointer;
		transition: all 0.15s ease;
		color: var(--text-primary);

		&:hover {
			background: var(--button-bg-hover);
			border-color: var(--border-medium);
		}

		&.active {
			background: var(--accent-blue);
			color: white;
			border-color: var(--accent-blue);
		}
	}

	.battle-btn {
		&.on {
			background: var(--full-auto-bg);
			color: var(--full-auto-text);
			border-color: var(--full-auto-bg);
		}

		&.off {
			background: var(--input-bg);
			color: var(--text-secondary);
			border-color: var(--border-medium);
		}
	}

	.parties-list {
		flex: 1;
		overflow-y: auto;
		padding: $unit-2x;
		background: var(--page-bg);
	}

	.parties-grid {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.loading-state,
	.empty-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-4x;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.error-state button {
		padding: $unit $unit-2x;
		border: 1px solid var(--border-subtle);
		border-radius: $input-corner;
		background: var(--button-bg);
		cursor: pointer;
		color: var(--text-primary);

		&:hover {
			background: var(--button-bg-hover);
		}
	}

	.load-more-sentinel {
		height: 1px;
		margin-top: $unit;

		&.hidden {
			display: none;
		}
	}

	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-2x;
		color: var(--text-secondary);

		:global(svg) {
			animation: spin 1s linear infinite;
		}
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
