<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import type { Awakening } from '$lib/types/api/entities'
	import DetailsSection from './details/DetailsSection.svelte'
	import ItemHeader from './details/ItemHeader.svelte'
	import AwakeningSelect from './edit/AwakeningSelect.svelte'
	import RingsSelect from './edit/RingsSelect.svelte'
	import EarringSelect from './edit/EarringSelect.svelte'
	import PerpetuityToggle from './edit/PerpetuityToggle.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	interface ExtendedMastery {
		modifier: number
		strength: number
	}

	interface Props {
		character: GridCharacter
		onSave?: (updates: Partial<GridCharacter>) => void
		onCancel?: () => void
	}

	let { character, onSave, onCancel }: Props = $props()

	// Character data shortcut
	const characterData = $derived(character.character)
	const characterElement = $derived(characterData?.element)

	// Awakening state - initialize from existing awakening
	let selectedAwakening = $state<Awakening | undefined>(character.awakening?.type)
	let awakeningLevel = $state(character.awakening?.level ?? 1)

	// Rings state - initialize from existing overMastery
	let rings = $state<ExtendedMastery[]>(
		character.overMastery ?? [
			{ modifier: 1, strength: 0 },
			{ modifier: 2, strength: 0 },
			{ modifier: 0, strength: 0 },
			{ modifier: 0, strength: 0 }
		]
	)

	// Earring state - initialize from existing aetherialMastery
	let earring = $state<ExtendedMastery | undefined>(character.aetherialMastery)

	// Perpetuity state - initialize from existing value
	let perpetuity = $state(character.perpetuity ?? false)

	// Derived conditions for what can be edited
	// Characters always have maxAwakeningLevel of 10 (not returned by API, but hardcoded)
	const maxAwakeningLevel = 10
	const hasAwakening = $derived((characterData?.awakenings?.length ?? 0) > 0)
	const availableAwakenings = $derived(characterData?.awakenings ?? [])

	// Perpetuity is only available for non-MC characters (position > 0)
	const canHavePerpetuity = $derived(character.position > 0)

	// Awakening slug to UUID map (awakenings come from API with id: null, only slugs)
	const AWAKENING_MAP: Record<string, string> = {
		'character-balanced': 'b1847c82-ece0-4d7a-8af1-c7868d90f34a',
		'character-atk': '6e233877-8cda-4c8f-a091-3db6f68749e2',
		'character-def': 'c95441de-f949-4a62-b02b-101aa2e0a638',
		'character-multi': 'e36b0573-79c3-4dd2-9524-c95def4bbb1a'
	}

	// Element name for the sidebar theming
	const ELEMENT_MAP: Record<number, 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementName = $derived(characterElement ? ELEMENT_MAP[characterElement] : undefined)

	function handleSave() {
		// Build API-formatted updates (field names match Rails API expectations)
		const updates: Record<string, unknown> = {}

		// Collect awakening updates - convert slug to UUID using AWAKENING_MAP
		// The awakenings list from API has id: null, only slugs are populated
		if (hasAwakening) {
			if (selectedAwakening && selectedAwakening.slug) {
				const awakeningId = AWAKENING_MAP[selectedAwakening.slug]
				if (awakeningId) {
					updates.awakening = {
						id: awakeningId,
						level: awakeningLevel
					}
				} else {
					console.warn(`Unknown awakening slug: ${selectedAwakening.slug}`)
				}
			} else {
				updates.awakening = null
			}
		}

		// Collect rings updates - API expects 'rings' not 'overMastery'
		updates.rings = rings

		// Collect earring updates - API expects 'earring' not 'aetherialMastery'
		if (earring) {
			updates.earring = earring
		}

		// Collect perpetuity updates
		if (canHavePerpetuity) {
			updates.perpetuity = perpetuity
		}

		onSave?.(updates as Partial<GridCharacter>)
	}

	function handleCancel() {
		// Reset to original values
		selectedAwakening = character.awakening?.type
		awakeningLevel = character.awakening?.level ?? 1
		rings = character.overMastery ?? [
			{ modifier: 1, strength: 0 },
			{ modifier: 2, strength: 0 },
			{ modifier: 0, strength: 0 },
			{ modifier: 0, strength: 0 }
		]
		earring = character.aetherialMastery
		perpetuity = character.perpetuity ?? false
		onCancel?.()
	}
</script>

<div class="character-edit-sidebar">
	<ItemHeader
		type="character"
		item={character}
		itemData={characterData}
		gridUncapLevel={character.uncapLevel}
		gridTranscendence={character.transcendenceStep}
	/>

	<div class="edit-sections">
		{#if hasAwakening && availableAwakenings.length > 0}
			<DetailsSection title="Awakening">
				<div class="section-content">
					<AwakeningSelect
						awakenings={availableAwakenings}
						value={selectedAwakening}
						level={awakeningLevel}
						maxLevel={maxAwakeningLevel}
						onAwakeningChange={(awakening) => {
							selectedAwakening = awakening
						}}
						onLevelChange={(level) => {
							awakeningLevel = level
						}}
					/>
				</div>
			</DetailsSection>
		{/if}

		<DetailsSection title="Over Mastery Rings">
			<div class="section-content">
				<RingsSelect
					{rings}
					onChange={(newRings) => {
						rings = newRings
					}}
				/>
			</div>
		</DetailsSection>

		<DetailsSection title="Aetherial Mastery">
			<div class="section-content">
				<EarringSelect
					value={earring}
					element={characterElement}
					onChange={(newEarring) => {
						earring = newEarring
					}}
				/>
			</div>
		</DetailsSection>

		{#if canHavePerpetuity}
			<DetailsSection title="Perpetuity">
				<div class="section-content">
					<PerpetuityToggle
						value={perpetuity}
						element={elementName}
						onChange={(value) => {
							perpetuity = value
						}}
					/>
				</div>
			</DetailsSection>
		{/if}
	</div>

	<div class="edit-footer">
		<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
		<Button variant="primary" element={elementName} elementStyle={!!elementName} onclick={handleSave}>
			Save
		</Button>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.character-edit-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: spacing.$unit-4x;
	}

	.edit-sections {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		overflow-y: auto;
	}

	.section-content {
		padding: spacing.$unit;
	}

	.edit-footer {
		display: flex;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
		border-top: 1px solid var(--border-secondary);
		flex-shrink: 0;

		:global(button) {
			flex: 1;
		}
	}
</style>
