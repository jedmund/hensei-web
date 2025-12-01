<!-- Button Component -->
<svelte:options runes={true} />

<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui'
	import type { Snippet } from 'svelte'
	import Icon from '../Icon.svelte'

	interface Props {
		/** Button variant style */
		variant?:
			| 'primary'
			| 'secondary'
			| 'ghost'
			| 'text'
			| 'destructive'
			| 'notice'
			| 'subtle'
			| undefined
		/** Button size */
		size?: 'small' | 'medium' | 'large' | 'icon' | undefined
		/** Whether button is contained */
		contained?: boolean | undefined
		/** Element color theme */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
		/** Use element styling (overrides variant colors) */
		elementStyle?: boolean | undefined
		/** Whether button is active */
		active?: boolean | undefined
		/** Save button behavior */
		save?: boolean | undefined
		/** Whether saved (for save buttons) */
		saved?: boolean | undefined
		/** Full width button */
		fullWidth?: boolean | undefined
		/** Icon only mode */
		iconOnly?: boolean | undefined
		/** Additional CSS classes */
		class?: string | undefined
		/** Button content */
		children?: Snippet | undefined
		/** Left accessory content */
		leftAccessory?: Snippet | undefined
		/** Right accessory content */
		rightAccessory?: Snippet | undefined
		/** Icon name (legacy support) */
		icon?: string | undefined
		/** Icon position (legacy support) */
		iconPosition?: 'left' | 'right' | undefined
		/** Whether button is disabled */
		disabled?: boolean | undefined
		/** Optional href to render as anchor */
		href?: string | undefined
		/** Click handler */
		onclick?: (() => void) | undefined
		/** Shape of the button corners */
		shape?: 'default' | 'circular' | 'circle' | 'pill' | undefined
		/** Element tag override (for slots/triggers) */
		as?: 'button' | 'a' | 'span' | undefined
		/** Any additional HTML attributes */
		[key: string]: any
	}

	const {
		variant = 'secondary',
		size = 'medium',
		contained = false,
		element,
		elementStyle = false,
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
		shape = 'default',
		as,
		...restProps
	}: Props = $props()

	// Normalize shape aliases
	const normalizedShape = $derived(shape === 'circle' ? 'circular' : shape)

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
			elementStyle && element && 'element-styled',
			active && 'active',
			save && 'save',
			saved && 'saved',
			fullWidth && 'full',
			iconOnly && 'iconOnly',
			normalizedShape !== 'default' && normalizedShape,
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
	{:else if hasLeftIcon && !iconOnly && icon}
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
	{:else if hasRightIcon && !iconOnly && icon}
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

	// Ensure icons inherit button text color
	:global([data-button-root] .icon) {
		color: inherit;

		svg {
			fill: currentColor;
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

	// Subtle variant: card-like with border
	:global([data-button-root].subtle) {
		background-color: var(--card-bg);
		color: var(--text-primary);
		border: 1px solid var(--button-bg);

		&:hover:not(:disabled) {
			background-color: var(--button-bg-hover);
			border-color: var(--button-bg-hover);
		}

		&:focus-visible {
			@include focus-ring($blue);
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
		padding: $unit calc($unit * 1.5);
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

	// Shapes
	:global([data-button-root].circular) {
		border-radius: 999px;
	}

	:global([data-button-root].pill) {
		border-radius: 999px;
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

	// Icon only buttons - must come after size definitions for proper specificity
	:global([data-button-root].iconOnly) {
		gap: 0;
		aspect-ratio: 1;
		padding: calc($unit * 1.5); // Default square padding

		&.small {
			padding: $unit !important; // Override size padding
			width: calc($unit * 3.5);
			height: calc($unit * 3.5);
		}

		&.medium {
			padding: calc($unit * 1.5) !important; // Override size padding
			width: calc($unit * 5.5);
			height: calc($unit * 5.5);
		}

		&.large {
			padding: $unit-2x !important; // Override size padding
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

	// Element colors - when elementStyle is true, use the new button-specific variables
	:global([data-button-root].element-styled.wind) {
		background: var(--wind-button-bg);
		color: white;

		&:hover:not(:disabled) {
			background: var(--wind-bg-hover);
			color: white;
		}
	}

	:global([data-button-root].element-styled.fire) {
		background: var(--fire-button-bg);
		color: white;

		&:hover:not(:disabled) {
			background: var(--fire-bg-hover);
			color: white;
		}
	}

	:global([data-button-root].element-styled.water) {
		background: var(--water-button-bg);
		color: white;

		&:hover:not(:disabled) {
			background: var(--water-bg-hover);
			color: white;
		}
	}

	:global([data-button-root].element-styled.earth) {
		background: var(--earth-button-bg);
		color: white;

		&:hover:not(:disabled) {
			background: var(--earth-bg-hover);
			color: white;
		}
	}

	:global([data-button-root].element-styled.dark) {
		background: var(--dark-button-bg);
		color: white;

		&:hover:not(:disabled) {
			background: var(--dark-bg-hover);
			color: white;
		}
	}

	:global([data-button-root].element-styled.light) {
		background: var(--light-button-bg);
		color: black;

		&:hover:not(:disabled) {
			background: var(--light-bg-hover);
			color: white;
		}
	}

	// Keep non-styled element classes for backward compatibility
	:global([data-button-root].wind:not(.element-styled)) {
		background: var(--wind-bg);
		color: var(--wind-text-contrast);

		&:hover:not(:disabled) {
			background: var(--wind-bg-hover);
			color: var(--wind-text-contrast);
		}
	}

	:global([data-button-root].fire:not(.element-styled)) {
		background: var(--fire-bg);
		color: var(--fire-text-contrast);

		&:hover:not(:disabled) {
			background: var(--fire-bg-hover);
			color: var(--fire-text-contrast);
		}
	}

	:global([data-button-root].water:not(.element-styled)) {
		background: var(--water-bg);
		color: var(--water-text-contrast);

		&:hover:not(:disabled) {
			background: var(--water-bg-hover);
			color: var(--water-text-contrast);
		}
	}

	:global([data-button-root].earth:not(.element-styled)) {
		background: var(--earth-bg);
		color: var(--earth-text-contrast);

		&:hover:not(:disabled) {
			background: var(--earth-bg-hover);
			color: var(--earth-text-contrast);
		}
	}

	:global([data-button-root].dark:not(.element-styled)) {
		background: var(--dark-bg);
		color: var(--dark-text-contrast);

		&:hover:not(:disabled) {
			background: var(--dark-bg-hover);
			color: var(--dark-text-contrast);
		}
	}

	:global([data-button-root].light:not(.element-styled)) {
		background: var(--light-bg);
		color: var(--light-text-contrast);

		&:hover:not(:disabled) {
			background: var(--light-bg-hover);
			color: var(--light-text-contrast);
		}
	}
</style>
