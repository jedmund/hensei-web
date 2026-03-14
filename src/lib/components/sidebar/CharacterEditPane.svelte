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
	import * as m from '$lib/paraglide/messages'
	import type { Character, Awakening } from '$lib/types/api/entities'
	import type { ExtendedMastery } from '$lib/types/api/collection'
	import DetailsSection from './details/DetailsSection.svelte'
	import AwakeningSelect from './edit/AwakeningSelect.svelte'
	import RingsSelect from './edit/RingsSelect.svelte'
	import EarringSelect from './edit/EarringSelect.svelte'
	import PerpetuityToggle from './edit/PerpetuityToggle.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	export interface CharacterEditValues {
		uncapLevel: number
		transcendenceStep: number
		awakening?: {
			type?: Awakening
			level: number
		} | null
		rings: ExtendedMastery[]
		earring?: ExtendedMastery | null
		perpetuity: boolean
	}

	export interface CharacterEditUpdates {
		uncapLevel?: number
		transcendenceStep?: number
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
	}

	let {
		characterData,
		currentValues,
		showPerpetuity = true,
		onSave
	}: Props = $props()

	// Internal state - initialized from currentValues
	let uncapLevel = $state(currentValues.uncapLevel)
	let transcendenceStep = $state(currentValues.transcendenceStep)
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
		uncapLevel = currentValues.uncapLevel
		transcendenceStep = currentValues.transcendenceStep
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

	// Handlers for UncapIndicator
	function handleUncapUpdate(newLevel: number) {
		uncapLevel = newLevel
	}

	function handleTranscendenceUpdate(newStage: number) {
		transcendenceStep = newStage
	}

	// Export save function so parent can call it from header button
	export function save() {
		const updates: CharacterEditUpdates = {
			uncapLevel,
			transcendenceStep,
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
</script>

<div class="character-edit-pane">
	<div class="edit-sections">
		<DetailsSection title={m.section_uncap_level()}>
			<div class="section-content uncap-section">
				<UncapIndicator
					type="character"
					{uncapLevel}
					transcendenceStage={transcendenceStep}
					special={characterData?.special}
					flb={characterData?.uncap?.flb}
					ulb={characterData?.uncap?.ulb}
					transcendence={characterData?.uncap?.transcendence}
					editable={true}
					updateUncap={handleUncapUpdate}
					updateTranscendence={handleTranscendenceUpdate}
				/>
			</div>
		</DetailsSection>

		{#if hasAwakening && availableAwakenings.length > 0}
			<DetailsSection title={m.details_awakening()}>
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

		<DetailsSection title={m.details_over_mastery()}>
			<div class="section-content">
				<RingsSelect
					{rings}
					onChange={(newRings) => {
						rings = newRings
					}}
				/>
			</div>
		</DetailsSection>

		<DetailsSection title={m.details_aetherial_mastery()}>
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
			<DetailsSection title={m.details_perpetuity_ring()}>
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
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.character-edit-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
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
</style>
