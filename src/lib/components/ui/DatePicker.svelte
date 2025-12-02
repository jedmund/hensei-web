<svelte:options runes={true} />

<script lang="ts">
	import { DatePicker as BitsDatePicker, Label } from 'bits-ui'
	import { parseDate, type DateValue, CalendarDate } from '@internationalized/date'
	import Icon from '../Icon.svelte'

	interface Props {
		value?: string | null
		placeholder?: string
		disabled?: boolean
		readonly?: boolean
		contained?: boolean
		locale?: string
		label?: string
		minValue?: string
		maxValue?: string
	}

	let {
		value = $bindable(),
		placeholder = 'Select date',
		disabled = false,
		readonly = false,
		contained = false,
		locale = 'en',
		label,
		minValue,
		maxValue
	}: Props = $props()

	// Convert ISO string to DateValue
	function stringToDate(iso: string | null | undefined): DateValue | undefined {
		if (!iso) return undefined
		try {
			return parseDate(iso)
		} catch {
			return undefined
		}
	}

	// Convert DateValue to ISO string
	function dateToString(date: DateValue | undefined): string | null {
		if (!date) return null
		return date.toString()
	}

	// Internal state using DateValue
	let internalValue = $state<DateValue | undefined>(stringToDate(value))

	// Sync external value changes to internal state
	$effect(() => {
		const parsed = stringToDate(value)
		if (parsed?.toString() !== internalValue?.toString()) {
			internalValue = parsed
		}
	})

	// Handle internal value changes
	function handleValueChange(newValue: DateValue | undefined) {
		internalValue = newValue
		value = dateToString(newValue)
	}

	// Convert min/max values
	const minDateValue = $derived(stringToDate(minValue))
	const maxDateValue = $derived(stringToDate(maxValue))

	// Generate a placeholder date for the calendar to show when no value is selected
	const placeholderDate = $derived(() => {
		if (internalValue) return internalValue
		const now = new Date()
		return new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
	})
</script>

{#if label}
	<fieldset class="fieldset">
		<Label.Root class="label">{label}</Label.Root>

		<BitsDatePicker.Root
			value={internalValue}
			onValueChange={handleValueChange}
			{locale}
			{disabled}
			{readonly}
			minValue={minDateValue}
			maxValue={maxDateValue}
			placeholder={placeholderDate()}
		>
			<div class="date-picker-field" class:contained>
				<BitsDatePicker.Input>
					{#snippet children({ segments })}
						{#each segments as { part, value: segValue }}
							<BitsDatePicker.Segment {part} class="segment">
								{segValue}
							</BitsDatePicker.Segment>
						{/each}
					{/snippet}
				</BitsDatePicker.Input>

				<BitsDatePicker.Trigger class="trigger">
					<Icon name="calendar" size={16} />
				</BitsDatePicker.Trigger>
			</div>

			<BitsDatePicker.Content class="content" sideOffset={8}>
				<BitsDatePicker.Calendar class="calendar">
					{#snippet children({ months, weekdays })}
						<BitsDatePicker.Header class="calendar-header">
							<BitsDatePicker.PrevButton class="nav-button">
								<Icon name="chevron-left" size={16} />
							</BitsDatePicker.PrevButton>
							<BitsDatePicker.Heading class="heading" />
							<BitsDatePicker.NextButton class="nav-button">
								<Icon name="chevron-right" size={16} />
							</BitsDatePicker.NextButton>
						</BitsDatePicker.Header>

						{#each months as month}
							<BitsDatePicker.Grid class="grid">
								<BitsDatePicker.GridHead>
									<BitsDatePicker.GridRow class="grid-row">
										{#each weekdays as day}
											<BitsDatePicker.HeadCell class="head-cell">
												{day}
											</BitsDatePicker.HeadCell>
										{/each}
									</BitsDatePicker.GridRow>
								</BitsDatePicker.GridHead>
								<BitsDatePicker.GridBody>
									{#each month.weeks as weekDates}
										<BitsDatePicker.GridRow class="grid-row">
											{#each weekDates as date}
												<BitsDatePicker.Cell {date} month={month.value} class="cell">
													<BitsDatePicker.Day class="day">
														{date.day}
													</BitsDatePicker.Day>
												</BitsDatePicker.Cell>
											{/each}
										</BitsDatePicker.GridRow>
									{/each}
								</BitsDatePicker.GridBody>
							</BitsDatePicker.Grid>
						{/each}
					{/snippet}
				</BitsDatePicker.Calendar>
			</BitsDatePicker.Content>
		</BitsDatePicker.Root>
	</fieldset>
{:else}
	<BitsDatePicker.Root
		value={internalValue}
		onValueChange={handleValueChange}
		{locale}
		{disabled}
		{readonly}
		minValue={minDateValue}
		maxValue={maxDateValue}
		placeholder={placeholderDate()}
	>
		<div class="date-picker-field" class:contained>
			<BitsDatePicker.Input>
				{#snippet children({ segments })}
					{#each segments as { part, value: segValue }}
						<BitsDatePicker.Segment {part} class="segment">
							{segValue}
						</BitsDatePicker.Segment>
					{/each}
				{/snippet}
			</BitsDatePicker.Input>

			<BitsDatePicker.Trigger class="trigger">
				<Icon name="calendar" size={16} />
			</BitsDatePicker.Trigger>
		</div>

		<BitsDatePicker.Content class="content" sideOffset={8}>
			<BitsDatePicker.Calendar class="calendar">
				{#snippet children({ months, weekdays })}
					<BitsDatePicker.Header class="calendar-header">
						<BitsDatePicker.PrevButton class="nav-button">
							<Icon name="chevron-left" size={16} />
						</BitsDatePicker.PrevButton>
						<BitsDatePicker.Heading class="heading" />
						<BitsDatePicker.NextButton class="nav-button">
							<Icon name="chevron-right" size={16} />
						</BitsDatePicker.NextButton>
					</BitsDatePicker.Header>

					{#each months as month}
						<BitsDatePicker.Grid class="grid">
							<BitsDatePicker.GridHead>
								<BitsDatePicker.GridRow class="grid-row">
									{#each weekdays as day}
										<BitsDatePicker.HeadCell class="head-cell">
											{day}
										</BitsDatePicker.HeadCell>
									{/each}
								</BitsDatePicker.GridRow>
							</BitsDatePicker.GridHead>
							<BitsDatePicker.GridBody>
								{#each month.weeks as weekDates}
									<BitsDatePicker.GridRow class="grid-row">
										{#each weekDates as date}
											<BitsDatePicker.Cell {date} month={month.value} class="cell">
												<BitsDatePicker.Day class="day">
													{date.day}
												</BitsDatePicker.Day>
											</BitsDatePicker.Cell>
										{/each}
									</BitsDatePicker.GridRow>
								{/each}
							</BitsDatePicker.GridBody>
						</BitsDatePicker.Grid>
					{/each}
				{/snippet}
			</BitsDatePicker.Calendar>
		</BitsDatePicker.Content>
	</BitsDatePicker.Root>
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

	.date-picker-field {
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

		:global(.trigger) {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: $unit-half;
			margin-left: auto;
			border: none;
			background: transparent;
			color: var(--text-secondary);
			cursor: pointer;
			border-radius: $unit-half;
			@include smooth-transition($duration-quick, background-color, color);

			&:hover {
				background-color: $grey-80;
				color: var(--text-primary);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}
	}

	:global(.content) {
		z-index: 50;
		background-color: $grey-85;
		border-radius: $card-corner;
		padding: $unit-2x;
		box-shadow: $dialog-elevation;
		border: 1px solid $grey-80;
	}

	:global(.calendar) {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	:global(.calendar-header) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: $unit;
	}

	:global(.heading) {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	:global(.nav-button) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: $unit-half;
		@include smooth-transition($duration-quick, background-color, color);

		&:hover:not(:disabled) {
			background-color: $grey-80;
			color: var(--text-primary);
		}

		&:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}
	}

	:global(.grid) {
		border-collapse: collapse;
	}

	:global(.grid-row) {
		display: flex;
		gap: $unit-fourth;
	}

	:global(.head-cell) {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-tertiary);
	}

	:global(.cell) {
		width: 32px;
		height: 32px;
		padding: 0;
	}

	:global(.day) {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-small;
		color: var(--text-primary);
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: $unit-half;
		@include smooth-transition($duration-quick, background-color, color);

		&:hover:not(:disabled):not([data-selected]) {
			background-color: $grey-80;
		}

		&[data-today] {
			font-weight: $medium;
			color: $water-text-20;
		}

		&[data-selected] {
			background-color: $water-text-20;
			color: white;
			font-weight: $medium;
		}

		&[data-outside-month] {
			color: var(--text-tertiary);
			opacity: 0.5;
		}

		&[data-disabled] {
			opacity: 0.3;
			cursor: not-allowed;
		}

		&[data-unavailable] {
			text-decoration: line-through;
			opacity: 0.3;
		}
	}
</style>
