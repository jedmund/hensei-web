
<script lang="ts">
	/**
	 * ArtifactSelectionPane - Pane for selecting artifacts from user's collection
	 *
	 * Shows paginated list of user's collection artifacts with filtering:
	 * - By element (match character's element)
	 * - By proficiency (match character's proficiencies)
	 */
	import * as m from '$lib/paraglide/messages'
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import type { Character } from '$lib/types/api/entities'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { getArtifactImage } from '$lib/utils/images'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		/** User ID whose collection to load */
		userId: string
		/** Character to filter by (for element/proficiency matching) */
		character?: Character
		/** Currently equipped artifact ID (to highlight) */
		currentArtifactId?: string
		/** Callback when an artifact is selected */
		onSelect?: (artifact: CollectionArtifact) => void
		/** Callback when equip is confirmed */
		onEquip?: (artifact: CollectionArtifact) => void
	}

	let { userId, character, currentArtifactId, onSelect, onEquip }: Props = $props()

	// Filter state - auto-filter by character's element
	let elementFilter = $state<number | undefined>(character?.element)

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Build query filters
	const queryFilters = $derived({
		element: elementFilter
	})

	// Query for user's collection artifacts
	const collectionQuery = createInfiniteQuery(() =>
		artifactQueries.collection(userId, queryFilters)
	)

	// Flatten all artifacts
	const allArtifacts = $derived.by((): CollectionArtifact[] => {
		if (!collectionQuery.data?.pages) return []
		return collectionQuery.data.pages.flatMap((page) => page.results ?? [])
	})

	// State-gated infinite scroll
	const loader = useInfiniteLoader(() => collectionQuery, () => sentinelEl, { rootMargin: '200px' })

	// Reset loader when filters change
	$effect(() => {
		void queryFilters
		loader.reset()
	})

	// Cleanup on destroy
	onDestroy(() => loader.destroy())

	const isLoading = $derived(collectionQuery.isLoading)
	const isEmpty = $derived(!isLoading && allArtifacts.length === 0)

	// Get display name for artifact
	function getDisplayName(artifact: CollectionArtifact): string {
		const name = artifact.artifact?.name
		if (!name) return '—'
		if (typeof name === 'string') return name
		return name.en || name.ja || '—'
	}

	// Get proficiency for artifact
	function getProficiency(artifact: CollectionArtifact): number | undefined {
		const isQuirk = artifact.artifact?.rarity === 'quirk'
		return ((isQuirk ? artifact.proficiency : artifact.artifact?.proficiency) ?? undefined)
	}

	function handleSelect(artifact: CollectionArtifact) {
		onSelect?.(artifact)
	}

	function handleEquip(artifact: CollectionArtifact) {
		onEquip?.(artifact)
	}
</script>

<div class="artifact-selection-pane">
	<!-- Filters -->
	<div class="filters">
		<label class="filter-label">
			<input
				type="checkbox"
				checked={elementFilter !== undefined}
				onchange={(e) => {
					elementFilter = e.currentTarget.checked ? character?.element : undefined
				}}
			/>
			<span>Match element</span>
		</label>
	</div>

	<!-- Artifact list -->
	<div class="artifact-list">
		{#if isLoading}
			<div class="loading-state">
				<Icon name="loader-2" size={24} />
				<p>{m.sidebar_loading_artifacts()}</p>
			</div>
		{:else if isEmpty}
			<div class="empty-state">
				<Icon name="gem" size={32} />
				<p>{m.sidebar_no_artifacts_collection()}</p>
			</div>
		{:else}
			{#each allArtifacts as artifact (artifact.id)}
				{@const isEquipped = artifact.id === currentArtifactId}
				{@const imageUrl = getArtifactImage(artifact.artifact?.granblueId)}
				{@const displayName = getDisplayName(artifact)}
				{@const proficiency = getProficiency(artifact)}
				{@const gradeLetter = artifact.grade?.letter}

				<button
					type="button"
					class="artifact-item"
					class:equipped={isEquipped}
					onclick={() => handleSelect(artifact)}
				>
					<div class="artifact-image">
						<img src={imageUrl} alt={displayName} />
					</div>
					<div class="artifact-info">
						<span class="artifact-name">{displayName}</span>
						<div class="artifact-meta">
							<ElementLabel element={artifact.element} size="small" />
							<ProficiencyLabel {proficiency} size="small" />
							<span class="artifact-level">Lv.{artifact.level}</span>
							{#if gradeLetter}
								<span class="grade-badge grade-{gradeLetter.toLowerCase()}">{gradeLetter}</span>
							{/if}
						</div>
					</div>
					{#if isEquipped}
						<span class="equipped-badge">Equipped</span>
					{:else}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<span class="equip-btn-wrapper" onclick={(e) => e.stopPropagation()}>
							<Button variant="primary" size="small" onclick={() => handleEquip(artifact)}>
								Equip
							</Button>
						</span>
					{/if}
				</button>
			{/each}

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!collectionQuery.hasNextPage}
			></div>

			{#if collectionQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={16} />
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
	@use '$src/themes/grades' as grades;

	.artifact-selection-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.filters {
		padding: $unit-2x;
		border-bottom: 1px solid var(--border-secondary);
		flex-shrink: 0;
	}

	.filter-label {
		display: flex;
		align-items: center;
		gap: $unit;
		font-size: $font-small;
		color: var(--text-secondary);
		cursor: pointer;

		input {
			accent-color: var(--accent-color, #3366ff);
		}
	}

	.artifact-list {
		flex: 1;
		overflow-y: auto;
		padding: $unit;
	}

	.artifact-item {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		width: 100%;
		padding: $unit $unit-2x;
		border: none;
		background: var(--list-cell-bg);
		cursor: pointer;
		text-align: left;
		border-radius: $item-corner;
		transition: background 0.15s;
		margin-bottom: $unit;

		&:hover {
			background: var(--list-cell-bg-hover);
		}

		&.equipped {
			background: var(--card-bg-selected, rgba(51, 102, 255, 0.1));
			border: 1px solid var(--accent-color, #3366ff);
		}
	}

	.artifact-image {
		width: 40px;
		height: 40px;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.artifact-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
	}

	.artifact-name {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artifact-meta {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.artifact-level {
		font-size: $font-tiny;
		color: var(--text-secondary);
	}

	.grade-badge {
		font-size: $font-tiny;
		font-weight: $bold;
		padding: 1px 4px;
		border-radius: 3px;
		line-height: 1;

		@include grades.badge-colors;
	}

	.equipped-badge {
		font-size: $font-tiny;
		color: var(--accent-color, #3366ff);
		font-weight: $medium;
		flex-shrink: 0;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--text-secondary);
		gap: $unit;

		:global(svg) {
			color: var(--icon-secondary);
		}

		p {
			margin: 0;
		}
	}

	.loading-state :global(svg) {
		animation: spin 1s linear infinite;
	}

	.load-more-sentinel {
		height: 1px;

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
		font-size: $font-small;

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
