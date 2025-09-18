<!-- Button Component -->
<svelte:options runes={true} />

<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui'
	import type { Snippet } from 'svelte'
	import Icon from '../Icon.svelte'

	interface Props {
		/** Button variant style */
		variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'destructive' | 'notice'
		/** Button size */
		size?: 'small' | 'medium' | 'large' | 'icon'
		/** Whether button is contained */
		contained?: boolean
		/** Element color theme */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
		/** Whether button is active */
		active?: boolean
		/** Save button behavior */
		save?: boolean
		/** Whether saved (for save buttons) */
		saved?: boolean
		/** Full width button */
		fullWidth?: boolean
		/** Icon only mode */
		iconOnly?: boolean
		/** Additional CSS classes */
		class?: string
		/** Button content */
		children?: Snippet
		/** Left accessory content */
		leftAccessory?: Snippet
		/** Right accessory content */
		rightAccessory?: Snippet
		/** Icon name (legacy support) */
		icon?: string
		/** Icon position (legacy support) */
		iconPosition?: 'left' | 'right'
		/** Whether button is disabled */
		disabled?: boolean
		/** Optional href to render as anchor */
		href?: string
		/** Click handler */
		onclick?: () => void
		/** Any additional HTML attributes */
		[key: string]: any
	}

	const {
		variant = 'secondary',
		size = 'medium',
		contained = false,
		element,
		active = false,
		save = false,
		saved = false,
		fullWidth = false,
		iconOnly = false,
		class: className = '',
		children,
		leftAccessory,
		rightAccessory,
		icon,
		iconPosition = 'left',
		disabled = false,
		href,
		onclick,
		...restProps
	}: Props = $props()

	const iconSizes = {
		icon: 16,
		small: 14,
		medium: 16,
		large: 20
	}

	const buttonClass = $derived(
		[
			'button',
			variant,
			size,
			contained && 'contained',
			element,
			active && 'active',
			save && 'save',
			saved && 'saved',
			fullWidth && 'full',
			iconOnly && 'iconOnly',
			className
		]
			.filter(Boolean)
			.join(' ')
	)

	// Handle legacy icon prop
	const hasLeftIcon = $derived(icon && iconPosition === 'left')
	const hasRightIcon = $derived(icon && iconPosition === 'right')
</script>

<ButtonPrimitive.Root class={buttonClass} {disabled} {href} {onclick} {...restProps}>
	{#if leftAccessory}
		<span class="accessory">
			{@render leftAccessory()}
		</span>
	{:else if hasLeftIcon}
		<span class="accessory">
			<Icon name={icon} size={iconSizes[size]} />
		</span>
	{/if}

	{#if children && !iconOnly}
		<span class="text">
			{@render children()}
		</span>
	{:else if iconOnly && icon}
		<Icon name={icon} size={iconSizes[size]} />
	{/if}

	{#if rightAccessory}
		<span class="accessory">
			{@render rightAccessory()}
		</span>
	{:else if hasRightIcon}
		<span class="accessory">
			<Icon name={icon} size={iconSizes[size]} />
		</span>
	{/if}
</ButtonPrimitive.Root>

<style lang="scss">
	@use 'sass:color';
	@use 'themes/spacing' as *;
	@use 'themes/mixins' as *;
	@use 'themes/colors' as *;
	@use 'themes/typography' as *;
	@use 'themes/effects' as *;
	@use 'themes/layout' as *;

	// Reset browser defaults for Bits UI button
	:global([data-button-root]) {
		all: unset;
		display: inline-flex;
		box-sizing: border-box;
		cursor: pointer;
	}

	// Base button styles
	:global([data-button-root].button) {
		align-items: center;
		justify-content: center;
		gap: $unit-three-quarter;
		user-select: none;
		text-decoration: none;
		line-height: 1;
		position: relative;
		white-space: nowrap;
		border: none;
		border-radius: $input-corner;
		font-size: $font-button;
		font-weight: $medium;
		background: var(--button-bg);
		color: var(--button-text);
		padding: calc($unit * 1.5) $unit-2x;
		font-family: inherit;
		@include smooth-transition($duration-zoom, background-color, color, border-color);

		&:active:not(:disabled) {
			transform: translateY(1px);
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&:focus-visible {
			@include focus-ring($blue);
		}
	}

	// Inner elements
	:global([data-button-root] .text) {
		align-items: center;
		color: inherit;
		display: flex;
	}

	:global([data-button-root] .accessory) {
		display: flex;
		align-items: center;

		svg {
			fill: currentColor;
			height: 1em;
			width: 1em;
		}
	}

	// Variants
	:global([data-button-root].primary) {
		background-color: var(--button-contained-bg);
		color: var(--button-text);

		&:hover:not(:disabled) {
			background-color: var(--button-contained-bg-hover);
		}
	}

	:global([data-button-root].secondary) {
		background-color: var(--button-bg);
		color: var(--button-text);
		// border: 1px solid $grey-70;

		&:hover:not(:disabled) {
			background-color: var(--button-bg-hover);
			color: var(--button-text-hover);
		}
	}

	:global([data-button-root].ghost) {
		background-color: transparent;
		color: var(--text-secondary);

		&:hover:not(:disabled) {
			background-color: var(--button-bg);
			color: var(--text-primary);
		}
	}

	:global([data-button-root].text) {
		background-color: transparent;
		color: var(--accent-blue);
		padding: 0;
		min-height: auto;
		border: none;

		&:hover:not(:disabled) {
			color: var(--accent-blue-focus);
			text-decoration: underline;
		}

		&:active:not(:disabled) {
			transform: none;
		}
	}

	:global([data-button-root].destructive) {
		background: $error;
		color: white;

		&:hover:not(:disabled) {
			background: color.adjust($error, $lightness: -15%);
		}
	}

	:global([data-button-root].notice) {
		background-color: var(--notice-button-bg);
		color: var(--notice-button-text);

		&:hover:not(:disabled) {
			background-color: var(--notice-button-bg-hover);
		}
	}

	// Sizes
	:global([data-button-root].small) {
		padding: $unit $unit-2x;
		font-size: $font-small;
		min-height: calc($unit * 3.5);
	}

	:global([data-button-root].medium) {
		height: calc($unit * 5.5);
		padding: $unit ($unit * 2.5);
		font-size: $font-regular;
	}

	:global([data-button-root].large) {
		font-size: $font-large;
		padding: $unit-2x $unit-3x;
		min-height: calc($unit * 6.5);
	}

	:global([data-button-root].icon) {
		aspect-ratio: 1 / 1;
		padding: calc($unit * 1.5);
		height: calc($unit * 5.5);
		width: calc($unit * 5.5);
	}

	// Modifiers
	:global([data-button-root].contained) {
		background: var(--button-contained-bg);
		color: var(--button-contained-text, var(--button-text));

		&:hover:not(:disabled) {
			background: var(--button-contained-bg-hover);
		}
	}

	:global([data-button-root].active) {
		background: var(--button-bg-hover);
		color: var(--button-text-hover);
	}

	:global([data-button-root].full) {
		width: 100%;
	}

	:global([data-button-root].iconOnly) {
		gap: 0;
		aspect-ratio: 1;

		&.small {
			padding: $unit;
			width: calc($unit * 3.5);
			height: calc($unit * 3.5);
		}

		&.medium {
			padding: calc($unit * 1.5);
			width: calc($unit * 5.5);
			height: calc($unit * 5.5);
		}

		&.large {
			padding: $unit-2x;
			width: calc($unit * 6.5);
			height: calc($unit * 6.5);
		}
	}

	// Save button special states
	:global([data-button-root].save) {
		.accessory svg {
			fill: none;
			stroke: currentColor;
		}

		&:hover:not(:disabled) {
			color: $save-red;
		}
	}

	:global([data-button-root].saved) {
		color: $save-red;

		.accessory svg {
			fill: $save-red;
			stroke: $save-red;
		}

		&:hover:not(:disabled) {
			.accessory svg {
				fill: none;
				stroke: $save-red;
			}
		}
	}

	// Element colors
	:global([data-button-root].wind) {
		background: var(--wind-bg);
		color: var(--wind-text-contrast);

		&:hover:not(:disabled) {
			background: var(--wind-bg-hover);
		}
	}

	:global([data-button-root].fire) {
		background: var(--fire-bg);
		color: var(--fire-text-contrast);

		&:hover:not(:disabled) {
			background: var(--fire-bg-hover);
		}
	}

	:global([data-button-root].water) {
		background: var(--water-bg);
		color: var(--water-text-contrast);

		&:hover:not(:disabled) {
			background: var(--water-bg-hover);
		}
	}

	:global([data-button-root].earth) {
		background: var(--earth-bg);
		color: var(--earth-text-contrast);

		&:hover:not(:disabled) {
			background: var(--earth-bg-hover);
		}
	}

	:global([data-button-root].dark) {
		background: var(--dark-bg);
		color: var(--dark-text-contrast);

		&:hover:not(:disabled) {
			background: var(--dark-bg-hover);
		}
	}

	:global([data-button-root].light) {
		background: var(--light-bg);
		color: var(--light-text-contrast);

		&:hover:not(:disabled) {
			background: var(--light-bg-hover);
		}
	}
</style>
