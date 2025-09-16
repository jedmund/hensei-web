<script lang="ts" generics="T extends string | number">
  import { Select } from 'bits-ui';
  import { ChevronDown, Check } from 'lucide-svelte';
  import styles from './select.module.scss';

  interface Option {
    value: T;
    label: string;
    disabled?: boolean;
    image?: string;
  }

  interface Props {
    options: Option[];
    value?: T;
    onValueChange?: (value: T | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    variant?: 'default' | 'bound' | 'small' | 'table';
    position?: 'left' | 'right';
    fullWidth?: boolean;
    hidden?: boolean;
    name?: string;
    required?: boolean;
    class?: string;
  }

  const {
    options = [],
    value = $bindable(),
    onValueChange,
    placeholder = 'Select an option',
    disabled = false,
    variant = 'default',
    position = 'left',
    fullWidth = false,
    hidden = false,
    name,
    required = false,
    class: className = ''
  }: Props = $props();

  const selected = $derived(options.find(opt => opt.value === value));

  const triggerClasses = [
    styles.trigger,
    variant === 'bound' && styles.bound,
    variant === 'small' && styles.small,
    variant === 'table' && styles.table,
    position === 'right' && styles.right,
    position === 'left' && styles.left,
    fullWidth && styles.full,
    hidden && styles.hidden,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  const contentClasses = [
    styles.select,
    variant === 'bound' && styles.bound
  ].filter(Boolean).join(' ');

  function handleValueChange(newValue: string | undefined) {
    if (newValue !== undefined && onValueChange) {
      onValueChange(newValue as T);
    }
  }
</script>

<Select.Root
  bind:value
  onValueChange={handleValueChange}
  {disabled}
  {name}
  {required}
>
  <Select.Trigger
    class={triggerClasses}
    data-placeholder={!selected}
  >
    {#if selected?.image}
      <img src={selected.image} alt={selected.label} />
    {/if}
    <span>{selected?.label || placeholder}</span>
    <span class={styles.icon}>
      <ChevronDown size={16} />
    </span>
  </Select.Trigger>

  <Select.Content class={contentClasses}>
    <div class={`${styles.scroll} ${styles.up}`}>
      <ChevronDown size={16} />
    </div>

    <Select.Viewport>
      {#each options as option}
        <Select.Item
          value={option.value}
          disabled={option.disabled}
          class={styles.item}
        >
          {#if option.image}
            <img src={option.image} alt={option.label} />
          {/if}
          <span>{option.label}</span>
          <Select.ItemIndicator class={styles.indicator}>
            <Check size={16} />
          </Select.ItemIndicator>
        </Select.Item>
      {/each}
    </Select.Viewport>

    <div class={`${styles.scroll} ${styles.down}`}>
      <ChevronDown size={16} />
    </div>
  </Select.Content>
</Select.Root>