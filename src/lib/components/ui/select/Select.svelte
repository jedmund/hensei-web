<script lang="ts" generics="T extends string | number">
  import { Select } from 'bits-ui';

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
    'trigger',
    variant === 'bound' && 'bound',
    variant === 'small' && 'small',
    variant === 'table' && 'table',
    position === 'right' && 'right',
    position === 'left' && 'left',
    fullWidth && 'full',
    hidden && 'hidden',
    disabled && 'disabled',
    className
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'select',
    variant === 'bound' && 'bound'
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
    <span class="icon">
      <span class="chevron">▼</span>
    </span>
  </Select.Trigger>

  <Select.Content class={contentClasses}>
    <div class="scroll up">
      <span class="chevron">▼</span>
    </div>

    <Select.Viewport>
      {#each options as option}
        <Select.Item
          value={option.value}
          disabled={option.disabled}
          class="item"
        >
          {#if option.image}
            <img src={option.image} alt={option.label} />
          {/if}
          <span>{option.label}</span>
          <Select.ItemIndicator class="indicator">
            <span>✓</span>
          </Select.ItemIndicator>
        </Select.Item>
      {/each}
    </Select.Viewport>

    <div class="scroll down">
      <span class="chevron">▼</span>
    </div>
  </Select.Content>
</Select.Root>

<style lang="scss">
@use 'themes/spacing' as *;
@use 'themes/colors' as *;
@use 'themes/typography' as *;
@use 'themes/layout' as *;
@use 'themes/effects' as *;
@use 'themes/mixins' as *;

.trigger {
  align-items: center;
  background-color: var(--input-bg);
  border-radius: $input-corner;
  border: 2px solid transparent;
  display: flex;
  gap: $unit;
  padding: calc($unit * 1.5) $unit-2x;
  white-space: nowrap;
  cursor: pointer;
  @include smooth-transition($duration-zoom, background-color);

  &.small {
    & > span:not(.icon) {
      font-size: $font-small;
      margin: 0;
      max-width: 200px;
    }

    @include breakpoint(tablet) {
      &::before {
        content: '';
        display: block;
        width: calc($unit-2x - 1px);
      }

      & > span:not(.icon) {
        width: 100%;
        max-width: inherit;
        text-align: center;
      }
    }
  }

  &.grow {
    flex-grow: 1;
  }

  &.left {
    flex-grow: 1;
    width: 100%;
  }

  &.right {
    flex-grow: 0;
    text-align: right;
    min-width: 12rem;
  }

  &.bound {
    background-color: var(--select-contained-bg);

    &:hover {
      background-color: var(--select-contained-bg-hover);

      &.disabled {
        background-color: var(--select-contained-bg);
      }
    }
  }

  &.full {
    width: 100%;
  }

  &.table {
    min-width: calc($unit * 30);

    @include breakpoint(phone) {
      width: 100%;
    }
  }

  &.hidden {
    display: none;
  }

  &:hover {
    background-color: var(--input-bg-hover);

    span:not(.icon),
    &[data-placeholder] > span:not(.icon) {
      color: var(--text-primary);
    }

    .icon svg {
      fill: var(--text-primary);
    }
  }

  &.disabled:hover {
    background-color: var(--input-bg);
    cursor: not-allowed;
  }

  &[data-placeholder='true'] > span:not(.icon) {
    color: var(--text-secondary);
  }

  & > span:not(.icon) {
    color: var(--text-primary);
    flex-grow: 1;
    font-size: $font-regular;
    text-align: left;
  }

  img {
    width: $unit-4x;
    height: auto;
  }

  .icon {
    display: flex;
    align-items: center;

    svg {
      fill: var(--icon-secondary);
    }

    .chevron {
      font-size: 10px;
      color: var(--icon-secondary);
    }
  }
}

.select {
  animation: scaleIn $duration-zoom ease-out;
  background: var(--dialog-bg);
  border-radius: $card-corner;
  border: 1px solid rgba(0, 0, 0, 0.24);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
  padding: 0 $unit;
  min-width: var(--radix-select-trigger-width);
  transform-origin: var(--radix-select-content-transform-origin);
  max-height: 40vh;
  z-index: 40;

  &.bound {
    background-color: var(--select-content-contained-bg);
  }

  .scroll.up,
  .scroll.down {
    padding: $unit 0;
    text-align: center;

    &:hover svg, &:hover .chevron {
      fill: var(--icon-secondary-hover);
      color: var(--icon-secondary-hover);
    }

    svg {
      fill: var(--icon-secondary);
    }

    .chevron {
      font-size: 10px;
      color: var(--icon-secondary);
    }
  }

  .scroll.up {
    transform: scale(1, -1);
  }

  @keyframes scaleIn {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    20% {
      opacity: 0.2;
      transform: scale(0.4);
    }
    40% {
      opacity: 0.4;
      transform: scale(0.8);
    }
    60% {
      opacity: 0.6;
      transform: scale(1);
    }
    65% {
      opacity: 0.65;
      transform: scale(1.1);
    }
    70% {
      opacity: 0.7;
      transform: scale(1);
    }
    75% {
      opacity: 0.75;
      transform: scale(0.98);
    }
    80% {
      opacity: 0.8;
      transform: scale(1.02);
    }
    90% {
      opacity: 0.9;
      transform: scale(0.96);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.item {
  align-items: center;
  border-radius: $item-corner-small;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  gap: $unit;
  padding: $unit $unit-2x;
  position: relative;
  user-select: none;
  @include smooth-transition($duration-opacity-fade, background-color);

  &:hover {
    background-color: var(--option-bg-hover);
  }

  &[data-disabled] {
    color: var(--text-tertiary);
    cursor: not-allowed;
    opacity: 0.5;
  }

  &[data-selected] {
    background-color: var(--option-bg-hover);
    font-weight: $medium;
  }

  img {
    width: $unit-3x;
    height: auto;
  }

  span {
    flex-grow: 1;
  }

  .indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;

    svg, span {
      fill: var(--accent-blue);
      color: var(--accent-blue);
    }
  }
}
</style>