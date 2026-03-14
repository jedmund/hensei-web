
<script lang="ts">
	import MasteryRow from './MasteryRow.svelte'
	import { aetherialMastery, type ItemSkill } from '$lib/data/overMastery'
	import { getElementalizedEarringStat } from '$lib/utils/masteryUtils'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

	interface ExtendedMastery {
		modifier: number
		strength: number
	}

	interface Props {
		/** Current earring value */
		value?: ExtendedMastery
		/** Character's element for filtering/labeling options */
		element?: number
		/** Called when earring changes */
		onChange?: (earring: ExtendedMastery | undefined) => void
	}

	let { value, element, onChange }: Props = $props()

	// Local state
	let modifier = $state(value?.modifier ?? 0)
	let strength = $state(value?.strength ?? 0)

	// Get the ItemSkill data for a modifier, with element substitution
	function getSkillData(mod: number): ItemSkill | undefined {
		if (mod <= 0) return undefined
		return getElementalizedEarringStat(mod, element, 'en')
	}

	// Build modifier options
	const modifierOptions = $derived.by(() => {
		const options: Array<{ value: number; label: string }> = [{ value: 0, label: m.option_none() }]

		for (const skill of aetherialMastery) {
			// Use elementalized name for display
			const elementalizedSkill = getElementalizedEarringStat(skill.id, element, 'en')
			options.push({
				value: skill.id,
				label: localizedName(elementalizedSkill?.name ?? skill.name)
			})
		}

		return options
	})

	// Build strength options based on selected modifier
	const strengthOptions = $derived.by(() => {
		if (modifier <= 0) return []
		const skill = getSkillData(modifier)
		if (!skill) return []

		const options: Array<{ value: number; label: string }> = []
		for (let v = skill.minValue; v <= skill.maxValue; v++) {
			options.push({
				value: v,
				label: `${v}${skill.suffix || ''}`
			})
		}
		return options
	})

	// Emit changes
	function emitChange() {
		if (modifier <= 0) {
			onChange?.(undefined)
		} else {
			onChange?.({ modifier, strength })
		}
	}

	function handleModifierChange(value: number | string | undefined) {
		modifier = typeof value === 'number' ? value : parseInt(String(value), 10) || 0

		// Reset strength to minimum when modifier changes
		if (modifier > 0) {
			const skill = getSkillData(modifier)
			strength = skill?.minValue ?? 0
		} else {
			strength = 0
		}
		emitChange()
	}

	function handleStrengthChange(value: number | string | undefined) {
		strength = typeof value === 'number' ? value : parseInt(String(value), 10) || 0
		emitChange()
	}
</script>

<MasteryRow
	{modifierOptions}
	{strengthOptions}
	{modifier}
	{strength}
	onModifierChange={handleModifierChange}
	onStrengthChange={handleStrengthChange}
	modifierPlaceholder={m.placeholder_select_earring()}
/>
