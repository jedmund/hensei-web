<script lang="ts">
  import { Label } from 'bits-ui';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import styles from './input.module.scss';
  import Icon from '../../Icon.svelte';

  interface Props extends HTMLInputAttributes {
    variant?: 'default' | 'bound' | 'duration' | 'number' | 'range';
    error?: string;
    label?: string;
    leftIcon?: string;
    rightIcon?: string;
    counter?: number;
    maxLength?: number;
    hidden?: boolean;
    fullWidth?: boolean;
    fullHeight?: boolean;
    alignRight?: boolean;
    accessory?: boolean;
    children?: any;
  }

  let {
    variant = 'default',
    error,
    label,
    leftIcon,
    rightIcon,
    counter,
    maxLength,
    hidden = false,
    fullWidth = false,
    fullHeight = false,
    alignRight = false,
    accessory = false,
    value = $bindable(''),
    type = 'text',
    placeholder,
    disabled = false,
    readonly = false,
    required = false,
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  const showCounter = $derived(counter !== undefined || maxLength !== undefined);
  const currentCount = $derived(String(value).length);

  const fieldsetClasses = [
    styles.fieldset,
    hidden && styles.hidden,
    fullWidth && styles.full,
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    variant === 'bound' && styles.bound,
    variant === 'duration' && styles.duration,
    variant === 'number' && styles.number,
    variant === 'range' && styles.range,
    alignRight && styles.alignRight,
    fullHeight && styles.fullHeight,
    accessory && styles.accessory,
    (leftIcon || rightIcon || showCounter) && styles.wrapper
  ].filter(Boolean).join(' ');
</script>

<fieldset class={fieldsetClasses}>
  {#if label}
    <Label.Root class={styles.label} for={restProps.id}>
      {label}
      {#if required}
        <span class={styles.required}>*</span>
      {/if}
    </Label.Root>
  {/if}

  {#if accessory || leftIcon || rightIcon || showCounter}
    <div class={inputClasses}>
      {#if leftIcon}
        <span class={styles.iconLeft}>
          <Icon name={leftIcon} size={16} />
        </span>
      {/if}

      <input
        bind:value
        {type}
        {placeholder}
        {disabled}
        {readonly}
        {required}
        {maxLength}
        {...restProps}
      />

      {#if rightIcon}
        <span class={styles.iconRight}>
          <Icon name={rightIcon} size={16} />
        </span>
      {/if}

      {#if showCounter}
        <span class={styles.counter}>
          {currentCount}{maxLength ? `/${maxLength}` : ''}
        </span>
      {/if}
    </div>
  {:else}
    <input
      bind:value
      class={inputClasses}
      {type}
      {placeholder}
      {disabled}
      {readonly}
      {required}
      {maxLength}
      {...restProps}
    />
  {/if}

  {#if error}
    <span class={styles.error}>{error}</span>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</fieldset>