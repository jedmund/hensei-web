<script lang="ts">
	import type { PageData } from './$types'
	import type { CollectionCharacter } from '$lib/types/api/collection'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import CollectionFilters, {
		type CollectionFilterState
	} from '$lib/components/collection/CollectionFilters.svelte'
	import AddToCollectionModal from '$lib/components/collection/AddToCollectionModal.svelte'
	import CollectionCharacterPane from '$lib/components/collection/CollectionCharacterPane.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { IsInViewport } from 'runed'
	import { getCharacterImageWithPose } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import perpetuityFilled from '$src/assets/icons/perpetuity/filled.svg'

	const { data }: { data: PageData } = $props()

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let raceFilters = $state<number[]>([])
	let proficiencyFilters = $state<number[]>([])
	let genderFilters = $state<number[]>([])

	// Modal state
	let addModalOpen = $state(false)

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Build filters for query - all filters are now server-side for everyone
	const queryFilters = $derived({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		race: raceFilters.length > 0 ? raceFilters : undefined,
		proficiency: proficiencyFilters.length > 0 ? proficiencyFilters : undefined,
		gender: genderFilters.length > 0 ? genderFilters : undefined
	})

	// Unified query for any user's collection (privacy enforced server-side)
	const collectionQuery = createInfiniteQuery(() => {
		const userId = data.user.id
		const filters = queryFilters
		return collectionQueries.characters(userId, filters)
	})

	// Flatten all characters from pages
	const allCharacters = $derived.by((): CollectionCharacter[] => {
		if (!collectionQuery.data?.pages) {
			return []
		}
		return collectionQuery.data.pages.flatMap((page) => page.results ?? [])
	})

	// Infinite scroll
	const inViewport = new IsInViewport(() => sentinelEl, {
		rootMargin: '200px'
	})

	$effect(() => {
		if (
			inViewport.current &&
			collectionQuery.hasNextPage &&
			!collectionQuery.isFetchingNextPage &&
			!collectionQuery.isLoading
		) {
			collectionQuery.fetchNextPage()
		}
	})

	const isLoading = $derived(collectionQuery.isLoading)
	const isEmpty = $derived(!isLoading && allCharacters.length === 0)
	const showSentinel = $derived(collectionQuery.hasNextPage && !collectionQuery.isFetchingNextPage)

	function handleFiltersChange(filters: CollectionFilterState) {
		elementFilters = filters.element
		rarityFilters = filters.rarity
		raceFilters = filters.race
		proficiencyFilters = filters.proficiency
		genderFilters = filters.gender
	}

	function getImageUrl(character: CollectionCharacter): string {
		return getCharacterImageWithPose(
			character.character?.granblueId,
			'grid',
			character.uncapLevel,
			character.transcendenceStep
		)
	}

	function displayName(character: CollectionCharacter): string {
		const name = character.character?.name
		if (!name) return '—'
		if (typeof name === 'string') return name
		return name.en || name.ja || '—'
	}

	function openCharacterDetails(character: CollectionCharacter) {
		const characterName =
			typeof character.character?.name === 'string'
				? character.character.name
				: character.character?.name?.en || 'Character'

		sidebar.openWithComponent(characterName, CollectionCharacterPane, {
			character,
			isOwner: data.isOwner,
			onClose: () => sidebar.close()
		})
	}
</script>

<div class="collection-page">
	<!-- Action bar -->
	<div class="action-bar">
		<CollectionFilters
			bind:elementFilters
			bind:rarityFilters
			bind:raceFilters
			bind:proficiencyFilters
			bind:genderFilters
			onFiltersChange={handleFiltersChange}
			showFilters={{
				element: true,
				rarity: true,
				season: false,
				series: false,
				race: true,
				proficiency: true,
				gender: true
			}}
			layout="horizontal"
		/>

		{#if data.isOwner}
			<Button variant="primary" onclick={() => (addModalOpen = true)}>
				<Icon name="plus" size={16} />
				Add to Collection
			</Button>
		{/if}
	</div>

	<!-- Collection grid -->
	<div class="grid-area">
		{#if isLoading}
			<div class="loading-state">
				<Icon name="loader-2" size={32} />
				<p>Loading collection...</p>
			</div>
		{:else if isEmpty}
			<div class="empty-state">
				{#if data.isOwner}
					<Icon name="users" size={48} />
					<h3>Your collection is empty</h3>
					<p>Add characters to start building your collection</p>
					<Button variant="primary" onclick={() => (addModalOpen = true)}>
						<Icon name="plus" size={16} />
						Add Characters
					</Button>
				{:else}
					<Icon name="lock" size={48} />
					<p>This collection is empty or private</p>
				{/if}
			</div>
		{:else}
			<div class="character-grid">
				{#each allCharacters as character (character.id)}
					<button
						type="button"
						class="character-card"
						onclick={() => openCharacterDetails(character)}
					>
						<div class="card-image">
							{#if character.perpetuity}
								<img
									class="perpetuity-badge"
									src={perpetuityFilled}
									alt="Perpetuity Ring"
									title="Perpetuity Ring"
								/>
							{/if}
							<img
								class="character-image"
								src={getImageUrl(character)}
								alt={displayName(character)}
								loading="lazy"
							/>
						</div>
						<UncapIndicator
							type="character"
							uncapLevel={character.uncapLevel}
							transcendenceStage={character.transcendenceStep}
							special={character.character?.special}
							flb={character.character?.uncap?.flb}
							ulb={character.character?.uncap?.ulb}
							transcendence={!character.character?.special && character.character?.uncap?.ulb}
						/>
						<span class="character-name">{displayName(character)}</span>
					</button>
				{/each}
			</div>

			{#if showSentinel}
				<div class="load-more-sentinel" bind:this={sentinelEl}></div>
			{/if}

			{#if collectionQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>Loading more...</span>
				</div>
			{/if}

			{#if !collectionQuery.hasNextPage && allCharacters.length > 0}
				<div class="end-message">
					<p>{allCharacters.length} character{allCharacters.length === 1 ? '' : 's'} in {data.isOwner ? 'your' : 'this'} collection</p>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Add to Collection Modal -->
{#if data.isOwner}
	<AddToCollectionModal userId={data.user.id} bind:open={addModalOpen} />
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	.collection-page {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: $unit-2x;
		flex-wrap: wrap;
	}

	.grid-area {
		min-height: 400px;
	}

	.character-grid {
		display: flex;
		flex-wrap: wrap;
		gap: $unit;
	}

	.character-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-color, #3366ff);
			outline-offset: 2px;
			border-radius: 8px;
		}
	}

	.card-image {
		position: relative;
		// Character grid images are 280x160 (7:4 ratio)
		width: 100px;
		aspect-ratio: 280 / 160;
		border-radius: 8px;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
	}

	.perpetuity-badge {
		position: absolute;
		top: -$unit-half;
		right: $unit;
		width: $unit-3x;
		height: $unit-3x;
		z-index: 10;
	}

	.character-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
	}

	.character-name {
		font-size: $font-small;
		text-align: center;
		color: $grey-50;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		color: var(--text-secondary, #666);
		gap: $unit;

		:global(svg) {
			color: var(--icon-secondary, #999);
		}

		p {
			margin: 0;
		}
	}

	.empty-state h3 {
		margin: 0;
		color: var(--text-primary, #333);
	}

	.loading-state :global(svg) {
		animation: spin 1s linear infinite;
	}

	.load-more-sentinel {
		height: 1px;
		margin-top: $unit;
	}

	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-2x;
		color: var(--text-secondary, #666);

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	.end-message {
		text-align: center;
		padding: $unit-2x;
		color: var(--text-secondary, #666);

		p {
			margin: 0;
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
