<svelte:options runes={true} />

<script lang="ts">
	import Select from '$lib/components/ui/Select.svelte'

	interface Props {
		/** Options for the modifier/type select */
		modifierOptions: Array<{ value: number | string; label: string; image?: string }>
		/** Options for the strength/value select */
		strengthOptions: Array<{ value: number | string; label: string }>
		/** Current modifier value */
		modifier: number | string
		/** Current strength value */
		strength: number | string
		/** Whether the modifier select is disabled (for fixed modifiers like ATK/HP) */
		modifierDisabled?: boolean
		/** Called when modifier changes */
		onModifierChange?: (value: number | string | undefined) => void
		/** Called when strength changes */
		onStrengthChange?: (value: number | string | undefined) => void
		/** Placeholder for modifier select */
		modifierPlaceholder?: string
		/** Placeholder for strength select */
		strengthPlaceholder?: string
	}

	let {
		modifierOptions,
		strengthOptions,
		modifier,
		strength,
		modifierDisabled = false,
		onModifierChange,
		onStrengthChange,
		modifierPlaceholder = 'Select',
		strengthPlaceholder = 'Value'
	}: Props = $props()

	// Show strength select only if there are options and modifier is set
	const showStrength = $derived(strengthOptions.length > 0 && modifier !== 0 && modifier !== '')
</script>

<div class="mastery-row">
	<div class="modifier-select">
		<Select
			options={modifierOptions}
			value={modifier}
			onValueChange={onModifierChange}
			placeholder={modifierPlaceholder}
			size="medium"
			fullWidth
			contained
			disabled={modifierDisabled}
		/>
	</div>
	{#if showStrength}
		<div class="strength-select">
			<Select
				options={strengthOptions}
				value={strength}
				onValueChange={onStrengthChange}
				placeholder={strengthPlaceholder}
				size="medium"
				fullWidth
				contained
			/>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.mastery-row {
		display: flex;
		gap: spacing.$unit;
	}

	.modifier-select {
		flex: 1;
		min-width: 0;
	}

	.strength-select {
		width: 110px;
		flex-shrink: 0;
	}
</style>
