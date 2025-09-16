<script lang="ts">
  import { Button } from 'bits-ui';
  import Icon from '../../Icon.svelte';
  import styles from './button.module.scss';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'unstyled' | 'blended' | 'bound' | 'destructive' | 'notice' | 'modal';
    size?: 'icon' | 'small' | 'medium' | 'large';
    element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | null;
    active?: boolean;
    floating?: boolean;
    save?: boolean;
    saved?: boolean;
    leftIcon?: string;
    rightIcon?: string;
    leftAccessoryClass?: string;
    rightAccessoryClass?: string;
    // Legacy props for compatibility
    icon?: string;
    iconPosition?: 'left' | 'right';
    iconOnly?: boolean;
    fullWidth?: boolean;
    href?: string;
    children?: any;
  }

  const {
    variant = 'primary',
    size = 'medium',
    element = null,
    active = false,
    floating = false,
    save = false,
    saved = false,
    leftIcon,
    rightIcon,
    leftAccessoryClass = '',
    rightAccessoryClass = '',
    // Legacy props
    icon,
    iconPosition = 'left',
    iconOnly = false,
    fullWidth = false,
    href,
    disabled = false,
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  // Handle legacy icon prop
  const effectiveLeftIcon = leftIcon || (icon && iconPosition === 'left' ? icon : undefined);
  const effectiveRightIcon = rightIcon || (icon && iconPosition === 'right' ? icon : undefined);

  const iconSizes = {
    icon: 16,
    small: 14,
    medium: 16,
    large: 20
  };

  const classes = variant === 'unstyled'
    ? className
    : [
        styles.button,
        styles[variant],
        styles[size],
        element && styles[element],
        active && styles.active,
        floating && styles.floating,
        save && styles.save,
        saved && styles.saved,
        iconOnly && styles.iconOnly,
        fullWidth && styles.fullWidth,
        className
      ].filter(Boolean).join(' ');

  const leftAccessoryClasses = [
    styles.accessory,
    styles.left,
    leftAccessoryClass
  ].filter(Boolean).join(' ');

  const rightAccessoryClasses = [
    styles.accessory,
    styles.right,
    rightAccessoryClass
  ].filter(Boolean).join(' ');
</script>

<Button.Root
  {href}
  {disabled}
  class={classes}
  {...restProps}
>
  {#if effectiveLeftIcon}
    <span class={leftAccessoryClasses}>
      <Icon name={effectiveLeftIcon} size={iconSizes[size]} />
    </span>
  {/if}
  {#if !iconOnly && children}
    <span class={styles.text}>
      {@render children()}
    </span>
  {/if}
  {#if effectiveRightIcon}
    <span class={rightAccessoryClasses}>
      <Icon name={effectiveRightIcon} size={iconSizes[size]} />
    </span>
  {/if}
</Button.Root>