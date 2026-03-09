<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { setPartyContext } from '$lib/types/party-context'
	import { pushState } from '$app/navigation'
	import type { Party } from '$lib/types/api/party'
	import { partyStore } from '$lib/stores/partyStore.svelte'

	// Composables
	import { usePartyMutations } from '$lib/composables/party-mutations.svelte'
	import { useGridService } from '$lib/composables/grid-service.svelte'
	import { usePartyActions } from '$lib/composables/party-actions.svelte'
	import { useJobHandlers } from '$lib/composables/job-handlers.svelte'
	import { usePartyDragDrop } from '$lib/composables/party-drag-drop.svelte'
	import { useItemAddition } from '$lib/composables/item-addition.svelte'
	import { setDragDropContext } from '$lib/composables/drag-drop.svelte'

	// Utilities
	import { getLocalId } from '$lib/utils/localId'
	import { getEditKey, computeEditability } from '$lib/utils/editKeys'

	import WeaponGrid from '$lib/components/grids/WeaponGrid.svelte'
	import SummonGrid from '$lib/components/grids/SummonGrid.svelte'
	import CharacterGrid from '$lib/components/grids/CharacterGrid.svelte'
	import { openSearchSidebar } from '$lib/features/search/openSearchSidebar.svelte'
	import PartySegmentedControl from '$lib/components/party/PartySegmentedControl.svelte'
	import { GridType } from '$lib/types/enums'
	import Icon from '$lib/components/Icon.svelte'
	import PartyInfoGrid from '$lib/components/party/info/PartyInfoGrid.svelte'
	import { DropdownMenu } from 'bits-ui'
	import DropdownItem from '$lib/components/ui/dropdown/DropdownItem.svelte'
	import JobSection from '$lib/components/job/JobSection.svelte'
	import { Gender } from '$lib/utils/jobUtils'
	import { createQuery } from '@tanstack/svelte-query'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
	import ConflictDialog from '$lib/components/dialogs/ConflictDialog.svelte'
	import DeleteTeamDialog from '$lib/components/dialogs/DeleteTeamDialog.svelte'

	interface Props {
		party?: Party
		canEdit?: boolean
		authUserId?: string
		initialTab?: GridType
		isNew?: boolean
		ensurePartyExists?: () => Promise<{ id: string; shortcode: string }>
	}

	let {
		party: initial,
		canEdit: canEditServer = false,
		authUserId,
		initialTab,
		isNew = false,
		ensurePartyExists
	}: Props = $props()

	// Default empty party
	const defaultParty: Party = {
		id: 'new',
		shortcode: 'new',
		name: '',
		description: '',
		weapons: [],
		summons: [],
		characters: []
	}

	// Derive party from prop
	let party = $derived(
		initial?.id && initial?.id !== 'new' && Array.isArray(initial?.weapons) ? initial : defaultParty
	)

	// Sync party to global store
	$effect(() => {
		partyStore.setParty(party)
	})
	onDestroy(() => {
		partyStore.clear()
	})

	// --- State ---
	const tabMap: Record<string, GridType> = {
		weapons: GridType.Weapon,
		summons: GridType.Summon,
		characters: GridType.Character
	}

	let activeTab = $state<GridType>(initialTab ?? GridType.Weapon)
	let routerReady = $state(false)
	let selectedSlot = $state<number>(0)

	// Client-side editability
	let localId = $state<string>('')
	let editKey = $state<string | undefined>(undefined)

	let canEdit = $derived(() => {
		if (isNew) return true
		if (canEditServer) return true
		const result = computeEditability(party, authUserId, localId, editKey)
		return result.canEdit
	})

	// --- Composables ---
	const mutations = usePartyMutations()

	const gridService = useGridService(
		mutations,
		() => party.shortcode,
		() => party.id
	)

	const actions = usePartyActions({
		mutations,
		getParty: () => party,
		canEdit: () => canEdit(),
		getAuthUserId: () => authUserId,
		getUserElement: () => userElement,
		getHasCollectionLinks: () => hasCollectionLinks
	})

	const jobHandlers = useJobHandlers({
		mutations,
		getParty: () => party,
		canEdit: () => canEdit(),
		ensurePartyExists: ensurePartyExists ? (() => ensurePartyExists()) : undefined
	})

	const { dragContext } = usePartyDragDrop({
		mutations,
		getParty: () => party,
		canEdit: () => canEdit()
	})

	const itemAddition = useItemAddition({
		mutations,
		getParty: () => party,
		canEdit: () => canEdit(),
		getActiveTab: () => activeTab,
		getSelectedSlot: () => selectedSlot,
		setSelectedSlot: (n) => {
			selectedSlot = n
		},
		ensurePartyExists: ensurePartyExists ? (() => ensurePartyExists()) : undefined
	})

	// --- Derived values ---
	const mainWeapon = $derived((party?.weapons ?? []).find((w) => w?.mainhand || w?.position === -1))
	const mainWeaponElement = $derived(mainWeapon?.element ?? mainWeapon?.weapon?.element)
	const partyElement = $derived((party as any)?.element)

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	const userElement = $derived(party.user?.avatar?.element as ElementType | undefined)

	const hasCollectionLinks = $derived.by(() => {
		const hasLinkedWeapons = (party?.weapons ?? []).some((w) => w?.collectionWeaponId)
		const hasLinkedCharacters = (party?.characters ?? []).some((c) => c?.collectionCharacterId)
		const hasLinkedSummons = (party?.summons ?? []).some((s) => s?.collectionSummonId)
		return hasLinkedWeapons || hasLinkedCharacters || hasLinkedSummons
	})

	const hasOrphanedItems = $derived.by(() => {
		const hasOrphanedWeapons = (party?.weapons ?? []).some((w) => w?.orphaned)
		const hasOrphanedCharacters = (party?.characters ?? []).some((c) => c?.orphaned)
		const hasOrphanedSummons = (party?.summons ?? []).some((s) => s?.orphaned)
		return hasOrphanedWeapons || hasOrphanedCharacters || hasOrphanedSummons
	})

	// Collection ownership check
	const collectionGranblueIdsQuery = createQuery(() => ({
		...collectionQueries.granblueIds(party.collectionSourceUserId ?? ''),
		enabled: !!party.collectionSourceUserId
	}))

	const collectionWeaponIds = $derived(
		collectionGranblueIdsQuery.data
			? new Set(collectionGranblueIdsQuery.data.weapons.map(String))
			: undefined
	)
	const collectionCharacterIds = $derived(
		collectionGranblueIdsQuery.data
			? new Set(collectionGranblueIdsQuery.data.characters.map(String))
			: undefined
	)
	const collectionSummonIds = $derived(
		collectionGranblueIdsQuery.data
			? new Set(collectionGranblueIdsQuery.data.summons.map(String))
			: undefined
	)

	// --- Tab management ---
	function handleTabChange(tab: GridType) {
		activeTab = tab

		if (!isNew && routerReady) {
			const basePath = `/teams/${party.shortcode}`
			const newPath = `${basePath}/${tab}s`
			pushState(newPath, {})
		}

		const nextEmpty = findNextEmptySlot(party, tab)
		if (nextEmpty !== SLOT_NOT_FOUND) {
			selectedSlot = nextEmpty
		} else {
			selectedSlot = 0
		}
	}

	function handlePopState() {
		if (isNew) return
		const path = window.location.pathname
		const match = path.match(/\/teams\/[^/]+\/(\w+)$/)
		const urlTabSlug = match?.[1]
		const newTab = urlTabSlug ? (tabMap[urlTabSlug] ?? GridType.Weapon) : GridType.Weapon
		if (activeTab !== newTab) {
			activeTab = newTab
		}
	}

	// --- Initialization ---
	onMount(() => {
		localId = getLocalId()
		editKey = getEditKey(party.shortcode) ?? undefined
		routerReady = true

		// For new parties, open search sidebar on mount
		if (isNew) {
			selectedSlot = -1
			setTimeout(() => {
				openSearchSidebar({
					type: 'weapon',
					onAddItems: itemAddition.handleAddItems,
					canAddMore: true,
					authUserId,
					userElement
				})
			}, 100)
		}
	})

	// --- Context setup ---
	setPartyContext({
		getParty: () => party,
		updateParty: () => {},
		canEdit: () => canEdit(),
		getEditKey: () => editKey,
		getSelectedSlot: () => selectedSlot,
		getActiveTab: () => activeTab,
		services: {
			gridService
		},
		openPicker: (opts: {
			type: 'weapon' | 'summon' | 'character'
			position: number
			item?: any
		}) => {
			if (!canEdit()) return
			selectedSlot = opts.position
			activeTab =
				opts.type === 'weapon'
					? GridType.Weapon
					: opts.type === 'summon'
						? GridType.Summon
						: GridType.Character

			const requiredProficiencies =
				opts.type === 'weapon' && opts.position === -1 && party.job?.proficiency
					? party.job.proficiency.filter(
							(p): p is number => p !== null && p !== undefined && p !== 0
						)
					: undefined

			openSearchSidebar({
				type: opts.type,
				onAddItems: itemAddition.handleAddItems,
				canAddMore: true,
				authUserId,
				requiredProficiencies,
				userElement,
				onUnlinkCollection: actions.handleUnlinkCollection
			})
		}
	})

	setDragDropContext(dragContext)
</script>

<svelte:window onpopstate={handlePopState} />

<div class="page-wrap">
	<div class="track">
		<section class="party-container">
			<PartyInfoGrid
				{party}
				canEdit={canEdit()}
				onOpenDescription={actions.openDescriptionPanel}
				onOpenEdit={actions.openSettingsPanel}
			>
				{#snippet menu()}
					{#if !isNew}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class="party-actions-trigger" aria-label="Open actions menu">
								<Icon name="ellipsis" size={14} />
							</DropdownMenu.Trigger>

							<DropdownMenu.Portal>
								<DropdownMenu.Content class="dropdown-content" sideOffset={6} align="end">
									{#if canEdit() && hasCollectionLinks}
										<DropdownItem>
											<button onclick={actions.syncFromCollection} disabled={actions.loading || actions.isSyncingAll}>
												{actions.isSyncingAll ? 'Syncing...' : 'Sync from collection'}
											</button>
										</DropdownItem>
										<DropdownMenu.Separator class="dropdown-separator" />
									{/if}

									{#if authUserId}
										<DropdownItem>
											<button onclick={actions.toggleFavorite} disabled={actions.loading}>
												{party.favorited ? 'Remove from favorites' : 'Add to favorites'}
											</button>
										</DropdownItem>
									{/if}

									<DropdownItem>
										<button onclick={actions.remixParty} disabled={actions.loading}>Remix</button>
									</DropdownItem>

									{#if party.user?.id === authUserId}
										<DropdownMenu.Separator class="dropdown-separator" />
										<DropdownItem>
											<button onclick={() => (actions.deleteDialogOpen = true)} disabled={actions.loading}>
												Delete
											</button>
										</DropdownItem>
									{/if}
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					{/if}
				{/snippet}
			</PartyInfoGrid>

			{#if hasOrphanedItems}
				<div class="orphan-warning" role="alert">
					<Icon name="alertTriangle" size={16} />
					<span>Some items in this party are no longer in your collection and may have outdated data.</span>
				</div>
			{/if}

			<PartySegmentedControl
				selectedTab={activeTab}
				onTabChange={handleTabChange}
				{party}
				class="party-tabs"
			/>

			{#if actions.error}
				<div class="error-message" role="alert">
					{actions.error}
				</div>
			{/if}

			<div class="party-content">
				<svelte:boundary onerror={(e) => { if (import.meta.env.DEV) console.error('Grid render error:', e) }}>
				{#if activeTab === GridType.Weapon}
					<WeaponGrid
						weapons={party.weapons}
						raidExtra={(party as any)?.raid?.group?.extra}
						showGuidebooks={(party as any)?.raid?.group?.guidebooks}
						guidebooks={(party as any)?.guidebooks}
						{collectionWeaponIds}
					/>
				{:else if activeTab === GridType.Summon}
					<SummonGrid summons={party.summons} {collectionSummonIds} />
				{:else}
					<div class="character-tab-content">
						<JobSection
							job={party.job}
							jobSkills={party.jobSkills}
							accessory={party.accessory}
							canEdit={canEdit()}
							gender={Gender.Gran}
							element={mainWeaponElement}
							onSelectJob={jobHandlers.handleSelectJob}
							onSelectSkill={jobHandlers.handleSelectJobSkill}
							onRemoveSkill={jobHandlers.handleRemoveJobSkill}
							onSelectAccessory={() => {
								// TODO: Open accessory selection sidebar
							}}
						/>
						<CharacterGrid
							characters={party.characters}
							{mainWeaponElement}
							{partyElement}
							unlimited={(party as any)?.raid?.group?.unlimited}
							{collectionCharacterIds}
						/>
					</div>
				{/if}
				{#snippet failed(error, reset)}
					<div class="grid-error" role="alert">
						<p>Failed to render grid</p>
						<button onclick={reset}>Retry</button>
					</div>
				{/snippet}
				</svelte:boundary>
			</div>
		</section>
	</div>
</div>

<!-- Delete Confirmation Dialog -->
<DeleteTeamDialog
	bind:open={actions.deleteDialogOpen}
	partyName={party.name || 'Untitled'}
	deleting={actions.deleting}
	onDelete={actions.deleteParty}
	onCancel={() => (actions.deleteDialogOpen = false)}
/>

<!-- Conflict Resolution Dialog -->
<ConflictDialog
	bind:open={itemAddition.conflictDialogOpen}
	conflict={itemAddition.conflictData}
	partyId={party.id}
	partyShortcode={party.shortcode}
	onResolve={itemAddition.resolveConflict}
	onCancel={itemAddition.cancelConflict}
/>

<style lang="scss">
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as *;

	.page-wrap {
		position: relative;
		--panel-w: 380px;
		overflow: visible;
	}

	.track {
		display: flex;
		gap: 0;
		align-items: flex-start;
	}

	.party-container {
		width: 1200px;
		margin: 0 auto;
		gap: $unit-2x;
		display: flex;
		flex-direction: column;
	}

	:global(.party-actions-trigger) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		padding: $unit;
		border-radius: $input-corner;
		background-color: transparent;
		color: var(--text-secondary);
		border: none;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			color 0.2s ease;
		outline: none;

		&:hover {
			background-color: var(--button-bg);
			color: var(--text-primary);
		}

		&:focus-visible {
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}

		&:active {
			background-color: var(--button-subtle-bg-active);
		}
	}

	.error-message {
		padding: $unit-three-quarter;
		background: rgba(209, 58, 58, 0.1);
		border: 1px solid rgba(209, 58, 58, 0.3);
		border-radius: $unit-half;
		color: $error;
		margin-bottom: $unit;
		font-size: $font-small;
	}

	.party-content {
		min-height: 400px;
	}

	.character-tab-content {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.orphan-warning {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x;
		background: rgba(209, 137, 58, 0.15);
		border: 1px solid rgba(209, 137, 58, 0.4);
		border-radius: $unit-half;
		color: var(--accent-yellow);
		font-size: $font-small;

		:global(svg) {
			flex-shrink: 0;
			color: var(--accent-yellow);
		}
	}
</style>
