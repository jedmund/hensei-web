<script lang="ts">
	import { isCurator } from '$lib/auth/roles'
	import { onMount, onDestroy, untrack } from 'svelte'
	import { setPartyContext } from '$lib/types/party-context'
	import { pushState } from '$app/navigation'
	import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import { partyStore } from '$lib/stores/partyStore.svelte'

	// Composables
	import { usePartyMutations } from '$lib/composables/party-mutations.svelte'
	import { useGridService } from '$lib/composables/grid-service.svelte'
	import { usePartyActions } from '$lib/composables/party-actions.svelte'
	import { useWikiImport } from '$lib/composables/wiki-import.svelte'
	import { useJobHandlers } from '$lib/composables/job-handlers.svelte'
	import { usePartyDragDrop } from '$lib/composables/party-drag-drop.svelte'
	import { useItemAddition } from '$lib/composables/item-addition.svelte'
	import { useSolomonisRaid } from '$lib/composables/solomonis-raid.svelte'
	import { setDragDropContext } from '$lib/composables/drag-drop.svelte'

	// Utilities
	import { getLocalId } from '$lib/utils/localId'
	import { getEditKey, computeEditability } from '$lib/utils/editKeys'
	import { localizedName } from '$lib/utils/locale'

	import { openSearchSidebar } from '$lib/features/search/openSearchSidebar.svelte'
	import PartySegmentedControl from '$lib/components/party/PartySegmentedControl.svelte'
	import { GridType } from '$lib/types/enums'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import PartyInfoGrid from '$lib/components/party/info/PartyInfoGrid.svelte'
	import StickerPicker from '$lib/components/stickers/StickerPicker.svelte'
	import { setStickerStage } from '$lib/components/stickers/stickerStage.svelte'
	import { canShowStickerPicker } from '$lib/utils/stickers'
	import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
	import PartyDialogs from '$lib/components/party/PartyDialogs.svelte'
	import PartyHeaderMenu from '$lib/components/party/PartyHeaderMenu.svelte'
	import PartyNotices from '$lib/components/party/PartyNotices.svelte'
	import PartyGrids from '$lib/components/party/PartyGrids.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		party?: Party
		canEdit?: boolean
		authUserId?: string
		authUsername?: string
		authUserAvatar?: { picture?: string; element?: string }
		initialTab?: GridType
		isNew?: boolean
		ensurePartyExists?: () => Promise<{ id: string; shortcode: string }>
		initialCollectionSourceUsername?: string
		/** When true, the difficulty tier chip becomes a link to the editor preview */
		isEditor?: boolean
		/** The viewer's account role; curators can feature the team */
		role?: number | null | undefined
	}

	let {
		party: initial,
		canEdit: canEditServer = false,
		authUserId,
		authUsername,
		authUserAvatar,
		initialTab,
		isNew = false,
		ensurePartyExists,
		initialCollectionSourceUsername,
		isEditor = false,
		role
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

	// Derive party from prop. A new, unsaved team ('new') can arrive with items
	// already in it (a starting item from Home's "New team" links).
	let party = $derived(initial?.id && Array.isArray(initial?.weapons) ? initial : defaultParty)

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

	let activeTab = $derived<GridType>(initialTab ?? GridType.Weapon)
	let routerReady = $state(false)
	let selectedSlot = $state<number>(0)

	// Client-side editability
	let localId = $state<string>('')
	let editKey = $state<string | undefined>(undefined)

	// Track whether the user has edited party info on a new unsaved party
	let hasEditedInfo = $state(false)

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

	// ensurePartyExists won't change at runtime — capture intentionally
	const ensurePartyExistsFn = untrack(() =>
		ensurePartyExists ? () => ensurePartyExists() : undefined
	)

	const actions = usePartyActions({
		mutations,
		getParty: () => party,
		canEdit: () => canEdit(),
		getAuthUserId: () => authUserId,
		getAuthUsername: () => authUsername,
		getUserElement: () => userElement,
		getHasCollectionLinks: () => hasCollectionLinks,
		onDetailsUpdated: () => {
			if (isNew && party.id === 'new') hasEditedInfo = true
		},
		handleRaidChange: (raid) => solomonisRaid.handleRaidChange(raid)
	})

	// --- Evoking Solomonis ---
	const solomonisRaid = useSolomonisRaid({
		getParty: () => party,
		updateRaid: (raidId) => actions.updatePartyDetails({ raidId }),
		ensurePartyExists: ensurePartyExistsFn
	})

	// New teams can be filled from a gbf.wiki TeamSpread paste
	const wikiImport = useWikiImport({
		getParty: () => party,
		getAuthUserId: () => authUserId
	})

	const jobHandlers = useJobHandlers({
		mutations,
		getParty: () => party,
		canEdit: () => canEdit(),
		getUserElement: () => userElement,
		ensurePartyExists: ensurePartyExistsFn
	})

	const partyDragDrop = usePartyDragDrop({
		mutations,
		getParty: () => party,
		canEdit: () => canEdit(),
		getActiveTab: () => activeTab,
		setSelectedSlot: (n) => {
			selectedSlot = n
		}
	})
	const dragContext = partyDragDrop.dragContext

	const itemAddition = useItemAddition({
		mutations,
		getParty: () => party,
		canEdit: () => canEdit(),
		getActiveTab: () => activeTab,
		getSelectedSlot: () => selectedSlot,
		setSelectedSlot: (n) => {
			selectedSlot = n
		},
		onSlotAdvance: (newSlot) => {
			const tab = activeTab
			if (tab === GridType.Summon) {
				openSearchSidebar({
					type: 'summon',
					onAddItems: itemAddition.handleAddItems,
					canAddMore: true,
					authUserId,
					userElement,
					onUnlinkCollection: actions.handleUnlinkCollection,
					initialCollectionSourceUsername,
					isFriendSlot: newSlot === 6,
					isSubauraSlot: newSlot === 4 || newSlot === 5
				})
			} else if (tab === GridType.Weapon) {
				openSearchSidebar({
					type: 'weapon',
					onAddItems: itemAddition.handleAddItems,
					canAddMore: true,
					authUserId,
					userElement,
					onUnlinkCollection: actions.handleUnlinkCollection,
					initialCollectionSourceUsername,
					isExtraSlot: newSlot >= 9
				})
			}
		},
		ensurePartyExists: ensurePartyExistsFn
	})

	// --- Derived values ---
	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	const userElement = $derived(party.user?.avatar?.element as ElementType | undefined)

	const hasCollectionLinks = $derived.by(() => {
		const hasLinkedWeapons = (party?.weapons ?? []).some((w) => w?.collectionWeaponId)
		const hasLinkedCharacters = (party?.characters ?? []).some((c) => c?.collectionCharacterId)
		const hasLinkedSummons = (party?.summons ?? []).some((s) => s?.collectionSummonId)
		return hasLinkedWeapons || hasLinkedCharacters || hasLinkedSummons
	})

	// --- Collection viewer switcher ---
	let activeCollectionUser = $state<'viewer' | 'source'>('viewer')

	const authUser = $derived(
		authUserId
			? {
					username: authUsername,
					avatar: authUserAvatar
						? { picture: authUserAvatar.picture ?? null, element: authUserAvatar.element ?? null }
						: null
				}
			: null
	)

	const activeCollection = $derived(
		activeCollectionUser === 'source' && party.sourceCollection
			? party.sourceCollection
			: party.viewerCollection
	)

	function handleSwitchCollectionUser(target: 'viewer' | 'source') {
		activeCollectionUser = target
		partyStore.setActiveCollectionUser(target)
	}

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
					userElement,
					initialCollectionSourceUsername
				})
			}, 100)
		}
	})

	// --- Context setup ---
	// Shared by the sticker picker and the sticker area
	setStickerStage(() => party)
	setPartyContext({
		getParty: () => party,
		canEdit: () => canEdit(),
		getEditKey: () => editKey,
		getSelectedSlot: () => selectedSlot,
		setSelectedSlot: (n: number) => {
			selectedSlot = n
		},
		getActiveTab: () => activeTab,
		services: {
			gridService
		},
		openPicker: (opts: {
			type: 'weapon' | 'summon' | 'character'
			position: number
			item?: GridCharacter | GridWeapon | GridSummon
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
				jobName: requiredProficiencies ? localizedName(party.job?.name) : undefined,
				userElement,
				onUnlinkCollection: actions.handleUnlinkCollection,
				initialCollectionSourceUsername,
				isFriendSlot: opts.type === 'summon' && opts.position === 6,
				isSubauraSlot: opts.type === 'summon' && (opts.position === 4 || opts.position === 5),
				isExtraSlot: opts.type === 'weapon' && opts.position >= 9
			})
		}
	})

	setDragDropContext(dragContext)

	// Hidden on your own team and on teams that can't receive stickers, so the
	// sticker row doesn't show an empty picker slot
	const canGiveSticker = $derived(!isNew && canShowStickerPicker(party, authUserId))
</script>

<svelte:window onpopstate={handlePopState} />

{#snippet stickerPicker()}
	<StickerPicker {party} />
{/snippet}

<div class="page-wrap">
	<div class="track">
		<section class="party-container">
			<PartyInfoGrid
				{party}
				canEdit={canEdit()}
				onOpenDescription={actions.openDescriptionPanel}
				onEditDescription={actions.editDescriptionPanel}
				onOpenEdit={actions.openSettingsPanel}
				onRaidSelect={solomonisRaid.handleRaidSelect}
				{authUser}
				{activeCollectionUser}
				onSwitchCollectionUser={handleSwitchCollectionUser}
				{isEditor}
				stickerPicker={canGiveSticker ? stickerPicker : undefined}
				{canGiveSticker}
			>
				{#snippet remix()}
					{#if !isNew}
						<Tooltip content={m.party_remix()}>
							<Button
								variant="ghost"
								size="small"
								iconOnly
								icon="remix"
								aria-label={m.party_remix()}
								onclick={actions.remixParty}
								disabled={actions.loading}
							/>
						</Tooltip>
					{/if}
				{/snippet}
				{#snippet menu()}
					<PartyHeaderMenu
						{actions}
						{wikiImport}
						{isNew}
						{authUserId}
						{authUsername}
						{hasCollectionLinks}
						canFeature={isCurator(role)}
					/>
				{/snippet}
			</PartyInfoGrid>

			<PartyNotices {hasEditedInfo} {isNew} />

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

			<PartyGrids
				{activeTab}
				{activeCollection}
				isSolomonis={solomonisRaid.isSolomonis}
				{jobHandlers}
				onOpenSettings={actions.openSettingsPanel}
			/>
		</section>
	</div>
</div>

<PartyDialogs {actions} {wikiImport} {itemAddition} {partyDragDrop} {solomonisRaid} {role} />

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

	.error-message {
		padding: $unit-three-quarter;
		background: rgba(209, 58, 58, 0.1);
		border: 1px solid rgba(209, 58, 58, 0.3);
		border-radius: $unit-half;
		color: $error;
		margin-bottom: $unit;
		font-size: $font-small;
	}
</style>
