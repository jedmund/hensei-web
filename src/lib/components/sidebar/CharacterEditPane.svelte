<script lang="ts">
	/**
	 * CharacterEditPane - Unified character edit component
	 *
	 * This component provides all edit controls for character customization:
	 * - Awakening selection and level
	 * - Over Mastery rings (4 slots)
	 * - Aetherial Mastery (earring)
	 * - Perpetuity ring toggle
	 *
	 * Used by both:
	 * - Party grid character editing (EditCharacterSidebar)
	 * - Collection character editing (CollectionCharacterPane)
	 *
	 * The caller is responsible for handling the save action with their specific mutation.
	 */
	import type { Character, Awakening } from '$lib/types/api/entities'
	import type { ExtendedMastery } from '$lib/types/api/collection'
	import DetailsSection from './details/DetailsSection.svelte'
	import AwakeningSelect from './edit/AwakeningSelect.svelte'
	import RingsSelect from './edit/RingsSelect.svelte'
	import EarringSelect from './edit/EarringSelect.svelte'
	import PerpetuityToggle from './edit/PerpetuityToggle.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	export interface CharacterEditValues {
		awakening?: {
			type?: Awakening
			level: number
		} | null
		rings: ExtendedMastery[]
		earring?: ExtendedMastery | null
		perpetuity: boolean
	}

	export interface CharacterEditUpdates {
		awakening?: {
			id: string
			level: number
		} | null
		rings: ExtendedMastery[]
		earring?: ExtendedMastery | null
		perpetuity?: boolean
	}

	interface Props {
		/** The base character data (for awakenings list, element, etc.) */
		characterData: Character | undefined
		/** Current values for all edit fields */
		currentValues: CharacterEditValues
		/** Whether to show the perpetuity toggle (false for MC/position 0) */
		showPerpetuity?: boolean
		/** Callback when save is clicked, receives API-formatted updates */
		onSave?: (updates: CharacterEditUpdates) => void
		/** Callback when cancel is clicked */
		onCancel?: () => void
		/** Whether save is in progress (disables buttons) */
		saving?: boolean
	}

	let {
		characterData,
		currentValues,
		showPerpetuity = true,
		onSave,
		onCancel,
		saving = false
	}: Props = $props()

	// Internal state - initialized from currentValues
	let selectedAwakening = $state<Awakening | undefined>(currentValues.awakening?.type)
	let awakeningLevel = $state(currentValues.awakening?.level ?? 1)
	let rings = $state<ExtendedMastery[]>(
		currentValues.rings.length > 0
			? currentValues.rings
			: [
					{ modifier: 1, strength: 0 },
					{ modifier: 2, strength: 0 },
					{ modifier: 0, strength: 0 },
					{ modifier: 0, strength: 0 }
				]
	)
	let earring = $state<ExtendedMastery | undefined>(currentValues.earring ?? undefined)
	let perpetuity = $state(currentValues.perpetuity)

	// Re-initialize when currentValues changes (e.g., switching between characters)
	$effect(() => {
		selectedAwakening = currentValues.awakening?.type
		awakeningLevel = currentValues.awakening?.level ?? 1
		rings =
			currentValues.rings.length > 0
				? currentValues.rings
				: [
						{ modifier: 1, strength: 0 },
						{ modifier: 2, strength: 0 },
						{ modifier: 0, strength: 0 },
						{ modifier: 0, strength: 0 }
					]
		earring = currentValues.earring ?? undefined
		perpetuity = currentValues.perpetuity
	})

	// Derived conditions
	const characterElement = $derived(characterData?.element)
	const hasAwakening = $derived((characterData?.awakenings?.length ?? 0) > 0)
	const availableAwakenings = $derived(characterData?.awakenings ?? [])
	const maxAwakeningLevel = 10

	// Element name for theming
	const ELEMENT_MAP: Record<number, 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementName = $derived(characterElement ? ELEMENT_MAP[characterElement] : undefined)

	// Awakening slug to UUID map (awakenings from API have id: null, only slugs)
	const AWAKENING_MAP: Record<string, string> = {
		'character-balanced': 'b1847c82-ece0-4d7a-8af1-c7868d90f34a',
		'character-atk': '6e233877-8cda-4c8f-a091-3db6f68749e2',
		'character-def': 'c95441de-f949-4a62-b02b-101aa2e0a638',
		'character-multi': 'e36b0573-79c3-4dd2-9524-c95def4bbb1a'
	}

	function handleSave() {
		const updates: CharacterEditUpdates = {
			rings,
			perpetuity: showPerpetuity ? perpetuity : undefined
		}

		// Format awakening for API
		if (hasAwakening) {
			if (selectedAwakening?.slug) {
				const awakeningId = AWAKENING_MAP[selectedAwakening.slug]
				if (awakeningId) {
					updates.awakening = {
						id: awakeningId,
						level: awakeningLevel
					}
				}
			} else {
				updates.awakening = null
			}
		}

		// Format earring for API
		if (earring) {
			updates.earring = earring
		}

		onSave?.(updates)
	}

	function handleCancel() {
		// Reset to original values
		selectedAwakening = currentValues.awakening?.type
		awakeningLevel = currentValues.awakening?.level ?? 1
		rings =
			currentValues.rings.length > 0
				? currentValues.rings
				: [
						{ modifier: 1, strength: 0 },
						{ modifier: 2, strength: 0 },
						{ modifier: 0, strength: 0 },
						{ modifier: 0, strength: 0 }
					]
		earring = currentValues.earring ?? undefined
		perpetuity = currentValues.perpetuity
		onCancel?.()
	}
</script>

<div class="character-edit-pane">
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

		{#if showPerpetuity}
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
		<Button variant="secondary" onclick={handleCancel} disabled={saving}>Cancel</Button>
		<Button
			variant="primary"
			element={elementName}
			elementStyle={!!elementName}
			onclick={handleSave}
			disabled={saving}
		>
			{saving ? 'Saving...' : 'Save'}
		</Button>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.character-edit-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: spacing.$unit-2x;
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
