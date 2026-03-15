
<script lang="ts">
	import MasteryRow from './MasteryRow.svelte'
	import { overMastery, type ItemSkill } from '$lib/data/overMastery'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

	interface ExtendedMastery {
		modifier: number
		strength: number
	}

	interface Props {
		/** Current 4 rings array */
		rings: ExtendedMastery[]
		/** Called when rings change */
		onChange?: (rings: ExtendedMastery[]) => void
	}

	let { rings = [], onChange }: Props = $props()

	// Local state derived from props — overrides are temporary until rings prop changes
	let ring0Strength = $derived(rings[0]?.strength ?? 0)
	let ring1Strength = $derived(rings[1]?.strength ?? 0)
	let ring2Modifier = $derived(rings[2]?.modifier ?? 0)
	let ring2Strength = $derived(rings[2]?.strength ?? 0)
	let ring3Modifier = $derived(rings[3]?.modifier ?? 0)
	let ring3Strength = $derived(rings[3]?.strength ?? 0)

	// Ring 0 and 1 have fixed modifiers (ATK=1, HP=2)
	const ATK_MODIFIER = 1
	const HP_MODIFIER = 2

	// Get the ItemSkill data for a modifier
	function getSkillData(modifier: number): ItemSkill | undefined {
		if (modifier <= 0) return undefined
		if (modifier <= 2) return overMastery.a.find((s) => s.id === modifier)
		if (modifier <= 9) return overMastery.b.find((s) => s.id === modifier)
		return overMastery.c.find((s) => s.id === modifier)
	}

	// Build strength options from skill data
	function buildStrengthOptions(
		skill: ItemSkill | undefined
	): Array<{ value: number; label: string }> {
		if (!skill?.values) return []
		return skill.values.map((v) => ({
			value: v,
			label: `${v}${skill.suffix || ''}`
		}))
	}

	// Build options for secondary/tertiary modifiers (rings 3&4)
	function buildModifierOptions(): Array<{ value: number; label: string }> {
		const options: Array<{ value: number; label: string }> = [{ value: 0, label: m.option_none() }]

		// Add secondary options (3-9)
		for (const skill of overMastery.b) {
			options.push({
				value: skill.id,
				label: localizedName(skill.name)
			})
		}

		// Add tertiary options (10-15)
		for (const skill of overMastery.c) {
			options.push({
				value: skill.id,
				label: localizedName(skill.name)
			})
		}

		return options
	}

	// Get strength options for a given modifier
	function getStrengthOptionsForModifier(
		modifier: number
	): Array<{ value: number; label: string }> {
		if (modifier <= 0) return []
		const skill = getSkillData(modifier)
		if (!skill) return []

		if (skill.values) {
			return skill.values.map((v) => ({
				value: v,
				label: `${v}${skill.suffix || ''}`
			}))
		}

		// Fallback to range
		const options: Array<{ value: number; label: string }> = []
		for (let v = skill.minValue; v <= skill.maxValue; v++) {
			options.push({
				value: v,
				label: `${v}${skill.suffix || ''}`
			})
		}
		return options
	}

	// Primary ring data
	const atkSkill = $derived(getSkillData(ATK_MODIFIER))
	const hpSkill = $derived(getSkillData(HP_MODIFIER))

	// Fixed modifier options for ATK and HP (single option, disabled)
	const atkModifierOptions = $derived([{ value: ATK_MODIFIER, label: atkSkill ? localizedName(atkSkill.name) : 'ATK' }])
	const hpModifierOptions = $derived([{ value: HP_MODIFIER, label: hpSkill ? localizedName(hpSkill.name) : 'HP' }])

	// Strength options
	const atkStrengthOptions = $derived(buildStrengthOptions(atkSkill))
	const hpStrengthOptions = $derived(buildStrengthOptions(hpSkill))

	// Secondary ring options
	const modifierOptions = $derived(buildModifierOptions())
	const ring2StrengthOptions = $derived(getStrengthOptionsForModifier(ring2Modifier))
	const ring3StrengthOptions = $derived(getStrengthOptionsForModifier(ring3Modifier))

	// Ring 4 is only shown if Ring 3 has a modifier
	const ring3Enabled = $derived(ring2Modifier > 0)

	// Build the rings array and emit changes
	function emitChange() {
		const newRings: ExtendedMastery[] = [
			{ modifier: ATK_MODIFIER, strength: ring0Strength },
			{ modifier: HP_MODIFIER, strength: ring1Strength },
			{ modifier: ring2Modifier, strength: ring2Strength },
			{ modifier: ring3Modifier, strength: ring3Strength }
		]
		onChange?.(newRings)
	}

	// Sync ring 0 (ATK) and ring 1 (HP) - when one changes, update both to same index
	function syncPrimaryRings(changedRing: 0 | 1, newStrength: number) {
		const atkValues = atkSkill?.values ?? []
		const hpValues = hpSkill?.values ?? []

		// Find the index of the new value in the appropriate array
		const selectedIndex =
			changedRing === 0 ? atkValues.indexOf(newStrength) : hpValues.indexOf(newStrength)

		if (selectedIndex === -1) return

		// Update both rings to the corresponding index values
		ring0Strength = atkValues[selectedIndex] ?? 0
		ring1Strength = hpValues[selectedIndex] ?? 0
		emitChange()
	}

	// Handlers
	function handleRing0StrengthChange(value: number | string | undefined) {
		const newStrength = typeof value === 'number' ? value : parseInt(String(value), 10) || 0
		syncPrimaryRings(0, newStrength)
	}

	function handleRing1StrengthChange(value: number | string | undefined) {
		const newStrength = typeof value === 'number' ? value : parseInt(String(value), 10) || 0
		syncPrimaryRings(1, newStrength)
	}

	function handleRing2ModifierChange(value: number | string | undefined) {
		ring2Modifier = typeof value === 'number' ? value : parseInt(String(value), 10) || 0
		// Reset strength when modifier changes
		const options = getStrengthOptionsForModifier(ring2Modifier)
		ring2Strength = options[0]?.value ?? 0
		// Also reset ring 3 if ring 2 is cleared
		if (ring2Modifier <= 0) {
			ring3Modifier = 0
			ring3Strength = 0
		}
		emitChange()
	}

	function handleRing2StrengthChange(value: number | string | undefined) {
		ring2Strength = typeof value === 'number' ? value : parseInt(String(value), 10) || 0
		emitChange()
	}

	function handleRing3ModifierChange(value: number | string | undefined) {
		ring3Modifier = typeof value === 'number' ? value : parseInt(String(value), 10) || 0
		// Reset strength when modifier changes
		const options = getStrengthOptionsForModifier(ring3Modifier)
		ring3Strength = options[0]?.value ?? 0
		emitChange()
	}

	function handleRing3StrengthChange(value: number | string | undefined) {
		ring3Strength = typeof value === 'number' ? value : parseInt(String(value), 10) || 0
		emitChange()
	}
</script>

<div class="rings-select">
	<!-- Ring 1: ATK (fixed modifier) -->
	<MasteryRow
		modifierOptions={atkModifierOptions}
		strengthOptions={atkStrengthOptions}
		modifier={ATK_MODIFIER}
		strength={ring0Strength}
		modifierDisabled
		onStrengthChange={handleRing0StrengthChange}
	/>

	<!-- Ring 2: HP (fixed modifier) -->
	<MasteryRow
		modifierOptions={hpModifierOptions}
		strengthOptions={hpStrengthOptions}
		modifier={HP_MODIFIER}
		strength={ring1Strength}
		modifierDisabled
		onStrengthChange={handleRing1StrengthChange}
	/>

	<!-- Ring 3: Optional -->
	<MasteryRow
		{modifierOptions}
		strengthOptions={ring2StrengthOptions}
		modifier={ring2Modifier}
		strength={ring2Strength}
		onModifierChange={handleRing2ModifierChange}
		onStrengthChange={handleRing2StrengthChange}
	/>

	<!-- Ring 4: Optional (only if Ring 3 is set) -->
	{#if ring3Enabled}
		<MasteryRow
			{modifierOptions}
			strengthOptions={ring3StrengthOptions}
			modifier={ring3Modifier}
			strength={ring3Strength}
			onModifierChange={handleRing3ModifierChange}
			onStrengthChange={handleRing3StrengthChange}
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.rings-select {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}
</style>
