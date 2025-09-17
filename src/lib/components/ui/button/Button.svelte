<!-- Button Component -->
<svelte:options runes={true} />
<script lang="ts">
  import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  import Icon from '../../Icon.svelte';

  type BaseProps = {
    variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'blended' | 'bound' | 'destructive' | 'notice' | 'modal';
    size?: 'small' | 'medium' | 'large' | 'icon';
    element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light';
    active?: boolean;
    floating?: boolean;
    save?: boolean;
    saved?: boolean;
    fullWidth?: boolean;
    full?: boolean; // Alias for fullWidth
    grow?: boolean;
    noShrink?: boolean;
    iconOnly?: boolean;
    class?: string;
    children?: Snippet;
    leftAccessory?: Snippet;
    rightAccessory?: Snippet;
    // Legacy icon props
    icon?: string;
    leftIcon?: string;
    rightIcon?: string;
    iconPosition?: 'left' | 'right';
    leftAccessoryClass?: string;
    rightAccessoryClass?: string;
  };

  type ButtonProps = BaseProps & HTMLButtonAttributes & { href?: never };
  type LinkProps = BaseProps & HTMLAnchorAttributes & { href: string };

  type Props = ButtonProps | LinkProps;

  let {
    variant = 'primary',
    size = 'medium',
    element,
    active = false,
    floating = false,
    save = false,
    saved = false,
    fullWidth = false,
    full = false,
    grow = false,
    noShrink = false,
    iconOnly = false,
    class: className,
    children,
    leftAccessory,
    rightAccessory,
    // Legacy icon props
    icon,
    leftIcon,
    rightIcon,
    iconPosition = 'left',
    leftAccessoryClass = '',
    rightAccessoryClass = '',
    ...restProps
  }: Props = $props();

  const isLink = $derived('href' in restProps);
  const isFullWidth = $derived(fullWidth || full);

  // Handle legacy icon props
  const effectiveLeftIcon = $derived(leftIcon || (icon && iconPosition === 'left' ? icon : undefined));
  const effectiveRightIcon = $derived(rightIcon || (icon && iconPosition === 'right' ? icon : undefined));

  const iconSizes = {
    icon: 16,
    small: 14,
    medium: 16,
    large: 20
  };

  const buttonClass = $derived(
    `button ${variant || ''} ${size || ''} ${element ? element : ''} ${active ? 'active' : ''} ${floating ? 'floating' : ''} ${save ? 'save' : ''} ${saved ? 'saved' : ''} ${isFullWidth ? 'full' : ''} ${grow ? 'grow' : ''} ${noShrink ? 'no-shrink' : ''} ${iconOnly ? 'iconOnly' : ''} ${className || ''}`.trim()
  );

  const leftAccessoryClasses = $derived(
    `accessory ${leftAccessoryClass}`.trim()
  );

  const rightAccessoryClasses = $derived(
    `accessory arrow ${rightAccessoryClass}`.trim()
  );
</script>

{#if isLink}
  <a
    class={buttonClass}
    {...restProps}
  >
    {#if leftAccessory}
      <span class={leftAccessoryClasses}>
        {@render leftAccessory()}
      </span>
    {:else if effectiveLeftIcon}
      <span class={leftAccessoryClasses}>
        <Icon name={effectiveLeftIcon} size={iconSizes[size]} />
      </span>
    {/if}
    {#if children && !iconOnly}
      <span class="text">
        {@render children()}
      </span>
    {/if}
    {#if rightAccessory}
      <span class={rightAccessoryClasses}>
        {@render rightAccessory()}
      </span>
    {:else if effectiveRightIcon}
      <span class={rightAccessoryClasses}>
        <Icon name={effectiveRightIcon} size={iconSizes[size]} />
      </span>
    {/if}
  </a>
{:else}
  <button
    class={buttonClass}
    {...restProps}
  >
    {#if leftAccessory}
      <span class={leftAccessoryClasses}>
        {@render leftAccessory()}
      </span>
    {:else if effectiveLeftIcon}
      <span class={leftAccessoryClasses}>
        <Icon name={effectiveLeftIcon} size={iconSizes[size]} />
      </span>
    {/if}
    {#if children && !iconOnly}
      <span class="text">
        {@render children()}
      </span>
    {/if}
    {#if rightAccessory}
      <span class={rightAccessoryClasses}>
        {@render rightAccessory()}
      </span>
    {:else if effectiveRightIcon}
      <span class={rightAccessoryClasses}>
        <Icon name={effectiveRightIcon} size={iconSizes[size]} />
      </span>
    {/if}
  </button>
{/if}

<style lang="scss">
@use 'sass:color';
@use 'themes/spacing' as *;
@use 'themes/mixins' as *;
@use 'themes/colors' as *;
@use 'themes/typography' as *;
@use 'themes/effects' as *;
@use 'themes/layout' as *;

// Button base mixin - local to this component
@mixin button-base {
	align-items: center;
	display: inline-flex;
	justify-content: center;
	gap: $unit-three-quarter; // 6px
	cursor: pointer;
	user-select: none;
	text-decoration: none;
	line-height: 1;
	position: relative;
	white-space: nowrap;
	@include smooth-transition($duration-zoom, background-color, color);

	&:active:not(:disabled) {
		transform: translateY(1px);
	}
}

.button {
	@include button-base;
	background: var(--button-bg);
	border: 2px solid transparent;
	border-radius: $input-corner;
	color: var(--button-text);
	font-size: $font-button;
	font-weight: $normal;

	.text {
		align-items: center;
		color: inherit;
		display: flex;
	}

	&:hover,
	&.blended:hover,
	&.blended.active {
		background: var(--button-bg-hover);
		cursor: pointer;
		color: var(--button-text-hover);

		.accessory svg {
			fill: var(--button-text-hover);
		}

		.accessory svg.stroke {
			fill: none;
			stroke: var(--button-text-hover);
		}
	}

	&:disabled {
		background-color: var(--button-bg-disabled);
		color: var(--button-text-disabled);
		cursor: not-allowed;
		opacity: 0.5;

		&:hover {
			background-color: var(--button-bg-disabled);
			color: var(--button-text-disabled);
			cursor: not-allowed;
		}
	}

	&:focus-visible {
		@include focus-ring($blue);
	}
}

// Variants
.primary {
	background-color: var(--button-contained-bg);
	color: var(--button-text);

	&:hover:not(:disabled) {
		background-color: var(--button-contained-bg-hover);
	}
}

.secondary {
	background-color: var(--button-bg);
	color: var(--button-text);
	border: 1px solid var(--separator-bg);

	&:hover:not(:disabled) {
		background-color: var(--button-bg-hover);
		color: var(--button-text-hover);
	}
}

.ghost {
	background-color: transparent;
	color: var(--text-secondary);

	&:hover:not(:disabled) {
		background-color: var(--button-bg);
		color: var(--text-primary);
	}
}

.text {
	background-color: transparent;
	color: var(--accent-blue);
	padding: 0;
	min-height: auto;

	&:hover:not(:disabled) {
		color: var(--accent-blue-focus);
		text-decoration: underline;
	}

	&:active:not(:disabled) {
		transform: none;
	}
}

.blended {
	background: transparent;

	&:hover:not(:disabled) {
		background: var(--button-bg-hover);
	}
}

.bound {
	background: var(--button-contained-bg);

	&:hover:not(:disabled) {
		background: var(--button-contained-bg-hover);
	}

	&.save:hover .accessory svg {
		fill: $save-red;
		stroke: $save-red;
	}

	&.save {
		color: $save-red;

		&.active .accessory svg {
			fill: $save-red;
			stroke: $save-red;
		}

		&:hover {
			color: color.adjust($save-red, $lightness: -30%);

			.accessory svg {
				fill: color.adjust($save-red, $lightness: -30%);
				stroke: color.adjust($save-red, $lightness: -30%);
			}
		}
	}
}

.bound.blended {
	background: var(--dialog-bg);

	&:hover:not(:disabled) {
		background: var(--input-bound-bg);
	}
}

.floating {
	pointer-events: none;
	position: absolute;
	opacity: 0;
	z-index: 99;
}

.destructive {
	background: $error;
	color: white;

	&:hover:not(:disabled) {
		background: color.adjust($error, $lightness: -15%);
	}

	@include breakpoint(phone) {
		background: $error;
		color: $grey-100;

		.accessory svg {
			fill: $grey-100;
		}
	}
}

.notice {
	background-color: var(--notice-button-bg);
	color: var(--notice-button-text);

	&:hover:not(:disabled) {
		background-color: var(--notice-button-bg-hover);
	}
}

.modal {
	&:hover:not(:disabled) {
		background: $grey-90;
	}

	&.destructive {
		color: $error;

		&:hover:not(:disabled) {
			color: color.adjust($error, $lightness: -10%);
		}
	}
}

// Modifiers
.full {
	width: 100%;
}

.fullWidth {
	width: 100%;
}

.grow {
	flex-grow: 1;
}

.no-shrink {
	flex-shrink: 0;
}

.active {
	background: var(--button-bg-hover);
	color: var(--button-text-hover);
}

// Sizes
.icon {
	aspect-ratio: 1 / 1;
	padding: calc($unit * 1.5);
	height: calc($unit * 5.5);
	width: calc($unit * 5.5);

	.text {
		display: none;

		@include breakpoint(tablet) {
			display: block;
		}

		@include breakpoint(phone) {
			display: block;
		}
	}
}

.small {
	padding: $unit $unit-2x;
	font-size: $font-small;
	min-height: calc($unit * 3.5);

	&.iconOnly {
		padding: $unit;
		width: calc($unit * 3.5);
		height: calc($unit * 3.5);
	}
}

.medium {
	height: calc($unit * 5.5);
	padding: calc($unit * 1.5) $unit-2x;
	font-size: $font-regular;

	&.iconOnly {
		padding: calc($unit * 1.5);
		width: calc($unit * 5.5);
		height: calc($unit * 5.5);
	}
}

.large {
	font-size: $font-large;
	padding: $unit-2x $unit-3x;
	min-height: calc($unit * 6.5);

	&.iconOnly {
		padding: $unit-2x;
		width: calc($unit * 6.5);
		height: calc($unit * 6.5);
	}
}

// Special features
.save {
	.accessory svg {
		fill: none;
		stroke: var(--button-text);
	}

	&.saved {
		color: $save-red;

		.accessory svg {
			fill: $save-red;
			stroke: $save-red;
		}

		&:hover:not(:disabled) {
			color: $save-red;

			.accessory svg {
				fill: none;
				stroke: $save-red;
			}
		}
	}

	&:hover:not(:disabled) {
		color: $save-red;

		.accessory svg {
			fill: $save-red;
			stroke: $save-red;
		}
	}
}

// Element colors
.wind {
	background: var(--wind-bg);
	color: var(--wind-text-contrast);

	&:hover:not(:disabled) {
		background: var(--wind-bg-hover);
		color: var(--wind-text-hover);
	}
}

.fire {
	background: var(--fire-bg);
	color: var(--fire-text-contrast);

	&:hover:not(:disabled) {
		background: var(--fire-bg-hover);
		color: var(--fire-text-hover);
	}
}

.water {
	background: var(--water-bg);
	color: var(--water-text-contrast);

	&:hover:not(:disabled) {
		background: var(--water-bg-hover);
		color: var(--water-text-hover);
	}
}

.earth {
	background: var(--earth-bg);
	color: var(--earth-text-contrast);

	&:hover:not(:disabled) {
		background: var(--earth-bg-hover);
		color: var(--earth-text-hover);
	}
}

.dark {
	background: var(--dark-bg);
	color: var(--dark-text-contrast);

	&:hover:not(:disabled) {
		background: var(--dark-bg-hover);
		color: var(--dark-text-hover);
	}
}

.light {
	background: var(--light-bg);
	color: var(--light-text-contrast);

	&:hover:not(:disabled) {
		background: var(--light-bg-hover);
		color: var(--light-text-hover);
	}
}

// Icon-only specific
.iconOnly {
	gap: 0;
	aspect-ratio: 1;
}

// Accessories
.accessory {
	$dimension: $unit-2x;

	display: flex;
	align-items: center;

	&.arrow {
		margin-top: $unit-half;
	}

	&.flipped {
		transform: rotate(180deg);
	}

	svg {
		fill: var(--button-text);
		height: $dimension;
		width: $dimension;

		&.stroke {
			fill: none;
			stroke: var(--button-text);
		}

		&.Add {
			height: 18px;
			width: 18px;
		}

		&.Check {
			height: 22px;
			width: 22px;
		}
	}

	&.check svg {
		margin-top: 1px;
		height: 14px;
		width: auto;
	}

	&.settings svg {
		height: 13px;
		width: 13px;
	}
}

// CSS modules workaround for floating button behavior
:global(.unit:hover) .floating,
:global(.unit) .floating.active {
	pointer-events: initial;
	opacity: 1;
}
</style>