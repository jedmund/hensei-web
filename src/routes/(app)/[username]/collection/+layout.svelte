<script lang="ts">
	import type { LayoutData } from './$types'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { setContext } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import AddToCollectionModal from '$lib/components/collection/AddToCollectionModal.svelte'
	import BulkDeleteConfirmModal from '$lib/components/collection/BulkDeleteConfirmModal.svelte'
	import { openAddArtifactSidebar } from '$lib/features/collection/openAddArtifactSidebar'
	import {
		createSelectionModeContext,
		SELECTION_MODE_KEY,
		LOADED_IDS_KEY,
		type EntityType
	} from '$lib/stores/selectionMode.svelte'
	import {
		useBulkRemoveCharactersFromCollection,
		useBulkRemoveWeaponsFromCollection,
		useBulkRemoveSummonsFromCollection
	} from '$lib/api/mutations/collection.mutations'
	import { useBulkDeleteCollectionArtifacts } from '$lib/api/mutations/artifact.mutations'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	let { data, children }: { data: LayoutData; children: any } = $props()

	// Query for collection counts
	const countsQuery = createQuery(() => collectionQueries.counts(data.user?.id ?? ''))

	// User's element for elemental styling
	const userElement = $derived(
		data.user?.avatar?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	// Bulk delete mutations
	const bulkDeleteCharacters = useBulkRemoveCharactersFromCollection()
	const bulkDeleteWeapons = useBulkRemoveWeaponsFromCollection()
	const bulkDeleteSummons = useBulkRemoveSummonsFromCollection()
	const bulkDeleteArtifacts = useBulkDeleteCollectionArtifacts()

	let addModalOpen = $state(false)
	let confirmDeleteOpen = $state(false)
	let isDeleting = $state(false)

	// Selection mode context
	const selectionMode = createSelectionModeContext()
	setContext(SELECTION_MODE_KEY, selectionMode)

	// Context for child pages to provide their loaded IDs
	let loadedIds = $state<string[]>([])
	setContext(LOADED_IDS_KEY, {
		setIds: (ids: string[]) => {
			loadedIds = ids
		}
	})

	// Determine active entity type from URL path
	const activeEntityType = $derived.by(() => {
		const path = $page.url.pathname
		if (path.includes('/weapons')) return 'weapons'
		if (path.includes('/summons')) return 'summons'
		if (path.includes('/artifacts')) return 'artifacts'
		return 'characters'
	})

	// Map entity type to singular form for modal (only for supported types)
	const modalEntityType = $derived.by((): 'character' | 'weapon' | 'summon' | undefined => {
		if (activeEntityType === 'weapons') return 'weapon'
		if (activeEntityType === 'summons') return 'summon'
		if (activeEntityType === 'artifacts') return undefined // Artifacts use sidebar instead
		return 'character'
	})

	// Whether the current entity type supports the add modal (all except artifacts)
	const supportsAddModal = $derived(activeEntityType !== 'artifacts')

	// Whether to show the add button for artifacts (uses sidebar instead of modal)
	const isArtifacts = $derived(activeEntityType === 'artifacts')

	// Dynamic button text
	const addButtonText = $derived(`Add ${activeEntityType}`)

	const username = $derived(data.user?.username || $page.params.username)

	function handleTabChange(value: string) {
		// Exit selection mode when switching entity types
		if (selectionMode.isActive) {
			selectionMode.exit()
		}
		goto(`/${username}/collection/${value}`)
	}

	function handleAddArtifact() {
		openAddArtifactSidebar()
	}

	function handleEnterSelectionMode() {
		selectionMode.enter(activeEntityType as EntityType)
	}

	function handleCancelSelection() {
		selectionMode.exit()
	}

	function handleSelectAll() {
		selectionMode.selectAll(loadedIds)
	}

	function handleClearSelection() {
		selectionMode.clearSelection()
	}

	function handleDeleteClick() {
		if (selectionMode.selectedCount > 0) {
			confirmDeleteOpen = true
		}
	}

	async function handleConfirmDelete() {
		isDeleting = true
		const ids = Array.from(selectionMode.selectedIds)

		try {
			// Call the appropriate bulk delete mutation based on entity type
			switch (activeEntityType) {
				case 'characters':
					await bulkDeleteCharacters.mutateAsync(ids)
					break
				case 'weapons':
					await bulkDeleteWeapons.mutateAsync(ids)
					break
				case 'summons':
					await bulkDeleteSummons.mutateAsync(ids)
					break
				case 'artifacts':
					await bulkDeleteArtifacts.mutateAsync(ids)
					break
			}

			selectionMode.exit()
			confirmDeleteOpen = false
		} catch (error) {
			console.error('Failed to delete items:', error)
			toast.error(extractErrorMessage(error, 'Failed to delete items'))
			// Keep modal open on error so user can retry
		} finally {
			isDeleting = false
		}
	}

	function handleCancelDelete() {
		confirmDeleteOpen = false
	}
</script>

<svelte:head>
	<title>{username}</title>
</svelte:head>

<section class="collection">
	<ProfileHeader
		username={username ?? ''}
		avatarPicture={data.user?.avatar?.picture}
		element={data.user?.avatar?.element}
		granblueId={data.user?.granblueId}
		showGranblueId={data.user?.showGranblueId}
		showCrewGamertag={data.user?.showCrewGamertag}
		crewGamertag={data.user?.crewGamertag}
		title={username ?? ''}
		activeTab="collection"
		isOwner={data.isOwner}
	/>

	<div class="card-container">
		<!-- Entity type segmented control -->
		<nav class="entity-nav" aria-label="Collection type">
			{#if selectionMode.isActive}
				<!-- Selection mode UI -->
				<div class="selection-controls-left">
					<span class="selection-count">{selectionMode.selectedCount} selected</span>
					<div class="selection-buttons">
						<Button variant="element-ghost" size="small" element={userElement} onclick={handleSelectAll}>
							Select all
						</Button>
						{#if selectionMode.selectedCount > 0}
							<Button variant="element-ghost" size="small" element={userElement} onclick={handleClearSelection}>
								Clear
							</Button>
						{/if}
					</div>
				</div>
				<div class="selection-controls-right">
					<Button
						variant="destructive"
						size="small"
						onclick={handleDeleteClick}
						disabled={selectionMode.selectedCount === 0}
					>
						Delete
					</Button>
					<Button variant="ghost" size="small" onclick={handleCancelSelection}>
						Cancel
					</Button>
				</div>
			{:else}
				<!-- Normal UI -->
				<SegmentedControl
					value={activeEntityType}
					onValueChange={handleTabChange}
					variant="blended"
					size="small"
					element={userElement}
				>
					<Segment value="characters">
						Characters
						{#if countsQuery.data?.characters != null}
							<span class="count">{countsQuery.data.characters}</span>
						{/if}
					</Segment>
					<Segment value="weapons">
						Weapons
						{#if countsQuery.data?.weapons != null}
							<span class="count">{countsQuery.data.weapons}</span>
						{/if}
					</Segment>
					<Segment value="summons">
						Summons
						{#if countsQuery.data?.summons != null}
							<span class="count">{countsQuery.data.summons}</span>
						{/if}
					</Segment>
					<Segment value="artifacts">
						Artifacts
						{#if countsQuery.data?.artifacts != null}
							<span class="count">{countsQuery.data.artifacts}</span>
						{/if}
					</Segment>
				</SegmentedControl>

				{#if data.isOwner}
					<div class="action-buttons">
						{#if supportsAddModal}
							<Button
								variant="primary"
								size="small"
								onclick={() => (addModalOpen = true)}
								icon="plus"
								iconPosition="left"
							>
								{addButtonText}
							</Button>
						{:else if isArtifacts}
							<Button
								variant="primary"
								size="small"
								onclick={handleAddArtifact}
								icon="plus"
								iconPosition="left"
							>
								Add artifact
							</Button>
						{/if}

						<DropdownMenu>
							{#snippet trigger({ props })}
								<Button {...props} variant="ghost" size="small" iconOnly icon="ellipsis" />
							{/snippet}
							{#snippet menu()}
								<button type="button" class="dropdown-menu-item" onclick={handleEnterSelectionMode}>
									Select {activeEntityType}...
								</button>
							{/snippet}
						</DropdownMenu>
					</div>
				{/if}
			{/if}
		</nav>

		<div class="content">
			<svelte:boundary onerror={(e) => { if (import.meta.env.DEV) console.error('Collection render error:', e) }}>
				{@render children()}
				{#snippet failed(error, reset)}
					<div class="collection-error" role="alert">
						<p>Failed to load collection</p>
						<button onclick={reset}>Retry</button>
					</div>
				{/snippet}
			</svelte:boundary>
		</div>
	</div>
</section>

{#if data.isOwner && modalEntityType}
	<AddToCollectionModal
		userId={data.user.id}
		entityType={modalEntityType}
		bind:open={addModalOpen}
	/>
{/if}

<BulkDeleteConfirmModal
	bind:open={confirmDeleteOpen}
	count={selectionMode.selectedCount}
	entityType={activeEntityType}
	deleting={isDeleting}
	onConfirm={handleConfirmDelete}
	onCancel={handleCancelDelete}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.collection {
		padding: $unit-2x 0;
	}

	.card-container {
		background: var(--card-bg);
		border-radius: $card-corner;
	}

	.entity-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
		padding: $unit-2x;
		min-height: 74px;
	}

	.content {
		padding: 0 $unit-2x $unit-2x;
		min-height: 400px;
	}

	// Action buttons container
	.action-buttons {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	// Selection mode controls
	.selection-controls-left {
		display: flex;
		align-items: center;
		gap: $unit-2x;
	}

	.selection-count {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.selection-buttons {
		display: flex;
		gap: $unit;
	}

	.selection-controls-right {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	// Count badge in segment tabs
	.count {
		margin-left: $unit-half;
		color: inherit;
		opacity: 0.7;
	}
</style>
