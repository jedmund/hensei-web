<svelte:options runes={true} />

<script lang="ts">
	import { Label } from 'bits-ui'
	import Icon from '../Icon.svelte'

	interface Props {
		/** Array of tags */
		value?: string[]
		/** Label text */
		label?: string
		/** Placeholder text for the input */
		placeholder?: string
		/** Whether the field is disabled */
		disabled?: boolean
		/** Error message to display */
		error?: string
		/** Maximum number of tags allowed */
		maxTags?: number
		/** Additional CSS classes */
		class?: string
		/** Input id for label association */
		id?: string
	}

	let {
		value = $bindable([]),
		label,
		placeholder = 'Add tag...',
		disabled = false,
		error,
		maxTags,
		class: className = '',
		id
	}: Props = $props()

	let inputValue = $state('')
	let inputElement: HTMLInputElement | undefined = $state()

	const canAddMore = $derived(maxTags === undefined || value.length < maxTags)

	function addTag(tag: string) {
		const trimmed = tag.trim()
		if (trimmed && !value.includes(trimmed) && canAddMore) {
			value = [...value, trimmed]
			inputValue = ''
		}
	}

	function removeTag(index: number) {
		value = value.filter((_, i) => i !== index)
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault()
			addTag(inputValue)
		} else if (event.key === 'Backspace' && inputValue === '' && value.length > 0) {
			removeTag(value.length - 1)
		}
	}

	function handleBlur() {
		if (inputValue.trim()) {
			addTag(inputValue)
		}
	}

	function focusInput() {
		inputElement?.focus()
	}
</script>

{#if label || error}
	<fieldset class="fieldset {className}">
		{#if label}
			<Label.Root class="label" for={id}>
				{label}
			</Label.Root>
		{/if}

		<div
			class="tagInput"
			class:disabled
			class:hasError={!!error}
			onclick={focusInput}
			onkeydown={(e) => e.key === 'Enter' && focusInput()}
			role="button"
			tabindex="-1"
		>
			{#each value as tag, index}
				<span class="tag">
					<span class="tagText">{tag}</span>
					<button
						type="button"
						class="removeTag"
						onclick={() => removeTag(index)}
						{disabled}
						aria-label="Remove {tag}"
					>
						<Icon name="close" size={12} />
					</button>
				</span>
			{/each}

			{#if canAddMore}
				<input
					bind:this={inputElement}
					bind:value={inputValue}
					type="text"
					{placeholder}
					{disabled}
					{id}
					onkeydown={handleKeydown}
					onblur={handleBlur}
					class="input"
				/>
			{/if}
		</div>

		{#if error}
			<span class="error">{error}</span>
		{/if}
	</fieldset>
{:else}
	<div
		class="tagInput {className}"
		class:disabled
		onclick={focusInput}
		onkeydown={(e) => e.key === 'Enter' && focusInput()}
		role="button"
		tabindex="-1"
	>
		{#each value as tag, index}
			<span class="tag">
				<span class="tagText">{tag}</span>
				<button
					type="button"
					class="removeTag"
					onclick={() => removeTag(index)}
					{disabled}
					aria-label="Remove {tag}"
				>
					<Icon name="close" size={12} />
				</button>
			</span>
		{/each}

		{#if canAddMore}
			<input
				bind:this={inputElement}
				bind:value={inputValue}
				type="text"
				{placeholder}
				{disabled}
				{id}
				onkeydown={handleKeydown}
				onblur={handleBlur}
				class="input"
			/>
		{/if}
	</div>
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

		.error {
			color: $error;
			font-size: $font-small;
			padding: $unit-half $unit-2x;
			min-width: 100%;
			margin-bottom: $unit;
			width: 0;
		}
	}

	.tagInput {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $unit-half;
		padding: $unit $unit-2x;
		min-height: calc($unit * 5.5);
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 2px solid transparent;
		cursor: text;
		@include smooth-transition($duration-quick, background-color, border-color);

		&:hover:not(.disabled) {
			background-color: var(--input-bg-hover);
		}

		&:focus-within {
			border-color: $blue;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&.hasError {
			border-color: $error;
		}
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: $unit-fourth;
		padding: $unit-fourth $unit;
		background-color: var(--tag-bg);
		color: var(--tag-text);
		border-radius: calc($input-corner / 2);
		font-size: $font-small;
		line-height: 1.4;
		max-width: 100%;

		.tagText {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.removeTag {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0;
			margin: 0;
			background: none;
			border: none;
			cursor: pointer;
			color: inherit;
			opacity: 0.7;
			flex-shrink: 0;
			@include smooth-transition($duration-quick, opacity);

			&:hover:not(:disabled) {
				opacity: 1;
			}

			&:disabled {
				cursor: not-allowed;
			}

			:global(svg) {
				fill: currentColor;
			}
		}
	}

	.input {
		flex: 1;
		min-width: 80px;
		border: none;
		background: transparent;
		color: var(--text-primary);
		font-size: $font-regular;
		font-family: inherit;
		padding: $unit-fourth 0;
		outline: none;

		&::placeholder {
			color: var(--text-tertiary);
		}

		&:disabled {
			cursor: not-allowed;
		}
	}
</style>
