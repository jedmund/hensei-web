<script lang="ts">
	import { TimeField, Label } from 'bits-ui'
	import { Time } from '@internationalized/date'

	interface Props {
		value?: string | null
		disabled?: boolean
		readonly?: boolean
		contained?: boolean
		locale?: string
		label?: string
	}

	let {
		value = $bindable(),
		disabled = false,
		readonly = false,
		contained = false,
		locale = 'en',
		label
	}: Props = $props()

	// Convert "HH:MM" string to Time object
	function stringToTime(str: string | null | undefined): Time | undefined {
		if (!str) return undefined
		try {
			const [hours, minutes] = str.split(':').map(Number)
			if (isNaN(hours!) || isNaN(minutes!)) return undefined
			return new Time(hours!, minutes!)
		} catch {
			return undefined
		}
	}

	// Convert Time object to "HH:MM" string
	function timeToString(t: Time | undefined): string | null {
		if (!t) return null
		const h = String(t.hour).padStart(2, '0')
		const m = String(t.minute).padStart(2, '0')
		return `${h}:${m}`
	}

	// Internal state using Time
	let internalValue = $state<Time | undefined>(stringToTime(value))

	// Sync external value changes to internal state
	$effect(() => {
		const parsed = stringToTime(value)
		if (timeToString(parsed) !== timeToString(internalValue)) {
			internalValue = parsed
		}
	})

	// Handle internal value changes
	function handleValueChange(newValue: Time | undefined) {
		internalValue = newValue
		value = timeToString(newValue)
	}
</script>

{#if label}
	<fieldset class="fieldset">
		<Label.Root class="label">{label}</Label.Root>

		<TimeField.Root
			value={internalValue}
			onValueChange={handleValueChange}
			hourCycle={24}
			{locale}
			{disabled}
			{readonly}
		>
			<div class="time-picker-field" class:contained>
				<TimeField.Input>
					{#snippet children({ segments })}
						{#each segments as { part, value: segValue }, i (i)}
							<TimeField.Segment {part} class="segment">
								{segValue}
							</TimeField.Segment>
						{/each}
					{/snippet}
				</TimeField.Input>
			</div>
		</TimeField.Root>
	</fieldset>
{:else}
	<TimeField.Root
		value={internalValue}
		onValueChange={handleValueChange}
		hourCycle={24}
		{locale}
		{disabled}
		{readonly}
	>
		<div class="time-picker-field" class:contained>
			<TimeField.Input>
				{#snippet children({ segments })}
					{#each segments as { part, value: segValue }, i (i)}
						<TimeField.Segment {part} class="segment">
							{segValue}
						</TimeField.Segment>
					{/each}
				{/snippet}
			</TimeField.Input>
		</div>
	</TimeField.Root>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	.fieldset {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		border: none;
		padding: 0;
		margin: 0;

		:global(.label) {
			color: var(--text-primary);
			font-size: $font-small;
			font-weight: $medium;
			margin-bottom: $unit-half;
		}
	}

	.time-picker-field {
		display: flex;
		align-items: center;
		gap: $unit;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		padding: calc($unit * 1.25) $unit-2x;
		@include smooth-transition($duration-quick, background-color);

		&:hover:not(:has(:disabled)) {
			background-color: var(--input-bg-hover);
		}

		&.contained {
			background-color: var(--input-bound-bg);

			&:hover:not(:has(:disabled)) {
				background-color: var(--input-bound-bg-hover);
			}
		}

		:global(.segment) {
			color: var(--text-primary);
			font-size: $font-regular;
			font-family: inherit;
			padding: $unit-fourth $unit-half;
			border-radius: $unit-fourth;
			outline: none;

			&:focus {
				background-color: $water-text-20;
				color: white;
			}

			&[data-placeholder] {
				color: var(--text-tertiary);
			}

			&[data-segment='literal'] {
				color: var(--text-secondary);
				padding: 0;
			}
		}
	}
</style>
