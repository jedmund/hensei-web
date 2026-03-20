<script lang="ts">
	import type { LayoutData } from './$types'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'
	import { setContext } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { viewMode } from '$lib/stores/viewMode.svelte'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import CollectionSegmentedControl from '$lib/components/collection/CollectionSegmentedControl.svelte'
	import ViewModeToggle from '$lib/components/ui/ViewModeToggle.svelte'
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

	// Localized entity names for parameterized messages
	const entityNameMap = {
		characters: m.collection_entity_characters(),
		weapons: m.collection_entity_weapons(),
		summons: m.collection_entity_summons(),
		artifacts: m.collection_entity_artifacts()
	} as Record<string, string>

	const addButtonText = $derived(m.collection_add_type({ type: entityNameMap[activeEntityType] ?? activeEntityType }))

	const username = $derived(data.user?.username || $page.params.username)

	function handleTabChange(value: string) {
		// Exit selection mode when switching entity types
		if (selectionMode.isActive) {
			selectionMode.exit()
		}
		sidebar.close()
		goto(localizeHref(`/${username}/collection/${value}`))
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
			toast.error(extractErrorMessage(error, m.collection_delete_error()))
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
		wikiProfile={data.user?.wikiProfile}
		showWikiProfile={data.user?.showWikiProfile}
		youtube={data.user?.youtube}
		showYoutube={data.user?.showYoutube}
		showCrewGamertag={data.user?.showCrewGamertag}
		crewGamertag={data.user?.crewGamertag}
		title={username ?? ''}
		activeTab="collection"
		isOwner={data.isOwner}
		collectionPrivacy={data.user?.collectionPrivacy}
		isAuthenticated={$page.data?.isAuthenticated}
	/>

	<div class="card-container">
		<!-- Entity type segmented control -->
		<nav class="entity-nav" aria-label="Collection type">
			{#if selectionMode.isActive}
				<!-- Selection mode UI -->
				<div class="selection-controls-left">
					<span class="selection-count">{m.collection_selected_count({ count: selectionMode.selectedCount })}</span>
					<div class="selection-buttons">
						<Button variant="element-ghost" size="small" element={userElement} onclick={handleSelectAll}>
							{m.collection_select_all()}
						</Button>
						{#if selectionMode.selectedCount > 0}
							<Button variant="element-ghost" size="small" element={userElement} onclick={handleClearSelection}>
								{m.collection_clear_selection()}
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
						{m.collection_delete()}
					</Button>
					<Button variant="ghost" size="small" onclick={handleCancelSelection}>
						{m.collection_cancel()}
					</Button>
				</div>
			{:else}
				<!-- Normal UI -->
				<CollectionSegmentedControl
					{activeEntityType}
					onValueChange={handleTabChange}
					element={userElement}
					counts={countsQuery.data}
				/>

				<div class="nav-right">
					<ViewModeToggle
						value={viewMode.collectionView}
						onValueChange={(mode) => viewMode.setCollectionView(mode)}
						element={userElement}
					/>
					{#if data.isOwner}
						<DropdownMenu>
							{#snippet trigger({ props })}
								<Button {...props} variant="ghost" size="small" iconOnly icon="ellipsis" />
							{/snippet}
							{#snippet menu()}
								{#if supportsAddModal}
									<button type="button" class="dropdown-menu-item" onclick={() => (addModalOpen = true)}>
										{addButtonText}
									</button>
								{:else if isArtifacts}
									<button type="button" class="dropdown-menu-item" onclick={handleAddArtifact}>
										{m.collection_add_artifact()}
									</button>
								{/if}
								<div class="dropdown-menu-separator"></div>
								<button type="button" class="dropdown-menu-item danger" onclick={handleEnterSelectionMode}>
									{m.collection_delete_type({ type: entityNameMap[activeEntityType] ?? activeEntityType })}
								</button>
							{/snippet}
						</DropdownMenu>
					{/if}
				</div>
			{/if}
		</nav>

		<div class="content">
			<svelte:boundary onerror={(e) => { if (import.meta.env.DEV) console.error('Collection render error:', e) }}>
				{@render children()}
				{#snippet failed(error, reset)}
					<div class="collection-error" role="alert">
						<p>{m.collection_load_error()}</p>
						<button onclick={reset}>{m.retry()}</button>
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
		{userElement}
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
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
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

	.nav-right {
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

</style>
