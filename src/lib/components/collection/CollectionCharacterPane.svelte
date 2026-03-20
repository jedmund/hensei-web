<script lang="ts">
	/**
	 * CollectionCharacterPane - Details and edit pane for collection characters
	 *
	 * Displays character information with two views:
	 * - "Info" tab: Shows base character stats, skills, etc.
	 * - "My Collection" tab: Shows user's customizations (rings, earring, awakening, etc.)
	 *
	 * The "My Collection" tab includes an edit mode using CharacterEditPane.
	 */
	import * as m from '$lib/paraglide/messages'
	import { onMount } from 'svelte'
	import type { CollectionCharacter, ExtendedMastery } from '$lib/types/api/collection'
	import {
		useUpdateCollectionCharacter,
		useRemoveCharacterFromCollection
	} from '$lib/api/mutations/collection.mutations'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import ItemHeader from '$lib/components/sidebar/details/ItemHeader.svelte'
	import BasicInfoSection from '$lib/components/sidebar/details/BasicInfoSection.svelte'
	import StatsSection from '$lib/components/sidebar/details/StatsSection.svelte'
	import SkillsSection from '$lib/components/sidebar/details/SkillsSection.svelte'
	import CharacterEditPane, {
		type CharacterEditValues,
		type CharacterEditUpdates
	} from '$lib/components/sidebar/CharacterEditPane.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getRingStat, getElementalizedEarringStat } from '$lib/utils/masteryUtils'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { localizedName } from '$lib/utils/locale'
	import { getDatabaseUrl, canAccessDatabase } from '$lib/utils/database'
	import { getElementKey } from '$lib/utils/element'

	interface Props {
		character: CollectionCharacter
		isOwner: boolean
		onClose?: () => void
		paneId?: string
		initialEdit?: boolean
	}

	let { character: initialCharacter, isOwner, onClose, paneId, initialEdit = false }: Props = $props()

	// Local state for the character - updated when mutation succeeds
	let character = $state<CollectionCharacter>(initialCharacter)

	// Tab state
	let selectedTab = $state<'info' | 'collection'>('collection')

	// Edit mode state
	let isEditing = $state(false)

	// Reference to the edit pane component for calling save()
	let editPaneRef: ReturnType<typeof CharacterEditPane> | undefined = $state()

	// Mutations
	const updateMutation = useUpdateCollectionCharacter()
	const deleteMutation = useRemoveCharacterFromCollection()

	// Derived values
	const characterData = $derived(character.character)

	// Current edit values from the collection character
	const currentValues = $derived<CharacterEditValues>({
		uncapLevel: character.uncapLevel,
		transcendenceStep: character.transcendenceStep,
		awakening: character.awakening
			? {
					type: character.awakening.type,
					level: character.awakening.level
				}
			: null,
		rings: [
			character.ring1 ?? { modifier: 1, strength: 0 },
			character.ring2 ?? { modifier: 2, strength: 0 },
			character.ring3 ?? { modifier: 0, strength: 0 },
			character.ring4 ?? { modifier: 0, strength: 0 }
		],
		earring: character.earring,
		perpetuity: character.perpetuity
	})

	// Element name for theming
	const elementName = $derived(
		characterData?.element ? getElementKey(characterData.element) : undefined
	)

	async function handleSave(updates: CharacterEditUpdates) {
		try {
			// Transform updates to API format
			const input: Record<string, unknown> = {}

			// Handle uncap level
			if (updates.uncapLevel !== undefined) {
				input.uncapLevel = updates.uncapLevel
			}

			// Handle transcendence step
			if (updates.transcendenceStep !== undefined) {
				input.transcendenceStep = updates.transcendenceStep
			}

			// Handle awakening
			if (updates.awakening !== undefined) {
				if (updates.awakening === null) {
					input.awakeningId = null
					input.awakeningLevel = null
				} else {
					input.awakeningId = updates.awakening.id
					input.awakeningLevel = updates.awakening.level
				}
			}

			// Handle rings (API expects ring1, ring2, ring3, ring4)
			if (updates.rings) {
				updates.rings.forEach((ring, index) => {
					const key = `ring${index + 1}` as keyof typeof input
					input[key] = ring
				})
			}

			// Handle earring
			if (updates.earring !== undefined) {
				input.earring = updates.earring
			}

			// Handle perpetuity
			if (updates.perpetuity !== undefined) {
				input.perpetuity = updates.perpetuity
			}

			const updatedCharacter = await updateMutation.mutateAsync({
				id: character.id,
				input
			})

			// Update local state with the response from the server
			character = updatedCharacter

			isEditing = false
			updateActionVisibility()
		} catch (error) {
			console.error('Failed to update collection character:', error)
			toast.error(extractErrorMessage(error, 'Failed to update character'))
		}
	}

	// Enter edit mode and update header action
	function enterEditMode() {
		isEditing = true
		if (paneId) {
			sidebar.setActionForPane(paneId, () => editPaneRef?.save(), m.action_save(), elementName)
		}
	}

	// Handle delete from collection
	function handleDelete() {
		if (confirm(m.collection_remove_confirm_character())) {
			deleteMutation.mutate(character.id, {
				onSuccess: () => {
					onClose?.()
				}
			})
		}
	}

	// Update action visibility when tab or edit state changes
	function updateActionVisibility() {
		if (!paneId) return

		const dbMenuItem = canViewDatabase
			? { label: m.context_view_in_database(), handler: viewInDatabase }
			: undefined

		if (isOwner && selectedTab === 'collection') {
			if (isEditing) {
				// Show Save button when editing, hide overflow menu
				sidebar.setActionForPane(paneId, () => editPaneRef?.save(), m.action_save(), elementName)
				sidebar.setOverflowMenuForPane(paneId, undefined)
			} else {
				// Show Edit button and overflow menu when viewing
				sidebar.setActionForPane(paneId, enterEditMode, m.action_edit(), elementName)
				const menuItems = [
					...(dbMenuItem ? [dbMenuItem] : []),
					{
						label: m.collection_remove_from(),
						handler: handleDelete,
						variant: 'danger' as const
					}
				]
				sidebar.setOverflowMenuForPane(paneId, menuItems)
			}
		} else {
			sidebar.setActionForPane(paneId, undefined)
			sidebar.setOverflowMenuForPane(paneId, dbMenuItem ? [dbMenuItem] : undefined)
		}
	}

	function handleCancel() {
		isEditing = false
		updateActionVisibility()
	}

	function handleTabChange(value: string) {
		selectedTab = value as 'info' | 'collection'
		// Exit edit mode when switching tabs
		if (isEditing) {
			isEditing = false
		}
		// Update sidebar action visibility after state change
		updateActionVisibility()
	}

	function getRingLabel(ring: ExtendedMastery | null): string {
		if (!ring || ring.modifier === 0) return '—'
		const stat = getRingStat(ring.modifier)
		return localizedName(stat?.name)
	}

	function getRingValue(ring: ExtendedMastery | null): string {
		if (!ring || ring.modifier === 0) return ''
		const stat = getRingStat(ring.modifier)
		if (!stat) return String(ring.strength)
		return `${ring.strength}${stat.suffix}`
	}

	function getEarringLabel(): string {
		if (!character.earring || character.earring.modifier === 0) return '—'
		const stat = getElementalizedEarringStat(character.earring.modifier, characterData?.element)
		return localizedName(stat?.name)
	}

	function getEarringValue(): string {
		if (!character.earring || character.earring.modifier === 0) return ''
		const stat = getElementalizedEarringStat(character.earring.modifier, characterData?.element)
		if (!stat) return String(character.earring.strength)
		return `${character.earring.strength}${stat.suffix}`
	}

	function getAwakeningType(): string {
		if (!character.awakening) return '—'
		return localizedName(character.awakening.type.name)
	}

	function getAwakeningLevel(): string {
		if (!character.awakening) return '—'
		return String(character.awakening.level)
	}

	// Check if awakening is set
	const hasAwakening = $derived(character.awakening !== null)

	// Check if any rings are equipped (modifier must be a positive number)
	const hasRings = $derived(
		(character.ring1?.modifier != null && character.ring1.modifier !== 0) ||
			(character.ring2?.modifier != null && character.ring2.modifier !== 0) ||
			(character.ring3?.modifier != null && character.ring3.modifier !== 0) ||
			(character.ring4?.modifier != null && character.ring4.modifier !== 0)
	)

	// Check if earring is equipped (modifier must be a positive number)
	const hasEarring = $derived(
		character.earring && character.earring.modifier != null && character.earring.modifier !== 0
	)

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))

	function viewInDatabase() {
		if (!characterData?.granblueId) return
		goto(getDatabaseUrl('character', characterData.granblueId, characterData.styleSwap))
	}

	// Set up sidebar action on mount and clean up on destroy
	onMount(() => {
		if (initialEdit && isOwner) {
			selectedTab = 'collection'
			enterEditMode()
		} else {
			updateActionVisibility()
		}

		return () => {
			if (paneId) {
				sidebar.setActionForPane(paneId, undefined)
				sidebar.setOverflowMenuForPane(paneId, undefined)
			}
		}
	})
</script>

<div class="collection-character-pane">
	<ItemHeader
		type="character"
		item={character as any}
		itemData={characterData}
		gridUncapLevel={character.uncapLevel}
		gridTranscendence={character.transcendenceStep}
	/>

	<!-- Tab navigation -->
	<div class="tab-nav">
		<SegmentedControl
			value={selectedTab}
			onValueChange={handleTabChange}
			variant="background"
			size="small"
			grow
		>
			<Segment value="info">{m.collection_pane_info()}</Segment>
			<Segment value="collection">{m.collection_pane_my_collection()}</Segment>
		</SegmentedControl>
	</div>

	<div class="pane-content">
		{#if selectedTab === 'info'}
			<!-- Info view: base character data -->
			<div class="info-view">
				<BasicInfoSection type="character" itemData={characterData} />
				<StatsSection
					itemData={characterData}
					gridUncapLevel={character.uncapLevel}
					gridTranscendence={character.transcendenceStep}
				/>
				<SkillsSection type="character" itemData={characterData} />
			</div>
		{:else if isEditing}
			<!-- Edit mode -->
			<CharacterEditPane
				bind:this={editPaneRef}
				{characterData}
				{currentValues}
				showPerpetuity={true}
				onSave={handleSave}
			/>
		{:else}
			<!-- My Collection view: user's customizations -->
			<div class="collection-view">
				<DetailsSection title={m.section_general()}>
					<DetailRow label={m.label_uncap_level()}>
						<UncapIndicator
							type="character"
							uncapLevel={character.uncapLevel}
							transcendenceStage={character.transcendenceStep}
							special={characterData?.special}
							flb={characterData?.uncap?.flb}
							ulb={characterData?.uncap?.transcendence}
							transcendence={characterData?.uncap?.transcendence}
						/>
					</DetailRow>
					<DetailRow label={m.label_perpetuity_ring()} value={character.perpetuity ? m.label_equipped() : '—'} />
				</DetailsSection>

				<DetailsSection title={m.details_awakening()} empty={!hasAwakening} emptyMessage={m.collection_not_set()}>
					<DetailRow label={m.label_type()} value={getAwakeningType()} />
					<DetailRow label={m.label_level()} value={getAwakeningLevel()} />
				</DetailsSection>

				<DetailsSection title={m.details_over_mastery()} empty={!hasRings} emptyMessage={m.collection_no_ring()}>
					{#if character.ring1?.modifier != null && character.ring1.modifier !== 0}
						<DetailRow
							label={getRingLabel(character.ring1)}
							value={getRingValue(character.ring1)}
						/>
					{/if}
					{#if character.ring2?.modifier != null && character.ring2.modifier !== 0}
						<DetailRow
							label={getRingLabel(character.ring2)}
							value={getRingValue(character.ring2)}
						/>
					{/if}
					{#if character.ring3?.modifier != null && character.ring3.modifier !== 0}
						<DetailRow
							label={getRingLabel(character.ring3)}
							value={getRingValue(character.ring3)}
						/>
					{/if}
					{#if character.ring4?.modifier != null && character.ring4.modifier !== 0}
						<DetailRow
							label={getRingLabel(character.ring4)}
							value={getRingValue(character.ring4)}
						/>
					{/if}
				</DetailsSection>

				<DetailsSection
					title={m.details_aetherial_mastery()}
					empty={!hasEarring}
					emptyMessage={m.collection_no_earring()}
				>
					<DetailRow label={getEarringLabel()} value={getEarringValue()} />
				</DetailsSection>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.collection-character-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: var(--text-primary);
	}

	.tab-nav {
		padding: spacing.$unit-2x;
	}

	.pane-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.info-view {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-4x;
		padding: 0 spacing.$unit-2x;
	}

	.collection-view {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}
</style>
