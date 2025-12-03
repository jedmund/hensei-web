<script lang="ts">
	import type { GridWeapon } from '$lib/types/api/party'
	import type { WeaponKey } from '$lib/api/adapters/entity.adapter'
	import type { Awakening, SimpleAxSkill } from '$lib/types/api/entities'
	import DetailsSection from './details/DetailsSection.svelte'
	import ItemHeader from './details/ItemHeader.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import WeaponKeySelect from './edit/WeaponKeySelect.svelte'
	import AwakeningSelect from './edit/AwakeningSelect.svelte'
	import AxSkillSelect from './edit/AxSkillSelect.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { getElementIcon } from '$lib/utils/images'
	import { seriesHasWeaponKeys, getSeriesSlug } from '$lib/utils/weaponSeries'

	interface Props {
		weapon: GridWeapon
		onSave?: (updates: Partial<GridWeapon>) => void
		onCancel?: () => void
	}

	let { weapon, onSave, onCancel }: Props = $props()

	// Local state for edits
	let element = $state(weapon.element ?? weapon.weapon?.element ?? 0)

	// Weapon key state - initialize from existing weapon keys
	let weaponKey1 = $state<string | undefined>(weapon.weaponKeys?.[0]?.id)
	let weaponKey2 = $state<string | undefined>(weapon.weaponKeys?.[1]?.id)
	let weaponKey3 = $state<string | undefined>(weapon.weaponKeys?.[2]?.id)

	// Awakening state - initialize from existing awakening
	let selectedAwakening = $state<Awakening | undefined>(weapon.awakening?.type)
	let awakeningLevel = $state(weapon.awakening?.level ?? 1)

	// AX skill state - initialize from existing AX skills
	let axSkills = $state<SimpleAxSkill[]>(
		weapon.ax ?? [
			{ modifier: -1, strength: 0 },
			{ modifier: -1, strength: 0 }
		]
	)

	// Weapon data shortcuts
	const weaponData = $derived(weapon.weapon)
	const canChangeElement = $derived(weaponData?.element === 0)
	const series = $derived(weaponData?.series)
	const seriesSlug = $derived(getSeriesSlug(series))
	const transcendenceStep = $derived(weapon.transcendenceStep ?? 0)

	// Weapon key slot configuration by series slug
	// Maps series slug → number of weapon key slots
	const WEAPON_KEY_SLOTS: Record<string, number> = {
		'dark-opus': 2, // Pendulum (slot 0) + Chain/Pendulum (slot 1)
		'ultima': 3, // Gauph Key (slot 0) + Ultima Key (slot 1) + Gate (slot 2)
		'draconic': 2, // Teluma (slot 0) + Teluma (slot 1)
		'draconic-providence': 2, // Same as Draconic
		'superlative': 2, // Teluma (slot 0) + Teluma (slot 1)
		// Add more as needed
	}

	// Check if series has weapon keys using the utility (handles both formats)
	const hasWeaponKeys = $derived(seriesHasWeaponKeys(series))
	const keySlotCount = $derived(seriesSlug ? (WEAPON_KEY_SLOTS[seriesSlug] ?? 2) : 0)

	const hasAxSkills = $derived(weaponData?.ax === true)
	const axType = $derived(weaponData?.axType ?? 1)
	const hasAwakening = $derived((weaponData?.maxAwakeningLevel ?? 0) > 0)
	const availableAwakenings = $derived(weaponData?.awakenings ?? [])

	// Element name for button styling
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

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
		return '—'
	}

	// Build the update payload for the API
	// Uses flat key IDs rather than nested arrays, as expected by the API
	interface WeaponUpdatePayload {
		element?: number
		weaponKey1Id?: string | null
		weaponKey2Id?: string | null
		weaponKey3Id?: string | null
		awakeningId?: string | null
		awakeningLevel?: number
		axModifier1?: number | null
		axStrength1?: number | null
		axModifier2?: number | null
		axStrength2?: number | null
	}

	function handleSave() {
		const updates: WeaponUpdatePayload = {}

		// Element change (only for element-changeable weapons)
		if (canChangeElement && element !== weapon.element) {
			updates.element = element
		}

		// Weapon keys - send individual key IDs
		if (hasWeaponKeys) {
			const originalKey1 = weapon.weaponKeys?.[0]?.id
			const originalKey2 = weapon.weaponKeys?.[1]?.id
			const originalKey3 = weapon.weaponKeys?.[2]?.id

			if (weaponKey1 !== originalKey1) {
				updates.weaponKey1Id = weaponKey1 ?? null
			}
			if (weaponKey2 !== originalKey2) {
				updates.weaponKey2Id = weaponKey2 ?? null
			}
			if (weaponKey3 !== originalKey3) {
				updates.weaponKey3Id = weaponKey3 ?? null
			}
		}

		// Awakening - send awakening ID and level
		if (hasAwakening) {
			const originalAwakeningId = weapon.awakening?.type?.id
			const originalLevel = weapon.awakening?.level ?? 1

			if (selectedAwakening?.id !== originalAwakeningId) {
				updates.awakeningId = selectedAwakening?.id ?? null
			}
			if (awakeningLevel !== originalLevel) {
				updates.awakeningLevel = awakeningLevel
			}
		}

		// AX skills - send modifier/strength pairs
		if (hasAxSkills) {
			const originalAx = weapon.ax ?? [
				{ modifier: -1, strength: 0 },
				{ modifier: -1, strength: 0 }
			]

			const ax1 = axSkills[0]
			const ax2 = axSkills[1]
			const origAx1 = originalAx[0]
			const origAx2 = originalAx[1]

			if (ax1?.modifier !== origAx1?.modifier) {
				updates.axModifier1 = ax1?.modifier ?? null
			}
			if (ax1?.strength !== origAx1?.strength) {
				updates.axStrength1 = ax1?.strength ?? null
			}
			if (ax2?.modifier !== origAx2?.modifier) {
				updates.axModifier2 = ax2?.modifier ?? null
			}
			if (ax2?.strength !== origAx2?.strength) {
				updates.axStrength2 = ax2?.strength ?? null
			}
		}

		// Only call onSave if there are actual updates
		if (Object.keys(updates).length > 0) {
			onSave?.(updates as Partial<GridWeapon>)
		} else {
			// No changes, just close the panel
			onCancel?.()
		}
	}

	function handleCancel() {
		// Reset to original values
		element = weapon.element ?? weapon.weapon?.element ?? 0
		weaponKey1 = weapon.weaponKeys?.[0]?.id
		weaponKey2 = weapon.weaponKeys?.[1]?.id
		weaponKey3 = weapon.weaponKeys?.[2]?.id
		selectedAwakening = weapon.awakening?.type
		awakeningLevel = weapon.awakening?.level ?? 1
		axSkills = weapon.ax ?? [
			{ modifier: -1, strength: 0 },
			{ modifier: -1, strength: 0 }
		]
		onCancel?.()
	}
</script>

<div class="weapon-edit-sidebar">
	<ItemHeader
		type="weapon"
		item={weapon}
		itemData={weaponData}
		gridUncapLevel={weapon.uncapLevel}
		gridTranscendence={weapon.transcendenceStep}
	/>

	<div class="edit-sections">
		{#if canChangeElement}
			<DetailsSection title="Element">
				<div class="element-select">
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

		{#if hasWeaponKeys && seriesSlug}
			<DetailsSection title="Weapon Keys">
				<div class="key-selects">
					{#if keySlotCount >= 1}
						<WeaponKeySelect
							{seriesSlug}
							slot={0}
							bind:value={weaponKey1}
							{transcendenceStep}
						/>
					{/if}
					{#if keySlotCount >= 2}
						<WeaponKeySelect
							{seriesSlug}
							slot={1}
							bind:value={weaponKey2}
							{transcendenceStep}
						/>
					{/if}
					{#if keySlotCount >= 3}
						<WeaponKeySelect
							{seriesSlug}
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
				<div class="ax-skills-wrapper">
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
				<div class="awakening-select-wrapper">
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
		<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
		<Button variant="primary" element={elementName} elementStyle={!!elementName} onclick={handleSave}>
			Save
		</Button>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.weapon-edit-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: spacing.$unit-4x;
	}

	.weapon-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit-half;
		margin-top: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;
		padding-bottom: spacing.$unit-2x;
		border-bottom: 1px solid var(--border-secondary);
	}

	.weapon-name {
		margin: 0;
		font-size: typography.$font-large;
		font-weight: typography.$bold;
		color: var(--text-primary);
		text-align: center;
	}

	.weapon-subtitle {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.edit-sections {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		overflow-y: auto;
	}

	.element-select {
		padding: spacing.$unit;
	}

	.key-selects {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit;
	}

	.awakening-select-wrapper {
		padding: spacing.$unit;
	}

	.ax-skills-wrapper {
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
