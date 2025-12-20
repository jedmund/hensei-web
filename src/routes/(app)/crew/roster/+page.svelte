<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import Svelecte from 'svelecte'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { crewAdapter } from '$lib/api/adapters/crew.adapter'
	import {
		searchAdapter,
		type UnifiedSearchResult,
		type UnifiedSearchSeriesRef
	} from '$lib/api/adapters/search.adapter'
	import { getCharacterImage, getWeaponImage, getSummonImage } from '$lib/utils/images'
	import Icon from '$lib/components/Icon.svelte'
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import SearchOptionItem from '$lib/components/search/SearchOptionItem.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewTabs from '$lib/components/crew/CrewTabs.svelte'
	import type { RosterMember, RosterItem } from '$lib/types/api/crew'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// Item type for roster
	type ItemType = 'Character' | 'Weapon' | 'Summon'

	// Selected item with metadata
	interface SelectedItem {
		id: string
		granblueId: string
		name: string
		type: ItemType
		// Character-specific fields for CharacterTags
		element?: number
		season?: number | null
		series?: UnifiedSearchSeriesRef[] | null
	}

	// Option format for Svelecte
	interface SearchOption {
		value: string // composite key: id|type
		label: string
		id: string
		granblueId: string
		type: ItemType
		// Character-specific fields
		element?: number
		season?: number | null
		series?: UnifiedSearchSeriesRef[] | null
	}

	// State
	let searchOptions = $state<SearchOption[]>([])
	let isSearching = $state(false)
	let selectedItems = $state<SelectedItem[]>([])
	let rosterData = $state<RosterMember[]>([])
	let isLoadingRoster = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null

	// Check if user is an officer
	$effect(() => {
		if (!crewStore.isLoading && !crewStore.isOfficer) {
			goto('/crew')
		}
	})

	// Fetch roster on mount and when items change
	$effect(() => {
		// Track selectedItems to trigger refetch
		const _ = selectedItems.length
		fetchRoster()
	})

	async function searchItems(query: string) {
		if (query.length < 2) {
			searchOptions = []
			return
		}

		isSearching = true
		try {
			const response = await searchAdapter.searchAll({ query, per: 20 })
			searchOptions = (response?.results ?? []).map((result: UnifiedSearchResult) => ({
				value: `${result.searchableId}|${result.searchableType}`,
				label: result.nameEn || 'Unknown',
				id: result.searchableId,
				granblueId: result.granblueId,
				type: result.searchableType,
				element: result.element,
				season: result.season,
				series: result.series
			}))
		} catch (error) {
			console.error('Search failed:', error)
			searchOptions = []
		} finally {
			isSearching = false
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement | null
		const query = target?.value ?? ''

		if (searchTimeout) clearTimeout(searchTimeout)
		searchTimeout = setTimeout(() => searchItems(query), 300)
	}

	function handleChange(selected: SearchOption | null) {
		if (!selected) return

		// Don't add duplicates
		if (selectedItems.some((item) => item.id === selected.id && item.type === selected.type)) {
			return
		}

		selectedItems = [
			...selectedItems,
			{
				id: selected.id,
				granblueId: selected.granblueId,
				name: selected.label,
				type: selected.type,
				element: selected.element,
				season: selected.season,
				series: selected.series
			}
		]

		// Clear selection after adding
		searchOptions = []
	}

	function removeItem(id: string, type: ItemType) {
		selectedItems = selectedItems.filter((item) => !(item.id === id && item.type === type))
	}

	async function fetchRoster() {
		isLoadingRoster = true
		try {
			const query = {
				characterIds: selectedItems.filter((i) => i.type === 'Character').map((i) => i.id),
				weaponIds: selectedItems.filter((i) => i.type === 'Weapon').map((i) => i.id),
				summonIds: selectedItems.filter((i) => i.type === 'Summon').map((i) => i.id)
			}

			const response = await crewAdapter.getRoster(query)
			rosterData = response.members
		} catch (error) {
			console.error('Failed to fetch roster:', error)
			rosterData = []
		} finally {
			isLoadingRoster = false
		}
	}

	function getItemImage(item: SelectedItem): string {
		switch (item.type) {
			case 'Character':
				return getCharacterImage(item.granblueId, 'square', '01')
			case 'Weapon':
				return getWeaponImage(item.granblueId, 'square')
			case 'Summon':
				return getSummonImage(item.granblueId, 'square')
		}
	}

	function getOwnershipInfo(member: RosterMember, item: SelectedItem): RosterItem | null {
		const collection =
			item.type === 'Character'
				? member.characters
				: item.type === 'Weapon'
					? member.weapons
					: member.summons

		return collection.find((c) => c.id === item.id) || null
	}

	function getItemTypeForUncap(type: ItemType): 'character' | 'weapon' | 'summon' {
		return type.toLowerCase() as 'character' | 'weapon' | 'summon'
	}

	function getRoleLabel(role: string): string {
		switch (role) {
			case 'captain':
				return 'Captain'
			case 'vice_captain':
				return 'Vice Captain'
			default:
				return 'Member'
		}
	}
</script>

<svelte:head>
	<title>Crew Roster / granblue.team</title>
</svelte:head>

<div class="page">
	<div class="card">
		<CrewHeader
			title={crewStore.crew?.name ?? ''}
			subtitle={crewStore.crew?.gamertag ?? undefined}
			description={crewStore.crew?.description ?? undefined}
		/>

		<CrewTabs userElement={data.currentUser?.element} />

		<div class="roster-content">
			<!-- Search Input -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="search-section" oninput={handleInput}>
				<Svelecte
					options={searchOptions}
					value={null}
					labelField="label"
					valueField="value"
					searchable={true}
					placeholder="Search characters, weapons, summons..."
					clearable={false}
					onChange={handleChange}
				>
					{#snippet option(opt)}
						{@const item = opt as SearchOption}
						<SearchOptionItem
							label={item.label}
							granblueId={item.granblueId}
							type={item.type}
							element={item.element}
							season={item.season}
							series={item.series}
						/>
					{/snippet}
				</Svelecte>
				{#if isSearching}
					<span class="loading-indicator">...</span>
				{/if}
			</div>

			<!-- Roster Grid -->
			<div class="roster-section">
				{#if isLoadingRoster}
					<div class="loading-roster">Loading...</div>
				{:else if rosterData.length > 0}
					<div class="roster-grid">
						{#if selectedItems.length > 0}
							<div class="roster-header">
								<div class="member-col"></div>
								{#each selectedItems as item (item.id + item.type)}
									<div class="item-col">
										<RichTooltip>
											{#snippet content()}
												<div class="tooltip-content">
													<span class="item-name">{item.name}</span>
													{#if item.type === 'Character'}
														<CharacterTags
															character={{
																element: item.element,
																season: item.season,
																series: item.series
															}}
														/>
													{/if}
												</div>
											{/snippet}
											{#snippet children()}
												<div class="header-item-wrapper">
													<img
														src={getItemImage(item)}
														alt={item.name}
														class="header-item-image"
													/>
													<button
														class="remove-item-btn"
														onclick={() => removeItem(item.id, item.type)}
														aria-label="Remove {item.name}"
													>
														<Icon name="close" size={12} />
													</button>
												</div>
											{/snippet}
										</RichTooltip>
									</div>
								{/each}
							</div>
						{/if}
						<div class="roster-body">
							{#each rosterData as member (member.userId)}
								<div class="roster-row">
									<div class="member-col">
										<span class="member-name">{member.username}</span>
										{#if member.role !== 'member'}
											<span class="member-role">{getRoleLabel(member.role)}</span>
										{/if}
									</div>
									{#each selectedItems as item (item.id + item.type)}
										{@const ownership = getOwnershipInfo(member, item)}
										<div class="item-col ownership-cell">
											{#if ownership}
												<UncapIndicator
													type={getItemTypeForUncap(item.type)}
													uncapLevel={ownership.uncapLevel}
												/>
											{:else}
												<span class="not-owned">—</span>
											{/if}
										</div>
									{/each}
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="empty-roster">No crew members found</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		margin: 0 auto;
		max-width: var(--main-max-width);
	}

	.card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		// Allow dropdown to overflow - don't clip Svelecte dropdown
		overflow: visible;
	}

	.roster-content {
		padding: spacing.$unit-2x;
	}

	.search-section {
		position: relative;
		margin-bottom: spacing.$unit-2x;

		// Svelecte CSS variable overrides
		--sv-bg: var(--select-contained-bg);
		--sv-border-color: transparent;
		--sv-border: 1px solid var(--sv-border-color);
		--sv-active-border: 1px solid colors.$blue;
		--sv-active-outline: none;
		--sv-border-radius: #{layout.$input-corner};
		--sv-min-height: #{spacing.$unit-4x};
		--sv-placeholder-color: var(--text-tertiary);
		--sv-color: var(--text-primary);

		--sv-dropdown-bg: var(--dialog-bg);
		--sv-dropdown-border-radius: #{layout.$card-corner};
		--sv-dropdown-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		--sv-dropdown-offset: #{spacing.$unit-half};

		--sv-item-color: var(--text-primary);
		--sv-item-active-bg: var(--option-bg-hover);
		--sv-item-selected-bg: var(--option-bg-hover);

		--sv-icon-color: var(--text-tertiary);
		--sv-icon-hover-color: var(--text-primary);

		// Target Svelecte control for hover states
		:global(.sv-control) {
			padding: calc(spacing.$unit-half + 1px) spacing.$unit calc(spacing.$unit-half + 1px) spacing.$unit-half;
		}

		&:hover :global(.sv-control) {
			background-color: var(--select-contained-bg-hover);
		}

		// Style the dropdown
		:global(.sv_dropdown) {
			border: 1px solid rgba(0, 0, 0, 0.1);
			border-radius: layout.$card-corner !important;
			max-height: 40vh;
			z-index: 102;
		}

		// Style dropdown item wrappers
		:global(.sv-item--wrap.in-dropdown) {
			padding: spacing.$unit-half spacing.$unit spacing.$unit-half spacing.$unit-half;
			border-radius: layout.$item-corner;
		}

		// Style active/highlighted dropdown item
		:global(.in-dropdown.sv-dd-item-active),
		:global(.in-dropdown:hover),
		:global(.in-dropdown:active) {
			background-color: var(--list-cell-bg-hover);
		}

		// Style dropdown items
		:global(.sv-item) {
			padding: spacing.$unit spacing.$unit-2x;
			gap: spacing.$unit;
		}

		// Style the input text
		:global(.sv-input--text) {
			font-family: var(--font-family);
		}

		// Hide the separator bar between buttons
		:global(.sv-btn-separator) {
			display: none;
		}
	}

	.loading-indicator {
		position: absolute;
		right: spacing.$unit-3x;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-tertiary);
		font-size: typography.$font-small;
		pointer-events: none;
	}

	.roster-section {
		h2 {
			font-size: 1rem;
			margin-bottom: spacing.$unit;
		}
	}

	.roster-grid {
		overflow-x: auto;
		font-size: typography.$font-regular;
	}

	.roster-header,
	.roster-row {
		display: flex;
		align-items: center;
	}

	.roster-header {
		padding: spacing.$unit spacing.$unit-2x;
	}

	.roster-row {
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$card-corner;
		transition: background-color 0.1s;

		&:hover {
			background: var(--list-cell-bg-hover);
		}
	}

	.member-col {
		flex: 1;
		min-width: 150px;
		display: flex;
		flex-direction: column;
		gap: 2px;

		.member-name {
			font-weight: typography.$medium;
		}

		.member-role {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}

	.item-col {
		width: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.header-item-wrapper {
		position: relative;
	}

	.tooltip-content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.item-name {
		font-weight: typography.$medium;
	}

	.header-item-image {
		width: 60px;
		height: 60px;
		object-fit: cover;
		border-radius: 4px;
	}

	.remove-item-btn {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: var(--surface-hover, #e5e5e5);
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 0.15s,
			color 0.15s;

		&:hover {
			background: var(--color-red, #dc2626);
			color: white;
		}
	}

	.ownership-cell {
		.not-owned {
			color: var(--text-secondary);
		}
	}

	.loading-roster,
	.empty-roster {
		padding: spacing.$unit-3x;
		text-align: center;
		color: var(--text-secondary);
	}
</style>
