<script lang="ts">
	/**
	 * CollectionSummonPane - Details and edit pane for collection summons
	 *
	 * Displays summon information with two views:
	 * - "Info" tab: Shows base summon stats, call effect, etc.
	 * - "My Collection" tab: Shows user's customizations (uncap, transcendence)
	 *
	 * The "My Collection" tab includes an edit mode using SummonEditPane.
	 */
	import * as m from '$lib/paraglide/messages'
	import { onMount } from 'svelte'
	import type { CollectionSummon } from '$lib/types/api/collection'
	import {
		useUpdateCollectionSummon,
		useRemoveSummonFromCollection
	} from '$lib/api/mutations/collection.mutations'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import ItemHeader from '$lib/components/sidebar/details/ItemHeader.svelte'
	import BasicInfoSection from '$lib/components/sidebar/details/BasicInfoSection.svelte'
	import StatsSection from '$lib/components/sidebar/details/StatsSection.svelte'
	import SummonEditPane, {
		type SummonEditValues,
		type SummonEditUpdates
	} from '$lib/components/collection/SummonEditPane.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { getDatabaseUrl, canAccessDatabase } from '$lib/utils/database'

	interface Props {
		summon: CollectionSummon
		isOwner: boolean
		onClose?: () => void
		paneId?: string
	}

	let { summon: initialSummon, isOwner, onClose, paneId }: Props = $props()

	// Local state for the summon - updated when mutation succeeds
	let summon = $state<CollectionSummon>(initialSummon)

	// Tab state
	let selectedTab = $state<'info' | 'collection'>('collection')

	// Edit mode state
	let isEditing = $state(false)

	// Reference to the edit pane component for calling save()
	let editPaneRef: ReturnType<typeof SummonEditPane> | undefined = $state()

	// Mutations
	const updateMutation = useUpdateCollectionSummon()
	const deleteMutation = useRemoveSummonFromCollection()

	// Derived values
	const summonData = $derived(summon.summon)

	// Current edit values
	const currentValues = $derived<SummonEditValues>({
		uncapLevel: summon.uncapLevel,
		transcendenceStep: summon.transcendenceStep
	})

	// Element name for theming
	const ELEMENT_MAP: Record<number, 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementName = $derived(summonData?.element ? ELEMENT_MAP[summonData.element] : undefined)

	async function handleSave(updates: SummonEditUpdates) {
		try {
			const input: Record<string, unknown> = {}

			if (updates.uncapLevel !== undefined) {
				input.uncapLevel = updates.uncapLevel
			}

			if (updates.transcendenceStep !== undefined) {
				input.transcendenceStep = updates.transcendenceStep
			}

			const updatedSummon = await updateMutation.mutateAsync({
				id: summon.id,
				input
			})

			// Update local state with the response
			summon = updatedSummon

			isEditing = false
			updateActionVisibility()
		} catch (error) {
			console.error('Failed to update collection summon:', error)
			toast.error(extractErrorMessage(error, 'Failed to update summon'))
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
		if (confirm(m.collection_remove_confirm_summon())) {
			deleteMutation.mutate(summon.id, {
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
				sidebar.setActionForPane(paneId, () => editPaneRef?.save(), m.action_save(), elementName)
				sidebar.setOverflowMenuForPane(paneId, undefined)
			} else {
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
		if (isEditing) {
			isEditing = false
		}
		updateActionVisibility()
	}

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))

	function viewInDatabase() {
		if (!summonData?.granblueId) return
		goto(getDatabaseUrl('summon', summonData.granblueId))
	}

	// Set up sidebar action on mount and clean up on destroy
	onMount(() => {
		updateActionVisibility()

		return () => {
			if (paneId) {
				sidebar.setActionForPane(paneId, undefined)
				sidebar.setOverflowMenuForPane(paneId, undefined)
			}
		}
	})
</script>

<div class="collection-summon-pane">
	<ItemHeader
		type="summon"
		item={summon as any}
		itemData={summonData}
		gridUncapLevel={summon.uncapLevel}
		gridTranscendence={summon.transcendenceStep}
	/>

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
			<div class="info-view">
				<BasicInfoSection type="summon" itemData={summonData} />
				<StatsSection
					itemData={summonData}
					gridUncapLevel={summon.uncapLevel}
					gridTranscendence={summon.transcendenceStep}
				/>
			</div>
		{:else if isEditing}
			<SummonEditPane
				bind:this={editPaneRef}
				{summonData}
				{currentValues}
				onSave={handleSave}
			/>
		{:else}
			<div class="collection-view">
				<DetailsSection title={m.section_general()}>
					<DetailRow label={m.label_uncap_level()}>
						<UncapIndicator
							type="summon"
							uncapLevel={summon.uncapLevel}
							transcendenceStage={summon.transcendenceStep}
							flb={summonData?.uncap?.flb}
							ulb={summonData?.uncap?.ulb}
							transcendence={summonData?.uncap?.transcendence}
						/>
					</DetailRow>
				</DetailsSection>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.collection-summon-pane {
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
