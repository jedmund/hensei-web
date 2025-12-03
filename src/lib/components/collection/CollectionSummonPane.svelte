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
	import type { CollectionSummon } from '$lib/types/api/collection'
	import { useUpdateCollectionSummon } from '$lib/api/mutations/collection.mutations'
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

	interface Props {
		summon: CollectionSummon
		isOwner: boolean
		onClose?: () => void
	}

	let { summon: initialSummon, isOwner, onClose }: Props = $props()

	// Local state for the summon - updated when mutation succeeds
	let summon = $state<CollectionSummon>(initialSummon)

	// Tab state
	let selectedTab = $state<'info' | 'collection'>('collection')

	// Edit mode state
	let isEditing = $state(false)

	// Sync local state when a different summon is selected
	$effect(() => {
		summon = initialSummon
		isEditing = false
	})

	// Update mutation
	const updateMutation = useUpdateCollectionSummon()

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
		} catch (error) {
			console.error('Failed to update collection summon:', error)
		}
	}

	function handleCancel() {
		isEditing = false
	}

	function handleTabChange(value: string) {
		selectedTab = value as 'info' | 'collection'
		if (isEditing) {
			isEditing = false
		}
	}

	// Update sidebar header action
	$effect(() => {
		if (isOwner && selectedTab === 'collection' && !isEditing) {
			sidebar.setAction(() => (isEditing = true), 'Edit', elementName)
		} else {
			sidebar.clearAction()
		}
	})

	// Clean up sidebar action when component is destroyed
	$effect(() => {
		return () => {
			sidebar.clearAction()
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
			<Segment value="info">Info</Segment>
			<Segment value="collection">My Collection</Segment>
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
				{summonData}
				{currentValues}
				onSave={handleSave}
				onCancel={handleCancel}
				saving={updateMutation.isPending}
			/>
		{:else}
			<div class="collection-view">
				<DetailsSection title="General">
					<DetailRow label="Uncap Level">
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
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;

	.collection-summon-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: var(--text-primary, colors.$grey-10);
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
