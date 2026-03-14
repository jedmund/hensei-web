
<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import Tooltip from '$lib/components/ui/Tooltip.svelte'
  import * as m from '$lib/paraglide/messages'

  const ELEMENT_CLASSES: Record<number, string> = {
    0: 'null',
    1: 'wind',
    2: 'fire',
    3: 'water',
    4: 'earth',
    5: 'dark',
    6: 'light'
  }

  interface Props {
    label: string
    kind: string
    mode?: 'include' | 'exclude'
    element?: number
    pinned?: boolean
    onRemove: () => void
    onToggleMode?: () => void
  }

  let { label, kind, mode, element, pinned = false, onRemove, onToggleMode }: Props = $props()

  const isEntity = $derived(kind === 'entity')
  const prefixIcon = $derived(isEntity ? (mode === 'exclude' ? 'minus' : 'plus') : '')
  const elementClass = $derived(element !== undefined ? ELEMENT_CLASSES[element] ?? '' : '')
</script>

<span class="pill {elementClass}" class:entity={isEntity}>
  {#if isEntity}
    <Tooltip content={mode === 'exclude' ? m.explore_pill_include() : m.explore_pill_exclude()}>
      <button
        type="button"
        class="toggle-area"
        onclick={(e) => { e.stopPropagation(); onToggleMode?.() }}
        aria-label={mode === 'exclude' ? m.explore_pill_switch_include() : m.explore_pill_switch_exclude()}
      >
        <span class="prefix"><Icon name={prefixIcon} size={10} /></span>
        <span class="label">{label}</span>
      </button>
    </Tooltip>
  {:else}
    <span class="label">{label}</span>
  {/if}
  {#if !pinned}
    <button
      type="button"
      class="remove"
      onclick={(e) => { e.stopPropagation(); onRemove() }}
      aria-label={m.explore_pill_remove()}
    >
      <Icon name="close" size={12} />
    </button>
  {/if}
</span>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/layout' as *;
  @use '$src/themes/effects' as *;

  .pill {
    display: inline-flex;
    align-items: center;
    gap: $unit-half;
    padding: $unit-half $unit;
    background: var(--null-bg);
    border: 1px solid transparent;
    border-radius: $full-corner;
    font-size: $font-small;
    color: var(--text-primary);
    white-space: nowrap;
    @include smooth-transition($duration-quick, background, border-color);

    &:hover {
      background: var(--null-bg-hover);
    }

    &.wind {
      background: var(--wind-bg);
      border-color: var(--wind-bg);
      color: var(--wind-text);

      &:hover {
        background: var(--wind-bg-hover);
      }
    }

    &.fire {
      background: var(--fire-bg);
      border-color: var(--fire-bg);
      color: var(--fire-text);

      &:hover {
        background: var(--fire-bg-hover);
      }
    }

    &.water {
      background: var(--water-bg);
      border-color: var(--water-bg);
      color: var(--water-text);

      &:hover {
        background: var(--water-bg-hover);
      }
    }

    &.earth {
      background: var(--earth-bg);
      border-color: var(--earth-bg);
      color: var(--earth-text);

      &:hover {
        background: var(--earth-bg-hover);
      }
    }

    &.dark {
      background: var(--dark-bg);
      border-color: var(--dark-bg);
      color: var(--dark-text);

      &:hover {
        background: var(--dark-bg-hover);
      }
    }

    &.light {
      background: var(--light-bg);
      border-color: var(--light-bg);
      color: var(--light-text);

      &:hover {
        background: var(--light-bg-hover);
      }
    }
  }

  .toggle-area {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: $unit-half;
    color: inherit;
    line-height: 1;
  }

  .prefix {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 10px;
    opacity: 0.7;

    .toggle-area:hover & {
      opacity: 1;
    }
  }

  .label {
    line-height: 1;
  }

  .remove {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--text-secondary);
    line-height: 1;

    &:hover {
      color: var(--text-primary);
    }

    .wind &,
    .fire &,
    .water &,
    .earth &,
    .dark &,
    .light & {
      color: inherit;
      opacity: 0.5;

      &:hover {
        opacity: 1;
      }
    }
  }
</style>
