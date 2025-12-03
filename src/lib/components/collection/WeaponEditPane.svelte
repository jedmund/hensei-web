<script lang="ts">
	/**
	 * WeaponEditPane - Edit component for collection weapons
	 *
	 * Provides edit controls for weapon customization:
	 * - Uncap level (editable UncapIndicator)
	 * - Transcendence step
	 * - Element (for element-changeable weapons)
	 * - Weapon keys (for Opus, Ultima, Draconic, Astral, Superlative)
	 * - AX skills (for weapons with AX support)
	 * - Awakening (for weapons with awakening support)
	 */
	import type { Weapon, Awakening, SimpleAxSkill } from '$lib/types/api/entities'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import WeaponKeySelect from '$lib/components/sidebar/edit/WeaponKeySelect.svelte'
	import AwakeningSelect from '$lib/components/sidebar/edit/AwakeningSelect.svelte'
	import AxSkillSelect from '$lib/components/sidebar/edit/AxSkillSelect.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getElementIcon } from '$lib/utils/images'

	export interface WeaponEditValues {
		uncapLevel: number
		transcendenceStep: number
		element?: number
		weaponKey1Id?: string
		weaponKey2Id?: string
		weaponKey3Id?: string
		awakening?: {
			type?: Awakening
			level: number
		} | null
		axSkills: SimpleAxSkill[]
	}

	export interface WeaponEditUpdates {
		uncapLevel?: number
		transcendenceStep?: number
		element?: number
		weaponKey1Id?: string
		weaponKey2Id?: string
		weaponKey3Id?: string
		weaponKey4Id?: string
		awakening?: {
			id: string
			level: number
		} | null
		axModifier1?: number
		axStrength1?: number
		axModifier2?: number
		axStrength2?: number
	}

	interface Props {
		/** The base weapon data */
		weaponData: Weapon | undefined
		/** Current values for all edit fields */
		currentValues: WeaponEditValues
		/** Callback when save is clicked */
		onSave?: (updates: WeaponEditUpdates) => void
		/** Callback when cancel is clicked */
		onCancel?: () => void
		/** Whether save is in progress */
		saving?: boolean
	}

	let { weaponData, currentValues, onSave, onCancel, saving = false }: Props = $props()

	// Internal state
	let uncapLevel = $state(currentValues.uncapLevel)
	let transcendenceStep = $state(currentValues.transcendenceStep)
	let element = $state(currentValues.element ?? weaponData?.element ?? 0)
	let weaponKey1 = $state<string | undefined>(currentValues.weaponKey1Id)
	let weaponKey2 = $state<string | undefined>(currentValues.weaponKey2Id)
	let weaponKey3 = $state<string | undefined>(currentValues.weaponKey3Id)
	let selectedAwakening = $state<Awakening | undefined>(currentValues.awakening?.type)
	let awakeningLevel = $state(currentValues.awakening?.level ?? 1)
	let axSkills = $state<SimpleAxSkill[]>(
		currentValues.axSkills.length > 0
			? currentValues.axSkills
			: [
					{ modifier: -1, strength: 0 },
					{ modifier: -1, strength: 0 }
				]
	)

	// Re-initialize when currentValues changes
	$effect(() => {
		uncapLevel = currentValues.uncapLevel
		transcendenceStep = currentValues.transcendenceStep
		element = currentValues.element ?? weaponData?.element ?? 0
		weaponKey1 = currentValues.weaponKey1Id
		weaponKey2 = currentValues.weaponKey2Id
		weaponKey3 = currentValues.weaponKey3Id
		selectedAwakening = currentValues.awakening?.type
		awakeningLevel = currentValues.awakening?.level ?? 1
		axSkills =
			currentValues.axSkills.length > 0
				? currentValues.axSkills
				: [
						{ modifier: -1, strength: 0 },
						{ modifier: -1, strength: 0 }
					]
	})

	// Derived conditions
	const canChangeElement = $derived(weaponData?.element === 0)
	const series = $derived(weaponData?.series ?? 0)

	// Weapon key config keyed by WEAPON series
	const WEAPON_KEY_SERIES: Record<number, { name: string; slots: number; keySeries: number }> = {
		2: { name: 'Dark Opus', slots: 2, keySeries: 3 },
		3: { name: 'Ultima', slots: 3, keySeries: 13 },
		17: { name: 'Draconic', slots: 2, keySeries: 27 },
		22: { name: 'Astral', slots: 1, keySeries: 19 },
		34: { name: 'Superlative', slots: 2, keySeries: 40 }
	}

	const weaponKeyConfig = $derived(WEAPON_KEY_SERIES[series])
	const hasWeaponKeys = $derived(!!weaponKeyConfig)
	const keySlotCount = $derived(weaponKeyConfig?.slots ?? 0)
	const keySeries = $derived(weaponKeyConfig?.keySeries ?? 0)

	const hasAxSkills = $derived(weaponData?.ax === true)
	const axType = $derived(weaponData?.axType ?? 1)
	const hasAwakening = $derived((weaponData?.maxAwakeningLevel ?? 0) > 0)
	const availableAwakenings = $derived(weaponData?.awakenings ?? [])

	// Element name for theming
	const ELEMENT_MAP: Record<number, 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const weaponElement = $derived(element || weaponData?.element)
	const elementName = $derived(weaponElement ? ELEMENT_MAP[weaponElement] : undefined)

	// Element options
	const elementOptions = [
		{ value: 1, label: 'Wind', image: getElementIcon(1) },
		{ value: 2, label: 'Fire', image: getElementIcon(2) },
		{ value: 3, label: 'Water', image: getElementIcon(3) },
		{ value: 4, label: 'Earth', image: getElementIcon(4) },
		{ value: 5, label: 'Dark', image: getElementIcon(5) },
		{ value: 6, label: 'Light', image: getElementIcon(6) }
	]

	// Awakening slug to UUID map
	const AWAKENING_MAP: Record<string, string> = {
		'weapon-balanced': 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		'weapon-atk': 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
		'weapon-def': 'c3d4e5f6-a7b8-9012-cdef-123456789012',
		'weapon-multi': 'd4e5f6a7-b8c9-0123-def0-234567890123'
	}

	function handleUncapUpdate(newLevel: number) {
		uncapLevel = newLevel
	}

	function handleTranscendenceUpdate(newStage: number) {
		transcendenceStep = newStage
	}

	function handleSave() {
		const updates: WeaponEditUpdates = {
			uncapLevel,
			transcendenceStep
		}

		// Element for element-changeable weapons
		if (canChangeElement) {
			updates.element = element
		}

		// Weapon keys
		if (hasWeaponKeys) {
			if (weaponKey1) updates.weaponKey1Id = weaponKey1
			if (weaponKey2) updates.weaponKey2Id = weaponKey2
			if (weaponKey3) updates.weaponKey3Id = weaponKey3
		}

		// Awakening
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

		// AX Skills
		if (hasAxSkills && axSkills.length >= 2) {
			if (axSkills[0] && axSkills[0].modifier >= 0) {
				updates.axModifier1 = axSkills[0].modifier
				updates.axStrength1 = axSkills[0].strength
			}
			if (axSkills[1] && axSkills[1].modifier >= 0) {
				updates.axModifier2 = axSkills[1].modifier
				updates.axStrength2 = axSkills[1].strength
			}
		}

		onSave?.(updates)
	}

	function handleCancel() {
		// Reset to original values
		uncapLevel = currentValues.uncapLevel
		transcendenceStep = currentValues.transcendenceStep
		element = currentValues.element ?? weaponData?.element ?? 0
		weaponKey1 = currentValues.weaponKey1Id
		weaponKey2 = currentValues.weaponKey2Id
		weaponKey3 = currentValues.weaponKey3Id
		selectedAwakening = currentValues.awakening?.type
		awakeningLevel = currentValues.awakening?.level ?? 1
		axSkills =
			currentValues.axSkills.length > 0
				? currentValues.axSkills
				: [
						{ modifier: -1, strength: 0 },
						{ modifier: -1, strength: 0 }
					]
		onCancel?.()
	}
</script>

<div class="weapon-edit-pane">
	<div class="edit-sections">
		<DetailsSection title="Uncap Level">
			<div class="section-content uncap-section">
				<UncapIndicator
					type="weapon"
					{uncapLevel}
					transcendenceStage={transcendenceStep}
					flb={weaponData?.uncap?.flb}
					ulb={weaponData?.uncap?.ulb}
					transcendence={weaponData?.uncap?.transcendence}
					editable={true}
					updateUncap={handleUncapUpdate}
					updateTranscendence={handleTranscendenceUpdate}
				/>
			</div>
		</DetailsSection>

		{#if canChangeElement}
			<DetailsSection title="Element">
				<div class="section-content">
					<Select
						options={elementOptions}
						bind:value={element}
						placeholder="Select element"
						size="medium"
						fullWidth
						contained
					/>
				</div>
			</DetailsSection>
		{/if}

		{#if hasWeaponKeys}
			<DetailsSection title="Weapon Keys">
				<div class="section-content key-selects">
					{#if keySlotCount >= 1}
						<WeaponKeySelect
							series={keySeries}
							slot={0}
							bind:value={weaponKey1}
							{transcendenceStep}
						/>
					{/if}
					{#if keySlotCount >= 2}
						<WeaponKeySelect
							series={keySeries}
							slot={1}
							bind:value={weaponKey2}
							{transcendenceStep}
						/>
					{/if}
					{#if keySlotCount >= 3}
						<WeaponKeySelect
							series={keySeries}
							slot={2}
							bind:value={weaponKey3}
							{transcendenceStep}
						/>
					{/if}
				</div>
			</DetailsSection>
		{/if}

		{#if hasAxSkills}
			<DetailsSection title="AX Skills">
				<div class="section-content">
					<AxSkillSelect
						{axType}
						currentSkills={axSkills}
						onChange={(skills) => {
							axSkills = skills
						}}
					/>
				</div>
			</DetailsSection>
		{/if}

		{#if hasAwakening && availableAwakenings.length > 0}
			<DetailsSection title="Awakening">
				<div class="section-content">
					<AwakeningSelect
						awakenings={availableAwakenings}
						value={selectedAwakening}
						level={awakeningLevel}
						maxLevel={weaponData?.maxAwakeningLevel ?? 9}
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

	.weapon-edit-pane {
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

	.key-selects {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
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
