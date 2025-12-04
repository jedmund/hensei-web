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
	import { untrack } from 'svelte'
	import type { CollectionCharacter, ExtendedMastery } from '$lib/types/api/collection'
	import { useUpdateCollectionCharacter } from '$lib/api/mutations/collection.mutations'
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

	interface Props {
		character: CollectionCharacter
		isOwner: boolean
		onClose?: () => void
	}

	let { character: initialCharacter, isOwner, onClose }: Props = $props()

	// Local state for the character - updated when mutation succeeds
	let character = $state<CollectionCharacter>(initialCharacter)

	// Tab state
	let selectedTab = $state<'info' | 'collection'>('collection')

	// Edit mode state
	let isEditing = $state(false)

	// Sync local state when a different character is selected
	$effect(() => {
		character = initialCharacter
		isEditing = false
	})

	// Update mutation
	const updateMutation = useUpdateCollectionCharacter()

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
	const ELEMENT_MAP: Record<number, 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementName = $derived(
		characterData?.element ? ELEMENT_MAP[characterData.element] : undefined
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
		} catch (error) {
			console.error('Failed to update collection character:', error)
		}
	}

	function handleCancel() {
		isEditing = false
	}

	function handleTabChange(value: string) {
		selectedTab = value as 'info' | 'collection'
		// Exit edit mode when switching tabs
		if (isEditing) {
			isEditing = false
		}
	}

	function getRingLabel(ring: ExtendedMastery | null): string {
		if (!ring || ring.modifier === 0) return '—'
		const stat = getRingStat(ring.modifier)
		return stat?.name?.en ?? '—'
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
		return stat?.name?.en ?? '—'
	}

	function getEarringValue(): string {
		if (!character.earring || character.earring.modifier === 0) return ''
		const stat = getElementalizedEarringStat(character.earring.modifier, characterData?.element)
		if (!stat) return String(character.earring.strength)
		return `${character.earring.strength}${stat.suffix}`
	}

	function getAwakeningType(): string {
		if (!character.awakening) return '—'
		const name =
			typeof character.awakening.type.name === 'string'
				? character.awakening.type.name
				: character.awakening.type.name?.en || 'Unknown'
		return name
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

	// Update sidebar header action based on current state
	$effect(() => {
		// Capture reactive dependencies we want to track
		const shouldShowEdit = isOwner && selectedTab === 'collection' && !isEditing
		const element = elementName
		// Use untrack to avoid infinite loop when sidebar.setAction mutates pane state
		untrack(() => {
			if (shouldShowEdit) {
				sidebar.setAction(() => (isEditing = true), 'Edit', element)
			} else {
				sidebar.clearAction()
			}
		})
	})

	// Clean up sidebar action when component is destroyed
	$effect(() => {
		return () => {
			sidebar.clearAction()
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
			<Segment value="info">Info</Segment>
			<Segment value="collection">My Collection</Segment>
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
				{characterData}
				{currentValues}
				showPerpetuity={true}
				onSave={handleSave}
				onCancel={handleCancel}
				saving={updateMutation.isPending}
			/>
		{:else}
			<!-- My Collection view: user's customizations -->
			<div class="collection-view">
				<DetailsSection title="General">
					<DetailRow label="Uncap Level">
						<UncapIndicator
							type="character"
							uncapLevel={character.uncapLevel}
							transcendenceStage={character.transcendenceStep}
							special={characterData?.special}
							flb={characterData?.uncap?.flb}
							ulb={characterData?.uncap?.ulb}
							transcendence={characterData?.uncap?.transcendence}
						/>
					</DetailRow>
					<DetailRow label="Perpetuity Ring" value={character.perpetuity ? 'Equipped' : '—'} />
				</DetailsSection>

				<DetailsSection title="Awakening" empty={!hasAwakening} emptyMessage="Not set">
					<DetailRow label="Type" value={getAwakeningType()} />
					<DetailRow label="Level" value={getAwakeningLevel()} />
				</DetailsSection>

				<DetailsSection title="Over Mastery" empty={!hasRings} emptyMessage="No ring equipped">
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
					title="Aetherial Mastery"
					empty={!hasEarring}
					emptyMessage="No earring equipped"
				>
					<DetailRow label={getEarringLabel()} value={getEarringValue()} />
				</DetailsSection>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;

	.collection-character-pane {
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
