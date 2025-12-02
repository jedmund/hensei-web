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
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		character: CollectionCharacter
		isOwner: boolean
		onClose?: () => void
	}

	let { character, isOwner, onClose }: Props = $props()

	// Tab state
	let selectedTab = $state<'info' | 'collection'>('collection')

	// Edit mode state
	let isEditing = $state(false)

	// Update mutation
	const updateMutation = useUpdateCollectionCharacter()

	// Derived values
	const characterData = $derived(character.character)

	// Current edit values from the collection character
	const currentValues = $derived<CharacterEditValues>({
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

			await updateMutation.mutateAsync({
				id: character.id,
				input
			})

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

	function displayRing(ring: ExtendedMastery | null): string {
		if (!ring || ring.modifier === 0) return '—'
		// TODO: Add proper ring modifier labels
		return `Modifier ${ring.modifier}: ${ring.strength}`
	}

	function displayAwakening(): string {
		if (!character.awakening) return '—'
		const name =
			typeof character.awakening.type.name === 'string'
				? character.awakening.type.name
				: character.awakening.type.name?.en || 'Unknown'
		return `${name} Lv.${character.awakening.level}`
	}
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
		<SegmentedControl value={selectedTab} onValueChange={handleTabChange} variant="background" grow>
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
				<div class="customization-section">
					<h4>Awakening</h4>
					<p>{displayAwakening()}</p>
				</div>

				<div class="customization-section">
					<h4>Over Mastery Rings</h4>
					<div class="rings-list">
						<p>Ring 1: {displayRing(character.ring1)}</p>
						<p>Ring 2: {displayRing(character.ring2)}</p>
						<p>Ring 3: {displayRing(character.ring3)}</p>
						<p>Ring 4: {displayRing(character.ring4)}</p>
					</div>
				</div>

				<div class="customization-section">
					<h4>Aetherial Mastery</h4>
					<p>{displayRing(character.earring)}</p>
				</div>

				<div class="customization-section">
					<h4>Perpetuity Ring</h4>
					<p>{character.perpetuity ? 'Equipped' : 'Not equipped'}</p>
				</div>

				{#if isOwner}
					<div class="edit-button-container">
						<Button
							variant="primary"
							element={elementName}
							elementStyle={!!elementName}
							onclick={() => (isEditing = true)}
						>
							<Icon name="pencil" size={16} />
							Edit Customizations
						</Button>
					</div>
				{/if}
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
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
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
		padding: 0 spacing.$unit-2x;
	}

	.customization-section {
		h4 {
			font-size: typography.$font-small;
			font-weight: typography.$bold;
			text-transform: uppercase;
			color: var(--text-secondary, colors.$grey-50);
			margin: 0 0 spacing.$unit-half;
			letter-spacing: 0.5px;
		}

		p {
			margin: 0;
			color: var(--text-primary, colors.$grey-10);
		}
	}

	.rings-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		p {
			margin: 0;
		}
	}

	.edit-button-container {
		margin-top: spacing.$unit-2x;
		padding-top: spacing.$unit-2x;
		border-top: 1px solid var(--border-secondary, colors.$grey-80);
	}
</style>
