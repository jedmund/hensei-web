<script lang="ts">
  import type { FilterOption, PlaceholderSuggestion } from '$lib/types/filter'
  import SearchOptionItem from '$lib/components/search/SearchOptionItem.svelte'
  import { getElementImage } from '$lib/utils/element'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    inputValue: string
    isSearching: boolean
    placeholderSuggestions: PlaceholderSuggestion[]
    displayResults: FilterOption[]
    selectedIndex: number
    onSelectedIndexChange: (index: number) => void
    onSelectOption: (option: FilterOption) => void
    onSuggestionClick: (suggestion: PlaceholderSuggestion) => void
  }

  let {
    inputValue,
    isSearching,
    placeholderSuggestions,
    displayResults,
    selectedIndex,
    onSelectedIndexChange,
    onSelectOption,
    onSuggestionClick
  }: Props = $props()

  let listEl = $state<HTMLUListElement>()

  // Scroll the selected item into view on keyboard navigation
  $effect(() => {
    const item = listEl?.children[selectedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  })
</script>

<div class="dropdown">
  <ul class="results" role="listbox" bind:this={listEl}>
    {#if !inputValue.trim()}
      {#each placeholderSuggestions as suggestion, i (suggestion.label)}
        <li
          class="result-item"
          class:selected={i === selectedIndex}
          role="option"
          aria-selected={i === selectedIndex}
          onmouseenter={() => onSelectedIndexChange(i)}
          onclick={() => onSuggestionClick(suggestion)}
        >
          <span class="result-label">{suggestion.label}</span>
          <span class="result-category">{suggestion.category}</span>
        </li>
      {/each}
    {:else if displayResults.length > 0}
      {#each displayResults as option, i (option.kind + '-' + option.value)}
        <li
          class="result-item"
          class:entity={option.kind === 'entity'}
          class:selected={i === selectedIndex}
          role="option"
          aria-selected={i === selectedIndex}
          onmouseenter={() => onSelectedIndexChange(i)}
          onclick={() => onSelectOption(option)}
        >
          {#if option.kind === 'entity' && option.granblueId}
            <SearchOptionItem
              label={option.label}
              granblueId={option.granblueId}
              type={option.entityType === 'character' ? 'Character' : option.entityType === 'weapon' ? 'Weapon' : 'Summon'}
              element={option.element}
              season={option.season}
              series={option.series}
              showType={false}
              imageSize={32}
            />
          {:else if option.kind === 'element'}
            <div class="result-with-image">
              <img
                src={getElementImage(option.value as number)}
                alt=""
                class="result-image"
              />
              <span class="result-label">{option.label}</span>
            </div>
            <span class="result-category">{option.category}</span>
          {:else}
            <span class="result-label">{option.label}</span>
            <span class="result-category">{option.category}</span>
          {/if}
        </li>
      {/each}
    {:else if isSearching}
      <li class="result-item loading">
        <span class="result-label">{m.explore_searching()}</span>
      </li>
    {:else}
      <li class="result-item empty">
        <span class="result-label">{m.explore_no_results()}</span>
      </li>
    {/if}
  </ul>
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/layout' as *;
  @use '$src/themes/effects' as *;

  .dropdown {
    position: absolute;
    top: calc(100% + $unit);
    left: 0;
    width: 340px;
    background: var(--menu-bg);
    border: $card-border;
    border-radius: $card-corner;
    box-shadow: $dialog-elevation;
    z-index: $z-popover;
    overflow: hidden;
  }

  .results {
    list-style: none;
    margin: 0;
    padding: $unit-half;
    min-height: 200px;
    max-height: 280px;
    overflow-y: auto;
  }

  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $unit;
    border-radius: $item-corner;
    cursor: pointer;
    @include smooth-transition($duration-quick, background);

    &:hover,
    &.selected {
      background: var(--menu-bg-item-hover);
    }

    &.loading,
    &.empty {
      cursor: default;
      color: var(--text-tertiary);
      justify-content: center;
      min-height: calc(200px - $unit);
    }
  }

  .result-label {
    font-size: $font-small;
    color: var(--text-primary);

    .loading &,
    .empty & {
      color: var(--text-tertiary);
    }
  }

  .result-with-image {
    display: flex;
    align-items: center;
    gap: $unit;
  }

  .result-image {
    width: 32px;
    height: 32px;
    border-radius: $item-corner-small;
    flex-shrink: 0;
  }

  .result-category {
    font-size: $font-tiny;
    color: var(--text-tertiary);
  }
</style>
