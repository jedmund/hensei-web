
<script lang="ts">
	import Checkbox from './Checkbox.svelte'

	interface Option {
		value: number
		label: string
	}

	interface Props {
		/** Array of selected values */
		value?: number[]
		/** Available options */
		options: Option[]
		/** Disable all checkboxes */
		disabled?: boolean
		/** Layout direction */
		direction?: 'row' | 'column'
		/** Element color theme for checked state */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	}

	let {
		value = $bindable([]),
		options,
		disabled = false,
		direction = 'row',
		element
	}: Props = $props()

	function isChecked(optionValue: number): boolean {
		return value.includes(optionValue)
	}

	function handleChange(optionValue: number, checked: boolean) {
		if (checked) {
			value = [...value, optionValue]
		} else {
			value = value.filter((v) => v !== optionValue)
		}
	}
</script>

<div class="checkbox-group {direction}">
	{#each options as option (option.value)}
		<label class="checkbox-option">
			<Checkbox
				checked={isChecked(option.value)}
				onCheckedChange={(checked) => handleChange(option.value, checked)}
				{disabled}
				{element}
				size="small"
			/>
			<span class="option-label">{option.label}</span>
		</label>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	.checkbox-group {
		display: flex;
		gap: $unit;
		flex-wrap: wrap;

		&.column {
			flex-direction: column;
		}

		&.row {
			flex-direction: row;
		}
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		gap: $unit-half;
		cursor: pointer;

		&:hover .option-label {
			color: $grey-30;
		}
	}

	.option-label {
		font-size: $font-small;
		color: var(--text-secondary);
		user-select: none;
		transition: color 0.15s ease;
	}
</style>
