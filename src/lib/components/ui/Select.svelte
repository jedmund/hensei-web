<script lang="ts" generics="T extends string | number">
	import type { Snippet } from 'svelte'
	import { Select as SelectPrimitive } from 'bits-ui'
	import { Label } from 'bits-ui'
	import Icon from '../Icon.svelte'

	interface Option {
		value: T
		label: string
		/** Optional shorter label shown in the trigger instead of `label` */
		triggerLabel?: string
		disabled?: boolean
		image?: string
		/** CSS background color behind the image thumbnail */
		imageBackground?: string
		/** CSS color for a colored dot indicator */
		color?: string
		/** CSS color applied only to the check indicator, without rendering a color dot */
		indicatorColor?: string
		/** Optional suffix text displayed in muted style */
		suffix?: string
		/** Secondary line displayed below the label */
		subtitle?: string
		/** Display label in muted/tertiary color */
		muted?: boolean
	}

	interface Props {
		options: Option[]
		value?: T
		onValueChange?: (value: T | undefined) => void
		placeholder?: string
		disabled?: boolean
		size?: 'small' | 'medium' | 'large'
		contained?: boolean
		fullWidth?: boolean
		label?: string
		error?: string
		required?: boolean
		portal?: boolean
		class?: string
		/** Custom snippet for rendering suffix area - receives the option */
		suffixSnippet?: Snippet<[Option]>
		/** Extra width (in px) added to the dropdown content beyond the trigger width */
		contentWidthOffset?: number
	}

	let {
		options = [],
		value = $bindable(),
		onValueChange,
		placeholder = 'Select an option',
		disabled = false,
		size = 'medium',
		contained = false,
		fullWidth = false,
		label,
		error,
		required = false,
		portal = false,
		class: className = '',
		suffixSnippet, // eslint-disable-line @typescript-eslint/no-unused-vars
		contentWidthOffset
	}: Props = $props()

	// Convert options to string values for Bits UI (which expects strings internally)
	const stringOptions = $derived(
		options.map((opt) => ({
			...opt,
			value: String(opt.value)
		}))
	)

	const selected = $derived(options.find((opt) => opt.value === value))

	// Local string value for Bits UI (writable derived syncs from external value)
	let internalValue = $derived<string | undefined>(
		value !== undefined && value !== null ? String(value) : undefined
	)

	const hasWrapper = $derived(label || error)

	const fieldsetClasses = $derived(
		['fieldset', fullWidth && 'full', className].filter(Boolean).join(' ')
	)

	const selectClasses = $derived(
		['select', size, contained && 'contained', fullWidth && 'full', disabled && 'disabled']
			.filter(Boolean)
			.join(' ')
	)

	function handleValueChange(newValue: string | undefined) {
		if (newValue !== undefined) {
			// Find the option by its stringified value to get the original type
			const matchingOption = options.find((opt) => String(opt.value) === newValue)
			const typedValue = (matchingOption !== undefined ? matchingOption.value : newValue) as T
			value = typedValue
			if (onValueChange) {
				onValueChange(typedValue)
			}
		}
	}
</script>

{#if hasWrapper}
	<fieldset class={fieldsetClasses}>
		{#if label}
			<Label.Root class="label" for={crypto.randomUUID()}>
				{label}
				{#if required}
					<span class="required">*</span>
				{/if}
			</Label.Root>
		{/if}

		<SelectPrimitive.Root
			type="single"
			bind:value={internalValue}
			onValueChange={handleValueChange}
			{disabled}
			items={stringOptions}
		>
			<SelectPrimitive.Trigger class={selectClasses} data-placeholder={selected === undefined}>
				{#if selected?.color}
					<span class="color-dot" style="background-color: {selected.color}"></span>
				{:else if selected?.image}
					<img
						src={selected.image}
						alt={selected.label}
						class="image"
						style={selected.imageBackground ? `background-color: ${selected.imageBackground}` : ''}
					/>
				{/if}
				<span class="text"
					>{selected !== undefined ? (selected.triggerLabel ?? selected.label) : placeholder}</span
				>
				<Icon name="chevron-down-small" size={14} class="chevron" />
			</SelectPrimitive.Trigger>

			{#if portal}
				<SelectPrimitive.Portal>
					<SelectPrimitive.Content
						class="content"
						style={contentWidthOffset
							? `--content-width-offset: ${contentWidthOffset}px`
							: undefined}
					>
						<SelectPrimitive.Viewport>
							{#each options as option (option.value)}
								<SelectPrimitive.Item
									value={String(option.value)}
									{...option.disabled !== undefined ? { disabled: option.disabled } : {}}
									class="item"
									style={option.indicatorColor
										? `--option-color: ${option.indicatorColor}`
										: option.color
											? `--option-color: ${option.color}`
											: ''}
								>
									{#snippet children({ selected })}
										{#if option.color}
											<span class="color-dot" style="background-color: {option.color}"></span>
										{:else if option.image}
											<img
												src={option.image}
												alt={option.label}
												class="image"
												style={option.imageBackground
													? `background-color: ${option.imageBackground}`
													: ''}
											/>
										{/if}
										{#if option.subtitle}
											<span class="text-stack">
												<span class="text" class:muted={option.muted}>{option.label}</span>
												<span class="subtitle">{option.subtitle}</span>
											</span>
										{:else}
											<span class="text" class:muted={option.muted}>{option.label}</span>
										{/if}
										{#if option.suffix}
											<span class="suffix">{option.suffix}</span>
										{/if}
										{#if selected}
											<span class="indicator">
												<Icon name="check" size={14} />
											</span>
										{/if}
									{/snippet}
								</SelectPrimitive.Item>
							{/each}
						</SelectPrimitive.Viewport>
					</SelectPrimitive.Content>
				</SelectPrimitive.Portal>
			{:else}
				<SelectPrimitive.Content
					class="content"
					style={contentWidthOffset ? `--content-width-offset: ${contentWidthOffset}px` : undefined}
				>
					<SelectPrimitive.Viewport>
						{#each options as option (option.value)}
							<SelectPrimitive.Item
								value={String(option.value)}
								label={option.label}
								disabled={option.disabled}
								class="item"
								style={option.indicatorColor
									? `--option-color: ${option.indicatorColor}`
									: option.color
										? `--option-color: ${option.color}`
										: ''}
							>
								{#snippet children({ selected })}
									{#if option.color}
										<span class="color-dot" style="background-color: {option.color}"></span>
									{:else if option.image}
										<img
											src={option.image}
											alt={option.label}
											class="image"
											style={option.imageBackground
												? `background-color: ${option.imageBackground}`
												: ''}
										/>
									{/if}
									<span class="text" class:muted={option.muted}>{option.label}</span>
									{#if option.suffix}
										<span class="suffix">{option.suffix}</span>
									{/if}
									{#if selected}
										<span class="indicator">
											<Icon name="check" size={14} />
										</span>
									{/if}
								{/snippet}
							</SelectPrimitive.Item>
						{/each}
					</SelectPrimitive.Viewport>
				</SelectPrimitive.Content>
			{/if}
		</SelectPrimitive.Root>

		{#if error}
			<span class="error">{error}</span>
		{/if}
	</fieldset>
{:else}
	<SelectPrimitive.Root
		type="single"
		bind:value={internalValue}
		onValueChange={handleValueChange}
		{disabled}
		items={stringOptions}
	>
		<SelectPrimitive.Trigger class={selectClasses} data-placeholder={selected === undefined}>
			{#if selected?.color}
				<span class="color-dot" style="background-color: {selected.color}"></span>
			{:else if selected?.image}
				<img
					src={selected.image}
					alt={selected.label}
					class="image"
					style={selected.imageBackground ? `background-color: ${selected.imageBackground}` : ''}
				/>
			{/if}
			<span class="text"
				>{selected !== undefined ? (selected.triggerLabel ?? selected.label) : placeholder}</span
			>
			<Icon name="chevron-down-small" size={14} class="chevron" />
		</SelectPrimitive.Trigger>

		{#if portal}
			<SelectPrimitive.Portal>
				<SelectPrimitive.Content
					class="content"
					style={contentWidthOffset ? `--content-width-offset: ${contentWidthOffset}px` : undefined}
				>
					<SelectPrimitive.Viewport>
						{#each options as option (option.value)}
							<SelectPrimitive.Item
								value={String(option.value)}
								label={option.label}
								disabled={option.disabled}
								class="item"
								style={option.indicatorColor
									? `--option-color: ${option.indicatorColor}`
									: option.color
										? `--option-color: ${option.color}`
										: ''}
							>
								{#snippet children({ selected })}
									{#if option.color}
										<span class="color-dot" style="background-color: {option.color}"></span>
									{:else if option.image}
										<img
											src={option.image}
											alt={option.label}
											class="image"
											style={option.imageBackground
												? `background-color: ${option.imageBackground}`
												: ''}
										/>
									{/if}
									{#if option.subtitle}
										<span class="text-stack">
											<span class="text" class:muted={option.muted}>{option.label}</span>
											<span class="subtitle">{option.subtitle}</span>
										</span>
									{:else}
										<span class="text" class:muted={option.muted}>{option.label}</span>
									{/if}
									{#if option.suffix}
										<span class="suffix">{option.suffix}</span>
									{/if}
									{#if selected}
										<span class="indicator">
											<Icon name="check" size={14} />
										</span>
									{/if}
								{/snippet}
							</SelectPrimitive.Item>
						{/each}
					</SelectPrimitive.Viewport>
				</SelectPrimitive.Content>
			</SelectPrimitive.Portal>
		{:else}
			<SelectPrimitive.Content
				class="content"
				style={contentWidthOffset ? `--content-width-offset: ${contentWidthOffset}px` : undefined}
			>
				<SelectPrimitive.Viewport>
					{#each options as option (option.value)}
						<SelectPrimitive.Item
							value={String(option.value)}
							{...option.disabled !== undefined ? { disabled: option.disabled } : {}}
							class="item"
							style={option.indicatorColor
								? `--option-color: ${option.indicatorColor}`
								: option.color
									? `--option-color: ${option.color}`
									: ''}
						>
							{#snippet children({ selected })}
								{#if option.color}
									<span class="color-dot" style="background-color: {option.color}"></span>
								{:else if option.image}
									<img src={option.image} alt={option.label} class="image" />
								{/if}
								{#if option.subtitle}
									<span class="text-stack">
										<span class="text" class:muted={option.muted}>{option.label}</span>
										<span class="subtitle">{option.subtitle}</span>
									</span>
								{:else}
									<span class="text" class:muted={option.muted}>{option.label}</span>
								{/if}
								{#if option.suffix}
									<span class="suffix">{option.suffix}</span>
								{/if}
								{#if selected}
									<span class="indicator">
										<Icon name="check" size={14} />
									</span>
								{/if}
							{/snippet}
						</SelectPrimitive.Item>
					{/each}
				</SelectPrimitive.Viewport>
			</SelectPrimitive.Content>
		{/if}
	</SelectPrimitive.Root>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	// Fieldset wrapper (matching Input component)
	.fieldset {
		display: flex;
		flex-direction: column;
		gap: $unit-half;

		&.full {
			width: 100%;
		}

		:global(.label) {
			color: var(--text-primary);
			font-size: $font-small;
			font-weight: $medium;
			margin-bottom: $unit-half;
		}

		:global(.label .required) {
			color: $error;
			margin-left: $unit-fourth;
		}

		.error {
			color: $error;
			font-size: $font-small;
			padding: $unit-half $unit-2x;
		}
	}

	// Select trigger styling - base styles
	:global([data-select-trigger].select) {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		align-items: center;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 1px solid transparent;
		color: var(--text-primary);
		cursor: pointer;
		display: inline-flex;
		font-family: var(--font-family);
		gap: $unit-half;
		@include smooth-transition($duration-quick, background-color, border-color, box-shadow);

		&:hover:not(.disabled) {
			background-color: var(--input-bg-hover);
		}

		&:focus-visible {
			@include focus-ring($blue);
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&[data-placeholder='true'] .text {
			color: var(--text-tertiary);
		}

		.text {
			flex: 1;
			text-align: left;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--text-secondary);
		}

		.image {
			width: $unit-3x;
			height: $unit-3x;
			flex-shrink: 0;
			border-radius: $full-corner;
			object-fit: cover;
		}

		.color-dot {
			width: 10px;
			height: 10px;
			border-radius: 50%;
			flex-shrink: 0;
		}

		:global(.chevron) {
			flex-shrink: 0;
			color: var(--text-tertiary);
		}
	}

	// Size: small
	:global([data-select-trigger].select.small) {
		padding: $unit-half $unit;
		font-size: $font-small;
		min-height: $unit-3x;
	}

	// Size: medium (default)
	:global([data-select-trigger].select.medium) {
		padding: $unit calc($unit * 1.5);
		font-size: $font-regular;
		min-height: $unit-4x;
	}

	// Size: large
	:global([data-select-trigger].select.large) {
		padding: $unit-2x $unit-3x;
		font-size: $font-large;
		min-height: calc($unit * 6);
	}

	// Variant: contained
	:global([data-select-trigger].select.contained) {
		background-color: var(--select-contained-bg);

		&:hover:not(.disabled) {
			background-color: var(--select-contained-bg-hover);
		}
	}

	// Modifier: full width
	:global([data-select-trigger].select.full) {
		width: 100%;
	}

	// Dropdown content styling
	:global([data-select-content].content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: 0 $unit-half;
		min-width: calc(var(--bits-select-anchor-width) + var(--content-width-offset, 0px));
		max-width: calc(var(--bits-select-anchor-width) + var(--content-width-offset, 0px));
		max-height: 40vh;
		overflow: auto;
		z-index: $z-modal + 2;
		animation: fadeIn $duration-opacity-fade ease-out;

		@keyframes fadeIn {
			from {
				opacity: 0;
				transform: translateY(-4px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}

	// Dropdown items
	:global([data-select-item].item) {
		align-items: center;
		border-radius: $item-corner;
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		gap: $unit;
		padding: $unit $unit-2x $unit $unit;
		user-select: none;
		@include smooth-transition($duration-quick, background-color);

		&:first-child {
			margin-top: $unit-half;
		}

		&:last-child {
			margin-bottom: $unit-half;
		}

		&:hover {
			background-color: var(--option-bg-hover);
		}

		&[data-disabled] {
			color: var(--text-tertiary);
			cursor: not-allowed;
			opacity: 0.5;
		}

		&[data-selected] {
			font-weight: $medium;
		}

		.text-stack {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 1px;

			.text {
				flex: initial;
			}

			.subtitle {
				font-size: $font-small;
				color: var(--text-tertiary);
				line-height: 1.2;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.text {
			flex: 1;

			&.muted {
				color: var(--text-tertiary);
			}
		}

		.suffix {
			color: var(--text-tertiary);
			font-size: $font-small;
		}

		.image {
			width: $unit-3x;
			height: $unit-3x;
			flex-shrink: 0;
			border-radius: $full-corner;
			object-fit: cover;
		}

		.color-dot {
			width: 10px;
			height: 10px;
			border-radius: 50%;
			flex-shrink: 0;
		}

		:global(.indicator) {
			margin-left: auto;
			color: var(--option-color, var(--text-tertiary));
		}
	}

	// Highlighted state (separate global selector for typeahead)
	:global([data-select-item].item[data-highlighted]) {
		background-color: var(--option-bg-hover);
	}
</style>
