
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import { getBasePath } from '$lib/utils/images'

	interface Props {
		/** Whether perpetuity is enabled */
		value: boolean
		/** Called when value changes */
		onChange?: (value: boolean) => void
		/** Element for theming */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	let { value = false, onChange, element }: Props = $props()

	let localValue = $state(value)

	const perpetuityImageUrl = `${getBasePath()}/perpetuity.png`

	function handleChange(checked: boolean) {
		localValue = checked
		onChange?.(checked)
	}
</script>

<div class="perpetuity-toggle">
	<label class="toggle-row">
		<Checkbox
			checked={localValue}
			onCheckedChange={handleChange}
			contained
			{element}
		/>
		<div class="toggle-content">
			<img
				src={perpetuityImageUrl}
				alt="Perpetuity Ring"
				class="perpetuity-icon"
			/>
			<span class="toggle-label">{m.label_perpetuity_ring()}</span>
		</div>
	</label>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.perpetuity-toggle {
		display: flex;
		flex-direction: column;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		cursor: pointer;
	}

	.toggle-content {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.perpetuity-icon {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.toggle-label {
		font-size: typography.$font-regular;
		color: var(--text-primary);
	}
</style>
