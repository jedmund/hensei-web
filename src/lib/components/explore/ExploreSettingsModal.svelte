
<script lang="ts">
  import Dialog from '$lib/components/ui/Dialog.svelte'
  import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
  import ModalBody from '$lib/components/ui/ModalBody.svelte'
  import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
  import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
  import Slider from '$lib/components/ui/Slider.svelte'
  import Switch from '$lib/components/ui/switch/Switch.svelte'
  import type { FilterSet } from '$lib/types/FilterSet'
  import { defaultFilterSet } from '$lib/utils/defaultFilters'

  interface Props {
    open: boolean
    filters: FilterSet
    onSave: (filters: FilterSet) => void
    onOpenChange?: (open: boolean) => void
  }

  let { open = $bindable(false), filters, onSave, onOpenChange }: Props = $props()

  // Local editing state
  let minCharacters = $state(filters.characters_count ?? 3)
  let minWeapons = $state(filters.weapons_count ?? 5)
  let minSummons = $state(filters.summons_count ?? 2)
  let nameQuality = $state(filters.name_quality ?? false)
  let userQuality = $state(filters.user_quality ?? false)
  let originalOnly = $state(filters.original ?? false)

  // Sync when filters prop changes
  $effect(() => {
    minCharacters = filters.characters_count ?? 3
    minWeapons = filters.weapons_count ?? 5
    minSummons = filters.summons_count ?? 2
    nameQuality = filters.name_quality ?? false
    userQuality = filters.user_quality ?? false
    originalOnly = filters.original ?? false
  })

  function save() {
    const result: FilterSet = {
      ...filters,
      characters_count: minCharacters,
      weapons_count: minWeapons,
      summons_count: minSummons,
      name_quality: nameQuality,
      user_quality: userQuality,
      original: originalOnly
    }
    onSave(result)
    open = false
  }

  function reset() {
    minCharacters = defaultFilterSet.characters_count!
    minWeapons = defaultFilterSet.weapons_count!
    minSummons = defaultFilterSet.summons_count!
    nameQuality = defaultFilterSet.name_quality!
    userQuality = defaultFilterSet.user_quality!
    originalOnly = defaultFilterSet.original!
  }
</script>

<Dialog bind:open {onOpenChange}>
  <ModalHeader title="Filter Settings" />
  <ModalBody>
    <div class="sections">
      <section>
        <h3>Grid Counts</h3>
        <SettingsRow title="Min Characters" subtitle="Minimum number of characters">
          {#snippet control()}
            <div class="slider-row">
              <Slider
                value={minCharacters}
                min={0}
                max={5}
                step={1}
                onValueChange={(v) => (minCharacters = v)}
              />
              <span class="slider-value">{minCharacters}</span>
            </div>
          {/snippet}
        </SettingsRow>
        <SettingsRow title="Min Weapons" subtitle="Minimum number of weapons">
          {#snippet control()}
            <div class="slider-row">
              <Slider
                value={minWeapons}
                min={0}
                max={13}
                step={1}
                onValueChange={(v) => (minWeapons = v)}
              />
              <span class="slider-value">{minWeapons}</span>
            </div>
          {/snippet}
        </SettingsRow>
        <SettingsRow title="Min Summons" subtitle="Minimum number of summons">
          {#snippet control()}
            <div class="slider-row">
              <Slider
                value={minSummons}
                min={0}
                max={8}
                step={1}
                onValueChange={(v) => (minSummons = v)}
              />
              <span class="slider-value">{minSummons}</span>
            </div>
          {/snippet}
        </SettingsRow>
      </section>

      <section>
        <h3>Quality</h3>
        <SettingsRow title="Name Quality" subtitle="Only show named teams">
          {#snippet control()}
            <Switch bind:checked={nameQuality} size="small" />
          {/snippet}
        </SettingsRow>
        <SettingsRow title="User Quality" subtitle="Only show verified users">
          {#snippet control()}
            <Switch bind:checked={userQuality} size="small" />
          {/snippet}
        </SettingsRow>
        <SettingsRow title="Original Only" subtitle="Exclude remixes">
          {#snippet control()}
            <Switch bind:checked={originalOnly} size="small" />
          {/snippet}
        </SettingsRow>
      </section>
    </div>
  </ModalBody>
  <ModalFooter
    onCancel={() => (open = false)}
    primaryAction={{ label: 'Apply', onclick: save }}
  >
    {#snippet left()}
      <button type="button" class="reset-btn" onclick={reset}>Reset</button>
    {/snippet}
  </ModalFooter>
</Dialog>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/typography' as *;

  .sections {
    display: flex;
    flex-direction: column;
    gap: $unit-3x;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: $unit;
  }

  h3 {
    font-size: $font-small;
    font-weight: $bold;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 $unit-half 0;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: $unit;
    width: 100%;
  }

  .slider-value {
    font-size: $font-small;
    font-weight: $medium;
    color: var(--text-primary);
    min-width: 20px;
    text-align: right;
  }

  .reset-btn {
    all: unset;
    cursor: pointer;
    font-size: $font-small;
    color: var(--text-secondary);

    &:hover {
      color: var(--text-primary);
    }
  }
</style>
