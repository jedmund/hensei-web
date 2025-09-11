<script lang="ts">
  import { Button } from 'bits-ui';
  import Icon from './Icon.svelte';
  import styles from './Button.module.scss';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'unstyled';
    size?: 'small' | 'medium' | 'large';
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

  const iconSizes = {
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
        iconOnly && styles.iconOnly,
        icon && !iconOnly && iconPosition === 'right' && styles.iconRight,
        icon && !iconOnly && iconPosition === 'left' && styles.iconLeft,
        fullWidth && styles.fullWidth,
        className
      ].filter(Boolean).join(' ');
</script>

<Button.Root 
  {href}
  {disabled}
  class={classes}
  {...restProps}
>
  {#if icon}
    <Icon name={icon} size={iconSizes[size]} />
  {/if}
  {#if !iconOnly && children}
    {@render children()}
  {/if}
</Button.Root>